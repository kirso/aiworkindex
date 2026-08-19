# Ship a complete SSOC 2024 AI Work Pressure V9 without losing product surfaces

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global
`exec-plan` skill.

## Purpose / Big Picture

AI Work Index V9 replaces the historical 562-row wage-covered SSOC 2020 sample with the
complete official SSOC 2024 classification as the Singapore occupation registry. It publishes
an AI Work Pressure Rank: the midrank percentile of the ILO 2025
task-level GenAI exposure measure among scored Singapore occupations. The site retains its
risk-facing product promise while stating exactly what risk evidence exists. Observed AI
use, human complementarity, wages, demand, adoption, and labour outcomes remain separate
dimensions rather than hidden weights. A reader will be able to search the current
classification, explore synthetic roles, rankings, reports, comparisons, and the calculator,
and distinguish measured evidence from modelled context and unknown outcomes.

Old SSOC codes will exist only at the URL edge to prevent broken links. They will not enter
the active registry, scoring, search synonyms, synthetic roles, transitions, exports, or
methodology. The active public release will be V9; V8 remains reproducible through Git
history and a final release artifact.

## Progress

- [x] (2026-08-19) Audited the active taxonomy, score pipeline, data contracts, SSOC-keyed
  sidecars, static routes, SEO surfaces, and Cloudflare deployment files.
- [x] (2026-08-19) Downloaded and inspected the official current SSOC 2024 definitions,
  SSOC 2020 correspondence, and ISCO-08 correspondence in `/tmp`.
- [x] (2026-08-19) Confirmed 1,006 five-digit SSOC 2024 entries: 1,001 numeric occupations
  and five residual `X` entries.
- [x] (2026-08-19) Confirmed 987 numeric occupations have a usable official
  SSOC 2024 to ISCO-08 to ILO 2025 path; 14 do not.
- [x] (2026-08-19) Confirmed MOM Occupational Wages 2025 contains 523 unique detailed
  SSOC 2024 occupations.
- [x] (2026-08-19) Tagged `c1b3dcf` as `v8-ssoc2020-final` and committed this living
  execution record.
- [x] (2026-08-19) Added frozen official SSOC 2024 source snapshots with retrieval metadata
  and deterministic builders.
- [x] (2026-08-19) Built the current registry, scientific crosswalk, search synonyms, and
  isolated URL continuity artifact.
- [x] (2026-08-19) Implemented the V9 generated contract: 1,001 numeric occupations,
  987 ILO-scored, 14 explicitly unscored, no group fallbacks, and uncertainty retained for
  official many-to-many mappings.
- [x] (2026-08-19) Replaced the wage input with the direct MOM Occupational Wages 2025
  workbook and made detailed wage evidence nullable (523 occupations).
- [x] (2026-08-19) Restored the uncommitted route-reduction draft to `92abee6`; calculator,
  comparison, synthetic roles, reports, rankings, groups, occupation detail, and US Preview
  remain migration targets rather than retired surfaces. Preserved user-owned `output/`.
- [x] (2026-08-19) Replaced the provisional five custom rank bands with the ILO official exposure
  gradient/category and expose AI Work Pressure Rank as the precise relative statistic.
- [x] (2026-08-19) Refreshed the evidence registry through the 19 August 2026 cutoff, including current
  OpenAI, Anthropic, Microsoft, METR, NBER, OECD, ILO, MOM, IMDA, and SingStat evidence.
- [x] (2026-08-19) Created and validated the user-level `write-human-editorial-copy` skill and applied its
  evidence-first copy checks to every active public surface.
- [x] (2026-08-19) Replaced active V8 application imports and public scoring surfaces with V9.
- [x] (2026-08-19) Refreshed Singapore wages and labour evidence and dispositioned every active
  SSOC-keyed sidecar.
- [x] (2026-08-19) Migrated occupation, role, ranking, methodology, report, export, and responsive UI
  surfaces.
- [x] (2026-08-19) Rebuilt canonical, structured-data, sitemap, crawler, and answer-engine surfaces.
- [x] (2026-08-19) Ran the full release and browser verification suite, committed three coherent
  slices, pushed the branch, and updated draft pull request #4 for V9.

## Surprises & Discoveries

- Observation: The active 562-row universe is determined by the 2024 wage input rather than
  by the official SSOC taxonomy.
  Evidence: `scripts/score.ts` loads `data/raw/sg_occupations_complete_2024.json` as the
  occupation registry; the file contains 562 rows.
