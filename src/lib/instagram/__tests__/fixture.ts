/**
 * Builds a small but realistic Instagram JSON export in memory, mirroring the
 * folder layout and record shapes Instagram produced in 2024-2026 exports.
 */
import type { ExportFiles } from "../parse";

const DAY = 86400;
export const T0 = 1_700_000_000; // 2023-11-14T22:13:20Z

/** Encodes a string the way the export does: UTF-8 bytes as latin-1 code points. */
export function mojibake(s: string): string {
  return Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join("");
}

const rel = (username: string, at: number) => ({
  title: "",
  media_list_data: [],
  string_list_data: [{ href: `https://www.instagram.com/${username}`, value: username, timestamp: at }],
});

export function buildFixture(): ExportFiles {
  const files = new Map<string, string>();
  const put = (path: string, json: unknown) =>
    files.set(`instagram-testuser-2026-01-01-abc/${path}`, JSON.stringify(json));

  // Relationships: alice, bob, carol follow me; I follow alice, bob, dave, erin.
  put("connections/followers_and_following/followers_1.json", [
    rel("alice", T0 - 400 * DAY),
    rel("bob", T0 - 300 * DAY),
    rel("carol", T0 - 10 * DAY),
  ]);
  put("connections/followers_and_following/following.json", {
    relationships_following: [
      { title: "alice", string_list_data: [{ href: "https://www.instagram.com/alice", value: "alice", timestamp: T0 - 390 * DAY }] },
      { title: "bob", string_list_data: [{ href: "https://www.instagram.com/bob", value: "bob", timestamp: T0 - 290 * DAY }] },
      { title: "dave", string_list_data: [{ href: "https://www.instagram.com/dave", value: "dave", timestamp: T0 - 50 * DAY }] },
      { title: "erin", string_list_data: [{ href: "https://www.instagram.com/erin", value: "erin", timestamp: T0 - 5 * DAY }] },
    ],
  });
  put("connections/followers_and_following/close_friends.json", { relationships_close_friends: [rel("alice", T0 - 100 * DAY)] });
  put("connections/followers_and_following/blocked_accounts.json", {
    relationships_blocked_users: [{ title: "spammer", string_list_data: [{ href: "https://www.instagram.com/spammer", timestamp: T0 - 20 * DAY }] }],
  });
  put("connections/followers_and_following/pending_follow_requests.json", { relationships_follow_requests_sent: [rel("celeb", T0 - 3 * DAY)] });
  put("connections/followers_and_following/recently_unfollowed_accounts.json", { relationships_unfollowed_users: [rel("frank", T0 - 2 * DAY)] });

  // Likes: heavy on dave (whom I follow, doesn't follow back) and zed (not followed).
  const likes = [];
  for (let i = 0; i < 30; i++) likes.push({ title: "dave", string_list_data: [{ href: "https://www.instagram.com/p/x", value: "👍", timestamp: T0 - i * DAY - 3600 * 20 }] });
  for (let i = 0; i < 12; i++) likes.push({ title: "zed", string_list_data: [{ href: "https://www.instagram.com/p/y", value: "👍", timestamp: T0 - i * 2 * DAY }] });
  likes.push({ title: "alice", string_list_data: [{ href: "https://www.instagram.com/p/z", value: "👍", timestamp: T0 - 7 * DAY }] });
  put("your_instagram_activity/likes/liked_posts.json", { likes_media_likes: likes });
  put("your_instagram_activity/likes/liked_comments.json", {
    likes_comment_likes: [{ title: "bob", string_list_data: [{ href: "https://www.instagram.com/p/c", value: "👍", timestamp: T0 - DAY }] }],
  });

  put("your_instagram_activity/comments/post_comments_1.json", [
    { string_map_data: { Comment: { value: mojibake("Love this café ☕") }, "Media Owner": { value: "dave" }, Time: { timestamp: T0 - 4 * DAY } } },
    { string_map_data: { Comment: { value: "so good" }, "Media Owner": { value: "alice" }, Time: { timestamp: T0 - 9 * DAY } } },
  ]);
  put("your_instagram_activity/comments/reels_comments.json", {
    comments_reels_comments: [{ string_map_data: { Comment: { value: "haha" }, "Media Owner": { value: "zed" }, Time: { timestamp: T0 - 1 * DAY } } }],
  });

  put("your_instagram_activity/saved/saved_posts.json", {
    saved_saved_media: [
      { title: "dave", string_map_data: { "Saved on": { href: "https://www.instagram.com/p/s1", timestamp: T0 - 6 * DAY } } },
      { title: "zed", string_map_data: { "Saved on": { href: "https://www.instagram.com/p/s2", timestamp: T0 - 8 * DAY } } },
    ],
  });
  put("your_instagram_activity/saved/saved_collections.json", {
    saved_saved_collections: [{ string_map_data: { Name: { value: "Recipes" } } }, { string_map_data: { Name: { value: "Travel" } } }],
  });

  put("your_instagram_activity/story_interactions/story_likes.json", {
    story_activities_story_likes: [
      { title: "alice", string_list_data: [{ timestamp: T0 - 2 * DAY }] },
      { title: "alice", string_list_data: [{ timestamp: T0 - 3 * DAY }] },
    ],
  });
  put("your_instagram_activity/story_interactions/polls.json", {
    story_activities_polls: [{ title: "bob", string_list_data: [{ value: "Yes", timestamp: T0 - 12 * DAY }] }],
  });

  put("your_instagram_activity/content/posts_1.json", [
    { media: [{ uri: "media/posts/a.jpg", creation_timestamp: T0 - 200 * DAY, title: "First post #travel #sun @alice" }] },
    { media: [{ uri: "b.jpg", creation_timestamp: T0 - 100 * DAY }, { uri: "c.jpg", creation_timestamp: T0 - 100 * DAY }], title: "Carousel #travel", creation_timestamp: T0 - 100 * DAY },
    { media: [{ uri: "d.jpg", creation_timestamp: T0 - 10 * DAY, title: "" }] },
  ]);
  put("your_instagram_activity/content/reels.json", { ig_reels_media: [{ media: [{ uri: "r.mp4", creation_timestamp: T0 - 30 * DAY, title: "reel time 🎬" }] }] });
  put("your_instagram_activity/content/stories.json", { ig_stories: [{ uri: "s.jpg", creation_timestamp: T0 - 1 * DAY }, { uri: "s2.jpg", creation_timestamp: T0 - 2 * DAY }] });

  // Messages: self is "Test User".
  const msg = (sender: string, offsetMin: number, extra: Record<string, unknown> = {}) => ({
    sender_name: mojibake(sender),
    timestamp_ms: (T0 - 5 * DAY) * 1000 + offsetMin * 60_000,
    ...extra,
  });
  put("your_instagram_activity/messages/inbox/alice_123/message_1.json", {
    participants: [{ name: mojibake("Alice Ångström") }, { name: "Test User" }],
    messages: [
      msg("Alice Ångström", 40, { content: mojibake("gute nacht 🌙") }),
      msg("Test User", 30, { content: "ok see you", reactions: [{ reaction: mojibake("❤️"), actor: mojibake("Alice Ångström") }] }),
      msg("Alice Ångström", 10, { share: { link: "https://www.instagram.com/reel/abc/" } }),
      msg("Test User", 0, { content: "hey how are you doing today" }),
    ],
    title: mojibake("Alice Ångström"),
    is_still_participant: true,
    thread_path: "inbox/alice_123",
  });
  put("your_instagram_activity/messages/inbox/group_456/message_1.json", {
    participants: [{ name: "Bob" }, { name: "Carol" }, { name: "Test User" }],
    messages: [
      msg("Bob", 100, { content: "Reacted 👍 to your message" }),
      msg("Test User", 90, { content: "group hello" }),
      msg("Carol", 80, { photos: [{ uri: "p.jpg" }] }),
    ],
    title: "Weekend plans",
    thread_path: "inbox/group_456",
  });
  // A thread where I wrote last, long ago: waiting on them.
  put("your_instagram_activity/messages/inbox/dave_789/message_1.json", {
    participants: [{ name: "Dave" }, { name: "Test User" }],
    messages: [{ sender_name: "Test User", timestamp_ms: (T0 - 40 * DAY) * 1000, content: "hello?" }],
    title: "Dave",
    thread_path: "inbox/dave_789",
  });

  put("logged_information/recent_searches/profile_searches.json", {
    searches_user: [
      { string_map_data: { Search: { value: "zed" }, Time: { timestamp: T0 - 1 * DAY } } },
      { string_map_data: { Search: { value: "zed" }, Time: { timestamp: T0 - 2 * DAY } } },
      { string_map_data: { Search: { value: "alice" }, Time: { timestamp: T0 - 3 * DAY } } },
    ],
  });
  put("logged_information/recent_searches/word_or_phrase_searches.json", {
    searches_keyword: [{ string_map_data: { Search: { value: "pasta recipe" }, Time: { timestamp: T0 - 1 * DAY } } }],
  });

  put("ads_information/ads_and_topics/ads_viewed.json", {
    impressions_history_ads_seen: [
      { string_map_data: { Author: { value: "brandco" }, Time: { timestamp: T0 - DAY } } },
      { string_map_data: { Author: { value: "brandco" }, Time: { timestamp: T0 - DAY + 100 } } },
      { string_map_data: { Author: { value: "othershop" }, Time: { timestamp: T0 - 2 * DAY } } },
    ],
  });
  put("ads_information/ads_and_topics/posts_viewed.json", {
    impressions_history_posts_seen: [
      { string_map_data: { Author: { value: "dave" }, Time: { timestamp: T0 - DAY } } },
      { string_map_data: { Author: { value: "zed" }, Time: { timestamp: T0 - DAY } } },
    ],
  });
  put("ads_information/ads_and_topics/videos_watched.json", {
    impressions_history_videos_watched: [{ string_map_data: { Author: { value: "zed" }, Time: { timestamp: T0 - DAY } } }],
  });
  put("ads_information/ads_and_topics/your_topics.json", {
    topics_your_topics: [{ string_map_data: { Name: { value: "Travel" } } }, { string_map_data: { Name: { value: "Cooking" } } }],
  });
  put("ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.json", {
    ig_custom_audiences_all_types: [
      { advertiser_name: "BrandCo", has_data_file_custom_audience: true, has_remarketing_custom_audience: false, has_in_person_store_visit: false },
      { advertiser_name: "OtherShop", has_data_file_custom_audience: false, has_remarketing_custom_audience: true, has_in_person_store_visit: false },
    ],
  });

  put("personal_information/personal_information/personal_information.json", {
    profile_user: [
      {
        string_map_data: {
          Username: { value: "testuser" },
          Name: { value: "Test User" },
          Email: { value: "test@example.com" },
          Bio: { value: mojibake("Coffee ☕ and code") },
          "Private Account": { value: "False" },
        },
      },
    ],
  });
  put("security_and_login_information/login_and_account_creation/signup_details.json", {
    account_history_registration_info: [
      { string_map_data: { Username: { value: "testuser" }, "IP Address": { value: "1.2.3.4" }, Time: { timestamp: T0 - 800 * DAY }, Device: { value: "iPhone" } } },
    ],
  });
  const logins = [];
  for (let i = 0; i < 20; i++) {
    logins.push({
      title: "Login",
      string_map_data: {
        "IP Address": { value: i % 3 === 0 ? "10.0.0.1" : "10.0.0.2" },
        "User Agent": { value: i % 2 ? "Instagram 300.0 (iPhone14,2; iOS 17_0)" : "Mozilla/5.0 (Windows NT 10.0) Chrome/120" },
        Time: { timestamp: T0 - i * 3 * DAY },
        "Language Code": { value: "en" },
      },
    });
  }
  put("security_and_login_information/login_and_account_creation/login_activity.json", { account_history_login_history: logins });
  put("security_and_login_information/device_information/devices.json", {
    devices_devices: [{ string_map_data: { "User Agent": { value: "Instagram 300.0 Android" }, "Last Login": { timestamp: T0 - DAY } } }],
  });
  put("security_and_login_information/login_and_account_creation/password_change_activity.json", {
    account_history_password_change_history: [{ string_map_data: { Time: { timestamp: T0 - 60 * DAY } } }],
  });

  // Noise that must be ignored.
  files.set("instagram-testuser-2026-01-01-abc/media/posts/202311/a.jpg", "ÿØbinary");
  files.set("instagram-testuser-2026-01-01-abc/random/unknown.json", JSON.stringify({ hello: "world" }));
  files.set("instagram-testuser-2026-01-01-abc/connections/followers_and_following/followers_2.json", "{not json");
  return files;
}
