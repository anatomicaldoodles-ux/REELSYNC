import type { Dataset } from "../types";
import type { PeopleSection, PersonScore, TopPeopleTeaserSection } from "./report";
import type { FollowerSets } from "./followers";

const WEIGHTS = { like: 1, comment: 4, story: 2, save: 3, search: 2 };

export function people(ds: Dataset, sets: FollowerSets): PeopleSection {
  const map = new Map<string, PersonScore>();
  const get = (username: string) => {
    const k = username.toLowerCase();
    let p = map.get(k);
    if (!p) {
      p = {
        username,
        score: 0,
        likes: 0,
        comments: 0,
        storyInteractions: 0,
        saves: 0,
        searches: 0,
        followsYou: sets.followers.has(k),
        youFollow: sets.following.has(k),
      };
      map.set(k, p);
    }
    return p;
  };
  const touch = (p: PersonScore, at: number) => {
    if (p.firstAt === undefined || at < p.firstAt) p.firstAt = at;
    if (p.lastAt === undefined || at > p.lastAt) p.lastAt = at;
  };
  for (const i of ds.likes.posts) {
    const p = get(i.author);
    p.likes++;
    p.score += WEIGHTS.like;
    touch(p, i.at);
  }
  for (const c of ds.comments) {
    if (c.mediaOwner === "unknown") continue;
    const p = get(c.mediaOwner);
    p.comments++;
    p.score += WEIGHTS.comment;
    touch(p, c.at);
  }
  for (const s of ds.stories) {
    const p = get(s.author);
    p.storyInteractions++;
    p.score += WEIGHTS.story;
    touch(p, s.at);
  }
  for (const s of ds.saved.items) {
    const p = get(s.author);
    p.saves++;
    p.score += WEIGHTS.save;
    touch(p, s.at);
  }
  for (const s of ds.searches.profiles) {
    const p = get(s.query.replace(/^@/, ""));
    p.searches++;
    p.score += WEIGHTS.search;
    touch(p, s.at);
  }
  const ranked = [...map.values()].sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
  const self = ds.account.username?.toLowerCase();
  const others = self ? ranked.filter((p) => p.username.toLowerCase() !== self) : ranked;
  return {
    ranked: others.slice(0, 100),
    totalAccountsInteractedWith: others.length,
    unrequitedTop: others.filter((p) => p.youFollow && !p.followsYou).slice(0, 20),
    secretFavourites: others.filter((p) => !p.youFollow && p.score >= 5).slice(0, 20),
  };
}

export function topPeopleTeaser(section: PeopleSection): TopPeopleTeaserSection {
  return {
    top: section.ranked.slice(0, 3).map((p) => ({
      username: p.username,
      score: p.score,
      likes: p.likes,
      comments: p.comments,
    })),
    totalAccountsInteractedWith: section.totalAccountsInteractedWith,
  };
}