- Observation: Official SSOC 2024 correspondence is materially many-to-many.
  Evidence: 91 of 1,006 current entries map to more than one ISCO-08 unit group. The official
  workbook supplies no weights.
- Observation: Forty-seven 2020 codes are absent from the current registry.
  Evidence: 43 have one current successor; `24220`, `26375`, `33121`, and `33129` have
  multiple successors.
- Observation: The current public contract requires detailed wages and exposes modeled
  five-digit employment, although official data does not cover every occupation at that
  grain.
  Evidence: `src/lib/data/index.ts` uses required numeric wage and employment fields, while
  `src/lib/data/data-contract.ts` describes broad-total and US-proxy allocation.
- Observation: The previous site claimed MIT licensing without a `LICENSE` file or a clear
  separation between original code and third-party data terms.
  Evidence: V9 adds the MIT code license and makes the source-data rights boundary explicit on
  `/about`, `/press`, and `/data`.
- Observation: The official detailed definitions and alphabetical index were updated on
  24 June 2026, while both correspondence workbooks remain dated 21 March 2024.
  Evidence: The workbook title rows and generated `source-metadata.json` preserve those
  independent vintages.
- Observation: The 2025 MOM wage table covers 523 of 1,001 numeric SSOC 2024 occupations
  and all six published percentile cells are numeric for those rows.
  Evidence: The V9 builder validates 523 unique codes and the six basic/gross P25, median,
  and P75 values before accepting the source.
- Observation: Fourteen numeric SSOC 2024 occupations have no usable ILO 2025 value through
  the official correspondence; this is a mapping/source gap, not evidence of zero exposure.
  Evidence: `tests/v9-contract.test.ts` freezes the exact withheld-code set.
- Observation: The provisional uncommitted UI migration removed 3,630 lines and redirected
  roles, reports, comparisons, the calculator, US, and most ranking routes to generic pages.
  Evidence: the restored `static/_redirects` diff contained broad retirement redirects and
  the route diff showed 3,630 deletions. None of those removals was committed.
- Observation: A wider 19 August research pass found July 2026 OpenAI task-crossover work
  and 2026 Microsoft workplace synthesis missing from the existing registry.
  Evidence: the registry still points to January Anthropic evidence, O*NET 30.2, an older
  METR horizon date, and the pre-revision Humlum/Vestergaard title.

## Decision Log

- Decision: Publish the migration as V9 and make SSOC 2024 the only active Singapore
  taxonomy.
  Rationale: The universe, headline construct, public interface, and evidence semantics all
  change. Dual active taxonomies would obscure comparability.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep SSOC 2020 only in Git/release history and a route-only continuity artifact.
  Rationale: Historical reproducibility and broken-link prevention do not require a legacy
  scoring or data path.
  Date/Author: 2026-08-19 / Codex
- Decision: Use ILO 2025 `mean_score_2025` as the sole headline structural measure.
  Rationale: It is current, task-level, continuous, public, and ISCO-native. AIOE, Eloundou,
  Anthropic usage, and complementarity measure different constructs and remain separate.
  Date/Author: 2026-08-19 / Codex
- Decision: For multiple official ISCO matches, use the median available ILO value and
  publish the minimum and maximum; never invent mapping weights.
  Rationale: The correspondence contains no defensible occupation shares.
  Date/Author: 2026-08-19 / Codex
- Decision: Do not apply sub-major, major-group, or global score fallbacks.
  Rationale: Missing evidence is more credible than fabricated completeness.
  Date/Author: 2026-08-19 / Codex
- Decision: Remove numeric substitution, augmentation, likely-pathway, detailed-employment,
  jobs-affected, and wage-pool claims from the active V9 contract.
  Rationale: Retain pressure and risk interpretation, but do not disguise distinct evidence
  or unsupported detailed allocations as a calibrated probability or outcome forecast.
  Date/Author: 2026-08-19 / Codex
- Decision: Preserve all substantive Singapore product surfaces and migrate them in place.
  Historical V4-V8 reports remain accessible as dated archives; current rankings, reports,
  calculator, compare, groups, and synthetic roles are rebuilt from V9.
  Rationale: The route inventory has useful search authority and user journeys. Scientific
  repair does not require deleting the product.
  Date/Author: 2026-08-19 / Codex
- Decision: Call the headline statistic `AI Work Pressure Rank`; use `risk` for conditional
  interpretation across independent evidence rather than as a job-loss probability.
  Rationale: This retains clear human and search language while keeping the mathematical
  meaning exact and auditable.
  Date/Author: 2026-08-19 / Codex
