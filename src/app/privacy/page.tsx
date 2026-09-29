import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-like space-y-6 text-sm leading-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-muted">Last updated: September 2026. This page describes what ReelSync does with your data in plain language.</p>
      <H2>What ReelSync reads</H2>
      <p>
        When you enter a username, ReelSync fetches the information that is publicly visible on that Instagram profile:
        the bio, follower and following counts, and the most recent posts with their likes, comments, captions and dates.
        It does not log in to Instagram, does not read private accounts, and never asks for your password.
      </p>
      <H2>What we store</H2>
      <p>
        A snapshot of that public data and the computed report, so your report has a link you can reopen and so follower
        growth can be shown over time. Each report has a random, unguessable address. We also store a hashed version of
        your IP address for 24 hours to limit the number of lookups per visitor.
      </p>
      <H2>Payments</H2>
      <p>
        Payments are processed by Razorpay. We receive the payment status and the email address or phone number you enter
        at checkout, which we attach to the report for receipts and support. We never see your card or bank details.
      </p>
      <H2>Deletion</H2>
      <p>
        You can delete a report at any time from “My reports” in the browser you created it in. If you are the owner of
        an analysed account and want its snapshots removed, contact us with the username.
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
