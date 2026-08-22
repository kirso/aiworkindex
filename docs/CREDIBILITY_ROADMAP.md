# Historical V7.1 Credibility Roadmap (June 2026)

> **Historical document.** This is a closeout ledger for a superseded V7.1 branch, not the current
> plan of record. Its `net_risk`, band, calibration, and sidecar claims do not describe V9. Use
> `README.md`, `docs/RELEASE_CHECKLIST.md`, the V9 execution plan, and `/methodology` for the current
> scientific and release boundary.

Scope: the credibility and product work agreed in the June 2026 review sessions. This document is
the closeout ledger for the `v7.1-buffer-correction-and-ux` branch.
Slices 0–3 did not change `net_risk` or `risk_band`; each shipped behind a green `bun run verify`.

## Track A — code and artifacts (sequential)

### Slice 0 — honesty and acknowledgment patch (shipped)

Methodology copy + citations only. No score changes, no new scoring machinery.

- Citation hygiene: Anthropic 2026 = "14% lower rate of entering highly AI-exposed occupations,
  ages 22–25, vs 2022 baseline, marginally significant" (verified verbatim). Eloundou = Science 2024
  in user-facing labels.
- Backtest honesty: 2/4 cluster directional checks is statistically indistinguishable from chance
  at n = 4 binary checks (P(≥2 of 4 | coin flip) ≈ 0.69); label it underpowered by construction and
  state the pooling intent (≈24 directional calls after ~8 quarters before pass/fail claims).
- BLS framing: the existing BLS 2024–2034 projections check (ρ = −0.14, p < 0.01) is the same design
  as Anthropic's March 2026 projections test. Frame as small-effect convergent evidence, consistent
  with field-wide findings that realized stock-level employment effects are not yet detectable
  (Bonney/Census, Humlum & Vestergaard, NY Fed).
- MOM AI-adoption report (Apr 2026): primary **Singapore adoption/context anchor** — firm/sector
  level, NOT occupation-level validation of net_risk. Data already in `ai-in-singapore.json`
  (`mom_firm_ai_adoption_2026`); keep "context, never a score input".
- Labor-economics caveats (Known Limitations, crisp bullets):
  1. displacement realizes through reduced hiring of entrants, not layoffs (entrant vs incumbent
     risk are different objects);
  2. wage compression and role redesign are channels separate from job loss; Singapore institutions
     (NWC flexible wage, PWM floors) push adjustment toward wages/hiring rather than layoffs;
  3. foreign-workforce buffer (~40% of employment is non-resident; pass non-renewal absorbs shocks
     before resident employment falls) is not modelled;
  4. transition scores are structural adjacency, not retraining efficacy (Card-Kluve-Weber 2018;
     no causal SkillsFuture evaluation exists);
  5. exposure measurement instability: LLM-annotator divergence up to 3.6× (Yin, Vu & Persico 2026)
     and platform-selection bias, 42–93% attenuation under workforce reweighting (Yin & Ogut 2026).
- Source registry: add Canaries 2025, Card-Kluve-Weber 2018, Autor et al. 2024 "New Frontiers",
  Lewandowski et al. 2022, Yin/Vu/Persico 2026, Yin & Ogut 2026. Regenerate research library.

### Slice 1 — sensitivity / ablation analysis (shipped)

As specified in the approved implementation plan (verified against repo 2026-06-10):
shared `src/lib/utils/validation-stats.ts` (move spearman + PRNG, byte-identical re-run proof),
persist the 4 demand-persistence rank inputs, `scripts/build-sensitivity-analysis.ts` with 4dp
self-fidelity gate, OAT perturbations, seeded ±25% Monte-Carlo (N=1000), full artifact wiring
(triple-write, manifest, validate, site-status, methodology card).

### Slice 2 — external anchors (shipped except permissioned SSG payload)

Validation = occupation-level; context = firm/sector-level. Do not conflate.

- IMF-SG convergence script as specified in the approved plan (employment-weighted
  exposure × complementarity bins, both exposure cuts, percentile-internal caveat first).
  Role: Singapore macro benchmark.
- BLS-2034 extension: extend the existing `validate-bls-crosswalk.ts` / calibration diagnostics
  with the Anthropic-style slope specification (projected-growth change per exposure increment),
  explicitly distinguished from realized outcomes. No duplicate validation story.
  Status: BLS-2034 and IMF artifacts are fully shipped and release-gated.
