import type { Heatmap, MonthPoint } from "./time";
import type { Ranked } from "./counting";

export const ANALYZER_VERSION = "1.0.0";

export interface DatedName {
  username: string;
  at?: number;
}

export interface YearActivity {
  year: number;
  likes: number;
  comments: number;
  posts: number;
  messagesSent: number;
  storiesPosted: number;
}

// ---------------------------------------------------------------------------
// Free sections
// ---------------------------------------------------------------------------

export interface OverviewSection {
  username?: string;
  name?: string;
  accountCreatedAt?: number;
  accountAgeDays?: number;
  dataFrom?: number;
  dataTo?: number;
  followers: number;
  following: number;
  /** following / followers, rounded. */
  followRatio?: number;
  totals: {
    likes: number;
    comments: number;
    posts: number;
    reels: number;
    stories: number;
    savedPosts: number;
    messagesSent: number;
    messagesReceived: number;
    threads: number;
    storyInteractions: number;
    adsViewed: number;
    logins: number;
    searches: number;
  };
  filesMatched: number;
  warnings: string[];
}

export interface FollowersSnapshotSection {
  mutuals: number;
  notFollowingBack: number;
  fans: number;
  closeFriends: number;
  pendingSent: number;
  recentlyUnfollowed: number;
  blocked: number;
  /** A small teaser of accounts you follow that do not follow you back. */
  notFollowingBackSample: DatedName[];
  followBackRate?: number;
}

export interface ActivitySnapshotSection {
  byYear: YearActivity[];
  peakHour?: number;
  peakWeekday?: number;
  activeDays: number;
  longestStreakDays: number;
}

export interface TopPeopleTeaserSection {
  /** Top 3 accounts by combined interaction score. */
  top: { username: string; score: number; likes: number; comments: number }[];
  totalAccountsInteractedWith: number;
}

export interface FreeSections {
  overview: OverviewSection;
  followersSnapshot: FollowersSnapshotSection;
  activitySnapshot: ActivitySnapshotSection;
  topPeopleTeaser: TopPeopleTeaserSection;
}

// ---------------------------------------------------------------------------
// Pro sections
// ---------------------------------------------------------------------------

export interface FollowersSection {
  notFollowingBack: DatedName[];
  fans: DatedName[];
  mutuals: DatedName[];
  recentlyUnfollowed: DatedName[];
  pendingSent: DatedName[];
  receivedRequests: DatedName[];
  blocked: DatedName[];
  restricted: DatedName[];
  closeFriends: DatedName[];
  hideStoryFrom: DatedName[];
  followersByMonth: MonthPoint[];
  followingByMonth: MonthPoint[];
  oldestFollowers: DatedName[];
  newestFollowers: DatedName[];
  /** Followers you have never liked, commented on, saved or searched for. */
  followersNeverInteracted: { count: number; sample: string[] };
  /** Accounts you follow but have never interacted with. */
  followingNeverInteracted: { count: number; sample: string[] };
}

export interface EngagementSection {
  likesByMonth: MonthPoint[];
  commentsByMonth: MonthPoint[];
  likesHeatmap: Heatmap;
  topLiked: Ranked[];
  topCommented: Ranked[];
  commentLikes: number;
  likesToFollowingPct: number;
  likesToNonFollowingPct: number;
  distinctAccountsLiked: number;
  avgLikesPerActiveDay?: number;
  comments: {
    total: number;
    avgLength?: number;
    withEmojiPct: number;
    reelsPct: number;
    longest?: { text: string; mediaOwner: string; at: number };
    topWords: Ranked[];
    topEmojis: Ranked[];
  };
  firstLikeAt?: number;
  lastLikeAt?: number;
  longestLikeStreakDays: number;
}

export interface ContentSection {
  postsByMonth: { month: string; posts: number; reels: number; stories: number }[];
  postingHeatmap: Heatmap;
  bestHour?: number;
  bestWeekday?: number;
  totals: Record<string, number>;
  carouselPct: number;
  avgMediaPerPost?: number;
  captions: {
    withCaptionPct: number;
    avgLength?: number;
    avgHashtags?: number;
    topHashtags: Ranked[];
    topMentions: Ranked[];
    withEmojiPct: number;
  };
  firstPostAt?: number;
  lastPostAt?: number;
  longestGapDays?: number;
  avgDaysBetweenPosts?: number;
  postsPerYear: { year: number; count: number }[];
}

export interface ThreadSummary {
  title: string;
  isGroup: boolean;
  sent: number;
  received: number;
  total: number;
  firstAt?: number;
  lastAt?: number;
  /** Median minutes you take to reply. */
  yourMedianReplyMinutes?: number;
  /** Median minutes they take to reply. */
  theirMedianReplyMinutes?: number;
  reelsShared: number;
  yourSharePct: number;
}

