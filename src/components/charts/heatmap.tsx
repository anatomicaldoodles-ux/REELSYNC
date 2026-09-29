import { WEEKDAYS, fmtHour, fmtNumber } from "@/lib/format";

interface Props {
  grid: number[][];
  title: string;
}

/** Weekday x hour heatmap using a single-hue sequential scale. */
export function Heatmap({ grid, title }: Props) {
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-faint">No data for this period.</p>;
  const cell = 20;
  const gap = 2;
  const padL = 34;
  const padT = 16;
  const width = padL + 24 * (cell + gap);
  const height = padT + 7 * (cell + gap);
  return (
    <figure className="w-full">
      <figcaption className="text-sm font-medium mb-1">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-2xl" role="img" aria-label={title}>
        {Array.from({ length: 24 }, (_, h) =>
          h % 3 === 0 ? (
            <text key={h} x={padL + h * (cell + gap) + cell / 2} y={padT - 5} textAnchor="middle" fontSize={9} fill="var(--faint)">
              {fmtHour(h)}
            </text>
          ) : null,
        )}
        {grid.map((row, d) => (
          <g key={d}>
            <text x={padL - 6} y={padT + d * (cell + gap) + cell / 2 + 3} textAnchor="end" fontSize={9} fill="var(--faint)">
              {WEEKDAYS[d]}
            </text>
            {row.map((v, h) => {
              const t = v / max;
              const opacity = v === 0 ? 0.08 : 0.25 + 0.75 * Math.sqrt(t);
              return (
                <rect
                  key={h}
                  x={padL + h * (cell + gap)}
                  y={padT + d * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={3}
                  fill="var(--viz-1)"
                  fillOpacity={opacity}
                >
                  <title>{`${WEEKDAYS[d]} ${fmtHour(h)}: ${fmtNumber(v)}`}</title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>
    </figure>
  );
}
