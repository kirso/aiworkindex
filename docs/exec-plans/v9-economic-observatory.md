# Build the V9 Singapore AI labour observatory

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global
`exec-plan` skill. It extends, but does not replace, the scientific and product contracts in
`docs/exec-plans/ssoc-2024-evidence-first-v9.md` and
`docs/exec-plans/v9-consumer-product-rebuild.md`.

## Purpose / Big Picture

V9 currently answers one question well: how an occupation's mapped tasks compare with other
Singapore occupations on the ILO 2025 generative-AI exposure measure. It does not explain whether
employment will expand, contract or reorganise. After this work, readers can inspect the economic
mechanisms that sit between technical capability and labour outcomes, see the Singapore evidence
available at national, industry, broad occupation-group and detailed-occupation grain, and see
which conclusions remain unknown.

The new observatory will never turn missing demand elasticity, adoption, new-task, job-quality or
causal evidence into a score. The V9 AI Work Pressure Rank remains unchanged. Economic evidence is
a separate, versioned layer with explicit source grain and `headline_effect: none`.

## Progress

- [x] (2026-08-20) Audited the current V9 scientific contract, research register, market artifact,
  raw Singapore labour sources and retained archive builders.
- [x] (2026-08-20) Confirmed that the repository contains usable official broad-grain employment,
  age, worker-composition, industry-footprint and vacancy series, but no detailed SSOC 2024 causal
  AI-outcome panel.
- [x] (2026-08-20) Defined and tested the economic evidence contract and six-mechanism
  vocabulary.
- [x] (2026-08-20) Built the deterministic Singapore labour-observatory artifact from current
  official sources.
- [x] (2026-08-20) Added an occupation-level evidence-coverage adapter without inferring detailed
  outcomes.
- [x] (2026-08-20) Added the labour-observatory report and occupation-page economic evidence panel.
- [x] (2026-08-20) Updated methodology, research, data, reports, discovery and release governance.
- [x] (2026-08-20) Regenerated all V9 artifacts and completed scientific, copy, build and
  responsive-browser validation.

## Surprises & Discoveries

- Observation: V9 already stores current MOM adoption, vacancy, entry-level and broad labour
  context, but it does not organise those observations around an economic causal model.
  Evidence: `data/v9-market-context.json` separates market evidence from the headline and attaches
  broad context to nine major groups.
- Observation: retired V7 builders contain valid public source ingestion alongside invalid outcome
  interpretations.
  Evidence: `data/raw/employment_by_occupation.csv`, `data/raw/industry_x_occupation.csv`,
  `data/raw/job_vacancies_by_industry_and_occupation_quarterly.csv` and
  `data/worker-profile.json` retain official broad-grain observations, while old derived artifacts
  added `net_risk`, attrition buffers and synthetic demand conclusions.
- Observation: the useful source grain is uneven. Employment and age are available for eight broad
  occupation groups, occupation-by-industry employment is broad, current vacancies use three broad
  clusters, and detailed current wages cover 523 SSOC records.
  Evidence: SSOC major group 6 has no separate row in the retained broad occupation source; it must
  remain unavailable rather than inherit another group.
- Observation: the flagship homepage named-demand plot exceeded a 320-pixel viewport even though
  the new report and occupation panels fit.
  Evidence: the first browser audit found a fixed minimum grid wider than the chart frame. The
  mobile contract now uses flexible occupation and pressure columns, a shorter header and a
  44-pixel rank column; the repeated audit found no overflow at any tested width.
- Observation: reproducible release metadata was already compatible with the observatory design.
  Evidence: two complete `release:generate` runs produced identical SHA-256 values for the
  observatory, research register, site status, manifest, LLM guides and sitemap.

## Decision Log

- Decision: Model economic mechanisms as evidence states, not numerical modifiers.
  Rationale: displacement, scale effects, new tasks, complementarity, diffusion and distribution
  require different data and can point in opposing directions.
  Date/Author: 2026-08-20 / Codex
