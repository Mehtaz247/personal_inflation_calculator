import { NextResponse } from "next/server";
import { compute, type SpendingInput } from "@/lib/inflation/engine";
import { generateExplanation } from "@/lib/ai/explain";
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
  const sector: Sector = (SECTORS as string[]).includes(b.sector ?? "")
    ? (b.sector as Sector)
    : "combined";
  const result = compute(spending, undefined, sector);

  try {
    const { text, source } = await generateExplanation(result);
    return NextResponse.json({ text, source, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "AI explanation failed", detail: message, result },
      { status: 502 },
    );
  }
}
