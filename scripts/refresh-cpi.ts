import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchCpiMonth } from "../lib/cpi/sources/mospi-api";
import { canonicalizeRow, buildSnapshot } from "../lib/cpi/transform";
import { cpiSnapshotSchema } from "../lib/cpi/schema";
import type { MonthKey, CpiSnapshot } from "../lib/cpi/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data/cpi/cpi-combined-2024.json");
const RAW_DIR = path.join(ROOT, "tmp/mospi-raw");

interface Args {
  asOf?: MonthKey;
  dryRun: boolean;
  logRaw: boolean;
  baseYear: number;
  months: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { asOf: undefined, dryRun: false, logRaw: false, baseYear: 2024, months: 18 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--as-of": a.asOf = next() as MonthKey; break;
      case "--dry-run": a.dryRun = true; break;
      case "--log-raw": a.logRaw = true; break;
      case "--base-year": a.baseYear = Number(next()); break;
      case "--months": a.months = Number(next()); break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown arg: ${arg}`);
        process.exit(2);
    }
  }
  return a;
}

function printHelp() {
  console.log(`Refresh CPI snapshot from MoSPI eSankhyiki API.
  --as-of YYYY-MM     Anchor month (default: auto-detect latest published)
  --base-year N       CPI base year (default: 2024)
  --months N          How many months to pull (default: 18)
  --dry-run           Validate but don't write the snapshot file
  --log-raw           Persist raw API responses to tmp/mospi-raw/
  --help              This message

Env: MOSPI_USERNAME, MOSPI_PASSWORD (optional bearer auth)`);
}

function shiftMonth(m: MonthKey, delta: number): MonthKey {
  const [yStr, mStr] = m.split("-");
  let y = Number(yStr);
  let mm = Number(mStr) + delta;
  while (mm <= 0) { mm += 12; y -= 1; }
  while (mm > 12) { mm -= 12; y += 1; }
  return `${y}-${String(mm).padStart(2, "0")}` as MonthKey;
}

function currentMonth(): MonthKey {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` as MonthKey;
}

async function dumpRaw(name: string, payload: unknown) {
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(path.join(RAW_DIR, `${name}.json`), JSON.stringify(payload, null, 2));
}

async function detectLatestMonth(args: Args): Promise<MonthKey> {
  let m: MonthKey = currentMonth();
  for (let attempts = 0; attempts < 5; attempts++) {
    const [y, mm] = m.split("-").map(Number);
    const res = await fetchCpiMonth({ base_year: args.baseYear, year: y, month_code: mm, limit: 10 });
    const hasDivision = res.rows.some((r) => {
      const div = (r as { division?: unknown }).division;
      return typeof div === "string" && div.length > 0 && div !== "CPI (General)";
    });
    if (hasDivision) return m;
    m = shiftMonth(m, -1);
  }
  throw new Error("Could not auto-detect a published CPI month with division-level data within last 5 months.");
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`[refresh-cpi] base_year=${args.baseYear} months=${args.months}`);

  const asOf = args.asOf ?? (await detectLatestMonth(args));
  console.log(`[refresh-cpi] anchor month: ${asOf}`);

  const monthList: MonthKey[] = [];
  for (let i = 0; i < args.months; i++) monthList.push(shiftMonth(asOf, -i));
  const yoyAnchor = shiftMonth(asOf, -12);
  if (!monthList.includes(yoyAnchor)) monthList.push(yoyAnchor);

  const monthlyRows: Record<MonthKey, ReturnType<typeof canonicalizeRow>[]> = {};
  for (const month of monthList) {
    const [y, mm] = month.split("-").map(Number);
    // Page 1 carries divisions + groups; pages 2-3 carry food classes
    // (codes 01.1.x and 01.2.x). Once we hit a page whose codes have all
    // moved past "01.", we stop — no point pulling 600+ pages of
    // sub-classes/items we don't store.
    const pages = [1, 2, 3, 4, 5];
    const aggregated: Record<string, unknown>[] = [];
    for (const page of pages) {
      const res = await fetchCpiMonth({ base_year: args.baseYear, year: y, month_code: mm, limit: 100, page });
      if (args.logRaw) await dumpRaw(`${month}-p${page}`, res.raw);
      aggregated.push(...res.rows);
      // Bail early once we've moved past food (codes 01.x).
      const codes = res.rows
        .map((r) => (r as { code?: string }).code)
        .filter((c): c is string => typeof c === "string" && c.length > 0);
      const allPastFood = codes.length > 0 && codes.every((c) => !c.startsWith("01."));
      if (page >= 3 && allPastFood) break;
    }
    const canonical = aggregated.map(canonicalizeRow).filter((r): r is NonNullable<typeof r> => r != null);
    monthlyRows[month] = canonical;
    console.log(
      `[refresh-cpi] ${month}: ${aggregated.length} raw rows across pages, ${canonical.length} canonical (${canonical.filter((r) => r.className).length} food-class rows)`,
    );
  }

  const sourceUrl = `https://api.mospi.gov.in/api/cpi/getCPIData?base_year=${args.baseYear}`;
  const snapshot = buildSnapshot({
    asOfMonth: asOf,
    baseYear: args.baseYear,
    monthlyRows: monthlyRows as Record<MonthKey, NonNullable<ReturnType<typeof canonicalizeRow>>[]>,
    sourceUrl,
  });

  const parsed = cpiSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    console.error("[refresh-cpi] Validation failed:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    if (args.logRaw) {
      await dumpRaw("invalid-snapshot", snapshot);
    }
    process.exit(1);
  }

  let prev: CpiSnapshot | null = null;
  try {
    prev = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")) as CpiSnapshot;
  } catch { /* first run */ }
  if (prev && prev.as_of_month === snapshot.as_of_month) {
    console.log(`[refresh-cpi] No change in as_of_month (${snapshot.as_of_month}); values may have been revised.`);
  }

  if (args.dryRun) {
    console.log("[refresh-cpi] --dry-run: not writing file.");
    console.log(JSON.stringify(snapshot, null, 2).slice(0, 800) + "\n…");
    return;
  }

  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`[refresh-cpi] Wrote ${SNAPSHOT_PATH} (as_of_month=${snapshot.as_of_month})`);
}

main().catch((err) => {
  console.error("[refresh-cpi] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
