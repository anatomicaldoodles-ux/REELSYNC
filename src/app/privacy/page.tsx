import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-like space-y-6 text-sm leading-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-muted">Last updated: September 2026. This page describes what ReelSync does with your data in plain language.</p>
      <H2>What stays on your device</H2>
      <p>
        Your Instagram export ZIP is opened in your browser. Photos, videos, audio and the raw JSON files are never sent to
        our servers. Message texts are processed locally to compute statistics (counts, reply times, common words) and are
        not uploaded.
      </p>
      <H2>What we store</H2>
      <p>
        The computed report: numbers, charts, and the usernames or display names of accounts you interact with (for
        example your list of non-followers or your busiest chats). We store it so your report has a link you can reopen.
        Each report has a random, unguessable address.
      </p>
      <H2>Payments</H2>
      <p>
        Payments are processed by Stripe. We receive the payment status and the email address you enter at checkout, which
        we attach to the report for receipts and support. We never see your card details.
      </p>
      <H2>Deletion</H2>
      <p>
        You can delete a report at any time from “My reports” in the browser you created it in. Deletion is immediate and
        permanent. Reports may also be deleted after a retention period.
      </p>
      <H2>No tracking</H2>
      <p>We do not use advertising trackers. Your browser&apos;s local storage remembers which reports you created.</p>
      <H2>Not affiliated with Instagram</H2>
      <p>ReelSync is an independent tool and is not affiliated with, endorsed by or connected to Instagram or Meta Platforms.</p>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>;
}
