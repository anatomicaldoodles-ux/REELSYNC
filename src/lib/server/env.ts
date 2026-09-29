/**
 * Central place for environment configuration. Everything payment-related is
 * optional so the app runs locally with no external accounts; the UI degrades
 * to a "payments not configured" state.
 */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const env = {
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  /** Price of the full report in the smallest currency unit. */
  proPriceCents: num(process.env.PRO_REPORT_PRICE_CENTS, 79900),
  proCurrency: (process.env.PRO_REPORT_CURRENCY ?? "inr").toLowerCase(),
  /** Apify token for the Instagram data provider. Empty means demo data. */
  apifyToken: process.env.APIFY_TOKEN,
  /** How many recent posts to analyse per lookup. */
  postsLimit: num(process.env.LOOKUP_POSTS_LIMIT, 50),
  /** Reuse a fetched profile for this many hours before paying for a new fetch. */
  snapshotTtlHours: num(process.env.SNAPSHOT_TTL_HOURS, 24),
  /** Lookups a single IP may start per day. */
  lookupsPerIpPerDay: num(process.env.LOOKUPS_PER_IP_PER_DAY, 15),
  /** Salt for hashing client IPs before storing them. */
  ipSalt: process.env.IP_HASH_SALT ?? "reelsync",
  /** Allows unlocking reports without paying. Never enable in production. */
  allowDevUnlock: process.env.ALLOW_DEV_UNLOCK === "true" && process.env.NODE_ENV !== "production",
  get paymentsConfigured() {
    return Boolean(this.razorpayKeyId && this.razorpayKeySecret);
  },
  get demoMode() {
    return !this.apifyToken;
  },
};

const LOCALE_FOR_CURRENCY: Record<string, string> = { inr: "en-IN", gbp: "en-GB", eur: "de-DE" };

export function formatPrice(cents = env.proPriceCents, currency = env.proCurrency): string {
  const whole = cents % 100 === 0;
  try {
    return new Intl.NumberFormat(LOCALE_FOR_CURRENCY[currency] ?? "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(whole ? 0 : 2)} ${currency.toUpperCase()}`;
  }
}

/** The free tier's price, in the same currency as the paid one. */
export function formatFree(): string {
  return formatPrice(0);
}
