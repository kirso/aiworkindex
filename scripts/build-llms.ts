#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE, SITE } from '../src/lib/data/scoring-constants';
import type { V8PublicOccupation } from '../src/lib/data/v8-contract';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'occupations-v8.json');
const STATIC_DIR = path.join(ROOT_DIR, 'static');
const occupations = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as V8PublicOccupation[];
const version = DATA_VINTAGE.public_version;

const interpretation = `A score of 72/100 means the occupation is more exposed to current AI capabilities than approximately 72% of the ${occupations.length} scored Singapore occupations. It is not a 72% probability of job loss, not the share of tasks AI can do, and not a forecast of employment decline.`;

const llms = `# AI Work Index

> Relative AI-driven AI exposure rankings for ${occupations.length} Singapore occupations. Current public contract: ${version}.

AI Work Index is an open-source, deterministic index. ${interpretation}

## V8 contract

- ai_exposure_rank: within-Singapore percentile rank, 0-100
- substitution_score and augmentation_score: separate relative component ranks
- likely_pathway: rule-based interpretation using score, demand and adoption context
- evidence_confidence: high, medium or low evidence support; not a probability
- sensitivity: score range across stated alternative specifications
- labour_market_context: demand, adoption, attrition, entry-level pressure and transition context; reported separately from the score

Only Singapore is a live scored market. United States and global occupation scores are withdrawn until local validation gates pass. Global research remains contextual.

## Links

- ${SITE.url}/methodology
- ${SITE.url}/data
- ${SITE.url}/will-ai-take-my-job
- ${SITE.url}/data/sg-ai-occupations-v8.json
- https://github.com/kirso/aiworkindex
`;

const sorted = [...occupations].sort(
	(a, b) => b.v8.ai_exposure_rank.points - a.v8.ai_exposure_rank.points
);

function row(occupation: V8PublicOccupation): string {
	return `| ${occupation.title} | ${occupation.v8.ai_exposure_rank.points}/100 | ${occupation.v8.ai_exposure_rank.band.replaceAll('_', ' ')} | ${occupation.v8.likely_pathway.replaceAll('_', ' ')} | ${occupation.v8.evidence_confidence.level} |`;
}

const llmsFull = `# AI Work Index — V8 full reference

${interpretation}

## Method

V8 ranks a multi-source occupational change signal within the Singapore SSOC universe. Ties receive midranks. Substitution and augmentation are reported as separate relative component scores. Demand, adoption, attrition, entry-level and transition evidence do not silently alter the headline rank; they inform the likely pathway and are available as context fields. Confidence is categorical evidence support. Sensitivity is a specification range, not a statistical confidence interval.

## What V8 does not support

- occupation-level job-loss probabilities or dates
- claims that a score is the percentage of tasks automated
- causal estimates of AI's employment effect
- scored comparisons between Singapore and other countries
- guarantees that a low-scoring occupation is “AI-proof”

## Highest relative scores

| Occupation | AI Exposure Rank | Band | Likely pathway | Evidence |
|---|---:|---|---|---|
${sorted.slice(0, 50).map(row).join('\n')}

## Lowest relative scores

| Occupation | AI Exposure Rank | Band | Likely pathway | Evidence |
|---|---:|---|---|---|
${sorted.slice(-50).reverse().map(row).join('\n')}

## Citation

AI Work Index (${version}, 2026), Singapore AI Exposure Ranks. ${SITE.url}
`;

fs.writeFileSync(path.join(STATIC_DIR, 'llms.txt'), llms);
fs.writeFileSync(path.join(STATIC_DIR, 'llms-full.txt'), llmsFull);
console.log(`Wrote llms.txt and llms-full.txt for ${version}`);
