import { fmtMonth, fmtNumber } from "@/lib/format";
import { barPath } from "./month-bars";

interface Props {
  data: { month: string; a: number; b: number }[];
  labels: [string, string];
  title: string;
  height?: number;
}

/** Two-series grouped monthly bars (blue = series A, orange = series B). */
export function DualMonthBars({ data, labels, title, height = 160 }: Props) {
  if (data.length === 0) return <p className="text-sm text-faint">No data for this period.</p>;
  const width = 640;
  const padL = 36;
  const padB = 22;
  const padT = 12;
  const plotW = width - padL - 8;
  const plotH = height - padB - padT;
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  const slot = Math.min(plotW / data.length, 56);
  const inner = Math.max(1, (slot - 3) / 2);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  return (
    <figure className="w-full">
      <figcaption className="text-sm font-medium mb-1 flex items-center justify-between gap-3 flex-wrap">
        <span>{title}</span>
        <span className="flex items-center gap-3 text-xs text-muted font-normal">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-1)" }} /> {labels[0]}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-2)" }} /> {labels[1]}
          </span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
        {[0.5, 1].map((s) => {
          const y = padT + plotH - plotH * s;
          return (
            <g key={s}>
              <line x1={padL} x2={width - 8} y1={y} y2={y} stroke="var(--line)" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--faint)" className="tabular">
                {fmtNumber(Math.round(max * s))}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={width - 8} y1={padT + plotH} y2={padT + plotH} stroke="var(--line)" />
        {data.map((d, i) => {
          const x0 = padL + i * slot + 1;
          const ha = (d.a / max) * plotH;
          const hb = (d.b / max) * plotH;
          return (
            <g key={d.month}>
              <path d={barPath(x0, padT + plotH - ha, inner, ha)} fill="var(--viz-1)" />
              <path d={barPath(x0 + inner + 1, padT + plotH - hb, inner, hb)} fill="var(--viz-2)" />
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent">
                <title>{`${fmtMonth(d.month)} · ${labels[0]}: ${fmtNumber(d.a)} · ${labels[1]}: ${fmtNumber(d.b)}`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text x={padL + i * slot + slot / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--faint)">
                  {fmtMonth(d.month)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
