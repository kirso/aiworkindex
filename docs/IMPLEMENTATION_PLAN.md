# Singapore AI Occupation Impact Index: Full Implementation Plan

**Version:** 1.0  
**Date:** 2026-03-17  
**Status:** Active implementation plan  
**Scope:** Product, UX, role coverage, data, methodology, validation, and growth

---

## 1. Purpose

This document is the single explicit plan for turning the current project from a strong research-grade AI job index into a fully fledged Singapore career intelligence product.

This plan complements:
- `docs/PRD.md`: product and methodology requirements
- `src/routes/methodology/+page.svelte`: public-facing methodology explanation

This document focuses on:
- what is already shipped
- what is still missing
- exact solutions for each gap
- what the ideal UX should look like
- how the methodology should evolve if data constraints are removed
- implementation sequencing

---

## 2. Current State

### 2.1 Shipped

The current app already includes:
- deterministic three-layer scoring:
  - exposure
  - human bottleneck
  - market resilience
- risk bands instead of pseudo-precise score labels
- visible confidence
- stability / sensitivity analysis
- Anthropic observed-usage calibration
- MOM SOL and Jobs in Demand signals
- cluster-level labour monitor
- occupation detail pages
- compare page
- alias search for many modern titles
- homepage visualizations:
  - treemap
  - histogram
  - wage-bracket chart
  - scatter plot
- evidence trail
- percentile bars
- methodology page
- validation pipeline

### 2.2 What The Product Is Today

Today the app is best described as:

> A strong, transparent Singapore AI occupation index with real methodology, good public data, and useful occupation pages.

It is **not yet** a full career intelligence product because several key capabilities are still missing:
- first-class support for modern non-SSOC roles
- highly personalized narrative output per role
- transition planning and role recommendations
- recurring value / return visits
- quarterly report productization
- occupation-level live demand data
- full data and methodology product surface

---

## 3. North Star

The long-term product should answer four questions for every user:

1. **What is happening to my role?**
2. **Why do you think that?**
3. **How sure are you?**
4. **What should I do next?**

The project should evolve from:

> "AI risk explorer"

to:

> "Singapore career intelligence platform for AI-era job change, resilience, and transition."

---

## 4. Product Principles

### 4.1 Honesty Rules

- Publish exact numbers only when they come from exact Singapore data at the same granularity.
- Publish bands, ranges, or flags when inputs are inferred, crosswalked, or group-level.
- Never convert group-level counts into fake occupation-level counts.
- Never claim `jobs displaced` without true occupation-level outcome data.
- Always label `synthetic` or `estimated` roles explicitly.

### 4.2 UX Rules

- Human-first pages, technical-first appendix.
- Show summary before evidence, evidence before formula.
- Do not lead with jargon outside the methodology pages.
- Every metric must answer: "Why should I care?"
- Every page should have a next action.

### 4.3 Methodology Rules

- Keep the model deterministic and interpretable.
- Add evidence layers before weighting them into the score.
- Validate against outcomes quarterly.
- Prefer uncertainty-aware output over false precision.

---

## 5. Main Gaps And Explicit Solutions

## 5.1 Role Coverage Gap

### Problem

Many modern roles are not official SSOC occupations:
- Product Manager
- Venture Capitalist
- Solutions Engineer
- Sales Engineer
- Developer Advocate
- RevOps
- People Partner
- ML Engineer
- Quant Researcher
- Supply Chain Analyst
- Founder Associate

Alias search partially helps, but the app still does not support these as first-class entities.

### Solution

Build a `synthetic role` system.

#### Deliverables

- New entity type: `role`
- New route: `/role/[slug]`
- New data file: `src/lib/data/synthetic-roles.ts`
- Separate search sections:
  - official occupations
  - estimated modern roles
- Confidence cap for synthetic roles
- Explicit UI badge: `Estimated modern role`

#### Scoring Rule

Synthetic roles are calculated from weighted component occupations, not mapped to a single official occupation.

