import { NextResponse } from "next/server";
import { compute, computeMonthlySeries, type SpendingInput } from "@/lib/inflation/engine";
import type { Sector } from "@/lib/cpi/types";

export const runtime = "nodejs";

const SECTORS: Sector[] = ["combined", "urban", "rural"];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = (body ?? {}) as { spending?: SpendingInput; sector?: string };
  const spending = b.spending ?? {};
  if (typeof spending !== "object" || spending === null) {
    return NextResponse.json({ error: "`spending` must be an object" }, { status: 400 });
  }
  const sector: Sector = (SECTORS as string[]).includes(b.sector ?? "")
    ? (b.sector as Sector)
    : "combined";

  const result = compute(spending, undefined, sector);
  const series = computeMonthlySeries(spending, 24, sector);
  return NextResponse.json({ ...result, monthly_series: series });
}
