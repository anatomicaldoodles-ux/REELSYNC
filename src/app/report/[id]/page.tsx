import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmCheckoutSession } from "@/lib/server/checkout";
import { env, formatPrice } from "@/lib/server/env";
import { getGatedReport } from "@/lib/server/reports";
import { fmtNumber } from "@/lib/format";
import { UnlockButton } from "@/components/unlock-button";
import { LockedSection } from "@/components/report/locked-section";
import { ActivitySnapshotView, FollowersSnapshotView, OverviewSectionView, TopPeopleTeaserView } from "@/components/report/free-sections";
import {
  ContentView,
  EngagementView,
  FollowersFullView,
  InterestsView,
  MessagesView,
  PeopleView,
  SearchesView,
  SecurityView,
  StoriesSavedView,
} from "@/components/report/pro-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your report", robots: { index: false, follow: false } };

const NAV_FREE = [
  ["overview", "Overview"],
  ["followers", "Followers"],
  ["activity", "Activity"],
  ["people", "Inner circle"],
];
const NAV_PRO = [
  ["followers-full", "Followers in depth"],
  ["people-full", "Everyone"],
  ["engagement", "Likes & comments"],
  ["content", "Posting"],
  ["messages", "DMs"],
  ["stories-saved", "Stories & saves"],
  ["interests", "Algorithm"],
  ["searches", "Searches"],
  ["security", "Security"],
];

