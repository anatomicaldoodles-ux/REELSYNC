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
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  /** Price of the full report in the smallest currency unit. */
  proPriceCents: num(process.env.PRO_REPORT_PRICE_CENTS, 79900),
  proCurrency: (process.env.PRO_REPORT_CURRENCY ?? "inr").toLowerCase(),
  /** Maximum accepted size of an uploaded (gzipped) report payload. */
  maxReportBytes: num(process.env.MAX_REPORT_BYTES, 25 * 1024 * 1024),
  /** Allows unlocking reports without paying. Never enable in production. */
  allowDevUnlock: process.env.ALLOW_DEV_UNLOCK === "true" && process.env.NODE_ENV !== "production",
  get stripeConfigured() {
    return Boolean(this.stripeSecretKey);
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
