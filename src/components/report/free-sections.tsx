import type { FreeSections } from "@/lib/profile/report";
import { fmtCompact, fmtDate, fmtNumber, fmtPct } from "@/lib/format";
import { Stat, StatGrid } from "@/components/charts/stat";
import { Card, Section, SubGrid } from "./section";
import { PostCard } from "./post-card";

export function GradeBadge({ grade }: { grade: string }) {
  return <span className="brand-gradient text-white font-semibold px-2.5 py-1 rounded-lg text-lg tabular">{grade}</span>;
}

export function OverviewView({ data, timeZone }: { data: FreeSections["overview"]; timeZone: string }) {
  const p = data.profile;
  const fetched = Math.floor(new Date(p.fetchedAt).getTime() / 1000);
  return (
    <Section id="overview" title="Profile" badge="free" description={`Public data fetched ${fmtDate(fetched, timeZone)}${data.postsAnalysed ? `, based on the ${data.postsAnalysed} most recent posts` : ""}.`}>
      <div className="card p-5 flex gap-4 items-start">
        <div className="h-16 w-16 shrink-0 rounded-full bg-line overflow-hidden flex items-center justify-center text-2xl">
          {p.profilePicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.profilePicUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span aria-hidden>@</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{p.fullName ?? `@${p.username}`}</h3>
            {p.isVerified && <span className="text-xs px-1.5 py-0.5 rounded bg-line text-muted">verified</span>}
            {p.category && <span className="text-xs px-1.5 py-0.5 rounded bg-line text-muted">{p.category}</span>}
          </div>
          <a href={`https://www.instagram.com/${p.username}/`} target="_blank" rel="noreferrer noopener" className="text-sm text-muted hover:underline">
            @{p.username}
          </a>
          {p.biography && <p className="text-sm mt-2 whitespace-pre-line">{p.biography}</p>}
          {p.externalUrl && (
            <a href={p.externalUrl} target="_blank" rel="noreferrer noopener" className="text-sm text-accent hover:underline block mt-1 truncate">
              {p.externalUrl}
            </a>
          )}
        </div>
      </div>
      <StatGrid>
        <Stat label="Followers" value={fmtCompact(p.followers)} hint={fmtNumber(p.followers)} />
        <Stat label="Following" value={fmtCompact(p.following)} hint={data.followRatio !== undefined ? `Ratio ${data.followRatio}` : undefined} />
        <Stat label="Posts" value={fmtCompact(p.postsCount)} hint={data.followersPerPost !== undefined ? `${fmtNumber(data.followersPerPost)} followers per post` : undefined} />
        <Stat label="Posts analysed" value={fmtNumber(data.postsAnalysed)} hint={data.analysedFrom ? `Since ${fmtDate(Math.floor(new Date(data.analysedFrom).getTime() / 1000), timeZone)}` : undefined} />
      </StatGrid>
      {p.provider === "demo" && (
        <p className="text-xs text-faint">This report was generated from demo data because no data provider is configured on this server.</p>
      )}
    </Section>
  );
}

export function EngagementHeadlineView({ data }: { data: FreeSections["engagement"] }) {
  const rel = data.engagementRate !== undefined ? Math.round(((data.engagementRate - data.benchmarkRate) / data.benchmarkRate) * 100) : undefined;
  return (
    <Section id="engagement" title="Engagement" badge="free" description="Average likes and comments per post as a share of followers, compared with accounts of a similar size.">
      <SubGrid>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-faint">Engagement rate</div>
              <div className="text-4xl font-semibold tabular mt-1">{data.engagementRate !== undefined ? `${data.engagementRate}%` : "–"}</div>
              <div className="text-sm text-muted mt-1">
                Typical for {data.benchmarkTier}: {data.benchmarkRate}%
                {rel !== undefined && (
                  <span className={rel >= 0 ? " text-good" : " text-red-600 dark:text-red-400"}>
                    {" "}
                    ({rel >= 0 ? "+" : ""}
                    {rel}%)
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <GradeBadge grade={data.grade} />
              <div className="text-xs text-faint mt-1">Score {data.score}/100</div>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label="Avg likes" value={fmtCompact(data.avgLikes)} hint="per post" />
          <Stat label="Avg comments" value={fmtCompact(data.avgComments)} hint="per post" />
        </div>
      </SubGrid>
    </Section>
  );
}

export function CadenceHeadlineView({ data }: { data: FreeSections["cadence"] }) {
  return (
    <Section id="cadence" title="Posting rhythm" badge="free">
      <StatGrid>
        <Stat label="Posts per week" value={fmtNumber(data.postsPerWeek)} />
        <Stat label="Days since last post" value={fmtNumber(data.daysSinceLastPost)} />
        <Stat label="Reels share" value={fmtPct(data.reelsSharePct)} hint="of analysed posts" />
      </StatGrid>
    </Section>
  );
}

export function TeaserView({ data, timeZone }: { data: FreeSections["teaser"]; timeZone: string }) {
  return (
    <Section id="highlights" title="Highlights" badge="free">
      <SubGrid>
        <Card title="Best performing post">{data.bestPost ? <PostCard post={data.bestPost} timeZone={timeZone} /> : <p className="text-sm text-faint">No posts to rank.</p>}</Card>
        <Card title="Quick facts">
          <ul className="text-sm space-y-2">
            <li>
              <span className="text-muted">Top hashtags: </span>
              {data.topHashtags.length ? data.topHashtags.map((h) => `#${h}`).join(" ") : <span className="text-faint">none used</span>}
            </li>
            <li>
              <span className="text-muted">Best day to post: </span>
              {data.bestDayName ?? <span className="text-faint">not enough posts</span>}
            </li>
            <li className="text-faint text-xs">Best hour, hashtag performance and caption analysis are in the full report.</li>
          </ul>
        </Card>
      </SubGrid>
    </Section>
  );
}
