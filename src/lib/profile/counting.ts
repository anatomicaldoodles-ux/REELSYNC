export interface Ranked {
  name: string;
  count: number;
}

export function tally(values: Iterable<string>): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

export function top(counts: Map<string, number>, limit: number): Ranked[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function topOf(values: Iterable<string>, limit: number): Ranked[] {
  return top(tally(values), limit);
}

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;
const MENTION_RE = /@([A-Za-z0-9._]+)/g;

export function hasEmoji(s: string): boolean {
  return EMOJI_RE.test(s);
}

export function hashtags(s: string): string[] {
  return [...s.matchAll(HASHTAG_RE)].map((m) => m[1].toLowerCase());
}

export function mentions(s: string): string[] {
  return [...s.matchAll(MENTION_RE)].map((m) => m[1].toLowerCase().replace(/\.$/, ""));
}

export function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Extracts the leading emoji characters of a string (used for reactions). */
export function emojiOnly(s: string): string {
  return [...s].filter((ch) => EMOJI_RE.test(ch) || /[‍️]/.test(ch)).join("");
}

export function percent(part: number, whole: number, digits = 1): number {
  if (whole <= 0) return 0;
  const f = 10 ** digits;
  return Math.round((part / whole) * 100 * f) / f;
}
