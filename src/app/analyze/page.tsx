import type { Metadata } from "next";
import { UsernameForm } from "@/components/username-form";

export const metadata: Metadata = { title: "Analyse an account" };

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Analyse an Instagram account</h1>
      <p className="mt-2 text-muted">Enter a public username, or paste a profile link.</p>
      <div className="mt-8">
        <UsernameForm size="lg" autoFocus />
      </div>
    </div>
  );
}
