import type { Dataset } from "../types";
import { ANALYZER_VERSION, type ActivitySnapshotSection, type AnalysisReport, type OverviewSection, type YearActivity } from "./report";
import { LocalClock, activeDays, argmax, heatmap, hourTotals, longestStreakDays, round, weekdayTotals } from "./time";
import { followerSets, followersFull, followersSnapshot } from "./followers";
import { engagement } from "./engagement";
import { content } from "./content";
import { messages, detectSelf } from "./messages";
import { interests, saved, searches, security, stories } from "./misc";
import { people, topPeopleTeaser } from "./people";

export interface AnalyzeOptions {
  /** IANA time zone used for hour/weekday statistics. Defaults to UTC. */
  timeZone?: string;
  /** Override "now" (unix seconds) for tests. Defaults to the export's latest timestamp. */
  now?: number;
}

export function analyze(ds: Dataset, options: AnalyzeOptions = {}): AnalysisReport {
  const clock = new LocalClock(options.timeZone);
  const sets = followerSets(ds);
  const now = options.now ?? ds.meta.latest ?? Math.floor(Date.now() / 1000);

  const proPeople = people(ds, sets);
  const proMessages = messages(ds, clock, now);
  const pro = {
    followers: followersFull(ds, sets, clock),
    engagement: engagement(ds, sets, clock),
    content: content(ds, clock),
    messages: proMessages,
    stories: stories(ds, clock),
    saved: saved(ds, clock),
    interests: interests(ds, sets, clock),
    searches: searches(ds, sets, clock),
    security: security(ds, clock),
    people: proPeople,
  };

  const free = {
    overview: overview(ds, sets, proMessages.totals, now),
    followersSnapshot: followersSnapshot(ds, sets),
    activitySnapshot: activitySnapshot(ds, clock),
    topPeopleTeaser: topPeopleTeaser(proPeople),
  };

  return {
    version: ANALYZER_VERSION,
    generatedAt: new Date().toISOString(),
    timeZone: clock.timeZone,
    free,
    pro,
  };
}

function overview(
  ds: Dataset,
  sets: ReturnType<typeof followerSets>,
  msgTotals: { sent: number; received: number; threads: number },
  now: number,
): OverviewSection {
  const count = (kind: string) => ds.content.filter((c) => c.kind === kind).length;
  return {
    username: ds.account.username,
    name: ds.account.name,
    accountCreatedAt: ds.account.createdAt,
    accountAgeDays: ds.account.createdAt ? Math.max(0, Math.round((now - ds.account.createdAt) / 86400)) : undefined,
    dataFrom: ds.meta.earliest,
    dataTo: ds.meta.latest,
    followers: sets.followers.size,
    following: sets.following.size,
    followRatio: sets.followers.size > 0 ? round(sets.following.size / sets.followers.size, 2) : undefined,
    totals: {
      likes: ds.likes.posts.length,
      comments: ds.comments.length,
      posts: count("post"),
      reels: count("reel") + count("igtv"),
      stories: count("story"),
      savedPosts: ds.saved.items.length,
      messagesSent: msgTotals.sent,
      messagesReceived: msgTotals.received,
      threads: msgTotals.threads,
      storyInteractions: ds.stories.length,
      adsViewed: ds.browsing.adsViewed.length,
      logins: ds.security.logins.length,
      searches: ds.searches.profiles.length + ds.searches.keywords.length + ds.searches.hashtags.length,
    },
    filesMatched: ds.meta.filesMatched.length,
    warnings: ds.meta.warnings.slice(0, 10),
  };
}

function activitySnapshot(ds: Dataset, clock: LocalClock): ActivitySnapshotSection {
  const self = detectSelf(ds.messages, ds.account.name);
  const years = new Map<number, YearActivity>();
  const bump = (at: number, key: keyof Omit<YearActivity, "year">) => {
    const y = clock.parts(at).year;
    let row = years.get(y);
    if (!row) {
      row = { year: y, likes: 0, comments: 0, posts: 0, messagesSent: 0, storiesPosted: 0 };
      years.set(y, row);
    }
    row[key]++;
  };
  const allTimes: number[] = [];
  for (const l of ds.likes.posts) {
    bump(l.at, "likes");
    allTimes.push(l.at);
  }
  for (const c of ds.comments) {
    bump(c.at, "comments");
    allTimes.push(c.at);
  }
  for (const c of ds.content) {
    if (c.kind === "story") bump(c.at, "storiesPosted");
    else if (c.kind === "post" || c.kind === "reel" || c.kind === "igtv") bump(c.at, "posts");
    allTimes.push(c.at);
  }
  for (const t of ds.messages) {
    for (const m of t.messages) {
      if (m.sender !== self || m.type === "reaction_notice") continue;
      const sec = Math.floor(m.atMs / 1000);
      bump(sec, "messagesSent");
      allTimes.push(sec);
    }
  }
  const grid = heatmap(allTimes, clock);
  return {
    byYear: [...years.values()].sort((a, b) => a.year - b.year),
    peakHour: allTimes.length ? argmax(hourTotals(grid)) : undefined,
    peakWeekday: allTimes.length ? argmax(weekdayTotals(grid)) : undefined,
    activeDays: activeDays(allTimes, clock),
    longestStreakDays: longestStreakDays(allTimes, clock),
  };
}

export { ANALYZER_VERSION } from "./report";
export type { AnalysisReport, GatedReport } from "./report";
