# Finish V9 as a compact, evidence-rich Singapore work product

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global `exec-plan`
skill. It is the single active completion plan for the current product. The completed migration,
capability, labour-observatory, and first consumer-rebuild plans remain historical implementation
records; when they conflict with this file, this file owns the current decision.

## Purpose / Big Picture

AI Work Index V9 has a defensible scientific core, but the product no longer feels as useful or as
direct as the earlier site. The V9 migration removed unsupported formulas and, at the same time,
removed or weakened the compact explorer, visual modes, semantic colour, filters, role journeys,
and one-click occupation navigation. Those were separate decisions and must now be separated.

After this work, a visitor can search a familiar title, open the final occupation in one action,
and explore Singapore work through a compact visual workspace. The workspace restores a detailed
occupation map, pressure-and-pay view, named-demand view, distribution, persistent filters, compact
rankings, and direct links. Occupation and familiar-title pages explain the result in ordinary
language, show what work may change, show pay and available demand evidence, and give practical
next actions before technical detail.

The scientific product also becomes broader without becoming a synthetic job-loss score. The ILO
2025 task-pressure rank stays the single headline. OECD capability proximity, Eloundou theoretical
exposure, Anthropic observed use, Singapore pay and demand, broad labour-market context, and future
skills evidence become separately named dimensions. The novel output is a versioned evidence vector
and a signal-divergence view: users can see when capability, use, demand, pay, and labour outcomes
agree or disagree instead of receiving a falsely precise average.

## Progress

- [x] (2026-08-21) Re-anchored the current branch and reviewed the seven supplied historical
  screenshots against the current homepage, explorer, search, modern-title and occupation flows.
- [x] (2026-08-21) Confirmed that the requested restoration is aesthetic and functional, not a
  request to restore the V7/V8 scientific model.
- [x] (2026-08-21) Confirmed the current stack already uses SvelteKit 2, Svelte 5, Tailwind 4,
  shadcn-svelte Lyra, Bits UI, Phosphor and modular D3. No framework or component-kit migration is
  needed.
- [x] (2026-08-21) Confirmed two avoidable journey regressions: the current detailed map selects
  before opening, and reviewed modern-title aliases open an intermediate role guide before the
  official occupation.
- [x] (2026-08-21) Classified historical visuals into V9-safe forms to restore, useful forms to
  rebuild, and unsupported outputs to keep retired.
- [x] (2026-08-21) Consolidated product, design, science, data, research, signal, longitudinal,
  copy, SEO, accessibility and release work into this plan.
- [x] (2026-08-21) Milestone 0: froze the current evidence baseline, added a single direct-destination owner and tests, removed map/scatter confirmation panels, made Explore detailed-first, and routed reviewed official aliases directly to their official occupation while preserving familiar-title context.
  This plan is now the only active completion owner.
- [x] (2026-08-21) Milestone 1: restored the compact Lyra visual system, cool-neutral surfaces,
  pressure colour scale and compact header; removed decorative coloured left borders from active
  product surfaces without changing the V9 headline contract.
- [x] (2026-08-21) Milestone 2: restored the connected flagship explorer on home and Explore with
  one shared URL state, persistent desktop filters, a detailed equal-area occupation map,
  pressure-and-pay, named-demand, distribution and list views, plus a separate OECD capability
  colour mode. Search and map journeys were verified in a real browser at desktop and mobile sizes.
- [ ] Milestone 3: rebuild occupation, familiar-title, comparison, saved-job, calculator, ranking
  and report journeys around decisions and actions.
- [ ] Milestone 4: publish defensible Eloundou and Anthropic dimensions, or leave individual rows
  machine-readably unavailable when their exact transfer chain fails.
- [ ] Milestone 5: expand OECD mapping by reviewed identity decisions and ship a small official
  Skills Framework / WSG pilot.
- [ ] Milestone 6: build the versioned multi-signal evidence vector and longitudinal observatory.
- [ ] Milestone 7: finish copy, SEO/AEO/GEO/LLMO, accessibility, performance, release generation,
  commits, push and pull-request handoff.

## Surprises & Discoveries

