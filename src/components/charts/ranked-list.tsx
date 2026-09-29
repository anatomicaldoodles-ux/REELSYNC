import { fmtNumber } from "@/lib/format";

interface Props {
  items: { name: string; count: number }[];
  title?: string;
  limit?: number;
  /** Prefix rendered before each name, e.g. "@" for usernames. */
  prefix?: string;
  unit?: string;
  linkUsernames?: boolean;
}

export function RankedList({ items, title, limit = 10, prefix = "", unit, linkUsernames }: Props) {
  const shown = items.slice(0, limit);
  const max = Math.max(1, ...shown.map((i) => i.count));
  if (shown.length === 0) return <p className="text-sm text-faint">Nothing here yet.</p>;
  return (
    <div>
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <ol className="space-y-1.5">
        {shown.map((item, i) => (
          <li key={item.name + i} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">
                <span className="text-faint tabular mr-2 text-xs">{i + 1}.</span>
                {linkUsernames ? (
                  <a
                    href={`https://www.instagram.com/${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:underline"
                  >
                    {prefix}
                    {item.name}
                  </a>
                ) : (
                  <span>
                    {prefix}
                    {item.name}
                  </span>
                )}
              </span>
              <span className="tabular text-muted shrink-0">
                {fmtNumber(item.count)}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-line mt-1 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: "var(--viz-1)" }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
