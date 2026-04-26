import { NextResponse } from "next/server";
import { computeForState } from "@/lib/inflation/state-engine";
import { compute, computeMonthlySeries, type SpendingInput } from "@/lib/inflation/engine";
import type { Sector } from "@/lib/cpi/types";

export const runtime = "nodejs";
export const maxDuration = 15; // state fetch can be slow (2 API calls)

const SECTORS: Sector[] = ["combined", "urban", "rural"];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = (body ?? {}) as { spending?: SpendingInput; sector?: string; state_code?: number };
  const spending = b.spending ?? {};
  const sector: Sector = (SECTORS as string[]).includes(b.sector ?? "")
    ? (b.sector as Sector)
    : "combined";

  // All India → use local computation
  if (b.state_code == null || b.state_code === 0) {
    const result = compute(spending, undefined, sector);
    const series = computeMonthlySeries(spending, 24, sector);
    return NextResponse.json({ ...result, monthly_series: series });
  }

  // State-level → call MoSPI API
  try {
    const result = await computeForState(spending, b.state_code, sector);
    // Monthly series not available for state-level (would need 24 API calls),
    // fall back to All India series as reference
    const series = computeMonthlySeries(spending, 24, sector);
    return NextResponse.json({ ...result, monthly_series: series });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Fall back to All India if state API fails
    const fallback = compute(spending, undefined, sector);
    const series = computeMonthlySeries(spending, 24, sector);
    return NextResponse.json({
      ...fallback,
      monthly_series: series,
      state_error: `Could not fetch ${sector} CPI for state ${b.state_code}: ${message}. Showing All India data.`,
    });
  }
}
