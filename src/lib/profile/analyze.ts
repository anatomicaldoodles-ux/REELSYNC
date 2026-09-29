import type { FollowerPoint, PublicPost, PublicProfile } from "./types";
import {
  ANALYZER_VERSION,
  type CadenceSection,
  type CaptionSection,
  type ContentSection,
  type EngagementSection,
  type Grade,
  type GrowthSection,
  type HashtagSection,
  type PostSummary,
  type ProfileReport,
  type Recommendation,
  type ScoreSection,
  type TimingSection,
} from "./report";
import { LocalClock, WEEKDAY_NAMES, argmax, byMonth, emptyHeatmap, hourTotals, mean, median, round, weekdayTotals } from "./time";
import { hasEmoji, percent, tally, top, topOf } from "./counting";

export interface AnalyzeOptions {
  timeZone?: string;
  /** Follower history for growth, oldest first. */
  history?: FollowerPoint[];
  now?: Date;
}

/** Industry-typical engagement rates by follower tier (likes+comments / followers). */
export function benchmarkFor(followers: number): { rate: number; tier: string } {
  if (followers < 1_000) return { rate: 8, tier: "under 1K followers" };
  if (followers < 10_000) return { rate: 4, tier: "1K to 10K followers" };
  if (followers < 100_000) return { rate: 2.4, tier: "10K to 100K followers" };
  if (followers < 1_000_000) return { rate: 1.7, tier: "100K to 1M followers" };
  return { rate: 1.2, tier: "over 1M followers" };
}

