#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(import.meta.dir, '..');
const input = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data/raw/mom-job-vacancies-2025-extract.json'), 'utf8')
);

const pctValues: number[] = [
	...Object.values(input.national),
	...Object.values(input.experience_required_pct).flatMap((row: unknown) =>
		Object.values(row as object)
	),
	...Object.values(input.no_experience_required_by_industry_pct)
].filter((value): value is number => typeof value === 'number');
if (pctValues.some(value => value < 0 || value > 100))
	throw new Error('Demand percentage outside 0–100');

const output = {
	schema_version: '1.0',
	data_as_of: 'December 2025',
	construct: 'vacancy_composition_and_entry_level_context',
	score_input: false,
	source: input.source,
	national: input.national,
	experience_required_pct: input.experience_required_pct,
	entry_level_pmet: input.entry_level_pmet,
	no_experience_required_by_industry_pct: input.no_experience_required_by_industry_pct,
	named_hard_to_fill_pmet_jobs: input.named_hard_to_fill_pmet_jobs,
	limitations: input.limitations
};

for (const file of [
	'data/detailed-demand.json',
	'src/lib/data/detailed-demand.json',
	'static/data/detailed-demand.json'
]) {
	const target = path.join(ROOT, file);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
}
console.log(
	`Built detailed demand context for ${Object.keys(output.no_experience_required_by_industry_pct).length} industries.`
);
