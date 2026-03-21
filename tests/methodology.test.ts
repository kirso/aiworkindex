import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Occupation } from '../src/lib/data';
import { occupations } from '../src/lib/data';
import claimsMatrix from '../src/lib/data/claims-matrix.json';
import {
	applyPercentileShift,
	blendEmploymentMomentum,
	computeAugmentation,
	computeMarketResilience,
	computeMarketModifier,
	computeNetRisk,
	computeStructuralScores
} from '../src/lib/data/methodology-core';
import { dataSourceRegistry } from '../src/lib/data/data-contract';
import { classifyImpactType } from '../src/lib/data/scoring-constants';
import { computeForecastScores, scenarioPresets } from '../src/lib/data/forecast-engine';
import { computeRoleScores, type SyntheticRole } from '../src/lib/data/synthetic-roles';
import { computeTransitionScore } from '../src/lib/data/transition-capacity';
import { computeConfidence } from '../src/lib/data/confidence-core';
import { computeTaskPrimitiveScores } from '../src/lib/data/task-primitives-core';
import { computeBootstrapUncertainty } from '../src/lib/data/uncertainty-core';
import researchLibrary from '../src/lib/data/research-library.json';
import shadowComparison from '../src/lib/data/shadow-comparison-v43.json';
import shadowScores from '../src/lib/data/shadow-scores-v43.json';
import shadowValidation from '../src/lib/data/shadow-validation-v43.json';

function makeOccupation(overrides: Partial<Occupation> = {}): Occupation {
	return {
		ssoc: '99999',
		title: 'Test Occupation',
		major_group: 'PROFESSIONALS',
		major_group_code: 2,
		gross_wage_median: 5000,
		gross_wage_25th: 4000,
		gross_wage_75th: 6500,
		employment_thousands: 10,
		group_employment_thousands: 100,
		exposure: 0.6,
		bottleneck: 0.4,
		market: {
			market_momentum: 0.5,
			occupation_scarcity: 0.5,
			market_resilience: 0.5,
			market_modifier: computeMarketModifier(0.5)
		},
		net_risk: computeNetRisk({ exposure: 0.6, bottleneck: 0.4, market_resilience: 0.5 }),
		risk_band: 'moderate',
		augmentation: computeAugmentation({ exposure: 0.6, bottleneck: 0.4, market_resilience: 0.5 }),
		augmentation_band: 'moderate',
		impact_type: 'stable',
		evidence: {
			anthropic_calibrated: false,
			anthropic_gap: null,
			anthropic_observed_pctile: null,
			sol_match: false,
			jobs_in_demand_match: false
		},
		confidence: {
			score: 0.7,
			level: 'high',
			crosswalk_quality: 1,
			market_data_granularity: 0.8,
			source_freshness: 0.8
		},
		stability: {
			optimistic_risk: 0.15,
			optimistic_band: 'moderate',
			pessimistic_risk: 0.25,
			pessimistic_band: 'moderate',
			distance_to_band_edge: 0.03,
			label: 'stable'
		},
		task_primitives: {
			matched_task_weight_share: null,
			task_effective_coverage: null,
			task_exposure_concentration: null,
			method: null
		},
		uncertainty: {
			exposure_p10: 0.5,
			exposure_p50: 0.6,
			exposure_p90: 0.7,
			net_risk_p10: 0.15,
			net_risk_p50: 0.2,
			net_risk_p90: 0.25,
			method: 'bootstrap_v1'
		},
		labour_monitor: null,
		raw: {
			aioe: 0.6,
			theta: 0.4,
			c_aioe: 0.4,
			log_wage_spread: 0.2,
			wage_position: 1.1
		},
		isco_codes_matched: ['1234'],
		match_quality: 'direct',
		scores: {
			aioe: 0.6,
			theta: 0.4,
			c_aioe: 0.4,
			category: 'low_exposure',
			match_quality: 'direct'
		},
		education_level: 3,
		...overrides
	};
}

function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

function assertClose(actual: number, expected: number, tolerance: number, message?: string): void {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		message ?? `${actual} not within ${tolerance} of ${expected}`
	);
}

