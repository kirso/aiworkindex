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

- [x] (2026-08-20) Re-audited `main`, committed V9, and the dirty recovery worktree at matching
  desktop and mobile widths. Confirmed that V9 improved the scientific contract but that commit
  `000ec7c` removed useful interaction and presentation together with unsupported V8 outputs.
- [x] (2026-08-20) Audited the current shadcn-svelte configuration and applied the cited preset to
  a disposable copy. `b3rnTwetSc` resolves to Lyra with a neutral base, Outfit body text, Geist
  Mono headings, Phosphor icons, zero radius, a translucent menu and bold menu accents. Before the
  migration, the live repository still declared the legacy `default`/`slate` configuration despite
  extensive local overrides.
- [x] (2026-08-20) Adopted Lyra as the recorded upstream component style, then reapplied the product's
  pressure, evidence, action, role-family, missingness, focus and data-visualisation semantics on
  top of it. Do not accept Lyra's generic monochrome chart scale as occupation evidence.
- [x] (2026-08-20) Replaced the homepage's 1,001-mark detailed-first experience with a category-first
  overview. Keep the detailed equal-area map in Explore and as an explicit deeper view.
- [x] (2026-08-20) Restored V9-safe pressure distribution, named-demand, pay and comparison visuals;
  complete the answer-first occupation, role, ranking, report, calculator and saved-job journeys.
- [x] (2026-08-20) Published mapped ILO task examples at their true ISCO grain with source text,
  attribution, adaptation notice and a hard prohibition on presenting them as exact SSOC duties.
- [x] (2026-08-20) Prototyped and quality-audited the official SSOC-to-ISCO-to-ESCO-to-O*NET chain for
  OECD, O*NET, Eloundou and observed-use panels. Keep all such panels separate from the headline.
- [x] (2026-08-20) Completed final release generation, scientific invariance tests, copy lint,
  responsive and keyboard QA, production build and performance measurement. Record real-customer,
  screen-reader and production-RUM work as external validation, not something automated QA proves.

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
  duties. The separate mapped-task artifact now publishes the permitted source text at its true
  ISCO grain with CC BY 4.0 attribution and an explicit adaptation notice.
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
- Observation: The repository was not using a modern shadcn-svelte preset even though it contained
  shadcn-derived primitives.
  Evidence: `components.json` declared `style: default` and `baseColor: slate`. Applying
  `b3rnTwetSc` in `/tmp` produced `style: lyra`, `baseColor: neutral`, `iconLibrary: phosphor`,
  `menuColor: default-translucent`, and `menuAccent: bold`, plus Outfit and Geist Mono fonts.
- Observation: The equal-area map is scientifically honest but too detailed for the first product
  explanation and creates a very large visual and accessibility tree.
  Evidence: the current homepage places `OccupationExplorer` immediately after the hero and sends
  all 1,001 official records into that first exploration block. The category and group structure
  already exists in the same data and can orient the visitor first.
- Observation: The ILO task-text gate was too broad.
  Evidence: the pinned, checksummed workbook contains 3,265 task rows for 427 ISCO groups, and the
  cited ILO work is published under CC BY 4.0. The remaining scientific requirement is truthful
  grain: mapped ISCO task examples are not exact five-digit SSOC duties.
- Observation: An official candidate crosswalk is now available, but it does not by itself make
  external scores publishable.
  Evidence: frozen ESCO v1.1.0 occupations plus the official ESCO–O*NET v1 crosswalk provide
  exact-or-close candidates for 362 of 432 relevant ISCO groups. Eloundou and Anthropic still lack
  pinned source-code editions and a validated many-to-many transfer rule; AIOE uses SOC 2010; the
  OECD paper does not publish a row-level occupation artifact.

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
- Decision: Adopt the explicit shadcn-svelte preset `b3rnTwetSc` as the recorded Lyra baseline.
  Rationale: It gives local primitives a coherent upstream style, typography, icon and menu
  contract. AI Work Index will retain separate semantic tokens for evidence and data meaning rather
  than treating the preset as a complete product design.
  Date/Author: 2026-08-20 / Codex
- Decision: Make the homepage category-first and move the full 1,001-record explorer one level
  deeper.
  Rationale: People need an intelligible map of work before a detailed mark for every occupation.
  The full equal-area map remains valuable in Explore, where filters and drill-down are expected.
  Date/Author: 2026-08-20 / Codex
- Decision: Publish ILO task text only as mapped ISCO examples, retaining exact source text and
  source occupation code.
  Rationale: This adds the most useful missing explanation without inventing detailed SSOC duties or
  changing the pressure rank.
  Date/Author: 2026-08-20 / Codex
- Decision: Publish the ESCO–O*NET crosswalk audit, not transferred external occupation scores.
  Rationale: Candidate mappings make the remaining work measurable, but source-edition and transfer
  choices still change interpretation. Candidate coverage must not be presented as measured
  occupation coverage.
  Date/Author: 2026-08-20 / Codex

## Outcomes & Retrospective

The first V9 recovery milestone was implemented without changing the headline formula. The current release
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

Final verification on 20 August 2026 after the Lyra, task-evidence and external-audit work:

