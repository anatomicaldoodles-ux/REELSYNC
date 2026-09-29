import type { Dataset } from "../types";
import type { EngagementSection } from "./report";
import type { FollowerSets } from "./followers";
import { emojiOnly, hasEmoji, percent, tally, top, topOf } from "./counting";
import { activeDays, byMonth, heatmap, longestStreakDays, mean, round, type LocalClock } from "./time";

const STOPWORDS = new Set(
  "the a an and or but of to in on for with at by from is are was were be been it its this that these those you your i me my we our they them he she his her so if as not no do does did have has had can will just very too also than then there here what which who when how all any some more most much lol omg ok okay yes yeah oh u ur im dont cant".split(
    " ",
  ),
);

export function topWords(texts: Iterable<string>, limit: number) {
  const words: string[] = [];
  for (const t of texts) {
    for (const w of t.toLowerCase().split(/[^\p{L}\p{N}']+/u)) {
      const word = w.replace(/^'+|'+$/g, "");
      if (word.length < 3 || STOPWORDS.has(word) || /^\d+$/.test(word)) continue;
      words.push(word);
    }
  }
  return topOf(words, limit);
}

export function topEmojis(texts: Iterable<string>, limit: number) {
  const emojis: string[] = [];
  for (const t of texts) {
    for (const ch of t) if (/\p{Extended_Pictographic}/u.test(ch)) emojis.push(ch);
  }
  return topOf(emojis, limit);
}

export function engagement(ds: Dataset, sets: FollowerSets, clock: LocalClock): EngagementSection {
  const likes = ds.likes.posts;
  const likeTimes = likes.map((l) => l.at);
  const likedAuthors = tally(likes.map((l) => l.author));
  let toFollowing = 0;
  for (const l of likes) if (sets.following.has(l.author.toLowerCase())) toFollowing++;

  const comments = ds.comments;
  const lengths = comments.map((c) => c.text.length);
  const longest = comments.reduce<(typeof comments)[number] | undefined>(
    (best, c) => (!best || c.text.length > best.text.length ? c : best),
    undefined,
  );
  const days = activeDays(likeTimes, clock);
  const sortedLikes = [...likeTimes].sort((a, b) => a - b);

  return {
    likesByMonth: byMonth(likeTimes, clock),
    commentsByMonth: byMonth(comments.map((c) => c.at), clock),
    likesHeatmap: heatmap(likeTimes, clock),
    topLiked: top(likedAuthors, 50),
    topCommented: topOf(comments.map((c) => c.mediaOwner), 50),
    commentLikes: ds.likes.comments.length,
    likesToFollowingPct: percent(toFollowing, likes.length),
    likesToNonFollowingPct: percent(likes.length - toFollowing, likes.length),
    distinctAccountsLiked: likedAuthors.size,
    avgLikesPerActiveDay: days > 0 ? round(likes.length / days) : undefined,
    comments: {
      total: comments.length,
      avgLength: round(mean(lengths)),
      withEmojiPct: percent(comments.filter((c) => hasEmoji(c.text)).length, comments.length),
      reelsPct: percent(comments.filter((c) => c.kind === "reel").length, comments.length),
      longest: longest
        ? { text: longest.text.slice(0, 280), mediaOwner: longest.mediaOwner, at: longest.at }
        : undefined,
      topWords: topWords(comments.map((c) => c.text), 30),
      topEmojis: topEmojis(comments.map((c) => emojiOnly(c.text)), 15),
    },
    firstLikeAt: sortedLikes[0],
    lastLikeAt: sortedLikes.at(-1),
    longestLikeStreakDays: longestStreakDays(likeTimes, clock),
  };
}
