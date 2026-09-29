import { NextResponse } from "next/server";
import { deleteReport, getGatedReport } from "@/lib/server/reports";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/reports/[id]">) {
  const { id } = await context.params;
  const report = await getGatedReport(id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(report, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request, context: RouteContext<"/api/reports/[id]">) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ error: "Missing delete token" }, { status: 400 });
  const ok = await deleteReport(id, token);
  if (!ok) return NextResponse.json({ error: "Not found or wrong token" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
