import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
	return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8')) as Record<
		string,
		unknown
	>;
}

function sha256(relativePath: string): string {
	return createHash('sha256')
		.update(fs.readFileSync(path.join(ROOT, relativePath)))
		.digest('hex');
}

describe('V9 economic observatory', () => {
	test('publishes identical deterministic copies', () => {
		const paths = [
			'data/v9-economic-observatory.json',
			'src/lib/data/v9-economic-observatory.json',
			'static/data/v9-economic-observatory.json'
		];
		assert.equal(new Set(paths.map(sha256)).size, 1);
	});

	test('keeps the economic layer outside the headline', () => {
		const observatory = read('data/v9-economic-observatory.json');
		const occupations = read('data/occupations-v9.json');

		assert.equal(observatory.schema_version, '9.0');
		assert.equal(observatory.headline_effect, 'none');
		assert.deepEqual(observatory.coverage, {
			detailed_occupations: 1001,
			pressure_ranked: 987,
			direct_wage: 523,
			named_demand: 37,
			broad_employment_context: 990,
			broad_labour_context: 1001,
			detailed_ai_adoption: 0,
			detailed_output_or_price_elasticity: 0,
			detailed_new_task_creation: 0,
			detailed_job_quality_change: 0,
			causal_ai_labour_outcomes: 0,
			classified_economic_scenarios: 0
		});
		const method = occupations.method as Record<string, unknown>;
		const rows = occupations.occupations as Array<Record<string, unknown>>;
		assert.equal(method.headline_owner, 'ILO 2025 mean_score_2025');
		assert.equal(
			rows.every(row => !('economic_scenario' in row)),
			true
		);
	});

	test('uses broad observations only at broad grain', () => {
		const observatory = read('data/v9-economic-observatory.json');
		const groupProfiles = observatory.group_profiles as Record<string, Record<string, unknown>>;
		const groups = Object.values(groupProfiles);
		const observed = groups.filter(
			group => group.measurement_status === 'observed_broad_occupation_group'
		);

		assert.equal(groups.length, 9);
		assert.equal(observed.length, 8);
		const groupSix = groupProfiles['6']!;
		assert.equal(groupSix.measurement_status, 'unavailable_separate_broad_group_row');
		assert.equal(groupSix.employment, null);
		assert.equal(groupSix.workforce, null);
		assert.equal(groupSix.industry_footprint, null);
		for (const group of observed) {
			const employment = group.employment as Record<string, unknown>;
			const workforce = group.workforce as Record<string, unknown>;
			const industry = group.industry_footprint as Record<string, unknown>;
			assert.equal(employment.grain, 'broad_occupation_group');
			assert.equal(employment.unit, 'thousand_employed_residents');
			assert.equal(workforce.grain, 'broad_occupation_group');
			assert.equal(industry.grain, 'broad_occupation_group_by_industry');
		}
	});

	test('covers each occupation once and leaves unsupported outcomes unavailable', () => {
		const observatory = read('data/v9-economic-observatory.json');
		const rows = observatory.occupation_coverage as Array<Record<string, unknown>>;

		assert.equal(rows.length, 1001);
		assert.equal(new Set(rows.map(row => row.ssoc)).size, 1001);
		assert.equal(rows.filter(row => row.broad_employment_context).length, 990);
		for (const row of rows) {
			assert.equal(row.detailed_ai_adoption, false);
			assert.equal(row.detailed_output_or_price_elasticity, false);
			assert.equal(row.detailed_new_task_creation, false);
			assert.equal(row.detailed_job_quality_change, false);
			assert.equal(row.causal_ai_labour_outcome, false);
			assert.equal(row.economic_scenario, 'withheld_insufficient_compatible_evidence');
		}
	});

	test('derives transparent broad-group changes from the frozen series', () => {
		const observatory = read('data/v9-economic-observatory.json');
		const groupProfiles = observatory.group_profiles as Record<string, Record<string, unknown>>;
		const professionals = groupProfiles['2']!;
		const employment = professionals.employment as Record<string, unknown>;

		assert.deepEqual(employment.latest, { period: '2025', value: 624.4 });
		assert.deepEqual(employment.derived_change, {
			year_over_year_pct: 0.73,
			since_2019_pct: 33.02
		});
	});

	test('rebuilds without changing the occupation release', () => {
		const before = sha256('data/occupations-v9.json');
		const result = spawnSync('bun', ['run', 'scripts/build-v9-economic-observatory.ts'], {
			cwd: ROOT,
			stdio: 'pipe'
		});
		assert.equal(result.status, 0, result.stderr.toString());
		assert.equal(sha256('data/occupations-v9.json'), before);
	});
});
