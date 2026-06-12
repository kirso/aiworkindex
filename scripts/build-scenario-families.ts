#!/usr/bin/env bun
/**
 * build-scenario-families.ts — Publish the existing forecast-engine scenarios
 * as a non-scoring governance sidecar.
 *
 * Run: bun run scripts/build-scenario-families.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import occupations from '../data/occupations.json';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import type { Occupation } from '../src/lib/data';
import {
	computeForecastScores,
	scenarioPresets,
	type Direction,
	type ForecastScoreSnapshot,
	type ScenarioPreset
} from '../src/lib/data/forecast-engine';

const ROOT_DIR = path.join(import.meta.dir, '..');
const OUT_PATHS = [
	path.join(ROOT_DIR, 'data', 'scenario-families.json'),
	path.join(ROOT_DIR, 'src', 'lib', 'data', 'scenario-families.json'),
	path.join(ROOT_DIR, 'static', 'data', 'scenario-families.json')
];

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function average(values: number[]): number {
	return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function directionCounts(rows: Array<{ direction: Direction }>) {
	return rows.reduce<Record<Direction, number>>(
		(acc, row) => {
			acc[row.direction] += 1;
			return acc;
		},
		{ improving: 0, stable: 0, worsening: 0 }
	);
}

function topBy<T>(rows: T[], pick: (row: T) => number, count: number): T[] {
	return [...rows].sort((a, b) => pick(b) - pick(a)).slice(0, count);
}

function buildScenario(key: ScenarioPreset) {
	const preset = scenarioPresets[key];
	const rows = (occupations as Occupation[]).map(occupation => {
		const scores: ForecastScoreSnapshot = computeForecastScores(occupation, preset.params);
		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			risk_band: occupation.risk_band,
			structural_risk: occupation.net_risk,
			near_term_risk: round(scores.nearTermRisk),
			realization_gap: round(occupation.net_risk - scores.nearTermRisk),
			displacement_score: round(scores.displacementScore),
			augmentation_score: round(scores.augmentationScore),
			demand_score: round(scores.demandScore),
			wage_score: round(scores.wageScore),
			direction: scores.direction,
			confidence: scores.confidence
		};
	});

	return {
		key,
		label: preset.label,
		description: preset.description,
		params: preset.params,
		summary: {
			avg_near_term_risk: round(average(rows.map(row => row.near_term_risk))),
			avg_realization_gap: round(average(rows.map(row => row.realization_gap))),
			direction_counts: directionCounts(rows),
			top_near_term_risk: topBy(rows, row => row.near_term_risk, 10).map(row => ({
				ssoc: row.ssoc,
				title: row.title,
				near_term_risk: row.near_term_risk,
				direction: row.direction
			}))
		},
		entries: rows
	};
}

const scenarios = (Object.keys(scenarioPresets) as ScenarioPreset[]).map(buildScenario);

const artifact = {
	validation_date: new Date().toISOString().slice(0, 10),
	model_version: DATA_VINTAGE.model_version,
	method: 'scenario_families_v1',
	occupation_count: (occupations as Occupation[]).length,
	framing:
		'Scenario families are non-scoring outlook overlays. They stress the structural score through named adoption, cost-cutting, macro, and sector-readiness assumptions; they do not change net_risk or risk_band.',
	scenarios,
	summary: {
		scenario_count: scenarios.length,
		base_avg_near_term_risk:
			scenarios.find(scenario => scenario.key === 'base')?.summary.avg_near_term_risk ?? null,
		fast_adoption_avg_near_term_risk:
			scenarios.find(scenario => scenario.key === 'fast_adoption')?.summary.avg_near_term_risk ??
			null,
		conservative_avg_near_term_risk:
			scenarios.find(scenario => scenario.key === 'conservative')?.summary.avg_near_term_risk ??
			null
	},
	caveats: [
		'Scenario outputs are directional stress tests, not forecasts and not score inputs.',
		'The scenarios use existing rule-based forecast-engine assumptions; they are intentionally separated from the canonical structural score.',
		'Occupation-level realized validation remains pending until post-baseline labour-market quarters are available.'
	]
};

for (const outPath of OUT_PATHS) {
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`);
}

console.log(
	`Built scenario-families.json with ${artifact.summary.scenario_count} scenarios for ${artifact.occupation_count} occupations`
);
