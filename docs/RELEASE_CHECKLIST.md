# Release Checklist

Use this checklist before publishing a new public score release.

## Pipeline

- Preferred: run `bun run build:release-data`
- Confirm the release script does not promote archived shadow or experimental artifacts.
- Confirm `scripts/score.ts` emits the current `DATA_VINTAGE.model_version`.
- Confirm generated exports, claims matrix, source map, release manifest, site status, `llms.txt`, and sitemap are refreshed in the same run.

## Validation

- Run `bun run validate`
- Run `bun run release:check`
- Run `bun test tests/methodology.test.ts`
- Run `bun run check`
- Run `bun run lint`
- Run `bun run format:check`
- Run `bun run build`
- Confirm release manifest checksums were regenerated
- Confirm raw-data audit does not silently treat placeholder error files as valid
- Confirm `static/sitemap.xml` uses only `https://aiworkindex.com` URLs, has no duplicates, and excludes redirect aliases such as `/sg/occupation/*`
- Confirm built HTML has one canonical URL per indexable page and no `kirillso.com` host leakage

## Truth And Labeling

- Confirm non-official occupation headcounts remain labeled `Est.` or `Proxy`
- Confirm wage-pool surfaces still use proxy employment, not implied official detailed counts
- Confirm methodology copy matches the live scorer
- Confirm validation and release-note counts on public pages match generated artifacts, not older release prose
- Confirm synthetic roles are still labeled as estimates
- Confirm archived V4.3/V5/V6 pages are labeled as archive/audit trail, not current methodology

## Public Artifacts

- Confirm `static/data/sg-ai-occupations-v7.json` is current
- Confirm `static/data/sg-ai-occupations-v7.csv` is current
- Confirm `static/data/sg-context-pack-2025.json` is current
- Confirm `static/data/sg-labour-monitor-2025.json` is current
- Confirm `static/data/sg-worker-profile-2025.json` is current
- Confirm `static/data/sg-ai-in-singapore-2025.json` is current
- Confirm `static/data/sg-transition-support-v4.json` is current
- Confirm `static/data/claims-matrix-v7.json` is current
- Confirm `static/data/release-manifest-v7.json` is current
- Confirm `static/data/releases.json` starts with the current structural release
- Confirm retained snapshots (`v6`, `v5`, `v43`, `v42`) are clearly historical

## Content Surfaces

- Review homepage hero and headline metric phrasing
- Review About, Methodology, Appendix, Data, Reports, Changelog, and active report notes for stale claims
- Review occupation and role pages for unsupported precision or inherited evidence leaks
- Review rankings/report descriptions for stale methodology text
- Review `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, canonical tags, Open Graph URLs, and JSON-LD URLs for canonical host and current release metadata

## Versioning

- Update changelog or release notes
- Commit feature slices separately before final merge/push
- Keep raw input snapshots frozen for the published release
