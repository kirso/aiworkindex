# AI Work Index

AI Work Index is an open, deterministic research project about AI work pressure in Singapore. V9 covers all 1,001 numeric occupations in the Singapore Standard Occupational Classification 2024 (SSOC 2024), plus 88 modern-title queries: 67 resolve to official occupations, 18 use clearly labelled editorial composites and 3 are withheld to avoid false precision.

**[Live site](https://aiworkindex.com)** · **[Evidence explorer](https://aiworkindex.com/will-ai-take-my-job)** · **[Methodology](https://aiworkindex.com/methodology)** · **[Data](https://aiworkindex.com/data)**

## V9 in one sentence

The **AI Work Pressure Rank** is the midrank percentile of an occupation's ILO 2025 generative-AI task-exposure score among the 987 scored SSOC 2024 occupations.

A rank of 72 places the occupation at the 72nd midrank percentile for measured task exposure among scored Singapore occupations. Tied scores share a midrank. It is not a 72% probability of job loss, a prediction that 72% of jobs will disappear, or a claim that 72% of tasks will be automated.

## What V9 publishes

- The complete numeric SSOC 2024 occupation registry: 1,001 occupations.
- AI Work Pressure Ranks for 987 occupations; 14 ranks are withheld where the official mapping lacks usable ILO evidence.
- Exact ILO 2025 exposure categories, mean-score mapping ranges and within-occupation task-score dispersion.
- Direct MOM 2025 wage observations for 523 detailed occupations.
- Reviewed current demand matches and broad labour-market context as separate evidence that cannot change the pressure rank.
- 88 modern-title queries. Eleven exact titles and 56 explicitly reviewed aliases resolve to an official occupation; 18 publish non-official component estimates and 3 are withheld because a fixed mapping would be misleading.
- Historical V4–V8 releases as dated archives, plus a separate United States evidence preview.

V9 does not publish inferred detailed employment, jobs affected, wage pools at risk, job-loss probabilities, synthetic pathways or augmentation conclusions.

## Canonical data

- [`static/data/sg-ai-occupations-v9.json`](static/data/sg-ai-occupations-v9.json) — nested V9 occupation contract.
- [`static/data/sg-ai-occupations-v9.csv`](static/data/sg-ai-occupations-v9.csv) — flattened V9 occupation fields.
- [`static/data/synthetic-roles-v9.json`](static/data/synthetic-roles-v9.json) — modern-title resolutions, non-official composites, withheld mappings and component assumptions.
- [`static/data/v9-market-context.json`](static/data/v9-market-context.json) — reviewed Singapore demand and labour-market context.
- [`static/data/research-library.json`](static/data/research-library.json) — research registry reviewed through 19 August 2026.
- [`static/data/release-manifest-v9.json`](static/data/release-manifest-v9.json) — release files and checksums.

Older downloads remain available for auditability. V8 and V9 use different occupation universes and headline methods, so their ranks are not a valid time series.

## Reproduce V9

```bash
bun install
bun run release:generate
bun run verify
bun run build
```

The headline pipeline does not call an LLM. It uses versioned public source artifacts and deterministic TypeScript generators.

## Stack

SvelteKit 2, Svelte 5, Tailwind CSS v4, Bun and D3, published as a static Cloudflare Pages site.

## Licensing

Original software in this repository is available under the [MIT License](LICENSE). Official and third-party source data retain their original copyright, attribution and licence terms; see the source metadata and the [data page](https://aiworkindex.com/data).

## Author

[Kirill So](https://www.linkedin.com/in/kirso/) · [X](https://x.com/kirso_)
