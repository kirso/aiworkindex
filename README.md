# AI Work Index

V7 is the live structural score: a deterministic two-axis model that separates displacement pressure from demand resilience. V7 adds task-concentration-weighted exposure and a demand-persistence proxy, while retaining V6 baseline fields and historical V4/V5/V6 artifacts for auditability.

**[Live Site](https://aiworkindex.com)** | **[Global Methodology](https://aiworkindex.com/global)** | **[Methodology](https://aiworkindex.com/methodology)** | **[Calculator](https://aiworkindex.com/calculator)** | **[Data](https://aiworkindex.com/data)**

Singapore is the reference implementation. The shared structural baseline also powers global and country pages; local layers add demand, wages, policy, and confidence where evidence is strong enough.

## Key Numbers

- **562 Singapore occupations** scored across 9 major groups
- **88 synthetic roles** (product manager, data scientist, delivery rider, startup founder...)
- **21% face high+ AI risk** (118 occupations)
- **SGD 35.1B** estimated annual wage pool under high+ structural pressure
- **492 / 562 occupations** have weighted task-primitives evidence
- **4-source exposure ensemble**: Felten AIOE + Anthropic observed usage + Eloundou GPT exposure + ILO 2025

## How It Works

Deterministic scoring — no LLM in the scoring pipeline:

1. **Exposure** - reliability-weighted 4-source ensemble: AIOE (2021), Anthropic Economic Index (2026), Eloundou GPTs-are-GPTs (2024), ILO Refined Index (2025).
2. **Task concentration** - Anthropic task penetration matched to O*NET task statements; concentrated exposure raises structural pressure.
3. **Human bottleneck** - Pizzinelli theta from O*NET Work Context (judgment, presence, coordination).
4. **Demand resilience** - MOM employment/wage trends, vacancy pressure, SOL/JiD demand signals, and demand-persistence proxy.

The same structural spine is intended to power future country adapters. Singapore remains the reference implementation, while `/global` defines the comparable baseline for new markets.

```
task_signal = task_effective_coverage x task_exposure_concentration
exposure_v7 = clamp01(exposure x (1 + 0.20 x task_signal))
displacement_pressure = exposure_v7 x (1 - bottleneck)
headline_risk = displacement_pressure x (1 - demand_resilience)
```

Published as risk bands (Very Low through Very High) with visible confidence, uncertainty intervals, retained V6 baselines, and historical release artifacts.

## Validation

- **BLS cross-country**: live convergent cross-check against US BLS projections
- **Cluster-level**: directional check against Singapore labour-monitor clusters
- **Release pipeline**: validated end to end with published artifacts, checksums, claims matrix, and shadow-model governance outputs
- Methodology page: [aiworkindex.com/methodology](https://aiworkindex.com/methodology)

## Quick Start

```bash
git clone https://github.com/kirso/aiworkindex
cd aiworkindex
bun install
bun run build:release-data  # Refresh all release datasets and metadata
bun run scripts/score.ts    # Score all 562 occupations
bun run validate            # Run release and data-contract validation
bun run dev                 # Start dev server
bun run build               # Build the prerendered static site
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
- **Industry footprint + worker profile** from official Singapore labour tables
- **Transition infrastructure** from Jobs Transformation Maps, CareersFinder, WSQ, and SkillsFuture / WSG programmes

## Data Download

- [All occupations (JSON)](https://github.com/kirso/aiworkindex/blob/main/data/occupations.json)
- [Data page with dictionary](https://aiworkindex.com/data)

## Research Library

- Public registry: [aiworkindex.com/research](https://aiworkindex.com/research)
- Machine-readable artifact: `static/data/research-library.json`
- Live methodology references are now generated from the same canonical research registry used by reports and release governance.

## Tech Stack

- SvelteKit 5 + Svelte 5 runes (static site, adapter-static)
- Tailwind CSS v4 + shadcn-svelte (Bits UI)
- D3.js for visualization layout
- TypeScript scoring pipeline (Bun runtime)
- Satori + Resvg for OG image generation
- Deployed on Cloudflare Workers

## Limitations

- **Exposure data age**: AIOE is from 2021 (pre-GPT-4). Ensemble with newer sources mitigates but doesn't eliminate.
- **Employment granularity**: detailed Singapore occupation counts are not publicly released. `estimated_sg_employment_thousands` is a labeled sub-major allocation, and wage-pool analysis uses a separate labeled BLS-weighted proxy.
- **Demand-resilience weights**: market momentum, vacancy, scarcity, demand-signal, and demand-persistence weights are calibrated, not empirically derived.
- **Cluster-level labour data**: Same vacancy/hiring data for all occupations in each of 3 clusters.
- **Synthetic role weights**: Expert-assigned SSOC blends, not validated against job posting data.

## License

MIT

## Author

[Kirill So](https://www.linkedin.com/in/kirso/) · [X](https://x.com/kirso_)

Built with [Claude](https://www.anthropic.com) (Anthropic) & [GPT](https://openai.com) (OpenAI)
