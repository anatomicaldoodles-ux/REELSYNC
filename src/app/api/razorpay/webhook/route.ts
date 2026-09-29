import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { applyWebhookPayment, verifyWebhookSignature, type RazorpayPayment } from "@/lib/server/razorpay";

export const runtime = "nodejs";

interface WebhookEvent {
  event: string;
  payload?: { payment?: { entity?: RazorpayPayment } };
}

/** Backup path: unlocks the report even if the browser never called /verify. */
export async function POST(request: Request) {
  if (!env.razorpayWebhookSecret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (event.event === "payment.captured" || event.event === "order.paid" || event.event === "payment.authorized") {
    const payment = event.payload?.payment?.entity;
    if (payment) await applyWebhookPayment(payment);
  }
  return NextResponse.json({ received: true });
}
