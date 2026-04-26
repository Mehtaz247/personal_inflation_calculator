"use client";

import type { GapRow } from "@/lib/inflation/engine";

function pp(v: number, digits = 2): string {
  const x = v * 100;
  const sign = x > 0 ? "+" : x < 0 ? "−" : "";
  return `${sign}${Math.abs(x).toFixed(digits)} pp`;
}

function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export default function GapDecomposition({ rows }: { rows: GapRow[] }) {
  const sorted = rows
    .filter((r) => Math.abs(r.gap_contribution) > 1e-7)
    .slice()
    .sort((a, b) => Math.abs(b.gap_contribution) - Math.abs(a.gap_contribution))
    .slice(0, 6);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-5 text-sm text-ink-500">
        Enter some spending to see the gap breakdown.
      </div>
    );
  }

  const maxAbs = Math.max(...sorted.map((r) => Math.abs(r.gap_contribution)), 0.0001);

  const W = 640;
  const ROW_H = 28;
  const PAD_T = 8;
  const PAD_B = 8;
  const LABEL_W = 200;
  const ZERO_X = LABEL_W + 8;
  const BAR_AREA = W - ZERO_X - 90;
  const halfBar = BAR_AREA / 2;
  const H = PAD_T + PAD_B + sorted.length * ROW_H;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-md">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">
        Why your rate differs from the national average
      </h3>
      <p className="mb-3 text-xs text-zinc-400">
        Bars right of zero push your inflation above the national CPI; bars left pull it below.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={ZERO_X + halfBar} y1={PAD_T} x2={ZERO_X + halfBar} y2={H - PAD_B} stroke="#52525b" strokeWidth="1" />
        {sorted.map((r, i) => {
          const y = PAD_T + i * ROW_H + ROW_H / 2;
          const w = (Math.abs(r.gap_contribution) / maxAbs) * halfBar;
          const positive = r.gap_contribution > 0;
          const x = positive ? ZERO_X + halfBar : ZERO_X + halfBar - w;
          const color = positive ? "#f43f5e" : "#10b981"; // rose-500, emerald-500
          return (
            <g key={r.key}>
              <text x={LABEL_W} y={y} textAnchor="end" dominantBaseline="middle" className="fill-zinc-300 text-[11px]">
                {r.label}
              </text>
              <rect x={x} y={y - 8} width={Math.max(1, w)} height={16} fill={color} opacity="0.85" rx="2" />
              <text
                x={positive ? ZERO_X + halfBar + w + 4 : ZERO_X + halfBar - w - 4}
                y={y}
                textAnchor={positive ? "start" : "end"}
                dominantBaseline="middle"
                className="fill-zinc-200 text-[10px] font-medium tabular-nums"
              >
                {pp(r.gap_contribution)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-zinc-400 sm:grid-cols-2">
        {sorted.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-2 rounded bg-zinc-800/50 px-2 py-1">
            <span className="truncate text-zinc-200">{r.label}</span>
            <span className="tabular-nums">
              you {pct(r.your_weight)} vs nat {pct(r.national_weight)} · YoY {pct(r.category_yoy, 1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
