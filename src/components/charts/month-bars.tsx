import { fmtMonth, fmtNumber } from "@/lib/format";

interface Props {
  data: { month: string; count: number }[];
  title: string;
  /** Height of the plot area in px. */
  height?: number;
}

/** Rounded-top bar path anchored to the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 3): string {
  const rr = Math.min(r, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export function MonthBars({ data, title, height = 150 }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-faint">No data for this period.</p>;
  }
  const width = 640;
  const padL = 36;
  const padB = 22;
  const padT = 12;
  const plotW = width - padL - 8;
  const plotH = height - padB - padT;
  const max = Math.max(1, ...data.map((d) => d.count));
  const slot = Math.min(plotW / data.length, 44);
  const gap = Math.min(2, slot * 0.2);
  const bw = Math.max(1, slot - gap);
  const maxIndex = data.findIndex((d) => d.count === max);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const gridSteps = [0.5, 1];
  return (
    <figure className="w-full">
      <figcaption className="text-sm font-medium mb-1">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
        {gridSteps.map((s) => {
          const y = padT + plotH - plotH * s;
          return (
            <g key={s}>
              <line x1={padL} x2={width - 8} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--faint)" className="tabular">
                {fmtNumber(Math.round(max * s))}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={width - 8} y1={padT + plotH} y2={padT + plotH} stroke="var(--line)" strokeWidth={1} />
        {data.map((d, i) => {
          const h = (d.count / max) * plotH;
          const x = padL + i * slot + gap / 2;
          const y = padT + plotH - h;
          return (
            <g key={d.month}>
              <path d={barPath(x, y, bw, h)} fill="var(--viz-1)" />
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent">
                <title>{`${fmtMonth(d.month)}: ${fmtNumber(d.count)}`}</title>
              </rect>
              {i === maxIndex && d.count > 0 && (
                <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="var(--muted)" className="tabular">
                  {fmtNumber(d.count)}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--faint)">
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
