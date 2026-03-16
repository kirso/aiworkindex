# Singapore AI Occupation Impact Index

Three layers of AI impact across 562 Singapore occupations -- exposure, human bottleneck, and market resilience. Risk bands with visible confidence. Academic indices, not LLM vibes.

**[Live Demo](https://sg-ai-jobs.vercel.app)** | **[Methodology](https://sg-ai-jobs.vercel.app/methodology)**

## Key Findings

- **562 occupations scored**: 53% Low/Very Low risk, 24% Moderate, 23% High/Very High
- **Impact types**: 177 AI Leveraged, 85 At Risk, 214 Stable, 86 Mixed
- **Crosswalk coverage**: 92.7% direct match (521/562), 7.1% sub-major fallback, 0.2% major fallback

## How It Works

Three-layer deterministic scoring:

1. **Exposure** -- Felten AIOE: AI capability overlap with job abilities
2. **Human Bottleneck** -- Pizzinelli theta: judgment, presence, responsibility
3. **Market Resilience** -- MOM employment/wage trends + occupation wage structure + SOL/JiD demand flags + Anthropic calibration

```
net_risk = exposure x (1 - bottleneck) x market_modifier
```

Published as risk bands (Very Low through Very High) with visible confidence. No LLM in the scoring pipeline.

## Quick Start

```bash
git clone https://github.com/kirso/sg-ai-jobs
cd sg-ai-jobs
bun install
bun run scripts/score.ts    # Re-score all occupations
bun run scripts/export-csv.ts  # Export CSV to static/data/
bun run dev                  # Start dev server
```

## Data Sources

| Source | What | License |
|--------|------|---------|
| MOM Singapore | 562 occupations, wages, employment | Public |
| Felten AIOE (2021) | AI exposure per SOC | CC |
| O*NET | Work context, job zones | CC-BY 4.0 |
| Anthropic Economic Index (2026) | Observed AI usage calibration | CC |
| MOM SOL 2026 | Shortage occupation flags | Public |
| MOM Jobs in Demand 2025 | Demand flags | Public |
| Stanford "Canaries" (2025) | Career-stage signals | Academic |

## Data Download

- [All 562 occupations (CSV)](https://sg-ai-jobs.vercel.app/data/sg-ai-occupations-2024.csv)
- [Raw JSON](https://github.com/kirso/sg-ai-jobs/blob/main/data/occupations.json)

## Academic References

1. Felten, Raj & Seamans (2021). "Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses." *Strategic Management Journal*, 42(12), 2195-2217.
2. Pizzinelli et al. (2023). "Labor Market Exposure to AI: Cross-country Differences and Distributional Implications." *IMF Working Paper* WP/23/216.
3. IMF Singapore (2024). "Impact of Artificial Intelligence on the Singapore Labor Market." *IMF Selected Issues Paper* SIP/2024/040.
4. Eloundou et al. (2023). "GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models." *arXiv:2303.10130*.
5. Demirer et al. (2025). "Canaries in the Coal Mine: Early Signals from AI's Impact on the Labor Market." Stanford Digital Economy Lab.
6. Ministry of Manpower, Singapore (2025). "Jobs in Demand 2025."
7. Ministry of Manpower, Singapore (2025). "Job Vacancies 2024."
8. Ministry of Manpower, Singapore (2025). COMPASS Shortage Occupation List (SOL). Effective January 1, 2026.
9. Anthropic (2026). "The Anthropic Economic Index: Economic Primitives." Dataset on HuggingFace.

## Adapt for Your Country

The scoring pipeline uses ISCO-08 as an intermediate standard. Any country with a national occupation classification that maps to ISCO-08 can be adapted. See `scripts/crosswalk.ts` for the mapping logic.

## Limitations

- **Exposure does not equal displacement** -- we model this gap explicitly, but the market translation layer uses heuristics and lagging indicators.
- **US-centric ability data** -- O*NET surveys US workers. Task composition may differ in Singapore.
- **Group-level market granularity** -- Market momentum is major-group level. Occupation-level wage structure adds within-group differentiation but is a scarcity proxy.
- **Static exposure snapshot** -- Felten AIOE reflects 2021 AI capabilities.
- **Career-stage blind spot** -- v1 scores occupations as a whole, not junior vs senior.
- **Crosswalk imprecision** -- 7.3% of occupations use fallback scores. Confidence score reflects this.

## Tech Stack

- SvelteKit + Svelte 5 (static site generation via adapter-static)
- D3.js for layout computation (treemap, scales)
- Tailwind CSS v4
- TypeScript scoring pipeline (Bun runtime)
- Deployed on Vercel

## Inspired By

[Andrej Karpathy's AI Employment Outlook Map](https://joshkale.github.io/jobs/) -- we go further by separating exposure from displacement, adding market resilience, and providing rich per-occupation detail pages with visible confidence.

## License

MIT
