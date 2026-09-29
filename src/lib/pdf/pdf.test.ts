import { describe, expect, it } from "vitest";
import { DemoProvider } from "@/lib/profile/providers/demo";
import { analyzeProfile } from "@/lib/profile/analyze";
import { pdfFilename, renderReportPdf } from "./render";
import { pdfSafe } from "./text";

describe("pdf", () => {
  it("strips glyphs the bundled font cannot draw", () => {
    expect(pdfSafe("Sunset 🌅 run ❤️ #go")).toBe("Sunset run #go");
    expect(pdfSafe("  many   spaces  ")).toBe("many spaces");
    expect(pdfSafe(undefined)).toBe("");
  });
  it("builds a safe filename", () => {
    expect(pdfFilename("travel.jo", "2026-09-29T10:00:00.000Z")).toBe("reelsync-travel.jo-2026-09-29.pdf");
    expect(pdfFilename("../evil", "2026-01-01T00:00:00Z")).toBe("reelsync-..evil-2026-01-01.pdf");
  });
  it("renders a multi-page PDF for a demo profile", async () => {
    const profile = await new DemoProvider().fetchProfile("pdf_tester");
    const report = analyzeProfile(profile, { timeZone: "Asia/Kolkata" });
    const pdf = await renderReportPdf(report, "http://localhost:3000/report/x");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
    expect((pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBeGreaterThanOrEqual(4);
  }, 30_000);
});