- `bun run verify`: 113 tests passed, zero failed; Svelte diagnostics, ESLint, Prettier and the V9
  release contract passed.
- `bun run release:check`: 1,001 occupations, 77 role guides and 1,115 sitemap URLs passed the
  current-release boundary.
- `bun run build`: the static production site completed successfully.
- Strict editorial lint scanned 27 active product and plan files with zero warnings.
- Browser QA covered 17 active routes at 320, 375, 768, 1,024 and 1,440 pixels: 85 route/viewport
  combinations returned 200, rendered one `main` and one `h1`, logged no console error, and had no
  horizontal document overflow. Populated Search, Explore, Compare, role and personal-work states
  were also exercised.
- Two consecutive release generations produced identical hashes for the research register,
  task-evidence artifact, external-crosswalk audit, manifest, LLM guide and sitemap.
- Final prerendered HTML is 95,799 bytes for home and 25,551 bytes for Explore; gzip sizes are
  15,162 and 6,628 bytes. The on-demand search artifact is 122,614 bytes gzip and is not embedded in
  the homepage HTML.

The comparative product audit is now implemented. `components.json` records the cited Lyra preset;
Outfit, Geist Mono and Phosphor are installed; the homepage starts with official category and major-
group orientation; Explore owns the full 1,001-record map; pressure distribution and named-demand
visuals are active; and occupation pages expose mapped task examples before technical details. The
scientific release adds a separate 3,265-row ILO task artifact and a checksum-pinned external-
crosswalk audit without changing any headline rank.

What remains evidence-gated rather than silently approximated: publishable transferred values for
OECD, AIOE, Eloundou, Anthropic observed use and complementarity; detailed occupation-level adoption
and vacancy data; defensible transition evidence; and a second comparable V9 snapshot before
publishing change-over-time rankings. None of these layers may alter the current headline unless a
future version explicitly changes and validates that scientific contract. Real customer testing,
manual screen-reader testing and production Core Web Vitals remain external validation work.

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
| External AIOE, Eloundou, Anthropic and complementarity sidecars | Withhold at occupation grain | The official ESCO–O*NET candidate bridge is now audited. Activate values only after source-edition, transfer and construct-specific validation; no headline effect |

## Page Architecture and Wireframes

The homepage starts with a one-sentence answer, a job-title search and four small facts about the
current Singapore release. A category-first overview then explains the official ILO categories and
nine Singapore major groups before showing the pressure distribution and named-demand evidence.
The full equal-area map, shared filters, pressure/pay scatter and result list live in Explore, where
detailed comparison is expected. Below the homepage overview, show modern-title entry points,
current Singapore market signals and three action routes: inspect my work, compare jobs and save
jobs.

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

- Validate the category-first homepage with customers and decide whether a compact ranked list or
  category distribution should be the default secondary view on phones below 375 pixels. The full
  equal-area map remains available in Explore.
- Decide whether a visitor may export their local saved jobs and personal work plan. Current scope
  keeps both device-local and deliberately simple.
- Decide whether reviewed alias guides need unique editorial examples beyond title and family
  context. Any added text needs a named reviewer and date to avoid thin or templated SEO pages.
- Recheck the pinned ILO workbook's attribution and third-party notices whenever the source artifact
  changes. The current release uses its CC BY 4.0 task text only as mapped ISCO examples, never as
  exact detailed SSOC duties.
- Decide the cadence for a second comparable V9 snapshot. `Quarterly movers` stays unavailable until
  that cadence produces genuinely comparable data.

## Recovery backlog and current status

P0 restores obvious customer value while keeping the V9 headline byte-for-byte stable.

- [x] Record and apply Lyra in `components.json`; install its fonts, icon set and Tailwind base; migrate
  local Button, Command, Sheet, Tabs, Table, Tooltip, input and empty-state compositions to the Lyra
  contract without overwriting evidence tokens.
- [x] Consolidate the three search presentations around one query index and direct-navigation contract.
  Selecting a homepage result must open its destination directly. The global command palette may
  require one action to open and one to select, but no intermediate results page.
- [x] Replace the homepage's immediate detailed map with a nine-major-group overview, official ILO
  category distribution, a few current Singapore facts and clear entry points into Search, Explore,
  Compare and My work.
- [x] Keep all 88 familiar-title journeys, family color, Save, Share and Compare. Preserve 11 exact
  redirects, 56 reviewed alias guides, 18 composites and 3 withheld guides.
- [x] Reorder occupation, role, ranking and report pages around meaning, work changes, human
  contribution, Singapore context and actions. Put mapping codes and raw values behind useful
  progressive disclosure.
- [x] Repair loading, empty, error, no-wage, no-demand, unranked and mapping-withheld states. Remove
  defensive phrases such as `not a wage pool at risk` from customer copy while retaining the
  methodological boundary in the relevant evidence explanation.

P1 rebuilds visual forms against explicit V9-safe data contracts.

- [x] Build a category/group overview where area and length represent occupation-record counts only.
- [x] Add a pressure distribution that discloses the 987-record ranking population, ties and 14
  unranked records.
