import type { Metadata } from "next";
import Link from "next/link";
import { Uploader } from "@/components/uploader";

export const metadata: Metadata = { title: "Analyse your export" };

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Analyse your Instagram export</h1>
      <p className="mt-2 text-muted">
        Upload the ZIP Instagram sent you (JSON format). Don&apos;t have it yet?{" "}
        <Link href="/how-to-export" className="text-accent hover:underline">
          Here is how to request it
        </Link>
        , it usually arrives within a few minutes to a couple of days.
      </p>
      <div className="mt-8">
        <Uploader />
      </div>
    </div>
  );
}
