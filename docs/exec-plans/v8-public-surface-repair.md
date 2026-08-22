# Repair V8 charts, responsive data views, and public wording

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global `exec-plan` skill.

## Purpose / Big Picture

The public site must explain the V8 AI Exposure Rank without reintroducing V7 risk mechanics, probability-like percentages, or legacy four-bucket impact labels. Every public chart should encode a current V8 field with a stated unit, and every public data view should remain readable without horizontal scrolling at phone, tablet, and ordinary laptop widths. A reader should be able to distinguish relative AI exposure, likely job pathway, and current labour-market context without being told that any of them predicts job loss.

## Progress

- [x] (2026-07-16) Audited public chart components, chart data fields, rendered breakpoints, and table overflow.
- [x] (2026-07-16) Replaced the legacy homepage pathway summary, scatter, histogram, and inconsistent treemap sizing.
- [x] (2026-07-16) Replaced the misleading detail-page driver display and corrected Theory vs Practice percentiles.
- [x] (2026-07-16) Rebuilt shared and page-specific data views with mobile cards or compact layouts.
- [x] (2026-07-16) Removed or qualified stale V7 language on active routes and withheld incomparable V7 quarterly movement.
- [x] (2026-07-16) Added regression coverage for V8 pathway counts, source percentile bounds, archived reports, and forbidden legacy labels.
- [x] (2026-07-16) Ran formatting, type checks, 45 tests, 222 validation checks, release checks, production build, and browser QA across 48 route/viewport combinations.

## Surprises & Discoveries

- Observation: All existing methodology tests and 222 validation checks pass despite several public charts encoding the wrong field or unit.
  Evidence: `bun test` reports 40 passing tests and `bun run validate` reports 222 passing checks; neither validates rendered chart contracts.
- Observation: The homepage four-bucket summary is arithmetically complete but semantically collapses two V8 pathways.
  Evidence: 285 `workflow_redesign` plus 10 `demand_buffered_redesign` records appear as 295 `mixed` records.
- Observation: Ranking tables overflow even at a 1280px viewport.
  Evidence: browser measurement found a 1,217-1,252px table inside a 1,102px feature shell.
- Observation: Synthetic modern-role scores were displayed as if they were occupation percentile ranks.
  Evidence: the calculator said every selected entry ranked above a percentage of Singapore occupations even though synthetic roles are not part of the 562-occupation percentile distribution.
- Observation: the quarterly report contains two V7 snapshots while the public site is V8.
  Evidence: `quarterly-report.json` names `occupations-v7-2026-07.json` and `occupations-v7-2026-06.json`; the public page now withholds those deltas until two V8 snapshots exist.

## Decision Log

- Decision: Replace the dense demand scatter with a categorical exposure-band by demand-context matrix.
  Rationale: V8 publishes five exposure bands and three current-demand contexts; the categorical matrix is faithful, legible on mobile, and avoids 562 overlapping and focusable SVG dots.
  Date/Author: 2026-07-16 / Codex
- Decision: Replace the percentile histogram with a five-pathway horizontal comparison.
  Rationale: A percentile-rank distribution is close to uniform by construction and therefore does not answer a useful reader question.
  Date/Author: 2026-07-16 / Codex
- Decision: Use mobile cards or definition lists for dense tables instead of relying on horizontal scrolling.
  Rationale: Widening page shells does not solve 640-1,252px content on a 390px viewport.
  Date/Author: 2026-07-16 / Codex
- Decision: Preserve older release pages but place an archive notice before their content.
  Rationale: historical formulas are useful for auditability, but the reader must not mistake them for current V8 meanings.
  Date/Author: 2026-07-16 / Codex
- Decision: Treat synthetic roles as component-derived estimates on every mixed occupation/role surface.
  Rationale: they do not participate in the official occupation percentile distribution and therefore cannot truthfully inherit the AI Exposure Rank interpretation.
  Date/Author: 2026-07-16 / Codex

## Outcomes & Retrospective

The current public UI now has one explicit V8 display contract. The homepage shows all five likely
job pathways, a categorical exposure-by-demand matrix, and an employment-sized occupation map. Detail
charts distinguish source percentiles, occupation ranks, synthetic role estimates, pathways, and demand
context instead of blending them into a pseudo-causal waterfall. Ranking and report terminology now uses
exposure language, while archived formulas remain accessible behind an archive warning.

Dense data views use mobile cards or fit their containers. Playwright checked 12 representative routes at
390, 768, 1280, and 1440 pixels: document and body widths matched the viewport in all 48 combinations,
with no browser console errors. `bun test` passed 45 tests, `bun run verify` passed all gates including 222
data validations, and the production build completed. The build still reports the repository's existing
large-chunk advisory; this is a performance follow-up rather than a correctness or layout failure.

