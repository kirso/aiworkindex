# SSRN Methodology Abstract Draft

> V9 draft for maintainer review. Do not submit without checking it against the tagged release.

## Title

AI Work Index: A Reproducible GenAI Task-Exposure Index for Singapore Occupations

## Abstract

This paper describes V9 of the AI Work Index, a deterministic measure of relative generative-AI
task exposure for Singapore occupations. The release begins with all 1,001 numeric occupations in
the Singapore Standard Occupational Classification 2024. It maps each occupation through the
official SSOC 2024 to ISCO-08 correspondence and uses the International Labour Organization's 2025
mean task-exposure measure as the sole headline input. Among 987 occupations with usable evidence,
the AI Work Pressure Rank is a tie-aware midrank percentile. Fourteen occupations remain unranked.

For occupations with multiple official ISCO matches, V9 publishes every candidate, the median
scored value used for ranking, the full minimum-to-maximum range, task-score dispersion, and the
official ILO exposure categories. It does not apply occupation-group fallbacks or infer missing
values. Direct Ministry of Manpower wage observations are available for 523 occupations. Current
demand labels, broad labour-market conditions, firm AI adoption, observed use, and potential
complementarity remain separate evidence and cannot alter the rank.

The release also reviews 88 familiar modern job-title queries. Sixty-seven resolve to an official
SSOC 2024 occupation, 18 use disclosed editorial composites with weighting-sensitivity checks, and
three are withheld because a fixed mapping would be misleading. Composite estimates are not
official occupation ranks and do not receive role-level wage, demand, employment, or job-loss
estimates.

V9 measures technical task overlap, not automation, displacement, employment change, or an
individual probability of job loss. Important limitations include the lack of representative
occupation-level AI-use data for Singapore, incomplete detailed wage and demand coverage, no
employment weights for official many-to-many mappings, and insufficient same-grain outcome data for
forecast validation. The open-source pipeline, frozen source metadata, JSON and CSV exports, and
checksummed release manifest make the published transformation reproducible from free public data.

## Suggested JEL Codes

J21; J23; J24; O33; C81

## Suggested Keywords

Artificial intelligence; occupational exposure; tasks; Singapore; occupations; measurement;
reproducible data

## Reproducibility Links

- Methodology: https://aiworkindex.com/methodology
- Data downloads: https://aiworkindex.com/data
- Source code: https://github.com/kirso/aiworkindex
- V9 release report: https://aiworkindex.com/reports/v9-release
- Citation page: https://aiworkindex.com/press
