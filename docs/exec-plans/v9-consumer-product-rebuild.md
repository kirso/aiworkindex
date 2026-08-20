# Rebuild AI Work Index V9 as a useful Singapore career product

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global
`exec-plan` skill. It continues the completed scientific migration recorded in
`docs/exec-plans/ssoc-2024-evidence-first-v9.md` without changing the V9 headline model.

## Purpose / Big Picture

V9 made the active Singapore dataset scientifically defensible, but its migration also removed
the visual exploration, familiar-title journeys, comparison controls, personal guidance, and
semantic color that made the site useful to ordinary people. After this work, a Singapore worker
or jobseeker can find either an official occupation or a familiar modern title, see where its AI
task pressure sits, explore which signals are known, compare pay and named demand, reflect on the
work they actually do, save jobs, and leave with practical next steps. Researchers can still audit
the unchanged formula, mappings, sources, and missing evidence.

The product will never collapse technical task overlap, pay, demand, adoption, human contribution,
or personal answers into one job-loss probability. The sole headline remains the V9 midrank
percentile derived from ILO 2025 `mean_score_2025` through official SSOC 2024 to ISCO-08 mappings.

## Progress

- [x] (2026-08-19) Completed a read-only audit of the current repository, rendered desktop and
  mobile routes, design system, visual components, copy, scientific model, modern-title layer,
  current Singapore market evidence, and primary research through 19 August 2026.
- [x] (2026-08-19) Confirmed the clean baseline: `bun run verify` passes 89 tests and the V9 release
  check reports 1,001 occupations, 21 non-official role pages, and 1,059 sitemap URLs.
- [x] (2026-08-19) Chose the recovery boundary: preserve the V9 score; rebuild the product forms;
  keep task text, OECD/O*NET work profiles, external observed-use sidecars, and historical change
  behind explicit evidence, licensing, and comparability gates.
- [x] (2026-08-20) Created the shared evidence vocabulary, warm editorial design tokens, chart
  contract, compact browser data contract, URL-backed filters, and customer-action primitives.
- [x] (2026-08-20) Restored the homepage flagship equal-area occupation map, rebuilt the
  pressure/pay scatter for desktop and mobile, and made Explore a connected map/scatter/list
  browser.
- [x] (2026-08-20) Restored all 88 modern-title search journeys without publishing competing
  official scores; repaired role discovery, role presentation, canonical strategy, and
  answer-engine surfaces.
- [x] (2026-08-20) Rebuilt official occupation and modern-role pages around answer, work pattern,
  human contribution, Singapore context, actions, Save/Compare/Share, and collapsed technical
  detail.
- [x] (2026-08-19) Turned the calculator into a local personal task-and-action explorer while keeping user answers
  outside the official occupation record and score.
- [x] (2026-08-19) Rebuilt Compare as a responsive question-by-job matrix, renamed and expanded Saved jobs,
  and reorganised navigation around Find, Explore, Modern roles, Compare and My work.
- [x] (2026-08-20) Rebuilt methodology, research, data, rankings, and current reports around the
  same evidence and visual contracts; unsupported ranking products remain visibly withheld.
- [x] (2026-08-20) Corrected the research and market registry gaps identified in the audit and
  regenerated all V9 public discovery artifacts deterministically.
- [x] (2026-08-20) Ran copy, data, unit, release, build, accessibility, responsive-layout,
  interaction, and payload checks and recorded the exact outcomes below.

## Surprises & Discoveries

- Observation: The active current site renders only one Singapore chart; thirteen legacy visual
  components remain in the repository but are route-unreachable.
  Evidence: current routes import `PressureWageScatter.svelte`; the old visualization directory is
  not an active route dependency.
- Observation: The useful visual forms and the unsafe V8 data contracts were removed together.
  Evidence: commit `000ec7c` removed the homepage treemap/filter flow and the occupation/role
  presentation modules, while the old `Treemap.svelte` still accepts `net_risk` and inferred
  employment.