export default async function ReportPage({ params, searchParams }: PageProps<"/report/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const sessionId = typeof query.session_id === "string" ? query.session_id : undefined;
  let justUnlocked = false;
  if (sessionId) justUnlocked = await confirmCheckoutSession(sessionId, id);

  const report = await getGatedReport(id);
  if (!report) notFound();
  const { free, pro, timeZone } = report;
  const o = free.overview;
  const s = free.followersSnapshot;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-faint">Report · {new Date(report.createdAt).toLocaleDateString("en-GB")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{o.username ? `@${o.username}` : "Your Instagram"}</h1>
          {o.name && <p className="text-muted">{o.name}</p>}
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

      {justUnlocked && (
        <div className="mt-6 card p-4 border-good text-sm">
          Payment received. Your full report is unlocked. Bookmark this page:{" "}
          <span className="font-medium">{env.appUrl}/report/{id}</span>
        </div>
      )}
      {query.checkout === "cancelled" && <div className="mt-6 card p-4 text-sm text-muted">Checkout cancelled. Your free report is still here.</div>}

      <nav className="mt-8 flex gap-2 overflow-x-auto text-sm pb-2 -mx-4 px-4">
        {[...NAV_FREE, ...NAV_PRO].map(([href, label]) => (
          <a key={href} href={`#${href}`} className="shrink-0 px-3 py-1 rounded-full border border-line hover:bg-surface whitespace-nowrap">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-16">
        <OverviewSectionView data={o} timeZone={timeZone} />
        <FollowersSnapshotView data={s} />
        <ActivitySnapshotView data={free.activitySnapshot} />
        <TopPeopleTeaserView data={free.topPeopleTeaser} />

        {pro ? (
          <>
            <FollowersFullView data={pro.followers} timeZone={timeZone} />
            <PeopleView data={pro.people} timeZone={timeZone} />
            <EngagementView data={pro.engagement} timeZone={timeZone} />
            <ContentView data={pro.content} timeZone={timeZone} />
            <MessagesView data={pro.messages} timeZone={timeZone} />
            <StoriesSavedView stories={pro.stories} saved={pro.saved} />
            <InterestsView data={pro.interests} />
            <SearchesView data={pro.searches} />
            <SecurityView data={pro.security} timeZone={timeZone} />
          </>
        ) : (
          <>
            <LockedSection
              id="followers-full"
              title="Followers in depth"
              description="Full lists with dates, growth per month, and the people you never interact with."
              teaser={`See all ${fmtNumber(s.notFollowingBack)} accounts that don't follow you back and your ${fmtNumber(s.fans)} fans.`}
              bullets={["Every non-follower, mutual and fan with the month they followed", "New followers per month", "Oldest and newest followers", "Followers you have never interacted with", "Recently unfollowed, pending, blocked and restricted"]}
            />
            <LockedSection
              id="people-full"
              title="Everyone you interact with"
              description="Your full inner circle, ranked."
              teaser={`Your top 100 of ${fmtNumber(free.topPeopleTeaser.totalAccountsInteractedWith)} accounts, with likes, comments, saves and searches for each.`}
              bullets={["Weighted interaction score per account", "One-sided: accounts you engage with that don't follow you", "Secret favourites you don't follow", "First and last interaction dates"]}
            />
            <LockedSection
              id="engagement"
              title="Likes & comments"
              description="What you give and when."
              teaser={`${fmtNumber(o.totals.likes)} likes and ${fmtNumber(o.totals.comments)} comments, broken down by month, hour and account.`}
              bullets={["Likes and comments per month", "Weekday × hour heatmap", "Top 50 liked and commented accounts", "Your comment words and emojis", "Share of likes that go to accounts you follow"]}
            />
            <LockedSection
              id="content"
              title="Your posting"
              description="Patterns behind your posts, reels and stories."
              teaser={`${fmtNumber(o.totals.posts + o.totals.reels)} posts and reels, ${fmtNumber(o.totals.stories)} stories analysed.`}
              bullets={["Best time to post based on your history", "Posts, reels and stories per month", "Hashtags and mentions you use", "Carousel share and media per post", "Longest gap and average cadence"]}
            />
            <LockedSection
              id="messages"
              title="Direct messages"
              description="Who you actually talk to."
              teaser={`${fmtNumber(o.totals.messagesSent)} messages sent across ${fmtNumber(o.totals.threads)} conversations.`}
              bullets={["Busiest conversations with sent/received split", "Median reply time, yours and theirs", "Who you're ghosting and who ghosts you", "Reels shared, voice notes, calls, reactions", "Night-owl share and busiest day"]}
            />
            <LockedSection
              id="stories-saved"
              title="Stories & saves"
              description="Whose stories you react to and what you keep."
              teaser={`${fmtNumber(o.totals.storyInteractions)} story reactions and ${fmtNumber(o.totals.savedPosts)} saved posts.`}
              bullets={["Top accounts by story reactions", "Poll and quiz answers", "Most saved creators", "Saves per month and collections"]}
            />
            <LockedSection
              id="interests"
              title="What Instagram thinks about you"
              description="Topics, advertisers and the feed."
              teaser={`${fmtNumber(o.totals.adsViewed)} ads were shown to you. See who is paying to reach you.`}
              bullets={["Topics Instagram assigned to you", "Advertisers using your activity or information", "Advertisers and creators you see most", "Share of your feed from accounts you follow", "Suggested accounts you looked at"]}
            />
            <LockedSection
              id="searches"
              title="Searches"
              description="Who and what you look up."
              teaser={`${fmtNumber(o.totals.searches)} recent searches analysed.`}
              bullets={["Profiles you search for most", "Profiles you search for but don't follow", "Keywords and hashtags", "Searches per month"]}
            />
            <LockedSection
              id="security"
              title="Security & logins"
              description="Where your account has been used."
              teaser={`${fmtNumber(o.totals.logins)} logins recorded. Check for devices and locations you don't recognise.`}
              bullets={["Logins by platform, IP and month", "Login heatmap", "Devices with last login", "Password changes and profile changes", "Signup date, IP and device"]}
            />
          </>
        )}
      </div>

      {report.tier === "free" && (
        <div id="unlock" className="mt-16 card p-6 md:p-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Unlock the full report</h2>
          <p className="text-muted mt-2 max-w-2xl">
            One-time payment for this export. You get every section above, the complete lists, and the report stays
            available at this link. Want to analyse a newer export later? That is a new report.
          </p>
          <div className="mt-5">
            <UnlockButton reportId={id} price={formatPrice()} paymentsConfigured={env.stripeConfigured} devUnlock={env.allowDevUnlock} />
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-faint">
        This report was computed from your export in your browser. Anything the export does not contain cannot be shown.{" "}
        <Link href="/reports" className="underline">
          Manage or delete your reports
        </Link>
        .
      </p>
    </div>
  );
}