describe('methodology formulas', () => {
	test('structural score helpers match canonical formulas', () => {
		const scores = computeStructuralScores({
			exposure: 0.72,
			bottleneck: 0.35,
			market_resilience: 0.64
		});

		assertClose(scores.market_modifier, 1 - 0.35 * 0.64, 1e-10);
		assertClose(scores.net_risk, 0.72 * (1 - 0.35) * (1 - 0.35 * 0.64), 1e-10);
		assertClose(scores.augmentation, 0.72 * 0.35 * 0.64, 1e-10);
		assertClose(
			computeMarketResilience({ market_momentum: 0.64, occupation_scarcity: 0.21 }),
			0.6 * 0.64 + 0.4 * 0.21,
			1e-10
		);
		assertClose(blendEmploymentMomentum(0.3, 0.7), 0.56, 1e-10);
	});

	test('stored occupation scores reproduce the canonical formulas', () => {
		for (const occupation of occupations.slice(0, 50)) {
			assert.ok(
				Math.abs(
					round4(
						computeNetRisk({
							exposure: occupation.exposure,
							bottleneck: occupation.bottleneck,
							market_resilience: occupation.market.market_resilience
						})
					) - occupation.net_risk
				) <= 0.00011
			);
			assert.ok(
				Math.abs(
					round4(
						computeAugmentation({
							exposure: occupation.exposure,
							bottleneck: occupation.bottleneck,
							market_resilience: occupation.market.market_resilience
						})
					) - occupation.augmentation
				) <= 0.00011
			);
		}
	});

	test('impact classification is pure and demand-agnostic', () => {
		assert.equal(classifyImpactType.length, 2);
		assert.equal(classifyImpactType(0.3, 0.05), 'at_risk');
		assert.equal(classifyImpactType(0.3, 0.2), 'mixed');
		assert.equal(classifyImpactType(0.1, 0.2), 'ai_leveraged');
	});

	test('net risk is monotone in exposure and inverse monotone in bottleneck/resilience', () => {
		const lowExposure = computeNetRisk({ exposure: 0.4, bottleneck: 0.3, market_resilience: 0.4 });
		const highExposure = computeNetRisk({ exposure: 0.6, bottleneck: 0.3, market_resilience: 0.4 });
		const lowBottleneck = computeNetRisk({
			exposure: 0.6,
			bottleneck: 0.2,
			market_resilience: 0.4
		});
		const highBottleneck = computeNetRisk({
			exposure: 0.6,
			bottleneck: 0.5,
			market_resilience: 0.4
		});
		const lowResilience = computeNetRisk({
			exposure: 0.6,
			bottleneck: 0.3,
			market_resilience: 0.2
		});
		const highResilience = computeNetRisk({
			exposure: 0.6,
			bottleneck: 0.3,
			market_resilience: 0.8
		});

		assert.ok(highExposure > lowExposure);
		assert.ok(highBottleneck < lowBottleneck);
		assert.ok(highResilience < lowResilience);
	});
});

describe('forecast invariants', () => {
	test('base forecast separates structural and near-term risk while staying directionally neutral', () => {
		const occupation = makeOccupation();
		const scores = computeForecastScores(occupation, scenarioPresets.base.params);

		assertClose(scores.structuralRisk, occupation.net_risk, 1e-10);
		assertClose(scores.nearTermRisk, occupation.net_risk * 0.35, 0.001);
		assertClose(scores.displacementScore, scores.nearTermRisk, 0.001);
		assert.equal(scores.direction, 'stable');
		assert.equal(scores.confidence, 'high');
	});

	test('latent percentile shifts preserve midpoint calibration while compressing the tails', () => {
		assertClose(applyPercentileShift(0.5, 0.14), 0.64, 0.005);
		assert.ok(applyPercentileShift(0.98, 0.14) < 0.995);
		assert.ok(applyPercentileShift(0.02, -0.12) > 0.001);
		assert.ok(applyPercentileShift(0.98, 0.14) - 0.98 < 0.64 - 0.5);
	});
});

describe('confidence invariants', () => {
	test('confidence score stays bounded and reflects industry-footprint granularity', () => {
		const withIndustry = computeConfidence({
			matchQuality: 'direct',
			aioeDispersion: 0,
			thetaDispersion: 0,
			hasExactDemand: false,
			hasPrefixDemand: false,
			hasIndustryFootprint: true,
			exposureSourceKeys: ['aioe', 'anthropic', 'eloundou'],
			exposureSourceWeights: { aioe: 0.3, anthropic: 0.4, eloundou: 0.3 },
			exposureAgreement: 'aligned_mid',
			stabilityLabel: 'stable',
			signalConflict: false
		});
		const baseline = computeConfidence({
			matchQuality: 'direct',
			aioeDispersion: 0,
			thetaDispersion: 0,
			hasExactDemand: false,
			hasPrefixDemand: false,
			hasIndustryFootprint: false,
			exposureSourceKeys: ['aioe', 'anthropic', 'eloundou'],
			exposureSourceWeights: { aioe: 0.3, anthropic: 0.4, eloundou: 0.3 },
			exposureAgreement: 'aligned_mid',
			stabilityLabel: 'stable',
			signalConflict: false
		});

		assert.ok(withIndustry.score >= 0 && withIndustry.score <= 1);
		assert.ok(withIndustry.market_data_granularity > baseline.market_data_granularity);
	});
});

