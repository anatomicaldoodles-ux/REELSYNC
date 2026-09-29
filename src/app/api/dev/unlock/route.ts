import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/server/env";
import { getReportTier, markReportPaid } from "@/lib/server/reports";

export const runtime = "nodejs";

/** Development helper: unlocks a report without a payment. Disabled unless ALLOW_DEV_UNLOCK=true. */
export async function POST(request: Request) {
  if (!env.allowDevUnlock) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const parsed = z.object({ reportId: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const report = await getReportTier(parsed.data.reportId);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await markReportPaid({
    reportId: report.id,
    provider: "dev",
    providerOrderId: `dev_${report.id}`,
    amount: 0,
    currency: env.proCurrency,
  });
  return NextResponse.json({ ok: true });
}
