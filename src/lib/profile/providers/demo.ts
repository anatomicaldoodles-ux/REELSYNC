/**
 * Demo provider: generates a plausible, deterministic public profile from the
 * username alone. Used when no data-provider credentials are configured so
 * the whole site can be tried locally. Reports made from it are labelled.
 */
import type { PublicPost, PublicProfile } from "../types";
import type { ProfileProvider } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

const TOPICS = ["travel", "food", "fitness", "photography", "fashion", "art", "music", "tech", "nature", "coffee"];
const CAPTIONS = [
  "Golden hour never disappoints",
  "New week, new goals. Let's go",
  "Save this for later",
  "Tag someone who needs to see this",
  "Behind the scenes from today's shoot",
  "Link in bio for the full story",
  "What do you think? Comment below",
  "Weekend mood",
  "Throwback to this view",
  "Small steps every day",
];

export class DemoProvider implements ProfileProvider {
  readonly name = "demo";

  async fetchProfile(username: string, options: { postsLimit?: number } = {}): Promise<PublicProfile> {
    const seed = hash(username);
    const rand = rng(seed);
    const tier = seed % 5; // 0..4 -> nano..mega
    const followers = Math.round([800, 6_500, 48_000, 320_000, 2_400_000][tier] * (0.6 + rand() * 0.9));
    const following = Math.round(Math.min(followers, 200 + rand() * 1500));
    const limit = options.postsLimit ?? 50;
    const postsCount = Math.round(limit + rand() * 900);
    const t1 = TOPICS[seed % TOPICS.length];
    const t2 = TOPICS[((seed >>> 4) + 3) % TOPICS.length];
    const posts: PublicPost[] = [];
    let cursor = Date.now() - rand() * 3 * 86400_000;
    const baseRate = [0.09, 0.05, 0.03, 0.018, 0.012][tier];
    for (let i = 0; i < limit; i++) {
      const r = rand();
      const type: PublicPost["type"] = r < 0.45 ? "image" : r < 0.75 ? "video" : "carousel";
      const isReel = type === "video" && rand() < 0.85;
      const boost = isReel ? 1.6 : type === "carousel" ? 1.2 : 1;
      const hourBias = [9, 12, 18, 19, 20, 21][Math.floor(rand() * 6)];
      const d = new Date(cursor);
      d.setUTCHours(hourBias, Math.floor(rand() * 60), 0, 0);
      const tags = [t1, t2, "instagood", "reels", "daily", "explore"].filter(() => rand() < 0.55).slice(0, 5);
      const likes = Math.round(followers * baseRate * boost * (0.4 + rand() * 1.4));
      const comments = Math.round(likes * (0.01 + rand() * 0.04));
      const code = `demo${(seed + i * 7919).toString(36)}`;
      posts.push({
        id: `${seed}_${i}`,
        shortCode: code,
        url: `https://www.instagram.com/p/${code}/`,
        type,
        productType: isReel ? "reel" : "feed",
        caption: `${CAPTIONS[(seed + i) % CAPTIONS.length]} ${tags.map((t) => `#${t}`).join(" ")}`.trim(),
        hashtags: tags,
        mentions: rand() < 0.2 ? ["friend_account"] : [],
        likes,
        comments,
        views: isReel ? Math.round(likes * (8 + rand() * 20)) : undefined,
        timestamp: d.toISOString(),
        isSponsored: rand() < 0.06,
      });
      cursor -= (1 + rand() * 6) * 86400_000;
    }
    return {
      username,
      fullName: username.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      biography: `Demo profile · ${t1} & ${t2} · This is generated sample data`,
      followers,
      following,
      postsCount,
      isPrivate: false,
      isVerified: tier >= 3,
      isBusiness: tier >= 2,
      category: tier >= 2 ? "Creator" : undefined,
      fetchedAt: new Date().toISOString(),
      posts,
      provider: this.name,
    };
  }
}
