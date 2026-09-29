import type { PublicProfile } from "../types";

export interface ProfileProvider {
  readonly name: string;
  /** Fetches a public profile with its recent posts. Throws ProfileNotFoundError / ProfilePrivateError / ProviderError. */
  fetchProfile(username: string, options?: { postsLimit?: number }): Promise<PublicProfile>;
}
