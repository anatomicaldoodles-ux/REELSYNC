import type { ProSections } from "@/lib/instagram/analyze/report";
import { WEEKDAYS_LONG, fmtDate, fmtHour, fmtMinutes, fmtNumber, fmtPct } from "@/lib/format";
import { Stat, StatGrid } from "@/components/charts/stat";
import { MonthBars } from "@/components/charts/month-bars";
import { DualMonthBars } from "@/components/charts/dual-month-bars";
import { Heatmap } from "@/components/charts/heatmap";
import { RankedList } from "@/components/charts/ranked-list";
import { Card, NameList, Section, SubGrid } from "./section";

interface Ctx {
  timeZone: string;
}

export function FollowersFullView({ data, timeZone }: { data: ProSections["followers"] } & Ctx) {
  return (
    <Section id="followers-full" title="Followers in depth" badge="pro" description="Full lists, with the month each relationship started where Instagram recorded it.">
      <SubGrid>
        <Card title={`Don't follow you back (${fmtNumber(data.notFollowingBack.length)})`}>
          <NameList items={data.notFollowingBack} timeZone={timeZone} emptyText="Everyone you follow follows you back." />
        </Card>
        <Card title={`Fans: follow you, you don't follow them (${fmtNumber(data.fans.length)})`}>
          <NameList items={data.fans} timeZone={timeZone} />
        </Card>
      </SubGrid>
      <SubGrid>
        <MonthBars data={data.followersByMonth} title="New followers per month" />
        <MonthBars data={data.followingByMonth} title="Accounts you followed per month" />
      </SubGrid>
      <SubGrid>
        <Card title="Oldest followers">
          <NameList items={data.oldestFollowers} timeZone={timeZone} />
        </Card>
        <Card title="Newest followers">
          <NameList items={data.newestFollowers} timeZone={timeZone} />
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title={`Followers you have never interacted with (${fmtNumber(data.followersNeverInteracted.count)})`}>
          <p className="text-xs text-muted mb-2">No likes, comments, saves, story reactions or searches from you. A first 50 are listed.</p>
          <NameList items={data.followersNeverInteracted.sample.map((username) => ({ username }))} />
        </Card>
        <Card title={`You follow but never interact with (${fmtNumber(data.followingNeverInteracted.count)})`}>
          <p className="text-xs text-muted mb-2">Candidates for a cleanup. A first 50 are listed.</p>
          <NameList items={data.followingNeverInteracted.sample.map((username) => ({ username }))} />
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title={`Mutuals (${fmtNumber(data.mutuals.length)})`}>
          <NameList items={data.mutuals} timeZone={timeZone} />
        </Card>
        <div className="space-y-6">
          <Card title={`Recently unfollowed by you (${fmtNumber(data.recentlyUnfollowed.length)})`}>
            <NameList items={data.recentlyUnfollowed} timeZone={timeZone} />
          </Card>
          <Card title={`Pending follow requests you sent (${fmtNumber(data.pendingSent.length)})`}>
            <NameList items={data.pendingSent} timeZone={timeZone} />
          </Card>
          <Card title={`Close friends (${fmtNumber(data.closeFriends.length)})`}>
            <NameList items={data.closeFriends} timeZone={timeZone} />
          </Card>
          <Card title={`Blocked (${fmtNumber(data.blocked.length)}) · Restricted (${fmtNumber(data.restricted.length)}) · Hidden from your story (${fmtNumber(data.hideStoryFrom.length)})`}>
            <NameList items={[...data.blocked, ...data.restricted, ...data.hideStoryFrom]} timeZone={timeZone} />
          </Card>
        </div>
      </SubGrid>
    </Section>
  );
}

