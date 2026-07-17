# AI Work Index

AI Work Index is an open, deterministic research project that ranks how strongly current AI capabilities may change work across 562 Singapore occupations.

**[Live site](https://aiworkindex.com)** · **[Calculator](https://aiworkindex.com/will-ai-take-my-job)** · **[Methodology](https://aiworkindex.com/methodology)** · **[Data](https://aiworkindex.com/data)**

## V8 in one sentence

The **AI Exposure Rank** is a 0–100 relative index: a score of 72 means more exposed to current AI capabilities than approximately 72% of occupations in the Singapore reference market.

It is **not** a 72% probability of job loss, a claim that 72% of jobs will disappear, or an estimate that 72% of tasks can be automated.

## What V8 publishes

- An AI exposure rank and quintile band.
- Separate structural substitution and augmentation-potential ranks.
- A rule-based likely pathway: limited direct change, workflow redesign, augmentation-led growth, demand-buffered redesign, or hiring/substitution pressure.
- Official-derived demand, observed sector-adoption, broad workforce-age and transition context. Entry-level sensitivity remains `unknown` until a suitable occupation-level open series exists.
- High/Medium/Low evidence confidence with visible limiting factors.
- Source-weight sensitivity using equal-weight and leave-one-source-out variants.

The headline score uses a reliability-weighted ensemble of Felten AIOE, Anthropic observed usage, Eloundou GPT exposure and the ILO refined occupational index. Human bottlenecks and labor-market evidence help interpret how exposure may resolve; they do not turn the score into a job-loss forecast.

## Why the public contract changed

Earlier releases displayed heuristic structural composites in percentage form. V8 is a clean breaking release that reports percentile index points instead. Historical V7 artifacts remain available for reproducibility.

Singapore is the only live scored market. Global methodology remains research context, and country scores do not publish until their mapping and local-data gates pass.

## Data

- [`static/data/sg-ai-occupations-v8.json`](static/data/sg-ai-occupations-v8.json) — clean nested V8 contract.
- [`static/data/sg-ai-occupations-v8.csv`](static/data/sg-ai-occupations-v8.csv) — flattened V8 fields.
- [`static/data/sg-ai-occupations-v7.json`](static/data/sg-ai-occupations-v7.json) — archived historical release.

Detailed Singapore employment is an estimate derived from broader official occupation-family totals; it is not an official occupation-level headcount. The public V8 schema labels this basis directly.

The current labour context uses MOM's full Q1 2026 report at three broad occupation-cluster levels. The postings monitor is a partial historical sample observed through 20 March 2026 (93 of 562 occupations and 42 of 88 synthetic roles), not a live or representative measure of hiring. Neither layer changes the headline exposure rank.

## Reproduce the release

```bash
bun install
bun run build:release-data
bun run test:methodology
bun run validate
bun run check
bun run lint
bun run format:check
bun run build
bun run release:check
```

The scoring pipeline does not call an LLM. It uses TypeScript, versioned source artifacts and deterministic generators.

## Stack

SvelteKit 5, Svelte 5, Tailwind CSS v4, Bun, D3, Satori/Resvg and Cloudflare Workers.

## License

MIT

## Author

[Kirill So](https://www.linkedin.com/in/kirso/) · [X](https://x.com/kirso_)
