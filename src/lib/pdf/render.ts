import path from "node:path";
import { createElement } from "react";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import type { ProfileReport } from "@/lib/profile/report";
import { ReportDocument } from "./report-document";

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  const dir = path.join(process.cwd(), "assets", "fonts");
  Font.register({
    family: "DejaVu",
    fonts: [
      { src: path.join(dir, "DejaVuSans.ttf"), fontWeight: 400 },
      { src: path.join(dir, "DejaVuSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Keep words intact: no hyphenation.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export async function renderReportPdf(report: ProfileReport, reportUrl: string): Promise<Buffer> {
  registerFonts();
  const element = createElement(ReportDocument, { report, reportUrl });
  // renderToBuffer's typing expects a DocumentProps element; ours renders one.
  return renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);
}

export function pdfFilename(username: string, generatedAt: string): string {
  const safe = username.replace(/[^a-z0-9._]/gi, "").slice(0, 40) || "report";
  return `reelsync-${safe}-${generatedAt.slice(0, 10)}.pdf`;
}
