import type { Metadata } from "next";
import Link from "next/link";
import { formatFree, formatPrice } from "@/lib/server/env";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 text-muted">Simple: the preview is free, the full report is a one-time payment per Instagram account analysed. No subscription, no login.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="font-semibold">Free preview</div>
          <div className="text-3xl font-semibold mt-1">{formatFree()}</div>
          <p className="text-sm text-muted mt-3">Profile numbers, engagement rate with a grade against similar accounts, posting rhythm, top hashtags, best post and the ReelSync score.</p>
        </div>
        <div className="card p-6 border-2" style={{ borderColor: "var(--brand-b)" }}>
          <div className="font-semibold brand-text">Full report</div>
          <div className="text-3xl font-semibold mt-1">{formatPrice()}</div>
          <p className="text-sm text-muted mt-3">All eight in-depth sections: score breakdown and recommendations, engagement by format, best times to post, cadence, top and bottom posts, hashtag and caption performance, follower growth. Includes a downloadable PDF. Stays unlocked at its link.</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted">
        Payments are handled by Razorpay (UPI, cards, net banking and wallets). Refunds within 14 days if the report did not work for the account you analysed: reply to your receipt email.
      </p>
      <Link href="/analyze" className="inline-block mt-6 brand-gradient text-white font-semibold px-5 py-3 rounded-xl">
        Start with the free preview
      </Link>
    </div>
  );
}
