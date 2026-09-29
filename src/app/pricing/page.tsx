import type { Metadata } from "next";
import Link from "next/link";
import { formatFree, formatPrice } from "@/lib/server/env";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 text-muted">Simple: the preview is free, the full report is a one-time payment per export. No subscription, no account.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="font-semibold">Free preview</div>
          <div className="text-3xl font-semibold mt-1">{formatFree()}</div>
          <p className="text-sm text-muted mt-3">Overview, follower counts with a preview of who doesn&apos;t follow back, activity by year, and your top 3 accounts.</p>
        </div>
        <div className="card p-6 border-2" style={{ borderColor: "var(--brand-b)" }}>
          <div className="font-semibold brand-text">Full report</div>
          <div className="text-3xl font-semibold mt-1">{formatPrice()}</div>
          <p className="text-sm text-muted mt-3">All nine in-depth sections: complete follower lists, DM analytics, posting patterns, algorithm profile, security history and more. Stays unlocked at its link.</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted">
        Payments are handled by Razorpay (UPI, cards, net banking and wallets). Refunds within 14 days if the report did not work for your export: reply to your receipt email.
      </p>
      <Link href="/analyze" className="inline-block mt-6 brand-gradient text-white font-semibold px-5 py-3 rounded-xl">
        Start with the free preview
      </Link>
    </div>
  );
}