- Decision: Resolve exact modern-title matches to current official SSOC 2024 occupations before
  constructing any non-official role estimate. Index only the remaining reviewed role pages and
  publish component, mapping and weighting sensitivity.
  Rationale: Modern-title queries answer real search needs, but the site must not publish a
  competing composite for an official occupation or imply fabricated role-level outcomes.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep `/occupation/{ssoc}` canonical and isolate legacy redirects from search and
  methodology modules.
  Rationale: The existing URL already has authority and the code is the stable official
  identifier.
  Date/Author: 2026-08-19 / Codex
- Decision: Preserve direct wage observations only; absence from MOM Table 4 remains null.
  Rationale: The table's establishment and employee scope is narrower than the full economy,
  and interpolation would erase both coverage limits and real uncertainty.
  Date/Author: 2026-08-19 / Codex

## Outcomes & Retrospective

The V9 generators now emit 1,001 official occupations, of which 987 receive a pressure rank and
14 remain explicitly unranked; 523 have a direct MOM detailed wage row. The modern-title layer
contains 88 queries: 67 resolve to official occupations, 18 use disclosed non-official
composites, and 3 are withheld. The sitemap contains 1,059 canonical URLs.

ILO 2025 remains the only headline owner. AIOE, Eloundou, observed Claude use, and potential
complementarity are withheld for all 1,001 occupations because the checked-in ISCO-to-SOC path
does not meet the V9 provenance standard. Current named-demand evidence covers 37 occupation
codes from 47 reviewed source labels; absence is never interpreted as weak demand. Historical
V3–V8 artifacts remain downloadable, noindex archives and no longer enter the current gate.

Two consecutive `release:generate` runs produced byte-identical current artifacts. `bun run verify`
passed typechecking, lint, formatting, 89 tests, and the V9 release contract; `bun run build`
completed the static production build. Headless Chrome passed 84 route/viewport combinations at
320, 375, 768, 1,024, and 1,440 pixels with no document overflow or console errors. Modern-title
search and compare aliases, role and calculator redirects, current SEO metadata, the wide scatter,
and archive noindex/schema boundaries were exercised. The branch is published in draft pull
request #4: `https://github.com/kirso/aiworkindex/pull/4`.

## Context and Orientation

`scripts/build-v9-release.ts` owns the current headline contract and reads the canonical SSOC 2024
registry, official correspondence, ILO 2025 exposure and MOM 2025 wages. `scripts/score.ts`,
`scripts/crosswalk.ts`, and `scripts/build-v8-release.ts` are archive-era code and cannot emit the
current release. Active routes load V9 through server-only adapters in `src/lib/data/v9.ts` and
`src/lib/data/v9-ui.server.ts`; the static occupation route is
`src/routes/occupation/[ssoc]`. Cloudflare Pages consumes `static/_redirects`,
`static/_headers`, and `static/_worker.js`.

The untracked `output/ai-work-index-review/` directory belongs to the user and must remain
untouched.

## Plan of Work

First, freeze the current V8 release boundary, add official SSOC 2024 snapshots with
checksums and source metadata, and build a deterministic registry containing all 1,006
official entries. Build the active SSOC 2024 to ISCO-08 scientific crosswalk from the
official workbook. Build search synonyms from the current alphabetical index. In a separate
compatibility directory, generate only the 43 exact legacy redirects; leave ambiguous old codes
unmatched rather than claiming continuity; add an import-boundary test that prevents this module
from reaching scoring.

Second, introduce the V9 contract. For every numeric occupation, collect ILO 2025 values for
all official ISCO matches. A row with at least one value receives the median, minimum,
maximum, source dispersion/category range, and a midrank AI Work Pressure Rank among eligible
occupations. The public category is the ILO official exposure gradient, not a custom
five-band percentile label. A row with no value remains unscored. AIOE, Eloundou, Anthropic usage, potential
complementarity, task detail, transitions, and Singapore labour evidence are independent,
nullable fields and cannot alter the headline rank.

Third, replace the 2024 wage input with MOM Occupational Wages 2025 and make wages nullable.
Refresh national and broad labour context through the latest official releases at their
published grain. Remove detailed employment estimates and derived wage-pool totals from the
active public contract. Inventory every existing SSOC-keyed sidecar and rebuild, retain as
broad/modelled context, archive, or retire it explicitly.