describe('uncertainty invariants', () => {
	test('bootstrap intervals are ordered and deterministic', () => {
		const inputs = {
			exposureInputs: [
				{ key: 'aioe', value: 0.55 },
				{ key: 'anthropic', value: 0.65 },
				{ key: 'eloundou', value: 0.6 }
			],
			exposureWeights: { aioe: 0.3, anthropic: 0.4, eloundou: 0.3 },
			bottleneck: 0.4,
			market_resilience: 0.5,
			seedValues: [1, 2, 3]
		};
		const first = computeBootstrapUncertainty(inputs);
		const second = computeBootstrapUncertainty(inputs);

		assert.deepEqual(first, second);
		assert.ok(first.exposure_p10 <= first.exposure_p50);
		assert.ok(first.exposure_p50 <= first.exposure_p90);
		assert.ok(first.net_risk_p10 <= first.net_risk_p50);
		assert.ok(first.net_risk_p50 <= first.net_risk_p90);
	});

	test('published occupations expose ordered uncertainty intervals', () => {
		for (const occupation of occupations.slice(0, 25)) {
			if (!occupation.uncertainty) continue;
			assert.ok(occupation.uncertainty.exposure_p10 <= occupation.uncertainty.exposure_p50);
			assert.ok(occupation.uncertainty.exposure_p50 <= occupation.uncertainty.exposure_p90);
			assert.ok(occupation.uncertainty.net_risk_p10 <= occupation.uncertainty.net_risk_p50);
			assert.ok(occupation.uncertainty.net_risk_p50 <= occupation.uncertainty.net_risk_p90);
		}
	});
});

describe('task primitive invariants', () => {
	test('task concentration rises when the same coverage is concentrated in fewer weighted tasks', () => {
		const diffuse = computeTaskPrimitiveScores([
			{ weight: 0.5, penetration: 0.4 },
			{ weight: 0.5, penetration: 0.4 }
		]);
		const concentrated = computeTaskPrimitiveScores([
			{ weight: 0.8, penetration: 0.5 },
			{ weight: 0.2, penetration: 0.0 }
		]);

		assert.equal(diffuse.method, 'anthropic_task_penetration_v1');
		assert.equal(concentrated.method, 'anthropic_task_penetration_v1');
		assert.ok(
			(concentrated.task_exposure_concentration ?? 0) > (diffuse.task_exposure_concentration ?? 0)
		);
	});

	test('published occupations expose weighted task primitives when evidence exists and explicit nulls otherwise', () => {
		const weighted = occupations.filter(
			occupation => occupation.task_primitives?.method === 'anthropic_task_penetration_v1'
		);
		const sparse = occupations.filter(occupation => occupation.task_primitives?.method === null);

		assert.ok(weighted.length >= 450);
		assert.ok(sparse.length > 0);

		for (const occupation of weighted.slice(0, 25)) {
			assert.ok((occupation.task_primitives?.matched_task_weight_share ?? -1) >= 0);
			assert.ok((occupation.task_primitives?.matched_task_weight_share ?? 2) <= 1);
			assert.ok((occupation.task_primitives?.task_effective_coverage ?? -1) >= 0);
			assert.ok((occupation.task_primitives?.task_effective_coverage ?? 2) <= 1);
			assert.ok((occupation.task_primitives?.task_exposure_concentration ?? -1) >= 0);
			assert.ok((occupation.task_primitives?.task_exposure_concentration ?? 2) <= 1);
		}

		for (const occupation of sparse.slice(0, 10)) {
			assert.deepEqual(occupation.task_primitives, {
				matched_task_weight_share: null,
				task_effective_coverage: null,
				task_exposure_concentration: null,
				method: null
			});
		}
	});
});

describe('research registry invariants', () => {
	test('research keys are unique and claims/source links resolve', () => {
		const keys = researchLibrary.entries.map(entry => entry.key);
		assert.equal(new Set(keys).size, keys.length);

		for (const claim of claimsMatrix.claims) {
			for (const researchKey of claim.research_keys) {
				assert.ok(researchLibrary.entries.some(entry => entry.key === researchKey));
			}
		}

		for (const source of dataSourceRegistry) {
			for (const researchKey of source.research_keys ?? []) {
				assert.ok(researchLibrary.entries.some(entry => entry.key === researchKey));
			}
		}
	});
});

