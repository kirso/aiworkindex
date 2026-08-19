import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import market from '../data/v9-market-context.json';
import release from '../data/occupations-v9.json';

describe('V9 Singapore market sidecar', () => {
	test('uses only reviewed current SSOC 2024 mappings', () => {
		const codes = new Set(release.occupations.map(item => item.taxonomy.code));
		for (const [code, signals] of Object.entries(market.demand_by_code)) {
			assert.equal(codes.has(code), true, `${code} is not a current occupation`);
			assert.ok(signals.length > 0);
			assert.ok(
				signals.every(
					signal => signal.mapping_basis === 'reviewed_against_ssoc_2024_title_and_synonyms'
				)
			);
		}
		assert.equal(
			market.demand_by_code['25143']?.some(signal => signal.source_occupation === 'AI engineer'),
			true
		);
		assert.equal(
			market.demand_by_code['21222']?.some(signal => signal.source_occupation === 'Data scientist'),
			true
		);
		assert.equal(
			market.demand_by_code['12212']?.some(
				signal => signal.source_occupation === 'Business development manager'
			),
			true
		);
	});

	test('withholds ambiguous generic demand instead of broadening by prefix', () => {
		assert.deepEqual(
			market.withheld_demand_mappings.map(item => item.source_occupation),
			['Driver']
		);
		assert.equal(JSON.stringify(market).includes('prefix'), true);
		assert.equal(market.rules.demand.includes('No code-prefix'), true);
	});

	test('keeps current market evidence separate and correctly dated', () => {
		assert.equal(
			market.rules.headline_separation,
			'No market field changes AI Work Pressure Rank.'
		);
		assert.equal(market.national.labour_market_q2_2026_advance.status, 'preliminary');
		assert.equal(market.national.labour_market_q2_2026_advance.total_employment_change, 10700);
		assert.equal(market.national.labour_market_q1_2026_detailed.vacancies.value, 73.3);
		assert.equal(
			market.national.labour_market_q1_2026_detailed.vacancies.unit,
			'thousand_vacancies'
		);
		assert.equal(market.national.early_career_2025.pmet_unemployment_rate, 2.8);
		assert.equal(market.national.early_career_2025.non_pmet_unemployment_rate, 4.1);
		assert.equal(market.national.early_career_2025.seasonal_adjustment, 'not_seasonally_adjusted');
		assert.match(
			market.national.early_career_2025.limitations.join(' '),
			/Excludes unemployed residents without work experience/
		);
		assert.equal(market.national.postings_monitor.public_demand_input, false);
		assert.equal(market.national.postings_monitor.status, 'withheld_stale_convenience_sample');
		assert.equal(market.national.postings_monitor.sample_postings, 564);
		assert.equal(market.national.postings_monitor.source_count, 4);
		const serialized = JSON.stringify(market.national.postings_monitor);
		assert.equal(serialized.includes('occupations_total'), false);
		assert.equal(serialized.includes('salary_min_hint'), false);
		assert.equal(serialized.includes('top_skills'), false);
	});

	test('publishes explicit units for broad labour-market context', () => {
		for (const context of Object.values(market.labour_by_major_group)) {
			assert.ok(context);
			assert.equal(context.vacancy.units.rate, 'percent');
			assert.equal(context.vacancy.units.count, 'thousand_vacancies');
			assert.equal(context.retrenchment?.units.count, 'workers');
			assert.equal(context.retrenchment?.units.incidence, 'workers_per_1000_employees');
			assert.equal(context.hiring?.units.rate_change, 'percentage_points');
			assert.equal(context.re_entry?.units.rate_change, 'percentage_points');
		}
	});
});
