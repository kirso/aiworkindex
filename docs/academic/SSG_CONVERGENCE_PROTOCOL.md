# SSG Task-Convergence Protocol

## Status

Written permission has been granted to use the SkillsFuture Singapore AI Potential on Tasks
dashboard classifications with attribution. The source payload and exact source URL are not
committed in this repository, so the convergence artifact is not yet executable from a clean clone.

## Input Contract

Place permissioned inputs under `data/raw/external/ssg/`:

- `ai-potential-on-tasks.json` or `.csv`: one row per Skills Framework task, including task text,
  role/job mapping, and SSG AI-potential class.
- `skills-framework.xlsx`: official Skills Framework role/task workbook used for the join.
- `README.md`: short provenance note with source URL, access date, and the permission wording or a
  private reference to where the permission is stored.

Do not commit raw SSG task records unless the written permission explicitly allows redistribution.
If redistribution is not allowed, keep raw inputs local and commit only aggregate convergence
artifacts.

## Artifact Contract

Build `ssg-convergence.json` with the same release-governance pattern as the BLS, IMF, sensitivity,
and forecast artifacts:

- Triple-write to `data/backtests/`, `src/lib/data/backtests/`, and `static/data/backtests/`.
- Add release-manifest entry.
- Add validate checks for existence, source status, join count/rate, aggregate-only output, and
  site-status parity.
- Add a methodology Validation card.
- Add site-status headline stats.

## Metrics

Minimum public metrics:

- Permission status and source vintage.
- Raw task row count and joined task row count.
- Exact join rate to the official Skills Framework workbook.
- Employment-weighted and unweighted SSG AI-potential class shares.
- Rank/correlation between occupation-level `exposure_v7` and SSG-derived task potential.
- Clear caveat that SSG is Singapore-native task evidence, not a direct job-loss forecast.
