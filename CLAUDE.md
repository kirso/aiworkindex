# CLAUDE.md — AI Work Index

AI Work Index: 562 Singapore occupations and 88 modern roles scored for AI displacement risk using a deterministic V7 two-axis model (displacement pressure and demand resilience). Static site, no backend.

## Core Commands

- Use **Bun**, not npm or pnpm.
- Install: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build` (prerendered static site)
- Typecheck: `bun run check`
- Lint: `bun run lint`
- Format: `bun run format`
- Format check: `bun run format:check`
- Validate scoring: `bun run validate`
- Full verify: `bun run verify` (typecheck + lint + format + validate)
- Run scoring pipeline: `bun run scripts/score.ts`
- Run backtesting: `bun run scripts/backtest.ts`
- Generate sitemap: `bun run scripts/generate-sitemap.ts`
- Generate OG images: `bun run scripts/generate-og.ts` (also part of `build:release-data` and `release:generate`; writes `static/og/og-manifest.json`, whose signature `release:check` verifies — stale share cards now fail the gate)
- Build industry momentum: `bun run scripts/build-industry-momentum.ts`
- Validate BLS crosswalk: `bun run scripts/validate-bls-crosswalk.ts`

## Always Applies

- Inspect the existing code before changing it. Do not speculate.
- Prefer the smallest clean change that solves the problem.
- Prefer boring, explicit code over clever abstractions.
- Reuse existing helpers, components, and design tokens before adding new ones.
- No `any` in production code (`src/`). Scripts (`scripts/`) are relaxed.
- Use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`, `$props`). No legacy Svelte 4 stores.
- After every change, run `bun run check && bun run lint` at minimum.
- After scoring or data changes, regenerate OG cards (`bun run scripts/generate-og.ts`), then run `bun run validate` and `bun run release:check` (the latter fails if share cards are stale).
- After significant changes, run `bun run build` to confirm prerendering succeeds.

## Simplicity Rules

- Extract only after repeated need. Three similar lines are better than a premature abstraction.
- Do not add error handling for scenarios that can't happen.
- Do not create helpers for one-time operations.
- Keep boundary files (+page.svelte, +page.ts) focused.
- Delete dead code directly. No `_unused` prefixes, no `// removed` comments.

## Tech Stack

- **SvelteKit 5** with `adapter-static` (fully prerendered, deployed to Cloudflare Workers)
- **Svelte 5** with runes (`$state`, `$derived`, `$effect`, `$props`)
- **TypeScript** with strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Tailwind CSS v4** with `@tailwindcss/vite` (proper `@theme` + `@theme inline` architecture)
- **D3.js** for visualization layout computation (scales, shapes — no DOM manipulation)
- **Bits UI** for accessible component primitives (dialog, tabs, dropdown, etc.)
- **tailwind-variants** for component style variants (design system in `src/lib/design-system.ts`)

## Architecture

### Data Pipeline (deterministic, no LLMs)

```
data/raw/external/ → scripts/score.ts → data/occupations.json → src/lib/data/occupations.json
                   → scripts/build-labour-monitor.ts → data/labour-monitor.json
                   → scripts/backtest.ts → data/backtests/q3-2025-validation.json
                   → scripts/build-industry-momentum.ts → data/industry-momentum.json
                   → scripts/validate-bls-crosswalk.ts → BLS cross-country validation
```

**Scoring formula (V7):** `headline_risk = displacement_pressure × (1 − demand_resilience)`

V7 adds two formula changes over V6:
- **Task-concentration exposure buffer** (Hampole et al. 2025): `task_signal = task_concentration × task_coverage`, `exposure_v7 = exposure × (1 − 0.20 × task_signal)` — concentrated task exposure buffers risk (workers reallocate effort to non-exposed tasks, offsetting labour-demand losses)
- **Demand persistence proxy** (motivated by the Imas price-elasticity critique; measures recent labour-demand persistence, not output-price elasticity): `demand_persistence = 0.4 × momentum_rank + 0.3 × vacancy_rank + 0.2 × scarcity_rank + 0.1 × demand_bonus_rank`

- **Displacement pressure**: `exposure_v7 × (1 − bottleneck)` — task-concentration-weighted structural automation potential
- **Demand resilience**: `min(1.0, base_resilience × 0.45 + demand_signal_bonus + 0.10 × demand_persistence)` — market counterforce with persistence proxy
- **Exposure**: Ensemble of Felten AIOE + Anthropic observed usage + Eloundou GPT + ILO GenAI, reliability-weighted per Frank et al. (2025)
- **Bottleneck**: Pizzinelli theta from O*NET work context (human coordination, physical presence)
- **Demand signals**: SOL 2026 (exact: +0.15, prefix: +0.08), JiD 2025 (exact: +0.12, prefix: +0.06)
- **Crosswalk**: SSOC → ISCO-08 (first 4 digits) → US SOC 2010 → O*NET/AIOE data