- Observation: The modern-title data still contains 88 queries, but 67 official resolutions are
  redirected away from role pages.
  Evidence: `data/synthetic-roles-v9.json` records 11 exact matches, 56 reviewed aliases, 18
  composites, and 3 withheld queries; `src/routes/role/[slug]/+page.server.ts` redirects official
  resolutions.
- Observation: Core active pages now avoid most horizontal overflow, but their mobile information
  order creates extremely long pages before a useful action appears.
  Evidence: rendered Roles, Research, and group pages measured roughly 16,700, 26,700, and 18,800
  CSS pixels high on a 375-pixel viewport.
- Observation: The current design tokens deliberately enforce pure white surfaces, zero radius,
  zero shadow, 14-pixel default body text, and near-universal heavy headings.
  Evidence: `src/app.css` and `src/lib/design-system.ts` conflict with the publication goal in
  `docs/design/REDESIGN_SPEC.md`.
- Observation: The checked-in ILO workbook has 3,265 final task rows across 427 ISCO codes, but the
  public detailed SSOC occupation task arrays are empty because the source task grain is broader.
  Evidence: the V9 builder correctly avoids copying unit-group tasks down as exact five-digit SSOC
  duties. Public task text remains gated on artifact-specific rights and provenance review.
- Observation: Rebuilding the flagship with the full browser corpus in every prerendered route made
  the homepage and Explore HTML roughly 855 KB and 827 KB before compression.
  Evidence: moving the canonical browser corpus to the existing fetchable V9 search artifact cut
  final HTML to 65,424 bytes for home and 25,450 bytes for Explore; their gzip sizes are 10,714 and
  6,528 bytes. The shared search artifact is 122,614 bytes gzip and loads only where the explorer is
  used.
- Observation: Scientific removal and product removal were separable after all. The legacy
  treemap, radar, waterfall and demand visuals could not safely be reconnected to V9 unchanged,
  while their useful interaction patterns could be rebuilt against explicit V9 contracts.
  Evidence: the live product now has an equal-area occupation map, direct-pay scatter, ordinal work
  profile and evidence chain without reviving employment sizing, synthetic protection scores or
  weak-demand inference.

## Decision Log

- Decision: Use `AI task pressure` as the primary consumer label while retaining
  `AI Work Pressure Rank` in formal methodology and machine contracts.
  Rationale: The shorter label explains the construct without claiming a probability of job loss.
  Date/Author: 2026-08-19 / Codex
- Decision: Make the flagship an equal-area SSOC occupation map where every leaf has value one.
  Rationale: It restores overview and discovery without implying official detailed employment.
  Date/Author: 2026-08-19 / Codex
- Decision: Use a sequential, non-moralizing pressure palette and a separate categorical role-family
  palette. Missing and unranked evidence uses words plus a neutral hatch.
  Rationale: Color should restore hierarchy without inventing safe/risky bands or conflating family,
  pressure, and evidence status.
  Date/Author: 2026-08-19 / Codex
- Decision: Restore modern-title journeys, not duplicate scores. Exact-title duplicates remain
  canonical occupations; reviewed aliases may render useful title-specific guides that quote the
  official occupation score verbatim; composites stay disclosed estimates; withheld queries become
  disambiguation pages.
  Rationale: This preserves customer recognition and search reach without conflicting numbers.
  Date/Author: 2026-08-19 / Codex
- Decision: Restore a six-axis `Human work profile` only as ordinal reviewed guidance or a user
  overlay. It never changes the score and has no summed area or protection index.
  Rationale: The visual form is useful; the retired 0-100 workflow inputs were not measured skills.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep personal task answers local by default and label outputs as published evidence,
  calculated, reviewed guidance, or from the visitor.
  Rationale: Personalization should add utility without contaminating the official record or
  collecting sensitive work details unnecessarily.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep Svelte 5, Tailwind 4, and the existing modular D3 packages.
  Rationale: The current stack is sufficient; the missing capability is a shared chart and evidence
  contract, not a larger runtime.
  Date/Author: 2026-08-19 / Codex

## Outcomes & Retrospective

