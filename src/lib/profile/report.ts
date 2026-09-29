import type { Heatmap, MonthPoint } from "./time";
import type { Ranked } from "./counting";

export const ANALYZER_VERSION = "2.0.0";

export interface PostSummary {
  id: string;
  url: string;
  shortCode: string;
  type: "image" | "video" | "carousel";
  productType: "feed" | "reel" | "igtv";
  caption: string;
  likes: number;
  comments: number;
  views?: number;
  engagement: number;
  timestamp: string;
  displayUrl?: string;
  isSponsored?: boolean;
}

export interface ProfileFacts {
  username: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  category?: string;
  isVerified: boolean;
  isBusiness?: boolean;
  profilePicUrl?: string;
  followers: number;
  following: number;
  postsCount: number;
  provider: string;
  fetchedAt: string;
}

export type Grade = "A+" | "A" | "B" | "C" | "D";

// ---------------------------------------------------------------------------
// Free sections
// ---------------------------------------------------------------------------

export interface OverviewSection {
  profile: ProfileFacts;
  /** following / followers */
  followRatio?: number;
  followersPerPost?: number;
  postsAnalysed: number;
  analysedFrom?: string;
  analysedTo?: string;
}

export interface EngagementHeadline {
  /** Average (likes + comments) per post as % of followers. */
  engagementRate?: number;
  benchmarkRate: number;
  benchmarkTier: string;
  grade: Grade;
  avgLikes?: number;
  avgComments?: number;
  /** Composite 0..100 score. */
  score: number;
}

export interface CadenceHeadline {
  postsPerWeek?: number;
  daysSinceLastPost?: number;
  reelsSharePct: number;
}

export interface TeaserSection {
  topHashtags: string[];
  bestPost?: PostSummary;
  bestDayName?: string;
}

export interface FreeSections {
  overview: OverviewSection;
  engagement: EngagementHeadline;
  cadence: CadenceHeadline;
  teaser: TeaserSection;
}

// ---------------------------------------------------------------------------
// Pro sections
// ---------------------------------------------------------------------------

export interface EngagementSection {
  medianLikes?: number;
  medianComments?: number;
  maxLikes?: number;
  minLikes?: number;
  commentsPerHundredLikes?: number;
  likesPerFollowerPct?: number;
  likesHiddenPosts: number;
  byType: { type: string; count: number; avgEngagement?: number; avgLikes?: number; avgComments?: number; avgViews?: number; engagementRate?: number }[];
  engagementByPost: { shortCode: string; engagement: number; timestamp: string; type: string }[];
  /** Ratio of the most recent third of posts vs the oldest third. */
  recentVsOlderPct?: number;
  sponsoredPosts: number;
  sponsoredAvgEngagement?: number;
  organicAvgEngagement?: number;
  reelViewRatePct?: number;
}

export interface TimingSection {
  postingHeatmap: Heatmap;
  engagementHeatmap: Heatmap;
  bestWeekday?: number;
  bestHour?: number;
  mostUsedWeekday?: number;
  mostUsedHour?: number;
  byWeekday: { weekday: number; posts: number; avgEngagement?: number }[];
  byHourBucket: { label: string; posts: number; avgEngagement?: number }[];
}

export interface CadenceSection {
  postsPerWeek?: number;
  postsPerMonth?: number;
  avgGapDays?: number;
  longestGapDays?: number;
  consistencyScore?: number;
  byMonth: MonthPoint[];
  activeWeeksPct?: number;
  firstPostAt?: string;
  lastPostAt?: string;
}

export interface ContentSection {
  mix: Ranked[];
  topPosts: PostSummary[];
  bottomPosts: PostSummary[];
  carouselVsImageEngagementPct?: number;
  reelVsImageEngagementPct?: number;
}

export interface HashtagSection {
  avgPerPost?: number;
  postsWithHashtagsPct: number;
  withVsWithoutEngagementPct?: number;
  usage: Ranked[];
  performance: { name: string; uses: number; avgEngagement: number }[];
  /** Hashtag count bucket -> avg engagement. */
  byCountBucket: { label: string; posts: number; avgEngagement?: number }[];
}

export interface CaptionSection {
  avgLength?: number;
  withCaptionPct: number;
  byLengthBucket: { label: string; posts: number; avgEngagement?: number }[];
  emojiPct: number;
  questionPct: number;
  ctaPct: number;
  mentionsPct: number;
  topMentions: Ranked[];
  topWords: Ranked[];
  ctaVsNoCtaEngagementPct?: number;
}

export interface GrowthSection {
  history: { at: string; followers: number; following: number; postsCount: number }[];
  followersChange?: { days: number; delta: number; pct: number };
  note: string;
}

export interface Recommendation {
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
}

export interface ScoreSection {
  score: number;
  grade: Grade;
  components: { name: string; score: number; max: number; note: string }[];
  recommendations: Recommendation[];
}

export interface ProSections {
  engagement: EngagementSection;
  timing: TimingSection;
  cadence: CadenceSection;
  content: ContentSection;
  hashtags: HashtagSection;
  captions: CaptionSection;
  growth: GrowthSection;
  score: ScoreSection;
}

export interface ProfileReport {
  version: string;
  generatedAt: string;
  timeZone: string;
  free: FreeSections;
  pro: ProSections;
}

export interface GatedReport {
  id: string;
  createdAt: string;
  version: string;
  generatedAt: string;
  timeZone: string;
  tier: "free" | "pro";
  free: FreeSections;
  pro: ProSections | null;
}

export function gateReport(report: ProfileReport, meta: { id: string; createdAt: string; tier: "free" | "pro" }): GatedReport {
  return {
    id: meta.id,
    createdAt: meta.createdAt,
    version: report.version,
    generatedAt: report.generatedAt,
    timeZone: report.timeZone,
    tier: meta.tier,
    free: report.free,
    pro: meta.tier === "pro" ? report.pro : null,
  };
}
