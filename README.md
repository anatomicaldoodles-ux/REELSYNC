# ReelSync

Deep, private Instagram analytics from the data export Instagram gives every user.
People upload their "Download your information" ZIP, get a free preview, and can
unlock the full report with a one-time payment.

## How it works

1. The user requests their data from Instagram in **JSON** format (guide at `/how-to-export`).
2. On `/analyze` the ZIP is opened **in the browser**. A custom ZIP reader reads only the
   central directory and the JSON entries, so multi-gigabyte exports full of media are fine.
3. A Web Worker parses the JSON into a normalised dataset and computes the full report
   (`src/lib/instagram`). Raw data, media and message texts never leave the device.
4. The gzipped report JSON is stored server-side (`POST /api/reports`) so it has a link.
5. The report page renders the **free** sections and locked placeholders for the **pro**
   sections. The server strips pro data from free reports; it is never sent to the client.
6. "Unlock" starts a Stripe Checkout session. The webhook (or, as a fallback, the success
   URL) marks the report as paid and the full report renders at the same link.

### Free vs pro

| Free | Pro (one-time, per export) |
|---|---|
| Overview: followers, following, ratio, account age, totals | Full lists: not following back, fans, mutuals, recently unfollowed, pending, blocked, restricted, close friends, with dates |
| Counts of non-followers, mutuals, fans + 5-account preview | Follower/following growth per month, oldest/newest followers, people you never interact with |
| Activity by year, peak hour/day, active days, longest streak | Likes & comments: per month, weekday×hour heatmap, top accounts, words and emojis |
| Top 3 accounts by interaction | Posting: best time to post, posts/reels/stories per month, hashtags, mentions, cadence |
| | DMs: busiest chats, reply times, ghosting both ways, reels shared, reactions, night-owl share |
| | Stories & saves, algorithm profile (topics, advertisers, ads, feed sources), searches |
| | Security: logins by IP/platform/time, devices, password and profile changes |
| | Everyone you interact with, ranked, plus one-sided and secret favourites |

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- Prisma 7 with SQLite (dev) via `@prisma/adapter-better-sqlite3`
- Stripe Checkout + webhooks
- `fflate` for gzip/inflate, Zod for validation, Vitest for tests

## Running locally

```bash
npm install
cp .env.example .env        # defaults work without Stripe
npx prisma migrate dev       # creates prisma/dev.db
npm run dev                  # http://localhost:3000
```

Create a sample export to try the flow without a real Instagram account:

```bash
npx tsx scripts/make-sample-export.ts sample-export.zip
```

With `ALLOW_DEV_UNLOCK=true` (and not in production) the report page shows a
"Developer: unlock without paying" link so you can see the full report.

### Tests and checks

```bash
npm test          # parser, analyzer and ZIP reader tests
npm run lint
npm run build
```

## Payments (Stripe)

1. Set `STRIPE_SECRET_KEY` in `.env`.
2. Point a webhook at `/api/stripe/webhook` for `checkout.session.completed` (and
   `checkout.session.async_payment_succeeded`), and set `STRIPE_WEBHOOK_SECRET`.
   Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Set `NEXT_PUBLIC_APP_URL` to the public URL so Stripe redirects back correctly.
4. Price and currency come from `PRO_REPORT_PRICE_CENTS` and `PRO_REPORT_CURRENCY`
   (default 79900 + inr, shown as ₹799). Stripe must support charging in that
   currency for your account country; INR works on Indian Stripe accounts.

The success URL also verifies the Checkout session directly with Stripe, so reports
unlock even if the webhook is late or not yet configured.

## Production notes

- **Database:** switch `provider` in `prisma/schema.prisma` to `postgresql`, install
  `@prisma/adapter-pg` and `pg`, and swap the adapter in `src/lib/server/db.ts`.
  Then `npx prisma migrate deploy`.
- **Never** set `ALLOW_DEV_UNLOCK=true` in production; it is also disabled whenever
  `NODE_ENV=production`.
- Report payloads are gzipped JSON, typically well under 1 MB. `MAX_REPORT_BYTES` caps
  uploads. Hosts with small request-body limits (for example 4.5 MB on some serverless
  platforms) need direct-to-storage uploads for very heavy accounts.
- Report links are unguessable IDs; anyone with the link can view the report. Deletion is
  available from `/reports` (delete token stored only in the creator's browser).
- Retention: add a scheduled job to delete old free reports if you want to bound storage.

## Data coverage and limits

The analyzer targets the export layout Instagram has used since 2023
(`connections/`, `your_instagram_activity/`, `ads_information/`, ...) and tolerates the
older flat layout where the file names match. Key names are matched case-insensitively
with a few localisations; exports generated in other languages may miss some fields.
Instagram itself only includes recent searches, ad impressions and post views, and
follow dates only where it recorded them.

Message participants are display names, not usernames, so DM statistics are reported
separately from username-based interaction rankings.

## Project layout

```
src/lib/instagram/         parser + analyzer (pure TypeScript, runs in browser and Node)
  parse.ts                 export file matchers → Dataset
  analyze/                 report sections (followers, engagement, content, messages, ...)
  __tests__/               synthetic export fixture and tests
src/lib/client/            browser ZIP reader, localStorage report registry
src/workers/               analysis Web Worker
src/lib/server/            env, Prisma client, Stripe, report persistence, checkout
src/app/                   pages and API routes
src/components/            charts, report sections, uploader, unlock button
prisma/                    schema and migrations
scripts/                   make-sample-export.ts
```

ReelSync is not affiliated with Instagram or Meta.
