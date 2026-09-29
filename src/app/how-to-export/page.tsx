import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How to download your Instagram data" };

export default function HowToExportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">How to download your Instagram data</h1>
        <p className="mt-2 text-muted">Takes two minutes to request. Instagram emails you when the file is ready, usually within an hour, sometimes up to two days.</p>
      </div>
      <ol className="space-y-4">
        <Step n={1} title="Open Accounts Center">
          In the Instagram app: profile → menu (☰) → <strong>Your activity</strong> → <strong>Download your information</strong>. Or go to{" "}
          <a href="https://accountscenter.instagram.com/info_and_permissions/dyi/" target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">
            accountscenter.instagram.com
          </a>{" "}
          → Your information and permissions → Download your information.
        </Step>
        <Step n={2} title="Download or transfer information">
          Choose <strong>Download or transfer information</strong>, pick your Instagram profile, then <strong>All available information</strong>.
        </Step>
        <Step n={3} title="Choose the options">
          Select <strong>Download to device</strong>. Date range: <strong>All time</strong> for the richest report. Format: <strong>JSON</strong> (this is important, HTML exports are not supported). Media quality: <strong>Low</strong> keeps the file small; media is not used by ReelSync anyway.
        </Step>
        <Step n={4} title="Wait for the email">
          Instagram sends a link when the ZIP is ready. Download it. If the export is split into several ZIPs, upload the one containing the JSON folders (usually the first).
        </Step>
        <Step n={5} title="Upload here">
          <Link href="/analyze" className="text-accent hover:underline">
            Drop the ZIP on the analyse page
          </Link>
          . Only the JSON files are read, photos and videos are skipped, and nothing raw leaves your device.
        </Step>
      </ol>
      <div className="card p-5 text-sm text-muted">
        <strong className="text-foreground">Tip:</strong> the export reflects what Instagram stores. Recent searches, ad impressions and post views cover only recent
        months, while followers, likes, comments and messages typically go back years.
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="card p-5 flex gap-4">
      <div className="brand-gradient text-white h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold">{n}</div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted mt-1">{children}</p>
      </div>
    </li>
  );
}
