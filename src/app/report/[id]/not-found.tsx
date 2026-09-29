import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Report not found</h1>
      <p className="mt-2 text-muted">It may have been deleted, or the link is incomplete.</p>
      <Link href="/analyze" className="inline-block mt-6 brand-gradient text-white font-semibold px-5 py-3 rounded-xl">
        Analyse an account
      </Link>
    </div>
  );
}
