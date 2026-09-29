import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6 text-sm leading-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of service</h1>
      <p className="text-muted">Last updated: September 2026.</p>
      <p>By using ReelSync you agree to these terms.</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>ReelSync analyses information that is publicly visible on Instagram profiles. Use it for lawful purposes only, such as reviewing your own account, researching competitors or evaluating creators for collaborations.</li>
        <li>The full report is a one-time purchase for a single analysed account. It is delivered digitally and immediately at the report link.</li>
        <li>Reports reflect public data at the time of the lookup. Counts can differ from what Instagram shows, like counts hidden by the account are excluded, and availability depends on Instagram and our data provider.</li>
        <li>If the full report does not work for the account you analysed, contact us within 14 days of purchase for a refund.</li>
        <li>You are responsible for keeping your report link private. Anyone with the link can view the report.</li>
        <li>ReelSync is provided as is, without warranty. Our liability is limited to the amount you paid.</li>
        <li>ReelSync is not affiliated with Instagram or Meta Platforms.</li>
      </ul>
    </div>
  );
}
