"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reportId: string;
  price: string;
  paymentsConfigured: boolean;
  devUnlock: boolean;
}

interface CheckoutDetails {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
}

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay. Check your connection or ad blocker."));
    document.body.appendChild(script);
  });
}

export function UnlockButton({ reportId, price, paymentsConfigured, devUnlock }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function verify(response: RazorpaySuccess) {
    setStatus("Confirming your payment…");
    const res = await fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, ...response }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Payment could not be verified. If you were charged, contact support with this report link.");
    }
    setStatus("Unlocked. Loading your full report…");
    router.refresh();
  }

  async function checkout() {
    setBusy(true);
    setError(undefined);
    setStatus("Preparing checkout…");
    try {
      const [details] = await Promise.all([
        fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId }),
        }).then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new Error(body.error ?? "Could not start checkout");
          return body as CheckoutDetails;
        }),
        loadCheckoutScript(),
      ]);
      if (!window.Razorpay) throw new Error("Razorpay did not load");
      const rzp = new window.Razorpay({
        key: details.keyId,
        amount: details.amount,
        currency: details.currency,
        name: details.name,
        description: details.description,
        order_id: details.orderId,
        theme: { color: "#dd2a7b" },
        notes: { reportId },
        handler: (response: RazorpaySuccess) => {
          verify(response).catch((err: Error) => {
            setError(err.message);
            setBusy(false);
            setStatus(undefined);
          });
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setStatus(undefined);
          },
        },
      });
      rzp.on("payment.failed", (response) => {
        setError(response.error?.description ?? "Payment failed. You can try again.");
        setBusy(false);
        setStatus(undefined);
      });
      setStatus(undefined);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setBusy(false);
      setStatus(undefined);
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
          {busy ? (status ?? "Opening checkout…") : `Unlock full report · ${price}`}
        </button>
      ) : (
        <p className="text-sm text-muted">Payments are not configured on this server yet.</p>
      )}
      <p className="text-xs text-faint">UPI, cards, net banking and wallets via Razorpay.</p>
      {devUnlock && (
        <button onClick={unlockDev} disabled={busy} className="block text-xs text-faint underline">
          Developer: unlock without paying
        </button>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
