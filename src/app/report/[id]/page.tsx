import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { env, formatPrice } from "@/lib/server/env";
import { getGatedReport } from "@/lib/server/reports";
import { fmtNumber } from "@/lib/format";
import { UnlockButton } from "@/components/unlock-button";
import { LockedSection } from "@/components/report/locked-section";
import { CadenceHeadlineView, EngagementHeadlineView, OverviewView, TeaserView } from "@/components/report/free-sections";
import { CadenceDeepView, CaptionsView, ContentView, EngagementDeepView, GrowthView, HashtagsView, ScoreView, TimingView } from "@/components/report/pro-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Report", robots: { index: false, follow: false } };

const NAV: [string, string][] = [
  ["overview", "Profile"],
  ["engagement", "Engagement"],
  ["cadence", "Rhythm"],
  ["highlights", "Highlights"],
  ["score", "Score"],
  ["engagement-full", "Engagement in depth"],
  ["timing", "When to post"],
  ["cadence-full", "Cadence"],
  ["content", "Content"],
  ["hashtags", "Hashtags"],
  ["captions", "Captions"],
  ["growth", "Growth"],
];

export default async function ReportPage({ params }: PageProps<"/report/[id]">) {
  const { id } = await params;
  const report = await getGatedReport(id);
  if (!report) notFound();
  const { free, pro, timeZone } = report;
  const p = free.overview.profile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-faint">Report · {new Date(report.createdAt).toLocaleDateString("en-GB")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">@{p.username}</h1>
          {p.fullName && <p className="text-muted">{p.fullName}</p>}
        </div>
        <div className="text-sm">
          {report.tier === "pro" ? (
            <span className="brand-gradient text-white px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">Full report</span>
          ) : (
            <a href="#unlock" className="text-accent hover:underline">
              Unlock the full report →
            </a>
          )}
        </div>
      </div>

      {report.tier === "pro" && (
        <div className="mt-6 card p-4 text-sm text-muted flex flex-wrap items-center justify-between gap-3">
          <span>
            Your full report is unlocked. Bookmark this page to come back to it: <span className="font-medium text-foreground">{env.appUrl}/report/{id}</span>
          </span>
          <a href={`/api/reports/${id}/pdf`} className="brand-gradient text-white font-semibold px-4 py-2 rounded-lg whitespace-nowrap" download>
            Download PDF
          </a>
        </div>
      )}

      <nav className="mt-8 flex gap-2 overflow-x-auto text-sm pb-2 -mx-4 px-4">
        {NAV.map(([href, label]) => (
          <a key={href} href={`#${href}`} className="shrink-0 px-3 py-1 rounded-full border border-line hover:bg-surface whitespace-nowrap">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-16">
        <OverviewView data={free.overview} timeZone={timeZone} />
        <EngagementHeadlineView data={free.engagement} />
        <CadenceHeadlineView data={free.cadence} />
        <TeaserView data={free.teaser} timeZone={timeZone} />

        {pro ? (
          <>
            <ScoreView data={pro.score} />
            <EngagementDeepView data={pro.engagement} />
            <TimingView data={pro.timing} timeZone={timeZone} />
            <CadenceDeepView data={pro.cadence} timeZone={timeZone} />
            <ContentView data={pro.content} timeZone={timeZone} />
            <HashtagsView data={pro.hashtags} />
            <CaptionsView data={pro.captions} />
            <GrowthView data={pro.growth} />
          </>
        ) : (
          <>
            <LockedSection id="score" title="ReelSync score & recommendations" description="How the score is built, and what would move it most." teaser={`Score ${free.engagement.score}/100. See the five components and a prioritised list of what to change.`} bullets={["Engagement vs benchmark, frequency, consistency, recency, content mix", "Up to 8 specific recommendations with expected impact"]} />
            <LockedSection id="engagement-full" title="Engagement in depth" description="Which formats work and whether engagement is trending." teaser={`Average ${fmtNumber(free.engagement.avgLikes)} likes and ${fmtNumber(free.engagement.avgComments)} comments per post, broken down by format.`} bullets={["Reels vs photos vs carousels", "Comments per 100 likes", "Recent vs older posts trend", "Engagement per post chart", "Sponsored vs organic"]} />
            <LockedSection id="timing" title="When to post" description="Best days and hours, from what actually performed." teaser={`Best day: ${free.teaser.bestDayName ?? "see report"}. The best hour and full weekday × hour heatmap are in the full report.`} bullets={["Best day and hour by average engagement", "Engagement by weekday and time of day", "Posting heatmap"]} />
            <LockedSection id="cadence-full" title="Cadence & consistency" description="Rhythm, gaps and regularity." teaser={`${fmtNumber(free.cadence.postsPerWeek)} posts per week. See the consistency score, longest gap and posts per month.`} bullets={["Posts per month chart", "Average and longest gap", "Consistency score", "Active weeks"]} />
            <LockedSection id="content" title="Content" description="Top and bottom posts, format mix and what outperforms." teaser="Top 6 and bottom 3 posts with links, and how reels and carousels compare to photos." bullets={["Format mix", "Reels vs photos, carousels vs photos", "Top posts ranked", "Lowest performing posts"]} />
            <LockedSection id="hashtags" title="Hashtags" description="Which tags earn engagement and how many to use." teaser={`Top hashtags: ${free.teaser.topHashtags.map((h) => `#${h}`).join(" ") || "none"}. See performance per tag and the ideal count.`} bullets={["Most used hashtags", "Best performing hashtags", "Engagement by hashtag count", "With vs without hashtags"]} />
            <LockedSection id="captions" title="Captions" description="Length, calls to action, questions, emojis and words." teaser="Find the caption length and style that gets the most engagement on this account." bullets={["Engagement by caption length", "Call-to-action effect", "Questions, emojis, mentions", "Most used words"]} />
            <LockedSection id="growth" title="Follower growth" description="Builds up each time this profile is analysed." teaser="Follower trend across snapshots, with change per day." bullets={["Followers over time", "Change over the tracked period"]} />
          </>
        )}
      </div>

      {report.tier === "free" && (
        <div id="unlock" className="mt-16 card p-6 md:p-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Unlock the full report</h2>
          <p className="text-muted mt-2 max-w-2xl">One-time payment for this account. Every section above, with charts, rankings and recommendations, plus a downloadable PDF. The report stays available at this link.</p>
          <div className="mt-5">
            <UnlockButton reportId={id} price={formatPrice()} paymentsConfigured={env.paymentsConfigured} devUnlock={env.allowDevUnlock} />
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-faint">
        Computed from publicly visible profile data at the time shown above. Like counts hidden by the account are excluded.{" "}
        <Link href="/reports" className="underline">
          Manage or delete your reports
        </Link>
        .
      </p>
    </div>
  );
}