- SSG "AI Potential on Tasks" convergence: **unblocked by permission, not yet executable from the
  repo.** Written permission means the dashboard task classifications can be used with attribution,
  but the permissioned source payload and its exact source URL are not committed here. The next
  implementation step is now mechanical: place the approved 38,158-record SSG task export plus the
  official Skills Framework XLSX in `data/raw/external/ssg/`, build a no-raw-redistribution
  convergence artifact, and wire it through the same triple-write, manifest, validate, site-status,
  and methodology pattern as the BLS/IMF artifacts. The public artifact should publish only
  aggregate match counts, join quality, class-share alignment, and correlations against
  `exposure_v7`; it must not redistribute the raw SSG task table unless the written permission
  explicitly allows it.

### Slice 3 — forecast-horizon sidecar (shipped)

As specified in the approved plan: outcome panels (official MOM labour outcomes only — vacancy,
hiring, retrenchment, re_entry; postings/AI-share/wage deferred to v2),
`backtest-forecast-horizons.ts` against the frozen May 2026 snapshot,
`post_baseline_quarters_available: 0`, `status: pending_sufficient_quarters`, sidecar guards.
Plus: publish the protocol (naive random-walk benchmark, pooled sign-test rules) now —
do not imply any forecast evidence exists yet. OSF/timestamped pre-registration when frozen
forecasts are first staked.

### Slice 4 — product closeout (shipped) and research backlog

- Shipped: high risk × low transition capacity quadrant, occupation-page callouts, task-level
  evidence, named insulation channels, demand-axis honest reframe, and methodology changelog with
  per-release score diffs.
- Shipped in V8 sidecars: confidence ratings, scenario families, adoption/diffusion context, and
  age-structure attrition context. All are non-scoring artifacts and do not change `net_risk` or
  `risk_band`.
- Deferred by design: editable user task table and demand-axis recalibration. These require either
  a new interaction design pass or a score-changing release cycle.

### V8 research queue (deferred, each needs its own design pass)

- Per-occupation IPCC-style confidence ratings — shipped as a non-scoring sidecar in
  `confidence-ratings.json` (PR #3).
- Korinek scenario families — shipped as `scenario-families.json`.
- Adoption/diffusion context — shipped as `adoption-diffusion.json` from MOM 2026 firm AI-adoption
  evidence; remains context-only.
- Occupational age-structure "attrition absorber" annotation — shipped as `age-structure.json`
  from existing worker-profile tables.
- Ensemble vintage refresh: Anthropic observed-exposure (Mar 2026, open data), verify ILO 2025
  refined index vintage, evaluate OECD capability-gap measure as fifth non-LLM-annotated source.
- Detection-and-attribution framing for the quarterly monitor (Yale dissimilarity test on MOM
  clusters).

## Track B — credibility infrastructure (repo-prepped; external submissions remain manual)

1. Trust pages: named author + bio + contact, "self-funded, no sponsors" statement, suggested
   citation + BibTeX, corrections log, and `/press` page are shipped.
2. Academic on-ramp, in order: ORCID → Zenodo DOI per release → SSRN methodology paper →
   OSF forecast pre-registration → Scientific Data / Data in Brief data-descriptor submission.
   Repo-side submission prep lives under `docs/academic/`; account creation, DOI minting, SSRN
   upload, and OSF registration still require the maintainer's personal accounts.
3. Singapore sequence: Academia.SG essay → CNA/ST commentary pegged to a MOM quarterly release →
   IPS/IAL seminar. Position as complementing MOM's adoption survey, never contradicting official
   statistics. Track SMU ResWORK (forthcoming vacancy-based SG AI-exposure index — closest future
   external validator/competitor).

## Key verified facts this plan relies on (checked against primary sources, June 2026)

- MOM "Adoption of Artificial Intelligence Among Firms" (30 Apr 2026, n=2,560 establishments):
  28.5% adopting, 6.2% of adopters reduced headcount, 18.9% redesigning roles, 13.9% creating AI
  roles; ICT 74.1% / professional services 57.5% / finance 56.4%.
- Anthropic Massenkoff & McCrory (5 Mar 2026): 14% drop in job-finding rate INTO exposed
  occupations for ages 22–25 vs 2022, barely significant, none for >25; BLS projections slope
  −0.6pp per +10pp task coverage.
- Census BTOS: ~10%/14% (legacy narrow question) vs 18% / 32% employment-weighted (revised broad
  question, Nov 2025–Jan 2026). Always name the question wording when citing adoption.
- NBER WP 35110 (Yin, Vu & Persico 2026): 3.6× divergence, 57% agreement across annotating LLMs.
- arXiv 2605.21743 (Yin & Ogut 2026): 42–93% attenuation under BLS workforce reweighting.
