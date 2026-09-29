import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ProfileReport, PostSummary } from "@/lib/profile/report";
import { WEEKDAY_NAMES } from "@/lib/profile/time";
import { pdfSafe } from "./text";
import { BLUE, BRAND, FAINT, INK, LINE, MUTED, PdfBars, PdfHeatmap, compact } from "./charts";

const CONTENT_WIDTH = 515; // A4 width 595 minus 40pt padding each side

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 40, fontFamily: "DejaVu", fontSize: 9, color: INK },
  header: { position: "absolute", top: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: FAINT },
  footer: { position: "absolute", bottom: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: FAINT },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 2, lineHeight: 1.2 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 6, color: INK, lineHeight: 1.2 },
  h3: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4, lineHeight: 1.2 },
  muted: { color: MUTED, lineHeight: 1.4 },
  faint: { color: FAINT, fontSize: 7.5, lineHeight: 1.4 },
  row: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, borderWidth: 0.7, borderColor: LINE, borderRadius: 6, padding: 8 },
  tileLabel: { fontSize: 6.5, color: FAINT, textTransform: "uppercase", letterSpacing: 0.4 },
  tileValue: { fontSize: 16, fontWeight: 700, marginTop: 2, lineHeight: 1.2 },
  tileHint: { fontSize: 7, color: MUTED, marginTop: 1, lineHeight: 1.3 },
  table: { borderWidth: 0.7, borderColor: LINE, borderRadius: 6, overflow: "hidden" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3.5, paddingHorizontal: 6 },
  th: { fontSize: 6.5, color: FAINT, textTransform: "uppercase", letterSpacing: 0.3 },
  td: { fontSize: 8.5, lineHeight: 1.3 },
  right: { textAlign: "right" },
  grade: { backgroundColor: BRAND, color: "#fff", fontWeight: 700, fontSize: 18, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, lineHeight: 1.2 },
  barBg: { height: 4, backgroundColor: LINE, borderRadius: 2, marginTop: 2 },
  barFg: { height: 4, backgroundColor: BLUE, borderRadius: 2 },
  chip: { borderWidth: 0.6, borderColor: LINE, borderRadius: 8, paddingVertical: 1.5, paddingHorizontal: 5, fontSize: 7.5, marginRight: 4, marginBottom: 4 },
  rec: { marginBottom: 5 },
  recDetail: { color: MUTED, fontSize: 8.5, lineHeight: 1.35 },
  impact: { fontSize: 6, lineHeight: 1.2, textTransform: "uppercase", letterSpacing: 0.4, color: "#fff", backgroundColor: MUTED, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2, marginRight: 4 },
  impactHigh: { backgroundColor: BRAND },
});

