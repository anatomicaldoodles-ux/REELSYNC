import { Svg, Rect, Line, Text as SvgText, G } from "@react-pdf/renderer";

export const INK = "#0b0b0b";
export const MUTED = "#52514e";
export const FAINT = "#898781";
export const LINE = "#e1e0d9";
export const BLUE = "#2a78d6";
export const BRAND = "#dd2a7b";

export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

interface BarsProps {
  data: { label: string; value: number }[];
  width: number;
  height?: number;
  labelEvery?: number;
}

/** Single-series bar chart drawn with PDF SVG primitives. */
export function PdfBars({ data, width, height = 120, labelEvery }: BarsProps) {
  if (data.length === 0) return null;
  const padL = 34;
  const padB = 16;
  const padT = 10;
  const plotW = width - padL - 4;
  const plotH = height - padB - padT;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = Math.min(plotW / data.length, 40);
  const gap = Math.min(2, slot * 0.2);
  const bw = Math.max(1, slot - gap);
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / 10));
  return (
    <Svg width={width} height={height}>
      {[0.5, 1].map((s) => {
        const y = padT + plotH - plotH * s;
        return (
          <G key={s}>
            <Line x1={padL} x2={width - 4} y1={y} y2={y} stroke={LINE} strokeWidth={0.5} />
            <SvgText x={padL - 4} y={y + 2.5} textAnchor="end" style={{ fontSize: 6, fill: FAINT }}>
              {compact(max * s)}
            </SvgText>
          </G>
        );
      })}
      <Line x1={padL} x2={width - 4} y1={padT + plotH} y2={padT + plotH} stroke={LINE} strokeWidth={0.5} />
      {data.map((d, i) => {
        const h = (d.value / max) * plotH;
        const x = padL + i * slot + gap / 2;
        return (
          <G key={i}>
            <Rect x={x} y={padT + plotH - h} width={bw} height={h} fill={BLUE} rx={1.5} />
            {i % every === 0 && (
              <SvgText x={x + bw / 2} y={height - 4} textAnchor="middle" style={{ fontSize: 6, fill: FAINT }}>
                {d.label}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weekday x hour heatmap. */
export function PdfHeatmap({ grid, width }: { grid: number[][]; width: number }) {
  const max = Math.max(1, ...grid.flat());
  const padL = 24;
  const padT = 10;
  const gap = 1.5;
  const cell = Math.min(12, (width - padL) / 24 - gap);
  const height = padT + 7 * (cell + gap);
  return (
    <Svg width={width} height={height}>
      {Array.from({ length: 24 }, (_, h) =>
        h % 3 === 0 ? (
          <SvgText key={h} x={padL + h * (cell + gap) + cell / 2} y={padT - 3} textAnchor="middle" style={{ fontSize: 5.5, fill: FAINT }}>
            {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
          </SvgText>
        ) : null,
      )}
      {grid.map((row, d) => (
        <G key={d}>
          <SvgText x={padL - 4} y={padT + d * (cell + gap) + cell / 2 + 2} textAnchor="end" style={{ fontSize: 6, fill: FAINT }}>
            {DAYS[d]}
          </SvgText>
          {row.map((v, h) => (
            <Rect
              key={h}
              x={padL + h * (cell + gap)}
              y={padT + d * (cell + gap)}
              width={cell}
              height={cell}
              rx={1.5}
              fill={BLUE}
              fillOpacity={v === 0 ? 0.08 : 0.25 + 0.75 * Math.sqrt(v / max)}
            />
          ))}
        </G>
      ))}
    </Svg>
  );
}