The V9 rebuild is implemented end to end without changing the headline formula. The current release
contains 1,001 official SSOC 2024 occupations: 987 receive an ILO-based pressure rank, 14 remain
unranked, and 523 have a direct MOM wage row. The role layer preserves all 88 familiar-title queries:
11 exact titles resolve to official occupations, 56 reviewed aliases have useful self-canonical
guides that reuse the official score verbatim, 18 are disclosed composites, and 3 are mapping-
withheld. The sitemap contains 1,115 URLs, including all 1,001 occupations and 77 role guides.

The consumer product now restores the flagship occupation map, live filters, pressure/pay scatter,
semantic color, role-family presentation, an ordinal Human work profile, Save/Share/Compare, Saved
jobs, and a local personal work check. Official pages lead with a plain-language interpretation,
Singapore pay and named-demand context, followed by reviewed actions; raw ILO values, mapping codes
and source mechanics sit in progressive disclosure. Compare becomes cards rather than a horizontally
scrolling table on narrow screens. Personal answers stay on the device and never alter the official
record.

The evidence pass leaves the V9 score owner unchanged and expands the deduplicated registry to 51
sources: one headline input, seven validation sources and 43 supporting sources. It adds the 2026
OECD capability and skills work, Singapore PIAAC, two 2026 NBER papers and MOM's 5 August market and
adoption update; corrects the Stanford linked finding from 19% to 16%; and removes a duplicate
Eloundou record. Current market evidence contains 49 reviewed source attachments across 37
occupations, with one ambiguous mapping withheld. V8's field map is now explicitly archived.

Final verification on 20 August 2026:

- `bun run verify`: 106 tests passed, zero failed; Svelte diagnostics, ESLint, Prettier and the V9
  release contract passed.
- `bun run release:check`: 1,001 occupations, 77 role guides and 1,115 sitemap URLs passed the
  current-release boundary.
- `bun run build`: the static production site completed successfully.
- Strict editorial lint scanned 25 active product files with zero warnings.
- Browser QA covered 17 active routes at 375 pixels with no horizontal document overflow, plus the
  flagship scatter at 320 pixels and desktop map, role, occupation, calculator, comparison and
  saved-job journeys. The final build has one `main` landmark, mobile scatter remains a real chart,
  and all six radar labels stay inside the SVG.
- Final prerendered HTML is 65,424 bytes for home and 25,450 bytes for Explore, down from roughly
  855 KB and 827 KB during the initial rebuild.

What remains is deliberately evidence-gated rather than silently approximated: redistribution and
grain review for ILO task text; verified crosswalks for OECD, AIOE, Eloundou, Anthropic observed-use
and complementarity layers; detailed occupation-level adoption and vacancy data; defensible
transition evidence; and a second comparable V9 snapshot before publishing change-over-time
rankings. None of these layers may alter the current headline unless a future version explicitly
changes and validates that scientific contract.

## Context and Orientation

`scripts/build-v9-release.ts`, `src/lib/data/v9-contract.ts`, and `src/lib/data/v9.ts` own the
current scientific occupation contract. Do not change the headline formula or feed new UI context
into it. `src/lib/data/v9-display.ts` and `src/lib/data/v9-browser.ts` translate that contract for
the application. `scripts/build-v9-search-index.ts`, `scripts/build-v9-ui-index.ts`,
`scripts/build-synthetic-roles-v9.ts`, and `scripts/v9-role-mappings.ts` own discovery and modern
title resolution. Generated copies under `data/`, `src/lib/data/`, and `static/data/` must be rebuilt,
not edited by hand.

The active product routes are under `src/routes`. The flagship entry is `src/routes/+page.svelte`;
official occupation details are under `src/routes/occupation/[ssoc]`; modern titles are under
`src/routes/roles` and `src/routes/role/[slug]`; browsing is under `src/routes/explore`; the current
calculator is `src/routes/will-ai-take-my-job`; comparison and saved jobs are `/compare` and
`/watchlist`. Shared visual and interface components live under `src/lib/components`.

