"use client";

import { useEffect, useRef, useState } from "react";

/** Track the rendered width so SVG text stays at its real pixel size. */
function useWidth(fallback = 560) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function ticks(max: number) {
  const lead = Math.round(max / Math.pow(10, Math.floor(Math.log10(max))));
  const count = lead === 2 ? 4 : 5;
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** Multi-series line chart with a crosshair tooltip. One y-axis. */
export function LineChart({
  series,
  labels,
  height = 220,
  format = (n: number) => String(n),
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (n: number) => string;
}) {
  const [ref, W] = useWidth();
  const H = height;
  const m = { t: 10, r: 12, b: 26, l: 34 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const n = labels.length;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)) * 1.1);
  const x = (i: number) => m.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const [hover, setHover] = useState<number | null>(null);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - m.l) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const every = Math.ceil(n / Math.max(3, Math.floor(W / 90)));
  const hx = hover !== null ? x(hover) : 0;
  const leftPct = hover !== null ? (hx / W) * 100 : 0;

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <g className="axis">
          {ticks(max).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % every === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
                {l}
              </text>
            ) : null,
          )}
        </g>
        {hover !== null && <line x1={hx} x2={hx} y1={m.t} y2={m.t + ih} stroke="var(--border-strong)" strokeWidth={1} />}
        {series.map((s) => (
          <path
            key={s.key}
            d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {hover !== null &&
          series.map((s) => (
            <circle key={s.key} cx={hx} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="var(--surface-1)" strokeWidth={2} />
          ))}
        <rect x={m.l} y={m.t} width={iw} height={ih} fill="transparent" />
      </svg>
      {hover !== null && (
        <div
          className="tooltip"
          style={{ top: 8, left: `${leftPct}%`, transform: `translateX(${leftPct > 60 ? "calc(-100% - 12px)" : "12px"})` }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{labels[hover]}</div>
          {series.map((s) => (
            <div className="tt-row" key={s.key}>
              <span className="row" style={{ gap: 6 }}>
                <span className="brand-dot" style={{ background: s.color }} />
                {s.label}
              </span>
              <b>{format(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Stacked vertical bars with a 2px surface gap between segments and an optional marker band. */
export function StackedBars({
  series,
  labels,
  height = 220,
  shade = [],
  shadeLabel,
  tickEvery = 3,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  shade?: [number, number][];
  shadeLabel?: string;
  tickEvery?: number;
}) {
  const [ref, W] = useWidth();
  const H = height;
  const m = { t: 18, r: 8, b: 26, l: 34 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((s, ser) => s + ser.values[i], 0));
  const max = niceMax(Math.max(1, ...totals) * 1.05);
  const band = iw / n;
  const bw = Math.max(4, band * 0.68);
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Stacked bar chart" onPointerLeave={() => setHover(null)}>
        {shade.map(([a, b], i) => (
          <g key={i}>
            <rect x={m.l + a * band} y={m.t} width={(b - a) * band} height={ih} fill="var(--surface-2)" />
            <text x={m.l + a * band + 4} y={m.t - 5} fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
              {shadeLabel}
            </text>
          </g>
        ))}
        <g className="axis">
          {ticks(max).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end">{Math.round(t)}</text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % tickEvery === 0 ? (
              <text key={i} x={m.l + i * band + band / 2} y={H - 6} textAnchor="middle">{l}</text>
            ) : null,
          )}
        </g>
        {labels.map((_, i) => {
          let acc = 0;
          const cx = m.l + i * band + (band - bw) / 2;
          const segs = series.map((s, si) => {
            const v = s.values[i];
            const y0 = y(acc);
            acc += v;
            const y1 = y(acc);
            const h = Math.max(0, y0 - y1 - (si > 0 ? 2 : 0));
            const isTop = series.slice(si + 1).every((t) => t.values[i] === 0);
            if (v <= 0) return null;
            const r = isTop ? Math.min(4, bw / 2, h) : 0;
            const top = y1;
            const d = `M${cx},${top + h} L${cx},${top + r} Q${cx},${top} ${cx + r},${top} L${cx + bw - r},${top} Q${cx + bw},${top} ${cx + bw},${top + r} L${cx + bw},${top + h} Z`;
            return <path key={s.key} d={d} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.45} />;
          });
          return (
            <g key={i}>
              {segs}
              <rect
                x={m.l + i * band}
                y={m.t}
                width={band}
                height={ih}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="tooltip"
          style={{
            top: 8,
            left: `${((m.l + hover * band + band / 2) / W) * 100}%`,
            transform: `translateX(${hover > n * 0.6 ? "calc(-100% - 12px)" : "12px"})`,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{labels[hover]}</div>
          {series.map((s) => (
            <div className="tt-row" key={s.key}>
              <span className="row" style={{ gap: 6 }}>
                <span className="brand-dot" style={{ background: s.color }} />
                {s.label}
              </span>
              <b>{s.values[hover]}</b>
            </div>
          ))}
          <div className="tt-row" style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
            <span>Total</span>
            <b>{totals[hover]}</b>
          </div>
        </div>
      )}
    </div>
  );
}

export function Legend({ series }: { series: { key: string; label: string; color: string }[] }) {
  if (series.length < 2) return null;
  return (
    <div className="legend">
      {series.map((s) => (
        <span key={s.key}>
          <span className="brand-dot" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
