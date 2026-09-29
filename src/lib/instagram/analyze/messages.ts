import type { Dataset, Thread } from "../types";
import type { MessagesSection, ThreadSummary } from "./report";
import { emojiOnly, percent, tally, top, wordCount } from "./counting";
import { fillMonths, heatmap, mean, median, round, type LocalClock } from "./time";
import { topWords } from "./engagement";

const REPLY_CAP_MS = 7 * 86400 * 1000;
const WAITING_MS = 7 * 86400 * 1000;

/** The exporting user's display name: the participant present in the most threads. */
export function detectSelf(threads: Thread[], fallback?: string): string | undefined {
  const counts = new Map<string, number>();
  for (const t of threads) {
    for (const p of new Set(t.participants)) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  if (fallback && counts.has(fallback)) return fallback;
  let best: string | undefined;
  let bestCount = 0;
  for (const [name, c] of counts) {
    if (c > bestCount) {
      best = name;
      bestCount = c;
    }
  }
  if (best && threads.length >= 3 && bestCount < threads.length * 0.5) {
    // Ambiguous; fall back to the profile name when present.
    return fallback ?? best;
  }
  return best ?? fallback;
}

function replyTimes(t: Thread, self: string) {
  const yours: number[] = [];
  const theirs: number[] = [];
  for (let i = 1; i < t.messages.length; i++) {
    const prev = t.messages[i - 1];
    const cur = t.messages[i];
    if (prev.sender === cur.sender) continue;
    const delta = cur.atMs - prev.atMs;
    if (delta < 0 || delta > REPLY_CAP_MS) continue;
    if (cur.sender === self && prev.sender !== self) yours.push(delta / 60000);
    else if (prev.sender === self && cur.sender !== self) theirs.push(delta / 60000);
  }
  return { yours, theirs };
}

export function messages(ds: Dataset, clock: LocalClock, latestSec?: number): MessagesSection {
  const threads = ds.messages;
  const self = detectSelf(threads, ds.account.name);
  const isSelf = (name: string) => name === self;

  const totals: MessagesSection["totals"] = {
    threads: threads.length,
    groupThreads: 0,
    requestThreads: 0,
    sent: 0,
    received: 0,
    sharesSent: 0,
    sharesReceived: 0,
    reelsSent: 0,
    reelsReceived: 0,
    photosSent: 0,
    voiceSent: 0,
    calls: 0,
    reactionsGiven: 0,
    reactionsReceived: 0,
    unsent: 0,
  };

  const sentByMonth = new Map<string, number>();
  const receivedByMonth = new Map<string, number>();
  const sentTimes: number[] = [];
  const allYours: number[] = [];
  const allTheirs: number[] = [];
  const wordCounts: number[] = [];
  const reactionsGiven: string[] = [];
  const reactionsReceived: string[] = [];
  const summaries: ThreadSummary[] = [];
  const waitingOnThem: MessagesSection["waitingOnThem"] = [];
  const waitingOnYou: MessagesSection["waitingOnYou"] = [];
  const startedByYear = new Map<number, number>();
  const sentByDay = new Map<string, number>();
  const sentTexts: string[] = [];
  const nowMs = (latestSec ?? Math.floor(Date.now() / 1000)) * 1000;

  for (const t of threads) {
    if (t.isGroup) totals.groupThreads++;
    if (t.isRequest) totals.requestThreads++;
    let sent = 0;
    let received = 0;
    let reelsShared = 0;
    for (const m of t.messages) {
      const mine = isSelf(m.sender);
      const sec = Math.floor(m.atMs / 1000);
      const monthKey = clock.monthKey(sec);
      if (m.type === "reaction_notice") continue;
      if (m.type === "unsent") totals.unsent++;
      if (m.type === "call") totals.calls++;
      if (mine) {
        sent++;
        totals.sent++;
        sentByMonth.set(monthKey, (sentByMonth.get(monthKey) ?? 0) + 1);
        sentTimes.push(sec);
        const dk = clock.dayKey(sec);
        sentByDay.set(dk, (sentByDay.get(dk) ?? 0) + 1);
        if (m.type === "share") {
          totals.sharesSent++;
          if (m.shareKind === "reel") {
            totals.reelsSent++;
            reelsShared++;
          }
        }
        if (m.type === "photo") totals.photosSent++;
        if (m.type === "audio") totals.voiceSent++;
        if (m.type === "text" && m.text) {
          wordCounts.push(wordCount(m.text));
          sentTexts.push(m.text);
        }
      } else {
        received++;
        totals.received++;
        receivedByMonth.set(monthKey, (receivedByMonth.get(monthKey) ?? 0) + 1);
        if (m.type === "share") {
          totals.sharesReceived++;
          if (m.shareKind === "reel") {
            totals.reelsReceived++;
            reelsShared++;
          }
        }
      }
      for (const r of m.reactions) {
        const emoji = emojiOnly(r.reaction) || r.reaction;
        if (isSelf(r.actor)) {
          totals.reactionsGiven++;
          reactionsGiven.push(emoji);
        } else {
          totals.reactionsReceived++;
          reactionsReceived.push(emoji);
        }
      }
    }
    const first = t.messages[0];
    const last = t.messages.at(-1);
    if (first) {
      const y = clock.parts(Math.floor(first.atMs / 1000)).year;
      startedByYear.set(y, (startedByYear.get(y) ?? 0) + 1);
    }
    const { yours, theirs } = self ? replyTimes(t, self) : { yours: [], theirs: [] };
    allYours.push(...yours);
    allTheirs.push(...theirs);
    if (last && !t.isGroup && nowMs - last.atMs >= WAITING_MS && last.type !== "reaction_notice") {
      const entry = { title: t.title, lastAt: Math.floor(last.atMs / 1000) };
      if (isSelf(last.sender) && sent > 0) waitingOnThem.push(entry);
      else if (!isSelf(last.sender) && received > 0) waitingOnYou.push(entry);
    }
    const total = sent + received;
    summaries.push({
      title: t.title,
      isGroup: t.isGroup,
      sent,
      received,
      total,
      firstAt: first ? Math.floor(first.atMs / 1000) : undefined,
      lastAt: last ? Math.floor(last.atMs / 1000) : undefined,
      yourMedianReplyMinutes: round(median(yours), 0),
      theirMedianReplyMinutes: round(median(theirs), 0),
      reelsShared,
      yourSharePct: percent(sent, total),
    });
  }

  const months = new Map<string, number>();
  for (const k of sentByMonth.keys()) months.set(k, 0);
  for (const k of receivedByMonth.keys()) months.set(k, 0);
  const byMonth = fillMonths(months).map(({ month }) => ({
    month,
    sent: sentByMonth.get(month) ?? 0,
    received: receivedByMonth.get(month) ?? 0,
  }));

  const grid = heatmap(sentTimes, clock);
  let night = 0;
  for (const row of grid) for (let h = 0; h < 24; h++) if (h < 6 || h >= 23) night += row[h];

  let busiestDay: MessagesSection["busiestDay"];
  for (const [day, count] of sentByDay) if (!busiestDay || count > busiestDay.count) busiestDay = { day, count };

  summaries.sort((a, b) => b.total - a.total);
  waitingOnThem.sort((a, b) => b.lastAt - a.lastAt);
  waitingOnYou.sort((a, b) => b.lastAt - a.lastAt);

  return {
    selfName: self,
    totals,
    byMonth,
    sentHeatmap: grid,
    topThreads: summaries.slice(0, 30),
    overallYourMedianReplyMinutes: round(median(allYours), 0),
    overallTheirMedianReplyMinutes: round(median(allTheirs), 0),
    avgWordsPerSentMessage: round(mean(wordCounts)),
    topReactionsGiven: top(tally(reactionsGiven), 10),
    topReactionsReceived: top(tally(reactionsReceived), 10),
    waitingOnThem: waitingOnThem.slice(0, 25),
    waitingOnYou: waitingOnYou.slice(0, 25),
    threadsStartedByYear: [...startedByYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
    busiestDay,
    nightOwlPct: percent(night, sentTimes.length),
    topWordsSent: topWords(sentTexts, 30),
  };
}