- Observation: the scientific cleanup did not require the product simplification.
  Evidence: V9 already supplies ranked pressure, direct MOM pay, named demand, mapped task evidence,
  broad Singapore labour context and a conservative OECD capability layer. The current UI presents
  these in separate long sections instead of the earlier connected workspace.
- Observation: the old visual forms mixed good interaction with unsupported constructs.
  Evidence: the archived treemap and demand matrix use `net_risk`, inferred employment sizing,
  synthetic human-protection fields and pathway conclusions. Their tabs, filters, compact layout,
  direct labels and discovery pattern remain useful, but the old data contracts cannot return.
- Observation: current navigation adds confirmation where no uncertainty exists.
  Evidence: `EqualAreaOccupationMap.svelte` selects a tile and renders an “Open occupation” action;
  `GroupedOccupationMap.svelte` opens a group before an occupation; reviewed official aliases in
  `OccupationSearch.svelte` route to `/role/<slug>` even when a reviewed SSOC destination exists.
- Observation: modern-title pages were not deleted from the data model, but many are hidden behind
  redirects or intermediate journeys.
  Evidence: V9 has 88 queries: 67 official resolutions, 18 reviewed composites and 3 withheld
  mappings. The product should retain useful role guides while sending primary search and browse
  journeys directly to a known official destination.
- Observation: the current source-of-truth design document encodes a rejected decision.
  Evidence: `docs/design.md` requires a group-first homepage and says the detailed map belongs only
  in Explore. The user has explicitly chosen a compact detailed flagship with direct destinations.
- Observation: the project has enough chart technology.
  Evidence: modular D3 and bespoke SVG already support maps, scatter plots, distributions, radar
  profiles, labels and responsive fallbacks. Adding a second chart framework would increase payload
  and inconsistency without fixing the product contract.
- Observation: “quarterly pressure movers” are not automatically meaningful.
  Evidence: the V9 headline is based on a frozen ILO 2025 construct. Labour, adoption, use and demand
  may change quarterly while the pressure source does not. Longitudinal products must compare each
  signal at its own compatible cadence rather than manufacture movement in a static score.
- Observation: the evidence base is broad but not yet maximized at detailed SSOC grain.
  Evidence: current publication covers 987 pressure ranks, 523 direct wage rows, 37 named-demand
  matches, broad labour context for nearly all occupations, 68 conservative OECD profiles, and zero
  published AIOE, Eloundou, Anthropic-use or complementarity sidecars.

## Decision Log

- Decision: restore the earlier visual density and interaction model, not its score formula.
  Rationale: compactness, tabs, filters, colour and direct navigation are product qualities; they do
  not require net-risk, employment-sized tiles or inferred job-loss outcomes.
  Date/Author: 2026-08-21 / User and Codex
- Decision: keep shadcn-svelte Lyra as the component baseline.
  Rationale: Lyra is already installed and appropriate for the stack. Product-specific layout,
  density and semantic chart tokens belong above the preset.
  Date/Author: 2026-08-21 / User and Codex
- Decision: use compact white and neutral surfaces with the earlier green-to-amber-to-orange-to-red
  pressure scale. Remove active-surface coloured left borders.
  Rationale: the old palette communicated the pressure continuum quickly. Colour will encode data
  or a small role-family accent, not decorate page chrome.
  Date/Author: 2026-08-21 / User and Codex
- Decision: primary search, command-menu, map, ranking and compare results open the final known
  destination in one action.
  Rationale: reviewed official aliases do not require user confirmation. Familiar-title context can
  be preserved as a query parameter or page label without inserting a second page.
  Date/Author: 2026-08-21 / User and Codex
- Decision: retain all 88 familiar-title queries and all useful guides.
  Rationale: exact and reviewed aliases should support search reach and tailored guidance while
  reusing the official score verbatim. Composites remain visibly non-official; ambiguous mappings
  remain withheld.
  Date/Author: 2026-08-21 / User and Codex
- Decision: keep the ILO 2025 V9 rank as the sole headline and publish other research as separate
  dimensions.
  Rationale: capability, theoretical exposure, observed use, pay, demand and labour outcomes are
  different constructs. Their disagreement is information, not an error to average away.
  Date/Author: 2026-08-21 / Codex
