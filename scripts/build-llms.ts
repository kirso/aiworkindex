#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import {
	DATA_VINTAGE,
	DEMAND_RESILIENCE_CONSTANTS,
	IMPACT_TYPE_THRESHOLDS,
	RISK_BAND_THRESHOLDS,
	SITE
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

> Structural AI pressure scores for ${DATA_VINTAGE.occupation_count} occupations and ${DATA_VINTAGE.role_count} modern roles. Current public release: ${version}. Deterministic scoring, open data, no LLM in the scoring loop.

## About

AI Work Index is a free, open-source project that scores occupations for structural AI pressure. The current ${version} release separates technical overlap from demand resilience instead of collapsing everything into a single market modifier.

- Author: Kirill So
- Data vintage: ${version}, last updated ${updated}
- Coverage: ${DATA_VINTAGE.occupation_count} SSOC occupations + ${DATA_VINTAGE.role_count} synthetic modern roles
- Countries: Singapore, United States

## Core Formula

headline_risk = displacement_pressure x (1 - demand_resilience)

V7: task_signal = task_concentration x task_coverage (Hampole et al.)
V7: exposure_v7 = exposure x (1 + 0.20 x task_signal)
V7: demand_persistence = ranked composite of momentum, vacancy, scarcity, demand signals

- displacement_pressure = exposure_v7 x (1 - bottleneck)
- demand_resilience = min(1.0, base_resilience x ${DEMAND_RESILIENCE_CONSTANTS.base_weight.toFixed(2)} + demand_signal_bonus + 0.10 x demand_persistence)
- demand_signal_bonus = SOL exact ${DEMAND_RESILIENCE_CONSTANTS.sol_exact.toFixed(2)}, SOL prefix ${DEMAND_RESILIENCE_CONSTANTS.sol_prefix.toFixed(2)}, JiD exact ${DEMAND_RESILIENCE_CONSTANTS.jid_exact.toFixed(2)}, JiD prefix ${DEMAND_RESILIENCE_CONSTANTS.jid_prefix.toFixed(2)}
- augmentation = exposure_v7 x bottleneck x market.market_resilience

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

- ${SITE.url}/
- ${SITE.url}/methodology
- ${SITE.url}/data
- ${SITE.url}/reports
- ${SITE.url}/about
- ${SITE.url}/explore

## Extended Version

${SITE.url}/llms-full.txt

## Source Code

https://github.com/kirso/aiworkindex
`;

// Build occupation tables for llms-full.txt
const sorted = [...occupations].sort((a, b) => b.net_risk - a.net_risk);
const highestRisk = sorted.slice(0, 50);
const lowestRisk = sorted.slice(-50).reverse();

function occRow(o: Occupation) {
	return `| ${o.title} | ${(o.net_risk * 100).toFixed(0)}% | ${o.risk_band.replace('_', ' ')} | ${o.impact_type.replace('_', ' ')} |`;
}

const riskBandLabel: Record<string, string> = {
	very_high: 'Very High',
	high: 'High',
	moderate: 'Moderate',
	low: 'Low',
	very_low: 'Very Low'
};

function faqEntry(o: Occupation) {
	return `Q: Will AI replace ${o.title}?\nA: ${o.title} has an AI displacement risk of ${(o.net_risk * 100).toFixed(0)}%, rated ${riskBandLabel[o.risk_band] ?? o.risk_band}. This is a structural pressure score, not a prediction of job loss.\n`;
}

const llmsFull = `# AI Work Index — Full Reference

> Structural AI pressure scores for ${DATA_VINTAGE.occupation_count} occupations and ${DATA_VINTAGE.role_count} modern roles. Current public release: ${version}. Deterministic scoring, open data, no LLM in the scoring loop.

## Project Overview

AI Work Index is a global occupation scoring project covering Singapore and the United States. The live ${version} release measures structural AI pressure, not realised job loss and not a hiring forecast.

- Author: Kirill So (https://www.linkedin.com/in/kirso/)
- Website: ${SITE.url}
- Source code: https://github.com/kirso/aiworkindex
- Data vintage: ${version}, last updated ${updated}
- Coverage: ${DATA_VINTAGE.occupation_count} SSOC occupations + ${DATA_VINTAGE.role_count} synthetic modern roles
- Countries: Singapore, United States

## Scoring Methodology

### Core Formula

headline_risk = displacement_pressure x (1 - demand_resilience)

V7 additions:
  task_signal = task_exposure_concentration x task_effective_coverage (Hampole et al. 2025)
  exposure_v7 = exposure x (1 + 0.20 x task_signal)
  demand_persistence = ranked composite of market momentum, vacancy trends, scarcity, demand signals

Where:
  displacement_pressure = exposure_v7 x (1 - bottleneck)
  demand_resilience = min(1.0, base_resilience x ${DEMAND_RESILIENCE_CONSTANTS.base_weight.toFixed(2)} + demand_signal_bonus + 0.10 x demand_persistence)
  augmentation = exposure_v7 x bottleneck x market.market_resilience

### Layer 1: Exposure

The live ${version} exposure layer is a deterministic reliability-weighted 4-source ensemble over:
- Felten AIOE
- Anthropic Economic Index / observed AI usage
- Eloundou GPT exposure
- ILO occupational exposure

### Layer 2: Human Bottleneck

Human bottleneck is based on Pizzinelli theta and captures judgment, presence, coordination, and responsibility that resist automation.

### Layer 3: Demand Resilience

Demand resilience is a separate country-specific demand buffer built from:
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
- It supports directional validation and current country context layers published separately from the core score.
- It does not support claims about occupation-level realised job loss.

## Current Public Artifacts

- Dataset: ${SITE.url}/data/sg-ai-occupations-${version.toLowerCase()}.json
- Data dictionary: ${SITE.url}/data
- Methodology: ${SITE.url}/methodology
- Reports: ${SITE.url}/reports
- Research library: ${SITE.url}/research

## How to Cite

"AI Work Index (${version}, 2026). Structural AI pressure scores for occupations. ${SITE.url}"

## Limitations

1. Scores measure structural pressure, not actual or predicted job losses.
2. Crosswalks between SSOC, ISCO, SOC, and O*NET introduce mapping noise.
3. Exposure inputs reflect published source vintages and can lag capability changes.
4. Labour-monitor and context layers are supportive evidence, not hidden scoring overrides.

## Top 50 Highest-Risk Occupations

| Occupation | Risk | Band | Impact |
|------------|------|------|--------|
${highestRisk.map(occRow).join('\n')}

## Top 50 Lowest-Risk Occupations

| Occupation | Risk | Band | Impact |
|------------|------|------|--------|
${lowestRisk.map(occRow).join('\n')}

## Common Questions

${highestRisk.slice(0, 20).map(faqEntry).join('\n')}
${lowestRisk.slice(0, 10).map(faqEntry).join('\n')}

## Contact

- LinkedIn: https://www.linkedin.com/in/kirso/
- GitHub: https://github.com/kirso/aiworkindex
- Website: ${SITE.url}
`;

fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.writeFileSync(LLMS_FILE, llms, 'utf-8');
fs.writeFileSync(LLMS_FULL_FILE, llmsFull, 'utf-8');

console.log(`Built ${LLMS_FILE}`);
console.log(`Built ${LLMS_FULL_FILE}`);
