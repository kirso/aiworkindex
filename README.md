# AI Work Index — Singapore

V4.0: 4-source exposure ensemble scoring 562 Singapore occupations and 88 modern roles for structural AI pressure. Cross-checked against US BLS employment projections (rho=-0.14, p<0.01, n=530).

**[Live Site](https://aiworkindex.pages.dev)** | **[Methodology](https://aiworkindex.pages.dev/methodology)** | **[Calculator](https://aiworkindex.pages.dev/calculator)** | **[Data](https://aiworkindex.pages.dev/data)**

## Key Numbers

- **562 occupations** scored across 9 major groups
- **88 synthetic roles** (product manager, data scientist, delivery rider, startup founder...)
- **27% face high+ AI risk** (152 occupations)
- **SGD 56B** Est. annual wage pool under pressure
- **50%** average AI task overlap across all occupations
- **4-source exposure ensemble**: Felten AIOE + Anthropic observed usage + Eloundou GPT exposure + ILO 2025

## How It Works

Three-layer deterministic scoring — no LLM in the pipeline:

1. **Exposure** — 4-source ensemble: AIOE (2021), Anthropic Economic Index (2026), Eloundou GPTs-are-GPTs (2024), ILO Refined Index (2025). Reliability-weighted blend of available matched inputs per occupation.
2. **Human Bottleneck** — Pizzinelli theta from O*NET Work Context (judgment, presence, coordination)
3. **Market Resilience** — MOM employment/wage trends + SOL/JiD demand signals + Anthropic calibration

```
net_risk = exposure × (1 − bottleneck) × market_modifier
```

Published as risk bands (Very Low through Very High) with Monte Carlo confidence intervals (1000-run simulation).

## Validation

- **BLS cross-country**: rho=-0.14, p<0.01 on 530 occupations mapped via ISCO-08→SOC crosswalk
- **Cluster-level**: 3/4 directional checks pass against Singapore Q3 2025 labour outcomes
- **56 structural checks**: anchor occupations, band consistency, impact type recomputation
- Methodology page: [aiworkindex.pages.dev/methodology](https://aiworkindex.pages.dev/methodology)

## Quick Start

```bash
git clone https://github.com/kirso/aiworkindex
cd aiworkindex
bun install
bun run build:release-data  # Refresh all release datasets and metadata
bun run scripts/score.ts        # Score all 562 occupations
bun run validate                 # Run 56 structural checks
bun run dev                      # Start dev server
bun run build                    # Build 672 prerendered pages
```

## Data Sources

| Source | What | Year |
|--------|------|------|
| MOM Singapore | 562 SSOC occupations, wages, employment | 2024-2025 |
| Felten AIOE | AI exposure per SOC (academic index) | 2021 |
| Anthropic Economic Index | Observed AI usage (HuggingFace, CC-BY) | Jan 2026 |
| Eloundou et al. | GPT-4 task-level exposure (Science, 2024) | 2024 |
| ILO Refined Index | ISCO-08 exposure (52K expert data points) | May 2025 |
| O*NET | Work Context, Job Zones, Task Statements | 2020 |
| MOM SOL 2026 | Shortage Occupation List | Nov 2025 |
| MOM Jobs in Demand | In-demand occupation flags | Dec 2025 |
| US BLS | Employment projections 2024-2034 (convergent cross-check) | Aug 2025 |

## Singapore Context

Each occupation page shows:
- **Education level** (O*NET Job Zones → Singapore labels)
- **Progressive Wage Model** coverage (57 occupations in 9 PWM sectors)
- **Licensed profession** flag (53 strict + 23 partial)
- **Foreign worker dependency** (73 very high + 33 high + 45 moderate)
- **SkillsFuture** career conversion eligibility (154 occupations)

## Data Download

- [All occupations (JSON)](https://github.com/kirso/aiworkindex/blob/main/data/occupations.json)
- [Data page with dictionary](https://aiworkindex.pages.dev/data)

## Academic References

1. Felten, Raj & Seamans (2021). *Strategic Management Journal*, 42(12). [DOI](https://doi.org/10.1002/smj.3286)
2. Pizzinelli et al. (2023). *IMF Working Paper* WP/23/216. [IMF](https://www.imf.org/en/Publications/WP/Issues/2023/10/05/540476)
3. Frank et al. (2025). *PNAS Nexus*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11983276/)
4. Eloundou et al. (2024). *Science*. [arXiv](https://arxiv.org/abs/2303.10130)
5. Demirer et al. (2025). Stanford DEL. [Paper](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/)
6. Brynjolfsson, Li & Raymond (2023). *NBER Working Paper* 31161. [NBER](https://www.nber.org/papers/w31161)
7. ILO (2025). *Working Paper* 140. [ILO](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure)

## Tech Stack

- SvelteKit 5 + Svelte 5 runes (static site, adapter-static)
- Tailwind CSS v4 + shadcn-svelte (Bits UI)
- D3.js for visualization layout
- TypeScript scoring pipeline (Bun runtime)
- Satori + Resvg for OG image generation
- Deployed on Cloudflare Workers

## Limitations

- **Exposure data age**: AIOE is from 2021 (pre-GPT-4). Ensemble with newer sources mitigates but doesn't eliminate.
- **Employment granularity**: MOM publishes employment at 9 major groups, not per occupation. BLS proportional proxy helps.
- **Market modifier weights**: 0.6/0.4 momentum/scarcity split is calibrated, not empirically derived.
- **Cluster-level labour data**: Same vacancy/hiring data for all occupations in each of 3 clusters.
- **Synthetic role weights**: Expert-assigned SSOC blends, not validated against job posting data.

## License

MIT

## Author

[Kirill So](https://www.kirillso.com) · [LinkedIn](https://www.linkedin.com/in/kirso/) · [X](https://x.com/kirso_)

Built with [Claude](https://www.anthropic.com) (Anthropic) & [GPT](https://openai.com) (OpenAI)
