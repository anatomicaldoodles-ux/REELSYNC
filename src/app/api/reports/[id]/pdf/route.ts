import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import type { ProfileReport } from "@/lib/profile";
import { pdfFilename, renderReportPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Streams the full report as a PDF. Only available once the report is unlocked. */
export async function GET(_request: Request, context: RouteContext<"/api/reports/[id]/pdf">) {
  const { id } = await context.params;
  const row = await prisma.report.findUnique({ where: { id }, select: { id: true, tier: true, data: true, username: true } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.tier !== "pro") return NextResponse.json({ error: "The PDF is part of the full report. Unlock the report first." }, { status: 402 });
  const report = JSON.parse(row.data) as ProfileReport;
  try {
    const pdf = await renderReportPdf(report, `${env.appUrl}/report/${row.id}`);
    const filename = pdfFilename(row.username ?? report.free.overview.profile.username, report.generatedAt);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("pdf render failed", err);
    return NextResponse.json({ error: "Could not generate the PDF right now. Please try again." }, { status: 500 });
  }
}