- Decision: replace “quarterly movers” with signal-specific change until two comparable pressure
  snapshots genuinely exist.
  Rationale: a market update cannot be relabelled as movement in a frozen task-pressure measure.
  Date/Author: 2026-08-21 / Codex
- Decision: centralize limitations in methodology, evidence drawers and data documentation.
  Rationale: normal pages should state the relevant missing field once and focus on interpretation
  and action instead of repeating defensive prose.
  Date/Author: 2026-08-21 / User and Codex

## Outcomes & Retrospective

The review, direct-destination and flagship restoration phases are complete. The homepage again
opens with a compact search-and-map workspace rather than a sequence of monochrome lists. It shows
all 1,001 occupation records with equal-area tiles; pressure, pay, named demand and capability remain
separate evidence modes. The desktop filter rail becomes a compact mobile disclosure, and modern
titles such as “AI Engineer” now open `/occupation/25143?as=ai-engineer` in one selection.

Validation through Milestone 2: `svelte-check` reports zero errors and zero warnings; the focused
destination, explorer, browse and product-journey suites report 26 passes and zero failures; desktop
and 375-pixel browser renders have no page overflow; and the direct modern-title journey was
exercised through Playwright with zero console errors. Scientific and generated-release validation
will be repeated after the evidence milestones because the search artifact now also carries the 68
published capability-profile values.

## Context and Orientation

The current branch is `v8-confidence-ratings`, fourteen commits ahead of its remote at the start of
this plan. Untracked `.cursor/` and `output/ai-work-index-review/` paths belong to the user and must
never be staged or modified by this work.

The V9 scientific owner is `scripts/build-v9-release.ts`; its types are in
`src/lib/data/v9-contract.ts`. `data/occupations-v9.json` is the canonical generated occupation
release. The headline is the within-Singapore midrank percentile of the median ILO 2025
`mean_score_2025` across scored official SSOC 2024 to ISCO-08 matches. It covers 1,001 occupations,
with 987 ranked and 14 unranked. New product evidence must pass a headline-invariance test.

`data/v9-market-context.json` and `data/v9-economic-observatory.json` own Singapore market and broad
labour context. There are 523 direct MOM wage rows and 37 occupations with reviewed named-demand
matches. Broad evidence must remain labelled at national, industry or broad occupation-group grain;
it cannot become a detailed occupation outcome.

`data/v9-capability-profiles.json` owns the separate OECD 2026 capability layer. Sixty-eight
occupations pass the current exact-title-identity publication rule; 933 remain unavailable. Raw
candidate coverage is not publication coverage.

`data/synthetic-roles-v9.json`, `scripts/v9-role-mappings.ts` and
`scripts/build-synthetic-roles-v9.ts` own the 88 familiar-title queries. Sixty-seven resolve to
official occupations, 18 are non-official reviewed composites and 3 are mapping-withheld.

`src/routes/+page.svelte` and `src/routes/explore/+page.svelte` are the main discovery surfaces.
Current chart components live in `src/lib/components/v9-browser`. The relevant V9-safe components
are `EqualAreaOccupationMap.svelte`, `PressureWageScatter.svelte`,
`NamedDemandPressurePlot.svelte`, `PressureDistribution.svelte` and `RoleWorkProfile.svelte`.
Archived components under `src/lib/components/viz` are design references only and must not be
reconnected without replacing their data contracts.

`src/app.css`, `src/lib/design-system.ts`, `docs/design.md` and `components.json` own the design
system. `components.json` already records Lyra, neutral base, Phosphor icons and the shadcn-svelte
registry. The redesign must use these owners rather than adding a parallel component system.

## Restore, Rebuild, Keep Retired

