# SSG Task-Convergence Protocol

> V9 research protocol. This is not an active score input and cannot change AI Work Pressure ranks.

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

Build a versioned `ssg-convergence-v9.json` only after the input contract is reproducible:

- Keep it outside the current release manifest until it passes the validation gate.
- Add validate checks for existence, source status, join count/rate, aggregate-only output, and
  source checksums.
- Publish it as a clearly labelled research comparison, not headline evidence.

## Metrics

Minimum public metrics:

- Permission status and source vintage.
- Raw task row count and joined task row count.
- Exact join rate to the official Skills Framework workbook.
- Unweighted SSG AI-potential class shares at the source's task and role grains.
- Rank/correlation between V9 ILO mean task exposure and SSG-derived task potential only for
  transparently joined occupations.
- Clear caveat that SSG is Singapore-native task evidence, not a direct job-loss forecast.
- No employment-weighted result unless a free, same-grain official employment series is available.
