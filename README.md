# Personal Inflation Calculator (India)

Estimate your household's *personal* inflation by reweighting official Indian CPI
components (base **2024=100**) with your own monthly spending mix.

Official CPI reflects the basket of an average household. A family that spends
heavily on rent, healthcare, or education experiences inflation very differently
from the headline print. This app does the reweighting honestly.

---

## How the math works

1. Load official MoSPI CPI subgroup indices (Combined, base 2024=100).
2. For each subgroup `s`, compute YoY inflation from the index ratio:
   `r_s = idx_s[month] / idx_s[month − 12] − 1`
3. Convert the user's rupee spending into personal weights:
   `w_i = spend_i / total_spend`
4. Map each user bucket to one or more CPI subgroups (see
   `lib/cpi/categories.ts`).
5. Personal inflation = `Σ (w_i × r_i)`.
6. Official headline = weighted combination of subgroup YoYs using the
   subgroup weights stored in the snapshot — so personal vs. official are
   computed on the *same* month of the *same* series.

The engine is pure functions and covered by unit tests (`tests/engine.test.ts`).

## Project structure

```
app/
  page.tsx                  # form + results UI (server component)
  api/compute/route.ts      # POST { spending } -> numeric result
  api/explain/route.ts      # POST { spending } -> AI prose + result
components/
  Calculator.tsx            # client: form, presets, submit
  Results.tsx               # client: stat cards, drivers, explanation
lib/
  cpi/snapshot.ts           # typed loader over the JSON snapshot
  cpi/categories.ts         # user bucket -> CPI subgroup mapping
  inflation/engine.ts       # pure math
  ai/explain.ts             # Anthropic SDK wrapper + deterministic fallback
data/cpi/
  cpi-combined-2024.json    # committed MoSPI snapshot (base 2024=100)
tests/
  engine.test.ts            # vitest unit tests
```

## CPI data

The JSON snapshot at `data/cpi/cpi-combined-2024.json` has provenance fields
(`source`, `source_url`, `base_year`, `as_of_month`, `provenance_note`) and
holds monthly subgroup indices plus the official subgroup weights.

The shipped values are illustrative placeholders consistent with recent Indian
CPI behaviour, rebased to 2024=100. To refresh with the live MoSPI release, edit
that single file — the schema (loader `lib/cpi/snapshot.ts`) is the integration
point.

## Running locally

```bash
npm install
npm test          # runs the engine unit tests
npm run dev       # http://localhost:3000
npm run build
```

### AI explanation layer (optional)

The math never depends on the LLM. If `ANTHROPIC_API_KEY` is set, the
`/api/explain` route uses `claude-haiku-4-5` to turn the numeric result into
2–3 sentences of plain English. Without a key, a deterministic template
explanation is returned instead, and the UI labels which source produced it.

```bash
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
```

## Deployment

The app is a standard Next.js App Router project and deploys to Vercel with
no additional configuration. Set `ANTHROPIC_API_KEY` as a Vercel env var to
enable AI explanations.

## Design principles

- **Correct before flashy.** Math is in `lib/inflation/engine.ts` and tested.
- **Modular.** CPI source format can change without touching the UI.
- **Transparent.** Provenance fields are shown in the footer; every number on
  screen is traceable to an index ratio.
- **AI used honestly.** The model explains the computed result; it does not
  invent inflation numbers.
