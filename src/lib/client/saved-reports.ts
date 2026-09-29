/**
 * Reports created in this browser, kept in localStorage so people can find
 * them again without an account. The delete token is only ever stored here.
 */
export interface SavedReport {
  id: string;
  username?: string;
  createdAt: string;
  deleteToken?: string;
}

const KEY = "reelsync:reports";
const EMPTY: SavedReport[] = [];
const listeners = new Set<() => void>();
let cache: SavedReport[] | undefined;

function read(): SavedReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedReport[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: SavedReport[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Storage unavailable (private mode etc.). Non-fatal.
  }
  cache = undefined;
  listeners.forEach((l) => l());
}

export function loadSavedReports(): SavedReport[] {
  cache ??= read();
  return cache;
}

export function saveReport(entry: SavedReport) {
  write([entry, ...loadSavedReports().filter((r) => r.id !== entry.id)]);
}

export function forgetReport(id: string) {
  write(loadSavedReports().filter((r) => r.id !== id));
}

/** For useSyncExternalStore. */
export const savedReportsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: loadSavedReports,
  getServerSnapshot: () => EMPTY,
};
