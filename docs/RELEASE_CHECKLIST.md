# V9 Release Checklist

Use this checklist for the current Singapore SSOC 2024 release. V1–V8 builders and data are
archives; they must never be used to generate current public artifacts.

## Generate

- Run `bun run release:generate`.
- Confirm the build reports 1,001 occupations, 987 ranked, 14 unranked and 523 direct wage rows.
- Confirm the modern-title layer reports 88 queries: 11 normalized exact titles and 56 explicitly
  reviewed aliases resolve to official occupations, 18 use non-official composites and 3 are
  withheld to avoid false precision.
- Confirm market, role, search, exports, status, LLM guides, redirects, sitemap and manifest are
  regenerated together.
- Do not use `archive:rebuild-v8-unsafe` for a V9 release.

## Verify

- Run `bun run verify`.
- Confirm `verify` runs the complete test suite before the validation and release-contract checks.
- Treat `bun run archive:validate` as an optional regression check for frozen V3–V8 fixtures; it
  is not part of the V9 release gate and may require the retired archive pipeline.
- Run `bun run build`.
- Confirm `git diff --check` passes.
- Confirm the release manifest checksums match every listed artifact.
- Confirm the sitemap uses only `https://aiworkindex.com`, has no duplicates and excludes archive,
  noindex and redirect-only URLs.
- Confirm built HTML has one canonical URL per indexable page and no alternate-host leakage.

## Scientific and editorial boundary

- Confirm only ILO 2025 task exposure changes the AI Work Pressure Rank.
- Confirm multiple official mappings retain every candidate, use the median scored value and show
  the range.
- Confirm missing exposure, wages, demand, observed use and complementarity remain null or visibly
  unavailable, never zero.
- Confirm no current surface publishes inferred detailed employment, jobs affected, wage pools,
  job-loss probabilities, pathways or augmentation/substitution outcomes.
- Confirm current demand evidence is a reviewed positive named match; absence is not called weak
  demand.
- Confirm broad labour context keeps its published grain and explicit units.
- Confirm all pressure percentiles use tie-aware midranks and copy does not turn them into shares or
  probabilities.

## Roles and search

- Confirm normalized exact titles and explicit reviewed title, synonym or definition matches
  resolve to one official SSOC 2024 occupation and have one canonical URL.
- Confirm non-official role estimates publish components, weights and sensitivity; withheld role
  queries are not described as estimates.
- Confirm the generated role identity, full-coverage, unique-component, scored-component and
  weight-sum checks pass; no direct official resolution has a competing composite.
- Confirm search, watchlist aliases, edge redirects, sitemap and LLM guides agree on the role split.

## Public artifacts and archives

- Confirm `sg-ai-occupations-v9.json`, `sg-ai-occupations-v9.csv`, `v9-market-context.json`,
  `synthetic-roles-v9.json`, `v9-search-index.json`, `v9-ui-index.json`, `research-library.json`, `site-status.json`,
  `releases.json`, `llms.txt`, `llms-full.txt`, `sitemap.xml` and the V9 manifest are current.
- Confirm V3–V8 downloads remain available only as superseded, noindex archives.
- Confirm archived reports carry a dated V9 archive notice and `noindex`.
- Confirm US remains labelled Preview and global occupation scores remain unavailable.

## Browser QA

- Check home, explore, occupation, roles, role, rankings, compare, calculator, methodology, data,
  research and report journeys at mobile and desktop widths.
- Confirm no document-level horizontal overflow and no clipped tables or charts.
- Confirm redirects, 404s, keyboard search, filters, compare selection and watchlist behaviour.
- Review visible copy, page titles, descriptions, Open Graph metadata and JSON-LD against the V9
  evidence contract.

## Versioning

- Update the changelog, V9 report and execution record.
- Keep raw input snapshots and evidence cutoffs frozen for the release.
- Commit coherent slices, push the branch and open a pull request with exact validation results.