### Single Source of Truth

- `src/lib/data/scoring-constants.ts` — ALL thresholds, rules, and data vintage metadata
- `DATA_VINTAGE` object in that file — occupation count, role count, model version, data dates
- When updating counts, dates, or versions, update `scoring-constants.ts` FIRST — the footer, about page, and JSON-LD schema read from it automatically

### Source Data (do NOT modify by hand)

- `data/occupations.json` — 562 occupations with full scores (generated by score.ts)
- `src/lib/data/occupations.json` — copy of above for SvelteKit import
- `data/labour-monitor.json` — quarterly MOM labour market data by cluster
- `data/raw/external/` — source datasets (AIOE, O*NET, Anthropic, MOM SOL, etc.)

### Frontend

- `src/lib/data/index.ts` — types and data exports (Occupation, LabourClusterMonitor, etc.)
- `src/lib/data/scoring-constants.ts` — thresholds, impact rules, data vintage (single source of truth)
- `src/lib/data/forecast-engine.ts` — outlook computation with seniority modifiers
- `src/lib/data/role-archetypes.ts` — 17 archetype-based personalized content
- `src/lib/data/workflow-overlay.ts` — 8 workflow dimensions, narrative generation
- `src/lib/data/synthetic-roles.ts` — 88 modern roles as weighted SSOC blends
- `src/lib/data/aliases.ts` — 189 search aliases mapped to SSOC codes
- `src/lib/data/transition-capacity.ts` — career transition scoring
- `src/lib/design-system.ts` — Signal design system (card, badge, typography variants)
- `src/lib/components/viz/` — D3-powered visualizations (Treemap, Waterfall, Histogram, etc.)
- `src/lib/components/ui/` — shadcn-style UI components (Bits UI based)
- `src/lib/components/ui/Seo.svelte` — unified SEO component (meta, OG, JSON-LD)

### Routes (21+ pages)

- `/` — homepage with search, browse pills, treemap, featured data
- `/occupation/[ssoc]` — 562 occupation detail pages (Signal hero with big number)
- `/role/[slug]` — 88 synthetic role pages
- `/explore` — filter, treemap, histogram, scatter
- `/compare` — side-by-side comparison
- `/rankings/*` — 8 ranking views
- `/methodology` — scoring explanation, validation, seniority, synthetic roles
- `/methodology/appendix` — exact thresholds and formulas reference
- `/about` — model card, data vintage, credits
- `/reports` — quarterly analysis
- `/calculator` — personalized salary vs AI risk calculator
- `/reports/wage-exposure` — SGD 46B wage exposure analysis
- `/rankings/rich-and-risky` — highest-paid at high risk
- `/data` — downloads and data dictionary

## Scoring Thresholds (must stay consistent)

Canonical source: `src/lib/data/scoring-constants.ts`. Also documented in `score.ts`, `validate.ts`, methodology page, and appendix.

| Band | Range | Label |
|------|-------|-------|
| very_low | < 0.05 | Very Low |
| low | 0.05–0.15 | Low |
| moderate | 0.15–0.30 | Moderate |
| high | 0.30–0.50 | High |
| very_high | ≥ 0.50 | Very High |

**Impact type logic** (displacement × augmentation matrix):
- `ai_leveraged` (Augmented): net_risk < 0.25 AND augmentation ≥ 0.12
- `at_risk`: net_risk ≥ 0.25 AND augmentation < 0.12 AND no demand signal
- `mixed`: net_risk ≥ 0.25 AND (augmentation ≥ 0.12 OR has SOL/JiD demand signal)
- `stable`: net_risk < 0.25 AND augmentation < 0.12

## Code Quality

- **No `any` in `src/`** — enforced by ESLint (`@typescript-eslint/no-explicit-any: error`)
- **No hardcoded Tailwind colors** — use design system tokens (`bg-risk-*`, `text-impact-*`)
- **No hardcoded counts** — use `DATA_VINTAGE` from `scoring-constants.ts` where possible
- **Unused vars** — enforced by ESLint (prefix with `_` if intentionally unused)
- **Interface/type naming** — PascalCase enforced by ESLint
- **Formatting** — Prettier with tabs, single quotes, 100 char width, trailing comma: none
- **Svelte** — `@html` only allowed in pages with JSON-LD schema (enforced by ESLint exception list)
- **JSON-LD** — assign to script variable, render with `{@html varName}` (avoids parser errors)
- **Cards** — always use `card()` from design-system, never raw `rounded-lg border bg-card`