- Decision: Use `occupation × industry × cohort × period` as the target observation grain while
  publishing each source only at the grain it actually supports.
  Rationale: occupation-only averages conceal firm, sector and career-stage heterogeneity.
  Date/Author: 2026-08-20 / Codex
- Decision: Reuse official raw observations but not V7 outcome classifications or formulas.
  Rationale: provenance and measured values remain useful; inferred job-loss, risk, attrition and
  pathway conclusions do not meet V9's claim boundary.
  Date/Author: 2026-08-20 / Codex
- Decision: Do not activate an occupation scenario such as contraction or expansion unless direct
  evidence covers adoption, market response and labour outcomes at compatible grain and period.
  Rationale: task pressure plus a broad vacancy trend cannot identify a Jevons effect or causal job
  change.
  Date/Author: 2026-08-20 / Codex

## Outcomes & Retrospective

The implementation is complete. V9 now has a separate Singapore economic-observatory contract with
six causal mechanisms, nine major-group records, eight measured broad occupation-group profiles and
1,001 detailed evidence-availability records. It publishes 987 pressure ranks, 523 direct wage rows,
37 named-demand matches and 990 references to broad employment context while publishing zero
detailed adoption series, demand elasticities, new-task series, causal AI outcomes or economic
scenario classifications.

Every official occupation page now explains what can change the result for workers, distinguishes
detailed evidence from broad context and links to the full labour observatory. The report, method,
technical appendix, data page, reports index, V9 release note, current job-market report, sitemap,
site status, LLM guides and 15-artifact release manifest now share the same contract. Five canonical
labour-economics and workplace sources were added to the research register without changing the
headline owner.

Validation completed on 20 August 2026: strict public-copy lint reported zero warnings; Svelte
checking reported zero errors and warnings; the full suite passed 127 tests; `release:check` passed
for 1,001 occupations, 77 modern-title guides and 1,116 sitemap URLs; the static build completed; and
the browser audit passed 15 route/viewport cases with no horizontal overflow, console errors, page
errors or broken images. The tested widths covered 320, 375, 768, 1,024 and 1,440 pixels. The browser
cases included the homepage, explorer, observatory, a ranked occupation, an unranked occupation, the
source-missing major group and a familiar-title guide.

## Context and Orientation

`data/occupations-v9.json` is the canonical current occupation release. Its headline owner is the
ILO 2025 `mean_score_2025` measure. `data/v9-market-context.json` contains separately sourced
Singapore demand and broad labour context. `src/lib/data/v9-contract.ts` defines the occupation
contract, while `scripts/build-v9-release.ts` and `scripts/build-v9-market.ts` generate the current
scientific and market artifacts.

The new owner will be `scripts/build-v9-economic-observatory.ts`. It will generate identical copies
at `data/v9-economic-observatory.json`, `src/lib/data/v9-economic-observatory.json` and
`static/data/v9-economic-observatory.json`. `src/lib/data/v9-economic-observatory.ts` will expose a
typed read adapter. Generated files must not be edited manually.

The artifact will distinguish four evidence grains: national, industry, broad occupation group and
detailed SSOC occupation. A value measured at one grain cannot be copied to a finer grain. A broad
group observation may appear on an occupation page only inside a visibly labelled context block.

The causal model has six mechanisms: displacement, productivity and scale, new tasks,
complementarity and human control, adoption and organisational diffusion, and distribution and
adjustment. Labour outcomes are observed separately through employment, vacancies, pay, hours,
retrenchment, entry-level access and job quality.

## Plan of Work

First, add the economic evidence types and deterministic builder. Freeze source identity, file
checksum, geography, observation period, unit, grain, evidence kind and limitations for every
input. Parse broad employment and age observations from the official Singapore source, reuse only
the measured worker-profile and industry-footprint fields, and bring current broad labour and MOM
adoption context across from the V9 market artifact. Calculate only transparent changes such as
year-on-year percent change, multi-year percent change and shares with visible denominators.

