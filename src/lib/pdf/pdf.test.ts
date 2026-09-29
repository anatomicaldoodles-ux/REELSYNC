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

describe("Devanagari support", () => {
  it("splits mixed text into script runs", async () => {
    const { splitScriptRuns } = await import("./mixed-text");
    expect(splitScriptRuns("Hello दुनिया, नमस्ते world")).toEqual([
      { text: "Hello ", devanagari: false },
      { text: "दुनिया, नमस्ते", devanagari: true },
      { text: " world", devanagari: false },
    ]);
    expect(splitScriptRuns("plain")).toEqual([{ text: "plain", devanagari: false }]);
  });
  it("embeds the Devanagari font when captions use it", async () => {
    const profile = await new DemoProvider().fetchProfile("hindi_tester");
    profile.fullName = "प्रिया शर्मा";
    profile.biography = "मुंबई की फ़ूड ब्लॉगर · Food & travel";
    profile.posts[0].caption = "आज का नाश्ता: पोहा और चाय ☕ #nashta #मुंबई";
    profile.posts[0].likes = 999_999;
    profile.posts[0].hashtags = ["nashta", "मुंबई"];
    const report = analyzeProfile(profile, { timeZone: "Asia/Kolkata" });
    const pdf = await renderReportPdf(report, "http://localhost:3000/report/x");
    expect(pdf.toString("latin1")).toMatch(/NotoSansDevanagari/);
    if (process.env.PDF_OUT) (await import("node:fs")).writeFileSync(process.env.PDF_OUT, pdf);
  }, 30_000);
});
