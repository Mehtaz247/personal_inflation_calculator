"use client";

interface Point { month: string; personal: number; official: number }

export default function TrendChart({ data }: { data: Point[] }) {
  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-5 text-sm text-ink-500">
        Not enough monthly history yet to draw a trend (need ≥2 months of YoY).
      </div>
    );
  }

  const W = 640;
  const H = 220;
  const PAD_L = 44;
  const PAD_R = 14;
  const PAD_T = 14;
  const PAD_B = 32;

  const xs = data.map((_, i) => i);
  const ys = data.flatMap((d) => [d.personal, d.official]);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const span = Math.max(0.005, ymax - ymin);
  const yLo = ymin - span * 0.15;
  const yHi = ymax + span * 0.15;

  const xScale = (i: number) => PAD_L + (i / Math.max(1, xs.length - 1)) * (W - PAD_L - PAD_R);
  const yScale = (v: number) => PAD_T + (1 - (v - yLo) / (yHi - yLo)) * (H - PAD_T - PAD_B);

  const path = (key: "personal" | "official") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d[key]).toFixed(1)}`).join(" ");

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yLo + ((yHi - yLo) * i) / ticks);

  const xLabelEvery = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Personal vs official inflation, monthly</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-emerald-400" /> Personal
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#52525b" strokeDasharray="3 2" strokeWidth="1.5" /></svg>
            Official
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="#27272a"
              strokeWidth="1"
            />
            <text x={PAD_L - 6} y={yScale(t)} textAnchor="end" dominantBaseline="middle" className="fill-zinc-500 text-[10px]">
              {(t * 100).toFixed(1)}%
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % xLabelEvery === 0 || i === data.length - 1 ? (
            <text key={d.month} x={xScale(i)} y={H - 12} textAnchor="middle" className="fill-zinc-500 text-[10px]">
              {shortMonth(d.month)}
            </text>
          ) : null,
        )}
        <path d={path("official")} fill="none" stroke="#52525b" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={path("personal")} fill="none" stroke="#34d399" strokeWidth="2" />
      </svg>
    </div>
  );
}

function shortMonth(m: string): string {
  const [y, mm] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(mm) - 1]} ${y.slice(2)}`;
}