Second, emit broad occupation-group profiles for SSOC major groups 1, 2, 3, 4, 5, 7, 8 and 9.
Major group 6 remains unavailable. Emit a compact coverage record for all 1,001 detailed
occupations that identifies direct pay, named demand and headline availability while pointing to
separate broad-group context. Do not copy broad employment, age or industry values into the
detailed occupation record.

Third, add a public `/reports/labour-observatory` route. It will explain the causal chain, show
national adoption and labour facts, provide broad-group employment and worker-context cards, state
the evidence available for each mechanism, explain rebound demand without asserting it, and list
the exact data needed before occupation-level contraction, expansion or transition conclusions can
be published.

Fourth, add a compact economic-evidence section to every official occupation page. It will show the
reader what is known for that occupation, what is only broad context, what remains unknown and what
evidence would change the interpretation. It will not classify the occupation into an economic
scenario.

Fifth, add the canonical labour-economics sources missing from the research register, update
methodology and data documentation, register the observatory in reports, sitemap, LLM discovery,
site status and the release manifest, and enforce the new contract in the release checker.

Finally, regenerate the release and verify that occupation scores and ranks are unchanged. Run data
contract tests, builder determinism, public-copy lint, Svelte checks, the full test suite, static
build and browser checks across representative scored and unranked occupations plus the report.

## Concrete Steps

Run from `/Users/kirso/Developer/ai-work-index`:

    bun run build:economics:v9
    bun test tests/v9-economic-observatory.test.ts
    bun run release:generate
    bun run release:check
    bun run verify
    bun run build

Run the copy check after public prose changes:

    python3 /Users/kirso/.codex/skills/write-human-editorial-copy/scripts/lint_copy.py --strict \
      src/routes/reports/labour-observatory src/routes/occupation src/routes/methodology \
      src/routes/data docs/exec-plans/v9-economic-observatory.md

## Validation and Acceptance

- All 1,001 SSOC 2024 occupations remain present; 987 remain scored and 14 remain unranked.
- Every published pressure percentile is unchanged from the pre-observatory V9 artifact.
- The observatory contains eight measured broad occupation-group profiles and marks major group 6
  unavailable.
- Every value identifies geography, period, unit, grain and source.
- Broad observations are never exported as detailed occupation measurements.
- No artifact or page publishes an employment-effect, job-loss, Jevons, transition or causal AI
  classification for a detailed occupation.
- Missing price/output elasticity, detailed adoption, new-task and job-quality evidence remains
  machine-readable and visible to readers.
- The report and occupation panel are usable without a horizontally scrolling table at 320, 375,
  768, 1,024 and 1,440 pixels.
- `release:generate` is deterministic and `bun run verify` plus `bun run build` pass.

## Idempotence and Recovery

The builder and release pipeline are deterministic and safe to rerun. Generated JSON copies must be
repaired by rerunning their builder. The worktree contains unrelated user and prior-agent edits;
never reset, clean or restore the tree wholesale. Leave `output/ai-work-index-review/` untouched and
untracked.

If a public source lacks a stable artifact, compatible taxonomy, redistribution permission or
required grain, keep the corresponding evidence state unavailable and record the publication gate.
Do not substitute an international or broad-group proxy merely to complete the interface.

## Artifacts and Notes

Expected new artifacts are the living plan, source-backed observatory builder and JSON contract,
typed adapter, occupation evidence component, labour-observatory report and focused tests. Current
V9 occupation and public export artifacts remain scientifically unchanged except for links to the
separate observatory.

## Interfaces and Dependencies

The implementation uses Bun, TypeScript, SvelteKit 2, Svelte 5, the existing Lyra design system and
checked-in official Singapore raw data. It adds no paid source, statistical runtime or client-side
chart library. It depends on current SSOC 2024 occupations, V9 market context, MOM/SingStat broad
labour sources, the research registry and the release-generation pipeline.
