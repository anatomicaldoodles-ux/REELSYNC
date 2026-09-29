import { describe, expect, it } from "vitest";
import { parseExport } from "../parse";
import { analyze } from "../analyze";
import { gateReport } from "../analyze/report";
import { LocalClock, fillMonths, longestStreakDays } from "../analyze/time";
import { buildFixture, T0 } from "./fixture";

const DAY = 86400;

describe("LocalClock", () => {
  it("buckets in the requested time zone", () => {
    const utc = new LocalClock("UTC");
    const tokyo = new LocalClock("Asia/Tokyo");
    // 2023-11-14T22:13:20Z is Tuesday 22:13 UTC, Wednesday 07:13 in Tokyo.
    expect(utc.parts(T0)).toMatchObject({ hour: 22, weekday: 1, month: 11 });
    expect(tokyo.parts(T0)).toMatchObject({ hour: 7, weekday: 2, day: 15 });
  });
  it("falls back to UTC for an invalid zone", () => {
    expect(new LocalClock("Nowhere/Invalid").timeZone).toBe("UTC");
  });
  it("fills gaps between months", () => {
    const m = fillMonths(new Map([["2024-01", 2], ["2024-04", 1]]));
    expect(m.map((x) => x.month)).toEqual(["2024-01", "2024-02", "2024-03", "2024-04"]);
    expect(m.map((x) => x.count)).toEqual([2, 0, 0, 1]);
  });
  it("finds the longest daily streak", () => {
    const c = new LocalClock("UTC");
    expect(longestStreakDays([T0, T0 + DAY, T0 + 2 * DAY, T0 + 5 * DAY], c)).toBe(3);
    expect(longestStreakDays([], c)).toBe(0);
  });
});

