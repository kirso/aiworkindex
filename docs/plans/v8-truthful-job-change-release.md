# Release a truthful, marketable V8

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept current while implementation proceeds.

## Purpose / Big Picture

V8 keeps the search-facing promise of an AI job-risk calculator but replaces probability-like displacement claims with a relative, auditable AI Exposure Rank. Singapore remains the only live scored market. Users receive a 0–100 relative score, a likely change pathway, separate labor-market context, categorical evidence confidence, and practical transition evidence.

## Progress

- [x] (2026-07-15) Audited the live V7 repository, methodology, generated artifacts, validation, and current labor-economics evidence.
- [x] (2026-07-15) Locked product decisions: one V8 release, clean public data break, Singapore live, open/official data only, no dedicated shadow system.
- [x] (2026-07-15) Implemented the V8 score contract, deterministic generator, clean JSON/CSV exports, pathways, categorical confidence, and specification sensitivity.
- [x] (2026-07-15) Migrated the public Singapore experience, calculator, SEO intent pages, methodology, structured data, LLM surfaces, release metadata, and downloads.
- [x] (2026-07-15) Enforced Singapore-only publication; removed U.S./global score routes and sitemap entries; aligned provenance, claims, freshness, and release gates.
- [x] (2026-07-15) Deduplicated BLS inference by crosswalk signature, published the null result, regenerated all artifacts and OG images, and passed the full verification suite.

## Surprises & Discoveries

- Observation: The repo already contains adoption, age, mobility, scenario, confidence, and forecast-readiness artifacts, but they are disconnected and sometimes more precise than their evidence permits.
  Evidence: `data/adoption-diffusion.json`, `data/age-structure.json`, `data/v5-sidecars.json`, and `src/lib/data/forecast-engine.ts`.
- Observation: The current U.S. artifact violates the declared maximum fallback-share gate.
  Evidence: 276/832 major-group fallbacks and 554/832 non-exact mappings versus a 20% ceiling.
- Observation: The current public copy frequently formats heuristic indices as percentages and probabilities.
  Evidence: repo-wide references to `net_risk * 100`, “displacement risk,” and “task overlap.”
- Observation: Deduplicating repeated SSOC-to-SOC outcomes eliminates the previously claimed BLS significance.
  Evidence: V8 check uses 243 unique crosswalk signatures rather than 530 duplicated SSOC rows; Spearman rho is 0.013 (p = 0.84) and the slope is not significant.
- Observation: No suitable open official occupation-level series isolates entry-level hiring.
  Evidence: V8 publishes `entry_level_sensitivity: unknown` instead of deriving a circular result from the score.

## Decision Log

- Decision: `ai_exposure_rank` is a within-market percentile index, not a probability.
  Rationale: A percentile supports a compelling 0–100 result while admitting exactly what the number means.
  Date/Author: 2026-07-15 / Codex with user approval.
- Decision: Demand, adoption, attrition, and transitions remain separate evidence dimensions rather than hidden headline weights.
  Rationale: Ordinary employment economics changes the pathway through which exposure resolves; it does not justify a calibrated job-loss probability.
  Date/Author: 2026-07-15 / Codex with user approval.
- Decision: No standalone shadow-mode infrastructure.
  Rationale: This is a hobby project; the feature branch is the staging boundary and V8 publishes once release gates pass.
  Date/Author: 2026-07-15 / Codex with user approval.

## Outcomes & Retrospective

V8 now publishes a clean, breaking public contract for 562 Singapore occupations. A score such as 72/100 has one stable meaning: the occupation is more exposed to current AI capabilities than approximately 72% of the Singapore reference occupations. Substitution, augmentation, demand, adoption, attrition, transitions, evidence confidence, and specification sensitivity remain visible dimensions. Synthetic roles are labelled estimates. U.S. and global score routes are removed rather than merely disclaimed.

Verification completed successfully: 40 methodology tests, 222 scientific/data validation checks, Svelte type checking, ESLint, Prettier, production static build, OG regeneration, and the static SEO/release audit all pass. The production build still reports large JavaScript chunks; that is a performance concern, not a V8 methodology or release-contract blocker.

## Context and Orientation

`scripts/score.ts` generates the internal V7 occupation dataset. `src/lib/data/index.ts` defines its runtime contract. `scripts/export-json.ts` publishes downloadable artifacts. V8 will preserve V7 inputs for historical reproducibility while generating a clean current public contract and migrating all current user-facing pages to V8 semantics.

## Plan of Work

Create a deterministic V8 projection from the canonical Singapore occupations. Rank the exposure ensemble, structural substitution pressure, and augmentation potential with midrank percentiles; attach official demand, adoption, attrition, transition, confidence, and sensitivity evidence; and derive a small explicit pathway decision table. Replace current UI and metadata interpretations with the V8 contract. Withdraw non-ready country scores. Update methodology, claims, exports, tests, and release checks so misleading probability language or legacy current fields fail the build.

## Concrete Steps

From the repository root, implement and regenerate with `bun run build:release-data`. Then run `bun run test:methodology`, `bun run validate`, `bun run check`, `bun run lint`, `bun run format:check`, `bun run build`, and `bun run release:check`. Successful completion requires every command to exit zero and the generated current V8 artifacts to agree byte-for-byte across internal and public copies.

## Validation and Acceptance

All 562 Singapore occupations must have a V8 score and evidence profile. Public score copy must state index points and percentile interpretation, never probability or percent of tasks. U.S. and proxy-heavy country scores must not appear in the current sitemap. BLS validation must use independent clusters. README, claims, downloads, structured data, rendered pages, and release metadata must agree.

## Idempotence and Recovery

All generators overwrite deterministic artifacts and may be rerun. Historical versioned V7 files remain immutable. If a build step fails, fix the earliest failing generator or validator and rerun from that step before running the complete release pipeline. Do not use destructive git recovery; preserve the pre-existing untracked review report under `output/ai-work-index-review/`.

## Artifacts and Notes

The repo-grounded audit is available locally at `output/ai-work-index-review/report.html` and is not part of the V8 product release.

## Interfaces and Dependencies

V8 depends only on the repository's Bun/TypeScript/SvelteKit toolchain and already vendored or openly available official and academic inputs. No paid data source, model API, database migration, or LLM scoring call is introduced.
