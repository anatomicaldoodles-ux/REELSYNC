const nf = new Intl.NumberFormat("en-US");

export function fmtNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "–";
  return nf.format(n);
}

export function fmtCompact(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fmtDate(sec: number | undefined, timeZone?: string): string {
  if (!sec) return "–";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone }).format(new Date(sec * 1000));
  } catch {
    return new Date(sec * 1000).toISOString().slice(0, 10);
  }
}

export function fmtMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export function fmtHour(h: number | undefined): string {
  if (h === undefined) return "–";
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
}

export function fmtMinutes(min: number | undefined): string {
  if (min === undefined || !Number.isFinite(min)) return "–";
  if (min < 1) return "under a minute";
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 60 * 24) return `${(min / 60).toFixed(1)} h`;
  return `${(min / 1440).toFixed(1)} days`;
}

export function fmtPct(p: number | undefined): string {
  if (p === undefined || !Number.isFinite(p)) return "–";
  return `${p}%`;
}

export function fmtDays(d: number | undefined): string {
  if (d === undefined) return "–";
  if (d < 60) return `${d} days`;
  if (d < 730) return `${(d / 30.44).toFixed(0)} months`;
  return `${(d / 365.25).toFixed(1)} years`;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
