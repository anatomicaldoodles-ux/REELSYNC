/**
 * Small, tolerant accessors for the loosely-typed shapes found in the export.
 * Most files are `{ some_key: Entry[] }` where an Entry has optional `title`,
 * `string_list_data` and `string_map_data`.
 */

export type Json = unknown;

export interface StringListItem {
  href?: string;
  value?: string;
  timestamp?: number;
}

export interface Entry {
  title?: string;
  string_list_data?: StringListItem[];
  string_map_data?: Record<string, StringListItem>;
  media_list_data?: unknown[];
  [key: string]: unknown;
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Returns the entries array of a file: the root array, or the first array-valued key. */
export function entriesOf(json: Json, preferredKey?: string): Entry[] {
  if (Array.isArray(json)) return json.filter(isObject) as Entry[];
  if (!isObject(json)) return [];
  if (preferredKey && Array.isArray(json[preferredKey])) {
    return (json[preferredKey] as unknown[]).filter(isObject) as Entry[];
  }
  for (const value of Object.values(json)) {
    if (Array.isArray(value)) return value.filter(isObject) as Entry[];
  }
  return [];
}

export function firstListItem(e: Entry): StringListItem | undefined {
  const list = e.string_list_data;
  if (Array.isArray(list) && list.length > 0 && isObject(list[0])) {
    return list[0] as StringListItem;
  }
  return undefined;
}

/** Looks up a `string_map_data` key case-insensitively, trying several names. */
export function mapItem(e: Entry, ...keys: string[]): StringListItem | undefined {
  const map = e.string_map_data;
  if (!isObject(map)) return undefined;
  const lowered = new Map<string, StringListItem>();
  for (const [k, v] of Object.entries(map)) {
    if (isObject(v)) lowered.set(k.toLowerCase(), v as StringListItem);
  }
  for (const key of keys) {
    const hit = lowered.get(key.toLowerCase());
    if (hit) return hit;
  }
  return undefined;
}

export function mapValue(e: Entry, ...keys: string[]): string | undefined {
  const item = mapItem(e, ...keys);
  const v = item?.value;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** First numeric timestamp found anywhere in the entry's map or list data. */
export function anyTimestamp(e: Entry): number | undefined {
  const list = firstListItem(e);
  if (list && typeof list.timestamp === "number" && list.timestamp > 0) {
    return list.timestamp;
  }
  const map = e.string_map_data;
  if (isObject(map)) {
    for (const v of Object.values(map)) {
      if (isObject(v) && typeof v.timestamp === "number" && v.timestamp > 0) {
        return v.timestamp;
      }
    }
  }
  return undefined;
}

export function usernameFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const m = href.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return m ? m[1] : undefined;
}

export function normaliseUsername(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim().replace(/^@/, "");
  return s.length > 0 ? s : undefined;
}

/** Username of a relationship-style entry (followers, following, blocked...). */
export function entryUsername(e: Entry): string | undefined {
  const li = firstListItem(e);
  return (
    normaliseUsername(li?.value && !/^[^A-Za-z0-9._]+$/.test(li.value) ? li.value : undefined) ??
    normaliseUsername(usernameFromHref(li?.href)) ??
    normaliseUsername(typeof e.title === "string" ? e.title : undefined)
  );
}

export function toSeconds(ts: number | undefined): number | undefined {
  if (typeof ts !== "number" || !Number.isFinite(ts) || ts <= 0) return undefined;
  // Some fields are milliseconds.
  return ts > 1e12 ? Math.floor(ts / 1000) : Math.floor(ts);
}