```text
role_exposure = weighted mean(component exposure)
role_bottleneck = weighted mean(component bottleneck)
role_market_resilience = weighted mean(component market resilience)
role_net_risk = role_exposure × (1 - role_bottleneck) × role_market_modifier
```

#### Confidence Rule

Confidence must reflect:
- title ambiguity
- component dispersion
- cross-cluster spread
- source coverage
- whether the role is curated or alias-only

```text
synthetic_confidence = min(
  alias_quality,
  component_consistency,
  market_granularity,
  source_coverage
)
```

#### Initial Role Backfill List

Priority batch:
- Product Manager
- Technical Product Manager
- Project Manager
- Recruiter
- Talent Acquisition Partner
- DevOps Engineer
- Platform Engineer
- ML Engineer
- AI Engineer
- Data Engineer
- Solutions Engineer
- Sales Engineer
- Customer Success Manager
- Account Executive
- HR Business Partner
- People Partner
- RevOps Manager
- Operations Analyst
- Venture Capitalist
- Private Equity Associate

---

## 5.2 Search And Resolver Gap

### Problem

Search works, but it still behaves like an occupation resolver rather than a career-intelligence interface.

It can match aliases, but it cannot:
- disambiguate ambiguous roles
- present synthetic roles as first-class results
- learn from missing-title demand

### Solution

Build a proper resolver layer.

#### Deliverables

- `src/lib/data/role-resolver.ts`
- search result grouping:
  - official occupations
  - estimated modern roles
  - suggested alternatives
- disambiguation flows for ambiguous titles:
  - Product Manager
  - Operations Analyst
  - Investor
  - Account Manager
  - Consultant
- unresolved-query logging
- `Can't find your role?` request flow

#### Resolver Logic

Tier 1:
- exact official occupation title match

Tier 2:
- curated alias match

Tier 3:
- curated synthetic role match

Tier 4:
- semantic nearest-role suggestions

---

## 5.3 Narrative Personalization Gap

### Problem

The sections:
- `What AI Can and Can't Do`
- `Skills to Focus On`

are currently too generic because they rely too heavily on broad `major_group` buckets.

That causes obviously wrong output, such as journalism-related roles inheriting healthcare-style language.

### Solution

Replace group-based narrative generation with a deterministic narrative engine.

#### Inputs

For each role or occupation, derive:
- `primary_archetype`
- `secondary_archetype`
- `theta dimension profile`
- `impact_type`
- `exposure band`
- `labour monitor state`
- `official demand evidence`

#### Add New Data Layer

Export theta subdimensions from the scoring pipeline:
- communication
- responsibility
- physical
- criticality
- routine_inverted
- skills

#### Add New Narrative Layer

Create:
- `src/lib/data/role-archetypes.ts`
- `src/lib/narrative-engine.ts`

Role archetypes should include:
- writing_editorial
- teaching_learning
- software_engineering
- product_strategy
- design_research
- data_analytics
- policy_public_affairs
- finance_investing
- people_recruiting
- sales_gtm
- customer_success
- clinical_care
- operations_supply_chain
- field_manual
- leadership_management

#### Output Sections

The engine should generate:
- `AI can help with`
- `Humans still needed for`
- `Skills to build now`
- `What makes this role resilient`
- `What makes this role exposed`

#### Quality Strategy

Three-tier narrative quality:
- Tier 1: curated overrides for top 100 official roles
- Tier 2: archetype-driven deterministic generation
- Tier 3: generic fallback only when confidence is low

This same engine should support synthetic roles by blending component archetypes.

---

## 5.4 Actionability Gap

### Problem

The product is strong at diagnosis but still weaker on what users should do next.

### Solution

Turn role pages into decision-support pages.

#### Deliverables

On every role / occupation page, add:
- lower-risk adjacent roles
- higher-upside adjacent roles
- in-demand adjacent roles
- comparison CTA
- transition-oriented skills

#### Future Deliverable

