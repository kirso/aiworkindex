#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import {
	DATA_VINTAGE,
	DEMAND_RESILIENCE_CONSTANTS,
	IMPACT_TYPE_THRESHOLDS,
	RISK_BAND_THRESHOLDS
} from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'occupations.json');
const STATIC_DIR = path.join(ROOT_DIR, 'static');
const LLMS_FILE = path.join(STATIC_DIR, 'llms.txt');
const LLMS_FULL_FILE = path.join(STATIC_DIR, 'llms-full.txt');

interface Occupation {
	title: string;
	risk_band: string;
	net_risk: number;
	augmentation: number;
	impact_type: string;
}

const occupations = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Occupation[];
const version = DATA_VINTAGE.model_version;
const updated = DATA_VINTAGE.last_updated;

const examples = {
	veryHigh:
		occupations.find(occupation => occupation.risk_band === 'very_high')?.title ??
		'Data Entry Clerk',
	veryLow: occupations.find(occupation => occupation.risk_band === 'very_low')?.title ?? 'Surgeon'
};

const llms = `# AI Work Index

> Structural AI pressure scores for ${DATA_VINTAGE.occupation_count} Singapore occupations and ${DATA_VINTAGE.role_count} modern roles. Current public release: ${version}. Deterministic scoring, open data, no LLM in the scoring loop.

## About

AI Work Index is a free, open-source project that scores Singapore occupations for structural AI pressure. The current ${version} release separates technical overlap from Singapore demand resilience instead of collapsing everything into a single market modifier.

- Author: Kirill So
- Data vintage: ${version}, last updated ${updated}
- Coverage: ${DATA_VINTAGE.occupation_count} SSOC occupations + ${DATA_VINTAGE.role_count} synthetic modern roles
- Location focus: Singapore

## Core Formula

headline_risk = displacement_pressure x (1 - demand_resilience)

- displacement_pressure = exposure x (1 - bottleneck)
- demand_resilience = min(1.0, base_resilience x ${DEMAND_RESILIENCE_CONSTANTS.base_weight.toFixed(2)} + demand_signal_bonus)
- demand_signal_bonus = SOL exact ${DEMAND_RESILIENCE_CONSTANTS.sol_exact.toFixed(2)}, SOL prefix ${DEMAND_RESILIENCE_CONSTANTS.sol_prefix.toFixed(2)}, JiD exact ${DEMAND_RESILIENCE_CONSTANTS.jid_exact.toFixed(2)}, JiD prefix ${DEMAND_RESILIENCE_CONSTANTS.jid_prefix.toFixed(2)}
- augmentation = exposure x bottleneck x market.market_resilience

## Interpretation

- Scores measure structural pressure, not predicted job losses.
- Impact types are determined only by headline risk and augmentation thresholds.
- Current release contract is the downloadable ${version} dataset and the live app dataset; they should match exactly.

## Risk Bands

| Band | Net Risk Range |
|------|----------------|
| Very Low | < ${RISK_BAND_THRESHOLDS.low.lower.toFixed(2)} |
| Low | ${RISK_BAND_THRESHOLDS.low.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.moderate.lower.toFixed(2)} |
| Moderate | ${RISK_BAND_THRESHOLDS.moderate.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.high.lower.toFixed(2)} |
| High | ${RISK_BAND_THRESHOLDS.high.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.very_high.lower.toFixed(2)} |
| Very High | >= ${RISK_BAND_THRESHOLDS.very_high.lower.toFixed(2)} |

Examples: ${examples.veryLow} is in the very-low band; ${examples.veryHigh} is in the very-high band.

## Key Pages

- https://aiworkindex.com/
- https://aiworkindex.com/methodology
- https://aiworkindex.com/data
- https://aiworkindex.com/reports
- https://aiworkindex.com/about
- https://aiworkindex.com/explore

## Extended Version

https://aiworkindex.com/llms-full.txt

## Source Code

https://github.com/kirso/aiworkindex
`;