- [x] Keep the pressure/pay scatter limited to direct MOM wage rows and provide aggregation or table
  fallbacks rather than hundreds of sequential keyboard targets.
- [x] Build a named-demand plot from reviewed source attachments only. Absence from those sources must
  read `not named in the selected sources`, never `weak demand`.
- [x] Rebuild Compare with aligned visual rows for pressure, mapped score range, pay, demand and evidence
  status. Do not calculate an overall winner.
- [x] Replace DriverWaterfall with an evidence chain. Keep the ordinal role radar as reviewed guidance,
  not measured skills or statistical uncertainty.

P2 adds newly validated free public evidence without changing the headline.

- [x] Add mapped ILO task examples with exact source row, ISCO code, score, attribution, checksum and
  grain disclosure.
- [ ] Freeze a distributable row-level OECD 2026 capability artifact and a fully pinned current O*NET
  source. ESCO v1.1.0 and the official ESCO–O*NET crosswalk are already frozen, checksummed and
  covered by a multiplicity audit.
- [ ] After the source-edition and transfer checks pass, add OECD capability, O*NET work-profile, Eloundou theoretical
  exposure and Anthropic observed-use panels separately. Keep AIOE values link-only until its
  redistribution terms are explicit.
- [x] Expand Singapore context with correctly grained MOM and IMDA adoption, vacancy, entry-level and
  digital-work evidence. Keep national, sector, broad-group and named-occupation facts visibly
  distinct.
- [ ] Pilot reviewed Skills Framework/WSG mappings in a small number of sectors before adding scalable
  skills and training guidance.

P3 covers longitudinal evidence, transitions and real-world validation.

- [ ] Freeze a second comparable V9 snapshot before enabling movers. Lock source construct, taxonomy,
  crosswalk, aggregation, ranking population, missing-data policy, rounding and publication timing.
- [ ] Replace the old transition composite with separate task/skill similarity, qualification or
  licensing gap, direct wage difference, named demand, training route and work-context dimensions.
  Do not call a transition `best` until the product has a validated decision rule.
- [ ] Run moderated customer comprehension and actionability sessions, manual VoiceOver/NVDA testing
  and production Core Web Vitals/RUM. Automated browsers are pre-release checks, not substitutes.

## Plan of Work

First, repair the foundation. Apply preset `b3rnTwetSc` so `components.json`, font dependencies,
Phosphor icon dependency and shadcn-svelte base CSS all record Lyra as the upstream primitive
contract. Then update the design tokens to a warm editorial surface system, define a
continuous V9 pressure scale, define role-family and evidence-status tokens, increase body and chart
typography, and add consistent focus, active, radius, depth, and touch-target behavior. Add small
presentation modules for evidence labels, pressure formatting, local saved-job state, personal task
answers, and URL-backed browse state. Correct the current research and market claims that can be
fixed from already-reviewed primary sources without changing the score.

Second, restore category-first exploration. Create a nine-major-group and official-category summary
for the homepage. Keep the equal-area occupation map in Explore, where its data contract contains
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

Next, add publishable mapped ILO task examples and prototype the verified external crosswalk without
changing the headline. Every new evidence block records source artifact, checksum, date, construct,
grain, mapping quality, coverage and limitations. The headline invariance suite must pass before a
side panel is reachable.

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

Inspect the recorded Lyra preset in a disposable copy before applying it to the dirty worktree:

    npm_config_cache=/tmp/aiwi-npm-cache npx --yes shadcn-svelte@latest apply b3rnTwetSc -c /tmp/aiwi-preset-audit -y --no-deps-install --skip-preflight

Apply Lyra to the repository only after the temporary diff is understood, then reconcile product
tokens and local primitive customisations rather than accepting the generated CSS blindly:

    npm_config_cache=/tmp/aiwi-npm-cache npx --yes shadcn-svelte@latest apply b3rnTwetSc -c /Users/kirso/Developer/ai-work-index -y --no-deps-install --skip-preflight

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
- The homepage shows search, current Singapore evidence and a useful category/group overview before
  exposing a detailed map. One tile in the Explore map is visibly defined as one occupation record.
- Filters update the map, list, scatter, result count, and URL without treating missing values as
  zero. A shared link restores the same state.
- The Explore map includes all 1,001 official numeric occupations, visibly hatches 14 unranked records, and
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
- `components.json` records `style: lyra`, the selected icon and menu contracts, and no active V9
  component depends on an unrecorded preset assumption.
- Every published mapped ILO task example exposes the source ISCO code and cannot be read or exported
  as an exact five-digit SSOC duty.

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

The work uses Bun, TypeScript, SvelteKit 2, Svelte 5, adapter-static, Tailwind CSS 4,
shadcn-svelte Lyra preset `b3rnTwetSc`, Outfit, Geist Mono, Phosphor icons, modular D3,
Cloudflare Pages redirects/headers, local browser storage, and the existing build/test toolchain. It
adds no paid data source and no new chart runtime. It depends on the frozen SSOC 2024, ILO 2025, MOM
2025/2026, current research registry, and V9 role-mapping artifacts already in the repository.
