import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/server/env";
import { confirmCheckoutPayment } from "@/lib/server/razorpay";

export const runtime = "nodejs";

const bodySchema = z.object({
  reportId: z.string().min(1).max(64),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/** Verifies a completed Razorpay Checkout and unlocks the report. */
export async function POST(request: Request) {
  if (!env.paymentsConfigured) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const b = parsed.data;
  const ok = await confirmCheckoutPayment({
    reportId: b.reportId,
    orderId: b.razorpay_order_id,
    paymentId: b.razorpay_payment_id,
    signature: b.razorpay_signature,
  });
  if (!ok) return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
