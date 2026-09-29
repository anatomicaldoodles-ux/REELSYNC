import { NextResponse } from "next/server";
import { gunzipSync, strFromU8 } from "fflate";
import { env } from "@/lib/server/env";
import { createReport, validateReport } from "@/lib/server/reports";

export const runtime = "nodejs";

/**
 * Stores a report produced by the in-browser analyzer.
 * Body: JSON, optionally gzipped (Content-Type: application/gzip).
 */
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > env.maxReportBytes) {
    return NextResponse.json({ error: "Report payload too large" }, { status: 413 });
  }
  let text: string;
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength > env.maxReportBytes) {
      return NextResponse.json({ error: "Report payload too large" }, { status: 413 });
    }
    const isGzip = request.headers.get("content-type")?.includes("gzip") || (bytes[0] === 0x1f && bytes[1] === 0x8b);
    text = isGzip ? strFromU8(gunzipSync(bytes)) : strFromU8(bytes);
  } catch {
    return NextResponse.json({ error: "Could not read report payload" }, { status: 400 });
  }
  if (text.length > env.maxReportBytes * 8) {
    return NextResponse.json({ error: "Report payload too large" }, { status: 413 });
  }
  let report;
  try {
    report = validateReport(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
  const created = await createReport(report);
  return NextResponse.json({ id: created.id, deleteToken: created.deleteToken }, { status: 201 });
}
