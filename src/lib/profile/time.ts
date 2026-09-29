/**
 * Time bucketing in the viewer's time zone. The export stores UTC timestamps;
 * hour-of-day and weekday statistics only make sense in local time. Offsets are
 * cached per UTC day so bucketing a few hundred thousand events stays fast.
 */

export interface LocalParts {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  /** 0-23 */
  hour: number;
  /** 0 = Monday ... 6 = Sunday */
  weekday: number;
}

export class LocalClock {
  private offsets = new Map<number, number>();
  private fmt: Intl.DateTimeFormat | undefined;
  readonly timeZone: string;

  constructor(timeZone?: string) {
    let tz = timeZone || "UTC";
    try {
      this.fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
    } catch {
      tz = "UTC";
      this.fmt = undefined;
    }
    this.timeZone = tz;
  }

  /** Offset in seconds to add to a UTC timestamp to get "local wall time as UTC". */
  private offsetFor(sec: number): number {
    if (!this.fmt) return 0;
    const dayIndex = Math.floor(sec / 86400);
    const cached = this.offsets.get(dayIndex);
    if (cached !== undefined) return cached;
    const noon = dayIndex * 86400 + 43200;
    const parts = this.fmt.formatToParts(new Date(noon * 1000));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) / 1000;
    const offset = wall - noon;
    this.offsets.set(dayIndex, offset);
    return offset;
  }

  parts(sec: number): LocalParts {
    const shifted = new Date((sec + this.offsetFor(sec)) * 1000);
    const jsDay = shifted.getUTCDay(); // 0 = Sunday
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      weekday: (jsDay + 6) % 7,
    };
  }

  monthKey(sec: number): string {
    const p = this.parts(sec);
    return `${p.year}-${String(p.month).padStart(2, "0")}`;
  }

  dayKey(sec: number): string {
    const p = this.parts(sec);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }
}

export interface MonthPoint {
  month: string;
  count: number;
}

/** Counts per month, with empty months filled in between the first and last. */
export function byMonth(timestamps: Iterable<number>, clock: LocalClock): MonthPoint[] {
  const counts = new Map<string, number>();
  for (const t of timestamps) {
    const k = clock.monthKey(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return fillMonths(counts);
}

export function fillMonths(counts: Map<string, number>): MonthPoint[] {
  const keys = [...counts.keys()].sort();
  if (keys.length === 0) return [];
  const out: MonthPoint[] = [];
  let [y, m] = keys[0].split("-").map(Number);
  const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
  // Guard against absurd ranges (bad timestamps) by capping at 40 years.
  let guard = 0;
  while ((y < ly || (y === ly && m <= lm)) && guard++ < 480) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ month: k, count: counts.get(k) ?? 0 });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function byYear(timestamps: Iterable<number>, clock: LocalClock): Map<number, number> {
  const counts = new Map<number, number>();
  for (const t of timestamps) {
    const y = clock.parts(t).year;
    counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  return counts;
}

/** 7 x 24 grid of counts, rows = Monday..Sunday, columns = hour 0..23. */
export type Heatmap = number[][];

export function emptyHeatmap(): Heatmap {
  return Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
}

export function heatmap(timestamps: Iterable<number>, clock: LocalClock): Heatmap {
  const grid = emptyHeatmap();
  for (const t of timestamps) {
    const p = clock.parts(t);
    grid[p.weekday][p.hour]++;
  }
  return grid;
}

export function peakOfHeatmap(grid: Heatmap): { weekday: number; hour: number; count: number } | undefined {
  let best: { weekday: number; hour: number; count: number } | undefined;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (!best || grid[d][h] > best.count) best = { weekday: d, hour: h, count: grid[d][h] };
    }
  }
  return best && best.count > 0 ? best : undefined;
}

export function hourTotals(grid: Heatmap): number[] {
  const out = new Array<number>(24).fill(0);
  for (const row of grid) for (let h = 0; h < 24; h++) out[h] += row[h];
  return out;
}

export function weekdayTotals(grid: Heatmap): number[] {
  return grid.map((row) => row.reduce((a, b) => a + b, 0));
}

export function argmax(values: number[]): number {
  let idx = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[idx]) idx = i;
  return idx;
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function round(n: number | undefined, digits = 1): number | undefined {
  if (n === undefined || !Number.isFinite(n)) return undefined;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Longest run of consecutive days (in local time) with at least one event. */
export function longestStreakDays(timestamps: Iterable<number>, clock: LocalClock): number {
  const days = new Set<number>();
  for (const t of timestamps) {
    const p = clock.parts(t);
    days.add(Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86400000));
  }
  const sorted = [...days].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | undefined;
  for (const d of sorted) {
    run = prev !== undefined && d === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

export function activeDays(timestamps: Iterable<number>, clock: LocalClock): number {
  const days = new Set<string>();
  for (const t of timestamps) days.add(clock.dayKey(t));
  return days.size;
}
