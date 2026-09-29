import { describe, expect, it } from "vitest";
import { parseExport, isRelevantFile } from "../parse";
import { fixEncoding } from "../encoding";
import { buildFixture, mojibake, T0 } from "./fixture";

describe("fixEncoding", () => {
  it("repairs latin-1 mojibake produced by the export", () => {
    expect(fixEncoding(mojibake("café ☕ 🌙"))).toBe("café ☕ 🌙");
  });
  it("leaves plain ASCII and already-correct unicode alone", () => {
    expect(fixEncoding("hello")).toBe("hello");
    expect(fixEncoding("日本語")).toBe("日本語");
  });
  it("returns the input when bytes are not valid UTF-8", () => {
    expect(fixEncoding("ÿþ")).toBe("ÿþ");
  });
});

describe("isRelevantFile", () => {
  it("recognises export JSON files regardless of root folder", () => {
    expect(isRelevantFile("foo/connections/followers_and_following/followers_1.json")).toBe(true);
    expect(isRelevantFile("your_instagram_activity/messages/inbox/x_1/message_3.json")).toBe(true);
    expect(isRelevantFile("media/posts/a.jpg")).toBe(false);
    expect(isRelevantFile("random.json")).toBe(false);
  });
});

describe("parseExport", () => {
  const ds = parseExport(buildFixture());

  it("reads the profile", () => {
    expect(ds.account.username).toBe("testuser");
    expect(ds.account.name).toBe("Test User");
    expect(ds.account.bio).toBe("Coffee ☕ and code");
    expect(ds.account.privateAccount).toBe(false);
    expect(ds.account.createdAt).toBe(T0 - 800 * 86400);
    expect(ds.account.signupIp).toBe("1.2.3.4");
  });

  it("reads relationships including timestamps", () => {
    expect(ds.relationships.followers.map((p) => p.username)).toEqual(["alice", "bob", "carol"]);
    expect(ds.relationships.following.map((p) => p.username)).toEqual(["alice", "bob", "dave", "erin"]);
    expect(ds.relationships.followers[0].at).toBe(T0 - 400 * 86400);
    expect(ds.relationships.blocked[0].username).toBe("spammer");
    expect(ds.relationships.pendingSent[0].username).toBe("celeb");
    expect(ds.relationships.recentlyUnfollowed[0].username).toBe("frank");
    expect(ds.relationships.closeFriends).toHaveLength(1);
  });

  it("reads likes, comments, saves and story interactions", () => {
    expect(ds.likes.posts).toHaveLength(43);
    expect(ds.likes.comments).toHaveLength(1);
    expect(ds.comments).toHaveLength(3);
    expect(ds.comments.find((c) => c.kind === "reel")?.mediaOwner).toBe("zed");
    expect(ds.comments[0].text).toBe("Love this café ☕");
    expect(ds.saved.items.map((s) => s.author)).toEqual(["dave", "zed"]);
    expect(ds.saved.collections).toEqual(["Recipes", "Travel"]);
    expect(ds.stories.filter((s) => s.kind === "like")).toHaveLength(2);
    expect(ds.stories.find((s) => s.kind === "poll")?.value).toBe("Yes");
  });

  it("reads own content with captions and media counts", () => {
    const posts = ds.content.filter((c) => c.kind === "post");
    expect(posts).toHaveLength(3);
    expect(posts.find((p) => p.mediaCount === 2)?.caption).toBe("Carousel #travel");
    expect(ds.content.filter((c) => c.kind === "reel")).toHaveLength(1);
    expect(ds.content.filter((c) => c.kind === "story")).toHaveLength(2);
  });

  it("reads message threads with decoded names and classified messages", () => {
    expect(ds.messages).toHaveLength(3);
    const alice = ds.messages.find((t) => t.title === "Alice Ångström");
    expect(alice).toBeDefined();
    expect(alice!.isGroup).toBe(false);
    expect(alice!.messages.map((m) => m.type)).toEqual(["text", "share", "text", "text"]);
    expect(alice!.messages[1].shareKind).toBe("reel");
    expect(alice!.messages[2].reactions[0]).toEqual({ actor: "Alice Ångström", reaction: "❤️" });
    const group = ds.messages.find((t) => t.title === "Weekend plans");
    expect(group!.isGroup).toBe(true);
    expect(group!.messages.map((m) => m.type)).toEqual(["photo", "text", "reaction_notice"]);
  });

  it("reads searches, ads, topics, advertisers and security data", () => {
    expect(ds.searches.profiles).toHaveLength(3);
    expect(ds.searches.keywords[0].query).toBe("pasta recipe");
    expect(ds.browsing.adsViewed).toHaveLength(3);
    expect(ds.browsing.postsViewed).toHaveLength(2);
    expect(ds.interests.topics).toEqual(["Travel", "Cooking"]);
    expect(ds.interests.advertisers).toHaveLength(2);
    expect(ds.interests.advertisers[0].hasDataFileAudience).toBe(true);
    expect(ds.security.logins).toHaveLength(20);
    expect(ds.security.logins[0].ip).toBe("10.0.0.1");
    expect(ds.security.devices).toHaveLength(1);
    expect(ds.security.passwordChanges).toHaveLength(1);
  });

  it("ignores media and unknown files and reports unparseable ones", () => {
    expect(ds.meta.filesMatched.some((f) => f.endsWith("unknown.json"))).toBe(false);
    expect(ds.meta.warnings.some((w) => w.includes("followers_2.json"))).toBe(true);
    expect(ds.meta.filesMatched.length).toBeGreaterThan(25);
  });

  it("computes the covered time range", () => {
    expect(ds.meta.earliest).toBe(T0 - 800 * 86400);
    expect(ds.meta.latest).toBe(T0);
  });
});