describe('shadow artifact invariants', () => {
	test('shadow scores cover all occupations and publish explicit eligibility states', () => {
		assert.equal(shadowScores.length, occupations.length);
		assert.ok(
			shadowScores.every(score =>
				['task_native', 'occupation_fallback', 'insufficient_task_evidence'].includes(
					score.shadow_eligibility_status
				)
			)
		);
		assert.ok(
			shadowScores.filter(score => score.shadow_eligibility_status === 'task_native').length >= 450
		);
	});

	test('shadow delta equals shadow net risk minus baseline net risk', () => {
		for (const score of shadowScores.slice(0, 50)) {
			assertClose(
				score.delta_vs_v42,
				round4(score.shadow_net_risk - score.baseline_net_risk),
				0.00011
			);
		}
	});

	test('shadow validation summary matches the validation artifact', () => {
		const passCount = [
			shadowValidation.cluster_directional_accuracy.pass,
			shadowValidation.bls_spearman_rho.pass,
			shadowValidation.occupation_family_spearman_rho.pass
		].filter(Boolean).length;

		assert.equal(shadowComparison.validation_pass_count, passCount);
		assert.equal(shadowComparison.occupation_count, occupations.length);
	});
});

describe('synthetic role invariants', () => {
	test('role augmentation stays formula-consistent with blended primitives', () => {
		const occupationsBySSoc = new Map<string, Occupation>([
			[
				'11111',
				makeOccupation({
					ssoc: '11111',
					title: 'Primary Component',
					exposure: 0.8,
					bottleneck: 0.6,
					market: {
						market_momentum: 0.6,
						occupation_scarcity: 0.7,
						market_resilience: 0.55,
						market_modifier: computeMarketModifier(0.55)
					},
					net_risk: computeNetRisk({ exposure: 0.8, bottleneck: 0.6, market_resilience: 0.55 }),
					augmentation: computeAugmentation({
						exposure: 0.8,
						bottleneck: 0.6,
						market_resilience: 0.55
					})
				})
			],
			[
				'22222',
				makeOccupation({
					ssoc: '22222',
					title: 'Secondary Component',
					exposure: 0.4,
					bottleneck: 0.5,
					market: {
						market_momentum: 0.4,
						occupation_scarcity: 0.4,
						market_resilience: 0.35,
						market_modifier: computeMarketModifier(0.35)
					},
					net_risk: computeNetRisk({ exposure: 0.4, bottleneck: 0.5, market_resilience: 0.35 }),
					augmentation: computeAugmentation({
						exposure: 0.4,
						bottleneck: 0.5,
						market_resilience: 0.35
					})
				})
			]
		]);

		const role: SyntheticRole = {
			slug: 'custom-test-role',
			title: 'Custom Test Role',
			description: 'Synthetic role for invariant checks.',
			tags: ['test'],
			components: [
				{ ssoc: '11111', weight: 0.6, rationale: 'Primary' },
				{ ssoc: '22222', weight: 0.4, rationale: 'Secondary' }
			]
		};

		const scored = computeRoleScores(role, occupationsBySSoc);

		assertClose(
			scored.augmentation,
			computeAugmentation({
				exposure: scored.exposure,
				bottleneck: scored.bottleneck,
				market_resilience: scored.market_resilience
			}),
			1e-10
		);
	});

	test('missing role weight falls back toward neutral instead of renormalizing survivors', () => {
		const occupationsBySSoc = new Map<string, Occupation>([
			[
				'11111',
				makeOccupation({
					ssoc: '11111',
					exposure: 0.9,
					bottleneck: 0.7,
					market: {
						market_momentum: 0.5,
						occupation_scarcity: 0.5,
						market_resilience: 0.5,
						market_modifier: computeMarketModifier(0.5)
					},
					net_risk: computeNetRisk({ exposure: 0.9, bottleneck: 0.7, market_resilience: 0.5 }),
					augmentation: computeAugmentation({
						exposure: 0.9,
						bottleneck: 0.7,
						market_resilience: 0.5
					})
				})
			]
		]);

		const role: SyntheticRole = {
			slug: 'coverage-test-role',
			title: 'Coverage Test Role',
			description: 'Role with one missing component.',
			tags: ['test'],
			components: [
				{ ssoc: '11111', weight: 0.2, rationale: 'Present' },
				{ ssoc: '99998', weight: 0.8, rationale: 'Missing' }
			]
		};

		const scored = computeRoleScores(role, occupationsBySSoc);
		assertClose(scored.exposure, 0.58, 1e-10);
	});
});

describe('transition capacity invariants', () => {
	test('credential gap follows education distance instead of major-group code distance', () => {
		const from = makeOccupation({ ssoc: '30000', education_level: 2, major_group_code: 9 });
		const toNear = makeOccupation({ ssoc: '30001', education_level: 2, major_group_code: 1 });
		const toFar = makeOccupation({ ssoc: '30002', education_level: 5, major_group_code: 1 });

		assert.equal(computeTransitionScore(from, toNear).credential_gap, 1);
		assert.equal(computeTransitionScore(from, toFar).credential_gap, 0.2);
	});
});