describe("analyze", () => {
  const ds = parseExport(buildFixture());
  const report = analyze(ds, { timeZone: "UTC", now: T0 });

  it("builds the free overview", () => {
    const o = report.free.overview;
    expect(o.username).toBe("testuser");
    expect(o.followers).toBe(3);
    expect(o.following).toBe(4);
    expect(o.followRatio).toBe(1.33);
    expect(o.accountAgeDays).toBe(800);
    expect(o.totals.likes).toBe(43);
    expect(o.totals.posts).toBe(3);
    expect(o.totals.reels).toBe(1);
    expect(o.totals.messagesSent).toBe(4);
    expect(o.totals.messagesReceived).toBe(3);
  });

  it("computes follower relationships", () => {
    const s = report.free.followersSnapshot;
    expect(s.mutuals).toBe(2);
    expect(s.notFollowingBack).toBe(2);
    expect(s.fans).toBe(1);
    expect(s.followBackRate).toBe(50);
    expect(s.notFollowingBackSample.map((p) => p.username)).toEqual(["erin", "dave"]);
    const f = report.pro.followers;
    expect(f.fans.map((p) => p.username)).toEqual(["carol"]);
    expect(f.mutuals.map((p) => p.username).sort()).toEqual(["alice", "bob"]);
    expect(f.followersByMonth.reduce((a, b) => a + b.count, 0)).toBe(3);
    // carol follows me but I never interacted with her.
    expect(f.followersNeverInteracted.sample).toEqual(["carol"]);
    expect(f.followingNeverInteracted.sample).toEqual(["erin"]);
  });

  it("ranks people by interaction", () => {
    const p = report.pro.people;
    expect(p.ranked[0].username).toBe("dave");
    expect(p.ranked[0].likes).toBe(30);
    expect(p.ranked[0].comments).toBe(1);
    expect(p.ranked[0].saves).toBe(1);
    expect(p.ranked[0].followsYou).toBe(false);
    expect(p.unrequitedTop[0].username).toBe("dave");
    expect(p.secretFavourites.map((x) => x.username)).toEqual(["zed"]);
    expect(report.free.topPeopleTeaser.top).toHaveLength(3);
    expect(report.free.topPeopleTeaser.top[0].username).toBe("dave");
  });

  it("computes engagement statistics", () => {
    const e = report.pro.engagement;
    expect(e.topLiked[0]).toEqual({ name: "dave", count: 30 });
    expect(e.distinctAccountsLiked).toBe(3);
    expect(e.likesToFollowingPct + e.likesToNonFollowingPct).toBeCloseTo(100, 0);
    expect(e.comments.total).toBe(3);
    expect(e.comments.withEmojiPct).toBeCloseTo(33.3, 0);
    expect(e.comments.topEmojis[0].name).toBe("☕");
    expect(e.likesHeatmap.flat().reduce((a, b) => a + b, 0)).toBe(43);
  });

  it("computes content statistics", () => {
    const c = report.pro.content;
    expect(c.totals.post).toBe(3);
    expect(c.carouselPct).toBeCloseTo(33.3, 0);
    expect(c.captions.topHashtags[0]).toEqual({ name: "travel", count: 2 });
    expect(c.captions.topMentions[0]).toEqual({ name: "alice", count: 1 });
    expect(c.firstPostAt).toBe(T0 - 200 * DAY);
    expect(c.longestGapDays).toBe(100);
  });

  it("computes message statistics with reply times and waiting threads", () => {
    const m = report.pro.messages;
    expect(m.selfName).toBe("Test User");
    expect(m.totals.threads).toBe(3);
    expect(m.totals.groupThreads).toBe(1);
    expect(m.totals.sent).toBe(4);
    expect(m.totals.reelsReceived).toBe(1);
    expect(m.totals.reactionsReceived).toBe(1);
    expect(m.topReactionsReceived[0].name).toBe("❤️");
    const alice = m.topThreads.find((t) => t.title === "Alice Ångström")!;
    expect(alice.sent).toBe(2);
    expect(alice.received).toBe(2);
    expect(alice.yourMedianReplyMinutes).toBe(20);
    expect(alice.theirMedianReplyMinutes).toBe(10);
    expect(m.waitingOnThem.map((t) => t.title)).toEqual(["Dave"]);
    expect(m.avgWordsPerSentMessage).toBeGreaterThan(1);
  });

  it("computes interests, searches and security", () => {
    expect(report.pro.interests.advertisers.total).toBe(2);
    expect(report.pro.interests.adsViewed.topAdvertisers[0]).toEqual({ name: "brandco", count: 2 });
    expect(report.pro.interests.topics).toEqual(["Travel", "Cooking"]);
    expect(report.pro.searches.topProfiles[0]).toEqual({ name: "zed", count: 2 });
    expect(report.pro.searches.searchedButNotFollowing.map((s) => s.name)).toEqual(["zed"]);
    const sec = report.pro.security;
    expect(sec.logins.total).toBe(20);
    expect(sec.logins.uniqueIps).toBe(2);
    expect(sec.logins.platforms.map((p) => p.name).sort()).toEqual(["Windows", "iOS"]);
    expect(sec.signup?.ip).toBe("1.2.3.4");
    expect(sec.passwordChanges).toHaveLength(1);
  });

  it("produces an activity snapshot", () => {
    const a = report.free.activitySnapshot;
    expect(a.byYear.length).toBeGreaterThan(0);
    expect(a.byYear.at(-1)!.likes).toBeGreaterThan(0);
    expect(a.peakHour).toBeDefined();
    expect(a.activeDays).toBeGreaterThan(10);
  });

  it("gates pro sections for free reports", () => {
    const free = gateReport(report, { id: "r1", createdAt: "2026-01-01", tier: "free" });
    expect(free.pro).toBeNull();
    expect(free.free.overview.username).toBe("testuser");
    const pro = gateReport(report, { id: "r1", createdAt: "2026-01-01", tier: "pro" });
    expect(pro.pro?.followers.notFollowingBack).toHaveLength(2);
  });

  it("handles an empty export without throwing", () => {
    const empty = analyze(parseExport(new Map()), { timeZone: "UTC" });
    expect(empty.free.overview.followers).toBe(0);
    expect(empty.pro.messages.totals.threads).toBe(0);
    expect(empty.free.activitySnapshot.byYear).toEqual([]);
  });
});
