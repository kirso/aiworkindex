import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import release from '../data/occupations-v9.json';

const occupations = release.occupations;

describe('V9 evidence-first occupation contract', () => {
	test('covers the complete numeric SSOC 2024 occupation registry', () => {
		assert.equal(release.schema_version, '9.0');
		assert.deepEqual(release.counts, {
			occupations: 1001,
			scored: 987,
			insufficient_evidence: 14,
			direct_wages: 523
		});
		assert.equal(new Set(occupations.map(occupation => occupation.taxonomy.code)).size, 1001);
		assert.ok(occupations.every(occupation => occupation.taxonomy.edition === '2024'));
	});

	test('withholds ranks when the official mapping has no usable ILO score', () => {
		const missing = occupations
			.filter(occupation => occupation.score_status === 'insufficient_evidence')
			.map(occupation => occupation.taxonomy.code);
		assert.deepEqual(missing, [
			'14391',
			'14392',
			'14399',
			'31391',
			'31392',
			'31399',
			'33491',
			'33492',
			'33493',
			'33499',
			'34391',
			'34399',
			'52499',
			'81890'
		]);
		for (const occupation of occupations.filter(
			item => item.score_status === 'insufficient_evidence'
		)) {
			assert.equal(occupation.genai_task_exposure, null);
			assert.equal(occupation.evidence.support, 'unavailable');
		}
	});

	test('uses only ILO 2025 for the headline and preserves mapping uncertainty', () => {
		for (const occupation of occupations.filter(item => item.score_status === 'scored')) {
			const exposure = occupation.genai_task_exposure;
			assert.equal(exposure?.source, 'ilo_genai_2025');
			assert.equal(exposure?.aggregation, 'median_across_official_isco_matches');
			assert.ok((exposure?.percentile ?? -1) >= 0);
			assert.ok((exposure?.percentile ?? 101) <= 100);
			assert.ok((exposure?.raw_min ?? 2) <= (exposure?.raw_median ?? -1));
			assert.ok((exposure?.raw_max ?? -1) >= (exposure?.raw_median ?? 2));
			assert.deepEqual(occupation.comparison_evidence, {
				eloundou: null,
				aioe: null,
				observed_ai_use: null,
				potential_complementarity: null
			});
		}
	});

	test('publishes direct 2025 MOM wages as nullable evidence', () => {
		const administrationManager = occupations.find(
			occupation => occupation.taxonomy.code === '12112'
		);
		assert.equal(administrationManager?.singapore_market.wages?.gross_monthly_sgd.median, 8050);
		assert.equal(administrationManager?.singapore_market.wages?.reference_period, '2025-06');
		assert.equal(occupations.filter(occupation => occupation.singapore_market.wages).length, 523);
	});

	test('does not revive V8 outcome-like fields', () => {
		const serialized = JSON.stringify(release);
		for (const forbidden of [
			'jobs_affected',
			'wage_pool',
			'substitution_score',
			'augmentation_score',
			'likely_pathway',
			'employment_estimate'
		]) {
			assert.equal(serialized.includes(`"${forbidden}"`), false);
		}
	});
});
