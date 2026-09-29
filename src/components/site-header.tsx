import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="brand-gradient inline-block h-6 w-6 rounded-lg" aria-hidden />
          ReelSync
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/pricing" className="px-3 py-1.5 rounded-md hover:bg-background text-muted hover:text-foreground">
            Pricing
          </Link>
          <Link href="/reports" className="px-3 py-1.5 rounded-md hover:bg-background text-muted hover:text-foreground hidden sm:inline">
            My reports
          </Link>
          <Link href="/analyze" className="ml-1 px-3 py-1.5 rounded-md bg-foreground text-background font-medium hover:opacity-90">
            Analyse
          </Link>
        </nav>
      </div>
    </header>
  );
}
