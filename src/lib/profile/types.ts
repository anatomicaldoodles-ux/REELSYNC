/**
 * Normalised public Instagram profile data, independent of which provider
 * fetched it. Only public information is represented here.
 */

export type PostType = "image" | "video" | "carousel";
export type ProductType = "feed" | "reel" | "igtv";

export interface PublicPost {
  id: string;
  shortCode: string;
  url: string;
  type: PostType;
  productType: ProductType;
  caption: string;
  hashtags: string[];
  mentions: string[];
  likes: number;
  comments: number;
  /** Video plays/views when the provider reports them. */
  views?: number;
  /** ISO 8601 timestamp. */
  timestamp: string;
  displayUrl?: string;
  isSponsored?: boolean;
  location?: string;
  /** Provider hides like counts on some posts; treated as unknown, not zero. */
  likesHidden?: boolean;
}

export interface PublicProfile {
  username: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  followers: number;
  following: number;
  postsCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  isBusiness?: boolean;
  category?: string;
  profilePicUrl?: string;
  /** ISO 8601 time the data was fetched. */
  fetchedAt: string;
  /** Recent posts, newest first. Empty for private accounts. */
  posts: PublicPost[];
  /** Which provider produced this snapshot ("apify", "demo", ...). */
  provider: string;
}

/** A historical follower count observation, used for growth charts. */
export interface FollowerPoint {
  at: string;
  followers: number;
  following: number;
  postsCount: number;
}

export class ProfileNotFoundError extends Error {
  constructor(username: string) {
    super(`Instagram account @${username} was not found`);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfilePrivateError extends Error {
  constructor(username: string) {
    super(`@${username} is a private account. Only public accounts can be analysed.`);
    this.name = "ProfilePrivateError";
  }
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export const USERNAME_RE = /^[a-z0-9._]{1,30}$/;

/** Cleans user input like "@Some.User " or a profile URL into a username. */
export function normaliseUsername(input: string): string | undefined {
  let s = input.trim().toLowerCase();
  const m = s.match(/instagram\.com\/([a-z0-9._]+)/);
  if (m) s = m[1];
  s = s.replace(/^@/, "").replace(/\/+$/, "");
  return USERNAME_RE.test(s) ? s : undefined;
}
