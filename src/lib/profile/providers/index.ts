import { ApifyProvider } from "./apify";
import { DemoProvider } from "./demo";
import type { ProfileProvider } from "./types";

export type { ProfileProvider } from "./types";

/** Picks the provider from the environment: Apify when a token is set, otherwise demo data. */
export function providerFromEnv(env: NodeJS.ProcessEnv = process.env): ProfileProvider {
  if (env.APIFY_TOKEN) {
    return new ApifyProvider({
      token: env.APIFY_TOKEN,
      actor: env.APIFY_ACTOR || undefined,
      postsLimit: Number(env.LOOKUP_POSTS_LIMIT) > 0 ? Number(env.LOOKUP_POSTS_LIMIT) : undefined,
    });
  }
  return new DemoProvider();
}
