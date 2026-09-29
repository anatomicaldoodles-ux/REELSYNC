import { fixEncodingDeep } from "./encoding";
import {
  anyTimestamp,
  entriesOf,
  entryUsername,
  firstListItem,
  isObject,
  mapItem,
  mapValue,
  normaliseUsername,
  toSeconds,
  usernameFromHref,
  type Entry,
} from "./json";
import {
  emptyDataset,
  type Advertiser,
  type ContentItem,
  type ContentKind,
  type Dataset,
  type Interaction,
  type LoginEvent,
  type Message,
  type MessageType,
  type Person,
  type SearchItem,
  type StoryInteraction,
  type StoryInteractionKind,
  type Thread,
} from "./types";

/** Path (lower-cased, forward slashes) -> decoded file text. */
export type ExportFiles = Map<string, string>;

export interface ParseOptions {
  /** Called with a 0..1 progress fraction as files are processed. */
  onProgress?: (fraction: number) => void;
}

interface Matcher {
  key: string;
  test: RegExp;
  handle: (json: unknown, ds: Dataset, path: string) => void;
}

const person = (e: Entry): Person | undefined => {
  const username = entryUsername(e);
  if (!username) return undefined;
  const li = firstListItem(e);
  return { username, href: li?.href, at: toSeconds(li?.timestamp) };
};

const people = (json: unknown): Person[] =>
  entriesOf(json).map(person).filter((p): p is Person => !!p);

/** Entries whose `title` is the author and whose list item carries the timestamp. */
const titledInteractions = (json: unknown): Interaction[] => {
  const out: Interaction[] = [];
  for (const e of entriesOf(json)) {
    const li = firstListItem(e);
    const at = toSeconds(li?.timestamp);
    const author =
      normaliseUsername(typeof e.title === "string" ? e.title : undefined) ??
      normaliseUsername(usernameFromHref(li?.href));
    if (!author || !at) continue;
    out.push({ author, at, href: li?.href, value: li?.value });
  }
  return out;
};

/** Entries with `string_map_data` where the author and time live under known keys. */
const mappedInteractions = (
  json: unknown,
  authorKeys: string[],
  timeKeys: string[] = ["Time"],
): Interaction[] => {
  const out: Interaction[] = [];
  for (const e of entriesOf(json)) {
    const author =
      normaliseUsername(mapValue(e, ...authorKeys)) ??
      normaliseUsername(typeof e.title === "string" ? e.title : undefined);
    const at = toSeconds(mapItem(e, ...timeKeys)?.timestamp) ?? toSeconds(anyTimestamp(e));
    if (!author || !at) continue;
    out.push({ author, at });
  }
  return out;
};

const searches = (json: unknown): SearchItem[] => {
  const out: SearchItem[] = [];
  for (const e of entriesOf(json)) {
    const query = mapValue(e, "Search", "Suche", "Búsqueda") ?? firstListItem(e)?.value;
    const at = toSeconds(mapItem(e, "Time")?.timestamp) ?? toSeconds(anyTimestamp(e));
    if (!query || !at) continue;
    out.push({ query: query.trim(), at });
  }
  return out;
};

const contentItems = (json: unknown, kind: ContentKind): ContentItem[] => {
  const out: ContentItem[] = [];
  const push = (raw: Record<string, unknown>) => {
    const media = Array.isArray(raw.media) ? raw.media.filter(isObject) : undefined;
    const first = media?.[0];
    const at =
      toSeconds(raw.creation_timestamp as number | undefined) ??
      toSeconds(first?.creation_timestamp as number | undefined);
    if (!at) return;
    const captionRaw =
      (typeof raw.title === "string" && raw.title) ||
      (typeof first?.title === "string" && first.title) ||
      undefined;
    out.push({
      kind,
      at,
      caption: captionRaw ? captionRaw.trim() : undefined,
      mediaCount: media ? Math.max(1, media.length) : 1,
    });
  };
  for (const e of entriesOf(json)) push(e);
  return out;
};

