/// <reference lib="webworker" />
import { gzipSync, strToU8 } from "fflate";
import { extractTextEntries } from "@/lib/client/zip-reader";
import { analyze, isRelevantFile, parseExport } from "@/lib/instagram";

export type WorkerRequest = { type: "analyze"; file: File; timeZone: string };

export type WorkerResponse =
  | { type: "progress"; stage: "reading" | "parsing" | "analyzing" | "packaging"; fraction: number; detail?: string }
  | { type: "done"; payload: Uint8Array; summary: { username?: string; filesMatched: number; warnings: string[] } }
  | { type: "error"; message: string };

const post = (msg: WorkerResponse, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { file, timeZone } = event.data;
  try {
    post({ type: "progress", stage: "reading", fraction: 0 });
    const files = await extractTextEntries(file, {
      filter: isRelevantFile,
      onProgress: (done, total) =>
        post({ type: "progress", stage: "reading", fraction: total ? done / total : 1, detail: `${done}/${total} files` }),
    });
    if (files.size === 0) {
      post({
        type: "error",
        message:
          "No Instagram data files were found in this ZIP. Make sure you requested the export in JSON format (not HTML) and uploaded the ZIP Instagram sent you.",
      });
      return;
    }
    post({ type: "progress", stage: "parsing", fraction: 0, detail: `${files.size} files` });
    const dataset = parseExport(files, {
      onProgress: (fraction) => post({ type: "progress", stage: "parsing", fraction }),
    });
    files.clear();
    post({ type: "progress", stage: "analyzing", fraction: 0.5 });
    const report = analyze(dataset, { timeZone });
    post({ type: "progress", stage: "packaging", fraction: 0.9 });
    const payload = gzipSync(strToU8(JSON.stringify(report)), { level: 6 });
    post(
      {
        type: "done",
        payload,
        summary: {
          username: report.free.overview.username,
          filesMatched: report.free.overview.filesMatched,
          warnings: report.free.overview.warnings,
        },
      },
      [payload.buffer],
    );
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : "Analysis failed" });
  }
};
