interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export function Stat({ label, value, hint }: Props) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className="text-2xl font-semibold mt-1 tabular">{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>;
}
