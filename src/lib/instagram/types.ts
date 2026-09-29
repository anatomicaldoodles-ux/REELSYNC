/**
 * Normalised representation of an Instagram "Download your information" export
 * (JSON format). Everything here is derived from the JSON files only; media is
 * never read. Timestamps are Unix seconds unless the field name ends in `Ms`.
 */

export type Sec = number;

export interface Person {
  username: string;
  href?: string;
  /** When the relationship was created (follow time), if the export includes it. */
  at?: Sec;
}

/** A dated interaction with another account (like, save, view, ...). */
export interface Interaction {
  /** Username of the account on the receiving end (media owner, advertiser, ...). */
  author: string;
  at: Sec;
  href?: string;
  value?: string;
}

export interface CommentItem {
  /** Owner of the media that was commented on. */
  mediaOwner: string;
  text: string;
  at: Sec;
  kind: "post" | "reel";
}

export type StoryInteractionKind =
  | "like"
  | "poll"
  | "quiz"
  | "question"
  | "emoji_slider"
  | "countdown"
  | "other";

export interface StoryInteraction {
  kind: StoryInteractionKind;
  author: string;
  at: Sec;
  value?: string;
}

export type ContentKind =
  | "post"
  | "reel"
  | "story"
  | "archived"
  | "igtv"
  | "profile_photo"
  | "deleted";

export interface ContentItem {
  kind: ContentKind;
  at: Sec;
  caption?: string;
  mediaCount: number;
}

export type MessageType =
  | "text"
  | "share"
  | "photo"
  | "video"
  | "audio"
  | "sticker"
  | "gif"
  | "call"
  | "attachment"
  | "reaction_notice"
  | "unsent"
  | "other";

export interface Message {
  sender: string;
  atMs: number;
  type: MessageType;
  text?: string;
  /** Domain / kind of a shared link, e.g. "reel", "post", "instagram", "external". */
  shareKind?: string;
  reactions: { actor: string; reaction: string }[];
}

export interface Thread {
  title: string;
  participants: string[];
  isGroup: boolean;
  isRequest: boolean;
  messages: Message[];
}

export interface SearchItem {
  query: string;
  at: Sec;
}

export interface Advertiser {
  name: string;
  hasDataFileAudience: boolean;
  hasRemarketingAudience: boolean;
  hasInPersonStoreVisit: boolean;
}

export interface LoginEvent {
  at: Sec;
  ip?: string;
  userAgent?: string;
  language?: string;
}

export interface Device {
  userAgent: string;
  lastLogin?: Sec;
}

export interface ProfileChange {
  field: string;
  previous?: string;
  next?: string;
  at?: Sec;
}

export interface Dataset {
  account: {
    username?: string;
    name?: string;
    email?: string;
    bio?: string;
    privateAccount?: boolean;
    createdAt?: Sec;
    signupIp?: string;
    signupDevice?: string;
    basedIn?: string;
    profileBasedIn?: string;
  };
  relationships: {
    followers: Person[];
    following: Person[];
    closeFriends: Person[];
    blocked: Person[];
    pendingSent: Person[];
    receivedRequests: Person[];
    recentlyUnfollowed: Person[];
    restricted: Person[];
    hideStoryFrom: Person[];
    dismissedSuggestions: Person[];
  };
  likes: {
    posts: Interaction[];
    comments: Interaction[];
  };
  comments: CommentItem[];
  saved: {
    items: Interaction[];
    collections: string[];
  };
  stories: StoryInteraction[];
  content: ContentItem[];
  messages: Thread[];
  searches: {
    profiles: SearchItem[];
    keywords: SearchItem[];
    hashtags: SearchItem[];
  };
  browsing: {
    adsViewed: Interaction[];
    adsClicked: Interaction[];
    postsViewed: Interaction[];
    videosWatched: Interaction[];
    suggestedAccountsViewed: Interaction[];
    notInterested: Interaction[];
  };
  interests: {
    topics: string[];
    recommendedTopics: string[];
    advertisers: Advertiser[];
    locationsOfInterest: string[];
  };
  security: {
    logins: LoginEvent[];
    logouts: LoginEvent[];
    devices: Device[];
    passwordChanges: Sec[];
    lastKnownLocation?: string;
    profileChanges: ProfileChange[];
    activeApps: string[];
    expiredApps: string[];
  };
  meta: {
    filesTotal: number;
    filesMatched: string[];
    warnings: string[];
    earliest?: Sec;
    latest?: Sec;
  };
}

export function emptyDataset(): Dataset {
  return {
    account: {},
    relationships: {
      followers: [],
      following: [],
      closeFriends: [],
      blocked: [],
      pendingSent: [],
      receivedRequests: [],
      recentlyUnfollowed: [],
      restricted: [],
      hideStoryFrom: [],
      dismissedSuggestions: [],
    },
    likes: { posts: [], comments: [] },
    comments: [],
    saved: { items: [], collections: [] },
    stories: [],
    content: [],
    messages: [],
    searches: { profiles: [], keywords: [], hashtags: [] },
    browsing: {
      adsViewed: [],
      adsClicked: [],
      postsViewed: [],
      videosWatched: [],
      suggestedAccountsViewed: [],
      notInterested: [],
    },
    interests: {
      topics: [],
      recommendedTopics: [],
      advertisers: [],
      locationsOfInterest: [],
    },
    security: {
      logins: [],
      logouts: [],
      devices: [],
      passwordChanges: [],
      profileChanges: [],
      activeApps: [],
      expiredApps: [],
    },
    meta: { filesTotal: 0, filesMatched: [], warnings: [] },
  };
}
