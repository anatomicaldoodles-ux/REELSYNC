import { fmtNumber } from "@/lib/format";
import { barPath } from "./month-bars";

interface Props {
  data: { label: string; value: number; tooltip?: string }[];
  title: string;
  height?: number;
  /** Show every Nth label; auto when omitted. */
  labelEvery?: number;
  /** Format for the y axis and direct label. */
  format?: (n: number) => string;
}

/** Single-series bars with arbitrary categorical labels. */
export function BarSeries({ data, title, height = 150, labelEvery, format = fmtNumber }: Props) {
  if (data.length === 0) return <p className="text-sm text-faint">No data.</p>;
  const width = 640;
  const padL = 44;
  const padB = 22;
  const padT = 12;
  const plotW = width - padL - 8;
  const plotH = height - padB - padT;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = Math.min(plotW / data.length, 60);
  const gap = Math.min(3, slot * 0.2);
  const bw = Math.max(1, slot - gap);
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / 10));
  const maxIndex = data.findIndex((d) => d.value === max);
  return (
    <figure className="w-full">
      <figcaption className="text-sm font-medium mb-1">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
        {[0.5, 1].map((s) => {
          const y = padT + plotH - plotH * s;
          return (
            <g key={s}>
              <line x1={padL} x2={width - 8} y1={y} y2={y} stroke="var(--line)" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--faint)" className="tabular">
                {format(Math.round(max * s))}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={width - 8} y1={padT + plotH} y2={padT + plotH} stroke="var(--line)" />
        {data.map((d, i) => {
          const h = (d.value / max) * plotH;
          const x = padL + i * slot + gap / 2;
          const y = padT + plotH - h;
          return (
            <g key={d.label + i}>
              <path d={barPath(x, y, bw, h)} fill="var(--viz-1)" />
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent">
                <title>{d.tooltip ?? `${d.label}: ${format(d.value)}`}</title>
              </rect>
              {i === maxIndex && d.value > 0 && (
                <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="var(--muted)" className="tabular">
                  {format(d.value)}
                </text>
              )}
              {i % every === 0 && (
                <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--faint)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