| Historical product form | V9 decision | Replacement contract |
|---|---|---|
| Compact header, search and above-fold explorer | Restore | Lyra primitives, tighter spacing and direct destinations |
| Persistent filter rail | Restore | SSOC group, pressure range, ranked status, pay, named demand and capability availability |
| Occupation treemap | Rebuild | Equal-area occupation leaves grouped by SSOC; area never implies employment |
| Green-to-red pressure colour | Restore | Continuous relative pressure only, with text labels and unranked hatch |
| Demand vs pressure tab | Rebuild | Named-demand evidence vs pressure; non-match remains unknown |
| Distribution tab | Restore | V9 pressure percentiles with ties and unranked count stated |
| Pay scatter | Keep and compact | Direct MOM gross monthly wage only; missing wages stay missing |
| “Why this score” waterfall | Replace | Official mapping and ILO evidence chain; no synthetic weighted drivers |
| Skills/work radar | Retain carefully | Reviewed ordinal work profile or official skills evidence; never a score input |
| Singapore Now cards | Rebuild | Direct occupation evidence plus visibly broad national/group context |
| Transition recommendations | Keep retired for now | Separate skills, qualifications, pay, demand, training and observed-mobility evidence |
| Jobs affected, wage pool, job-loss probability | Retire | No V9 replacement unless future direct evidence supports the construct |
| Quarterly pressure movers | Withhold | Signal-specific history now; pressure change only after comparable pressure snapshots |

## Plan of Work

### Milestone 0 — Freeze the baseline and destination contract

Record checksums and release counts for the current V9 headline, search index, market context,
capability profiles and observatory. Add `src/lib/data/v9-destination.ts` as the single destination
resolver for official occupations, reviewed aliases, composites and withheld queries. A known
official alias resolves to `/occupation/<ssoc>?as=<role-slug>`; the canonical remains the occupation.
The occupation loader uses `as` only to display the familiar query title and mapping explanation.
Composite and withheld queries continue to resolve to `/role/<slug>`.

Update `OccupationSearch.svelte`, `CommandMenu.svelte`, comparison and personal-work selectors,
rankings and chart links to use the owner. Make detailed map leaves real links or immediate
navigations. Remove the selected-then-open confirmation state. A group label may filter or zoom,
but every visible occupation leaf opens its final page in one action.

Add tests for exact titles, reviewed aliases, composites, withheld mappings, map tiles and keyboard
activation. Test the customer outcome, not only generated redirect counts.

### Milestone 1 — Restore the compact Lyra product system

Revise `src/app.css`, `src/lib/design-system.ts` and `docs/design.md`. Keep Schibsted Grotesk, IBM
Plex Mono, Lyra geometry, Phosphor icons, Bits UI and Tailwind 4. Replace warm paper and the current
multi-colour action-card palette with white cards, cool-neutral subtle surfaces, thin neutral
borders, compact spacing and cobalt only for links, focus and selected controls.

Restore a continuous pressure palette from green through gold and orange to red. It represents
relative task pressure only and always appears with words or numbers. Missing and unranked states
use neutral hatching. Retain role-family colour only in a small badge, radar line or legend. Remove
coloured left borders from active V9 routes and components; use a compact badge, dot, top rule or
inline value when colour carries meaning.

Reduce header and hero height so search, filters and the start of the flagship chart are visible in
a 1,440 by 900 viewport. Prefer compact rows and panels to tall card stacks. Preserve readable body
line lengths on report and methodology pages rather than applying dashboard density everywhere.

### Milestone 2 — Restore the connected flagship explorer

Build one shared explorer state owner from the current URL-backed filters. The homepage and Explore
must use the same query semantics. The desktop layout uses a persistent compact filter rail and a
main visual panel. Mobile uses a sheet or disclosure for filters and a list/table fallback; it must
not require horizontal page scrolling.

The default `Occupation map` renders all matching occupation leaves inside SSOC group boundaries.
Each leaf has equal weight. Labels appear when space permits, tooltips supply full detail, and one
click opens the occupation. The map must not size by employment, wages, task count or inferred job
importance.

Provide four connected tabs:

1. `Occupation map` — grouped equal-area occupation leaves, coloured by pressure.
2. `Pressure & pay` — V9 percentile against direct MOM gross monthly wage.
3. `Named demand` — reviewed named-demand matches against pressure; absence is unknown.
4. `Distribution` — pressure percentile distribution, ties and unranked records.

OECD capability is a separate colour or comparison mode available only for the 68 published
profiles. It never silently recolours unavailable occupations as low capability. Filters cover
major group, pressure range, ranked/unranked status, direct pay, named demand and capability
availability. Remove archive-era risk bands, impact types, mapped-occupation-count sliders and
pathway filters.

Restore compact ranking strips below the visual, but populate them only from legitimate fields:
relative pressure, direct pay, named demand, mapping diagnostics and capability availability. Name
the ordering explicitly and include all cutoff ties.

