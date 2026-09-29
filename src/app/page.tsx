import Link from "next/link";
import { env, formatFree, formatPrice } from "@/lib/server/env";
import { UsernameForm } from "@/components/username-form";

const FREE = [
  "Followers, following, posts and follow ratio",
  "Engagement rate with a grade against accounts your size",
  "Posts per week and days since the last post",
  "Top 3 hashtags and the best performing post",
  "ReelSync score out of 100",
];

const PRO = [
  "Engagement in depth: reels vs photos vs carousels, likes vs comments, trend over recent posts",
  "Best days and hours to post, from what actually performed",
  "Posting cadence, consistency score and gaps",
  "Top and bottom posts with links",
  "Hashtag performance: which tags earn engagement and the ideal count",
  "Caption analysis: length, calls to action, questions, emojis and words that work",
  "Follower growth over time (builds up each time the profile is analysed)",
  "Prioritised recommendations to grow the account",
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Analyse any Instagram account <span className="brand-text">by username</span>.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Type a public username and get a report on engagement, best posting times, hashtags, captions and growth.
            Check your own account, a competitor, or a creator you want to work with.
          </p>
        </div>
        <div className="mt-8 max-w-2xl">
          <UsernameForm size="lg" autoFocus />
        </div>
        <p className="mt-4 text-sm text-faint">
          Free preview for every lookup. Full report {formatPrice()} one-time per account.
          {env.demoMode && " This server is running on demo data until a data provider is configured."}
        </p>
      </section>

      <section className="py-12 grid md:grid-cols-3 gap-6">
        <Step n={1} title="Type a username" text="Any public Instagram account. No login, nothing to install." />
        <Step n={2} title="We fetch the public data" text="Follower counts and the most recent posts with their likes, comments, captions and timing." />
        <Step n={3} title="Read the report" text="Free headline numbers instantly. Unlock the full breakdown with a one-time payment." />
      </section>

      <section className="py-12" id="pricing">
        <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="text-sm font-semibold">Free</div>
            <div className="text-3xl font-semibold mt-1">{formatFree()}</div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-good">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 border-2" style={{ borderColor: "var(--brand-b)" }}>
            <div className="text-sm font-semibold brand-text">Full report</div>
            <div className="text-3xl font-semibold mt-1">{formatPrice()}</div>
            <div className="text-xs text-faint">one-time, per account</div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {PRO.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-good">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
        <dl className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
          <Faq q="Do I need to log in to Instagram?" a="No. ReelSync only reads what is publicly visible on a profile, the same things anyone sees when they open it." />
          <Faq q="Can I analyse a private account?" a="No. Private accounts do not expose posts, so there is nothing to analyse. Ask the owner to share their own report instead." />
          <Faq q="Where does the data come from?" a="From the public profile page, fetched through a data provider at the moment you ask. Reports show the date and time of the fetch." />
          <Faq q="How many posts are analysed?" a="The most recent 50 by default. That is enough for reliable engagement, timing and hashtag patterns without slowing the lookup down." />
          <Faq q="What is the ReelSync score?" a="A 0 to 100 summary of engagement against accounts of similar size, posting frequency, consistency, recency and content mix. The full report shows every component." />
          <Faq q="Is this affiliated with Instagram?" a="No. ReelSync is an independent tool and is not affiliated with, endorsed by or connected to Instagram or Meta." />
        </dl>
      </section>

      <section className="py-12">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Try it now</h2>
          <p className="text-muted mt-2">Start with any public username. The free preview takes under a minute.</p>
          <div className="mt-6 max-w-xl mx-auto">
            <UsernameForm />
          </div>
          <p className="mt-4 text-xs text-faint">
            <Link href="/pricing" className="underline">
              See pricing
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="card p-5">
      <div className="brand-gradient text-white h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold">{n}</div>
      <h3 className="font-semibold mt-3">{title}</h3>
      <p className="text-sm text-muted mt-1">{text}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="font-medium">{q}</dt>
      <dd className="text-muted mt-1">{a}</dd>
    </div>
  );
}
