import type { FreeSections } from "@/lib/instagram/analyze/report";
import { WEEKDAYS_LONG, fmtDate, fmtDays, fmtHour, fmtNumber, fmtPct } from "@/lib/format";
import { Stat, StatGrid } from "@/components/charts/stat";
import { Card, Section, SubGrid } from "./section";

export function OverviewSectionView({ data, timeZone }: { data: FreeSections["overview"]; timeZone: string }) {
  const t = data.totals;
  return (
    <Section
      id="overview"
      title="Overview"
      badge="free"
      description={`Everything below was computed from your export${data.dataFrom ? ` covering ${fmtDate(data.dataFrom, timeZone)} to ${fmtDate(data.dataTo, timeZone)}` : ""}. Times use the ${timeZone} time zone.`}
    >
      <StatGrid>
        <Stat label="Followers" value={fmtNumber(data.followers)} />
        <Stat label="Following" value={fmtNumber(data.following)} hint={data.followRatio !== undefined ? `Ratio ${data.followRatio}` : undefined} />
        <Stat label="Account age" value={fmtDays(data.accountAgeDays)} hint={data.accountCreatedAt ? `Since ${fmtDate(data.accountCreatedAt, timeZone)}` : "Signup date not in export"} />
        <Stat label="Posts & reels" value={fmtNumber(t.posts + t.reels)} hint={`${fmtNumber(t.stories)} stories`} />
        <Stat label="Likes given" value={fmtNumber(t.likes)} />
        <Stat label="Comments written" value={fmtNumber(t.comments)} />
        <Stat label="DMs sent" value={fmtNumber(t.messagesSent)} hint={`${fmtNumber(t.messagesReceived)} received in ${fmtNumber(t.threads)} chats`} />
        <Stat label="Ads shown to you" value={fmtNumber(t.adsViewed)} hint={`${fmtNumber(t.logins)} logins · ${fmtNumber(t.searches)} searches`} />
      </StatGrid>
      {data.warnings.length > 0 && (
        <p className="text-xs text-faint">
          {data.warnings.length} file{data.warnings.length === 1 ? "" : "s"} could not be read and were skipped.
        </p>
      )}
    </Section>
  );
}

export function FollowersSnapshotView({ data }: { data: FreeSections["followersSnapshot"] }) {
  return (
    <Section
      id="followers"
      title="Followers"
      badge="free"
      description="Who follows you back, who doesn't, and who follows you without you following them."
    >
      <StatGrid>
        <Stat label="Don't follow you back" value={fmtNumber(data.notFollowingBack)} hint="Accounts you follow" />
        <Stat label="Mutuals" value={fmtNumber(data.mutuals)} hint={data.followBackRate !== undefined ? `${fmtPct(data.followBackRate)} follow-back rate` : undefined} />
        <Stat label="Fans" value={fmtNumber(data.fans)} hint="Follow you, you don't follow them" />
        <Stat label="Pending requests" value={fmtNumber(data.pendingSent)} hint={`${fmtNumber(data.recentlyUnfollowed)} recently unfollowed`} />
      </StatGrid>
      {data.notFollowingBackSample.length > 0 && (
        <Card title="A few accounts that don't follow you back">
          <ul className="flex flex-wrap gap-2 text-sm">
            {data.notFollowingBackSample.map((p) => (
              <li key={p.username} className="px-2.5 py-1 rounded-full bg-background border border-line">
                @{p.username}
              </li>
            ))}
            {data.notFollowingBack > data.notFollowingBackSample.length && (
              <li className="px-2.5 py-1 rounded-full text-muted">
                + {fmtNumber(data.notFollowingBack - data.notFollowingBackSample.length)} more in the full report
              </li>
            )}
          </ul>
        </Card>
      )}
    </Section>
  );
}

export function ActivitySnapshotView({ data }: { data: FreeSections["activitySnapshot"] }) {
  const rows = data.byYear;
  const maxOf = (key: "likes" | "comments" | "posts" | "messagesSent" | "storiesPosted") => Math.max(1, ...rows.map((r) => r[key]));
  const cols: { key: "likes" | "comments" | "posts" | "storiesPosted" | "messagesSent"; label: string }[] = [
    { key: "likes", label: "Likes" },
    { key: "comments", label: "Comments" },
    { key: "posts", label: "Posts" },
    { key: "storiesPosted", label: "Stories" },
    { key: "messagesSent", label: "DMs sent" },
  ];
  return (
    <Section id="activity" title="Activity over the years" badge="free" description="How much you have used Instagram, year by year.">
      <SubGrid>
        <Card title="By year">
          {rows.length === 0 ? (
            <p className="text-sm text-faint">No dated activity found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="py-1 pr-3 font-medium">Year</th>
                    {cols.map((c) => (
                      <th key={c.key} className="py-1 pr-3 font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.year} className="border-t border-line">
                      <td className="py-1.5 pr-3 tabular font-medium">{r.year}</td>
                      {cols.map((c) => (
                        <td key={c.key} className="py-1.5 pr-3 tabular">
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-right">{fmtNumber(r[c.key])}</span>
                            <span className="h-1.5 w-10 rounded-full bg-line overflow-hidden">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${(r[c.key] / maxOf(c.key)) * 100}%`, background: "var(--viz-1)" }}
                              />
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label="Peak hour" value={fmtHour(data.peakHour)} hint="When you are most active" />
          <Stat label="Peak day" value={data.peakWeekday !== undefined ? WEEKDAYS_LONG[data.peakWeekday] : "–"} />
          <Stat label="Active days" value={fmtNumber(data.activeDays)} hint="Days with at least one action" />
          <Stat label="Longest streak" value={`${fmtNumber(data.longestStreakDays)} days`} hint="Consecutive active days" />
        </div>
      </SubGrid>
    </Section>
  );
}

export function TopPeopleTeaserView({ data }: { data: FreeSections["topPeopleTeaser"] }) {
  return (
    <Section
      id="people"
      title="Your inner circle"
      badge="free"
      description={`You have interacted with ${fmtNumber(data.totalAccountsInteractedWith)} accounts through likes, comments, saves, story reactions and searches. These are your top three.`}
    >
      {data.top.length === 0 ? (
        <p className="text-sm text-faint">No interactions found in this export.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {data.top.map((p, i) => (
            <div key={p.username} className="card p-4">
              <div className="text-xs text-faint">#{i + 1}</div>
              <div className="font-semibold truncate">@{p.username}</div>
              <div className="text-xs text-muted mt-1">
                {fmtNumber(p.likes)} likes · {fmtNumber(p.comments)} comments
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
