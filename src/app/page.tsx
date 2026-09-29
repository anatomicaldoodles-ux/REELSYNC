import Link from "next/link";
import { formatPrice } from "@/lib/server/env";

const FREE = [
  "Followers, following and follow-back ratio",
  "How many accounts don't follow you back (with a preview)",
  "Your activity by year, peak hour and longest streak",
  "Your top 3 accounts by interaction",
];

const PRO = [
  "Every account that doesn't follow you back, fans and mutuals, with dates",
  "Follower growth per month and followers you never interact with",
  "Likes and comments: top accounts, heatmaps, your words and emojis",
  "DM analytics: busiest chats, reply times, who you're ghosting and who ghosts you",
  "Posting patterns: best time to post, hashtags, carousels, gaps",
  "Story reactions, saves and collections",
  "What Instagram thinks you like: topics, advertisers holding your data, ads shown",
  "Searches: who you look up and don't follow",
  "Security: logins by IP, device and time, password changes",
  "Your full inner circle ranked, one-sided crushes and secret favourites",
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Your Instagram, <span className="brand-text">analysed in full depth</span>. Privately.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Upload the data export Instagram gives you and ReelSync turns it into a report: who doesn&apos;t follow you back,
            who you really talk to, when you post, what the algorithm thinks of you, and where your account has been
            logged in. The analysis runs in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyze" className="brand-gradient text-white font-semibold px-5 py-3 rounded-xl">
              Analyse my export
            </Link>
            <Link href="/how-to-export" className="px-5 py-3 rounded-xl border border-line hover:bg-surface font-medium">
              How do I get my export?
            </Link>
          </div>
          <p className="mt-4 text-sm text-faint">Free preview. Full report {formatPrice()} one-time, per export.</p>
        </div>
        <div className="card p-6 space-y-3">
          <div className="text-xs uppercase tracking-wide text-faint">Sample findings</div>
          <div className="grid grid-cols-2 gap-3">
            <Preview label="Don't follow you back" value="143" />
            <Preview label="Median reply time" value="12 min" />
            <Preview label="Advertisers with your data" value="418" />
            <Preview label="Best time to post" value="Sun 7pm" />
          </div>
          <div className="text-xs text-faint">Illustrative numbers.</div>
        </div>
      </section>

      <section className="py-12 grid md:grid-cols-3 gap-6">
        <Step n={1} title="Request your data" text="Instagram → Settings → Your information and permissions → Download your information. Choose JSON format." />
        <Step n={2} title="Drop the ZIP here" text="Your browser reads only the JSON files and skips photos and videos. Nothing raw is uploaded." />
        <Step n={3} title="Read your report" text="Free sections instantly. Unlock everything else with a one-time payment for that export." />
      </section>

      <section className="py-12" id="pricing">
        <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="text-sm font-semibold">Free</div>
            <div className="text-3xl font-semibold mt-1">$0</div>
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
            <div className="text-xs text-faint">one-time, per export</div>
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
          <Faq q="Do I need to give you my password?" a="No. ReelSync never asks for your login. It reads the export file Instagram creates for you." />
          <Faq q="Is my data uploaded?" a="The ZIP stays on your device. Your browser computes the statistics and only those statistics (counts, usernames of who you interact with, charts) are saved so your report has a link. Message texts, photos and videos are never uploaded." />
          <Faq q="Which export format?" a="JSON. The HTML export is not supported. Any date range works; a longer range gives a richer report." />
          <Faq q="Why is some data missing?" a="Instagram only includes what it keeps: recent searches, the last few months of ads and views, follow dates where recorded. The report shows what your export contains." />
          <Faq q="Can I delete my report?" a="Yes. From “My reports” in this browser you can delete it permanently at any time." />
          <Faq q="Is this affiliated with Instagram?" a="No. ReelSync is an independent tool and is not affiliated with, endorsed by or connected to Instagram or Meta." />
        </dl>
      </section>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background border border-line p-3">
      <div className="text-xs text-faint">{label}</div>
      <div className="text-2xl font-semibold tabular">{value}</div>
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
