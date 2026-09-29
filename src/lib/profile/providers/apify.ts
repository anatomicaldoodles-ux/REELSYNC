/**
 * Apify-backed provider. Runs the `apify/instagram-scraper` actor synchronously
 * and maps its output to PublicProfile. Field names follow the actor's
 * documented output; a few alternates are accepted so minor upstream renames
 * degrade gracefully instead of breaking the site.
 */
import { ProfileNotFoundError, ProfilePrivateError, ProviderError, type PublicPost, type PublicProfile } from "../types";
import type { ProfileProvider } from "./types";

export interface ApifyOptions {
  token: string;
  /** Actor id in "owner~name" form. */
  actor?: string;
  /** How many recent posts to fetch (a second actor run when more than the profile call returns). */
  postsLimit?: number;
  /** Max seconds to wait for a synchronous run. */
  timeoutSeconds?: number;
  /** Override fetch for tests. */
  fetchImpl?: typeof fetch;
}

type Raw = Record<string, unknown>;

const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
};
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const pick = <T>(raw: Raw, keys: string[], conv: (v: unknown) => T | undefined): T | undefined => {
  for (const k of keys) {
    const out = conv(raw[k]);
    if (out !== undefined) return out;
  }
  return undefined;
};

const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;
const MENTION_RE = /@([A-Za-z0-9._]+)/g;

export function mapPost(raw: Raw): PublicPost | undefined {
  const shortCode = pick(raw, ["shortCode", "shortcode", "code"], str);
  const id = pick(raw, ["id", "pk"], (v) => str(v) ?? (num(v) !== undefined ? String(num(v)) : undefined)) ?? shortCode;
  const ts = raw.timestamp ?? raw.taken_at_timestamp ?? raw.takenAt ?? raw.taken_at;
  let timestamp: string | undefined;
  if (typeof ts === "string") {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) timestamp = d.toISOString();
  } else if (typeof ts === "number") {
    timestamp = new Date(ts > 1e12 ? ts : ts * 1000).toISOString();
  }
  if (!id || !timestamp) return undefined;

  const rawType = (pick(raw, ["type", "__typename", "media_type"], (v) => str(v) ?? (num(v) !== undefined ? String(num(v)) : undefined)) ?? "").toLowerCase();
  let type: PublicPost["type"] = "image";
  if (/video|graphvideo|^2$|clips/.test(rawType) || raw.isVideo === true || raw.is_video === true) type = "video";
  if (/sidecar|carousel|^8$/.test(rawType) || (Array.isArray(raw.childPosts) && raw.childPosts.length > 1)) type = "carousel";

  const product = (pick(raw, ["productType", "product_type"], str) ?? "").toLowerCase();
  const productType: PublicPost["productType"] = product === "clips" || product === "reel" || product === "reels" ? "reel" : product === "igtv" ? "igtv" : "feed";

  const caption = pick(raw, ["caption", "text"], str) ?? "";
  const hashtags = strArr(raw.hashtags).length ? strArr(raw.hashtags) : [...caption.matchAll(HASHTAG_RE)].map((m) => m[1]);
  const mentions = strArr(raw.mentions).length ? strArr(raw.mentions) : [...caption.matchAll(MENTION_RE)].map((m) => m[1]);
  const likesRaw = pick(raw, ["likesCount", "likes", "like_count", "edge_liked_by"], (v) => (typeof v === "object" && v && "count" in v ? num((v as Raw).count) : num(v)));
  const likesHidden = likesRaw === undefined || likesRaw < 0;

  return {
    id: String(id),
    shortCode: shortCode ?? String(id),
    url: pick(raw, ["url", "postUrl"], str) ?? (shortCode ? `https://www.instagram.com/p/${shortCode}/` : ""),
    type,
    productType: type === "video" ? productType : "feed",
    caption,
    hashtags: hashtags.map((h) => h.toLowerCase()),
    mentions: mentions.map((m) => m.toLowerCase()),
    likes: likesHidden ? 0 : (likesRaw as number),
    comments: pick(raw, ["commentsCount", "comments", "comment_count"], num) ?? 0,
    views: pick(raw, ["videoPlayCount", "videoViewCount", "playCount", "video_view_count", "view_count"], num),
    timestamp,
    displayUrl: pick(raw, ["displayUrl", "display_url", "thumbnailUrl"], str),
    isSponsored: bool(raw.isSponsored) ?? bool(raw.is_paid_partnership),
    location: pick(raw, ["locationName"], str) ?? (typeof raw.location === "object" && raw.location ? str((raw.location as Raw).name) : undefined),
    likesHidden: likesHidden || undefined,
  };
}