`src/app.css` and `src/lib/design-system.ts` are the semantic design owners. The current risk-band
helpers are archive-era presentation vocabulary and must not be reused as new V9 probability bands.
New V9 presentation helpers should be named for pressure, role family, evidence status, and missing
state.

The untracked `output/ai-work-index-review/` directory belongs to the user. It must remain untouched
and must not be staged accidentally.

## First-Principles Product Model

The product should answer a person's question through four visible layers rather than one blended
number.

| Layer | Human question | Current owner | Product treatment | Headline effect |
| --- | --- | --- | --- | --- |
| AI task pressure | How much do this occupation's mapped tasks overlap with current generative AI? | ILO 2025 through official SSOC 2024 to ISCO-08 correspondence | One relative 0-100 position, continuous color, official category and raw values in details | Sole headline owner |
| Human contribution | Where do trust, judgment, accountability, context or physical presence matter in this work? | Reviewed guidance and visitor answers until a publishable source mapping exists | Ordinal work profile, examples and action prompts with an explicit basis label | None |
| Singapore market reality | What are employers, pay and hiring signals showing now? | MOM and other named official public sources at their published grain | Separate pay, named-demand, adoption and broad labour-context modules with dates | None |
| Personal work variation | Which activities, consequences and review duties describe my version of the job? | Visitor answers stored locally | Personal task check and action plan; no server collection or score mutation | None |

Observed AI use, employer adoption, capability progress, entry-level effects, regulation, deployment
cost, bargaining power and industry differences remain important context. They become separate
indicators only when their source, date and occupation grain support the claim. Missing occupation
coverage is never backfilled from a broad group merely to complete a screen.

## Restore, Rebuild, Withhold and Retire

| Prior or proposed feature | Decision | V9 contract |
| --- | --- | --- |
| Colored occupation treemap | Rebuild now | Equal-area leaves; one leaf equals one detailed SSOC occupation record; color encodes continuous pressure position; 14 unranked records use a neutral hatch; group area means record count only |
| Homepage filters | Rebuild now | One URL-backed filter state shared by map, list and pressure/pay chart; preserve null values and expose result count |
| Pressure versus pay scatter | Rebuild now | Plot only 523 direct MOM wage rows with a published pressure position; identify named-demand matches; keep an accessible table alternative |
| Demand matrix | Replace | Show only occupations explicitly named in reviewed official sources; absence means uncovered, not weak demand |
| Pathway bars and transition graph | Withhold | Resume only after a validated, current transition construct and mapping exists |
| Workflow radar | Replace | Six-axis ordinal Human work profile from reviewed guidance or the visitor's answers; no summed score and no claim of measured skills; use bars on narrow screens |
| Skills pills | Replace | Practical guidance with review date and basis label; migrate to official skills only after source terms and grain are publishable |
| Driver waterfall | Replace | A short evidence chain: official title, official mapping, ILO task evidence, Singapore relative position |
| Role-family color | Restore | Categorical family identity only; it never encodes pressure or estimate quality |
| Synthetic-role pages | Restore all journeys | Exact titles resolve canonically; 56 reviewed aliases retain title-specific guides with the exact official score; 18 composites disclose components and sensitivity; 3 withheld mappings help the user disambiguate |
| Occupation comparison | Rebuild now | Jobs as columns and human questions as rows; separate pressure, pay, named demand and mapping; no overall winner and no horizontal document overflow |
| Personal task explorer | Build now | Visitor-selected work activities, consequence and review responsibility produce locally stored guidance only |
| Quarterly movers and historical pressure change | Withhold | Publish after a second methodologically comparable V9 snapshot |
| Job-loss, jobs-affected and wage-pool outputs | Retire from current product | Preserve dated archive records only; never regenerate as current V9 findings |
| External AIOE, Eloundou, Anthropic and complementarity sidecars | Withhold at occupation grain | Activate only after a verified reproducible crosswalk and construct-specific validation; no headline effect |

## Page Architecture and Wireframes

