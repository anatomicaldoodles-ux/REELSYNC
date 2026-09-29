import { describe, expect, it } from "vitest";
import { ApifyProvider, mapPost, mapProfile } from "../providers/apify";
import { ProfileNotFoundError, ProfilePrivateError } from "../types";

const rawPost = {
  id: "3210000000000000001",
  type: "Video",
  shortCode: "Cabc123",
  caption: "Sunset run 🌅 #fitness #run @coach",
  hashtags: ["fitness", "run"],
  mentions: ["coach"],
  url: "https://www.instagram.com/p/Cabc123/",
  commentsCount: 12,
  likesCount: 340,
  videoViewCount: 5600,
  timestamp: "2026-09-20T18:30:00.000Z",
  productType: "clips",
  isSponsored: false,
};

const rawProfile = {
  username: "Runner_Jo",
  fullName: "Jo Runner",
  biography: "Runs & coffee",
  followersCount: 12000,
  followsCount: 300,
  postsCount: 240,
  private: false,
  verified: true,
  latestPosts: [rawPost, { ...rawPost, id: "2", shortCode: "Cdef", type: "Sidecar", productType: "feed", likesCount: 100, timestamp: 1758300000 }],
};

describe("mapPost", () => {
  it("maps the documented actor fields", () => {
    const p = mapPost(rawPost)!;
    expect(p).toMatchObject({ id: rawPost.id, shortCode: "Cabc123", type: "video", productType: "reel", likes: 340, comments: 12, views: 5600 });
    expect(p.hashtags).toEqual(["fitness", "run"]);
    expect(p.timestamp).toBe("2026-09-20T18:30:00.000Z");
  });
  it("handles numeric timestamps, carousels and missing hashtag arrays", () => {
    const p = mapPost({ shortcode: "X", caption: "Hi #Tag", taken_at_timestamp: 1758300000, __typename: "GraphSidecar", edge_liked_by: { count: 5 } })!;
    expect(p.type).toBe("carousel");
    expect(p.hashtags).toEqual(["tag"]);
    expect(p.likes).toBe(5);
    expect(p.timestamp).toBe(new Date(1758300000 * 1000).toISOString());
  });
  it("marks hidden like counts", () => {
    const p = mapPost({ id: "1", timestamp: "2026-01-01T00:00:00Z", likesCount: -1 })!;
    expect(p.likesHidden).toBe(true);
    expect(p.likes).toBe(0);
  });
  it("drops posts without a usable timestamp", () => {
    expect(mapPost({ id: "1" })).toBeUndefined();
  });
});

describe("mapProfile", () => {
  it("normalises the profile and sorts posts newest first", () => {
    const p = mapProfile(rawProfile);
    expect(p.username).toBe("runner_jo");
    expect(p.followers).toBe(12000);
    expect(p.isVerified).toBe(true);
    expect(p.posts.map((x) => x.shortCode)).toEqual(["Cabc123", "Cdef"]);
    expect(p.posts[1].type).toBe("carousel");
  });
});

describe("ApifyProvider", () => {
  const calls: unknown[] = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    const input = JSON.parse(String(init?.body));
    calls.push(input);
    if (input.resultsType === "details") {
      if (input.directUrls[0].includes("/ghost/")) return new Response(JSON.stringify([{ error: "not_found", errorDescription: "Page not found" }]));
      if (input.directUrls[0].includes("/secret/")) return new Response(JSON.stringify([{ ...rawProfile, username: "secret", private: true }]));
      return new Response(JSON.stringify([rawProfile]));
    }
    return new Response(JSON.stringify([{ ...rawPost, id: "3", shortCode: "Cnew", timestamp: "2026-09-25T10:00:00Z" }]));
  }) as typeof fetch;
  const provider = new ApifyProvider({ token: "t", fetchImpl, postsLimit: 10 });

  it("fetches details then more posts, merging and deduplicating", async () => {
    const p = await provider.fetchProfile("runner_jo");
    expect(p.posts.map((x) => x.shortCode)).toEqual(["Cnew", "Cabc123", "Cdef"]);
    expect(calls.length).toBe(2);
  });
  it("raises typed errors for missing and private accounts", async () => {
    await expect(provider.fetchProfile("ghost")).rejects.toBeInstanceOf(ProfileNotFoundError);
    await expect(provider.fetchProfile("secret")).rejects.toBeInstanceOf(ProfilePrivateError);
  });
});
