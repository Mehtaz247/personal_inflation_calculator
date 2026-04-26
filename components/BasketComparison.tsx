"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { GapRow } from "@/lib/inflation/engine";

const COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b",
  "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#84cc16", "#d946ef",
];

export default function BasketComparison({ rows }: { rows: GapRow[] }) {
  const nationalData = rows
    .map((r) => ({ name: r.label, value: r.national_weight * 100 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const personalData = rows
    .map((r) => ({ name: r.label, value: r.your_weight * 100 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl backdrop-blur-md">
          <p className="mb-1 text-xs font-semibold text-zinc-100">{payload[0].name}</p>
          <p className="text-sm font-medium text-zinc-300">
            {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:grid-cols-2">
      <div className="flex flex-col items-center">
        <h3 className="mb-2 text-sm font-medium tracking-wide text-zinc-400">National Average Basket</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nationalData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {nationalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="mb-2 text-sm font-medium tracking-wide text-zinc-400">Your Basket</h3>
        {personalData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={personalData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {personalData.map((entry, index) => {
                    const natIndex = nationalData.findIndex(n => n.name === entry.name);
                    const colorIndex = natIndex >= 0 ? natIndex : index;
                    return <Cell key={`cell-${index}`} fill={COLORS[colorIndex % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center text-sm text-zinc-600">
            No spending data entered
          </div>
        )}
      </div>
    </div>
  );
}