export interface MessagesSection {
  selfName?: string;
  totals: {
    threads: number;
    groupThreads: number;
    requestThreads: number;
    sent: number;
    received: number;
    sharesSent: number;
    sharesReceived: number;
    reelsSent: number;
    reelsReceived: number;
    photosSent: number;
    voiceSent: number;
    calls: number;
    reactionsGiven: number;
    reactionsReceived: number;
    unsent: number;
  };
  byMonth: { month: string; sent: number; received: number }[];
  sentHeatmap: Heatmap;
  topThreads: ThreadSummary[];
  overallYourMedianReplyMinutes?: number;
  overallTheirMedianReplyMinutes?: number;
  avgWordsPerSentMessage?: number;
  topReactionsGiven: Ranked[];
  topReactionsReceived: Ranked[];
  /** Threads where the last message is yours and nobody replied for 7+ days. */
  waitingOnThem: { title: string; lastAt: number }[];
  waitingOnYou: { title: string; lastAt: number }[];
  threadsStartedByYear: { year: number; count: number }[];
  busiestDay?: { day: string; count: number };
  nightOwlPct: number;
  topWordsSent: Ranked[];
}

export interface StoriesSection {
  total: number;
  byKind: Ranked[];
  topAuthors: Ranked[];
  byMonth: MonthPoint[];
  pollAnswers: Ranked[];
}

export interface SavedSection {
  total: number;
  topAuthors: Ranked[];
  byMonth: MonthPoint[];
  collections: string[];
  distinctAuthors: number;
}

export interface InterestsSection {
  topics: string[];
  recommendedTopics: string[];
  advertisers: {
    total: number;
    withDataFile: number;
    withRemarketing: number;
    withInStoreVisits: number;
    names: string[];
  };
  adsViewed: { total: number; topAdvertisers: Ranked[]; byMonth: MonthPoint[]; perActiveDay?: number };
  adsClicked: { total: number; topAdvertisers: Ranked[] };
  postsViewed: { total: number; topAuthors: Ranked[]; followedPct: number };
  videosWatched: { total: number; topAuthors: Ranked[] };
  suggestedAccountsViewed: { total: number; topAccounts: Ranked[] };
  notInterested: number;
  locationsOfInterest: string[];
}

export interface SearchesSection {
  totalProfileSearches: number;
  totalKeywordSearches: number;
  totalHashtagSearches: number;
  topProfiles: Ranked[];
  topKeywords: Ranked[];
  topHashtags: Ranked[];
  byMonth: MonthPoint[];
  /** Profiles you searched for that you do not follow. */
  searchedButNotFollowing: Ranked[];
}

export interface SecuritySection {
  signup?: { at?: number; ip?: string; device?: string };
  logins: {
    total: number;
    byMonth: MonthPoint[];
    heatmap: Heatmap;
    uniqueIps: number;
    topIps: Ranked[];
    platforms: Ranked[];
    lastAt?: number;
    firstAt?: number;
  };
  logouts: number;
  devices: { userAgent: string; platform: string; lastLogin?: number }[];
  passwordChanges: number[];
  lastKnownLocation?: string;
  accountBasedIn?: string;
  profileBasedIn?: string;
  profileChanges: { field: string; previous?: string; next?: string; at?: number }[];
  activeApps: string[];
  expiredApps: string[];
}

export interface PersonScore {
  username: string;
  score: number;
  likes: number;
  comments: number;
  storyInteractions: number;
  saves: number;
  searches: number;
  followsYou: boolean;
  youFollow: boolean;
  firstAt?: number;
  lastAt?: number;
}

export interface PeopleSection {
  ranked: PersonScore[];
  totalAccountsInteractedWith: number;
  /** Accounts with high interaction that do not follow you back. */
  unrequitedTop: PersonScore[];
  /** Accounts you interact with heavily but do not follow. */
  secretFavourites: PersonScore[];
}

export interface ProSections {
  followers: FollowersSection;
  engagement: EngagementSection;
  content: ContentSection;
  messages: MessagesSection;
  stories: StoriesSection;
  saved: SavedSection;
  interests: InterestsSection;
  searches: SearchesSection;
  security: SecuritySection;
  people: PeopleSection;
}

export interface AnalysisReport {
  version: string;
  generatedAt: string;
  timeZone: string;
  free: FreeSections;
  pro: ProSections;
}

/** What the client receives: pro is null until the report is unlocked. */
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

export function gateReport(
  report: AnalysisReport,
  meta: { id: string; createdAt: string; tier: "free" | "pro" },
): GatedReport {
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
