# Cut over Singapore occupations to SSOC 2024 and an evidence-first V9

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global
`exec-plan` skill.

## Purpose / Big Picture

AI Work Index currently ranks a 562-row wage-covered sample labelled as SSOC 2020. V9 will
instead use the complete official SSOC 2024 classification as the Singapore occupation
registry, use the ILO 2025 task-level GenAI measure as the sole owner of the headline
exposure rank, and report observed AI use, human complementarity, wages, demand, and other
labour evidence separately. A reader will be able to search the current Singapore
classification, distinguish measured evidence from modeled context, and see what is unknown
without encountering job-loss probabilities or economy-wide totals inferred from proxy
employment.

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
- [ ] Implement the V9 public contract and replace the active V8 scoring owner.
- [ ] Refresh Singapore wages and labour evidence and disposition every SSOC-keyed sidecar.
- [ ] Migrate occupation, role, ranking, methodology, report, export, and responsive UI
  surfaces.
- [ ] Rebuild canonical, structured-data, sitemap, crawler, and answer-engine surfaces.
- [ ] Run the full release and browser verification suite, commit coherent slices, push, and
  open the pull request.

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
- Observation: The site claims MIT licensing but has no `LICENSE` file and does not separate
  original code from third-party data terms.
  Evidence: `/about` and `/press` claim MIT licensing; repository root contains no license.
- Observation: The official detailed definitions and alphabetical index were updated on
  24 June 2026, while both correspondence workbooks remain dated 21 March 2024.
  Evidence: The workbook title rows and generated `source-metadata.json` preserve those
  independent vintages.

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
  Rationale: They collapse distinct evidence or rely on unsupported detailed allocations.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep `/occupation/{ssoc}` canonical and isolate legacy redirects from search and
  methodology modules.
  Rationale: The existing URL already has authority and the code is the stable official
  identifier.
  Date/Author: 2026-08-19 / Codex

## Outcomes & Retrospective

Implementation is in progress. This section will record the final generated counts, withheld
evidence, released routes, verification results, rank breaks, and remaining source gaps.

## Context and Orientation

`scripts/score.ts` currently owns the four-source V8 input blend and reads the 562-row wage
sample. `scripts/crosswalk.ts` contains the hand-written SSOC/ISCO/SOC mappings.
`scripts/build-v8-release.ts` emits the public compatibility layer. The application imports
generated occupation data through `src/lib/data/index.ts`; the static occupation route is
`src/routes/occupation/[ssoc]`. Cloudflare Pages consumes `static/_redirects`,
`static/_headers`, and `static/_worker.js`.

The untracked `output/ai-work-index-review/` directory belongs to the user and must remain
untouched.

## Plan of Work

First, freeze the current V8 release boundary, add official SSOC 2024 snapshots with
checksums and source metadata, and build a deterministic registry containing all 1,006
official entries. Build the active SSOC 2024 to ISCO-08 scientific crosswalk from the
official workbook. Build search synonyms from the current alphabetical index. In a separate
compatibility directory, generate only the 43 exact legacy redirects and four ambiguous
route pages; add an import-boundary test that prevents this module from reaching scoring.

Second, introduce the V9 contract. For every numeric occupation, collect ILO 2025 values for
all official ISCO matches. A row with at least one value receives the median, minimum,
maximum, a midrank percentile among eligible occupations, and one of five equal-width rank
bands. A row with no value remains unscored. AIOE, Eloundou, Anthropic usage, potential
complementarity, task detail, transitions, and Singapore labour evidence are independent,
nullable fields and cannot alter the headline rank.

Third, replace the 2024 wage input with MOM Occupational Wages 2025 and make wages nullable.
Refresh national and broad labour context through the latest official releases at their
published grain. Remove detailed employment estimates and derived wage-pool totals from the
active public contract. Inventory every existing SSOC-keyed sidecar and rebuild, retain as
broad/modelled context, archive, or retire it explicitly.

Fourth, migrate the public pages and content. Occupation pages will lead with a direct answer,
then show structural exposure, observed use, human complementarity, Singapore market
evidence, unknowns, and visible citations. Current rankings will use exposure language.
Misleading historic route names will permanently redirect to human names. Tables and charts
will fit ordinary desktop shells and use stacked mobile representations where necessary.

Fifth, rebuild search and answer-engine discovery. Index only scored occupation pages;
unscored numeric pages remain useful on site but use `noindex,follow`, and residual entries
have no public route. Structured data will include accurate Occupation, BreadcrumbList,
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
    bun run download:sg-labour
    bun run build:taxonomy
    bun run build:market
    bun run build:model:v9
    bun run build:sidecars
    bun run build:release

Then verify:

    bun test
    bun run check
    bun run lint
    bun run format:check
    bun run validate
    bun run release:check
    bun run build

Expected core observations are `1006 total / 1001 occupations / 5 residual`,
`987 scored / 14 insufficient evidence`, `523 direct wage rows`, and
`43 redirects / 4 migration pages`.

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
- No active surface presents a probability, task share, causal outcome, detailed employment
  estimate, jobs-affected total, or proxy wage pool as observed truth.
- Forty-three retired code URLs redirect in one hop; four ambiguous codes are useful noindex
  pages; none appears in the sitemap.
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

The final pull request must contain source checksums, registry/crosswalk counts, the sidecar
disposition manifest, V8-to-V9 rank-break documentation, route/sitemap diffs, representative
desktop/mobile screenshots, and complete verification output.

Implementation commits will be sliced as documentation and release boundary, canonical
taxonomy, V9 model, Singapore evidence, public UI, search/discovery, documentation/licensing,
and final release validation.

## Interfaces and Dependencies

The implementation uses Bun, TypeScript, SvelteKit 5 with adapter-static, Tailwind CSS 4,
Cloudflare Pages redirects, D3, and the existing `xlsx` package. It depends only on free
public SingStat, MOM, ILO, research, and platform documentation sources. Original code will
be MIT licensed; official and third-party data retain their own attribution and license terms.
