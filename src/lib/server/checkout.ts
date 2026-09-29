import type Stripe from "stripe";
import { env } from "./env";
import { stripe } from "./stripe";
import { getReportTier, markReportPaid } from "./reports";

export async function createCheckoutSession(reportId: string): Promise<{ url: string }> {
  const report = await getReportTier(reportId);
  if (!report) throw new Error("Report not found");
  if (report.tier === "pro") throw new Error("Report is already unlocked");
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.proCurrency,
          unit_amount: env.proPriceCents,
          product_data: {
            name: "ReelSync full Instagram report",
            description: report.username ? `Full analysis for @${report.username}` : "Full analysis of your Instagram export",
          },
        },
      },
    ],
    metadata: { reportId },
    client_reference_id: reportId,
    success_url: `${env.appUrl}/report/${reportId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/report/${reportId}?checkout=cancelled`,
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

/** Applies a completed checkout session to its report. Idempotent. */
export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  const reportId = session.metadata?.reportId ?? session.client_reference_id;
  if (!reportId) return false;
  if (session.payment_status !== "paid") return false;
  const report = await getReportTier(reportId);
  if (!report) return false;
  await markReportPaid({
    reportId,
    stripeSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    amount: session.amount_total ?? env.proPriceCents,
    currency: session.currency ?? env.proCurrency,
    email: session.customer_details?.email ?? session.customer_email ?? null,
  });
  return true;
}

/**
 * Fallback for environments without webhooks (local dev, first deploy): when the
 * user lands on the success URL we verify the session directly with Stripe.
 */
export async function confirmCheckoutSession(sessionId: string, expectedReportId: string): Promise<boolean> {
  if (!env.stripeConfigured) return false;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const reportId = session.metadata?.reportId ?? session.client_reference_id;
    if (reportId !== expectedReportId) return false;
    return applyCheckoutSession(session);
  } catch {
    return false;
  }
}
