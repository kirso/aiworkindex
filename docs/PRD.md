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

1. **Exposure** — How much does this job overlap with AI capabilities? (Felten AIOE)
2. **Automatable Task Share** — What % of this job's core tasks can AI actually perform? (LLM-structured, deterministically scored)
3. **Market Resilience** — How strong are the human bottlenecks, demand signals, and regulatory barriers? (MOM data + O*NET factors)
4. **Net Displacement Risk** — Combining the above into a defensible composite with visible confidence

### Goals
- **For job seekers:** Understand how AI affects *your* specific occupation in Singapore — not a single vague number, but four distinct axes showing exposure, task share, market resilience, and net risk, with a confidence indicator.
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

**Our differentiation:** First to explicitly separate technical exposure from labor-market displacement risk, with four visible axes, confidence scores, and a reproducible open-source methodology. Not another LLM-vibes leaderboard.

---

## 4. Scoring Methodology

### Core Principle: Two-Stage System

**AI exposure and job displacement are different objects.** We deliberately separate them into two stages:

- **Stage 1 — Technical Substitution**: How much of this job *could* AI do? (occupation-level, deterministic)
- **Stage 2 — Market Translation**: How much of that technical potential *will* translate to actual displacement? (hierarchical: occupation-specific where data exists, major-group calibration otherwise)

This produces four visible axes per occupation, not one magic number:

| Axis | What it measures | Source | Level |
|------|-----------------|--------|-------|
| **Exposure** | AI capability overlap with job abilities | Felten AIOE (2021) | Per-occupation |
| **Automatable Task Share** | % of core tasks AI can perform today | LLM-structured decomposition, deterministic scoring | Per-occupation |
| **Market Resilience** | Human bottlenecks + demand + regulation + physicality | O*NET + MOM data + demand flags | Hierarchical |
| **Net Displacement Risk** | Combined estimate with confidence | Composite formula | Per-occupation |

### 4.1 Stage 1 — Technical Substitution

#### 4.1.1 AI Exposure (AIOE)

