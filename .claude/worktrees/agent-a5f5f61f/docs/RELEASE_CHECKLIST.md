# Release Checklist

Use this checklist before publishing a new public score release.

## Pipeline

- Preferred: run `bun run build:release-data`
- Run `bun run scripts/score.ts`
- Run `bun run scripts/enrich-bls-employment.ts`
- Run `bun run scripts/export-json.ts`
- Run `bun run scripts/export-csv.ts`
- Run `bun run scripts/build-ai-in-singapore.ts`
- Run `bun run scripts/export-context-pack.ts`
- Run `bun run scripts/build-transition-support.ts`
- Run `bun run scripts/build-claims-matrix.ts`
- Run `bun run scripts/build-release-manifest.ts`
- Run `bun run scripts/build-raw-data-audit.ts`

## Validation

- Run `bun run validate`
- Run `bun run verify`
- Confirm release manifest checksums were regenerated
- Confirm raw-data audit does not silently treat placeholder error files as valid

## Truth And Labeling

- Confirm non-official occupation headcounts remain labeled `Est.` or `Proxy`
- Confirm wage-pool surfaces still use proxy employment, not implied official detailed counts
- Confirm methodology copy matches the live scorer
- Confirm validation-check counts on public pages match the current validator
- Confirm synthetic roles are still labeled as estimates

## Public Artifacts

- Confirm `static/data/sg-ai-occupations-v4.json` is current
- Confirm `static/data/sg-ai-occupations-v4.csv` is current
- Confirm `static/data/sg-context-pack-2025.json` is current
- Confirm `static/data/sg-labour-monitor-2025.json` is current
- Confirm `static/data/sg-worker-profile-2024.json` is current
- Confirm `static/data/sg-ai-in-singapore-2025.json` is current
- Confirm `static/data/sg-transition-support-v4.json` is current
- Confirm `static/data/claims-matrix-v4.json` is current
- Confirm `static/data/release-manifest-v4.json` is current

## Content Surfaces

- Review homepage hero and red headline number phrasing
- Review About, Methodology, Appendix, Data, and active reports for stale claims
- Review occupation and role pages for unsupported precision or inherited evidence leaks
- Review rankings/report descriptions for stale methodology text

## Versioning

- Update changelog or release notes
- Commit feature slices separately before final merge/push
- Keep raw input snapshots frozen for the published release