Build a dedicated transition map:
- current role
- closest adjacent roles
- wage delta
- risk delta
- demand delta
- difficulty / confidence

---

## 5.5 Return-Visit Gap

### Problem

The product is useful, but there is not yet a strong recurring usage loop.

### Solution

Build watchlist and quarterly movement features.

#### Deliverables

- saved roles
- saved comparisons
- watchlist
- quarterly movement state:
  - hotter
  - colder
  - unchanged
- quarter-over-quarter role update cards
- quarterly report page
- alerting later:
  - role moved band
  - labour signal changed
  - new adjacent role recommendation

---

## 5.6 Labour Intelligence Gap

### Problem

The labour monitor is useful, but it is still embedded as a detail-page evidence section rather than a product surface.

### Solution

Elevate it into a quarterly labour-intelligence system.

#### Deliverables

- `/reports/[quarter]` quarterly report pages
- cluster-level labour monitor rankings
- role pages with `changed since last quarter`
- homepage module for:
  - heating up clusters
  - cooling down clusters
  - rising retrenchment
  - strongest demand despite AI overlap

#### Important Rule

The labour monitor remains:
- cluster-level
- explicitly labeled
- evidence first, score input later

---

## 5.7 Trust And Transparency Gap

### Problem

The methodology is good, but it still lacks a complete implementation appendix and a fuller research-grade data product surface.

### Solution

Add a trust layer.

#### Deliverables

- `/methodology`
- `/methodology/appendix`
- `/data`
- downloadable CSV/JSON snapshots
- data dictionary
- methodology version notes
- quarterly changelog
- backtest page later

#### Appendix Must Include

- exact risk band boundaries
- impact-type thresholds
- confidence thresholds
- stability rules
- Anthropic calibration formula
- SOL / Jobs in Demand exact vs prefix bonuses
- labour monitor aggregation rules
- synthetic-role confidence rules

---

## 5.8 Performance And Platform Quality Gap

### Problem

The app is functionally solid but not yet hardened like a top-tier maintained product.

### Solution

Improve performance, validation, and ops.

#### Deliverables

- code-split heavy homepage modules
- reduce oversized build chunks
- add pipeline freshness indicators
- stricter validation for:
  - labour monitor
  - synthetic roles
  - narrative engine
- operational checklist for every data refresh
- QA checklist for every methodology version

---

## 6. Product Architecture From Scratch

If the product were redesigned from first principles, it would be structured around user jobs-to-be-done rather than around charts.

### 6.1 Top-Level Navigation

Recommended primary navigation:
- `Find`
- `Compare`
- `Rankings`
- `Quarterly Report`
- `Methodology`
- `Data`

Secondary:
- `About`
- `GitHub`

### 6.2 Ideal Site Map

```text
Home (/)
├── Find My Role (/find)
├── Compare Roles (/compare)
├── Rankings (/rankings)
│   ├── Highest Risk (/rankings/highest-risk)
│   ├── Most Leveraged (/rankings/ai-leveraged)
│   ├── High Exposure Still In Demand (/rankings/high-exposure-in-demand)
│   ├── Biggest Theory vs Practice Gaps (/rankings/theory-vs-practice)
│   └── Safest High-Paying Roles (/rankings/safest-high-paying)
├── Quarterly Report (/reports/[quarter])
├── Role Pages (/role/[slug])
├── Occupation Pages (/occupation/[ssoc])
├── Watchlist (/watchlist)
├── Methodology (/methodology)
├── Methodology Appendix (/methodology/appendix)
├── Data & API (/data)
└── About (/about)
```

### 6.3 Home Page From Scratch

The homepage should be `search-first`, not `treemap-first`.

Recommended home layout:

1. Hero
- headline
- search
- primary CTA: find your role
- secondary CTA: compare roles

2. Instant explanation row
- `AI task overlap`
- `Human advantage`
- `Singapore demand`

3. Featured rankings / insights
- high exposure still in demand
- most at risk
- biggest theory vs practice gaps

