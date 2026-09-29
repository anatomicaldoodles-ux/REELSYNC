import type { Dataset, Person } from "../types";
import type { DatedName, FollowersSection, FollowersSnapshotSection } from "./report";
import { byMonth, type LocalClock } from "./time";
import { percent } from "./counting";

const toDated = (p: Person): DatedName => ({ username: p.username, at: p.at });
const key = (u: string) => u.toLowerCase();

export interface FollowerSets {
  followers: Map<string, Person>;
  following: Map<string, Person>;
  notFollowingBack: Person[];
  fans: Person[];
  mutuals: Person[];
}

export function followerSets(ds: Dataset): FollowerSets {
  const followers = new Map(ds.relationships.followers.map((p) => [key(p.username), p]));
  const following = new Map(ds.relationships.following.map((p) => [key(p.username), p]));
  const notFollowingBack: Person[] = [];
  const mutuals: Person[] = [];
  for (const [k, p] of following) (followers.has(k) ? mutuals : notFollowingBack).push(p);
  const fans: Person[] = [];
  for (const [k, p] of followers) if (!following.has(k)) fans.push(p);
  const byNewest = (a: Person, b: Person) => (b.at ?? 0) - (a.at ?? 0);
  notFollowingBack.sort(byNewest);
  fans.sort(byNewest);
  mutuals.sort(byNewest);
  return { followers, following, notFollowingBack, fans, mutuals };
}

export function followersSnapshot(ds: Dataset, sets: FollowerSets): FollowersSnapshotSection {
  const r = ds.relationships;
  return {
    mutuals: sets.mutuals.length,
    notFollowingBack: sets.notFollowingBack.length,
    fans: sets.fans.length,
    closeFriends: r.closeFriends.length,
    pendingSent: r.pendingSent.length,
    recentlyUnfollowed: r.recentlyUnfollowed.length,
    blocked: r.blocked.length,
    notFollowingBackSample: sets.notFollowingBack.slice(0, 5).map(toDated),
    followBackRate: sets.following.size > 0 ? percent(sets.mutuals.length, sets.following.size) : undefined,
  };
}

/** Usernames the user has actively interacted with (likes, comments, saves, story, searches). */
export function interactedUsernames(ds: Dataset): Set<string> {
  const s = new Set<string>();
  ds.likes.posts.forEach((i) => s.add(key(i.author)));
  ds.likes.comments.forEach((i) => s.add(key(i.author)));
  ds.comments.forEach((c) => s.add(key(c.mediaOwner)));
  ds.saved.items.forEach((i) => s.add(key(i.author)));
  ds.stories.forEach((i) => s.add(key(i.author)));
  ds.searches.profiles.forEach((i) => s.add(key(i.query)));
  return s;
}

export function followersFull(ds: Dataset, sets: FollowerSets, clock: LocalClock): FollowersSection {
  const r = ds.relationships;
  const interacted = interactedUsernames(ds);
  const followersDated = [...sets.followers.values()].filter((p) => p.at);
  const oldest = [...followersDated].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)).slice(0, 10);
  const newest = [...followersDated].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, 10);
  const neverFollowers = [...sets.followers.values()].filter((p) => !interacted.has(key(p.username)));
  const neverFollowing = [...sets.following.values()].filter((p) => !interacted.has(key(p.username)));
  return {
    notFollowingBack: sets.notFollowingBack.map(toDated),
    fans: sets.fans.map(toDated),
    mutuals: sets.mutuals.map(toDated),
    recentlyUnfollowed: r.recentlyUnfollowed.map(toDated).sort((a, b) => (b.at ?? 0) - (a.at ?? 0)),
    pendingSent: r.pendingSent.map(toDated).sort((a, b) => (b.at ?? 0) - (a.at ?? 0)),
    receivedRequests: r.receivedRequests.map(toDated),
    blocked: r.blocked.map(toDated),
    restricted: r.restricted.map(toDated),
    closeFriends: r.closeFriends.map(toDated),
    hideStoryFrom: r.hideStoryFrom.map(toDated),
    followersByMonth: byMonth(followersDated.map((p) => p.at as number), clock),
    followingByMonth: byMonth(
      [...sets.following.values()].filter((p) => p.at).map((p) => p.at as number),
      clock,
    ),
    oldestFollowers: oldest.map(toDated),
    newestFollowers: newest.map(toDated),
    followersNeverInteracted: {
      count: neverFollowers.length,
      sample: neverFollowers.slice(0, 50).map((p) => p.username),
    },
    followingNeverInteracted: {
      count: neverFollowing.length,
      sample: neverFollowing.slice(0, 50).map((p) => p.username),
    },
  };
}
