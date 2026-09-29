import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/server/env";
import { stripe } from "@/lib/server/stripe";
import { applyCheckoutSession } from "@/lib/server/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!env.stripeConfigured || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    await applyCheckoutSession(session);
  }
  return NextResponse.json({ received: true });
}