The homepage starts with a one-sentence answer, a job-title search and four small facts about the
current Singapore release. The equal-area occupation map follows in the first exploration block,
with a compact filter bar, view switcher and selected-job summary. Pressure/pay is a secondary view,
not a separate dead-end chart. Below it, show modern-title entry points, current Singapore market
signals and three action routes: inspect my work, compare jobs and save jobs.

An occupation page starts with title, SSOC code, relative pressure position, one plain-language
interpretation and Save/Compare/Share. The next screenful answers pay and named demand, then presents
what may change, where human contribution matters and six practical next moves. Mapping range, raw
ILO values, task dispersion and source records sit inside `How this was calculated` below the useful
reading path.

A modern-role page keeps the familiar title and family identity. A reviewed alias says which
official occupation it resolves to and reuses that official score verbatim. A composite leads with
its status, components and assumption-sensitivity range. A withheld title offers nearby official
choices and the question needed to choose between them. Every version exposes Save/Compare/Share and
the same action framework.

The personal-work page first finds a title, then shows the published occupation result. It asks
which activities matter, how often AI is already used, how costly an error would be and who owns the
final result. The output is grouped into `Try`, `Verify carefully`, `Keep human-led`, `Strengthen`,
`Ask at work` and `Monitor`, with every item labelled as derived from the visitor or reviewed
guidance.

Compare has a fixed question column and up to four job columns on wide screens. On smaller screens,
each job becomes a self-contained card with the same row order, so the document never needs a wide
scrolling table. It opens with the pressure-position and pay gaps, then shows pressure, pay, named
demand, mapping and broad context. Missing source coverage stays explicit.

Methodology opens with five short questions: what is ranked, how Singapore titles are mapped, what
the 0-100 position means, what stays separate and how missing evidence is handled. Reproduction,
formulas, checksums, crosswalk limitations and source registries move to the technical appendix.

## Evidence and Research Roadmap

The immediate evidence pass corrects the research registry, incorporates MOM's latest August 2026
labour-market and adoption updates at their published grain, adds OECD's 2026 AI Capability Gap work
as a supporting future profile construct, corrects the Stanford entry-level finding to the verified
primary result, and removes duplicate or misidentified research records. These changes do not alter
the headline score.

The next publishable evidence target is task-level usefulness. Before showing source task text, the
repository must record the exact ILO artifact, checksum, task grain, redistribution right and the
rule that prevents ISCO task examples from being described as exact detailed SSOC duties. If the
text cannot be redistributed, the product should invite visitors to describe their own tasks and
link to the source rather than paraphrasing thousands of records.

OECD capability domains, O*NET work activities, Singapore Skills Framework content and SkillsFuture
course links remain prospective pipelines. Each requires a frozen free source artifact, source
terms, a verified current crosswalk, row-level mapping quality, coverage statistics and an
invariance test proving that the layer cannot alter the V9 headline. SkillsFuture content must not
be scraped or republished under terms that prohibit it.

A later market-observation track should add comparable official quarterly snapshots, occupation
vacancy measures where MOM publishes the necessary grain, adoption by industry and defensible
entry-level indicators. The product should publish historical change only when two snapshots share
the same construct, taxonomy and mapping policy.

## Measurement Plan

Success means people reach a correct interpretation and a useful next action, not merely that they
view more pages. The primary journey measures are the share of successful searches that open a job,
the share of job views that lead to Compare, Save or the personal task check, task-check completion,
comparison creation, and return visits to a saved job after a release update. A short optional
comprehension check can ask whether the number is a relative task-pressure position or a job-loss
probability.

Event instrumentation, if added, records route, entity kind and coarse interaction only:
`job_search_selected`, `explorer_filter_changed`, `chart_view_changed`, `job_saved`,
`comparison_created`, `personal_check_started`, `personal_check_completed`,
`technical_details_opened` and `source_opened`. Do not record free-text searches, selected work
activities or consequence answers without a separate privacy decision.

Guardrails are zero horizontal document overflow at the acceptance widths, keyboard access to every
chart selection through one roving control rather than 1,001 tab stops, 44-pixel primary controls,
no regression in published ranks, no current archive fields in active routes, a bounded search
payload, and a production build without route or accessibility diagnostics. Browser performance is
measured separately on home, Explore and Compare because their interaction payloads differ.