4. Explorer section
- treemap
- histogram
- wage-bracket chart
- scatter

5. Quarterly labour highlights

6. Footer CTA
- methodology
- data
- compare

### 6.4 Role Page From Scratch

Each page should be built in this order:

1. Hero
- title
- official vs estimated badge
- risk band
- impact type
- confidence
- local hiring signal

2. What this means for you
- one-sentence takeaway
- short context paragraph

3. AI can help with / humans still needed for

4. Skills to build now

5. Wage and market
- wage range
- percentile
- local demand evidence
- labour monitor

6. Adjacent roles / transitions

7. Evidence trail

8. Technical details
- collapsed by default

9. Data / methodology links

### 6.5 Research Mode

The product should support a separate "research mode" via:
- methodology
- appendix
- data
- quarterly report
- downloadable files

This lets the consumer UX stay readable while the technical layer remains rigorous.

---

## 7. Visualization Plan

## 7.1 Visualizations To Keep

- treemap
- risk histogram
- risk by wage bracket
- exposure vs bottleneck scatter
- labour monitor sparkline
- percentile bars

## 7.2 Visualizations To Improve

### Treemap

Current issue:
- overview colors encode average risk but do not also communicate group identity clearly

Solution:
- overview fill = average risk
- border, chip, or label accent = major-group identity
- maintain consistent color legend

### Scatter

Keep it, but make it more explanatory:
- quadrant labels
- better legend
- role highlighting on search

### Histogram

Keep as a top-level homepage chart, not only as supporting content.

### Wage-Bracket Chart

Keep, but explicitly frame as:
- average occupation risk by wage bracket
- not worker-weighted

## 7.3 Visualizations To Add

- `Transition graph`
- `Demand vs risk matrix`
- `Theory vs observed AI gap chart`
- `Quarterly movers chart`
- `Confidence / uncertainty distribution`
- `Role-family map`

---

## 8. Methodology Improvement Plan

## 8.1 Near-Term Methodology Improvements

These are feasible with the current public-data stack.

### A. Synthetic Role Methodology

- define role bundles
- calculate layer-by-layer
- lower confidence when dispersion is high
- label synthetic roles explicitly

### B. Better Narrative Inputs

- export theta subdimensions
- classify role archetypes
- use task atoms instead of major group text

### C. Better Validation

- quarterly backtests against labour-monitor signals
- anchor occupations
- synthetic-role anchor set
- score distribution checks
- threshold sensitivity checks

### D. Better Confidence

Confidence should eventually include:
- crosswalk quality
- market granularity
- freshness
- synthetic-role dispersion
- narrative confidence
- role ambiguity

## 8.2 No-Limit Methodology

If limits are removed and scraping / richer data acquisition are allowed, the methodology should evolve into a dynamic labour-market system.

### Data Sources To Add

#### Official / public
- more detailed MOM / SingStat employment tabulations
- more detailed vacancy data
- recruitment / resignation
- retrenchment
- wage pressure data
- sectoral AI adoption data

#### Scraped / private / commercial
- MyCareersFuture postings
- LinkedIn postings
- JobStreet / Indeed / Glassdoor style panels
- salary ranges from postings
- AI tool mention frequency
- skills and skill-shift data
- hiring duration / reposting / freshness

#### Research-grade
- MOM Occupational Employment Dataset (OED)
- SingStat microdata
- university or government research partnerships
- commercial labour datasets like LinkedIn Economic Graph or Lightcast

### Ideal Model Outputs

Separate:
- displacement risk
- augmentation potential
- demand trend
- wage pressure
- employment trend
- transition optionality
- uncertainty

### Ideal Model Layers

1. task exposure prior
2. human bottleneck prior
3. observed AI usage calibration
4. local vacancy / hiring / retrenchment
5. postings volume and salary trend
6. skill shift velocity
7. transition optionality
8. sector adoption priors

### Validation Standard

