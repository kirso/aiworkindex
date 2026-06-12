# OSF Forecast-Horizon Pre-Registration Draft

## Study Title

Pre-registered forecast-horizon validation for the AI Work Index V7.1 structural pressure baseline

## Baseline

The frozen baseline is the May 2026 V7 occupation snapshot used by the published
forecast-horizon sidecar. The baseline is fixed before any post-baseline MOM labour-market quarter
is available in the repository.

## Primary Question

Do clusters with higher frozen structural AI pressure subsequently show weaker labour-market
outcomes than clusters with lower pressure?

## Outcomes

Primary outcomes are official MOM labour-market outcomes already materialised in the outcome-panel
schema:

- Vacancy-rate movement
- Retrenchment incidence/count movement
- Hiring net-pressure or re-entry signals where an official series is available

Postings volume, AI-skill share, and wage movement remain reserved fields until the data pipeline
has repeatable time-series support.

## Horizons

Evaluate t+1Q, t+2Q, and t+4Q from the frozen baseline once the relevant post-baseline quarters are
published.

## Naive Benchmark

Use a random-walk / historical-trend benchmark. A structural-risk directional call should beat the
naive baseline before being promoted beyond sidecar status.

## Statistical Protocol

Use the same tie-corrected Spearman and pairwise-directional accuracy helpers used by the
repository validation artifacts. The promotion gate requires at least four post-baseline quarters
and a pooled exact binomial sign test over the pre-specified directional calls. Until that threshold
is met, the artifact remains `pending_sufficient_quarters` and non-promoted.

## Reporting Rules

- Report pending status when fewer than four post-baseline quarters are available.
- Publish null or negative results unchanged.
- Do not use the sidecar as occupation-level evidence.
- Do not change the frozen baseline after registration.
