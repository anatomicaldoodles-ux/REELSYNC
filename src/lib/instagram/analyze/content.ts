import type { Dataset } from "../types";
import type { ContentSection } from "./report";
import { hasEmoji, hashtags, mentions, percent, topOf } from "./counting";
import { argmax, fillMonths, heatmap, hourTotals, mean, round, weekdayTotals, type LocalClock } from "./time";

export function content(ds: Dataset, clock: LocalClock): ContentSection {
  const items = ds.content;
  const feed = items.filter((c) => c.kind === "post" || c.kind === "reel" || c.kind === "igtv");
  const posts = items.filter((c) => c.kind === "post");
  const reels = items.filter((c) => c.kind === "reel" || c.kind === "igtv");
  const stories = items.filter((c) => c.kind === "story");

  const monthsAll = new Map<string, number>();
  const per = (list: typeof items) => {
    const m = new Map<string, number>();
    for (const c of list) {
      const k = clock.monthKey(c.at);
      m.set(k, (m.get(k) ?? 0) + 1);
      monthsAll.set(k, 0);
    }
    return m;
  };
  const pm = per(posts);
  const rm = per(reels);
  const sm = per(stories);
  const postsByMonth = fillMonths(monthsAll).map(({ month }) => ({
    month,
    posts: pm.get(month) ?? 0,
    reels: rm.get(month) ?? 0,
    stories: sm.get(month) ?? 0,
  }));

  const grid = heatmap(feed.map((c) => c.at), clock);
  const hours = hourTotals(grid);
  const weekdays = weekdayTotals(grid);

  const captions = feed.map((c) => c.caption ?? "").filter(Boolean);
  const allTags = captions.flatMap(hashtags);
  const allMentions = captions.flatMap(mentions);

  const totals: Record<string, number> = {};
  for (const c of items) totals[c.kind] = (totals[c.kind] ?? 0) + 1;

  const sorted = [...feed].sort((a, b) => a.at - b.at);
  let longestGap = 0;
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].at - sorted[i - 1].at) / 86400;
    gaps.push(gap);
    if (gap > longestGap) longestGap = gap;
  }
  const years = new Map<number, number>();
  for (const c of feed) {
    const y = clock.parts(c.at).year;
    years.set(y, (years.get(y) ?? 0) + 1);
  }

  return {
    postsByMonth,
    postingHeatmap: grid,
    bestHour: feed.length ? argmax(hours) : undefined,
    bestWeekday: feed.length ? argmax(weekdays) : undefined,
    totals,
    carouselPct: percent(posts.filter((p) => p.mediaCount > 1).length, posts.length),
    avgMediaPerPost: round(mean(posts.map((p) => p.mediaCount))),
    captions: {
      withCaptionPct: percent(captions.length, feed.length),
      avgLength: round(mean(captions.map((c) => c.length)), 0),
      avgHashtags: feed.length ? round(allTags.length / feed.length) : undefined,
      topHashtags: topOf(allTags, 30),
      topMentions: topOf(allMentions, 20),
      withEmojiPct: percent(captions.filter(hasEmoji).length, captions.length),
    },
    firstPostAt: sorted[0]?.at,
    lastPostAt: sorted.at(-1)?.at,
    longestGapDays: sorted.length > 1 ? Math.round(longestGap) : undefined,
    avgDaysBetweenPosts: round(mean(gaps)),
    postsPerYear: [...years.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
  };
}