const storyInteractions = (json: unknown, kind: StoryInteractionKind): StoryInteraction[] =>
  titledInteractions(json).map((i) => ({ kind, author: i.author, at: i.at, value: i.value }));

const stringsFromEntries = (json: unknown, ...keys: string[]): string[] => {
  const out: string[] = [];
  for (const e of entriesOf(json)) {
    const v = mapValue(e, ...keys) ?? (typeof e.title === "string" ? e.title : undefined);
    if (v) out.push(v.trim());
  }
  return out;
};

const loginEvents = (json: unknown): LoginEvent[] => {
  const out: LoginEvent[] = [];
  for (const e of entriesOf(json)) {
    const at = toSeconds(mapItem(e, "Time")?.timestamp) ?? toSeconds(anyTimestamp(e));
    if (!at) continue;
    out.push({
      at,
      ip: mapValue(e, "IP Address"),
      userAgent: mapValue(e, "User Agent"),
      language: mapValue(e, "Language Code"),
    });
  }
  return out;
};

function classifyMessage(raw: Record<string, unknown>): {
  type: MessageType;
  text?: string;
  shareKind?: string;
} {
  const content = typeof raw.content === "string" ? raw.content.trim() : undefined;
  if (raw.is_unsent === true) return { type: "unsent" };
  if (isObject(raw.share)) {
    const link = typeof raw.share.link === "string" ? raw.share.link : "";
    let shareKind = "external";
    if (/instagram\.com\/reel/.test(link)) shareKind = "reel";
    else if (/instagram\.com\/p\//.test(link)) shareKind = "post";
    else if (/instagram\.com\/stories/.test(link)) shareKind = "story";
    else if (/instagram\.com/.test(link)) shareKind = "instagram";
    return { type: "share", shareKind, text: content };
  }
  if (Array.isArray(raw.photos) && raw.photos.length) return { type: "photo" };
  if (Array.isArray(raw.videos) && raw.videos.length) return { type: "video" };
  if (Array.isArray(raw.audio_files) && raw.audio_files.length) return { type: "audio" };
  if (Array.isArray(raw.gifs) && raw.gifs.length) return { type: "gif" };
  if (isObject(raw.sticker)) return { type: "sticker" };
  if (typeof raw.call_duration === "number") return { type: "call" };
  if (content) {
    if (/^(reacted .+ to your message|liked a message)\s*$/i.test(content)) {
      return { type: "reaction_notice", text: content };
    }
    if (/sent an attachment\.?$/i.test(content)) return { type: "attachment" };
    return { type: "text", text: content };
  }
  return { type: "other" };
}

function parseThread(json: unknown, path: string): Thread | undefined {
  if (!isObject(json)) return undefined;
  const participants = Array.isArray(json.participants)
    ? json.participants
        .filter(isObject)
        .map((p) => (typeof p.name === "string" ? p.name.trim() : ""))
        .filter(Boolean)
    : [];
  const rawMessages = Array.isArray(json.messages) ? json.messages.filter(isObject) : [];
  const messages: Message[] = [];
  for (const raw of rawMessages) {
    const sender = typeof raw.sender_name === "string" ? raw.sender_name.trim() : "";
    const atMs = typeof raw.timestamp_ms === "number" ? raw.timestamp_ms : undefined;
    if (!sender || !atMs) continue;
    const { type, text, shareKind } = classifyMessage(raw);
    const reactions = Array.isArray(raw.reactions)
      ? raw.reactions
          .filter(isObject)
          .map((r) => ({
            actor: typeof r.actor === "string" ? r.actor.trim() : "",
            reaction: typeof r.reaction === "string" ? r.reaction : "",
          }))
          .filter((r) => r.actor && r.reaction)
      : [];
    messages.push({ sender, atMs, type, text, shareKind, reactions });
  }
  messages.sort((a, b) => a.atMs - b.atMs);
  const title = typeof json.title === "string" && json.title.trim() ? json.title.trim() : participants[0] ?? "Unknown";
  return {
    title,
    participants,
    isGroup: participants.length > 2,
    isRequest: /\/message_requests\//.test(path),
    messages,
  };
}

const rel = (key: keyof Dataset["relationships"], test: RegExp): Matcher => ({
  key,
  test,
  handle: (json, ds) => {
    ds.relationships[key].push(...people(json));
  },
});

const MATCHERS: Matcher[] = [
  // --- Relationships -------------------------------------------------------
  rel("followers", /followers(_\d+)?\.json$/),
  rel("following", /\/following\.json$/),
  rel("closeFriends", /close_friends\.json$/),
  rel("blocked", /blocked_(accounts|profiles)\.json$/),
  rel("pendingSent", /pending_follow_requests\.json$/),
  rel("receivedRequests", /follow_requests_you('|’)?ve_received\.json$/),
  rel("recentlyUnfollowed", /recently_unfollowed_(accounts|profiles)\.json$/),
  rel("restricted", /restricted_(accounts|profiles)\.json$/),
  rel("hideStoryFrom", /hide_story_from\.json$/),
  rel("dismissedSuggestions", /removed_suggestions\.json$/),

  // --- Likes, comments, saves, stories ----------------------------------------
  {
    key: "likes.posts",
    test: /liked_posts\.json$/,
    handle: (json, ds) => ds.likes.posts.push(...titledInteractions(json)),
  },
  {
    key: "likes.comments",
    test: /liked_comments\.json$/,
    handle: (json, ds) => ds.likes.comments.push(...titledInteractions(json)),
  },
  {
    key: "comments.posts",
    test: /post_comments(_\d+)?\.json$/,
    handle: (json, ds) => ds.comments.push(...parseComments(json, "post")),
  },
  {
    key: "comments.reels",
    test: /reels_comments\.json$/,
    handle: (json, ds) => ds.comments.push(...parseComments(json, "reel")),
  },
  {
    key: "saved.posts",
    test: /saved_posts\.json$/,
    handle: (json, ds) => {
      for (const e of entriesOf(json)) {
        const author = normaliseUsername(typeof e.title === "string" ? e.title : undefined);
        const item = mapItem(e, "Saved on") ?? firstListItem(e);
        const at = toSeconds(item?.timestamp) ?? toSeconds(anyTimestamp(e));
        if (!author || !at) continue;
        ds.saved.items.push({ author, at, href: item?.href });
      }
    },
  },
  {
    key: "saved.collections",
    test: /saved_collections\.json$/,
    handle: (json, ds) => {
      const names = new Set<string>();
      for (const e of entriesOf(json)) {
        const name = mapValue(e, "Name") ?? (typeof e.title === "string" ? e.title : undefined);
        if (name) names.add(name.trim());
      }
      ds.saved.collections.push(...names);
    },
  },
  {
    key: "stories.likes",
    test: /story_likes\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "like")),
  },
  {
    key: "stories.polls",
    test: /story_interactions\/polls\.json$|\/polls\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "poll")),
  },
  {
    key: "stories.quizzes",
    test: /\/quizzes\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "quiz")),
  },
  {
    key: "stories.questions",
    test: /story_interactions\/questions\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "question")),
  },
  {
    key: "stories.sliders",
    test: /emoji_sliders\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "emoji_slider")),
  },
  {
    key: "stories.countdowns",
    test: /\/countdowns\.json$/,
    handle: (json, ds) => ds.stories.push(...storyInteractions(json, "countdown")),
  },

  // --- Your own content -------------------------------------------------------
  {
    key: "content.posts",
    test: /content\/posts(_\d+)?\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "post")),
  },
  {
    key: "content.reels",
    test: /content\/reels\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "reel")),
  },
  {
    key: "content.stories",
    test: /content\/stories\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "story")),
  },
  {
    key: "content.archived",
    test: /archived_posts\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "archived")),
  },
  {
    key: "content.igtv",
    test: /igtv_videos\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "igtv")),
  },
  {
    key: "content.profilePhotos",
    test: /profile_photos\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "profile_photo")),
  },
  {
    key: "content.deleted",
    test: /recently_deleted_content\.json$/,
    handle: (json, ds) => ds.content.push(...contentItems(json, "deleted")),
  },

  // --- Messages ----------------------------------------------------------------
  {
    key: "messages",
    test: /messages\/(inbox|message_requests)\/[^/]+\/message(_\d+)?\.json$/,
    handle: (json, ds, path) => {
      const t = parseThread(json, path);
      if (t) ds.messages.push(t);
    },
  },

  // --- Searches ----------------------------------------------------------------
  {
    key: "searches.profiles",
    test: /profile_searches\.json$/,
    handle: (json, ds) => ds.searches.profiles.push(...searches(json)),
  },
  {
    key: "searches.keywords",
    test: /word_or_phrase_searches\.json$/,
    handle: (json, ds) => ds.searches.keywords.push(...searches(json)),
  },
  {
    key: "searches.hashtags",
    test: /tag_searches\.json$/,
    handle: (json, ds) => ds.searches.hashtags.push(...searches(json)),
  },

  // --- Ads, browsing, interests --------------------------------------------------
  {
    key: "browsing.adsViewed",
    test: /ads_viewed\.json$/,
    handle: (json, ds) => ds.browsing.adsViewed.push(...mappedInteractions(json, ["Author"])),
  },
  {
    key: "browsing.adsClicked",
    test: /ads_clicked\.json$/,
    handle: (json, ds) => ds.browsing.adsClicked.push(...titledInteractions(json)),
  },
  {
    key: "browsing.postsViewed",
    test: /posts_viewed\.json$/,
    handle: (json, ds) => ds.browsing.postsViewed.push(...mappedInteractions(json, ["Author"])),
  },
  {
    key: "browsing.videosWatched",
    test: /videos_watched\.json$/,
    handle: (json, ds) => ds.browsing.videosWatched.push(...mappedInteractions(json, ["Author"])),
  },
  {
    key: "browsing.suggested",
    test: /suggested_(accounts|profiles)_viewed\.json$/,
    handle: (json, ds) =>
      ds.browsing.suggestedAccountsViewed.push(...mappedInteractions(json, ["Username", "Author"])),
  },
  {
    key: "browsing.notInterested",
    test: /posts_not_interested\.json$/,
    handle: (json, ds) =>
      ds.browsing.notInterested.push(...mappedInteractions(json, ["Author", "Username"])),
  },
  {
    key: "interests.topics",
    test: /ads_and_topics\/your_topics\.json$|your_topics\/your_topics\.json$/,
    handle: (json, ds) => ds.interests.topics.push(...stringsFromEntries(json, "Name")),
  },
  {
    key: "interests.recommendedTopics",
    test: /recommended_topics\.json$/,
    handle: (json, ds) => ds.interests.recommendedTopics.push(...stringsFromEntries(json, "Name")),
  },
  {
    key: "interests.advertisers",
    test: /advertisers_using_your_activity_or_information\.json$/,
    handle: (json, ds) => {
      for (const e of entriesOf(json)) {
        const name = typeof e.advertiser_name === "string" ? e.advertiser_name.trim() : "";
        if (!name) continue;
        const adv: Advertiser = {
          name,
          hasDataFileAudience: e.has_data_file_custom_audience === true,
          hasRemarketingAudience: e.has_remarketing_custom_audience === true,
          hasInPersonStoreVisit: e.has_in_person_store_visit === true,
        };
        ds.interests.advertisers.push(adv);
      }
    },
  },
  {
    key: "interests.locations",
    test: /locations_of_interest\.json$/,
    handle: (json, ds) => {
      if (!isObject(json)) return;
      const labels = Array.isArray(json.label_values) ? json.label_values.filter(isObject) : [];
      for (const l of labels) {
        const vec = Array.isArray(l.vec) ? l.vec.filter(isObject) : [];
        for (const v of vec) {
          if (typeof v.value === "string" && v.value.trim()) {
            ds.interests.locationsOfInterest.push(v.value.trim());
          }
        }
      }
    },
  },

  // --- Personal information ------------------------------------------------------
  {
    key: "account.profile",
    test: /personal_information\/personal_information\.json$/,
    handle: (json, ds) => {
      const e = entriesOf(json, "profile_user")[0];
      if (!e) return;
      ds.account.username ??= normaliseUsername(mapValue(e, "Username", "Benutzername", "Nombre de usuario"));
      ds.account.name ??= mapValue(e, "Name", "Nombre");
      ds.account.email ??= mapValue(e, "Email", "E-Mail");
      ds.account.bio ??= mapValue(e, "Bio", "Biografie", "Biografía");
      const priv = mapValue(e, "Private Account", "Private account");
      if (priv) ds.account.privateAccount = /^(true|yes|ja|sí|si)$/i.test(priv);
    },
  },
  {
    key: "account.signup",
    test: /signup_details\.json$/,
    handle: (json, ds) => {
      const e = entriesOf(json)[0];
      if (!e) return;
      ds.account.createdAt = toSeconds(mapItem(e, "Time")?.timestamp) ?? toSeconds(anyTimestamp(e));
      ds.account.signupIp = mapValue(e, "IP Address");
      ds.account.signupDevice = mapValue(e, "Device");
      ds.account.username ??= normaliseUsername(mapValue(e, "Username"));
      ds.account.email ??= mapValue(e, "Email");
    },
  },
  {
    key: "account.basedIn",
    test: /account_based_in\.json$/,
    handle: (json, ds) => {
      ds.account.basedIn ??= stringsFromEntries(json, "City Name", "City")[0];
    },
  },
  {
    key: "account.profileBasedIn",
    test: /profile_based_in\.json$/,
    handle: (json, ds) => {
      ds.account.profileBasedIn ??= stringsFromEntries(json, "City Name", "City")[0];
    },
  },
  {
    key: "account.profileChanges",
    test: /profile_changes\.json$/,
    handle: (json, ds) => {
      for (const e of entriesOf(json)) {
        const field = mapValue(e, "Changed");
        if (!field) continue;
        ds.security.profileChanges.push({
          field,
          previous: mapValue(e, "Previous Value"),
          next: mapValue(e, "New Value"),
          at: toSeconds(mapItem(e, "Change Date")?.timestamp) ?? toSeconds(anyTimestamp(e)),
        });
      }
    },
  },

  // --- Security ---------------------------------------------------------------------
  {
    key: "security.logins",
    test: /login_activity\.json$/,
    handle: (json, ds) => ds.security.logins.push(...loginEvents(json)),
  },
  {
    key: "security.logouts",
    test: /logout_activity\.json$/,
    handle: (json, ds) => ds.security.logouts.push(...loginEvents(json)),
  },
  {
    key: "security.devices",
    test: /device_information\/devices\.json$/,
    handle: (json, ds) => {
      for (const e of entriesOf(json)) {
        const userAgent = mapValue(e, "User Agent");
        if (!userAgent) continue;
        ds.security.devices.push({
          userAgent,
          lastLogin: toSeconds(mapItem(e, "Last Login")?.timestamp) ?? toSeconds(anyTimestamp(e)),
        });
      }
    },
  },
  {
    key: "security.passwordChanges",
    test: /password_change_activity\.json$/,
    handle: (json, ds) => {
      for (const e of entriesOf(json)) {
        const at = toSeconds(anyTimestamp(e));
        if (at) ds.security.passwordChanges.push(at);
      }
    },
  },
  {
    key: "security.lastKnownLocation",
    test: /last_known_location\.json$/,
    handle: (json, ds) => {
      const e = entriesOf(json)[0];
      if (!e) return;
      ds.security.lastKnownLocation =
        mapValue(e, "Imprecise Location", "Precise Location", "Location") ?? undefined;
    },
  },
  {
    key: "security.activeApps",
    test: /apps_and_websites\/active_apps\.json$/,
    handle: (json, ds) => ds.security.activeApps.push(...stringsFromEntries(json, "Name")),
  },
  {
    key: "security.expiredApps",
    test: /apps_and_websites\/expired_apps\.json$/,
    handle: (json, ds) => ds.security.expiredApps.push(...stringsFromEntries(json, "Name")),
  },
];

