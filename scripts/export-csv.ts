#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import type { V8PublicOccupation } from '../src/lib/data/v8-contract';

const ROOT = path.join(import.meta.dir, '..');
const input = path.join(ROOT, 'data', 'occupations-v8.json');
const output = path.join(ROOT, 'static', 'data', 'sg-ai-occupations-v8.csv');

const columns = [
	'schema_version',
	'ssoc',
	'title',
	'major_group',
	'major_group_code',
	'gross_monthly_median_sgd',
	'estimated_employment_thousands',
	'employment_basis',
	'ai_task_exposure_index',
	'human_bottleneck_index',
	'ai_exposure_rank',
	'job_change_band',
	'substitution_pressure_score',
	'substitution_pressure_band',
	'augmentation_potential_score',
	'augmentation_potential_band',
	'likely_pathway',
	'demand_context',
	'adoption_context',
	'adoption_coverage',
	'attrition_absorber',
	'entry_level_sensitivity',
	'evidence_confidence',
	'evidence_limiting_factors',
	'sensitivity_label',
	'sensitivity_minimum_points',
	'sensitivity_maximum_points',
	'reference_market',
	'reference_date'
];

function escapeCsv(value: string | number | null): string {
	const text = value == null ? '' : String(value);
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const occupations = JSON.parse(fs.readFileSync(input, 'utf8')) as V8PublicOccupation[];
const rows = occupations.map(occupation => {
	const v8 = occupation.v8;
	return [
		occupation.schema_version,
		occupation.ssoc,
		occupation.title,
		occupation.major_group,
		occupation.major_group_code,
		occupation.wages.gross_monthly_median_sgd,
		occupation.employment.estimated_thousands,
		occupation.employment.basis,
		occupation.ai_task_exposure_index,
		occupation.human_bottleneck_index,
		v8.ai_exposure_rank.points,
		v8.ai_exposure_rank.band,
		v8.substitution_pressure.points,
		v8.substitution_pressure.band,
		v8.augmentation_potential.points,
		v8.augmentation_potential.band,
		v8.likely_pathway,
		v8.market_context.demand,
		v8.market_context.adoption,
		v8.market_context.adoption_coverage,
		v8.market_context.attrition_absorber,
		v8.market_context.entry_level_sensitivity,
		v8.evidence_confidence.level,
		v8.evidence_confidence.limiting_factors.join('|'),
		v8.sensitivity.label,
		v8.sensitivity.minimum_points,
		v8.sensitivity.maximum_points,
		v8.reference_market,
		v8.reference_date
	];
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
	output,
	`${[columns, ...rows].map(row => row.map(value => escapeCsv(value as string | number | null)).join(',')).join('\n')}\n`,
	'utf8'
);

console.log(`Exported ${occupations.length} V8 occupations to ${output}`);
