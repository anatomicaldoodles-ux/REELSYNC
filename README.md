# ReelSync

Instagram analytics by username. Visitors type any public Instagram username and
get a report on engagement, best posting times, hashtags, captions and growth.
The headline numbers are free; the full report is a one-time Razorpay payment
per analysed account.

## How it works

1. `POST /api/lookup` normalises the username and checks the per-IP daily limit.
2. If a snapshot of that profile was fetched within `SNAPSHOT_TTL_HOURS`, it is
   reused. Otherwise the data provider fetches the public profile and its most
   recent posts, and the snapshot is stored (`ProfileSnapshot`). Snapshots double
   as follower history for the growth chart.
3. `analyzeProfile` (`src/lib/profile/analyze.ts`) computes the report.
4. The report is stored (`Report`) and rendered at `/report/[id]`. Pro sections are
   stripped server-side for free reports.
5. "Unlock" opens Razorpay Checkout; the server verifies the signature and marks
   the report `pro`. A webhook acts as backup.
6. Unlocked reports can be downloaded as a PDF (`GET /api/reports/[id]/pdf`),
   rendered server-side with `@react-pdf/renderer` from the stored report. The
   bundled fonts (`assets/fonts`) are DejaVu Sans for Latin, Greek and Cyrillic
   and Noto Sans Devanagari for Hindi, Marathi and Nepali; text runs switch font
   automatically. Emoji are stripped from PDF text.

### Free vs pro

| Free | Pro (one-time, per account) |
|---|---|
| Profile numbers, follow ratio, followers per post | Score breakdown and prioritised recommendations |
| Engagement rate with grade vs accounts of similar size | Engagement by format, comments per 100 likes, recent-vs-older trend, per-post chart |
| Posts per week, days since last post, reels share | Best day and hour, engagement by weekday and time of day, posting heatmap |
| Top 3 hashtags, best post, best day | Cadence, consistency score, gaps, posts per month |
| ReelSync score | Top and bottom posts, format mix comparisons |
| | Hashtag usage and performance, ideal hashtag count |
| | Caption length, call-to-action effect, questions, emojis, words |
| | Follower growth across snapshots |
| | Downloadable PDF of the whole report |

## Data provider

Instagram has no public API for arbitrary usernames, so ReelSync uses a data
provider. The default adapter runs the Apify actor `apify/instagram-scraper`
(`src/lib/profile/providers/apify.ts`). Set `APIFY_TOKEN` to enable it; each
lookup is billed by Apify per result. Without a token the site runs on the
**demo provider**, which generates deterministic sample data so everything can be
tried locally. Demo reports are labelled as such.

Adding another provider means implementing `ProfileProvider` (one method:
`fetchProfile(username)` returning a `PublicProfile`) and selecting it in
`src/lib/profile/providers/index.ts`.

Limits to be aware of: private accounts cannot be analysed, like counts hidden by
the account are excluded, and only the most recent `LOOKUP_POSTS_LIMIT` posts
(default 50) are used.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Prisma 7 with SQLite (dev) via `@prisma/adapter-better-sqlite3`
- Razorpay Checkout + webhooks
- Zod for validation, Vitest for tests

## Running locally

```bash
npm install
cp .env.example .env        # demo data and no payments by default
npx prisma migrate dev       # creates dev.db
npm run dev                  # http://localhost:3000
```

With `ALLOW_DEV_UNLOCK=true` (ignored in production) each report shows a
"Developer: unlock without paying" link.

### Tests and checks

```bash
npm test          # analyzer, provider mapping, signature tests
npm run lint
npm run build
```

## Payments (Razorpay)

1. Copy the **Key Id** and **Key Secret** from Settings → API Keys into
   `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Test keys (`rzp_test_...`) work
   with Razorpay's test cards and `success@razorpay` UPI id.
2. Optional: add a webhook at `https://yourdomain/api/razorpay/webhook` for
   `payment.captured`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`.
3. Price and currency come from `PRO_REPORT_PRICE_CENTS` and `PRO_REPORT_CURRENCY`
   (default 79900 + inr, shown as ₹799).

## Deploying (Railway, SQLite on a volume)

The simplest public setup: one Railway service built from this repo, with a
persistent volume for the SQLite file. No separate database to manage.

1. Push to GitHub (already done) and create a Railway project from the repo.
2. Add a **Volume** to the service, mounted at `/data`.
3. Set variables: `DATABASE_URL=file:/data/reelsync.db`,
   `NEXT_PUBLIC_APP_URL=https://<your-domain>`, `APIFY_TOKEN`, `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `IP_HASH_SALT=<random>`,
   `PRO_REPORT_PRICE_CENTS=79900`, `PRO_REPORT_CURRENCY=inr`. Do not set
   `ALLOW_DEV_UNLOCK`.
4. `npm start` runs `prisma migrate deploy` before `next start`, so the schema is
   applied on every deploy.
5. Add your domain under Settings → Networking and point a CNAME at it.
6. In Razorpay, add a webhook for `https://<your-domain>/api/razorpay/webhook`.

Moving to Postgres later is a schema `provider` change plus `@prisma/adapter-pg`
(see below); the app code does not change.

## Production notes

- **Database:** switch `provider` in `prisma/schema.prisma` to `postgresql`, install
  `@prisma/adapter-pg` and `pg`, swap the adapter in `src/lib/server/db.ts`, then
  `npx prisma migrate deploy`.
- **Costs:** every uncached lookup calls the provider. `SNAPSHOT_TTL_HOURS` and
  `LOOKUPS_PER_IP_PER_DAY` are the two knobs that bound spend. Set `IP_HASH_SALT`
  to a random string.
- **PDF fonts:** `next.config.ts` traces `assets/fonts` into the PDF route's bundle
  for standalone/serverless builds. If PDFs fail on a host with "font not found",
  check that directory is deployed.
- **Timeouts:** provider fetches can take 30 to 90 seconds. `/api/lookup` sets
  `maxDuration = 180`; make sure your host allows that.
- Never set `ALLOW_DEV_UNLOCK=true` in production (it is also disabled whenever
  `NODE_ENV=production`).
- Report links are unguessable IDs; anyone with the link can view a report.

## Project layout

```
src/lib/profile/           types, providers (apify, demo), analyzer, report types
src/lib/server/            env, Prisma client, lookup service, Razorpay, persistence
src/app/                   pages and API routes (/api/lookup, /api/checkout, ...)
src/components/            charts, report sections, username form, unlock button
prisma/                    schema and migrations
```

ReelSync is not affiliated with Instagram or Meta.