function parseComments(json: unknown, kind: "post" | "reel") {
  const out: Dataset["comments"] = [];
  for (const e of entriesOf(json)) {
    // 2023+ format: string_map_data with Comment / Media Owner / Time.
    let text = mapValue(e, "Comment", "Kommentar", "Comentario");
    let owner = normaliseUsername(mapValue(e, "Media Owner", "Medieninhaber"));
    let at = toSeconds(mapItem(e, "Time")?.timestamp);
    if (!text) {
      // Older format: title = media owner, list value = comment text.
      const li = firstListItem(e);
      text = li?.value;
      owner ??= normaliseUsername(typeof e.title === "string" ? e.title : undefined);
      at ??= toSeconds(li?.timestamp);
    }
    at ??= toSeconds(anyTimestamp(e));
    if (!text || !at) continue;
    out.push({ mediaOwner: owner ?? "unknown", text: text.trim(), at, kind });
  }
  return out;
}

/** Recognised export file? Used by the browser-side ZIP filter. */
export function isRelevantFile(path: string): boolean {
  const p = path.toLowerCase().replace(/\\/g, "/");
  if (!p.endsWith(".json")) return false;
  return MATCHERS.some((m) => m.test.test(p));
}

/**
 * Parses the JSON files of an export into a Dataset. Unknown files are ignored,
 * unreadable files produce a warning instead of throwing.
 */
