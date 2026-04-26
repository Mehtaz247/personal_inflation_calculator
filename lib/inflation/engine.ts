import { USER_CATEGORIES, type UserCategoryKey } from "@/lib/cpi/categories";
import {
  headlineYoY,
  subgroupYoY,
  getLatestMonth,
  getSubgroupWeight,
  getOfficialHeadline,
  listAvailableMonths,
  DEFAULT_SECTOR,
} from "@/lib/cpi/snapshot";
import type { MonthKey, Sector } from "@/lib/cpi/types";

export type SpendingInput = Partial<Record<UserCategoryKey, number>>;

export interface CategoryResult {
  key: UserCategoryKey;
  label: string;
  spend: number;
  weight: number;
  inflation: number;
  contribution: number;
}

export interface GapRow {
  key: UserCategoryKey;
  label: string;
  your_weight: number;
  national_weight: number;
  weight_diff: number;
  category_yoy: number;
  gap_contribution: number;
}

export interface ComputeResult {
  as_of_month: MonthKey;
  base_year: number;
  sector: Sector;
  total_spend: number;
  personal_inflation: number;
  official_inflation: number;
  official_headline?: number;
  gap: number;
  categories: CategoryResult[];
  top_drivers: CategoryResult[];
  missing_categories: UserCategoryKey[];
  gap_decomposition: GapRow[];
}

function bucketInflation(
  categoryKey: UserCategoryKey,
  month: MonthKey,
  sector: Sector,
): number | null {
  const cat = USER_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return null;
  let total = 0;
  let used = 0;
  for (const { subgroup, split } of cat.subgroups) {
    const r = subgroupYoY(subgroup, month, sector);
    if (r == null) continue;
    total += split * r;
    used += split;
  }
  if (used === 0) return null;
  return total / used;
}

function nationalWeightFor(categoryKey: UserCategoryKey, sector: Sector): number {
  const cat = USER_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return 0;
  let w = 0;
  for (const { subgroup } of cat.subgroups) {
    w += getSubgroupWeight(subgroup, sector);
  }
  return w;
}

export function compute(
  spending: SpendingInput,
  month?: MonthKey,
  sector: Sector = DEFAULT_SECTOR,
): ComputeResult {
  const asOf = month ?? getLatestMonth();
  const entries = USER_CATEGORIES.map((c) => {
    const raw = spending[c.key];
    const spend = typeof raw === "number" && raw > 0 && Number.isFinite(raw) ? raw : 0;
    return { cat: c, spend };
  });

  const total = entries.reduce((s, e) => s + e.spend, 0);

  const missing: UserCategoryKey[] = [];
  const categories: CategoryResult[] = entries.map(({ cat, spend }) => {
    const weight = total > 0 ? spend / total : 0;
    const inflation = bucketInflation(cat.key, asOf, sector);
    if (inflation == null) missing.push(cat.key);
    const infl = inflation ?? 0;
    return {
      key: cat.key,
      label: cat.label,
      spend,
      weight,
      inflation: infl,
      contribution: weight * infl,
    };
  });

  const personal = categories.reduce((s, r) => s + r.contribution, 0);
  const official = headlineYoY(asOf, sector);

  const drivers = categories
    .filter((r) => r.weight > 0)
    .slice()
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  const gap_decomposition = decomposeGap(spending, asOf, sector);

  return {
    as_of_month: asOf,
    base_year: 2024,
    sector,
    total_spend: total,
    personal_inflation: personal,
    official_inflation: official,
    official_headline: getOfficialHeadline(sector),
    gap: personal - official,
    categories,
    top_drivers: drivers,
    missing_categories: missing,
    gap_decomposition,
  };
}

export function decomposeGap(
  spending: SpendingInput,
  month?: MonthKey,
  sector: Sector = DEFAULT_SECTOR,
): GapRow[] {
  const asOf = month ?? getLatestMonth();
  const entries = USER_CATEGORIES.map((c) => {
    const raw = spending[c.key];
    const spend = typeof raw === "number" && raw > 0 && Number.isFinite(raw) ? raw : 0;
    return { cat: c, spend };
  });
  const total = entries.reduce((s, e) => s + e.spend, 0);

  return entries.map(({ cat, spend }) => {
    const your_weight = total > 0 ? spend / total : 0;
    const national_weight = nationalWeightFor(cat.key, sector);
    const yoy = bucketInflation(cat.key, asOf, sector) ?? 0;
    const weight_diff = your_weight - national_weight;
    return {
      key: cat.key,
      label: cat.label,
      your_weight,
      national_weight,
      weight_diff,
      category_yoy: yoy,
      gap_contribution: weight_diff * yoy,
    };
  });
}

export function computeMonthlySeries(
  spending: SpendingInput,
  n_months = 24,
  sector: Sector = DEFAULT_SECTOR,
): Array<{ month: MonthKey; personal: number; official: number }> {
  const months = listAvailableMonths(sector);
  const usable: MonthKey[] = [];
  for (const m of months) {
    const [y, mm] = m.split("-");
    const prior = `${Number(y) - 1}-${mm}` as MonthKey;
    if (months.includes(prior)) usable.push(m);
  }
  const tail = usable.slice(-n_months);
  return tail.map((month) => {
    const r = compute(spending, month, sector);
    return { month, personal: r.personal_inflation, official: r.official_inflation };
  });
}