## Context and Orientation

`src/lib/data/occupations.json` contains 562 current Singapore occupation records. Each record retains historical V7 fields for reproducibility, but `v8.ai_exposure_rank`, `v8.substitution_pressure`, `v8.augmentation_potential`, `v8.likely_pathway`, `v8.market_context`, and `v8.evidence_confidence` define the current public contract. `src/lib/data/index.ts` exposes compatibility aliases such as `net_risk`; those aliases must not cause current UI to describe a percentile rank as risk or probability.

The homepage is `src/routes/+page.svelte`, its surface mapping is `src/lib/data/home-surface.ts`, and its public chart components live in `src/lib/components/viz/`. Ranking pages share `src/lib/components/ui/RankingTable.svelte`. One-off responsive data views appear in the wage report, methodology appendix, comparison page, data dictionary, and roles catalogue.

## Plan of Work

First, introduce explicit V8 display helpers and small chart-ready types so labels, pathway order, demand order, and colours have one owner. Rebuild the homepage to show filters only in the narrow sidebar, a consistent employment-sized occupation map, a categorical exposure/demand matrix, and a five-pathway horizontal bar comparison.

Second, replace `DriverWaterfall.svelte` with an evidence profile that shows the individual source percentiles and final rank while keeping labour-market context visually separate. Correct `TheoryPracticeDumbbell.svelte` and its table to use persisted AIOE and Anthropic source percentiles rather than raw AIOE values. Simplify the role radar into directly labelled horizontal profile bars if the existing radar cannot expose exact values cleanly.

Third, update `RankingTable.svelte` to render mobile cards and a reduced desktop table with explicit column visibility. Remove duplicate Exposure headers and replace legacy impact text with V8 likely pathways. Apply the same responsive principle locally to wage, methodology, comparison, and roles views. Preserve the existing mobile definition-list solution on the data page.

Fourth, search active routes for stale V7 words and claims. Current public pages may discuss historical V7 artifacts only when clearly marked as archived. Current pages must say rank, exposure, pathway, evidence, or current demand as appropriate. Quarterly comparisons must not imply comparability across a V7-to-V8 methodology break.

Finally, add automated contract checks and browser measurements. Run the complete repository verification suite and inspect each affected route at 390px, 768px, 1280px, and 1440px.

## Concrete Steps

From `/Users/kirso/Developer/ai-work-index`:

1. Edit V8 display helpers, chart components, route content, and responsive data views with `apply_patch`.
2. Run `bun run format` after coherent edit groups.
3. Run `bun run check`, `bun test`, and `bun run validate` while iterating.
4. Run `bun run verify` and `bun run build` before browser QA.
5. Use the local Vite server and Playwright workflow to measure overflow and inspect screenshots at the required widths.

Expected success is zero type, test, validation, release, or build errors and no active public table whose visible mobile representation requires horizontal scrolling.

## Validation and Acceptance

- Homepage pathway counts show all five V8 pathways and total 562.
- No active V8 chart formats AI Exposure Rank as a probability percentage.
- Theory vs Practice values stay between 0 and 100 and match persisted source percentiles.
- Detail pages never describe a percentile blend as a percentage of tasks and never imply current demand changes AI Exposure Rank.
- Active current pages do not use `Impact Type`, `Mixed pathway`, `AI risk`, or `structural risk` as current V8 labels.
- Ranking, wage, methodology, comparison, data, and roles pages are readable at 390px without forced table scrolling.
- Browser document width equals viewport width at 390, 768, 1280, and 1440px on affected routes.
- `bun run verify` and `bun run build` pass.

## Idempotence and Recovery

Formatting, checks, tests, validation, builds, and browser measurements are safe to rerun. Generated release files should only be regenerated through existing package scripts. The pre-existing untracked `output/ai-work-index-review/` directory belongs to the user and must remain untouched. If a shared component change creates regressions, revert only that patch with a new targeted patch; do not reset the dirty worktree.

## Artifacts and Notes

The initial browser audit measured ranking tables at 1,217-1,252px, wage tables at 760-820px, methodology tables at 640-760px, and the two-entity comparison table at 608px on a 390px viewport. The data dictionary already has a correct mobile definition-list fallback.

## Interfaces and Dependencies

The implementation uses Svelte 5 runes, SvelteKit 2, Tailwind CSS 4, the existing design-system helpers, and existing D3 packages. No new dependency is required. Current public data comes from the V8 fields in `Occupation.v8`; compatibility aliases remain only for internal and archived code.
