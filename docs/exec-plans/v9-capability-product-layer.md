# Add a multidimensional capability layer to V9

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository has no repository-level `PLANS.md`, so this plan follows the global
`exec-plan` skill. It extends the completed V9 scientific and product work without changing the
ILO-owned AI Work Pressure Rank.

## Purpose / Big Picture

V9 currently gives a reader one strong headline: the relative position of an SSOC 2024
occupation on the ILO 2025 generative-AI task-exposure measure. After this work, a reader can also
see how close current AI capabilities are to nine different kinds of work, compare those profiles
across jobs, and interpret them beside Singapore pay, demand, adoption and workforce context.

The capability layer is a mapped international comparison, not a Singapore measurement. It uses
the public OECD 2026 AI Capability Gap dataset and only exact relations in the checked-in official
ESCO–O*NET crosswalk. It never changes the pressure rank, never fills an unavailable SSOC record
from a broader occupation and never becomes a job-loss score.

## Progress

- [x] (2026-08-21) Downloaded and inspected the public OECD workbook, codebook and licence.
- [x] (2026-08-21) Confirmed the workbook contains 879 O*NET 30.3 occupations, nine capability
  gaps, nine job-demand ratings and a CC BY 4.0 licence.
- [x] (2026-08-21) Measured raw candidate coverage: 698 of 1,001 SSOC occupations have at least
  one OECD row through exact ESCO–O*NET relations; exact-plus-close would cover 929.
- [x] (2026-08-21) Found that exact crosswalk relations do not establish five-digit SSOC identity;
  AI/ML engineer incorrectly inherited a computer-numerical-control programmer candidate.
- [x] (2026-08-21) Added a conservative official-title identity gate. It publishes 68 profiles and
  leaves all other occupations explicitly unavailable.
- [x] Build and validate the deterministic capability-profile artifact.
- [x] (2026-08-21) Added capability and Singapore-context views to occupations, comparisons, the checker and the
  flagship explorer.
- [x] (2026-08-21) Added public documentation, a capability report, downloads, discovery and
  release governance.
- [x] (2026-08-21) Regenerated, tested, linted and built V9, then completed automated and visual
  browser QA across mobile, tablet and desktop widths.

## Surprises & Discoveries

- Observation: the OECD landing page links a complete row-level workbook even though the existing
  V9 crosswalk audit recorded the row artifact as unavailable.
  Evidence: `data/raw/external/oecd-ai-capability-gap-2026.xlsx` contains sheets named `README`,
  `Data`, `Scenario` and `Codebook`; its README states 879 occupations and CC BY 4.0.
- Observation: the existing repository already has a defensible official transfer chain, but its
  coverage differs sharply by relation rule.
  Evidence: exact relations yield 698 SSOC records; exact plus close relations yield 929. The
  published layer will prefer lower coverage with clearer semantic identity.
- Observation: the workbook uses O*NET 30.3 while the official ESCO–O*NET crosswalk identifies
  O*NET-SOC 2019.
  Evidence: the workbook codebook names O*NET 30.3 and the checked-in crosswalk metadata names
  O*NET-SOC 2019. Publication therefore requires exact code continuity, retained O*NET titles,
  candidate counts and a visible version-transfer limitation.
- Observation: an exact ESCO–O*NET relation is still only a candidate after an SSOC occupation has
  entered through its broader ISCO group.
  Evidence: SSOC 25143 Artificial intelligence/Machine learning engineer produced the exact-linked
  O*NET candidate 51-9162.00 Computer Numerically Controlled Tool Programmers. The candidate is
  now rejected and the occupation remains unavailable in the capability layer.

## Decision Log

- Decision: Keep the ILO pressure rank as the only headline score.
  Rationale: OECD capability proximity and ILO GenAI task exposure are related but distinct
  constructs. Combining them would hide disagreement and manufacture precision.
  Date/Author: 2026-08-21 / Codex
- Decision: Treat exact ESCO–O*NET relations as candidate generation, then require conservative
  detailed-title identity against the official SSOC title.
  Rationale: exact relation semantics apply to ESCO and O*NET concepts, not automatically to every
  five-digit SSOC occupation inside the mapped ISCO group. Search synonyms, examples and looser
  relations are excluded. Missing profiles are more credible than broad-group substitutions.
  Date/Author: 2026-08-21 / Codex
- Decision: Aggregate multiple exact candidates with a median and retain the minimum, maximum,
  candidate count, O*NET codes and titles for every measure.
  Rationale: SSOC-to-ISCO and ISCO-to-O*NET are sometimes many-to-many; a single unqualified value
  would conceal mapping sensitivity.
  Date/Author: 2026-08-21 / Codex
- Decision: Use horizontal bars as the primary capability visual.
  Rationale: nine dimensions with different source maxima are easier to compare and explain as
  normalised bars than as an unlabeled radar. Colour is supporting emphasis, not the only encoding.
  Date/Author: 2026-08-21 / Codex

## Outcomes & Retrospective

The capability layer now covers all 1,001 SSOC records with an explicit status. It publishes 68
profiles from 68 OECD rows; 698 records had a raw exact crosswalk candidate, but 630 of those were
rejected because the detailed Singapore title did not pass the identity gate. The other 933
records remain visibly unavailable, without broad-group or synonym fallback.

Readers can use the separate capability view on official occupation pages, in Compare, in the
personal work checker, on the homepage occupation map and in the new `/reports/ai-capabilities`
report. The release pipeline publishes a checksummed JSON artifact, includes the layer in search
and discovery metadata and asserts that it has no effect on the ILO headline.