export function PeopleView({ data, timeZone }: { data: ProSections["people"] } & Ctx) {
  return (
    <Section id="people-full" title="Everyone you interact with" badge="pro" description="Ranked by a weighted score: comments count 4, saves 3, story reactions and searches 2, likes 1.">
      <Card title="Top 100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-faint text-xs uppercase tracking-wide">
                <th className="py-1 pr-3 font-medium">#</th>
                <th className="py-1 pr-3 font-medium">Account</th>
                <th className="py-1 pr-3 font-medium text-right">Score</th>
                <th className="py-1 pr-3 font-medium text-right">Likes</th>
                <th className="py-1 pr-3 font-medium text-right">Comments</th>
                <th className="py-1 pr-3 font-medium text-right">Stories</th>
                <th className="py-1 pr-3 font-medium text-right">Saves</th>
                <th className="py-1 pr-3 font-medium text-right">Searches</th>
                <th className="py-1 pr-3 font-medium">Relationship</th>
                <th className="py-1 pr-3 font-medium">Last</th>
              </tr>
            </thead>
            <tbody>
              {data.ranked.map((p, i) => (
                <tr key={p.username} className="border-t border-line">
                  <td className="py-1 pr-3 tabular text-faint">{i + 1}</td>
                  <td className="py-1 pr-3">
                    <a href={`https://www.instagram.com/${encodeURIComponent(p.username)}`} target="_blank" rel="noreferrer noopener" className="hover:underline">
                      @{p.username}
                    </a>
                  </td>
                  <td className="py-1 pr-3 tabular text-right font-medium">{fmtNumber(p.score)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(p.likes)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(p.comments)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(p.storyInteractions)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(p.saves)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(p.searches)}</td>
                  <td className="py-1 pr-3 text-muted">
                    {p.youFollow && p.followsYou ? "Mutual" : p.youFollow ? "You follow" : p.followsYou ? "Follows you" : "Not connected"}
                  </td>
                  <td className="py-1 pr-3 text-faint tabular">{fmtDate(p.lastAt, timeZone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <SubGrid>
        <Card title="One-sided: you engage a lot, they don't follow you">
          <RankedList items={data.unrequitedTop.map((p) => ({ name: p.username, count: p.score }))} limit={15} prefix="@" unit="pts" linkUsernames />
        </Card>
        <Card title="Secret favourites: accounts you don't follow but keep engaging with">
          <RankedList items={data.secretFavourites.map((p) => ({ name: p.username, count: p.score }))} limit={15} prefix="@" unit="pts" linkUsernames />
        </Card>
      </SubGrid>
    </Section>
  );
}

export function EngagementView({ data, timeZone }: { data: ProSections["engagement"] } & Ctx) {
  return (
    <Section id="engagement" title="Likes & comments" badge="pro" description="What you give to other accounts, and when.">
      <StatGrid>
        <Stat label="Accounts liked" value={fmtNumber(data.distinctAccountsLiked)} hint={`${fmtPct(data.likesToFollowingPct)} of likes go to accounts you follow`} />
        <Stat label="Likes per active day" value={fmtNumber(data.avgLikesPerActiveDay)} hint={`Longest daily streak: ${fmtNumber(data.longestLikeStreakDays)} days`} />
        <Stat label="Comment length" value={data.comments.avgLength !== undefined ? `${fmtNumber(data.comments.avgLength)} chars` : "–"} hint={`${fmtPct(data.comments.withEmojiPct)} contain an emoji`} />
        <Stat label="Comments on reels" value={fmtPct(data.comments.reelsPct)} hint={`${fmtNumber(data.commentLikes)} comments liked`} />
      </StatGrid>
      <SubGrid>
        <MonthBars data={data.likesByMonth} title="Likes per month" />
        <MonthBars data={data.commentsByMonth} title="Comments per month" />
      </SubGrid>
      <Heatmap grid={data.likesHeatmap} title="When you like posts (weekday × hour)" />
      <SubGrid>
        <Card title="Most liked accounts">
          <RankedList items={data.topLiked} limit={20} prefix="@" unit="likes" linkUsernames />
        </Card>
        <Card title="Most commented accounts">
          <RankedList items={data.topCommented} limit={20} prefix="@" unit="comments" linkUsernames />
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title="Words you use most in comments">
          <p className="text-sm leading-7">
            {data.comments.topWords.length === 0 ? (
              <span className="text-faint">No comments found.</span>
            ) : (
              data.comments.topWords.map((w) => (
                <span key={w.name} className="inline-block mr-2 px-2 rounded-full bg-background border border-line">
                  {w.name} <span className="text-faint tabular">{w.count}</span>
                </span>
              ))
            )}
          </p>
        </Card>
        <Card title="Your comment emojis">
          <p className="text-2xl leading-10">
            {data.comments.topEmojis.length === 0 ? (
              <span className="text-sm text-faint">No emojis found.</span>
            ) : (
              data.comments.topEmojis.map((e) => (
                <span key={e.name} className="inline-block mr-3">
                  {e.name}
                  <span className="text-xs text-faint tabular ml-1">{e.count}</span>
                </span>
              ))
            )}
          </p>
          {data.comments.longest && (
            <p className="text-xs text-muted mt-3">
              Longest comment ({fmtDate(data.comments.longest.at, timeZone)}, on @{data.comments.longest.mediaOwner}): “{data.comments.longest.text}”
            </p>
          )}
        </Card>
      </SubGrid>
    </Section>
  );
}

export function ContentView({ data, timeZone }: { data: ProSections["content"] } & Ctx) {
  const byMonth = data.postsByMonth;
  return (
    <Section id="content" title="Your posting" badge="pro" description="Posts, reels and stories you published, and the patterns behind them.">
      <StatGrid>
        <Stat label="Best time to post" value={data.bestHour !== undefined ? `${WEEKDAYS_LONG[data.bestWeekday ?? 0].slice(0, 3)} ${fmtHour(data.bestHour)}` : "–"} hint="Your most common posting slot" />
        <Stat label="Carousels" value={fmtPct(data.carouselPct)} hint={data.avgMediaPerPost ? `${data.avgMediaPerPost} media per post` : undefined} />
        <Stat label="Hashtags per post" value={fmtNumber(data.captions.avgHashtags)} hint={`${fmtPct(data.captions.withCaptionPct)} have a caption`} />
        <Stat label="Days between posts" value={fmtNumber(data.avgDaysBetweenPosts)} hint={data.longestGapDays !== undefined ? `Longest gap ${fmtNumber(data.longestGapDays)} days` : undefined} />
      </StatGrid>
      <SubGrid>
        <MonthBars data={byMonth.map((m) => ({ month: m.month, count: m.posts + m.reels }))} title="Posts and reels per month" />
        <MonthBars data={byMonth.map((m) => ({ month: m.month, count: m.stories }))} title="Stories per month" />
      </SubGrid>
      <Heatmap grid={data.postingHeatmap} title="When you publish (weekday × hour)" />
      <SubGrid>
        <Card title="Your hashtags">
          <RankedList items={data.captions.topHashtags} limit={20} prefix="#" />
        </Card>
        <Card title="Accounts you tag in captions">
          <RankedList items={data.captions.topMentions} limit={15} prefix="@" linkUsernames />
        </Card>
      </SubGrid>
      <Card title="Per year">
        <div className="flex flex-wrap gap-4 text-sm">
          {data.postsPerYear.map((y) => (
            <div key={y.year}>
              <span className="text-faint">{y.year}</span> <span className="tabular font-medium">{fmtNumber(y.count)}</span>
            </div>
          ))}
          {data.firstPostAt && (
            <div className="text-muted">
              First post {fmtDate(data.firstPostAt, timeZone)} · latest {fmtDate(data.lastPostAt, timeZone)}
            </div>
          )}
        </div>
      </Card>
    </Section>
  );
}

export function MessagesView({ data, timeZone }: { data: ProSections["messages"] } & Ctx) {
  const t = data.totals;
  return (
    <Section id="messages" title="Direct messages" badge="pro" description={`Across ${fmtNumber(t.threads)} conversations${data.selfName ? `, detected as “${data.selfName}”` : ""}. Names are display names, as Instagram stores them in the export.`}>
      <StatGrid>
        <Stat label="Sent / received" value={`${fmtNumber(t.sent)} / ${fmtNumber(t.received)}`} hint={`${fmtNumber(t.groupThreads)} group chats · ${fmtNumber(t.requestThreads)} requests`} />
        <Stat label="Your reply time" value={fmtMinutes(data.overallYourMedianReplyMinutes)} hint={`They take ${fmtMinutes(data.overallTheirMedianReplyMinutes)}`} />
        <Stat label="Reels shared" value={`${fmtNumber(t.reelsSent)} / ${fmtNumber(t.reelsReceived)}`} hint="sent / received" />
        <Stat label="Words per message" value={fmtNumber(data.avgWordsPerSentMessage)} hint={`${fmtPct(data.nightOwlPct)} sent between 11pm and 6am`} />
      </StatGrid>
      <DualMonthBars data={data.byMonth.map((m) => ({ month: m.month, a: m.sent, b: m.received }))} labels={["Sent", "Received"]} title="Messages per month" />
      <Heatmap grid={data.sentHeatmap} title="When you send messages (weekday × hour)" />
      <Card title="Busiest conversations">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-faint text-xs uppercase tracking-wide">
                <th className="py-1 pr-3 font-medium">Chat</th>
                <th className="py-1 pr-3 font-medium text-right">Total</th>
                <th className="py-1 pr-3 font-medium text-right">You</th>
                <th className="py-1 pr-3 font-medium text-right">Them</th>
                <th className="py-1 pr-3 font-medium text-right">Your reply</th>
                <th className="py-1 pr-3 font-medium text-right">Their reply</th>
                <th className="py-1 pr-3 font-medium text-right">Reels</th>
                <th className="py-1 pr-3 font-medium">Since</th>
              </tr>
            </thead>
            <tbody>
              {data.topThreads.map((th) => (
                <tr key={th.title + th.firstAt} className="border-t border-line">
                  <td className="py-1 pr-3 max-w-56 truncate">
                    {th.title}
                    {th.isGroup && <span className="ml-1 text-[10px] uppercase text-faint">group</span>}
                  </td>
                  <td className="py-1 pr-3 tabular text-right font-medium">{fmtNumber(th.total)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(th.sent)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(th.received)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtMinutes(th.yourMedianReplyMinutes)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtMinutes(th.theirMedianReplyMinutes)}</td>
                  <td className="py-1 pr-3 tabular text-right">{fmtNumber(th.reelsShared)}</td>
                  <td className="py-1 pr-3 text-faint tabular">{fmtDate(th.firstAt, timeZone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <SubGrid>
        <Card title={`Waiting on them (${fmtNumber(data.waitingOnThem.length)})`}>
          <p className="text-xs text-muted mb-2">You sent the last message and nobody replied for a week or more.</p>
          <ul className="text-sm space-y-1">
            {data.waitingOnThem.length === 0 && <li className="text-faint">None.</li>}
            {data.waitingOnThem.map((w) => (
              <li key={w.title + w.lastAt} className="flex justify-between gap-3">
                <span className="truncate">{w.title}</span>
                <span className="text-faint tabular shrink-0">{fmtDate(w.lastAt, timeZone)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={`Waiting on you (${fmtNumber(data.waitingOnYou.length)})`}>
          <p className="text-xs text-muted mb-2">They wrote last and you never answered.</p>
          <ul className="text-sm space-y-1">
            {data.waitingOnYou.length === 0 && <li className="text-faint">None. Inbox zero.</li>}
            {data.waitingOnYou.map((w) => (
              <li key={w.title + w.lastAt} className="flex justify-between gap-3">
                <span className="truncate">{w.title}</span>
                <span className="text-faint tabular shrink-0">{fmtDate(w.lastAt, timeZone)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title="Reactions">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-faint mb-1">You give ({fmtNumber(t.reactionsGiven)})</div>
              <p className="text-2xl leading-10">
                {data.topReactionsGiven.map((r) => (
                  <span key={r.name} className="mr-3 inline-block">
                    {r.name}
                    <span className="text-xs text-faint tabular ml-1">{r.count}</span>
                  </span>
                ))}
                {data.topReactionsGiven.length === 0 && <span className="text-sm text-faint">None</span>}
              </p>
            </div>
            <div>
              <div className="text-xs text-faint mb-1">You receive ({fmtNumber(t.reactionsReceived)})</div>
              <p className="text-2xl leading-10">
                {data.topReactionsReceived.map((r) => (
                  <span key={r.name} className="mr-3 inline-block">
                    {r.name}
                    <span className="text-xs text-faint tabular ml-1">{r.count}</span>
                  </span>
                ))}
                {data.topReactionsReceived.length === 0 && <span className="text-sm text-faint">None</span>}
              </p>
            </div>
          </div>
        </Card>
        <Card title="More">
          <ul className="text-sm space-y-1.5">
            <li>
              Photos sent <span className="tabular font-medium">{fmtNumber(t.photosSent)}</span> · voice notes <span className="tabular font-medium">{fmtNumber(t.voiceSent)}</span> · calls{" "}
              <span className="tabular font-medium">{fmtNumber(t.calls)}</span> · unsent <span className="tabular font-medium">{fmtNumber(t.unsent)}</span>
            </li>
            {data.busiestDay && (
              <li>
                Busiest day: <span className="tabular font-medium">{data.busiestDay.day}</span> with {fmtNumber(data.busiestDay.count)} messages sent
              </li>
            )}
            <li>
              New conversations per year:{" "}
              {data.threadsStartedByYear.map((y) => (
                <span key={y.year} className="mr-2">
                  <span className="text-faint">{y.year}</span> <span className="tabular">{y.count}</span>
                </span>
              ))}
            </li>
            <li className="leading-7">
              Words you send most:{" "}
              {data.topWordsSent.slice(0, 20).map((w) => (
                <span key={w.name} className="inline-block mr-1.5 px-2 rounded-full bg-background border border-line">
                  {w.name}
                </span>
              ))}
            </li>
          </ul>
        </Card>
      </SubGrid>
    </Section>
  );
}

export function StoriesSavedView({ stories, saved }: { stories: ProSections["stories"]; saved: ProSections["saved"] }) {
  return (
    <Section id="stories-saved" title="Stories & saves" badge="pro" description="Whose stories you react to, and what you keep for later.">
      <SubGrid>
        <Card title={`Story reactions (${fmtNumber(stories.total)})`}>
          <div className="flex flex-wrap gap-2 text-xs text-muted mb-3">
            {stories.byKind.map((k) => (
              <span key={k.name} className="px-2 py-0.5 rounded-full bg-background border border-line">
                {k.name.replace("_", " ")} <span className="tabular">{k.count}</span>
              </span>
            ))}
          </div>
          <RankedList items={stories.topAuthors} limit={15} prefix="@" linkUsernames />
          {stories.pollAnswers.length > 0 && (
            <p className="text-xs text-muted mt-3">
              Poll answers: {stories.pollAnswers.map((p) => `${p.name} (${p.count})`).join(", ")}
            </p>
          )}
        </Card>
        <Card title={`Saved posts (${fmtNumber(saved.total)} from ${fmtNumber(saved.distinctAuthors)} accounts)`}>
          <RankedList items={saved.topAuthors} limit={15} prefix="@" linkUsernames />
          {saved.collections.length > 0 && <p className="text-xs text-muted mt-3">Collections: {saved.collections.join(", ")}</p>}
        </Card>
      </SubGrid>
      <SubGrid>
        <MonthBars data={stories.byMonth} title="Story reactions per month" />
        <MonthBars data={saved.byMonth} title="Saves per month" />
      </SubGrid>
    </Section>
  );
}

export function InterestsView({ data }: { data: ProSections["interests"] }) {
  const a = data.advertisers;
  return (
    <Section id="interests" title="What Instagram thinks about you" badge="pro" description="The topics Instagram assigned to you, the advertisers holding your data, and what the feed actually showed you.">
      <StatGrid>
        <Stat label="Advertisers with your data" value={fmtNumber(a.total)} hint={`${fmtNumber(a.withDataFile)} uploaded lists · ${fmtNumber(a.withRemarketing)} remarketing`} />
        <Stat label="Ads shown" value={fmtNumber(data.adsViewed.total)} hint={data.adsViewed.perActiveDay ? `${data.adsViewed.perActiveDay} per active day` : undefined} />
        <Stat label="Ads clicked" value={fmtNumber(data.adsClicked.total)} />
        <Stat label="Feed from accounts you follow" value={fmtPct(data.postsViewed.followedPct)} hint={`of ${fmtNumber(data.postsViewed.total)} logged post views`} />
      </StatGrid>
      <Card title={`Your topics (${fmtNumber(data.topics.length)})`}>
        {data.topics.length === 0 ? (
          <p className="text-sm text-faint">No topics in this export.</p>
        ) : (
          <p className="text-sm leading-7">
            {data.topics.map((t) => (
              <span key={t} className="inline-block mr-1.5 px-2 rounded-full bg-background border border-line">
                {t}
              </span>
            ))}
          </p>
        )}
        {data.locationsOfInterest.length > 0 && <p className="text-xs text-muted mt-3">Locations of interest: {data.locationsOfInterest.join(", ")}</p>}
      </Card>
      <SubGrid>
        <Card title="Advertisers you see most">
          <RankedList items={data.adsViewed.topAdvertisers} limit={15} prefix="@" unit="ads" />
        </Card>
        <Card title="Accounts the feed shows you most">
          <RankedList items={data.postsViewed.topAuthors} limit={15} prefix="@" unit="views" linkUsernames />
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title="Videos you watch most (by creator)">
          <RankedList items={data.videosWatched.topAuthors} limit={15} prefix="@" linkUsernames />
        </Card>
        <Card title="Suggested accounts you looked at">
          <RankedList items={data.suggestedAccountsViewed.topAccounts} limit={15} prefix="@" linkUsernames />
          <p className="text-xs text-muted mt-3">You marked {fmtNumber(data.notInterested)} posts as “not interested”.</p>
        </Card>
      </SubGrid>
      <MonthBars data={data.adsViewed.byMonth} title="Ads shown per month" />
      {a.names.length > 0 && (
        <details className="card p-4">
          <summary className="text-sm font-medium cursor-pointer">All {fmtNumber(a.total)} advertisers using your activity or information</summary>
          <p className="text-xs text-muted mt-3 leading-6 max-h-72 overflow-auto">{a.names.join(" · ")}</p>
        </details>
      )}
    </Section>
  );
}

export function SearchesView({ data }: { data: ProSections["searches"] }) {
  return (
    <Section id="searches" title="Searches" badge="pro" description="Who and what you look for. Instagram keeps only recent searches, so this is a window, not a history.">
      <StatGrid>
        <Stat label="Profile searches" value={fmtNumber(data.totalProfileSearches)} />
        <Stat label="Keyword searches" value={fmtNumber(data.totalKeywordSearches)} />
        <Stat label="Hashtag searches" value={fmtNumber(data.totalHashtagSearches)} />
        <Stat label="Searched, not followed" value={fmtNumber(data.searchedButNotFollowing.length)} hint="Profiles you look up without following" />
      </StatGrid>
      <SubGrid>
        <Card title="Profiles you search for most">
          <RankedList items={data.topProfiles} limit={15} prefix="@" linkUsernames />
        </Card>
        <Card title="Profiles you search for but don't follow">
          <RankedList items={data.searchedButNotFollowing} limit={15} prefix="@" linkUsernames />
        </Card>
      </SubGrid>
      <SubGrid>
        <Card title="Keywords">
          <RankedList items={data.topKeywords} limit={15} />
        </Card>
        <MonthBars data={data.byMonth} title="Searches per month" />
      </SubGrid>
    </Section>
  );
}

export function SecurityView({ data, timeZone }: { data: ProSections["security"] } & Ctx) {
  return (
    <Section id="security" title="Security & logins" badge="pro" description="Where and when your account has been used. Unfamiliar devices or locations are worth a password change.">
      <StatGrid>
        <Stat label="Logins recorded" value={fmtNumber(data.logins.total)} hint={data.logins.lastAt ? `Last ${fmtDate(data.logins.lastAt, timeZone)}` : undefined} />
        <Stat label="Distinct IP addresses" value={fmtNumber(data.logins.uniqueIps)} />
        <Stat label="Password changes" value={fmtNumber(data.passwordChanges.length)} hint={data.passwordChanges[0] ? `Last ${fmtDate(data.passwordChanges[0], timeZone)}` : "None recorded"} />
        <Stat label="Connected apps" value={fmtNumber(data.activeApps.length)} hint={`${fmtNumber(data.expiredApps.length)} expired`} />
      </StatGrid>
      <SubGrid>
        <Card title="Platforms">
          <RankedList items={data.logins.platforms} limit={6} unit="logins" />
        </Card>
        <Card title="Most used IP addresses">
          <RankedList items={data.logins.topIps} limit={8} unit="logins" />
        </Card>
      </SubGrid>
      <Heatmap grid={data.logins.heatmap} title="When you log in (weekday × hour)" />
      <MonthBars data={data.logins.byMonth} title="Logins per month" />
      <SubGrid>
        <Card title="Account facts">
          <ul className="text-sm space-y-1.5">
            <li>
              Created: <span className="font-medium">{fmtDate(data.signup?.at, timeZone)}</span>
              {data.signup?.ip && <span className="text-muted"> from {data.signup.ip}</span>}
              {data.signup?.device && <span className="text-muted"> on {data.signup.device}</span>}
            </li>
            {data.accountBasedIn && <li>Instagram places your account in: <span className="font-medium">{data.accountBasedIn}</span></li>}
            {data.profileBasedIn && <li>Profile based in: <span className="font-medium">{data.profileBasedIn}</span></li>}
            {data.lastKnownLocation && <li>Last known location: <span className="font-medium">{data.lastKnownLocation}</span></li>}
            <li>Logouts recorded: <span className="tabular font-medium">{fmtNumber(data.logouts)}</span></li>
            {data.activeApps.length > 0 && <li className="text-muted">Connected apps: {data.activeApps.join(", ")}</li>}
          </ul>
        </Card>
        <Card title="Devices">
          {data.devices.length === 0 ? (
            <p className="text-sm text-faint">No device list in this export.</p>
          ) : (
            <ul className="text-sm space-y-1.5 max-h-72 overflow-auto">
              {data.devices.map((d, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate" title={d.userAgent}>
                    <span className="text-faint mr-1">{d.platform}</span>
                    {d.userAgent}
                  </span>
                  <span className="text-faint tabular shrink-0">{fmtDate(d.lastLogin, timeZone)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </SubGrid>
      {data.profileChanges.length > 0 && (
        <Card title="Profile changes">
          <ul className="text-sm space-y-1 max-h-60 overflow-auto">
            {data.profileChanges.map((c, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">
                  <span className="text-faint">{c.field}:</span> {c.previous ?? "–"} → {c.next ?? "–"}
                </span>
                <span className="text-faint tabular shrink-0">{fmtDate(c.at, timeZone)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Section>
  );
}