export function gradeFor(score: number): Grade {
  if (score >= 90) return "A+";
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

const eng = (p: PublicPost) => p.likes + p.comments;
const sec = (p: PublicPost) => Math.floor(new Date(p.timestamp).getTime() / 1000);
const CTA_RE = /\b(link in bio|comment|tag (a|someone|your)|save (this|it)|share (this|it)|follow (for|us|me)|double tap|let me know|swipe|click|shop now|sign up|dm me)\b/i;
const STOP = new Set("the a an and or but of to in on for with at by from is are was were be it its this that these those you your i me my we our they them so if as not no do does did have has had can will just very too also than then there here what which who when how all any some more most much lol ok yes oh up out new one day get got like".split(" "));

function summary(p: PublicPost): PostSummary {
  return {
    id: p.id,
    url: p.url,
    shortCode: p.shortCode,
    type: p.type,
    productType: p.productType,
    caption: p.caption.slice(0, 160),
    likes: p.likes,
    comments: p.comments,
    views: p.views,
    engagement: eng(p),
    timestamp: p.timestamp,
    displayUrl: p.displayUrl,
    isSponsored: p.isSponsored,
  };
}

function bucketStat<T extends string>(groups: Map<T, PublicPost[]>): { label: T; posts: number; avgEngagement?: number }[] {
  return [...groups.entries()].map(([label, ps]) => ({ label, posts: ps.length, avgEngagement: round(mean(ps.map(eng)), 0) }));
}

function relPct(a?: number, b?: number): number | undefined {
  if (a === undefined || b === undefined || b <= 0) return undefined;
  return round(((a - b) / b) * 100, 0);
}

export function analyzeProfile(profile: PublicProfile, options: AnalyzeOptions = {}): ProfileReport {
  const clock = new LocalClock(options.timeZone);
  const now = options.now ?? new Date();
  const posts = [...profile.posts].sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // newest first
  const scored = posts.filter((p) => !p.likesHidden);
  const followers = profile.followers;
  const bench = benchmarkFor(followers);

  // --- Engagement --------------------------------------------------------------
  const avgEng = mean(scored.map(eng));
  const engagementRate = avgEng !== undefined && followers > 0 ? round((avgEng / followers) * 100, 2) : undefined;
  const avgLikes = round(mean(scored.map((p) => p.likes)), 0);
  const avgComments = round(mean(scored.map((p) => p.comments)), 1);
  const types = new Map<string, PublicPost[]>();
  for (const p of scored) {
    const key = p.productType === "reel" ? "reel" : p.type;
    types.set(key, [...(types.get(key) ?? []), p]);
  }
  const byType = [...types.entries()].map(([type, ps]) => {
    const e = mean(ps.map(eng));
    return {
      type,
      count: ps.length,
      avgEngagement: round(e, 0),
      avgLikes: round(mean(ps.map((p) => p.likes)), 0),
      avgComments: round(mean(ps.map((p) => p.comments)), 1),
      avgViews: round(mean(ps.map((p) => p.views).filter((v): v is number => v !== undefined)), 0),
      engagementRate: e !== undefined && followers > 0 ? round((e / followers) * 100, 2) : undefined,
    };
  }).sort((a, b) => b.count - a.count);
  const third = Math.max(1, Math.floor(scored.length / 3));
  const recentAvg = mean(scored.slice(0, third).map(eng));
  const olderAvg = mean(scored.slice(-third).map(eng));
  const sponsored = scored.filter((p) => p.isSponsored);
  const organic = scored.filter((p) => !p.isSponsored);
  const reels = scored.filter((p) => p.productType === "reel" && p.views);
  const reelViewRate = reels.length && followers > 0 ? round((mean(reels.map((p) => p.views as number))! / followers) * 100, 0) : undefined;

  const engagement: EngagementSection = {
    medianLikes: round(median(scored.map((p) => p.likes)), 0),
    medianComments: round(median(scored.map((p) => p.comments)), 0),
    maxLikes: scored.length ? Math.max(...scored.map((p) => p.likes)) : undefined,
    minLikes: scored.length ? Math.min(...scored.map((p) => p.likes)) : undefined,
    commentsPerHundredLikes: avgLikes ? round(((avgComments ?? 0) / avgLikes) * 100, 1) : undefined,
    likesPerFollowerPct: avgLikes !== undefined && followers > 0 ? round((avgLikes / followers) * 100, 2) : undefined,
    likesHiddenPosts: posts.length - scored.length,
    byType,
    engagementByPost: [...scored].reverse().map((p) => ({ shortCode: p.shortCode, engagement: eng(p), timestamp: p.timestamp, type: p.productType === "reel" ? "reel" : p.type })),
    recentVsOlderPct: scored.length >= 6 ? relPct(recentAvg, olderAvg) : undefined,
    sponsoredPosts: sponsored.length,
    sponsoredAvgEngagement: round(mean(sponsored.map(eng)), 0),
    organicAvgEngagement: round(mean(organic.map(eng)), 0),
    reelViewRatePct: reelViewRate,
  };

  // --- Timing --------------------------------------------------------------------
  const postingHeatmap = emptyHeatmap();
  const engagementHeatmap = emptyHeatmap();
  const weekdayGroups = new Map<number, PublicPost[]>();
  const hourGroups = new Map<string, PublicPost[]>();
  const hourBucket = (h: number) => (h < 6 ? "Night (12am–6am)" : h < 12 ? "Morning (6am–12pm)" : h < 17 ? "Afternoon (12pm–5pm)" : h < 21 ? "Evening (5pm–9pm)" : "Late (9pm–12am)");
  for (const p of scored) {
    const parts = clock.parts(sec(p));
    postingHeatmap[parts.weekday][parts.hour]++;
    engagementHeatmap[parts.weekday][parts.hour] += eng(p);
    weekdayGroups.set(parts.weekday, [...(weekdayGroups.get(parts.weekday) ?? []), p]);
    const b = hourBucket(parts.hour);
    hourGroups.set(b, [...(hourGroups.get(b) ?? []), p]);
  }
  // Average engagement per cell (for the best-slot pick); require at least 2 posts.
  const avgCell = engagementHeatmap.map((row, d) => row.map((v, h) => (postingHeatmap[d][h] >= 2 ? v / postingHeatmap[d][h] : 0)));
  let best: { d: number; h: number; v: number } | undefined;
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) if (!best || avgCell[d][h] > best.v) best = { d, h, v: avgCell[d][h] };
  const byWeekday = Array.from({ length: 7 }, (_, weekday) => {
    const ps = weekdayGroups.get(weekday) ?? [];
    return { weekday, posts: ps.length, avgEngagement: round(mean(ps.map(eng)), 0) };
  });
  const bestWeekdayByAvg = byWeekday.filter((w) => w.posts >= 2).sort((a, b) => (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0))[0];
  const ORDER = ["Morning (6am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Late (9pm–12am)", "Night (12am–6am)"];
  const timing: TimingSection = {
    postingHeatmap,
    engagementHeatmap,
    bestWeekday: bestWeekdayByAvg?.weekday ?? (scored.length ? argmax(weekdayTotals(postingHeatmap)) : undefined),
    bestHour: best && best.v > 0 ? best.h : scored.length ? argmax(hourTotals(postingHeatmap)) : undefined,
    mostUsedWeekday: scored.length ? argmax(weekdayTotals(postingHeatmap)) : undefined,
    mostUsedHour: scored.length ? argmax(hourTotals(postingHeatmap)) : undefined,
    byWeekday,
    byHourBucket: ORDER.filter((l) => hourGroups.has(l)).map((label) => {
      const ps = hourGroups.get(label) ?? [];
      return { label, posts: ps.length, avgEngagement: round(mean(ps.map(eng)), 0) };
    }),
  };

  // --- Cadence -------------------------------------------------------------------
  const times = posts.map(sec).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 86400);
  const spanDays = times.length >= 2 ? (times[times.length - 1] - times[0]) / 86400 : undefined;
  const postsPerWeek = spanDays && spanDays > 0 ? round((posts.length / spanDays) * 7, 1) : undefined;
  const daysSinceLast = times.length ? Math.max(0, Math.round((now.getTime() / 1000 - times[times.length - 1]) / 86400)) : undefined;
  const gapMean = mean(gaps);
  const gapStd = gapMean !== undefined && gaps.length > 1 ? Math.sqrt(mean(gaps.map((g) => (g - gapMean) ** 2)) ?? 0) : undefined;
  const consistency = gapMean !== undefined && gapStd !== undefined && gapMean > 0 ? Math.max(0, Math.min(100, Math.round(100 - (gapStd / gapMean) * 50))) : undefined;
  let activeWeeksPct: number | undefined;
  if (spanDays && spanDays >= 14) {
    const weeks = new Set(times.map((t) => Math.floor(t / (7 * 86400))));
    activeWeeksPct = percent(weeks.size, Math.ceil(spanDays / 7) + 1, 0);
  }
  const cadence: CadenceSection = {
    postsPerWeek,
    postsPerMonth: postsPerWeek !== undefined ? round(postsPerWeek * 4.35, 1) : undefined,
    avgGapDays: round(gapMean, 1),
    longestGapDays: gaps.length ? Math.round(Math.max(...gaps)) : undefined,
    consistencyScore: consistency,
    byMonth: byMonth(times, clock),
    activeWeeksPct,
    firstPostAt: posts.at(-1)?.timestamp,
    lastPostAt: posts[0]?.timestamp,
  };

  // --- Content -----------------------------------------------------------------
  const ranked = [...scored].sort((a, b) => eng(b) - eng(a));
  const typeAvg = (key: string) => byType.find((t) => t.type === key)?.avgEngagement;
  const content: ContentSection = {
    mix: topOf(posts.map((p) => (p.productType === "reel" ? "reel" : p.type)), 5),
    topPosts: ranked.slice(0, 6).map(summary),
    bottomPosts: ranked.slice(-3).reverse().map(summary),
    carouselVsImageEngagementPct: relPct(typeAvg("carousel"), typeAvg("image")),
    reelVsImageEngagementPct: relPct(typeAvg("reel"), typeAvg("image")),
  };

  // --- Hashtags ------------------------------------------------------------------
  const tagUses = new Map<string, PublicPost[]>();
  for (const p of scored) for (const h of new Set(p.hashtags)) tagUses.set(h, [...(tagUses.get(h) ?? []), p]);
  const withTags = scored.filter((p) => p.hashtags.length > 0);
  const withoutTags = scored.filter((p) => p.hashtags.length === 0);
  const countBuckets = new Map<string, PublicPost[]>();
  const countLabel = (n: number) => (n === 0 ? "0" : n <= 3 ? "1–3" : n <= 7 ? "4–7" : n <= 15 ? "8–15" : "16+");
  for (const p of scored) countBuckets.set(countLabel(p.hashtags.length), [...(countBuckets.get(countLabel(p.hashtags.length)) ?? []), p]);
  const hashtags: HashtagSection = {
    avgPerPost: round(mean(posts.map((p) => p.hashtags.length)), 1),
    postsWithHashtagsPct: percent(posts.filter((p) => p.hashtags.length > 0).length, posts.length, 0),
    withVsWithoutEngagementPct: relPct(mean(withTags.map(eng)), mean(withoutTags.map(eng))),
    usage: top(tally(posts.flatMap((p) => [...new Set(p.hashtags)])), 30),
    performance: [...tagUses.entries()]
      .filter(([, ps]) => ps.length >= 2)
      .map(([name, ps]) => ({ name, uses: ps.length, avgEngagement: Math.round(mean(ps.map(eng)) ?? 0) }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 20),
    byCountBucket: ["0", "1–3", "4–7", "8–15", "16+"].filter((l) => countBuckets.has(l)).map((label) => {
      const ps = countBuckets.get(label) ?? [];
      return { label, posts: ps.length, avgEngagement: round(mean(ps.map(eng)), 0) };
    }),
  };

  // --- Captions --------------------------------------------------------------------
  const lenBuckets = new Map<string, PublicPost[]>();
  const lenLabel = (n: number) => (n === 0 ? "No caption" : n < 50 ? "Short (<50)" : n < 150 ? "Medium (50–150)" : n < 400 ? "Long (150–400)" : "Very long (400+)");
  for (const p of scored) lenBuckets.set(lenLabel(p.caption.length), [...(lenBuckets.get(lenLabel(p.caption.length)) ?? []), p]);
  const withCta = scored.filter((p) => CTA_RE.test(p.caption));
  const noCta = scored.filter((p) => !CTA_RE.test(p.caption));
  const words: string[] = [];
  for (const p of posts) {
    for (const w of p.caption.replace(/#[\p{L}\p{N}_]+/gu, "").toLowerCase().split(/[^\p{L}\p{N}']+/u)) {
      if (w.length >= 3 && !STOP.has(w)) words.push(w);
    }
  }
  const captions: CaptionSection = {
    avgLength: round(mean(posts.map((p) => p.caption.length)), 0),
    withCaptionPct: percent(posts.filter((p) => p.caption.length > 0).length, posts.length, 0),
    byLengthBucket: ["No caption", "Short (<50)", "Medium (50–150)", "Long (150–400)", "Very long (400+)"].filter((l) => lenBuckets.has(l)).map((label) => bucketStat(new Map([[label, lenBuckets.get(label) ?? []]]))[0]),
    emojiPct: percent(posts.filter((p) => hasEmoji(p.caption)).length, posts.length, 0),
    questionPct: percent(posts.filter((p) => p.caption.includes("?")).length, posts.length, 0),
    ctaPct: percent(posts.filter((p) => CTA_RE.test(p.caption)).length, posts.length, 0),
    mentionsPct: percent(posts.filter((p) => p.mentions.length > 0).length, posts.length, 0),
    topMentions: topOf(posts.flatMap((p) => p.mentions), 10),
    topWords: topOf(words, 25),
    ctaVsNoCtaEngagementPct: relPct(mean(withCta.map(eng)), mean(noCta.map(eng))),
  };

  // --- Growth ----------------------------------------------------------------------
  const history = (options.history ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
  let followersChange: GrowthSection["followersChange"];
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const days = Math.max(1, Math.round((new Date(last.at).getTime() - new Date(first.at).getTime()) / 86400000));
    followersChange = { days, delta: last.followers - first.followers, pct: percent(last.followers - first.followers, first.followers, 2) };
  }
  const growth: GrowthSection = {
    history,
    followersChange,
    note:
      history.length >= 2
        ? `Based on ${history.length} snapshots taken when this profile was analysed.`
        : "Growth appears after this profile has been analysed more than once. Come back in a few days for a follower trend.",
  };

  // --- Score & recommendations --------------------------------------------------------
  const components: ScoreSection["components"] = [];
  const recs: Recommendation[] = [];
  const engScore = engagementRate === undefined ? 0 : Math.min(40, Math.round((engagementRate / bench.rate) * 25));
  components.push({ name: "Engagement vs benchmark", score: engScore, max: 40, note: engagementRate !== undefined ? `${engagementRate}% vs ${bench.rate}% typical for ${bench.tier}` : "No like counts available" });
  const cadScore = postsPerWeek === undefined ? 0 : Math.min(20, Math.round(Math.min(postsPerWeek, 5) * 4));
  components.push({ name: "Posting frequency", score: cadScore, max: 20, note: postsPerWeek !== undefined ? `${postsPerWeek} posts per week` : "Not enough posts" });
  const conScore = consistency === undefined ? 0 : Math.round((consistency / 100) * 15);
  components.push({ name: "Consistency", score: conScore, max: 15, note: consistency !== undefined ? `${consistency}/100 regularity of gaps` : "Not enough posts" });
  const recScore = daysSinceLast === undefined ? 0 : daysSinceLast <= 3 ? 15 : daysSinceLast <= 7 ? 12 : daysSinceLast <= 14 ? 8 : daysSinceLast <= 30 ? 4 : 0;
  components.push({ name: "Recency", score: recScore, max: 15, note: daysSinceLast !== undefined ? `${daysSinceLast} days since the last post` : "No posts" });
  const reelShare = percent(posts.filter((p) => p.productType === "reel").length, posts.length, 0);
  const mixScore = reelShare >= 30 && reelShare <= 80 ? 10 : reelShare > 0 ? 6 : 2;
  components.push({ name: "Content mix", score: mixScore, max: 10, note: `${reelShare}% reels` });
  const score = components.reduce((a, c) => a + c.score, 0);

  if (engagementRate !== undefined && engagementRate < bench.rate * 0.7) {
    recs.push({ title: "Engagement is below the benchmark", detail: `At ${engagementRate}% you are under the ${bench.rate}% typical for accounts with ${bench.tier}. Ask questions in captions, reply to comments early, and lean into the formats below that already outperform.`, impact: "high" });
  }
  if (content.reelVsImageEngagementPct !== undefined && content.reelVsImageEngagementPct > 20 && reelShare < 50) {
    recs.push({ title: "Post more reels", detail: `Reels earn ${content.reelVsImageEngagementPct}% more engagement than single images on this account, but they are only ${reelShare}% of posts.`, impact: "high" });
  }
  if (content.carouselVsImageEngagementPct !== undefined && content.carouselVsImageEngagementPct > 15) {
    recs.push({ title: "Carousels are working", detail: `Carousels beat single images by ${content.carouselVsImageEngagementPct}%. Turn tips, steps and before/after into multi-slide posts.`, impact: "medium" });
  }
  if (timing.bestWeekday !== undefined && timing.bestHour !== undefined) {
    const h = timing.bestHour;
    const hourLabel = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    recs.push({ title: `Best slot: ${WEEKDAY_NAMES[timing.bestWeekday]} around ${hourLabel}`, detail: `Posts published in this slot average the most engagement. Schedule your strongest content there (${clock.timeZone} time).`, impact: "medium" });
  }
  if (postsPerWeek !== undefined && postsPerWeek < 2) {
    recs.push({ title: "Post more often", detail: `${postsPerWeek} posts per week is below the 3 to 5 that keeps most accounts in the algorithm's rotation.`, impact: "high" });
  }
  if (consistency !== undefined && consistency < 50) {
    recs.push({ title: "Make the schedule regular", detail: `Gaps between posts vary a lot (longest ${cadence.longestGapDays} days). A fixed rhythm, even a slower one, tends to outperform bursts.`, impact: "medium" });
  }
  if (daysSinceLast !== undefined && daysSinceLast > 14) {
    recs.push({ title: "The account has gone quiet", detail: `${daysSinceLast} days since the last post. Reach drops quickly after two weeks of silence.`, impact: "high" });
  }
  if (hashtags.withVsWithoutEngagementPct !== undefined && hashtags.withVsWithoutEngagementPct > 10 && hashtags.postsWithHashtagsPct < 70) {
    recs.push({ title: "Use hashtags more consistently", detail: `Posts with hashtags do ${hashtags.withVsWithoutEngagementPct}% better here, yet only ${hashtags.postsWithHashtagsPct}% of posts use them.`, impact: "low" });
  }
  const bestBucket = hashtags.byCountBucket.filter((b) => b.posts >= 3).sort((a, b) => (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0))[0];
  if (bestBucket && bestBucket.label !== "0") {
    recs.push({ title: `Sweet spot: ${bestBucket.label} hashtags`, detail: `Posts with ${bestBucket.label} hashtags average ${bestBucket.avgEngagement} engagement, the best of any bucket on this account.`, impact: "low" });
  }
  if (captions.ctaVsNoCtaEngagementPct !== undefined && captions.ctaVsNoCtaEngagementPct > 10 && captions.ctaPct < 50) {
    recs.push({ title: "Add a call to action", detail: `Captions that ask for a comment, save or share earn ${captions.ctaVsNoCtaEngagementPct}% more engagement, but only ${captions.ctaPct}% of captions have one.`, impact: "medium" });
  }
  const bestLen = captions.byLengthBucket.filter((b) => b.posts >= 3).sort((a, b) => (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0))[0];
  if (bestLen) recs.push({ title: `Captions that work: ${bestLen.label.toLowerCase()}`, detail: `This length averages ${bestLen.avgEngagement} engagement, the best on the account.`, impact: "low" });
  if (recs.length === 0) recs.push({ title: "Keep doing what you're doing", detail: "Engagement, cadence and mix are all healthy. Watch the growth chart on your next visit.", impact: "low" });

  const scoreSection: ScoreSection = { score, grade: gradeFor(score), components, recommendations: recs.slice(0, 8) };

  // --- Free sections ------------------------------------------------------------------
  const free: ProfileReport["free"] = {
    overview: {
      profile: {
        username: profile.username,
        fullName: profile.fullName,
        biography: profile.biography,
        externalUrl: profile.externalUrl,
        category: profile.category,
        isVerified: profile.isVerified,
        isBusiness: profile.isBusiness,
        profilePicUrl: profile.profilePicUrl,
        followers,
        following: profile.following,
        postsCount: profile.postsCount,
        provider: profile.provider,
        fetchedAt: profile.fetchedAt,
      },
      followRatio: followers > 0 ? round(profile.following / followers, 2) : undefined,
      followersPerPost: profile.postsCount > 0 ? Math.round(followers / profile.postsCount) : undefined,
      postsAnalysed: posts.length,
      analysedFrom: posts.at(-1)?.timestamp,
      analysedTo: posts[0]?.timestamp,
    },
    engagement: { engagementRate, benchmarkRate: bench.rate, benchmarkTier: bench.tier, grade: gradeFor(score), avgLikes, avgComments, score },
    cadence: { postsPerWeek, daysSinceLastPost: daysSinceLast, reelsSharePct: reelShare },
    teaser: {
      topHashtags: hashtags.usage.slice(0, 3).map((h) => h.name),
      bestPost: content.topPosts[0],
      bestDayName: timing.bestWeekday !== undefined ? WEEKDAY_NAMES[timing.bestWeekday] : undefined,
    },
  };

  return {
    version: ANALYZER_VERSION,
    generatedAt: now.toISOString(),
    timeZone: clock.timeZone,
    free,
    pro: { engagement, timing, cadence, content, hashtags, captions, growth, score: scoreSection },
  };
}