Final validation: `bun run verify` passed with 132 tests, zero Svelte diagnostics and a green V9
release check; `bun run build` wrote the static site; strict editorial lint scanned 29 affected
files with zero warnings. Browser QA covered 24 route-and-width cases from 320 to 1,440 pixels with
no overflow, broken images, console errors or page errors. A Playwright interaction check verified
the map switch at 375 pixels and its `aria-pressed` state. The only browser warning was the expected
Ahrefs analytics message on localhost.

The outcome is intentionally conservative rather than exhaustive. Detailed Singapore-level AI
adoption and causal employment effects remain unavailable, other external occupation sidecars stay
withheld until their transfer chains can be verified and OECD profiles outside the 68-title subset
must not be inferred from the broader exact-candidate pool.

## Context and Orientation

`data/occupations-v9.json` remains the canonical V9 occupation release. `scripts/build-v9-release.ts`
owns the ILO headline. `data/v9-economic-observatory.json` contains national, industry and broad
occupation-group Singapore labour context with `headline_effect: none`.

The new builder will be `scripts/build-v9-capability-profiles.ts`. It will read the pinned OECD
workbook, the SSOC 2024 registry and the checked-in external crosswalk audit. It will write
byte-identical artifacts to `data/v9-capability-profiles.json`,
`src/lib/data/v9-capability-profiles.json` and `static/data/v9-capability-profiles.json`.

`src/lib/data/v9-capability-profiles.ts` will expose a typed server adapter. Product components will
consume the adapter rather than importing the full artifact into global client bundles.

## Plan of Work

First, add source metadata and a deterministic builder. The builder asserts the workbook checksum,
filters valid O*NET rows, validates all nine domain scales, rejects duplicate codes, follows only
exact O*NET candidates recorded for official SSOC-to-ISCO mappings, then applies the detailed-title
identity rule. It emits coverage and missingness for all 1,001 occupations and publishes only the
68 profiles that pass both gates.

Second, add a source-backed capability component to official occupation pages. It will answer two
plain-language questions: where current AI is closer to the work, and which capabilities the job
demands most. It will show mapping range and source titles through progressive disclosure. The
existing economic panel will show richer workforce composition and the top industries that supply
context, while retaining its broad-grain label.

Third, extend the UI index and comparison page so users can compare capability profiles without
mixing them into pressure, pay or demand. Extend the checker with a compact profile summary. Add a
capability mode to the flagship occupation map; unavailable records remain visibly hatched.

Fourth, add a public capability report and update methodology, technical appendix, data downloads,
research, reports, sitemap, LLM guides, site status, release manifest and release checker. Document
the SkillsFuture and detailed Singapore adoption layers as acquisition gates rather than pretending
they are absent or already integrated.

Finally, regenerate all V9 artifacts. Prove the ILO headline artifact is byte-identical before and
after the capability build. Run data-quality tests, strict copy lint, type checking, the full suite,
release checks, the static build and browser QA at representative mobile and desktop widths.

## Concrete Steps

Run from `/Users/kirso/Developer/ai-work-index`:

    bun run build:capabilities:v9
    bun test tests/v9-capability-profiles.test.ts
    bun run release:generate
    bun run verify
    bun run build
    bun run qa:browser:v9

Run the public-copy check after prose changes:

    python3 /Users/kirso/.codex/skills/write-human-editorial-copy/scripts/lint_copy.py --strict \
      src/lib/components/product/CapabilityProfile.svelte \
      src/routes/occupation src/routes/compare src/routes/will-ai-take-my-job \
      src/routes/reports/ai-capabilities src/routes/methodology src/routes/data

## Validation and Acceptance

- All 1,001 SSOC occupations receive one capability-layer status; none are dropped or duplicated.
- Publication coverage equals the independently recomputed exact-title-identity coverage; raw
  exact candidate coverage remains separately reported.
- Every published overall and domain value preserves median, minimum, maximum and candidate count.
- Every candidate identifies its O*NET code and title, and uses an exact crosswalk relation.
- No close, broad or narrow relation enters a published profile.
- No OECD field changes `data/occupations-v9.json`, the ILO pressure percentile or category.
- Homepage, occupation, comparison and checker views label capability proximity as mapped OECD
  evidence, not Singapore adoption or job-loss risk.
- Broad Singapore workforce and adoption data remain visibly broad and are not copied into
  detailed occupation records.
- Charts show units, source, missingness and non-colour distinctions and fit 320, 375, 768, 1,024
  and 1,440 pixel widths without horizontal overflow.
- Strict copy lint, Svelte checks, tests, release checks and static build pass.

## Idempotence and Recovery

The builder and release generators are deterministic and safe to rerun. Generated JSON must be
repaired by rerunning its owner, never by hand editing. The worktree already contains V9 changes
and unrelated untracked `.cursor/` and `output/ai-work-index-review/` paths; never reset, clean or
stage them wholesale.

If the OECD workbook, licence, crosswalk checksum or schema changes, fail the build and review the
source rather than accepting a silent update. If an occupation lacks exact candidates, keep the
profile unavailable. If UI work must be rolled back, remove only the capability consumers; the
separate artifact cannot affect the headline.

## Artifacts and Notes

Pinned OECD workbook checksum:
`11643c1e5aa002613a8652c15aa93975652089eda5d005017e7ea165ead24dcd`.

Source profile: 879 valid OECD occupation rows, 1,001 SSOC occupations, 698 with at least one raw
exact candidate, 929 with at least one exact-or-close candidate and 68 published profiles after the
conservative official-title identity gate.

## Interfaces and Dependencies

The work uses Bun, TypeScript, SvelteKit 2, Svelte 5, `xlsx`, modular D3, the existing Lyra design
tokens, the SSOC 2024 registry, ESCO v1.1.0 classification, the official ESCO–O*NET v1 crosswalk,
O*NET 30.3 identifiers and the OECD 2026 workbook. It adds no paid data source and no client-side
chart runtime.