Fourth, migrate every retained public page and content surface. Occupation and synthetic-role
pages will lead with a direct pressure answer, then show structural exposure, observed use,
human complementarity, Singapore market evidence, risk interpretation, unknowns, and visible
citations. Rankings, calculator, comparison, groups, reports, and research pages stay
available and move to the same contract. Misleading historic route names may redirect to
human names without collapsing the route family. Tables and charts will fit ordinary desktop
shells and use stacked mobile representations where necessary.

Fifth, rebuild search and answer-engine discovery. Index all substantive numeric occupation
pages and all reviewed synthetic-role pages; unscored occupations must provide useful
official definition and missing-evidence context rather than thin content. Residual entries
have no public route. Structured data will include accurate Occupation, DefinedTerm, BreadcrumbList,
Dataset, Article, Organization, and WebSite entities. Remove the non-functional SearchAction
and mass-generated FAQ markup. Generate truthful last-modified dates, crawler-access tests,
current `llms.txt` conveniences, public citations, licensing notices, and an IndexNow helper.

Finally, update active methodology, research, source registry, release notes, changelog,
repository instructions, and all generated exports. Run data, contract, SEO, static-build,
responsive-layout, and browser validation before committing and publishing each coherent
slice.

## Concrete Steps

From `/Users/kirso/Developer/ai-work-index` run the new composable pipeline:

    bun run download:ssoc-2024
    bun run build:taxonomy
    bun run release:generate

Then verify:

    bun run verify
    bun run build

Expected core observations are `1006 total / 1001 occupations / 5 residual`,
`987 scored / 14 insufficient evidence`, `523 direct wage rows`, 43 exact legacy-code
legacy occupation redirects, one calculator canonical redirect and 67 generated modern-title
canonical redirects.

## Validation and Acceptance

- The active registry contains exactly 1,006 unique official SSOC 2024 entries.
- Five residual entries never enter ranking or public occupation routes.
- Exactly 987 numeric occupations are currently ranked and 14 are explicitly unscored.
- Every many-to-many ISCO mapping preserves all candidates and publishes its range.
- No active module reads SSOC 2020 compatibility data outside route generation.
- Wage coverage is direct, nullable, and contains 523 unique occupations; Administration
  Manager has a 2025 median gross wage of SGD 8,050.
- Demand, adoption, wages, observed use, complementarity, and transitions never change the
  GenAI task-exposure rank.
- No active surface presents pressure/risk as a calibrated probability, task share, causal outcome, detailed employment
  estimate, jobs-affected total, or proxy wage pool as observed truth.
- Existing calculator, comparison, role, ranking, group, report, methodology, research, data,
  about, occupation, and US Preview routes remain reachable after migration.
- Every modern-title query first checks for an official SSOC 2024 match. Remaining non-official
  roles reference only reviewed, unique current components, publish weighting/mapping sensitivity,
  and never emit an official rank or role-level wage, demand, employment, or job-loss estimate.
- Forty-three retired code URLs with exact successors redirect in one hop; ambiguous old codes do
  not claim continuity; no redirect-only URL appears in the sitemap.
- Every indexable page has one canonical, one H1, unique title/description, visible evidence,
  and accurate structured data.
- Representative pages have no document or unintended component overflow at 320, 375, 768,
  1024, 1280, and 1440 pixels.
- `bun test`, `bun run check`, `bun run lint`, `bun run format:check`, `bun run validate`,
  `bun run release:check`, and `bun run build` all pass.

## Idempotence and Recovery

Downloaders write to temporary files, validate workbook headers and counts, then replace raw
snapshots atomically. Builders sort deterministic output and may be rerun. Generated files
must never be repaired by hand. If a sidecar cannot migrate without legacy assumptions, mark
it unavailable and withhold its surface. Keep the final V8 Git tag until V9 is verified in
production. Do not reset or clean the worktree and never modify the user-owned review output.

## Artifacts and Notes

The final pull request records source checksums, registry/crosswalk counts, the sidecar disposition
manifest, route/sitemap changes, responsive browser-QA results, and complete verification output.

Implementation commits will be sliced as documentation and release boundary, canonical
taxonomy, V9 model, Singapore evidence, public UI, search/discovery, documentation/licensing,
and final release validation.

## Interfaces and Dependencies

The implementation uses Bun, TypeScript, SvelteKit 2 and Svelte 5 with adapter-static, Tailwind CSS 4,
Cloudflare Pages redirects, D3, and the existing `xlsx` package. It depends only on free
public SingStat, MOM, ILO, research, and platform documentation sources. Original code will
be MIT licensed; official and third-party data retain their own attribution and license terms.