Quarterly:
- did high-risk roles weaken?
- did in-demand roles remain resilient?
- did wages compress?
- did transition recommendations hold up?

The model should be treated as a hypothesis updated against outcomes, not a static score doctrine.

---

## 9. Explicit Workstreams

## 9.1 Workstream A: Synthetic Roles

### Outcome

Modern roles become first-class entities in the product.

### Tasks

- define schema
- build synthetic role dataset
- build resolver
- build `/role/[slug]`
- add confidence rules
- add synthetic role badges
- add synthetic role validation

### Success Criteria

- top 50 missing modern roles covered
- search resolves common missing roles cleanly
- synthetic pages feel first-class, not hacked on

## 9.2 Workstream B: Narrative Engine

### Outcome

Role pages feel personalized and credible.

### Tasks

- export theta dimensions
- add role archetypes
- build deterministic narrative engine
- add curated overrides
- add synthetic role support

### Success Criteria

- no more obviously wrong generic copy
- top 100 pages read like they describe the actual role

## 9.3 Workstream C: Actionability

### Outcome

Users can make decisions, not just read scores.

### Tasks

- adjacent roles
- compare flows from every role page
- lower-risk alternatives
- higher-upside alternatives
- role transitions later

### Success Criteria

- users can answer "what do I do next?"

## 9.4 Workstream D: Labour Intelligence

### Outcome

The product becomes time-aware and worth revisiting.

### Tasks

- quarterly report page
- role movement indicators
- labour monitor rankings
- report templates

### Success Criteria

- the app has a clear quarterly update story

## 9.5 Workstream E: Trust Layer

### Outcome

Researchers, journalists, and policy users can cite the product.

### Tasks

- methodology appendix
- data page
- snapshots and exports
- changelog
- backtests

### Success Criteria

- methodology can be inspected end-to-end

## 9.6 Workstream F: Growth Layer

### Outcome

The product becomes shareable without sacrificing trust.

### Tasks

- ranking pages
- share cards
- scenario-based wage activity touched metrics
- quarterly insight posts

### Success Criteria

- users share surprising but defensible insights

---

## 10. Phased Roadmap

## Phase 1: Finish The Core Product

Scope:
- fix remaining labeling inconsistencies
- add methodology appendix
- improve evidence wording
- finish visual consistency
- tighten treemap semantics

## Phase 2: Expand Role Coverage

Scope:
- synthetic roles
- better resolver
- unresolved search logging
- top 50 modern role coverage

## Phase 3: Make Pages Truly Useful

Scope:
- narrative engine
- adjacent role recommendations
- stronger compare flows
- better transition cues

## Phase 4: Add Return Loops

Scope:
- quarterly report
- watchlist
- role movement indicators
- saved comparisons

## Phase 5: Build The Data Moat

Scope:
- postings pipeline
- skill-shift panel
- salary trend layer
- theory vs practice tracking

## Phase 6: Become Research-Grade

Scope:
- backtests
- calibration reports
- public data/API
- OED / university / government data access if available

---

## 11. Recommended Immediate Next Steps

If work starts now, the recommended order is:

1. fix remaining labeling and trust issues
2. ship `synthetic role` system
3. ship `resolver` upgrade
4. ship `narrative engine`
5. improve role-page actionability
6. add methodology appendix + data page
7. add quarterly report
8. start postings pipeline

---

## 12. Definition Of Done

The product should be considered fully fledged when all of the following are true:

- a user can find their role even when it is not an official SSOC title
- role pages are clearly personalized and relevant
- every page gives the user a next step
- quarterly change is visible
- methodology is fully inspectable
- data can be downloaded
- synthetic roles are clearly labeled and confidence-aware
- growth hooks exist without fake precision
- researchers can cite the tool
- the app is useful to both normal users and technical users

---

## 13. Final Product Thesis

The best version of this project is not:

> "a prettier risk chart"

It is:

> "the best public Singapore tool for understanding how AI changes jobs, how trustworthy that estimate is, and what people can do next."