const llmsFull = `# AI Work Index — Full Reference

> Structural AI pressure scores for ${DATA_VINTAGE.occupation_count} Singapore occupations and ${DATA_VINTAGE.role_count} modern roles. Current public release: ${version}. Deterministic scoring, open data, no LLM in the scoring loop.

## Project Overview

AI Work Index is a Singapore-focused occupation scoring project. The live ${version} release measures structural AI pressure, not realised job loss and not a hiring forecast.

- Author: Kirill So (https://www.linkedin.com/in/kirso/)
- Website: https://aiworkindex.com
- Source code: https://github.com/kirso/aiworkindex
- Data vintage: ${version}, last updated ${updated}
- Coverage: ${DATA_VINTAGE.occupation_count} SSOC occupations + ${DATA_VINTAGE.role_count} synthetic modern roles
- Location focus: Singapore

## Scoring Methodology

### Core Formula

headline_risk = displacement_pressure x (1 - demand_resilience)

Where:
  displacement_pressure = exposure x (1 - bottleneck)
  demand_resilience = min(1.0, base_resilience x ${DEMAND_RESILIENCE_CONSTANTS.base_weight.toFixed(2)} + demand_signal_bonus)
  augmentation = exposure x bottleneck x market.market_resilience

### Layer 1: Exposure

The live ${version} exposure layer is a deterministic reliability-weighted 4-source ensemble over:
- Felten AIOE
- Anthropic Economic Index / observed AI usage
- Eloundou GPT exposure
- ILO occupational exposure

### Layer 2: Human Bottleneck

Human bottleneck is based on Pizzinelli theta and captures judgment, presence, coordination, and responsibility that resist automation.

### Layer 3: Demand Resilience

Demand resilience is a separate Singapore demand buffer built from:
- Base resilience from market momentum and occupation scarcity
- Shortage Occupation List bonuses
- Jobs in Demand bonuses

It is not an occupation-level outcome measure. It reduces structural pressure but does not convert the score into a realised labour-market forecast.

## Risk Classification

### Risk Bands

| Band | Net Risk Range | Label |
|------|----------------|-------|
| Very Low | < ${RISK_BAND_THRESHOLDS.low.lower.toFixed(2)} | Very Low |
| Low | ${RISK_BAND_THRESHOLDS.low.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.moderate.lower.toFixed(2)} | Low |
| Moderate | ${RISK_BAND_THRESHOLDS.moderate.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.high.lower.toFixed(2)} | Moderate |
| High | ${RISK_BAND_THRESHOLDS.high.lower.toFixed(2)}-${RISK_BAND_THRESHOLDS.very_high.lower.toFixed(2)} | High |
| Very High | >= ${RISK_BAND_THRESHOLDS.very_high.lower.toFixed(2)} | Very High |

### Impact Types

Impact types are determined only by the headline risk x augmentation matrix:
- AI-Leveraged: net_risk < ${IMPACT_TYPE_THRESHOLDS.displacement_threshold} AND augmentation >= ${IMPACT_TYPE_THRESHOLDS.augmentation_threshold}
- At Risk: net_risk >= ${IMPACT_TYPE_THRESHOLDS.displacement_threshold} AND augmentation < ${IMPACT_TYPE_THRESHOLDS.augmentation_threshold}
- Mixed: net_risk >= ${IMPACT_TYPE_THRESHOLDS.displacement_threshold} AND augmentation >= ${IMPACT_TYPE_THRESHOLDS.augmentation_threshold}
- Stable: net_risk < ${IMPACT_TYPE_THRESHOLDS.displacement_threshold} AND augmentation < ${IMPACT_TYPE_THRESHOLDS.augmentation_threshold}

Demand signals influence impact types only indirectly through demand_resilience and the resulting net_risk.

## What The Data Supports

- The live ${version} dataset supports structural rankings across ${DATA_VINTAGE.occupation_count} occupations.
- It supports downloadable public JSON and CSV exports.
- It supports directional validation and current Singapore context layers published separately from the core score.
- It does not support claims about occupation-level realised job loss.

## Current Public Artifacts

- Dataset: https://aiworkindex.com/data/sg-ai-occupations-${version.toLowerCase()}.json
- Data dictionary: https://aiworkindex.com/data
- Methodology: https://aiworkindex.com/methodology
- Reports: https://aiworkindex.com/reports
- Research library: https://aiworkindex.com/research

## How to Cite

"AI Work Index (${version}, 2026). Structural AI pressure scores for Singapore occupations. https://aiworkindex.com"

## Limitations

1. Scores measure structural pressure, not actual or predicted job losses.
2. Crosswalks between SSOC, ISCO, SOC, and O*NET introduce mapping noise.
3. Exposure inputs reflect published source vintages and can lag capability changes.
4. Labour-monitor and context layers are supportive evidence, not hidden scoring overrides.

## Contact

- LinkedIn: https://www.linkedin.com/in/kirso/
- GitHub: https://github.com/kirso/aiworkindex
- Website: https://aiworkindex.com
`;

fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.writeFileSync(LLMS_FILE, llms, 'utf-8');
fs.writeFileSync(LLMS_FULL_FILE, llmsFull, 'utf-8');

console.log(`Built ${LLMS_FILE}`);
console.log(`Built ${LLMS_FULL_FILE}`);
