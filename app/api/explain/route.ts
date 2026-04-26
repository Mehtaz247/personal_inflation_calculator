import { NextResponse } from "next/server";
import { compute, type SpendingInput } from "@/lib/inflation/engine";
import { computeForState } from "@/lib/inflation/state-engine";
import { deterministicExplanation, generateExplanation } from "@/lib/ai/explain";
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
  const b = (body ?? {}) as {
    spending?: SpendingInput;
    sector?: string;
    state_code?: number;
  };
  const spending = b.spending ?? {};
  const sector: Sector = (SECTORS as string[]).includes(b.sector ?? "")
    ? (b.sector as Sector)
    : "combined";

  let result;
  if (b.state_code != null && b.state_code !== 0) {
    try {
      result = await computeForState(spending, b.state_code, sector);
    } catch {
      result = compute(spending, undefined, sector);
    }
  } else {
    result = compute(spending, undefined, sector);
  }

  try {
    const { text, source } = await generateExplanation(result);
    return NextResponse.json({ text, source, result });
  } catch {
    return NextResponse.json({
      text: deterministicExplanation(result),
      source: "fallback",
      result,
    });
  }
}
