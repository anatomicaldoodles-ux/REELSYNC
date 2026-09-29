"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveReport } from "@/lib/client/saved-reports";

const WAITING = [
  "Fetching the public profile…",
  "Reading recent posts…",
  "Counting likes and comments…",
  "Working out the best posting times…",
  "Checking hashtags and captions…",
  "Almost there…",
];

export function UsernameForm({ size = "md", autoFocus = false }: { size?: "md" | "lg"; autoFocus?: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, [busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(undefined);
    setBusy(true);
    setTick(0);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, timeZone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Lookup failed");
      saveReport({ id: body.id, deleteToken: body.deleteToken, username: username.trim().replace(/^@/, "").toLowerCase(), createdAt: new Date().toISOString() });
      router.push(`/report/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
      setBusy(false);
    }
  }

  const big = size === "lg";
  return (
    <form onSubmit={submit} className="w-full">
      <div className={`flex flex-col sm:flex-row gap-2 ${big ? "" : ""}`}>
        <label className="relative flex-1">
          <span className="sr-only">Instagram username</span>
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-faint ${big ? "text-lg" : ""}`}>@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="instagram username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={autoFocus}
            disabled={busy}
            className={`w-full rounded-xl border border-line bg-surface pl-9 pr-4 ${big ? "py-4 text-lg" : "py-3"} outline-none focus:border-accent disabled:opacity-60`}
          />
        </label>
        <button
          type="submit"
          disabled={busy || username.trim().length === 0}
          className={`brand-gradient text-white font-semibold rounded-xl px-6 ${big ? "py-4 text-lg" : "py-3"} disabled:opacity-60 whitespace-nowrap`}
        >
          {busy ? "Analysing…" : "Analyse"}
        </button>
      </div>
      {busy && (
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {WAITING[Math.min(tick, WAITING.length - 1)]} This can take up to a minute.
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-faint">Public accounts only. No login, no password, nothing installed.</p>
    </form>
  );
}
