"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reportId: string;
  price: string;
  paymentsConfigured: boolean;
  devUnlock: boolean;
}

export function UnlockButton({ reportId, price, paymentsConfigured, devUnlock }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function checkout() {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error ?? "Could not start checkout");
      window.location.assign(body.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setBusy(false);
    }
  }

  async function unlockDev() {
    setBusy(true);
    const res = await fetch("/api/dev/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("Dev unlock failed");
  }

  return (
    <div className="space-y-2">
      {paymentsConfigured ? (
        <button
          onClick={checkout}
          disabled={busy}
          className="brand-gradient text-white font-semibold px-5 py-3 rounded-xl w-full sm:w-auto disabled:opacity-60"
        >
          {busy ? "Redirecting to checkout…" : `Unlock full report · ${price}`}
        </button>
      ) : (
        <p className="text-sm text-muted">Payments are not configured on this server yet.</p>
      )}
      {devUnlock && (
        <button onClick={unlockDev} disabled={busy} className="block text-xs text-faint underline">
          Developer: unlock without paying
        </button>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