export function mapProfile(raw: Raw, provider = "apify"): PublicProfile {
  const username = pick(raw, ["username", "userName", "handle"], str);
  if (!username) throw new ProviderError("Provider response did not include a username");
  const postsRaw = [raw.latestPosts, raw.posts, raw.edge_owner_to_timeline_media].find(Array.isArray) as Raw[] | undefined;
  const posts = (postsRaw ?? []).map(mapPost).filter((p): p is PublicPost => !!p);
  return {
    username: username.toLowerCase(),
    fullName: pick(raw, ["fullName", "full_name", "name"], str),
    biography: pick(raw, ["biography", "bio"], str),
    externalUrl: pick(raw, ["externalUrl", "external_url", "website"], str),
    followers: pick(raw, ["followersCount", "followers", "follower_count", "edge_followed_by"], (v) => (typeof v === "object" && v && "count" in v ? num((v as Raw).count) : num(v))) ?? 0,
    following: pick(raw, ["followsCount", "followingCount", "following", "following_count", "edge_follow"], (v) => (typeof v === "object" && v && "count" in v ? num((v as Raw).count) : num(v))) ?? 0,
    postsCount: pick(raw, ["postsCount", "mediaCount", "media_count", "posts_count"], num) ?? posts.length,
    isPrivate: pick(raw, ["private", "isPrivate", "is_private"], bool) ?? false,
    isVerified: pick(raw, ["verified", "isVerified", "is_verified"], bool) ?? false,
    isBusiness: pick(raw, ["isBusinessAccount", "is_business_account", "isBusiness"], bool),
    category: pick(raw, ["businessCategoryName", "category_name", "category"], str),
    profilePicUrl: pick(raw, ["profilePicUrlHD", "profilePicUrl", "profile_pic_url_hd", "profile_pic_url"], str),
    fetchedAt: new Date().toISOString(),
    posts: dedupeAndSort(posts),
    provider,
  };
}

export function dedupeAndSort(posts: PublicPost[]): PublicPost[] {
  const seen = new Map<string, PublicPost>();
  for (const p of posts) if (!seen.has(p.id)) seen.set(p.id, p);
  return [...seen.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export class ApifyProvider implements ProfileProvider {
  readonly name = "apify";
  private readonly token: string;
  private readonly actor: string;
  private readonly postsLimit: number;
  private readonly timeoutSeconds: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApifyOptions) {
    this.token = options.token;
    this.actor = options.actor ?? "apify~instagram-scraper";
    this.postsLimit = options.postsLimit ?? 50;
    this.timeoutSeconds = options.timeoutSeconds ?? 120;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async run(input: Record<string, unknown>): Promise<Raw[]> {
    const url = `https://api.apify.com/v2/acts/${this.actor}/run-sync-get-dataset-items?token=${encodeURIComponent(this.token)}&timeout=${this.timeoutSeconds}`;
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout((this.timeoutSeconds + 15) * 1000),
      });
    } catch (err) {
      throw new ProviderError(`Could not reach the data provider: ${(err as Error).message}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`Data provider error (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as unknown;
    if (!Array.isArray(body)) throw new ProviderError("Unexpected response from the data provider");
    return body.filter((x): x is Raw => typeof x === "object" && x !== null);
  }

  async fetchProfile(username: string, options: { postsLimit?: number } = {}): Promise<PublicProfile> {
    const limit = options.postsLimit ?? this.postsLimit;
    const profileUrl = `https://www.instagram.com/${username}/`;
    const details = await this.run({ directUrls: [profileUrl], resultsType: "details", resultsLimit: limit, addParentData: false });
    const item = details.find((d) => str(d.username)?.toLowerCase() === username) ?? details[0];
    if (!item || item.error || item.errorDescription) {
      const desc = [item?.error, item?.errorDescription].filter(Boolean).join(" ");
      if (!item || /not[\s_]*found|does not exist|no such|404|unavailable/i.test(desc)) throw new ProfileNotFoundError(username);
      throw new ProviderError(desc || "Profile could not be fetched");
    }
    const profile = mapProfile(item, this.name);
    if (profile.isPrivate) throw new ProfilePrivateError(username);

    if (profile.posts.length < limit && profile.postsCount > profile.posts.length) {
      try {
        const more = await this.run({ directUrls: [profileUrl], resultsType: "posts", resultsLimit: limit, addParentData: false });
        const mapped = more.map(mapPost).filter((p): p is PublicPost => !!p);
        profile.posts = dedupeAndSort([...profile.posts, ...mapped]).slice(0, limit);
      } catch {
        // Keep the posts we already have.
      }
    }
    return profile;
  }
}
