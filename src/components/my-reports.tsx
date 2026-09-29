"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { forgetReport, savedReportsStore, type SavedReport } from "@/lib/client/saved-reports";

export function MyReports() {
  const reports = useSyncExternalStore(savedReportsStore.subscribe, savedReportsStore.getSnapshot, savedReportsStore.getServerSnapshot);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(r: SavedReport) {
    if (!confirm("Delete this report permanently? This cannot be undone.")) return;
    setBusy(r.id);
    try {
      if (r.deleteToken) {
        await fetch(`/api/reports/${r.id}?token=${encodeURIComponent(r.deleteToken)}`, { method: "DELETE" });
      }
    } finally {
      forgetReport(r.id);
      setBusy(null);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="card p-6 text-sm text-muted">
        No reports in this browser yet.{" "}
        <Link href="/analyze" className="text-accent hover:underline">
          Analyse your export
        </Link>{" "}
        to create one. Reports are remembered per browser; bookmark a report link to open it elsewhere.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {reports.map((r) => (
        <li key={r.id} className="card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/report/${r.id}`} className="font-medium hover:underline">
              {r.username ? `@${r.username}` : "Instagram report"}
            </Link>
            <div className="text-xs text-faint">{new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <button onClick={() => remove(r)} disabled={busy === r.id} className="text-sm text-muted hover:text-red-600 disabled:opacity-50">
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
