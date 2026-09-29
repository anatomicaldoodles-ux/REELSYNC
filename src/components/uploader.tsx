"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkerRequest, WorkerResponse } from "@/workers/analyze.worker";
import { saveReport } from "@/lib/client/saved-reports";

type Stage = "idle" | "reading" | "parsing" | "analyzing" | "packaging" | "uploading" | "done" | "error";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  reading: "Reading your export (only the JSON files, media is skipped)",
  parsing: "Parsing activity, connections and messages",
  analyzing: "Computing your report",
  packaging: "Compressing the results",
  uploading: "Saving your report",
  done: "Done, opening your report",
  error: "Something went wrong",
};

export function Uploader() {
  const router = useRouter();
  const workerRef = useRef<Worker | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [fraction, setFraction] = useState(0);
  const [detail, setDetail] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | undefined>();

  useEffect(() => () => workerRef.current?.terminate(), []);

  const upload = useCallback(
    async (payload: Uint8Array, summary: { username?: string }) => {
      setStage("uploading");
      setFraction(0.95);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/gzip" },
        body: payload as BodyInit,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
      const { id, deleteToken } = (await res.json()) as { id: string; deleteToken: string };
      saveReport({ id, deleteToken, username: summary.username, createdAt: new Date().toISOString() });
      setStage("done");
      setFraction(1);
      router.push(`/report/${id}`);
    },
    [router],
  );

  const start = useCallback(
    (file: File) => {
      setError(undefined);
      setFileName(file.name);
      if (!/\.zip$/i.test(file.name)) {
        setStage("error");
        setError("Please upload the ZIP file Instagram sent you. If you extracted it, re-zip the folder or download it again.");
        return;
      }
      workerRef.current?.terminate();
      const worker = new Worker(new URL("../workers/analyze.worker.ts", import.meta.url));
      workerRef.current = worker;
      setStage("reading");
      setFraction(0);
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if (msg.type === "progress") {
          setStage(msg.stage);
          setFraction(msg.fraction * 0.9);
          setDetail(msg.detail);
        } else if (msg.type === "done") {
          worker.terminate();
          upload(msg.payload, msg.summary).catch((err: Error) => {
            setStage("error");
            setError(err.message);
          });
        } else {
          worker.terminate();
          setStage("error");
          setError(msg.message);
        }
      };
      worker.onerror = (e) => {
        setStage("error");
        setError(e.message || "The analysis worker crashed. Try a smaller export or a different browser.");
      };
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const request: WorkerRequest = { type: "analyze", file, timeZone };
      worker.postMessage(request);
    },
    [upload],
  );

  const busy = stage !== "idle" && stage !== "error" && stage !== "done";

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) start(file);
        }}
        className={`card flex flex-col items-center justify-center gap-2 p-10 text-center cursor-pointer transition ${
          dragging ? "border-accent bg-accent/5" : "hover:border-accent/60"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) start(file);
            e.target.value = "";
          }}
        />
        <span className="brand-gradient h-12 w-12 rounded-2xl" aria-hidden />
        <span className="font-medium">Drop your Instagram export ZIP here</span>
        <span className="text-sm text-muted">or click to choose a file. Large exports are fine: only the JSON files are read.</span>
      </label>

      {stage !== "idle" && (
        <div className="card p-4" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span className={stage === "error" ? "text-red-600 dark:text-red-400" : ""}>{STAGE_LABEL[stage]}</span>
            {detail && stage !== "error" && <span className="text-faint tabular">{detail}</span>}
          </div>
          {stage !== "error" && (
            <div className="h-2 rounded-full bg-line mt-2 overflow-hidden">
              <div className="h-full brand-gradient transition-[width] duration-300" style={{ width: `${Math.round(fraction * 100)}%` }} />
            </div>
          )}
          {error && <p className="text-sm text-muted mt-2">{error}</p>}
          {fileName && <p className="text-xs text-faint mt-2 truncate">{fileName}</p>}
        </div>
      )}

      <p className="text-xs text-faint">
        Your ZIP never leaves your device. The analysis runs in your browser and only the computed statistics are
        stored so you can open the report again. No photos, videos or message texts are uploaded.
      </p>
    </div>
  );
}
