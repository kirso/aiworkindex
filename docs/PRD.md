# Product Requirements Document: Singapore AI Occupation Impact Index

**Version:** 2.0
**Date:** 2026-03-16
**Status:** Draft (v2 — incorporates methodology review feedback)

---

## 1. Vision & Problem Statement

### Problem

**AI exposure and job displacement are different objects.** Existing tools — including Karpathy/JoshKale's US Job Market Visualizer ([site](https://joshkale.github.io/jobs/), [repo](https://github.com/karpathy/jobs), March 2026) — conflate them. A software developer and a data entry clerk can both score 8/10 on AI exposure, but one gets augmented (jobs up 11% in 2026) while the other gets replaced. MOM's own Jobs in Demand 2025 ([released Dec 30, 2025](https://stats.mom.gov.sg/Pages/Infographic-Jobs-in-Demand-2025.aspx)) still lists software developers and data scientists as in-demand PMET roles. The Job Vacancies 2024 report ([released Mar 28, 2025](https://stats.mom.gov.sg/Pages/Job-Vacancies-2024.aspx)) confirms software/web/multimedia developers remained in demand.

Specific limitations of existing approaches:

1. **Exposure ≠ displacement** — Every existing index (Felten AIOE, Eloundou GPTs-are-GPTs, Frey & Osborne, Karpathy's tool) measures only *technical exposure* — "can AI do these tasks?" None model whether exposure leads to augmentation or substitution. Stanford's "Canaries in the Coal Mine" research ([Stanford DEL, 2025](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/)) shows the early effect is concentrated on early-career workers, not the whole occupation equally — exposure matters much more where AI automates than where it augments.

2. **Methodological circularity** — Karpathy's tool scores each occupation with a single Gemini Flash call and explicitly disclaims results as "rough LLM estimates, not rigorous predictions." Using an LLM to score how replaceable jobs are by LLMs is self-referential.

3. **No occupation-level depth** — Karpathy's treemap links directly to external BLS pages. No detail pages, no per-occupation analysis, no filtering, no search. Users can hover for a tooltip but cannot explore.

4. **No confidence signal** — No existing tool tells you how reliable its own score is. Crosswalk quality, data coverage, and task consensus all vary by occupation.

### Vision

Build **a Singapore AI Occupation Impact Index** — not another exposure map, but a two-stage system that separates technical exposure from labor-market translation, with four visible axes:

1. **Exposure** — How much does this job overlap with AI capabilities? (Felten AIOE, occupation-level)
2. **Human Bottleneck** — How much does this job require judgment, presence, and responsibility? (Pizzinelli theta from O*NET, occupation-level)
3. **Market Resilience** — Is Singapore's labor market for this occupation growing or shrinking? (MOM trends + occupation wage structure, hierarchical)
4. **Net Risk** — Published as risk bands (Very Low to Very High) with visible confidence, not pseudo-precise decimals

### Goals
- **For job seekers:** Understand how AI affects *your* specific occupation in Singapore — not a single vague number, but three interpretable layers (exposure, human bottleneck, market resilience) producing a risk band with visible confidence.
- **For policy makers:** A transparent, reproducible methodology that separates technical exposure from market dynamics, with full academic citations and open data.
- **For researchers:** An open-source framework adaptable to any country via ISCO-08 crosswalks, with a methodology that advances beyond single-index exposure-only approaches.
- **For SEO:** 562 programmatic long-tail pages targeting "[occupation] AI impact Singapore" searches with rich, unique content per page.

---

## 2. Target Users

| User | Need | How We Serve Them |
|------|------|-------------------|
| Singapore professionals | "Is my job at risk from AI?" | Search by occupation, see nuanced score with explanation |
| Career changers | "What jobs are safer / growing?" | Filter by risk category, sort by wage, compare occupations |
| HR / workforce planners | "Which roles in my org are most affected?" | Filter by industry × occupation group, export data |
| Policy makers / academics | "How exposed is Singapore's workforce?" | Methodology page, open data, academic citations |
| International developers | "I want to build this for my country" | Country adapter template, ISCO-08 crosswalk, MIT license |

---

## 3. Competitive Analysis

### Karpathy's US Job Market Visualizer (karpathy.ai/jobs)

| Feature | Karpathy | Ours |
|---------|----------|------|
| Occupations | 342 (US, BLS) | 562 (Singapore, MOM) |
| Scoring | Single LLM call (Gemini Flash) | Multi-signal: academic indices + demand elasticity + labor market data |
| Circularity | LLM scores LLM replaceability | No LLM in scoring pipeline |
| Detail pages | None (links to external BLS) | Rich per-occupation pages with radar chart, wage range, task breakdown, similar jobs |
| Search | None | Full-text autocomplete |
| Filtering | None (only color-layer toggle) | Major group, wage range, risk category, URL-synced |
| Scatter plot | None | Exposure × Complementarity quadrant plot |
| Mobile | Poor (canvas-based treemap) | Card list fallback with collapsible groups |
| Methodology | Single collapsible paragraph | Dedicated page with academic citations, formula, limitations |
| Open source | Code on GitHub | Code + data + methodology + country adapter template |
| Academic rigor | "Rough LLM estimates" disclaimer | Peer-reviewed indices (Felten AIOE, Pizzinelli C-AIOE) |

### Other AI Exposure Indices

| Index | Strength | Limitation |
|-------|----------|------------|
| Felten AIOE (2021) | Rigorous ability-based mapping | US-only, no complementarity, no demand signal |
| Pizzinelli C-AIOE / IMF (2023) | Adds complementarity dimension | Aggregate only, no per-occupation public dataset |
| Eloundou GPTs-are-GPTs (2023) | Task-level exposure analysis | GPT-4 scored (circular), US-only |
| Frey & Osborne (2013) | Pioneered the field | Outdated, binary classification, no AI-specific abilities |
| Webb (2020) | Patent-based, forward-looking | Complex methodology, not replicable for most countries |

**Our differentiation:** First to explicitly separate technical exposure from labor-market displacement risk, with three scoring layers, derived risk/augmentation outcomes, visible confidence, and a reproducible open-source methodology. Not another LLM-vibes leaderboard.

---

## 4. Scoring Methodology (v3 — Definitive Spec)

### Core Principle

**AI exposure and job displacement are different objects.** We model them as three interpretable layers:

1. **Exposure** — How much does this job overlap with AI capabilities? (Felten AIOE, occupation-level)
2. **Human Bottleneck** — How much does this job require judgment, presence, and responsibility that resists automation? (Pizzinelli theta, occupation-level)
3. **Market Resilience** — Is Singapore's labor market for this occupation growing or shrinking? (MOM data, hierarchical: group-level trends + occupation-level scarcity proxies)

The published output is **sub-scores + risk band + confidence level**, not a single pseudo-precise decimal.

**The core formula is fully deterministic.** No LLM, no analyst judgment labels, no hand-set elasticity classes. Every input is an observable signal from a published dataset.

```
net_risk = exposure × (1 - bottleneck) × market_modifier
```

| Layer | What it measures | Source | Granularity |
|-------|-----------------|--------|-------------|
| **Exposure** | AI capability overlap | Felten AIOE (2021) | Per-occupation (via crosswalk) |
| **Bottleneck** | Human judgment, presence, responsibility | Pizzinelli theta from O*NET (2023) | Per-occupation (via crosswalk) |
| **Market Resilience** | Employment momentum + wage scarcity | MOM employment/wage trends + occupation wage structure | Hierarchical: group + occupation |
| **Confidence** | Score reliability | Crosswalk quality + data coverage | Per-occupation |

### 4.1 Layer 1 — Exposure (occupation-level)

**Variable**: `exposure = pctile(aioe)`

- **Source**: Felten, Raj & Seamans (2021). *Strategic Management Journal*, 42(12), 2195-2217. https://doi.org/10.1002/smj.3286
- **Dataset**: https://github.com/AIOE-Data/AIOE (`AIOE_DataAppendix.xlsx`)
- **Method**: Maps 10 AI application categories -> 52 human abilities via crowdsourced ratings (AMT) -> occupations via O*NET ability importance scores
- **Coverage**: ~774 US occupations by 6-digit SOC code
- **Normalization**: Percentile-rank across all matched occupations -> 0-1 scale
- **What it does NOT measure**: Whether exposure leads to augmentation or replacement

### 4.2 Layer 2 — Human Bottleneck (occupation-level)

**Variable**: `bottleneck = pctile(theta)`

- **Source**: Pizzinelli et al. (2023). *IMF Working Paper* WP/23/216. https://www.imf.org/en/Publications/WP/Issues/2023/10/04
- **Data**: O*NET Work Context + Job Zones (https://www.onetcenter.org/database.html, CC-BY 4.0)
- **12 O*NET variables across 6 dimensions**:
  1. **Communication**: Face-to-Face Discussions (4.C.1.a.2.l), Public Speaking (4.C.1.a.4)
  2. **Responsibility**: Outcomes/Results (4.C.1.c.1), Health/Safety (4.C.1.c.2)
  3. **Physical Conditions**: Outdoors/Weather (4.C.2.d.1.e), Physical Proximity (4.C.2.d.1.i)
  4. **Criticality**: Consequence of Errors (4.C.3.b.2), Decision Freedom (4.C.3.b.4), Decision Frequency (4.C.3.b.7)
  5. **Routine** (inverted): Degree of Automation (4.C.3.d.4), Structured vs. Unstructured (4.C.3.d.8)
  6. **Skills**: Job Zone (1-5, scaled to 20-100)
- **Formula**: `theta = mean(communication, responsibility, physical, criticality, routine, skills) / 100`
- **Normalization**: Percentile-rank across all matched occupations -> 0-1 scale
- **Interpretation**: Higher = stronger human bottleneck = harder to substitute

**Critical design decision -- no double-counting**: We use AIOE and theta as **separate, independent layers**. We do NOT use C-AIOE as an input to net_risk, because `c_aioe = aioe * f(theta)` -- multiplying by `(1 - theta)` would double-count complementarity. C-AIOE is computed and displayed as a reference score for IMF comparability only.

### 4.3 Layer 3 — Market Resilience (hierarchical)

Market data is a **calibrator**, not an override. Employment and wages are lagging and confounded.

#### 4.3.1 Market Momentum (major-group level)

```
market_momentum = mean(
  pctile(group_employment_cagr_2015_2025),
  pctile(group_wage_cagr_2015_2023)
)
```

| Source file | Variable |
|-------------|----------|
| `employment_by_occupation.csv` | Employment CAGR per major group, 2015->2025 (10-year) |
| `median_income_by_occupation.csv` | Wage CAGR per major group, 2015->2023 (8-year) |

Known employment CAGRs: Professionals +4.45%, Associate Prof +2.81%, Managers +1.47%, Service/Sales +0.92%, Plant/Machine -0.62%, Clerical -2.82%, Craftsmen -4.74%.

#### 4.3.2 Occupation Scarcity (occupation-level)

```
occupation_scarcity = mean(
  pctile(log(q75 / q25)),
  pctile(within_group_median_ratio)
)
```

**Signal 1 -- Wage Spread: `log(q75 / q25)`**
- Source: `sg_occupations_complete_2024.json` (all 562 occupations have 25th/50th/75th)
- Raw ratio range: 1.04 to 4.94
- **Rules**: Winsorize at 1st/99th percentile -> log transform -> percentile-rank
- **Interpretation**: Scarcity/market-structure proxy. High spread = skill-differentiated role. Can also reflect seniority ladders -- hence modest weight.

**Signal 2 -- Wage Position: `occupation_median / group_median`**
- Source: `sg_occupations_complete_2024.json`
- Compute as percentile rank **within the major group**
- **Interpretation**: Above-group-median = relative scarcity/specialization

#### 4.3.3 Combined Market Resilience & Modifier

```
market_resilience = 0.6 * market_momentum + 0.4 * occupation_scarcity

market_modifier = 1 - 0.35 * market_resilience
```

- **0.6/0.4 weighting**: Group-level trends are stronger (direct measurement). Occupation-level wage structure adds within-group differentiation but is noisier.
- **0.35 cap**: Market layer can reduce net risk by up to 35% (market_modifier is always <= 1.0 since market_resilience >= 0). Weak markets don't amplify risk beyond the technical signal. Exposure and bottleneck remain primary drivers.

### 4.4 Net Risk

```
net_risk = exposure * (1 - bottleneck) * market_modifier
```

**Published as risk bands:**

| Band | Range | Meaning |
|------|-------|---------|
| **Very Low** | 0.00 -- 0.05 | Negligible displacement pressure |
| **Low** | 0.05 -- 0.15 | Limited pressure; AI likely augments |
| **Moderate** | 0.15 -- 0.30 | Mixed; bottlenecks or market provide buffer |
| **High** | 0.30 -- 0.50 | Significant pressure; weaker bottlenecks and/or declining market |
| **Very High** | 0.50+ | Strong pressure across multiple signals |

### 4.5 Confidence (first-class)

```
confidence = mean(crosswalk_quality, market_data_granularity, source_freshness)
```

| Factor | How it is assigned | Typical range |
|--------|--------------------|---------------|
| **Crosswalk quality** | Direct = 1.0, sub-major fallback = 0.6, major fallback = 0.3, then reduced by crosswalk dispersion when mapped SOC scores disagree | 0.3-1.0 |
| **Market data granularity** | Baseline from occupation wage structure + group employment/wage trends. Exact official demand evidence adds more occupation-specific Singapore signal than prefix-inferred or absent demand evidence | 0.65-0.85 |
| **Source freshness** | Baseline reflects 2021 academic exposure data mixed with recent Singapore labour data. Anthropic observed-usage calibration raises freshness where available | 0.75-0.85 |

Published as: **High** (>=0.7) / **Medium** (0.4--0.7) / **Low** (<0.4)

### 4.6 Worked Examples

**Software Developer (SSOC 21661):**

| Layer | Value | Source |
|-------|-------|--------|
| Exposure | pctile(aioe) = 0.82 | Coding, analysis, docs overlap with AI |
| Bottleneck | pctile(theta) = 0.71 | Creative problem-solving, system design |
| Market momentum | pctile = 0.90 | Professionals: +4.45% CAGR |
| Occupation scarcity | pctile = 0.75 | High wage spread, above-group median |
| Market resilience | 0.6x0.90 + 0.4x0.75 = 0.84 | |
| Market modifier | 1 - 0.35x0.84 = 0.71 | |
| **Net risk** | 0.82 x 0.29 x 0.71 = **0.17** | **Band: Low** |
| Confidence | **High** | Direct crosswalk, strong signals |

**Data Entry Clerk (SSOC 41320):**

| Layer | Value | Source |
|-------|-------|--------|
| Exposure | pctile(aioe) = 0.88 | Data processing = core AI capability |
| Bottleneck | pctile(theta) = 0.18 | Routine, structured, low consequence |
| Market momentum | pctile = 0.15 | Clerical: -2.82% CAGR |
| Occupation scarcity | pctile = 0.20 | Low spread, below-group median |
| Market resilience | 0.6x0.15 + 0.4x0.20 = 0.17 | |
| Market modifier | 1 - 0.35x0.17 = 0.94 | Barely buffers |
| **Net risk** | 0.88 x 0.82 x 0.94 = **0.68** | **Band: Very High** |
| Confidence | **Medium** | Direct crosswalk, group-level only |

**Surgeon (SSOC 22121):**

| Layer | Value | Source |
|-------|-------|--------|
| Exposure | pctile(aioe) = 0.45 | Some diagnostic overlap, surgery doesn't |
| Bottleneck | pctile(theta) = 0.95 | Life/death, physical, independent judgment |
| Market momentum | pctile = 0.90 | Professionals: +4.45% CAGR |
| Occupation scarcity | pctile = 0.85 | Very high spread, well above group median |
| Market resilience | 0.6x0.90 + 0.4x0.85 = 0.88 | |
| Market modifier | 1 - 0.35x0.88 = 0.69 | |
| **Net risk** | 0.45 x 0.05 x 0.69 = **0.016** | **Band: Very Low** |
| Confidence | **High** | Direct crosswalk, growing group |

### 4.7 LLM Policy

**The scoring formula is fully deterministic.** No LLM output feeds into net_risk, any sub-score, or confidence.

The LLM is used only for supplementary detail-page content (v1.1):
1. **Task decomposition for display** -- context, not a score input
2. **Plain-language rationale** -- interpreting sub-scores
3. **Contradiction flagging** -- for human review

### 4.8 Crosswalk

- SSOC 2020 -> ISCO-08: SingStat concordance (https://www.singstat.gov.sg)
- ISCO-08 -> US SOC 2010: BLS crosswalk (https://www.bls.gov/soc/)
- One-to-many: average AIOE and theta
- Fallback: 2-digit ISCO sub-major group average
- Current coverage: **92.7% direct** (521/562), 7.1% sub-major (40), 0.2% major (1)

### 4.9 Augmentation Score (v1.1 — highest-priority enhancement)

A single displacement risk number misses half the story. A software developer and a data entry clerk can both have moderate net_risk, but for completely different reasons. The fix: compute augmentation potential from the **same inputs**, different formula.

```
displacement_risk  = exposure × (1 - bottleneck) × market_modifier
augmentation_potential = exposure × bottleneck × market_resilience
```

Both are deterministic, both use the same three layers. But they answer different questions:
- **Displacement**: "How much of this job can AI replace, given market conditions?"
- **Augmentation**: "How much can AI amplify this job's productivity, given the human bottleneck?"

**Impact Type (2×2 matrix):**

|  | Low Augmentation | High Augmentation |
|---|---|---|
| **High Displacement** | **At Risk** — AI substitutes, weak bottleneck | **Mixed** — conflicting signals, high uncertainty |
| **Low Displacement** | **Stable** — AI has limited overlap | **AI Leveraged** — AI amplifies, human essential |

**Worked examples with augmentation:**

| Occupation | Displacement | Augmentation | Impact Type |
|-----------|-------------|-------------|-------------|
| Software Developer | 0.17 (Low) | 0.82 × 0.71 × 0.84 = **0.49** (High) | AI Leveraged |
| Data Entry Clerk | 0.68 (Very High) | 0.88 × 0.18 × 0.17 = **0.03** (Very Low) | At Risk |
| Surgeon | 0.016 (Very Low) | 0.45 × 0.95 × 0.88 = **0.38** (Moderate) | AI Leveraged |
| Accountant | 0.60 (Very High) | 0.996 × 0.28 × 0.84 = **0.23** (Moderate) | Mixed |

This is the single biggest improvement beyond the current spec. It makes the methodology much stronger than a one-number index.

### 4.10 Additional Enhancements (prioritized)

1. **Gold set calibration** — Manually review ~30 occupations (anchors + edge cases) to tune band thresholds. Without this, Very Low vs Low is partly taste. Score all 562 first, inspect distribution, then set breaks so anchors land correctly.

2. **Crosswalk dispersion penalty** — If an SSOC maps to multiple SOC codes with widely different AIOE or theta values, confidence should drop even when coverage is "direct." Compute std_dev across matched SOCs, penalize confidence proportionally.

3. **Signal conflict flag** — When signals strongly disagree (e.g., high exposure + strong bottleneck + strong market), surface as "Contested" instead of looking overly certain. This is different from low confidence (data quality) — it means the signals genuinely point in different directions.

4. **Quarterly vacancy monitor** — Pull official data.gov.sg vacancy trends into the occupation pages as a cluster-level labour-market monitor. This adds a recurring public signal without pretending we have occupation-level employment series.

5. **Distribution-calibrated bands** — Current thresholds (0.05/0.15/0.30/0.50) are hand-set. After gold set review, adjust so each band contains a meaningful proportion and anchors land correctly.

6. **Career-stage lens** — Per Stanford "Canaries in the Coal Mine" ([Stanford DEL, 2025](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/)). Junior/senior impact differs significantly.

7. **Ceiling**: MOM OED (occupation-level employment series, not publicly downloadable) would replace group-level momentum with real per-occupation data.

### 4.10 Limitations

1. **Exposure != displacement** -- modeled but via lagging market indicators
2. **US-centric ability data** -- O*NET surveys US workers (per Pizzinelli's own caveat)
3. **Hierarchical market granularity** -- momentum is group-level; occupation-level wage signals are scarcity proxies, not direct demand
4. **Proportional employment** -- not used in scoring (it's group_total / count)
5. **Static exposure** -- AIOE reflects 2021 capabilities
6. **Career stage blind spot** -- v1 scores whole occupation; junior/senior impact differs (Stanford Canaries)
7. **Crosswalk imprecision** -- 7.3% use fallback scores; confidence reflects this
8. **Wage-spread ambiguity** -- high ratio can mean specialization OR seniority ladder; used at ~16% effective weight
9. **No occupation-level employment series** -- the real ceiling
10. **Cluster-level vacancy monitoring** -- the live labour monitor is by occupation cluster, not by exact occupation

---

## 5. Data Sources & Attribution

### Primary Datasets

| Dataset | Source | License | How We Use It |
|---------|--------|---------|---------------|
| Singapore Occupations (562) | Ministry of Manpower (MOM), via stats.mom.gov.sg | Public government data | Occupation titles, SSOC codes, wages, employment |
| Felten AIOE Index | Felten, Raj & Seamans (2021), via github.com/AIOE-Data/AIOE | Creative Commons | AI exposure scores per US SOC occupation |
| O*NET Work Context | US Dept of Labor, O*NET Resource Center (onetcenter.org) | CC-BY 4.0 | 11 work context variables for complementarity theta |
| O*NET Job Zones | US Dept of Labor, O*NET Resource Center | CC-BY 4.0 | Skills dimension for complementarity theta |
| BLS SOC-ISCO Crosswalk | US Bureau of Labor Statistics (bls.gov/soc) | Public domain (US govt) | Bridge from US SOC to ISCO-08 international codes |
| SSOC-ISCO Concordance | Singapore Dept of Statistics (singstat.gov.sg) | Public government data | Bridge from SSOC 2020 to ISCO-08 |
| Employment Time Series | MOM Table M182601 | Public government data | Employment by occupation group, 2000-2025 |
| Income by Occupation | MOM/SingStat | Public government data | Median income by group × sex, 2001-2023 |
| Jobs in Demand 2025 | MOM, released Dec 30 2025 | Public government data | Occupation-specific in-demand flags for market resilience |
| Job Vacancies 2024 | MOM, released Mar 28 2025 | Public government data | Occupation-specific demand signals |

### Academic Citations (full)

1. Felten, E., Raj, M., & Seamans, R. (2021). Occupational, industry, and geographic exposure to artificial intelligence: A novel dataset and its potential uses. *Strategic Management Journal*, 42(12), 2195-2217. https://doi.org/10.1002/smj.3286

2. Pizzinelli, C., Panton, A.J., Mendes Tavares, M., Cerdeiro, D.A., & Stanton, C.T. (2023). Labor Market Exposure to AI: Cross-country Differences and Distributional Implications. *IMF Working Paper* WP/23/216. https://www.imf.org/en/Publications/WP/Issues/2023/10/04/labor-market-exposure-to-ai-cross-country-differences-and-distributional-implications-539656

3. IMF (2024). Impact of AI on Singapore's Labor Market. *IMF Selected Issues Papers*, SIP/2024/040. https://www.elibrary.imf.org/view/journals/018/2024/040/article-A001-en.xml

4. Eloundou, T., Manning, S., Mishkin, P., & Rock, D. (2023). GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models. *arXiv preprint* arXiv:2303.10130. https://arxiv.org/abs/2303.10130

5. Felten, E., Raj, M., & Seamans, R. (2023). How will Language Modelers like ChatGPT Affect Occupations and Industries? *arXiv preprint* arXiv:2303.01157. https://arxiv.org/abs/2303.01157 (GenAI AIOE update)

6. Frey, C.B., & Osborne, M.A. (2017). The future of employment: How susceptible are jobs to computerisation? *Technological Forecasting and Social Change*, 114, 254-280. https://doi.org/10.1016/j.techfore.2016.08.019

7. Webb, M. (2020). The Impact of Artificial Intelligence on the Labor Market. *Stanford University Working Paper*. https://www.michaelwebb.co/webb_ai.pdf

8. Demirer, M., et al. (2025). Canaries in the Coal Mine: Early Signals from AI's Impact on the Labor Market. *Stanford Digital Economy Lab*. https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/

9. Ministry of Manpower, Singapore (2025). Jobs in Demand 2025. Released December 30, 2025. https://stats.mom.gov.sg/Pages/Infographic-Jobs-in-Demand-2025.aspx

10. Ministry of Manpower, Singapore (2025). Job Vacancies 2024. Released March 28, 2025. https://stats.mom.gov.sg/Pages/Job-Vacancies-2024.aspx

### Software & Tools

| Tool | Purpose | License |
|------|---------|---------|
| SvelteKit + Svelte 5 | Web framework | MIT |
| D3.js (d3-hierarchy, d3-scale, etc.) | Visualization math | ISC |
| Tailwind CSS v4 | Styling | MIT |
| xlsx | Excel parsing for data pipeline | Apache-2.0 |
| Bun | JavaScript runtime & package manager | MIT |

---

## 6. Feature Requirements

### 6.1 Home Page (`/`)

**Hero Section:**
- Title: "Singapore AI Occupation Impact Index"
- Subtitle: "Three layers of AI impact across 562 occupations — exposure, human bottleneck, and market resilience. Risk bands with visible confidence."
- Key stats bar: Total Workers (2,376,400) | Occupations (562) | High Risk (XX%) | Augmented (XX%) | Low Impact (XX%)

**Interactive Treemap:**
- All 562 occupations in nested treemap (major group → occupation)
- Area: outer cells = group employment (accurate), inner cells = wage median (proxy)
- Color: major group (categorical)
- Opacity: net risk band intensity (darker = higher risk)
- Hover: tooltip with occupation name, scores, category, wage
- Click: navigate to occupation detail page
- Desktop: full SVG treemap with ResizeObserver
- Mobile (<768px): grouped card list with 9 collapsible sections

**Quadrant Scatter Plot:**
- Below treemap
- X = AIOE (exposure), Y = Theta (complementarity)
- Quadrant labels: "AI Augmented" (top-right), "At Risk" (bottom-right), "Stable" (top-left), "Unaffected" (bottom-left)
- Dot size = fixed, dot color = major group
- Hover: tooltip, click: navigate to detail

**Filter Panel:**
- Desktop: sticky left sidebar (280px)
- Mobile: collapsible panel
- Controls:
  - Search: autocomplete text input (filters as you type)
  - Major group: multi-select checkboxes (9 groups)
  - Wage range: dual-handle slider (SGD 1,000 – 20,000)
  - Risk category: toggle chips (At Risk / Augmented / Low Impact / All)
  - Reset all button
- URL sync: all filter state encoded in URL search params (shareable links)
- Filters affect BOTH treemap and scatter plot simultaneously

### 6.2 Occupation Detail Page (`/occupation/[ssoc]`)

Each of 562 occupations gets a **rich, standalone page** (prerendered at build time). This is the primary content differentiator vs. Karpathy.

**Header:**
- Occupation title (h1)
- Major group badge
- Category badge (At Risk / AI Augmented / Low Impact) with color
- SSOC code

**Four-Axis Score Card:**
- Net Displacement Risk (large number, 0-1 scale) with confidence badge (High/Medium/Low)
- Four axis breakdown: Exposure | Task Share | Market Resilience | Net Risk
- Visual: radar/spider chart showing all four axes with major group average overlay
- Category label with explanation sentence

**Wage Information:**
- Horizontal bar: 25th percentile → 75th percentile range
- Dot at median
- Label: "SGD X,XXX / month (median gross)"
- Comparison: "X% above/below national median"

**Task Decomposition:**
- 5-8 core tasks with % time and AI exposure level per task
- Visual: stacked bar showing automatable vs. non-automatable task time
- "Where does the exposure come from?" — highlights which specific tasks drive the score

**Market Resilience Breakdown:**
- Demand strength: in-demand flag from MOM, employment trend
- Human bottlenecks: complementarity factors (responsibility, physicality, regulation)
- "Why this job is [resilient/vulnerable]" — explains market buffer in plain language

**Scoring Explanation:**
- "How was this scored?" expandable section
- AIOE score with interpretation
- Theta score with interpretation
- Which ISCO-08 codes were matched (transparency)
- Match quality: direct / group-average / interpolated

**Similar Occupations:**
- 5 most similar by: same major group + nearest C-AIOE score
- Card format: title, category badge, wage, score
- Click to navigate

**SEO:**
- Title tag: "[Occupation] — AI Exposure Score | Singapore AI Job Map"
- Meta description: "[Occupation] has an AI exposure score of X.XX. Median wage SGD X,XXX. Category: [category]. See detailed breakdown."
- Structured data: JobPosting or Occupation schema.org markup
- Canonical URL: /occupation/[ssoc]

### 6.3 Methodology Page (`/methodology`)

Full transparency — this page earns academic/policy backlinks.

**Sections:**
1. **Overview** — AI exposure and job displacement are different objects. Why we separate them.
2. **Why not LLM scoring** — The circularity problem. Why peer-reviewed indices are more defensible.
3. **Layer 1: Exposure (AIOE)** — Felten et al. methodology. 10 AI applications -> 52 abilities -> occupations.
4. **Layer 2: Human Bottleneck (Theta)** — Pizzinelli et al. 6 dimensions, 12 O*NET variables, formula.
5. **Layer 3: Market Resilience** — Group-level momentum + occupation-level scarcity. Why market is a calibrator, not override.
6. **Net Risk Formula** — `exposure * (1 - bottleneck) * market_modifier`. Risk bands, not decimals.
7. **Confidence** — Crosswalk quality, data granularity, source freshness. Why confidence is first-class.
8. **Crosswalk** — SSOC -> ISCO-08 -> SOC chain. Coverage stats (92.7% direct).
9. **Worked examples** — Software developer (Low), data entry clerk (Very High), surgeon (Very Low).
10. **Limitations** — All 9 limitations from section 4.10 with honest disclosure.
11. **Data sources** — Table of all datasets with download links.
12. **Full citations** — All 10 academic references.
13. **Reproduce our results** — Link to GitHub, `bun run scripts/score.ts`.

### 6.4 About Page (`/about`)

- Project description and motivation
- Team credits
- "Inspired by Andrej Karpathy's AI Employment Outlook Map" (with link)
- Data sources summary with links
- Open source: GitHub link, MIT license
- "Adapt for your country" — brief guide + link to CONTRIBUTING.md
- Contact / feedback method

### 6.5 Navigation & Layout

**Header (all pages):**
- Logo/title: "SG AI Jobs" → link to /
- Nav: Explore (/) | Methodology | About
- Search shortcut: magnifying glass icon → focuses search input on home page

**Footer (all pages):**
- "Data: Ministry of Manpower, Singapore (2024). Methodology: Felten et al. (2021), Pizzinelli et al. (2023)."
- GitHub link | MIT License
- "Scores represent technical AI exposure, not employment predictions."

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Lighthouse Performance score: >90
- First Contentful Paint: <1.5s
- Total bundle size: <200KB gzipped (excluding data JSON)
- Data JSON: ~20KB gzipped (562 occupations)
- All pages statically generated (adapter-static) — zero server runtime
- Precompressed with gzip + brotli (adapter-static `precompress: true`)

### 7.2 SEO
- All 562 occupation pages prerendered as static HTML
- Unique title tags and meta descriptions per occupation
- Structured data (schema.org) on occupation pages
- Sitemap.xml generated at build time
- robots.txt allowing all crawlers
- Open Graph + Twitter Card meta tags for social sharing
- Clean URLs: /occupation/21661 (not /occupation?ssoc=21661)
- Internal linking: each occupation links to 5 similar occupations
- Methodology page targets high-DA academic/policy backlinks

### 7.3 Accessibility
- WCAG 2.1 AA compliance
- All visualizations have text alternatives (screen reader descriptions)
- Treemap cells have aria-labels with occupation name and score
- Color is never the sole indicator — all categories have text labels
- Keyboard navigation: tab through treemap cells, enter to navigate
- Sufficient color contrast ratios (4.5:1 minimum)
- Mobile card list is fully accessible by default

### 7.4 Responsive Design
- Desktop (>1024px): treemap + sidebar filters + scatter plot
- Tablet (768-1024px): treemap stacked above filters
- Mobile (<768px): card list replaces treemap, collapsible filter panel
- Detail pages work at all breakpoints (SVG viewBox scaling)
- Touch targets: minimum 44×44px on mobile

### 7.5 Browser Support
- Chrome/Edge 90+, Firefox 90+, Safari 15+
- No IE11 support
- JavaScript required for visualizations (static HTML rendered for SEO)

---

## 8. Information Architecture

```
/                               Home (treemap + scatter + filters + stats)
/occupation/[ssoc]              562 occupation detail pages
/methodology                    Full scoring methodology with citations
/about                          Credits, sources, open source info
/sitemap.xml                    Auto-generated sitemap
```

**Internal linking structure:**
- Home → every occupation (via treemap/card click)
- Each occupation → 5 similar occupations
- Each occupation → /methodology ("How was this scored?")
- /methodology → /about (data sources)
- /about → GitHub repo
- Footer on every page links to /methodology and /about

---

## 9. Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | SvelteKit + Svelte 5 | Compiles to direct DOM updates (no vDOM overhead for 562 elements). SSG via adapter-static. MIT Vis & Society course standard for data viz. |
| Visualization | D3.js (math modules only) | d3-hierarchy for treemap layout, d3-scale for color/size mappings. Svelte renders all DOM. |
| Styling | Tailwind CSS v4 | Utility-first, stable since Jan 2025, @tailwindcss/vite plugin. |
| Data pipeline | TypeScript (via Bun) | Single language for entire project. xlsx package for Excel parsing. |
| Deployment | Vercel (free tier) | Automatic deploys from GitHub, global CDN, free for static sites. |
| Package manager | Bun | Fast installs, native TypeScript execution for scripts. |

---

## 10. Open Source Strategy

### Repository: `github.com/[user]/sg-ai-jobs`

**License:** MIT

**What's open:**
- All source code (website + data pipeline)
- Full methodology documentation
- `data/occupations.json` — the complete scored dataset
- Country adapter template (`scripts/adapters/template.ts`)
- Crosswalk tables and intermediate data

**What stays website-exclusive:**
- Editorial blog posts / analysis articles
- "Top 10 most at-risk jobs" etc. (content marketing)
- Custom OG images and visual assets

### Country Adapter Pattern

```typescript
interface CountryAdapter {
  fetchOccupations(): Promise<Occupation[]>;   // title, code, description
  fetchEmployment(): Promise<Map<string, number>>;  // code → count
  fetchWages(): Promise<Map<string, WageData>>;     // code → 25th/50th/75th
  getCrosswalk(): Promise<Map<string, string>>;     // local_code → ISCO-08
}
```

Adapters for: Singapore (implemented), USA (template), UK (template), others (community).

### README Structure
1. Live demo link + screenshot
2. Key findings (headline stats)
3. Methodology summary with academic citations
4. Quick start (`bun install && bun run scripts/score.ts && bun run dev`)
5. Adapt for your country (step-by-step)
6. Data sources with download links
7. Limitations (honest)
8. Contributing guide
9. License (MIT)
10. Academic citations (full)

---

## 11. Implementation Phases

### Phase 1: Foundation (current — in progress)
- [x] SvelteKit scaffold with Tailwind v4, D3, adapter-static
- [x] Raw MOM data copied to `data/raw/`
- [ ] Scoring pipeline: Felten AIOE + Pizzinelli theta + crosswalk → `occupations.json`
- [x] Treemap visualization with mock data
- [x] Home page with stats header
- [x] Mobile card list fallback

### Phase 2: Interactivity
- [ ] Scatter plot (exposure × complementarity)
- [ ] Filter panel with URL sync
- [ ] 562 occupation detail pages with radar chart + wage bar
- [ ] Methodology page
- [ ] About page

### Phase 3: Polish
- [ ] Replace mock scores with real pipeline output
- [ ] SEO meta tags + structured data + sitemap
- [ ] OG image generation
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Deploy to Vercel

### Phase 4: Full Two-Stage Scoring (v1.1)
- [ ] LLM task decomposition (3 passes, deterministic scoring) → exposed_task_share
- [ ] Technical substitution = geometric_mean(c_aioe, exposed_task_share)
- [ ] Market resilience subfactors (demand_strength from MOM flags, hiring_shortage from MOM trends, regulation + physicality from O*NET)
- [ ] Market buffer = weighted_mean of 5 subfactors
- [ ] Net displacement risk = technical_substitution × (1 - market_buffer)
- [ ] Confidence score per occupation
- [ ] LLM contradiction checks (flag disagreements)
- [ ] Update all detail pages with 4-axis display
- [ ] Update methodology page with full two-stage explanation

### Phase 5: Career-Stage Lens (v1.2)
- [ ] Stanford Canaries integration — which tasks are entry-level vs. senior?
- [ ] Junior/senior impact differential per occupation
- [ ] Career pathway visualization

### Phase 6: Content & Growth
- [ ] Editorial blog posts (e.g., "How AI Affects Singapore's Financial Sector")
- [ ] Social sharing cards per occupation
- [ ] GitHub README + CONTRIBUTING.md
- [ ] Country adapter template
- [ ] Launch: Hacker News, Reddit, LinkedIn

---

## 12. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Crosswalk coverage | >85% direct match | Pipeline validation output |
| Lighthouse Performance | >90 | Lighthouse audit |
| Lighthouse Accessibility | >90 | Lighthouse audit |
| Lighthouse SEO | >90 | Lighthouse audit |
| Build time | <60s for 562+ pages | `bun run build` timing |
| Bundle size | <200KB gzip (excl. data) | Build output |
| Occupation pages indexed | 562 | Google Search Console |
| GitHub stars (6 months) | >500 | GitHub |
| Organic traffic (6 months) | >10K monthly | Analytics |

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Felten AIOE dataset format changes | Low | High | Pin to specific commit hash, cache locally in `data/raw/` |
| O*NET data schema changes | Low | Medium | Pin to specific O*NET version (e.g., 29.0) |
| SSOC-ISCO crosswalk gaps >15% | Medium | Medium | Fall back to 2-digit ISCO group average; disclose coverage on methodology page |
| Employment data truly proportional | Confirmed | Medium | Size treemap inner cells by wage, disclose limitation |
| Academic criticism of methodology | Medium | Low | Full transparency, open data, cite all sources, disclose limitations upfront |
| Wage-spread ambiguity (specialization vs seniority) | Medium | Low | Used at ~16% effective weight; documented in methodology |
| Band thresholds need calibration | Confirmed | Medium | Run full-distribution check against anchor occupations before shipping |

---

## Appendix A: Data Schema

```typescript
interface Occupation {
  ssoc: string;                    // SSOC 2020 code (e.g., "21661")
  title: string;                   // Occupation title
  major_group: string;             // Major group name (e.g., "PROFESSIONALS")
  major_group_code: number;        // Major group number (1-9)
  gross_wage_median: number;       // SGD/month
  gross_wage_25th: number;         // SGD/month
  gross_wage_75th: number;         // SGD/month
  basic_wage_median: number;       // SGD/month (excluding employer CPF)
  basic_wage_25th: number;
  basic_wage_75th: number;
  employment_thousands: number;    // Proportional estimate (group_total / count)
  group_employment_thousands: number;  // Major group total (accurate)

  // Layer 1: Exposure (occupation-level)
  exposure: number;                // pctile(aioe), 0-1

  // Layer 2: Human Bottleneck (occupation-level)
  bottleneck: number;              // pctile(theta), 0-1

  // Layer 3: Market Resilience (hierarchical)
  market: {
    market_momentum: number;       // mean(pctile(empl_cagr), pctile(wage_cagr)), group-level
    occupation_scarcity: number;   // mean(pctile(log_wage_spread), pctile(wage_position)), occ-level
    market_resilience: number;     // 0.6 * momentum + 0.4 * scarcity
    market_modifier: number;       // 1 - 0.35 * resilience
  };

  // Net Risk
  net_risk: number;                // exposure * (1 - bottleneck) * market_modifier
  risk_band: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

  // Augmentation (v1.1 — same inputs, different formula)
  augmentation?: number;           // exposure * bottleneck * market_resilience
  augmentation_band?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  impact_type?: 'at_risk' | 'ai_leveraged' | 'stable' | 'mixed';

  // Confidence (first-class)
  confidence: {
    score: number;                 // 0-1
    level: 'high' | 'medium' | 'low';
    crosswalk_quality: number;     // 1.0 direct, 0.6 sub-major avg, 0.3 major fallback
    market_data_granularity: number; // 1.0 strong occ signals, 0.6 group only, 0.3 sparse
    source_freshness: number;      // 1.0 all 2023+, 0.6 mixed, 0.3 stale
  };

  // Raw scores (for display and IMF comparability, NOT used in net_risk)
  raw: {
    aioe: number;                  // Raw Felten AIOE score
    theta: number;                 // Raw Pizzinelli theta
    c_aioe: number;                // Reference only: aioe * (1 - (theta - theta_min))
    log_wage_spread: number;       // log(q75/q25), winsorized
    wage_position: number;         // occupation_median / group_median
  };

  // Metadata
  isco_codes_matched: string[];    // ISCO-08 codes used for scoring
  match_quality: 'direct' | 'group_average' | 'interpolated';
}
```

## Appendix B: Attribution Notice

This project builds upon and cites the following academic work:

> **AI Occupational Exposure Index (AIOE)** by Edward Felten, Manav Raj, and Robert Seamans, published in the Strategic Management Journal (2021). We use their publicly released dataset to measure AI-capability overlap with occupation abilities.

> **Complementarity-Adjusted AIOE (C-AIOE)** by Carlo Pizzinelli, Augustus Panton, Marina Mendes Tavares, Diego A. Cerdeiro, and Cory T. Stanton, published as an IMF Working Paper (2023). We independently compute their complementarity metric (theta) from O*NET data following their published methodology.

> **O*NET data** is provided by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the Creative Commons Attribution 4.0 International License. O*NET is a trademark of USDOL/ETA.

> **Singapore occupation and wage data** is sourced from the Ministry of Manpower (MOM) and the Department of Statistics Singapore (SingStat). SSOC 2020 classification is maintained by SingStat.

> This project was inspired by **Andrej Karpathy's AI Employment Outlook Map** (March 2026), which demonstrated the value of visualizing AI job exposure at the occupation level.

This project is not affiliated with, endorsed by, or sponsored by any of the above institutions.
