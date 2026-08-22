#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(import.meta.dir, '..');
const input = JSON.parse(
	fs.readFileSync(
		path.join(ROOT, 'data/raw/mom-labour-force-2025-job-quality-extract.json'),
		'utf8'
	)
);

for (const [group, row] of Object.entries(input.major_groups) as Array<
	[
		string,
		{
			underemployment_rate_pct: number;
			employment_thousands: number;
			non_permanent_thousands: number;
		}
	]
>) {
	if (row.employment_thousands <= 0 || row.non_permanent_thousands < 0) {
		throw new Error(`Invalid employment values for ${group}`);
	}
	row.non_permanent_share_pct =
		Math.round((row.non_permanent_thousands / row.employment_thousands) * 1000) / 10;
}

for (const series of [input.unemployment_rate_pct, input.long_term_unemployment_rate_pct]) {
	for (const [key, values] of Object.entries(series) as Array<[string, number[]]>) {
		if (values.length !== input.years.length) throw new Error(`${key} does not match year range`);
	}
}

const output = {
	schema_version: '1.0',
	data_as_of: '2025',
	construct: 'broad_job_quality_context',
	score_input: false,
	source: input.source,
	major_groups: input.major_groups,
	youth_and_workforce_history: {
		years: input.years,
		unemployment_rate_pct: input.unemployment_rate_pct,
		long_term_unemployment_rate_pct: input.long_term_unemployment_rate_pct
	},
	limitations: input.limitations
};

for (const file of [
	'data/job-quality.json',
	'src/lib/data/job-quality.json',
	'static/data/job-quality.json'
]) {
	const target = path.join(ROOT, file);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
}
console.log(
	`Built job-quality context for ${Object.keys(output.major_groups).length} major groups.`
);