## Open Product Decisions

- Decide after usability testing whether the default homepage view is the equal-area map or a
  compact ranked list on phones below 375 pixels; both must remain available.
- Decide whether a visitor may export their local saved jobs and personal work plan. Current scope
  keeps both device-local and deliberately simple.
- Decide whether reviewed alias guides need unique editorial examples beyond title and family
  context. Any added text needs a named reviewer and date to avoid thin or templated SEO pages.
- Decide whether to seek permission to redistribute ILO task text. Until permission and provenance
  are recorded, exact source task statements remain unpublished.
- Decide the cadence for a second comparable V9 snapshot. `Quarterly movers` stays unavailable until
  that cadence produces genuinely comparable data.

## Plan of Work

First, repair the foundation. Update the design tokens to a warm editorial surface system, define a
continuous V9 pressure scale, define role-family and evidence-status tokens, increase body and chart
typography, and add consistent focus, active, radius, depth, and touch-target behavior. Add small
presentation modules for evidence labels, pressure formatting, local saved-job state, personal task
answers, and URL-backed browse state. Correct the current research and market claims that can be
fixed from already-reviewed primary sources without changing the score.

Second, restore exploration. Create a new equal-area occupation map whose data contract contains
only stable identity, official group, V9 pressure, direct wage availability, named-demand count, and
mapping status. Add a chart frame, legend, meaningful mobile view, selected-occupation summary, and
accessible list/table alternative. Connect the same filters to the map, list, and pressure/pay
scatter. Preserve filters and selection in the URL. Do not put all chart marks into sequential tab
order.

Third, restore modern-title reach. Expand home and command search to all 88 queries. Exact official
matches should continue to resolve cleanly; reviewed aliases should keep title context and the one
official score; composites should retain disclosed components and sensitivity; withheld titles
should help the visitor choose a closer occupation. Update role directory hierarchy, role-family
color, metadata, canonicals, sitemap, structured data, and LLM discovery text together.

Fourth, rebuild detail journeys. Reorder occupation and role pages so the first sections answer the
reader, show pay and named demand, explain what may change, describe where people remain central,
and offer actions. Restore Save, Compare, and Share. Move mapping ranges, ILO raw values, null
external sidecars, and repeated limitations into an expandable `How this was calculated` region or
the technical appendix. Use a six-axis ordinal human-work profile only when the profile basis is
explicit; otherwise invite the visitor to describe their own work.

Fifth, rebuild the calculator and comparison flow. The calculator should match a title, ask about
the visitor's task mix, frequency, current AI use, review responsibility, people/context, and
consequence, then return an action plan grouped into `Try`, `Verify carefully`, `Keep human-led`,
`Strengthen`, `Ask your employer`, and `Monitor`. These answers remain local and never alter the
official score. Compare should render jobs as columns and human questions as rows, with explicit
missing states and no overall winner.

Sixth, extend the same customer-first structure to Saved jobs, rankings, group pages, reports,
research, methodology, data, navigation, and archives. Rename Watchlist to Saved jobs until a second
comparable V9 snapshot exists. Keep technical reproduction in the appendix. Keep current findings
and action links before source registries. Ensure archive pages are frozen, noindexed, and do not
inject live V9 status into old claims.

Finally, regenerate release artifacts and validate in layers. Run focused component and route tests
while editing, then copy lint, Svelte checks, the full test suite, release generation/checks, static
build, responsive browser flows, keyboard/focus checks, and data/performance assertions. Update this
plan with exact results and any evidence-gated omissions.

## Concrete Steps

Run all commands from `/Users/kirso/Developer/ai-work-index`.

Establish and repeatedly check the baseline:

    git status --short
    bun run check
    bun test

Regenerate deterministic current artifacts after source-builder or discovery changes:

    bun run release:generate
    bun run release:check

