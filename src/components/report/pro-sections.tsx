import type { ProSections } from "@/lib/profile/report";
import { WEEKDAYS_LONG, fmtCompact, fmtDate, fmtHour, fmtNumber, fmtPct } from "@/lib/format";
import { Stat, StatGrid } from "@/components/charts/stat";
import { MonthBars } from "@/components/charts/month-bars";
import { BarSeries } from "@/components/charts/bar-series";
import { Heatmap } from "@/components/charts/heatmap";
import { RankedList } from "@/components/charts/ranked-list";
import { Bullets, Card, Section, SubGrid } from "./section";
import { PostCard } from "./post-card";
import { GradeBadge } from "./free-sections";

const TYPE_LABEL: Record<string, string> = { image: "Photos", video: "Videos", carousel: "Carousels", reel: "Reels", igtv: "IGTV" };
const signed = (n: number | undefined) => (n === undefined ? "–" : `${n >= 0 ? "+" : ""}${n}%`);

export function ScoreView({ data }: { data: ProSections["score"] }) {
  return (
    <Section id="score" title="ReelSync score & recommendations" badge="pro" description="How the score is built, and what would move it most.">
      <SubGrid>
        <Card>
          <div className="flex items-center gap-4">
            <GradeBadge grade={data.grade} />
            <div className="text-3xl font-semibold tabular">{data.score}/100</div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.components.map((c) => (
              <li key={c.name}>
                <div className="flex justify-between gap-3">
                  <span>{c.name}</span>
                  <span className="tabular text-muted">
                    {c.score}/{c.max}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-line mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.score / c.max) * 100}%`, background: "var(--viz-1)" }} />
                </div>
                <div className="text-xs text-faint mt-0.5">{c.note}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Recommendations">
          <ol className="space-y-3">
            {data.recommendations.map((r) => (
              <li key={r.title} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${r.impact === "high" ? "brand-gradient text-white" : "bg-line text-muted"}`}>{r.impact}</span>
                  <span className="font-medium">{r.title}</span>
                </div>
                <p className="text-muted mt-1">{r.detail}</p>
              </li>
            ))}
          </ol>
        </Card>
      </SubGrid>
    </Section>
  );
}

