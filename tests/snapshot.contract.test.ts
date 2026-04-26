import { describe, it, expect } from "vitest";
import { getSnapshot, subgroupYoY } from "@/lib/cpi/snapshot";
import { USER_CATEGORIES } from "@/lib/cpi/categories";
import type { Sector } from "@/lib/cpi/types";

const SECTORS: Sector[] = ["combined", "urban", "rural"];

describe("CPI snapshot contract", () => {
  const snap = getSnapshot();

  it("declares a recognisable series and base year", () => {
    expect(snap.series_id.length).toBeGreaterThan(0);
    expect(snap.base_year).toBeGreaterThanOrEqual(2000);
    expect(snap.base_year).toBeLessThanOrEqual(2100);
    expect(snap.as_of_month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  it("subgroup weights sum to 1 in every sector", () => {
    for (const sector of SECTORS) {
      const total = Object.values(snap.sectors[sector].subgroups).reduce((s, m) => s + m.weight, 0);
      expect(total).toBeCloseTo(1, 3);
    }
  });

  it("every subgroup has a strictly positive index for every month it declares", () => {
    for (const sector of SECTORS) {
      for (const [key, series] of Object.entries(snap.sectors[sector].indices)) {
        for (const [month, value] of Object.entries(series)) {
          expect(Number.isFinite(value), `${sector}.${key}@${month} is not finite`).toBe(true);
          expect(value, `${sector}.${key}@${month} must be > 0`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("the as_of_month has a value for every declared subgroup in every sector", () => {
    for (const sector of SECTORS) {
      for (const key of Object.keys(snap.sectors[sector].subgroups)) {
        expect(snap.sectors[sector].indices[key]?.[snap.as_of_month]).toBeGreaterThan(0);
      }
    }
  });

  it("YoY can be computed for every subgroup at as_of_month", () => {
    for (const sector of SECTORS) {
      for (const key of Object.keys(snap.sectors[sector].subgroups)) {
        const r = subgroupYoY(key, snap.as_of_month, sector);
        expect(r, `YoY missing for ${sector}.${key}`).not.toBeNull();
      }
    }
  });

  it("every subgroup's YoY at as_of_month is within a plausible band (±50%)", () => {
    for (const sector of SECTORS) {
      for (const key of Object.keys(snap.sectors[sector].subgroups)) {
        const r = subgroupYoY(key, snap.as_of_month, sector)!;
        expect(Math.abs(r), `YoY for ${sector}.${key} implausible: ${r}`).toBeLessThan(0.5);
      }
    }
  });

  it("every user category maps only to subgroups that exist in the snapshot", () => {
    for (const cat of USER_CATEGORIES) {
      for (const { subgroup, split } of cat.subgroups) {
        expect(snap.sectors.combined.subgroups[subgroup], `${cat.key} -> unknown subgroup ${subgroup}`)
          .toBeDefined();
        expect(split).toBeGreaterThan(0);
        expect(split).toBeLessThanOrEqual(1);
      }
      const splitSum = cat.subgroups.reduce((s, x) => s + x.split, 0);
      expect(splitSum, `${cat.key} splits must sum to 1`).toBeCloseTo(1, 6);
    }
  });
});