export function parseExport(files: ExportFiles, options: ParseOptions = {}): Dataset {
  const ds = emptyDataset();
  ds.meta.filesTotal = files.size;
  const paths = [...files.keys()];
  let done = 0;
  for (const originalPath of paths) {
    const path = originalPath.toLowerCase().replace(/\\/g, "/");
    done++;
    if (options.onProgress && done % 25 === 0) options.onProgress(done / paths.length);
    if (!path.endsWith(".json")) continue;
    const matcher = MATCHERS.find((m) => m.test.test(path));
    if (!matcher) continue;
    let json: unknown;
    try {
      json = fixEncodingDeep(JSON.parse(files.get(originalPath) ?? ""));
    } catch {
      ds.meta.warnings.push(`Could not parse ${originalPath}`);
      continue;
    }
    try {
      matcher.handle(json, ds, path);
      ds.meta.filesMatched.push(originalPath);
    } catch (err) {
      ds.meta.warnings.push(`Failed to read ${originalPath}: ${(err as Error).message}`);
    }
  }
  options.onProgress?.(1);
  finalise(ds);
  return ds;
}

function finalise(ds: Dataset) {
  // Deduplicate relationship lists (exports can contain repeated entries).
  for (const key of Object.keys(ds.relationships) as (keyof Dataset["relationships"])[]) {
    const seen = new Set<string>();
    ds.relationships[key] = ds.relationships[key].filter((p) => {
      const k = p.username.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  ds.content.sort((a, b) => a.at - b.at);
  ds.messages.sort((a, b) => (b.messages.at(-1)?.atMs ?? 0) - (a.messages.at(-1)?.atMs ?? 0));

  // Overall time range across the most reliable dated collections.
  let earliest = Number.POSITIVE_INFINITY;
  let latest = 0;
  const consider = (at?: number) => {
    if (!at) return;
    if (at < earliest) earliest = at;
    if (at > latest) latest = at;
  };
  ds.likes.posts.forEach((i) => consider(i.at));
  ds.comments.forEach((i) => consider(i.at));
  ds.content.forEach((i) => consider(i.at));
  ds.security.logins.forEach((i) => consider(i.at));
  ds.messages.forEach((t) => t.messages.forEach((m) => consider(Math.floor(m.atMs / 1000))));
  ds.relationships.followers.forEach((p) => consider(p.at));
  if (latest > 0) {
    ds.meta.earliest = earliest;
    ds.meta.latest = latest;
  }
  // Signup date is the true earliest if known.
  if (ds.account.createdAt && ds.meta.earliest && ds.account.createdAt < ds.meta.earliest) {
    ds.meta.earliest = ds.account.createdAt;
  }
}
