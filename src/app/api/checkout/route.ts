import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/server/env";
import { createCheckoutSession } from "@/lib/server/checkout";

export const runtime = "nodejs";

const bodySchema = z.object({ reportId: z.string().min(1).max(64) });

export async function POST(request: Request) {
  if (!env.stripeConfigured) {
    return NextResponse.json({ error: "Payments are not configured on this server" }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const { url } = await createCheckoutSession(parsed.data.reportId);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    const status = /not found/i.test(message) ? 404 : /already/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
