import type { Metadata } from "next";
import { MyReports } from "@/components/my-reports";

export const metadata: Metadata = { title: "My reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">My reports</h1>
      <p className="mt-2 text-muted">Reports created in this browser. Deleting a report removes it from our servers permanently.</p>
      <div className="mt-8">
        <MyReports />
      </div>
    </div>
  );
}