## Testing and Verification

| Change type | Minimum verification |
|---|---|
| Score formula or threshold | `bun run scripts/generate-og.ts` (refresh share cards) then `bun run check && bun run validate && bun run build` |
| UI or component | `bun run check && bun run lint` |
| Data pipeline script | `bun run scripts/score.ts && bun run validate` |
| Labour data update | `bun run scripts/build-labour-monitor.ts && bun run scripts/score.ts && bun run validate` |
| Methodology or about page | `bun run check && bun run build` (verify no unshipped feature claims) |
| New synthetic role | Add to `synthetic-roles.ts` + `role-taxonomy.ts`, run `bun run validate` |
| New alias | Add to `aliases.ts`, run `bun run validate` (checks all SSOC codes exist) |
| PR-ready | `bun run verify` |

## Update Procedures

### When new labour data is released (quarterly)
1. Update source CSV in `data/raw/`
2. Run `bun run scripts/build-labour-monitor.ts`
3. Run `bun run scripts/score.ts`
4. Copy `data/occupations.json` → `src/lib/data/occupations.json`
5. Update `DATA_VINTAGE.labour_monitor` in `src/lib/data/scoring-constants.ts`
6. Update `src/lib/components/ui/LabourMarketSummary.svelte` context paragraph
7. Update `src/routes/reports/+page.svelte` with new report card
8. Run `bun run validate && bun run build`

### When adding a synthetic role
1. Add role definition to `src/lib/data/synthetic-roles.ts`
2. Add taxonomy entry to `src/lib/data/role-taxonomy.ts`
3. Update `DATA_VINTAGE.role_count` in `scoring-constants.ts`
4. Run `bun run validate` (checks SSOC codes exist, weights sum to 1.0)
5. Run `bun run build` (generates new role page)

### When adding a search alias
1. Add alias to `src/lib/data/aliases.ts`
2. Run `bun run validate` (checks all SSOC references exist)
3. Verify with: `bun --eval "import { findAliasMatches } from './src/lib/data/aliases.ts'; console.log(findAliasMatches('your-query'));"`

### When changing scoring thresholds
1. Update `src/lib/data/scoring-constants.ts` (canonical source)
2. Update `scripts/score.ts` (scoring pipeline)
3. Update `scripts/validate.ts` (validation checks)
4. Update methodology appendix (`src/routes/methodology/appendix/+page.svelte`)
5. Run `bun run scripts/score.ts && bun run validate && bun run build`
6. Verify: methodology page, appendix, data dictionary, CLAUDE.md all match

### When updating model version
1. Update `DATA_VINTAGE` in `scoring-constants.ts` (version, last_updated, counts)
2. Add version entry to methodology page version history
3. Footer and about page update automatically via `DATA_VINTAGE`

## Labour Market Data

Three clusters (not per-occupation):
- **PMET**: Professionals, Managers, Executives & Technicians
- **Clerical & Service**: Clerical Support + Service & Sales Workers
- **Production & Transport**: Craftsmen, Plant Operators, Cleaners

Current data: Q3 2025 full report + Q4 2025 advance release. When full Q4 2025 drops, follow the quarterly update procedure above.

## Research Context

The model is a **structural pressure score, not a prediction**. Key citations:
- Frank et al. (2025): ensemble exposure > single measures
- Hampole et al. (2025): mean exposure depresses labour demand, but concentrated exposure offsets losses via within-job task reallocation (V7 task-concentration buffer)
- Imas & Shukla (2026): price elasticity + job dimensionality as missing variables — V7's demand-persistence proxy is a partial, labour-demand-side response (it does not measure output-price elasticity)
- Brookings/PIIE (2026): "still in the first inning" + career pathway erosion framework
- Acemoglu & Restrepo (2019): we measure displacement only, not reinstatement
- Stanford DEL (2025) + Anthropic (2026): entry-level faces disproportionate displacement
- Brynjolfsson et al. (2023): junior workers see biggest AI productivity gains
- Noy & Zhang (2023): AI narrows experience gap in writing
- Dell'Acqua et al. (2023): jagged frontier — seniors better at knowing AI boundaries
- Backtested at cluster level: 2/4 directional checks pass (Q4 2025)
- BLS cross-country validation: SGxUS displacement correlation via `scripts/validate-bls-crosswalk.ts`

**Seniority modifiers:** Outlook section supports Entry-level / Mid-career / Senior adjustments scaled by variant_sensitivity. Junior base shift: +0.14 displacement / −0.12 augmentation. Research-grounded, labeled as estimated.

**Do not claim** the scores predict actual job losses. Frame as structural risk.
