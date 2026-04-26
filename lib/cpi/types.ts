export type MonthKey = `${number}-${string}`;

export type Sector = "combined" | "urban" | "rural";

export interface CpiSubgroupMeta {
  label: string;
  weight: number;
  code?: string;
}

export interface CpiFoodClassMeta {
  label: string;
  group?: string;
  code: string;
}

export interface CpiSectorData {
  subgroups: Record<string, CpiSubgroupMeta>;
  indices: Record<string, Record<MonthKey, number>>;
  general_index?: Record<MonthKey, number>;
  /**
   * Optional COICOP class-level indices nested within division 01
   * (Food & beverages). Keys are class codes like "01.1.2" (meat),
   * "01.1.3" (fish & seafood). Class-level *weights* are not stored
   * because MoSPI does not publish them as part of the public API at
   * base 2024 — only indices are tracked.
   */
  food_classes?: Record<string, { meta: CpiFoodClassMeta; series: Record<MonthKey, number> }>;
}

export interface CpiSnapshot {
  series_id: string;
  description: string;
  source: string;
  source_url: string;
  base_year: number;
  as_of_month: MonthKey;
  frequency: "monthly";
  currency_unit: string;
  provenance_note: string;
  official_headline?: Partial<Record<Sector, number>>;
  sectors: Record<Sector, CpiSectorData>;
}

export type SubgroupKey =
  | "food_and_beverages"
  | "pan_tobacco_and_intoxicants"
  | "clothing_and_footwear"
  | "housing_utilities"
  | "furnishings_household"
  | "health"
  | "transport"
  | "information_communication"
  | "recreation_culture"
  | "education_services"
  | "restaurants_accommodation"
  | "personal_care_misc";