### Milestone 3 — Make every detail journey useful to a normal person

Recompose `src/routes/occupation/[ssoc]/+page.svelte` into a compact page with this order:

1. familiar title, pressure percentile and plain-language interpretation;
2. direct Singapore pay and named-demand facts;
3. mapped ISCO task examples showing work with more and less current GenAI overlap;
4. separate OECD capability profile when available;
5. practical actions: try, verify, keep human-led, strengthen and discuss at work;
6. broad Singapore labour context, clearly labelled at its published grain;
7. Save, Compare, Share and personal task-check actions;
8. collapsed mapping, raw score, dispersion, source and limitation details.

Rebuild “Why this score” as an evidence chain, not a driver waterfall. Show SSOC title to official
ISCO mapping to ILO task evidence to within-Singapore midrank. Do not imply that pay, demand,
adoption or user answers changed the rank.

Keep all useful `/role/<slug>` pages. Reviewed official aliases use the exact official score and can
offer title-specific practical guidance and search reach; primary product links still go directly
to the occupation. Composite pages disclose components, weights and assumption sensitivity.
Withheld pages help users choose sector and task context without publishing a score. Restore
compact role-family colour and the reviewed ordinal work radar without coloured left borders.

Apply the same compact hierarchy to Compare, Saved jobs, the personal-work checker, rankings and
current reports. Comparisons show pressure, pay, named demand, mapped tasks, capability, observed
use and theoretical exposure as separate rows. The calculator opens a chosen final record directly
and never asks for an extra confirmation.

### Milestone 4 — Publish external research dimensions defensibly

Create a source manifest that freezes the official file, repository commit or dataset revision,
licence, checksum, observation period, source occupation taxonomy and construct definition for each
external dimension.

Implement separate deterministic builders for:

- Eloundou/OpenAI theoretical GPT exposure from the official row-level occupation artifact;
- Anthropic observed use/exposure from the official Economic Index dataset;
- AIOE only if its redistribution rights, SOC edition and bridge can be published cleanly;
- potential complementarity or work-profile measures only when the source construct and mapping are
  independently reproducible.

For every source, verify the complete transfer chain from official SSOC 2024 to ISCO-08 to the
source taxonomy. Record exact, close, broad, narrow and rejected relations separately. Publish a
value only under an approved rule; preserve candidate minimum, median, maximum and count where
several valid matches remain. Do not use a group fallback to fill missing records.

Add source-specific tests for checksums, editions, licence metadata, row counts, score scales,
candidate aggregation, missingness and headline invariance. Publish coverage before product copy.
Each new panel must name what it measures: theoretical exposure is not observed use; observed use is
not Singapore adoption; capability proximity is not employment impact.

### Milestone 5 — Expand capability and skills evidence through reviewed work

Keep the current 68 OECD profiles live. Build a reviewed mapping queue for the other occupations,
prioritised by product traffic, named-demand coverage and major-group diversity. Every approved row
records the SSOC title, candidate O*NET title, relation, reviewer rationale and date. Do not activate
all 698 raw exact candidates or close matches through an automated title threshold.

Build a small official Skills Framework / WSG pilot across three useful sectors: Infocomm
Technology, Financial Services and Healthcare. Freeze the source documents and terms, map only
explicit occupation or job-role relations, and publish source-backed skills and training links as a
separate practical layer. Editorial advice remains labelled reviewed guidance. Measure pilot
coverage and user comprehension before scaling to other sectors.

### Milestone 6 — Build the novel multi-signal and longitudinal product

Add `data/v9-evidence-vector.json` with one record per occupation and explicit nullable dimensions:
task pressure, capability proximity, theoretical exposure, observed use, direct pay, named demand,
broad labour context and official skills coverage. Every field carries construct, geography,
period, grain, source, mapping quality and `headline_effect: none` except the existing pressure
owner.

Build a signal-divergence report and comparison view. It may label evidence patterns as candidates,
never causal conclusions:

- high capability proximity plus low observed use: adoption-gap candidate;
- rising observed use plus stable or rising demand: complementarity or scale-response candidate;
- high pressure plus weakening compatible hiring evidence: adjustment-concern candidate;
- high pressure plus rising compatible demand: reorganisation or scale-response candidate.