Run the public-copy advisory linter from its skill directory against changed Svelte and Markdown
files:

    cd /Users/kirso/.codex/skills/write-human-editorial-copy
    python3 scripts/lint_copy.py /Users/kirso/Developer/ai-work-index/src/routes /Users/kirso/Developer/ai-work-index/docs

Return to the repository and run the full gate:

    cd /Users/kirso/Developer/ai-work-index
    bun run verify
    bun run build

Start the static preview and inspect representative routes at desktop and mobile widths:

    bun run preview -- --host 127.0.0.1 --port 4175

Representative flows are `/`, `/explore`, `/roles`, one official-resolution modern title, one
composite role, one withheld role, one scored occupation, one unranked occupation,
`/will-ai-take-my-job`, `/compare`, `/watchlist`, `/rankings`, `/reports/v9-release`, `/research`,
`/methodology`, and `/data`.

## Validation and Acceptance

- The V9 headline builder and all 987 published ranks are byte-for-byte unchanged unless an explicit
  separately reviewed scientific correction is recorded in this plan.
- The homepage shows search and a useful occupation-map view in the first mobile viewport; one tile
  is visibly defined as one occupation record.
- Filters update the map, list, scatter, result count, and URL without treating missing values as
  zero. A shared link restores the same state.
- The map includes all 1,001 official numeric occupations, visibly hatches 14 unranked records, and
  does not size marks by employment or wages.
- The pressure/pay visual retains its relationship on mobile, states the plotted denominator, and
  does not expose hundreds of marks as sequential tab stops.
- All 88 modern-title queries are searchable. Official resolutions publish one official score;
  composites and withheld results keep their distinct status.
- Occupation and role pages expose Save, Compare, and Share; Saved jobs accepts both official and
  non-official entities and preserves missing values.
- The calculator clearly separates published occupation evidence, visitor answers, and reviewed
  guidance. Refreshing the page does not mutate public V9 data.
- Detail pages lead with plain-language meaning and actions. Raw ILO values, mapping codes, and null
  external sidecars do not dominate the first reading path.
- Every chart has a question-led title, grain/date/denominator subtitle, legend where needed,
  source, missing-state explanation, responsive view, and accessible alternative.
- Active pages have no horizontal document overflow at 320, 375, 768, 1,024, and 1,440 pixels.
- Primary controls meet a 44-pixel touch target and have visible keyboard focus.
- Metadata, structured data, sitemap, `llms.txt`, and visible page claims agree.
- The human-copy linter has no unreviewed warnings in changed public copy.
- `bun run verify` and `bun run build` pass.

## Idempotence and Recovery

Builders and release generation are deterministic and safe to rerun. Generated JSON, CSV, sitemap,
manifest, redirects, status, and LLM files must be repaired through their source builders. UI work
should be divided by route or shared-module ownership to minimize conflicting edits. Before reverting
any failed experiment, inspect `git diff` and preserve changes in unrelated files. Never run a hard
reset or clean the worktree. Never delete or stage `output/ai-work-index-review/`.

If ILO task rights, SkillsFuture redistribution, an external crosswalk, or comparable historical
snapshots remain unresolved, leave those features visibly unavailable and record the gate here. A
missing source is not permission to improvise data.

## Artifacts and Notes

The final implementation should leave:

- this updated execution record;
- the unchanged canonical V9 occupation release and tests;
- a documented V9 presentation/evidence contract;
- shared accessible chart primitives;
- a flagship occupation explorer;
- restored role, occupation, calculator, comparison, and saved-job journeys;
- regenerated discovery and release artifacts;
- responsive screenshots or browser-test evidence; and
- exact validation transcripts in `Outcomes & Retrospective`.

## Interfaces and Dependencies

The work uses Bun, TypeScript, SvelteKit 2, Svelte 5, adapter-static, Tailwind CSS 4, modular D3,
Cloudflare Pages redirects/headers, local browser storage, and the existing build/test toolchain. It
adds no paid data source and no new chart runtime. It depends on the frozen SSOC 2024, ILO 2025, MOM
2025/2026, current research registry, and V9 role-mapping artifacts already in the repository.
