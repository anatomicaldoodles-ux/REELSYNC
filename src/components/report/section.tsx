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

export function Bullets({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <ul className="text-sm space-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex justify-between gap-3">
          <span className="text-muted">{i.label}</span>
          <span className="font-medium tabular text-right">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}