Show the underlying dimensions and missing data beside every label. Do not create a composite
SOTA score, displacement probability or job-loss rank.

Freeze the current pressure release as a dated baseline, but track histories by signal. Pressure
changes only when a comparable pressure source or mapping changes. Pay, demand, broad labour,
capability and observed use use their own source cadences. Replace the current quarterly-movers
promise with `What changed in the evidence`; enable pressure movers only after a second comparable
pressure snapshot exists.

Transition recommendations remain gated until a separate transition product can combine reviewed
skills similarity, qualification requirements, direct pay, demand, training routes and observed
Singapore mobility. Never revive risk-reduction arithmetic from the archive.

### Milestone 7 — Copy, discovery, QA and release

Use plain consumer labels on active pages: `AI task pressure`, `Pay in Singapore`, `Named demand`,
`Observed AI use`, `AI capability profile`, `What may change first` and `What you can do`. Replace
negative formulaic phrases such as “current pay context; not a wage pool at risk” with positive
descriptions. Keep raw ILO fields, scale details and crosswalk mechanics in methodology, data and
progressive disclosure.

Update homepage, occupations, all 88 role-query surfaces, rankings, reports, calculator, compare,
data, research, methodology, FAQs, titles, descriptions, structured data, sitemap, redirects,
downloads and LLM files. Preserve indexable, useful search surfaces and canonicalize alias query
states to the official occupation. Do not publish duplicate scores for the same official job.

Add automated browser journeys for direct navigation, tabs, filters, chart tooltips, keyboard use,
empty and unavailable states, and narrow widths. Run manual VoiceOver and NVDA checks where those
environments are available. Add production Core Web Vitals and privacy-safe RUM after deployment;
local automated tests cannot certify real customer comprehension or production performance.

Commit each milestone as a focused slice. Never use `git add -A`; stage named owned files so the
user's untracked paths remain untouched. After all local gates pass, push the branch and open or
update the pull request with exact scientific, product and external-validation boundaries.

## Concrete Steps

Run all commands from `/Users/kirso/Developer/ai-work-index`.

Before each milestone:

    git status --short --branch
    git diff --check

Core current-release generation and validation:

    bun run release:generate
    bun run verify
    bun run build
    bun run qa:browser:v9

Focused scientific checks as the new layers land:

    bun test tests/v9-contract.test.ts
    bun test tests/v9-external-crosswalk-audit.test.ts
    bun test tests/v9-capability-profiles.test.ts
    bun test tests/v9-economic-observatory.test.ts
    bun test tests/v9-synthetic-roles.test.ts

Add package scripts when their builders exist, then run:

    bun run build:external-signals:v9
    bun run build:skills:v9
    bun run build:evidence-vector:v9

Run the human-copy gate after public text changes:

    python3 /Users/kirso/.codex/skills/write-human-editorial-copy/scripts/lint_copy.py \
      --strict src/routes src/lib/components README.md docs/design.md

For every product milestone, capture desktop and mobile screenshots for `/`, `/explore`, a ranked
occupation, an unranked occupation, a reviewed alias, a composite, a withheld role, `/compare`,
`/will-ai-take-my-job`, `/rankings` and the relevant report. Compare them with the supplied compact
historical references for density and hierarchy, not for retired numbers or labels.

## Validation and Acceptance

- The V9 headline artifact and every published pressure percentile are unchanged by UI, market,
  capability, external-signal, skills and personal-work inputs.
- Search, command menu, map tiles, ranking rows and compare results reach a known official
  occupation in one action. Reviewed aliases preserve the familiar query label without an
  intermediate confirmation page.
- All 88 familiar-title queries remain discoverable. Official aliases reuse official scores;
  composites and withheld mappings retain their distinct status.
- At 1,440 by 900, the homepage shows the compact search/filter/flagship workspace above the fold.
- The connected explorer offers Occupation map, Pressure & pay, Named demand and Distribution with
  shared filters and URL state.
- No V9 map tile is sized by inferred employment, wage, task count or synthetic risk.
- Active V9 surfaces contain no coloured left-border decoration. Pressure, role-family and evidence
  colour remains available through fills, dots, text, legends and charts.
