import type { Dataset } from "../types";
import type { InterestsSection, SavedSection, SearchesSection, SecuritySection, StoriesSection } from "./report";
import type { FollowerSets } from "./followers";
import { percent, tally, top, topOf } from "./counting";
import { activeDays, byMonth, heatmap, round, type LocalClock } from "./time";

export function stories(ds: Dataset, clock: LocalClock): StoriesSection {
  const items = ds.stories;
  const polls = items.filter((i) => i.kind === "poll" && i.value);
  return {
    total: items.length,
    byKind: topOf(items.map((i) => i.kind), 10),
    topAuthors: topOf(items.map((i) => i.author), 30),
    byMonth: byMonth(items.map((i) => i.at), clock),
    pollAnswers: topOf(polls.map((p) => p.value as string), 10),
  };
}

export function saved(ds: Dataset, clock: LocalClock): SavedSection {
  const items = ds.saved.items;
  const authors = tally(items.map((i) => i.author));
  return {
    total: items.length,
    topAuthors: top(authors, 30),
    byMonth: byMonth(items.map((i) => i.at), clock),
    collections: [...new Set(ds.saved.collections)],
    distinctAuthors: authors.size,
  };
}

export function interests(ds: Dataset, sets: FollowerSets, clock: LocalClock): InterestsSection {
  const b = ds.browsing;
  const advertisers = ds.interests.advertisers;
  const adDays = activeDays(b.adsViewed.map((a) => a.at), clock);
  const followedViews = b.postsViewed.filter((p) => sets.following.has(p.author.toLowerCase())).length;
  return {
    topics: [...new Set(ds.interests.topics)],
    recommendedTopics: [...new Set(ds.interests.recommendedTopics)],
    advertisers: {
      total: advertisers.length,
      withDataFile: advertisers.filter((a) => a.hasDataFileAudience).length,
      withRemarketing: advertisers.filter((a) => a.hasRemarketingAudience).length,
      withInStoreVisits: advertisers.filter((a) => a.hasInPersonStoreVisit).length,
      names: advertisers.map((a) => a.name).sort((a, b) => a.localeCompare(b)),
    },
    adsViewed: {
      total: b.adsViewed.length,
      topAdvertisers: topOf(b.adsViewed.map((a) => a.author), 30),
      byMonth: byMonth(b.adsViewed.map((a) => a.at), clock),
      perActiveDay: adDays > 0 ? round(b.adsViewed.length / adDays) : undefined,
    },
    adsClicked: { total: b.adsClicked.length, topAdvertisers: topOf(b.adsClicked.map((a) => a.author), 20) },
    postsViewed: {
      total: b.postsViewed.length,
      topAuthors: topOf(b.postsViewed.map((a) => a.author), 30),
      followedPct: percent(followedViews, b.postsViewed.length),
    },
    videosWatched: { total: b.videosWatched.length, topAuthors: topOf(b.videosWatched.map((a) => a.author), 30) },
    suggestedAccountsViewed: {
      total: b.suggestedAccountsViewed.length,
      topAccounts: topOf(b.suggestedAccountsViewed.map((a) => a.author), 20),
    },
    notInterested: b.notInterested.length,
    locationsOfInterest: [...new Set(ds.interests.locationsOfInterest)],
  };
}

export function searches(ds: Dataset, sets: FollowerSets, clock: LocalClock): SearchesSection {
  const s = ds.searches;
  const profiles = tally(s.profiles.map((p) => p.query.replace(/^@/, "")));
  const notFollowing = [...profiles.entries()]
    .filter(([name]) => !sets.following.has(name.toLowerCase()))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  return {
    totalProfileSearches: s.profiles.length,
    totalKeywordSearches: s.keywords.length,
    totalHashtagSearches: s.hashtags.length,
    topProfiles: top(profiles, 30),
    topKeywords: topOf(s.keywords.map((k) => k.query.toLowerCase()), 30),
    topHashtags: topOf(s.hashtags.map((k) => k.query.toLowerCase()), 20),
    byMonth: byMonth([...s.profiles, ...s.keywords, ...s.hashtags].map((i) => i.at), clock),
    searchedButNotFollowing: notFollowing,
  };
}

export function platformOf(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ios/.test(ua)) return "iOS";
  if (/android/.test(ua)) return "Android";
  if (/windows/.test(ua)) return "Windows";
  if (/macintosh|mac os/.test(ua)) return "Mac";
  if (/linux/.test(ua)) return "Linux";
  if (/mozilla|chrome|safari/.test(ua)) return "Web";
  return "Other";
}

export function security(ds: Dataset, clock: LocalClock): SecuritySection {
  const logins = [...ds.security.logins].sort((a, b) => a.at - b.at);
  const ips = tally(logins.map((l) => l.ip).filter((ip): ip is string => !!ip));
  return {
    signup: ds.account.createdAt || ds.account.signupIp
      ? { at: ds.account.createdAt, ip: ds.account.signupIp, device: ds.account.signupDevice }
      : undefined,
    logins: {
      total: logins.length,
      byMonth: byMonth(logins.map((l) => l.at), clock),
      heatmap: heatmap(logins.map((l) => l.at), clock),
      uniqueIps: ips.size,
      topIps: top(ips, 10),
      platforms: topOf(logins.map((l) => platformOf(l.userAgent ?? "")), 6),
      firstAt: logins[0]?.at,
      lastAt: logins.at(-1)?.at,
    },
    logouts: ds.security.logouts.length,
    devices: ds.security.devices
      .map((d) => ({ userAgent: d.userAgent, platform: platformOf(d.userAgent), lastLogin: d.lastLogin }))
      .sort((a, b) => (b.lastLogin ?? 0) - (a.lastLogin ?? 0))
      .slice(0, 25),
    passwordChanges: [...ds.security.passwordChanges].sort((a, b) => b - a),
    lastKnownLocation: ds.security.lastKnownLocation,
    accountBasedIn: ds.account.basedIn,
    profileBasedIn: ds.account.profileBasedIn,
    profileChanges: ds.security.profileChanges.sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, 50),
    activeApps: ds.security.activeApps,
    expiredApps: ds.security.expiredApps,
  };
}