- **Source**: Felten, Raj & Seamans (2021). "Occupational, industry, and geographic exposure to artificial intelligence: A novel dataset and its potential uses." *Strategic Management Journal*, 42(12), 2195-2217. https://doi.org/10.1002/smj.3286
- **Dataset**: https://github.com/AIOE-Data/AIOE (`AIOE_DataAppendix.xlsx`)
- **Method**: Maps 10 AI application categories to 52 human abilities via crowdsourced ratings (Amazon Mechanical Turk), then links abilities to occupations via O*NET ability importance scores.
- **Coverage**: ~800 US occupations by 6-digit SOC code
- **Scale**: Continuous (higher = more of this job's required abilities overlap with AI capabilities)
- **What it does NOT measure**: Whether exposure leads to augmentation or replacement

#### 4.1.2 Complementarity (Theta)

- **Source**: Pizzinelli, Panton, Mendes Tavares, Cerdeiro & Stanton (2023). "Labor Market Exposure to AI: Cross-country Differences and Distributional Implications." *IMF Working Paper* WP/23/216. https://www.imf.org/en/Publications/WP/Issues/2023/10/04
- **Data**: O*NET Work Context variables + Job Zones (publicly available from https://www.onetcenter.org/database.html, CC-BY 4.0 license)
- **Method**: 12 O*NET variables across 6 dimensions:
  1. **Communication**: Face-to-Face Discussions (4.C.1.a.2.l), Public Speaking (4.C.1.a.4)
  2. **Responsibility**: Outcomes/Results (4.C.1.c.1), Health/Safety (4.C.1.c.2)
  3. **Physical Conditions**: Outdoors/Weather (4.C.2.d.1.e), Physical Proximity (4.C.2.d.1.i)
  4. **Criticality**: Consequence of Errors (4.C.3.b.2), Decision Freedom (4.C.3.b.4), Decision Frequency (4.C.3.b.7)
  5. **Routine** (inverted): Degree of Automation (4.C.3.d.4), Structured vs. Unstructured (4.C.3.d.8)
  6. **Skills**: Job Zone (1-5, scaled to 20-100)
- **Formula**: `theta = mean(communication, responsibility, physical, criticality, routine, skills) / 100`
- **Scale**: 0 to 1 (higher = more complementary to AI, harder to substitute)

#### 4.1.3 Automatable Task Share (exposed_task_share)

- **Method**: LLM-structured task decomposition with deterministic scoring
- **Process**:
  1. For each occupation, Claude Sonnet decomposes the role into 5-8 core tasks with time-weight percentages
  2. Each task is classified against a fixed rubric: `routine-cognitive`, `routine-manual`, `creative`, `interpersonal`, `physical`
  3. Run 3 times per occupation; take majority classification per task; flag >1 disagreement for review
  4. `exposed_task_share` = sum of time-weights for tasks classified as `routine-cognitive` or `routine-manual`
- **LLM role**: Structured decomposition only. The LLM produces JSON (task name, time %, category). Scoring is deterministic. The LLM never assigns a risk score.
- **Cost**: ~$5-10 for 562 occupations (3 passes × 562 × ~500 tokens)
- **Examples**:
  - Software developer: ~35% (code writing is routine-cognitive; architecture, debugging, code review, meetings are creative/interpersonal)
  - Data entry clerk: ~85% (nearly all tasks are routine-cognitive)
  - Surgeon: ~15% (pre-op planning is routine-cognitive; surgery itself is physical + creative)

#### 4.1.4 Technical Substitution Score

```
technical_substitution = geometric_mean(c_aioe, exposed_task_share)
```

Where `c_aioe = AIOE × (1 - (theta - theta_MIN))` per Pizzinelli et al. (2023).

Geometric mean (not arithmetic) because both signals must be present for technical substitution to be real. A job with high C-AIOE but low task share (surgeon) or high task share but low C-AIOE (manual assembler doing repetitive physical work) both score lower than a job high on both (data entry clerk).

### 4.2 Stage 2 — Market Translation

Technical substitution potential doesn't directly predict job loss. Stage 2 models the **market buffer** — factors that dampen or accelerate the translation from technical exposure to actual displacement.

#### 4.2.1 Market Resilience Subfactors

Replace the single "elastic/neutral/inelastic" label with decomposed subfactors (each 0-1, higher = more resilient):

| Subfactor | Source | Method | Level |
|-----------|--------|--------|-------|
| **Complementarity** | Pizzinelli theta (already computed) | Direct from Stage 1 | Per-occupation |
| **Demand Strength** | MOM Jobs in Demand 2025, Job Vacancies 2024 | Binary flag: is this occupation listed as in-demand by MOM? | Per-occupation where available, group-level otherwise |
| **Hiring Shortage** | MOM employment trends 2020→2025 | Employment growth rate by major group; wage growth rate as demand proxy | Major-group level (data granularity limitation) |
| **Regulation / Licensing** | O*NET Work Context: Consequence of Errors, Responsibility for Health/Safety | High-consequence occupations face regulatory barriers to AI adoption | Per-occupation (via crosswalk) |
| **Physicality** | O*NET Work Context: Outdoors/Weather, Physical Proximity | Physical presence requirements limit AI substitution | Per-occupation (via crosswalk) |

```
market_buffer = weighted_mean(
  complementarity,        // weight: 0.25
  demand_strength,        // weight: 0.25
  hiring_shortage,        // weight: 0.20
  regulation,             // weight: 0.15
  physicality             // weight: 0.15
)
```

**Key design decision**: Labor market data (employment trends, wages) is a **calibrator**, not an override. Employment and wages are lagging and confounded by many factors. They dampen or elevate risk — they don't erase the exposure layer.

#### 4.2.2 Hierarchical Data Strategy

Our MOM data is coarser than the 562-occupation level:
- `employment_by_occupation.csv` — major-group series, not per-occupation
- `median_income_by_occupation.csv` — major-group × sex series

v1 scoring is therefore **hierarchical**:
- **Occupation-level**: technical score (AIOE, theta, task share from crosswalk + LLM)
- **Major-group adjustment**: market buffer calibrated from MOM group-level employment/wage trends
- **Occupation-specific flags**: MOM Jobs in Demand 2025 and Job Vacancies 2024 provide binary in-demand flags for specific occupations (e.g., software developers, data scientists, nurses)

This is actually strong enough for a credible Singapore release. The granularity matches what the IMF used in their own Singapore analysis.

### 4.3 Net Displacement Risk (Composite)

```
net_displacement_risk = technical_substitution × (1 - market_buffer)
```

Where:
- `technical_substitution = geometric_mean(c_aioe, exposed_task_share)`
- `market_buffer = weighted_mean(complementarity, demand_strength, hiring_shortage, regulation, physicality)`
- Scale: 0 to 1 (higher = higher displacement risk)

#### 4.3.1 Confidence Score

Every score carries a visible confidence indicator:

```
confidence = crosswalk_confidence × task_consensus × data_coverage
```

Where:
- `crosswalk_confidence`: 1.0 for direct ISCO match, 0.7 for 2-digit group average, 0.4 for interpolated
- `task_consensus`: Agreement rate across 3 LLM decomposition passes (0-1)
- `data_coverage`: 1.0 if MOM demand flag exists, 0.7 if only group-level data, 0.5 if no local data

Displayed on every occupation page as: High / Medium / Low confidence badge.

### 4.4 Worked Examples

**Software Developer (SSOC 21661):**
| Axis | Value | Rationale |
|------|-------|-----------|
| AIOE | 0.82 | High — coding, analysis, documentation all overlap with AI capabilities |
| Theta | 0.71 | High — creative problem-solving, system design, collaboration |
| Exposed task share | 0.35 | Code writing (~35% of time) is routine-cognitive; architecture, debugging, code review, meetings are not |
| C-AIOE | 0.58 | Moderate — high exposure dampened by high complementarity |
| Technical substitution | geometric_mean(0.58, 0.35) = **0.45** | |
| Market buffer | weighted_mean(0.71, 1.0, 0.8, 0.3, 0.1) = **0.62** | High complementarity + MOM in-demand flag + growing employment; low regulation/physicality |
| **Net displacement risk** | 0.45 × (1 - 0.62) = **0.17** | Low |
| Confidence | 1.0 × 0.95 × 1.0 = **0.95** | High — direct crosswalk, strong task consensus, MOM demand flag |

**Data Entry Clerk (SSOC 41320):**
| Axis | Value | Rationale |
|------|-------|-----------|
| AIOE | 0.88 | Very high — data processing is core AI capability |
| Theta | 0.32 | Low — routine, structured, low consequence, no physical presence |
| Exposed task share | 0.85 | Nearly all tasks are routine-cognitive data processing |
| C-AIOE | 0.82 | High — high exposure with low complementarity |
| Technical substitution | geometric_mean(0.82, 0.85) = **0.83** | |
| Market buffer | weighted_mean(0.32, 0.0, 0.4, 0.1, 0.05) = **0.21** | Low complementarity, not in-demand, declining employment, no regulation/physicality |
| **Net displacement risk** | 0.83 × (1 - 0.21) = **0.66** | High |
| Confidence | 1.0 × 0.90 × 0.7 = **0.63** | Medium — direct crosswalk, good consensus, group-level data only |

**Surgeon (SSOC 22121):**
| Axis | Value | Rationale |
|------|-------|-----------|
| AIOE | 0.45 | Moderate — some diagnostic/planning tasks overlap, but core surgical work doesn't |
| Theta | 0.89 | Very high — life/death responsibility, physical presence, independent judgment |
| Exposed task share | 0.15 | Only pre-op planning and documentation are routine-cognitive |
| C-AIOE | 0.30 | Low — moderate exposure heavily dampened by very high complementarity |
| Technical substitution | geometric_mean(0.30, 0.15) = **0.21** | |
| Market buffer | weighted_mean(0.89, 0.8, 0.9, 0.95, 0.7) = **0.86** | Extreme regulation, physical presence, high responsibility, growing demand |
| **Net displacement risk** | 0.21 × (1 - 0.86) = **0.03** | Very Low |
| Confidence | 1.0 × 0.98 × 0.7 = **0.69** | Medium-High |

### 4.5 Career-Stage Lens (v1.1)

Stanford's "Canaries in the Coal Mine" research ([Stanford DEL, 2025](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/)) shows AI's early labor market effects are concentrated on early-career workers. "Software engineering is fine overall" and "junior developers are getting squeezed" can both be true.

v1.1 will add a career-stage modifier:
- Jobs where AI automates **entry-level tasks** (the learning pathway into the profession) face higher long-term risk even if current employment is growing
- This is modeled by examining which tasks in the decomposition are typically performed by junior vs. senior workers
- Not in v1 because it requires additional occupation-specific context beyond what crosswalk data provides

### 4.6 LLM Usage Policy

The LLM (Claude Sonnet) is used **only** for:
1. **Structured task decomposition** — Produce JSON with task name, time %, category. Run 3 times. Score deterministically.
2. **Missing-factor detection** — Flag occupations where crosswalk quality is low and additional context would help.
3. **Contradiction checks** — "Given these scores, does this classification make sense?" Flag disagreements for human review.

The LLM **never** assigns a risk score, exposure number, or category label. All scoring is deterministic from academic indices and survey data.

### 4.7 Crosswalk Chain

- SSOC 2020 → ISCO-08: SingStat published concordance (https://www.singstat.gov.sg)
- ISCO-08 → US SOC 2010: BLS published crosswalk (https://www.bls.gov/soc/)
- When one ISCO maps to multiple SOC codes: average AIOE and theta values
- Unmapped occupations: fall back to 2-digit ISCO sub-major group average
- Expected coverage: >85% of 562 occupations with direct match

### 4.8 Limitations (disclosed transparently)

1. **Exposure ≠ displacement** — We model this gap explicitly, but the market translation layer uses heuristics and lagging indicators. Real displacement dynamics are more complex than any index can capture.
2. **US-centric ability data** — O*NET surveys US workers. Task composition may differ in Singapore's regulatory and cultural environment. We follow Pizzinelli et al.'s own caveat.
3. **Proportional employment** — Per-occupation employment is group_total / count, not actual counts. Real per-occupation data requires MOM's OED (not publicly available). Market buffer at occupation level uses demand flags, not employment counts.
4. **Hierarchical granularity** — Market signals are major-group level with occupation-specific flags where MOM data exists. This means two occupations in the same major group share the same hiring shortage and employment trend signal.
5. **Static exposure snapshot** — Felten AIOE reflects 2021 AI capabilities. The GenAI AIOE extension partially addresses this for language models.
6. **Career stage blind spot in v1** — v1 scores the occupation as a whole. Stanford's Canaries research suggests junior/senior impact differs significantly. Addressed in v1.1.
7. **Crosswalk imprecision** — Some SSOC occupations are Singapore-specific (e.g., "HDB estate manager") and may not have clean US SOC equivalents. Confidence score reflects this.
8. **LLM task decomposition variance** — 3-pass majority voting reduces but doesn't eliminate LLM inconsistency. Task consensus score makes this visible.

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
- Subtitle: "Four axes of AI impact across 562 occupations — exposure, task share, market resilience, and displacement risk. Academic indices, not LLM vibes."
- Key stats bar: Total Workers (2,376,400) | Occupations (562) | High Risk (XX%) | Augmented (XX%) | Low Impact (XX%)

**Interactive Treemap:**
- All 562 occupations in nested treemap (major group → occupation)
- Area: outer cells = group employment (accurate), inner cells = wage median (proxy)
- Color: major group (categorical)
- Opacity: C-AIOE score (darker = higher risk)
- Hover: tooltip with occupation name, scores, category, wage
- Click: navigate to occupation detail page
- Desktop: full SVG treemap with ResizeObserver
- Mobile (<768px): grouped card list with 9 collapsible sections

**Quadrant Scatter Plot:**
- Below treemap
- X = AIOE (exposure), Y = Theta (complementarity)
- Quadrant labels: "AI Augmented" (top-right), "At Risk" (bottom-right), "Stable" (top-left), "Unaffected" (bottom-left)
- Dot size = employment weight, dot color = major group
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
1. **Overview** — What we measure and why. Difference between exposure, complementarity, and net risk.
2. **Why not LLM scoring** — The circularity problem. Why peer-reviewed indices are more defensible.
3. **Layer 1: AI Exposure (AIOE)** — Full Felten et al. methodology explanation with citation. How 10 AI applications map to 52 abilities to occupations.
4. **Layer 2: Complementarity (Theta)** — Full Pizzinelli et al. methodology. The 6 dimensions, 12 variables, formula. Why in-person interaction and decision-making responsibility matter.
5. **Layer 3: Combined Score (C-AIOE)** — Formula, interpretation, IMF usage across 142 countries.
6. **Crosswalk** — How we map Singapore SSOC codes to international standards. Coverage statistics.
7. **Enhanced methodology (v1.1)** — Task decomposition, demand elasticity, labor market signals. Why software engineering scores differently than data entry.
8. **Limitations** — Honest disclosure of all 6 limitations from section 4.3.
9. **Data sources** — Table of all datasets with download links.
10. **Full citations** — All 7 academic references in proper format.
11. **Reproduce our results** — Link to GitHub, instructions to run the pipeline.

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
| LLM task decomposition inconsistency | Medium | Low | 2 passes with divergence flagging; deterministic fallback scores |

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
  employment_thousands: number;    // Proportional estimate within group
  group_employment_thousands: number;  // Major group total (accurate)

  // Stage 1: Technical Substitution
  exposure: {
    aioe: number;                  // 0-1, Felten AI exposure index
    theta: number;                 // 0-1, Pizzinelli complementarity
    c_aioe: number;                // Combined exposure score (Pizzinelli formula)
    exposed_task_share: number;    // 0-1, % of core tasks that are automatable
    technical_substitution: number; // geometric_mean(c_aioe, exposed_task_share)
    tasks: Array<{
      name: string;
      time_weight: number;         // 0-1, fraction of job time
      category: 'routine-cognitive' | 'routine-manual' | 'creative' | 'interpersonal' | 'physical';
      ai_automatable: boolean;     // true for routine-cognitive and routine-manual
    }>;
  };

  // Stage 2: Market Translation
  market: {
    complementarity: number;       // 0-1, from theta (Stage 1)
    demand_strength: number;       // 0-1, from MOM in-demand flags
    hiring_shortage: number;       // 0-1, from employment growth rate (group-level)
    regulation: number;            // 0-1, from O*NET consequence of errors + health/safety
    physicality: number;           // 0-1, from O*NET outdoors + physical proximity
    market_buffer: number;         // weighted_mean of above 5 subfactors
    mom_in_demand: boolean;        // MOM Jobs in Demand 2025 flag
    employment_trend: 'growing' | 'stable' | 'declining'; // Group-level
  };

  // Composite
  net_displacement_risk: number;   // 0-1, technical_substitution × (1 - market_buffer)
  confidence: {
    score: number;                 // 0-1
    level: 'high' | 'medium' | 'low';
    crosswalk_quality: number;     // 1.0 direct, 0.7 group avg, 0.4 interpolated
    task_consensus: number;        // Agreement across 3 LLM passes
    data_coverage: number;         // 1.0 MOM flag, 0.7 group only, 0.5 no local data
  };

  // Metadata
  isco_codes_matched: string[];    // ISCO-08 codes used for scoring
  match_quality: 'direct' | 'group_average' | 'interpolated';
  category: 'high_risk' | 'augmented' | 'low_impact';
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
