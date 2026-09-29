import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <p>
          ReelSync is an independent tool and is not affiliated with Instagram or Meta. Your export is analysed in your
          browser.
        </p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/reports" className="hover:text-foreground">
            My reports
          </Link>
        </nav>
      </div>
    </footer>
  );
}
