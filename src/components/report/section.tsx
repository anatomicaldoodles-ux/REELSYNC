interface Props {
  id: string;
  title: string;
  description?: string;
  badge?: "free" | "pro";
  children: React.ReactNode;
}

export function Section({ id, title, description, badge, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {badge && (
          <span
            className={
              badge === "pro"
                ? "text-[10px] uppercase tracking-wider font-semibold brand-gradient text-white px-1.5 py-0.5 rounded"
                : "text-[10px] uppercase tracking-wider font-semibold bg-line text-muted px-1.5 py-0.5 rounded"
            }
          >
            {badge}
          </span>
        )}
      </div>
      {description && <p className="text-sm text-muted mb-4">{description}</p>}
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function SubGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-6">{children}</div>;
}

export function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="card p-4">
      {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
      {children}
    </div>
  );
}

export function NameList({
  items,
  timeZone,
  emptyText = "Nobody here.",
  max = 200,
}: {
  items: { username: string; at?: number }[];
  timeZone?: string;
  emptyText?: string;
  max?: number;
}) {
  if (items.length === 0) return <p className="text-sm text-faint">{emptyText}</p>;
  const shown = items.slice(0, max);
  return (
    <div>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm max-h-96 overflow-auto pr-1">
        {shown.map((p) => (
          <li key={p.username} className="flex justify-between gap-3">
            <a
              href={`https://www.instagram.com/${encodeURIComponent(p.username)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="truncate hover:underline"
            >
              @{p.username}
            </a>
            {p.at && <span className="text-faint tabular shrink-0">{fmtDateInline(p.at, timeZone)}</span>}
          </li>
        ))}
      </ul>
      {items.length > max && <p className="text-xs text-faint mt-2">Showing {max} of {items.length}.</p>}
    </div>
  );
}

function fmtDateInline(sec: number, timeZone?: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { year: "2-digit", month: "short", timeZone }).format(new Date(sec * 1000));
  } catch {
    return "";
  }
}
