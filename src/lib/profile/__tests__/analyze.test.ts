import { describe, expect, it } from "vitest";
import { DemoProvider } from "../providers/demo";
import { analyzeProfile, benchmarkFor, gradeFor } from "../analyze";
import { gateReport } from "../report";
import type { PublicPost, PublicProfile } from "../types";
import { normaliseUsername } from "../types";

const post = (i: number, over: Partial<PublicPost> = {}): PublicPost => ({
  id: String(i),
  shortCode: `c${i}`,
  url: `https://www.instagram.com/p/c${i}/`,
  type: "image",
  productType: "feed",
  caption: `Post ${i} #alpha`,
  hashtags: ["alpha"],
  mentions: [],
  likes: 100,
  comments: 10,
  timestamp: new Date(Date.UTC(2026, 8, 28 - i * 2, 18, 0, 0)).toISOString(),
  ...over,
});

const profile: PublicProfile = {
  username: "tester",
  followers: 5000,
  following: 500,
  postsCount: 300,
  isPrivate: false,
  isVerified: false,
  fetchedAt: "2026-09-29T00:00:00Z",
  provider: "test",
  posts: [
    post(0, { type: "video", productType: "reel", likes: 400, comments: 40, views: 9000, caption: "Reel time! Comment below #alpha #beta", hashtags: ["alpha", "beta"] }),
    post(1, { type: "carousel", likes: 200, comments: 20, caption: "Save this for later #alpha #beta #gamma", hashtags: ["alpha", "beta", "gamma"] }),
    post(2),
    post(3, { likes: 80, comments: 5, caption: "", hashtags: [] }),
    post(4, { type: "video", productType: "reel", likes: 300, comments: 30, views: 7000 }),
    post(5, { likes: 120, comments: 12, isSponsored: true }),
    post(6, { likes: 90, comments: 9 }),
    post(7, { type: "carousel", likes: 180, comments: 15 }),
    post(8, { likesHidden: true, likes: 0, comments: 3 }),
  ],
};

describe("helpers", () => {
  it("normalises usernames from handles and URLs", () => {
    expect(normaliseUsername(" @Some.User ")).toBe("some.user");
    expect(normaliseUsername("https://www.instagram.com/Nike/?hl=en")).toBe("nike");
    expect(normaliseUsername("bad name!")).toBeUndefined();
    expect(normaliseUsername("")).toBeUndefined();
  });
  it("picks benchmarks by follower tier and grades", () => {
    expect(benchmarkFor(500).rate).toBe(8);
    expect(benchmarkFor(50_000).rate).toBe(2.4);
    expect(benchmarkFor(5_000_000).rate).toBe(1.2);
    expect(gradeFor(92)).toBe("A+");
    expect(gradeFor(20)).toBe("D");
  });
});

describe("analyzeProfile", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const report = analyzeProfile(profile, { timeZone: "UTC", now, history: [
    { at: "2026-09-01T00:00:00Z", followers: 4800, following: 490, postsCount: 290 },
    { at: "2026-09-29T00:00:00Z", followers: 5000, following: 500, postsCount: 300 },
  ] });

  it("computes the engagement headline against the benchmark", () => {
    const e = report.free.engagement;
    // 8 scored posts (one has hidden likes): (440+220+110+85+330+132+99+195)/8 = 201.375 -> 4.03%
    expect(e.engagementRate).toBeCloseTo(4.03, 1);
    expect(e.benchmarkRate).toBe(4);
    expect(e.avgLikes).toBe(184);
    expect(report.pro.engagement.likesHiddenPosts).toBe(1);
    expect(report.pro.engagement.sponsoredPosts).toBe(1);
  });

  it("breaks engagement down by type and finds reels outperform images", () => {
    const reel = report.pro.engagement.byType.find((t) => t.type === "reel")!;
    expect(reel.count).toBe(2);
    expect(reel.avgViews).toBe(8000);
    expect(report.pro.content.reelVsImageEngagementPct).toBeGreaterThan(100);
    expect(report.pro.content.topPosts[0].shortCode).toBe("c0");
    expect(report.pro.content.mix.find((m) => m.name === "reel")?.count).toBe(2);
  });

  it("computes cadence and timing", () => {
    const c = report.pro.cadence;
    expect(c.avgGapDays).toBe(2);
    expect(c.postsPerWeek).toBeCloseTo(3.9, 0);
    expect(c.consistencyScore).toBe(100);
    expect(report.free.cadence.daysSinceLastPost).toBe(1);
    expect(report.pro.timing.mostUsedHour).toBe(18);
    expect(report.pro.timing.postingHeatmap.flat().reduce((a, b) => a + b, 0)).toBe(8);
  });

  it("analyses hashtags and captions", () => {
    const h = report.pro.hashtags;
    expect(h.usage[0]).toEqual({ name: "alpha", count: 8 });
    expect(h.performance[0].name).toBe("beta");
    expect(h.postsWithHashtagsPct).toBe(89);
    const cap = report.pro.captions;
    expect(cap.ctaPct).toBeGreaterThan(0);
    expect(cap.withCaptionPct).toBe(89);
    expect(report.free.teaser.topHashtags).toEqual(["alpha", "beta", "gamma"]);
  });

  it("reports growth from history and produces a score with recommendations", () => {
    expect(report.pro.growth.followersChange).toMatchObject({ delta: 200, days: 28 });
    expect(report.pro.score.score).toBeGreaterThan(50);
    expect(report.pro.score.components.reduce((a, c) => a + c.max, 0)).toBe(100);
    expect(report.pro.score.recommendations.length).toBeGreaterThan(0);
    expect(report.pro.score.recommendations.some((r) => r.title === "Post more reels")).toBe(true);
  });

  it("gates pro sections", () => {
    const g = gateReport(report, { id: "x", createdAt: "2026-09-29", tier: "free" });
    expect(g.pro).toBeNull();
    expect(g.free.overview.profile.username).toBe("tester");
  });

  it("handles a profile with no posts", () => {
    const r = analyzeProfile({ ...profile, posts: [] }, { timeZone: "UTC", now });
    expect(r.free.engagement.engagementRate).toBeUndefined();
    expect(r.pro.score.score).toBeGreaterThanOrEqual(0);
    expect(r.pro.content.topPosts).toEqual([]);
  });
});

describe("DemoProvider", () => {
  it("is deterministic per username and analysable", async () => {
    const p = new DemoProvider();
    const a = await p.fetchProfile("someone");
    const b = await p.fetchProfile("someone");
    expect(a.followers).toBe(b.followers);
    expect(a.posts.length).toBe(50);
    const r = analyzeProfile(a, { timeZone: "Asia/Kolkata" });
    expect(r.free.engagement.engagementRate).toBeGreaterThan(0);
  });
});