const fmt = (n: number | undefined, digits = 0) => (n === undefined || !Number.isFinite(n) ? "–" : n.toLocaleString("en-US", { maximumFractionDigits: digits }));
const pct = (n: number | undefined) => (n === undefined ? "–" : `${n}%`);
const signed = (n: number | undefined) => (n === undefined ? "–" : `${n >= 0 ? "+" : ""}${n}%`);
const date = (iso: string | undefined) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");
const hour = (h: number | undefined) => (h === undefined ? "–" : h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`);
const TYPE_LABEL: Record<string, string> = { image: "Photos", video: "Videos", carousel: "Carousels", reel: "Reels", igtv: "IGTV" };

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={s.tile}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={s.tileValue}>{value}</Text>
      {hint ? <Text style={s.tileHint}>{hint}</Text> : null}
    </View>
  );
}

function Table({ head, rows, widths }: { head: string[]; rows: (string | number)[][]; widths: number[] }) {
  return (
    <View style={s.table}>
      <View style={[s.tr, { backgroundColor: "#f9f9f7" }]}>
        {head.map((h, i) => (
          <Text key={i} style={[s.th, { width: `${widths[i]}%` }, i > 0 ? s.right : {}]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.tr} wrap={false}>
          {r.map((c, i) => (
            <Text key={i} style={[s.td, { width: `${widths[i]}%` }, i > 0 ? s.right : {}]}>
              {String(c)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function RankedBars({ items, prefix = "" }: { items: { name: string; count: number }[]; prefix?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <View>
      {items.map((i) => (
        <View key={i.name} style={{ marginBottom: 3 }} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 8 }}>
              {prefix}
              {pdfSafe(i.name, 40)}
            </Text>
            <Text style={{ fontSize: 8, color: MUTED }}>{fmt(i.count)}</Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFg, { width: `${(i.count / max) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function PostRow({ post, rank }: { post: PostSummary; rank?: number }) {
  const label = post.productType === "reel" ? "Reel" : post.type === "carousel" ? "Carousel" : post.type === "video" ? "Video" : "Photo";
  return (
    <View style={{ borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 4 }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, color: FAINT }}>
          {rank !== undefined ? `#${rank} · ` : ""}
          {label} · {date(post.timestamp)}
          {post.isSponsored ? " · sponsored" : ""}
        </Text>
        <Text style={{ fontSize: 7, color: MUTED }}>
          {compact(post.likes)} likes · {compact(post.comments)} comments{post.views !== undefined ? ` · ${compact(post.views)} views` : ""}
        </Text>
      </View>
      <Text style={{ fontSize: 8 }}>{pdfSafe(post.caption, 140) || "No caption"}</Text>
      <Link src={post.url} style={{ fontSize: 6.5, color: BLUE }}>
        {post.url}
      </Link>
    </View>
  );
}

function Header({ username, generated }: { username: string; generated: string }) {
  return (
    <View style={s.header} fixed>
      <Text>ReelSync · Instagram analysis for @{username}</Text>
      <Text>{generated}</Text>
    </View>
  );
}

function Footer({ reportUrl }: { reportUrl: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{reportUrl}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export function ReportDocument({ report, reportUrl }: { report: ProfileReport; reportUrl: string }) {
  const { free, pro, timeZone } = report;
  const p = free.overview.profile;
  const generated = date(report.generatedAt);
  const title = `ReelSync report · @${p.username}`;

  return (
    <Document title={title} author="ReelSync" subject="Instagram profile analysis">
      {/* ------------------------------------------------------------ Page 1 */}
      <Page size="A4" style={s.page}>
        <Header username={p.username} generated={generated} />
        <Footer reportUrl={reportUrl} />
        <Text style={s.h1}>@{p.username}</Text>
        {p.fullName ? <Text style={{ fontSize: 11, color: MUTED, lineHeight: 1.3 }}>{pdfSafe(p.fullName, 80)}</Text> : null}
        <Text style={[s.faint, { marginTop: 2 }]}>
          Public data fetched {date(p.fetchedAt)} · {free.overview.postsAnalysed} most recent posts analysed · times in {timeZone}
          {p.provider === "demo" ? " · DEMO DATA" : ""}
        </Text>
        {p.biography ? <Text style={[s.muted, { marginTop: 6 }]}>{pdfSafe(p.biography, 300)}</Text> : null}

        <View style={[s.row, { marginTop: 14 }]}>
          <Tile label="Followers" value={compact(p.followers)} hint={fmt(p.followers)} />
          <Tile label="Following" value={compact(p.following)} hint={free.overview.followRatio !== undefined ? `Ratio ${free.overview.followRatio}` : undefined} />
          <Tile label="Posts" value={compact(p.postsCount)} hint={free.overview.followersPerPost !== undefined ? `${fmt(free.overview.followersPerPost)} followers per post` : undefined} />
          <Tile label="Posts / week" value={fmt(free.cadence.postsPerWeek, 1)} hint={`${fmt(free.cadence.daysSinceLastPost)} days since last post`} />
        </View>

        <Text style={s.h2}>Score</Text>
        <View style={[s.row, { alignItems: "flex-start" }]}>
          <View style={[s.tile, { flex: 1 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={s.grade}>{pro.score.grade}</Text>
              <Text style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{pro.score.score}/100</Text>
            </View>
            {pro.score.components.map((c) => (
              <View key={c.name} style={{ marginTop: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 8 }}>{c.name}</Text>
                  <Text style={{ fontSize: 8, color: MUTED }}>
                    {c.score}/{c.max}
                  </Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFg, { width: `${(c.score / c.max) * 100}%` }]} />
                </View>
                <Text style={s.faint}>{c.note}</Text>
              </View>
            ))}
          </View>
          <View style={[s.tile, { flex: 1 }]}>
            <Text style={s.tileLabel}>Engagement rate</Text>
            <Text style={s.tileValue}>{pct(free.engagement.engagementRate)}</Text>
            <Text style={s.tileHint}>
              Typical for {free.engagement.benchmarkTier}: {free.engagement.benchmarkRate}%
            </Text>
            <View style={{ marginTop: 10 }}>
              <Text style={s.tileLabel}>Average per post</Text>
              <Text style={{ fontSize: 9, marginTop: 2 }}>
                {fmt(free.engagement.avgLikes)} likes · {fmt(free.engagement.avgComments, 1)} comments
              </Text>
              <Text style={[s.tileLabel, { marginTop: 8 }]}>Reels share</Text>
              <Text style={{ fontSize: 9, marginTop: 2 }}>{pct(free.cadence.reelsSharePct)} of analysed posts</Text>
              <Text style={[s.tileLabel, { marginTop: 8 }]}>Best day to post</Text>
              <Text style={{ fontSize: 9, marginTop: 2 }}>
                {free.teaser.bestDayName ?? "–"} around {hour(pro.timing.bestHour)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.h2}>Recommendations</Text>
        {pro.score.recommendations.map((r) => (
          <View key={r.title} style={s.rec} wrap={false}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[s.impact, r.impact === "high" ? s.impactHigh : {}]}>{r.impact}</Text>
              <Text style={{ fontWeight: 700, lineHeight: 1.2 }}>{pdfSafe(r.title, 120)}</Text>
            </View>
            <Text style={s.recDetail}>{pdfSafe(r.detail, 400)}</Text>
          </View>
        ))}
      </Page>

      {/* ------------------------------------------------------------ Page 2: engagement + timing */}
      <Page size="A4" style={s.page}>
        <Header username={p.username} generated={generated} />
        <Footer reportUrl={reportUrl} />
        <Text style={s.h2}>Engagement in depth</Text>
        <View style={s.row}>
          <Tile label="Median likes" value={compact(pro.engagement.medianLikes ?? 0)} hint={`Range ${compact(pro.engagement.minLikes ?? 0)} to ${compact(pro.engagement.maxLikes ?? 0)}`} />
          <Tile label="Comments / 100 likes" value={fmt(pro.engagement.commentsPerHundredLikes, 1)} />
          <Tile label="Recent vs older" value={signed(pro.engagement.recentVsOlderPct)} hint="Newest third vs oldest third" />
          <Tile label="Reel views / followers" value={pro.engagement.reelViewRatePct !== undefined ? `${pro.engagement.reelViewRatePct}%` : "–"} />
        </View>
        <Text style={s.h3}>By format</Text>
        <Table
          head={["Format", "Posts", "Avg likes", "Avg comments", "Avg views", "Eng. rate"]}
          widths={[25, 12, 16, 16, 16, 15]}
          rows={pro.engagement.byType.map((t) => [TYPE_LABEL[t.type] ?? t.type, t.count, compact(t.avgLikes ?? 0), fmt(t.avgComments, 1), t.avgViews !== undefined ? compact(t.avgViews) : "–", t.engagementRate !== undefined ? `${t.engagementRate}%` : "–"])}
        />
        <Text style={s.h3}>Engagement per post, oldest to newest</Text>
        <PdfBars width={CONTENT_WIDTH} data={pro.engagement.engagementByPost.map((e) => ({ label: e.timestamp.slice(5, 10), value: e.engagement }))} />

        <Text style={s.h2}>When to post</Text>
        <View style={s.row}>
          <Tile label="Best day" value={pro.timing.bestWeekday !== undefined ? WEEKDAY_NAMES[pro.timing.bestWeekday] : "–"} hint="Highest average engagement" />
          <Tile label="Best hour" value={hour(pro.timing.bestHour)} />
          <Tile label="Most used day" value={pro.timing.mostUsedWeekday !== undefined ? WEEKDAY_NAMES[pro.timing.mostUsedWeekday] : "–"} />
          <Tile label="Most used hour" value={hour(pro.timing.mostUsedHour)} />
        </View>
        <View style={[s.row, { marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Average engagement by weekday</Text>
            <PdfBars width={CONTENT_WIDTH / 2 - 4} height={100} labelEvery={1} data={pro.timing.byWeekday.map((w) => ({ label: WEEKDAY_NAMES[w.weekday].slice(0, 3), value: w.avgEngagement ?? 0 }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>By time of day</Text>
            <PdfBars width={CONTENT_WIDTH / 2 - 4} height={100} labelEvery={1} data={pro.timing.byHourBucket.map((b) => ({ label: b.label.split(" ")[0], value: b.avgEngagement ?? 0 }))} />
          </View>
        </View>
        <Text style={s.h3}>Posting heatmap (weekday × hour)</Text>
        <PdfHeatmap grid={pro.timing.postingHeatmap} width={CONTENT_WIDTH} />
      </Page>

      {/* ------------------------------------------------------------ Page 3: cadence + content */}
      <Page size="A4" style={s.page}>
        <Header username={p.username} generated={generated} />
        <Footer reportUrl={reportUrl} />
        <Text style={s.h2}>Cadence & consistency</Text>
        <View style={s.row}>
          <Tile label="Posts / month" value={fmt(pro.cadence.postsPerMonth, 1)} hint={`${fmt(pro.cadence.postsPerWeek, 1)} per week`} />
          <Tile label="Average gap" value={pro.cadence.avgGapDays !== undefined ? `${pro.cadence.avgGapDays} d` : "–"} hint={pro.cadence.longestGapDays !== undefined ? `Longest ${pro.cadence.longestGapDays} days` : undefined} />
          <Tile label="Consistency" value={pro.cadence.consistencyScore !== undefined ? `${pro.cadence.consistencyScore}/100` : "–"} />
          <Tile label="Active weeks" value={pct(pro.cadence.activeWeeksPct)} />
        </View>
        <Text style={s.h3}>Posts per month</Text>
        <PdfBars width={CONTENT_WIDTH} height={100} data={pro.cadence.byMonth.map((m) => ({ label: m.month.slice(2), value: m.count }))} />

        <Text style={s.h2}>Content</Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Format mix</Text>
            <RankedBars items={pro.content.mix.map((m) => ({ name: TYPE_LABEL[m.name] ?? m.name, count: m.count }))} />
            <Text style={[s.muted, { marginTop: 4 }]}>Reels vs photos: {signed(pro.content.reelVsImageEngagementPct)}</Text>
            <Text style={s.muted}>Carousels vs photos: {signed(pro.content.carouselVsImageEngagementPct)}</Text>
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={s.h3}>Lowest performing</Text>
            {pro.content.bottomPosts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </View>
        </View>
        <Text style={s.h3}>Top posts</Text>
        {pro.content.topPosts.map((post, i) => (
          <PostRow key={post.id} post={post} rank={i + 1} />
        ))}
      </Page>

      {/* ------------------------------------------------------------ Page 4: hashtags + captions + growth */}
      <Page size="A4" style={s.page}>
        <Header username={p.username} generated={generated} />
        <Footer reportUrl={reportUrl} />
        <Text style={s.h2}>Hashtags</Text>
        <View style={s.row}>
          <Tile label="Per post" value={fmt(pro.hashtags.avgPerPost, 1)} />
          <Tile label="Posts using hashtags" value={pct(pro.hashtags.postsWithHashtagsPct)} />
          <Tile label="With vs without" value={signed(pro.hashtags.withVsWithoutEngagementPct)} hint="Engagement difference" />
        </View>
        <View style={[s.row, { marginTop: 6 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Most used</Text>
            <RankedBars items={pro.hashtags.usage.slice(0, 12)} prefix="#" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Best performing (used 2+ times)</Text>
            <RankedBars items={pro.hashtags.performance.slice(0, 12).map((h) => ({ name: `${h.name} (${h.uses}x)`, count: h.avgEngagement }))} prefix="#" />
          </View>
        </View>
        <Text style={s.h3}>Average engagement by hashtag count</Text>
        <PdfBars width={CONTENT_WIDTH} height={90} labelEvery={1} data={pro.hashtags.byCountBucket.map((b) => ({ label: b.label, value: b.avgEngagement ?? 0 }))} />

        <Text style={s.h2}>Captions</Text>
        <View style={s.row}>
          <Tile label="Average length" value={pro.captions.avgLength !== undefined ? `${fmt(pro.captions.avgLength)} chars` : "–"} hint={`${pct(pro.captions.withCaptionPct)} have a caption`} />
          <Tile label="Call to action" value={pct(pro.captions.ctaPct)} hint={`Effect: ${signed(pro.captions.ctaVsNoCtaEngagementPct)}`} />
          <Tile label="Ask a question" value={pct(pro.captions.questionPct)} />
          <Tile label="Use emoji" value={pct(pro.captions.emojiPct)} hint={`${pct(pro.captions.mentionsPct)} mention someone`} />
        </View>
        <View style={[s.row, { marginTop: 6 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Engagement by caption length</Text>
            <PdfBars width={CONTENT_WIDTH / 2 - 4} height={90} labelEvery={1} data={pro.captions.byLengthBucket.map((b) => ({ label: b.label.split(" ")[0], value: b.avgEngagement ?? 0 }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>Words that appear most</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {pro.captions.topWords.slice(0, 24).map((w) => (
                <Text key={w.name} style={s.chip}>
                  {pdfSafe(w.name, 24)} {w.count}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <Text style={s.h2}>Follower growth</Text>
        <Text style={s.muted}>{pro.growth.note}</Text>
        {pro.growth.followersChange ? (
          <View style={[s.row, { marginTop: 6 }]}>
            <Tile label={`Change over ${pro.growth.followersChange.days} days`} value={`${pro.growth.followersChange.delta >= 0 ? "+" : ""}${compact(pro.growth.followersChange.delta)}`} hint={`${pro.growth.followersChange.pct >= 0 ? "+" : ""}${pro.growth.followersChange.pct}%`} />
            <Tile label="Per day" value={`${pro.growth.followersChange.delta >= 0 ? "+" : ""}${fmt(Math.round(pro.growth.followersChange.delta / pro.growth.followersChange.days))}`} />
          </View>
        ) : null}
        {pro.growth.history.length >= 2 ? (
          <View style={{ marginTop: 6 }}>
            <PdfBars width={CONTENT_WIDTH} height={90} data={pro.growth.history.map((h) => ({ label: h.at.slice(5, 10), value: h.followers }))} />
          </View>
        ) : null}

        <Text style={[s.faint, { marginTop: 18 }]}>
          Computed from publicly visible profile data at the time shown in the header. Like counts hidden by the account are excluded. ReelSync is an independent tool and is not
          affiliated with Instagram or Meta.
        </Text>
      </Page>
    </Document>
  );
}
