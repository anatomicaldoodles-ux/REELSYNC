import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { createPendingPayment, getPaymentByOrder, getReportTier, markReportPaid } from "./reports";

const API = "https://api.razorpay.com/v1";
const PROVIDER = "razorpay";

function authHeader(): string {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) throw new Error("Razorpay is not configured");
  return "Basic " + Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

export interface RazorpayPayment {
  id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: string; // created | authorized | captured | refunded | failed
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
}

/** What the browser needs to open Razorpay Checkout for a report. */
export interface CheckoutDetails {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
}

export async function createOrderForReport(reportId: string): Promise<CheckoutDetails> {
  const report = await getReportTier(reportId);
  if (!report) throw new Error("Report not found");
  if (report.tier === "pro") throw new Error("Report is already unlocked");
  const order = await api<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: env.proPriceCents,
      currency: env.proCurrency.toUpperCase(),
      receipt: `report_${reportId}`.slice(0, 40),
      notes: { reportId },
    }),
  });
  await createPendingPayment({
    reportId,
    provider: PROVIDER,
    providerOrderId: order.id,
    amount: order.amount,
    currency: order.currency.toLowerCase(),
  });
  return {
    keyId: env.razorpayKeyId as string,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: "ReelSync",
    description: report.username ? `Full Instagram report for @${report.username}` : "Full Instagram report",
  };
}

function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Razorpay Checkout success signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret = env.razorpayKeySecret ?? ""): boolean {
  if (!secret) return false;
  return safeEqualHex(hmacHex(secret, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret) in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret = env.razorpayWebhookSecret ?? ""): boolean {
  if (!secret) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}

/**
 * Called from the browser after Checkout succeeds. Verifies the signature,
 * confirms the payment with Razorpay, and unlocks the report. Idempotent.
 */
export async function confirmCheckoutPayment(params: {
  reportId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const { reportId, orderId, paymentId, signature } = params;
  if (!verifyCheckoutSignature(orderId, paymentId, signature)) return false;
  const pending = await getPaymentByOrder(orderId);
  if (!pending || pending.reportId !== reportId) return false;
  let payment: RazorpayPayment | undefined;
  try {
    payment = await api<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
  } catch {
    // Signature already proves the payment; proceed with stored order details.
  }
  if (payment) {
    if (payment.order_id && payment.order_id !== orderId) return false;
    if (!["authorized", "captured"].includes(payment.status)) return false;
    if (payment.amount !== pending.amount) return false;
  }
  await markReportPaid({
    reportId,
    provider: PROVIDER,
    providerOrderId: orderId,
    providerPaymentId: paymentId,
    amount: pending.amount,
    currency: pending.currency,
    email: payment?.email ?? null,
  });
  return true;
}

/** Applies a `payment.captured` / `order.paid` webhook payment entity. Idempotent. */
export async function applyWebhookPayment(payment: RazorpayPayment): Promise<boolean> {
  if (!payment.order_id) return false;
  if (!["authorized", "captured"].includes(payment.status)) return false;
  const pending = await getPaymentByOrder(payment.order_id);
  const reportId = pending?.reportId ?? payment.notes?.reportId;
  if (!reportId) return false;
  const report = await getReportTier(reportId);
  if (!report) return false;
  await markReportPaid({
    reportId,
    provider: PROVIDER,
    providerOrderId: payment.order_id,
    providerPaymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency.toLowerCase(),
    email: payment.email ?? null,
  });
  return true;
}