export function EngagementDeepView({ data }: { data: ProSections["engagement"] }) {
  return (
    <Section id="engagement-full" title="Engagement in depth" badge="pro" description="Which formats work, how likes and comments relate, and whether engagement is trending up or down.">
      <StatGrid>
        <Stat label="Median likes" value={fmtCompact(data.medianLikes)} hint={`Range ${fmtCompact(data.minLikes)} to ${fmtCompact(data.maxLikes)}`} />
        <Stat label="Comments per 100 likes" value={fmtNumber(data.commentsPerHundredLikes)} hint="Conversation depth" />
        <Stat label="Recent vs older posts" value={signed(data.recentVsOlderPct)} hint="Newest third against oldest third" />
        <Stat label="Reel views / followers" value={data.reelViewRatePct !== undefined ? `${data.reelViewRatePct}%` : "–"} hint="Reach beyond the audience" />
      </StatGrid>
      <Card title="By format">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-faint text-xs uppercase tracking-wide">
                <th className="py-1 pr-3 font-medium">Format</th>
                <th className="py-1 pr-3 font-medium text-right">Posts</th>
                <th className="py-1 pr-3 font-medium text-right">Avg likes</th>
                <th className="py-1 pr-3 font-medium text-right">Avg comments</th>
                <th className="py-1 pr-3 font-medium text-right">Avg views</th>
                <th className="py-1 pr-3 font-medium text-right">Eng. rate</th>
              </tr>
            </thead>
            <tbody>
              {data.byType.map((t) => (
                <tr key={t.type} className="border-t border-line">
                  <td className="py-1.5 pr-3">{TYPE_LABEL[t.type] ?? t.type}</td>
                  <td className="py-1.5 pr-3 tabular text-right">{t.count}</td>
                  <td className="py-1.5 pr-3 tabular text-right">{fmtCompact(t.avgLikes)}</td>
                  <td className="py-1.5 pr-3 tabular text-right">{fmtNumber(t.avgComments)}</td>
                  <td className="py-1.5 pr-3 tabular text-right">{t.avgViews !== undefined ? fmtCompact(t.avgViews) : "–"}</td>
                  <td className="py-1.5 pr-3 tabular text-right">{t.engagementRate !== undefined ? `${t.engagementRate}%` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <BarSeries
        title="Engagement per post, oldest to newest"
        data={data.engagementByPost.map((p) => ({ label: p.timestamp.slice(5, 10), value: p.engagement, tooltip: `${p.type} · ${p.timestamp.slice(0, 10)}: ${fmtNumber(p.engagement)}` }))}
        format={fmtCompact}
      />
      {(data.sponsoredPosts > 0 || data.likesHiddenPosts > 0) && (
        <Card>
          <Bullets
            items={[
              { label: "Sponsored posts analysed", value: fmtNumber(data.sponsoredPosts) },
              { label: "Avg engagement, sponsored", value: fmtCompact(data.sponsoredAvgEngagement) },
              { label: "Avg engagement, organic", value: fmtCompact(data.organicAvgEngagement) },
              { label: "Posts with hidden like counts", value: fmtNumber(data.likesHiddenPosts) },
            ]}
          />
        </Card>
      )}
    </Section>
  );
}

export function TimingView({ data, timeZone }: { data: ProSections["timing"]; timeZone: string }) {
  return (
    <Section id="timing" title="When to post" badge="pro" description={`Best slots are based on the average engagement of posts published at that time (${timeZone}).`}>
      <StatGrid>
        <Stat label="Best day" value={data.bestWeekday !== undefined ? WEEKDAYS_LONG[data.bestWeekday] : "–"} hint="Highest average engagement" />
        <Stat label="Best hour" value={fmtHour(data.bestHour)} />
        <Stat label="Most used day" value={data.mostUsedWeekday !== undefined ? WEEKDAYS_LONG[data.mostUsedWeekday] : "–"} hint="Where posts usually go" />
        <Stat label="Most used hour" value={fmtHour(data.mostUsedHour)} />
      </StatGrid>
      <SubGrid>
        <BarSeries title="Average engagement by weekday" data={data.byWeekday.map((w) => ({ label: WEEKDAYS_LONG[w.weekday].slice(0, 3), value: w.avgEngagement ?? 0, tooltip: `${WEEKDAYS_LONG[w.weekday]}: ${w.posts} posts, avg ${fmtNumber(w.avgEngagement)}` }))} format={fmtCompact} labelEvery={1} />
        <BarSeries title="Average engagement by time of day" data={data.byHourBucket.map((b) => ({ label: b.label.split(" ")[0], value: b.avgEngagement ?? 0, tooltip: `${b.label}: ${b.posts} posts, avg ${fmtNumber(b.avgEngagement)}` }))} format={fmtCompact} labelEvery={1} />
      </SubGrid>
      <Heatmap grid={data.postingHeatmap} title="When this account posts (weekday × hour)" />
    </Section>
  );
}

export function CadenceDeepView({ data, timeZone }: { data: ProSections["cadence"]; timeZone: string }) {
  return (
    <Section id="cadence-full" title="Cadence & consistency" badge="pro">
      <StatGrid>
        <Stat label="Posts per month" value={fmtNumber(data.postsPerMonth)} hint={`${fmtNumber(data.postsPerWeek)} per week`} />
        <Stat label="Average gap" value={data.avgGapDays !== undefined ? `${data.avgGapDays} days` : "–"} hint={data.longestGapDays !== undefined ? `Longest ${data.longestGapDays} days` : undefined} />
        <Stat label="Consistency" value={data.consistencyScore !== undefined ? `${data.consistencyScore}/100` : "–"} hint="Regularity of gaps" />
        <Stat label="Active weeks" value={fmtPct(data.activeWeeksPct)} hint="Weeks with at least one post" />
      </StatGrid>
      <MonthBars data={data.byMonth} title="Posts per month (analysed window)" />
      {data.firstPostAt && (
        <p className="text-xs text-faint">
          Window: {fmtDate(Math.floor(new Date(data.firstPostAt).getTime() / 1000), timeZone)} to {fmtDate(Math.floor(new Date(data.lastPostAt ?? data.firstPostAt).getTime() / 1000), timeZone)}
        </p>
      )}
    </Section>
  );
}

export function ContentView({ data, timeZone }: { data: ProSections["content"]; timeZone: string }) {
  return (
    <Section id="content" title="Content" badge="pro">
      <SubGrid>
        <Card title="Format mix">
          <RankedList items={data.mix.map((m) => ({ name: TYPE_LABEL[m.name] ?? m.name, count: m.count }))} limit={5} unit="posts" />
          <div className="mt-3 text-sm text-muted space-y-1">
            <div>Reels vs photos: <span className="font-medium tabular">{signed(data.reelVsImageEngagementPct)}</span></div>
            <div>Carousels vs photos: <span className="font-medium tabular">{signed(data.carouselVsImageEngagementPct)}</span></div>
          </div>
        </Card>
        <Card title="Lowest performing">
          <div className="space-y-2">
            {data.bottomPosts.map((p) => (
              <PostCard key={p.id} post={p} timeZone={timeZone} />
            ))}
          </div>
        </Card>
      </SubGrid>
      <Card title="Top posts">
        <div className="grid md:grid-cols-2 gap-2">
          {data.topPosts.map((p, i) => (
            <PostCard key={p.id} post={p} timeZone={timeZone} rank={i + 1} />
          ))}
        </div>
      </Card>
    </Section>
  );
}

export function HashtagsView({ data }: { data: ProSections["hashtags"] }) {
  return (
    <Section id="hashtags" title="Hashtags" badge="pro">
      <StatGrid>
        <Stat label="Hashtags per post" value={fmtNumber(data.avgPerPost)} />
        <Stat label="Posts using hashtags" value={fmtPct(data.postsWithHashtagsPct)} />
        <Stat label="With vs without" value={signed(data.withVsWithoutEngagementPct)} hint="Engagement difference" />
      </StatGrid>
      <SubGrid>
        <Card title="Most used">
          <RankedList items={data.usage} limit={15} prefix="#" unit="posts" />
        </Card>
        <Card title="Best performing (used 2+ times)">
          <RankedList items={data.performance.map((p) => ({ name: `${p.name} (${p.uses}×)`, count: p.avgEngagement }))} limit={15} prefix="#" />
        </Card>
      </SubGrid>
      <BarSeries title="Average engagement by hashtag count" data={data.byCountBucket.map((b) => ({ label: b.label, value: b.avgEngagement ?? 0, tooltip: `${b.label} hashtags: ${b.posts} posts, avg ${fmtNumber(b.avgEngagement)}` }))} format={fmtCompact} labelEvery={1} />
    </Section>
  );
}

export function CaptionsView({ data }: { data: ProSections["captions"] }) {
  return (
    <Section id="captions" title="Captions" badge="pro">
      <StatGrid>
        <Stat label="Average length" value={data.avgLength !== undefined ? `${fmtNumber(data.avgLength)} chars` : "–"} hint={`${fmtPct(data.withCaptionPct)} have a caption`} />
        <Stat label="With a call to action" value={fmtPct(data.ctaPct)} hint={`Effect: ${signed(data.ctaVsNoCtaEngagementPct)}`} />
        <Stat label="Ask a question" value={fmtPct(data.questionPct)} />
        <Stat label="Use emoji" value={fmtPct(data.emojiPct)} hint={`${fmtPct(data.mentionsPct)} mention someone`} />
      </StatGrid>
      <SubGrid>
        <BarSeries title="Average engagement by caption length" data={data.byLengthBucket.map((b) => ({ label: b.label.split(" ")[0], value: b.avgEngagement ?? 0, tooltip: `${b.label}: ${b.posts} posts, avg ${fmtNumber(b.avgEngagement)}` }))} format={fmtCompact} labelEvery={1} />
        <Card title="Words that appear most">
          <p className="text-sm leading-7">
            {data.topWords.length === 0 ? <span className="text-faint">No captions.</span> : data.topWords.map((w) => (
              <span key={w.name} className="inline-block mr-1.5 px-2 rounded-full bg-background border border-line">
                {w.name} <span className="text-faint tabular">{w.count}</span>
              </span>
            ))}
          </p>
          {data.topMentions.length > 0 && <p className="text-xs text-muted mt-3">Mentions: {data.topMentions.map((m) => `@${m.name} (${m.count})`).join(", ")}</p>}
        </Card>
      </SubGrid>
    </Section>
  );
}

export function GrowthView({ data }: { data: ProSections["growth"] }) {
  return (
    <Section id="growth" title="Follower growth" badge="pro" description={data.note}>
      {data.followersChange && (
        <StatGrid>
          <Stat label={`Change over ${data.followersChange.days} days`} value={`${data.followersChange.delta >= 0 ? "+" : ""}${fmtCompact(data.followersChange.delta)}`} hint={`${data.followersChange.pct >= 0 ? "+" : ""}${data.followersChange.pct}%`} />
          <Stat label="Per day" value={`${data.followersChange.delta >= 0 ? "+" : ""}${fmtNumber(Math.round(data.followersChange.delta / data.followersChange.days))}`} />
        </StatGrid>
      )}
      {data.history.length >= 2 ? (
        <BarSeries title="Followers over time" data={data.history.map((h) => ({ label: h.at.slice(5, 10), value: h.followers, tooltip: `${h.at.slice(0, 10)}: ${fmtNumber(h.followers)} followers` }))} format={fmtCompact} />
      ) : (
        <p className="text-sm text-faint">Only one snapshot so far.</p>
      )}
    </Section>
  );
}