- Charts state construct, unit, source, period, missingness and mapping limitations. Colour is never
  the only carrier of meaning.
- Occupation pages lead with interpretation, pay/demand, task evidence and action; raw score and
  crosswalk mechanics remain available without dominating the page.
- External dimensions publish only when their frozen source, rights, taxonomy edition and transfer
  rule pass. Missing records remain null rather than inheriting a group value.
- The evidence vector exposes disagreements between signals and never emits a composite job-loss or
  displacement score.
- Old V7/V8 snapshots remain dated archives and never enter a V9 change calculation.
- All active tables and charts fit 320, 375, 768, 1,024 and 1,440 pixel widths without document
  overflow. Mobile charts have a readable list or table fallback.
- `bun run verify`, `bun run release:check`, `bun run build` and `bun run qa:browser:v9` pass from
  the final tree; two release generations are byte-identical for deterministic artifacts.
- Moderated customer sessions can explain pressure, pay, demand, capability and observed use without
  opening methodology, and can name at least one relevant next action. This remains an external
  release-learning gate, not a claim automated QA can satisfy.

## Idempotence and Recovery

All generated V9 JSON, CSV, sitemap, LLM, status and manifest artifacts must be repaired by rerunning
their owner; never hand-edit generated copies. Builders must be deterministic and safe to rerun.
Source downloads must be checksum-pinned and should fail closed when a remote file changes.

The worktree contains user-owned untracked directories. Never run `git clean`, never reset the
whole tree and never stage all files. Before each commit, inspect `git diff --name-only` and stage
only the milestone's named files. If a milestone fails, preserve the last green commit and record
the failing command and exact recovery step in this plan.

If an external source lacks redistributable rows, a verified taxonomy edition or a defensible
transfer rule, keep the public value unavailable and publish the gate in methodology. If a visual
cannot be expressed without a retired construct, keep the interaction pattern and replace the data
question rather than recreating the old claim.

## Artifacts and Notes

Current structural baseline at plan creation:

- 1,001 official SSOC 2024 occupations; 987 pressure-ranked; 14 unranked.
- 523 direct MOM wage rows.
- 37 occupations with reviewed named-demand matches.
- 88 familiar-title queries: 67 official resolutions, 18 composites and 3 withheld.
- 68 published OECD capability profiles; 933 unavailable under the current conservative rule.
- 56 research-registry records reviewed through 19 August 2026.
- zero published AIOE, Eloundou, Anthropic-use and complementarity sidecars.
- no second comparable V9 pressure snapshot.

Frozen pre-product-change SHA-256 values:

- `data/occupations-v9.json`: `61349a61cc5f1c8132d5c7384c1c758787200ef741d933a3786e0409d6b7cc0c`
- `data/v9-market-context.json`: `e49176f7fecf57f837c40b22ce0b371dc225bd7fd5b82de816fdc1e9e5dad177`
- `data/v9-capability-profiles.json`: `421921b005a10e7c89116988341ff515777b2da1e6699850bee8890a4c1ca2cf`
- `data/v9-economic-observatory.json`: `c9738614758dc12f7a0bd0f5da0ddf3d14ec0cc65c0092cd3ab2d7046982b16d`
- `static/data/v9-search-index.json`: `e82da2d3cb93e301fb4e778073a29ecc0a0e49314b685da6a703cdef60abf301`

The seven user-supplied screenshots are design references for density, compact navigation, filters,
tabs, colour and hierarchy. Their V7 labels, percentages, impact categories, demand-protection axes,
transition scores and employment-sized areas are not scientific acceptance criteria.

## Interfaces and Dependencies

The product uses SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, shadcn-svelte Lyra, Bits UI,
Phosphor, tailwind-variants, Schibsted Grotesk, IBM Plex Mono and modular D3. The work must not add a
second UI kit or general chart runtime without a measured need.

The evidence pipeline depends on SSOC 2024, official SSOC-to-ISCO mappings, ILO 2025 task evidence,
MOM and SingStat labour sources, the official ESCO-to-O*NET bridge, the OECD 2026 capability
artifact, and separately frozen external research artifacts. Every generated public interface must
state its source grain and keep non-headline dimensions from changing the V9 rank.
