import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import type { Occupation } from '../src/lib/data';
import { occupations } from '../src/lib/data';
import claimsMatrix from '../src/lib/data/claims-matrix.json';
import forecastReadiness from '../src/lib/data/forecast-readiness.json';
import {
	applyPercentileShift,
	blendEmploymentMomentum,
	computeAugmentation,
	computeMarketResilience,
	computeMarketModifier,
	computeNetRisk,
	computeStructuralScores,
	computeV6StructuralScores
} from '../src/lib/data/methodology-core';
import { dataSourceRegistry } from '../src/lib/data/data-contract';
import {
	DATA_VINTAGE,
	DEMAND_RESILIENCE_CONSTANTS,
	V7_CONSTANTS,
	classifyImpactType
} from '../src/lib/data/scoring-constants';
import { computeForecastScores, scenarioPresets } from '../src/lib/data/forecast-engine';
import { computeRoleScores, type SyntheticRole } from '../src/lib/data/synthetic-roles';
import { computeTransitionScore } from '../src/lib/data/transition-capacity';
import { computeConfidence } from '../src/lib/data/confidence-core';
import { computeTaskPrimitiveScores } from '../src/lib/data/task-primitives-core';
import { computeBootstrapUncertainty } from '../src/lib/data/uncertainty-core';
import { computeTaskModeSummary, inferTaskModeSignals } from '../src/lib/data/v5-task-mode-core';
import { countryConfigs, supportedCountryCodes } from '../src/lib/data/country-config';
import { globalMethodology } from '../src/lib/data/global-methodology';
import {
	getCountryOccupationEntries,
	getCountryOccupationRow,
	getCountryOccupationRows
} from '../src/lib/data/country-pages';
import {
	getHomeSurface,
	homeSurfaceChoices,
	resolveHomeSurfaceCode
} from '../src/lib/data/home-surface';
import {
	getGlobalOccupationEntries,
	getGlobalOccupationRow,
	globalOccupations
} from '../src/lib/data/global-occupations';
import { usOccupations } from '../src/lib/data/countries/us/occupations';
import researchLibrary from '../src/lib/data/research-library.json';
import shadowAnchorReview from '../src/lib/data/shadow-anchor-review-v43.json';
import shadowComparison from '../src/lib/data/shadow-comparison-v43.json';
import shadowScores from '../src/lib/data/shadow-scores-v43.json';
import shadowValidation from '../src/lib/data/shadow-validation-v43.json';
import v5Augmentation from '../src/lib/data/v5-augmentation-heterogeneity.json';
import v5Mobility from '../src/lib/data/v5-empirical-mobility.json';
import v5Posterior from '../src/lib/data/v5-posterior-uncertainty.json';
import v5RealizedRisk from '../src/lib/data/v5-realized-risk.json';
import v5Sidecars from '../src/lib/data/v5-sidecars.json';
import v5ExperimentalModel from '../src/lib/data/v5-experimental-model.json';
import v5ExperimentalValidation from '../src/lib/data/v5-experimental-validation.json';
import experimentalMethodology from '../src/lib/data/experimental-methodology-v43.json';

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
		displacement_pressure: 0.36,
		demand_signal_bonus: 0,
		demand_resilience: 0.225,
		net_risk: 0.279,
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

	test('stored live occupations reproduce the V7 formulas', () => {
		for (const occupation of occupations) {
			const taskSignal =
				occupation.task_primitives?.task_effective_coverage != null &&
				occupation.task_primitives.task_exposure_concentration != null
					? occupation.task_primitives.task_effective_coverage *
						occupation.task_primitives.task_exposure_concentration
					: 0;
			const exposureV7 = Math.min(
				1,
				occupation.exposure * (1 + V7_CONSTANTS.TASK_CONCENTRATION_LAMBDA * taskSignal)
			);
			const displacementPressure = exposureV7 * (1 - occupation.bottleneck);
			const demandResilience = Math.min(
				1,
				occupation.market.market_resilience * DEMAND_RESILIENCE_CONSTANTS.base_weight +
					(occupation.demand_signal_bonus ?? 0) +
					V7_CONSTANTS.DEMAND_PERSIST_LAMBDA * (occupation.demand_persistence ?? 0)
			);
			const headlineRisk = displacementPressure * (1 - demandResilience);
			const augmentation = exposureV7 * occupation.bottleneck * occupation.market.market_resilience;

			assert.ok(Math.abs(round4(taskSignal) - (occupation.task_signal ?? Number.NaN)) <= 0.00011);
			assert.ok(Math.abs(round4(exposureV7) - (occupation.exposure_v7 ?? Number.NaN)) <= 0.00011);
			assert.ok(
				Math.abs(round4(displacementPressure) - (occupation.displacement_pressure ?? Number.NaN)) <=
					0.00011
			);
			assert.ok(
				Math.abs(round4(demandResilience) - (occupation.demand_resilience ?? Number.NaN)) <= 0.00011
			);
			assert.ok(Math.abs(round4(headlineRisk) - occupation.net_risk) <= 0.00011);
			assert.ok(Math.abs(round4(augmentation) - occupation.augmentation) <= 0.00011);
		}
	});

	test('live occupations expose the current V7 public contract', () => {
		for (const occupation of occupations.slice(0, 50)) {
			assert.equal(occupation.structural_model_version, 'V7');
			assert.equal('scoring_basis' in occupation, false);
			assert.equal('baseline_v43' in occupation, false);
			assert.equal('baseline_v42' in occupation, false);
			assert.equal('transition_adjusted_risk' in occupation, false);
			assert.equal('realized_risk_proxy' in occupation, false);
			assert.equal(typeof occupation.displacement_pressure, 'number');
			assert.equal(typeof occupation.demand_signal_bonus, 'number');
			assert.equal(typeof occupation.demand_resilience, 'number');
			assert.equal(typeof occupation.task_signal, 'number');
			assert.equal(typeof occupation.demand_persistence, 'number');
			assert.equal(typeof occupation.exposure_v7, 'number');
			assert.equal(typeof occupation.baseline_v6?.net_risk, 'number');
			if (occupation.task_primitives?.method === 'anthropic_task_penetration_v1') {
				assert.equal(typeof occupation.task_primitives.matched_task_weight_share, 'number');
				assert.equal(typeof occupation.task_primitives.task_effective_coverage, 'number');
				assert.equal(typeof occupation.task_primitives.task_exposure_concentration, 'number');
			} else {
				assert.deepEqual(occupation.task_primitives, {
					matched_task_weight_share: null,
					task_effective_coverage: null,
					task_exposure_concentration: null,
					method: null
				});
			}
		}
	});

	test('impact classification is pure and demand-agnostic', () => {
		assert.equal(classifyImpactType.length, 2);
		assert.equal(classifyImpactType(0.3, 0.05), 'at_risk');
		assert.equal(classifyImpactType(0.3, 0.2), 'mixed');
		assert.equal(classifyImpactType(0.1, 0.2), 'ai_leveraged');
	});

	test('headline risk is monotone in exposure and inverse monotone in bottleneck/resilience', () => {
		const lowExposure = computeV6StructuralScores({
			exposure: 0.4,
			bottleneck: 0.3,
			base_resilience: 0.4,
			sol_match: false,
			jid_match: false
		}).headline_risk;
		const highExposure = computeV6StructuralScores({
			exposure: 0.6,
			bottleneck: 0.3,
			base_resilience: 0.4,
			sol_match: false,
			jid_match: false
		}).headline_risk;
		const lowBottleneck = computeV6StructuralScores({
			exposure: 0.6,
			bottleneck: 0.2,
			base_resilience: 0.4,
			sol_match: false,
			jid_match: false
		}).headline_risk;
		const highBottleneck = computeV6StructuralScores({
			exposure: 0.6,
			bottleneck: 0.5,
			base_resilience: 0.4,
			sol_match: false,
			jid_match: false
		}).headline_risk;
		const lowResilience = computeV6StructuralScores({
			exposure: 0.6,
			bottleneck: 0.3,
			base_resilience: 0.2,
			sol_match: false,
			jid_match: false
		}).headline_risk;
		const highResilience = computeV6StructuralScores({
			exposure: 0.6,
			bottleneck: 0.3,
			base_resilience: 0.8,
			sol_match: false,
			jid_match: false
		}).headline_risk;

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
			assert.ok(
				occupation.uncertainty.method === 'bootstrap_v1' ||
					occupation.uncertainty.method === 'bootstrap_v1_task_adjusted' ||
					occupation.uncertainty.method === 'latent_source_measurement_v1' ||
					occupation.uncertainty.method === 'bootstrap_v2'
			);
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

	test('published live occupations expose weighted and sparse task primitives where evidence exists', () => {
		const weighted = occupations.filter(
			occupation => occupation.task_primitives?.method === 'anthropic_task_penetration_v1'
		);
		const sparse = occupations.filter(occupation => occupation.task_primitives?.method === null);

		assert.ok(weighted.length > 0);
		assert.ok(sparse.length > 0);
		assert.equal(weighted.length + sparse.length, occupations.length);

		for (const occupation of weighted.slice(0, 10)) {
			assert.equal(occupation.task_primitives?.method, 'anthropic_task_penetration_v1');
			assert.equal(typeof occupation.task_primitives?.matched_task_weight_share, 'number');
			assert.equal(typeof occupation.task_primitives?.task_effective_coverage, 'number');
			assert.equal(typeof occupation.task_primitives?.task_exposure_concentration, 'number');
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

describe('v5 task-mode invariants', () => {
	test('task-mode proxies distinguish delegable and human-led work', () => {
		const delegable = inferTaskModeSignals('Enter invoice data and update payment records.');
		const humanLed = inferTaskModeSignals('Teach students and counsel families on learning plans.');

		assert.ok(delegable.autonomy_proxy > humanLed.autonomy_proxy);
		assert.ok(delegable.success_proxy > humanLed.success_proxy);
		assert.ok(delegable.bottleneck_proxy < humanLed.bottleneck_proxy);
	});

	test('task-mode summary preserves shares and bounded fragility outputs', () => {
		const summary = computeTaskModeSummary([
			{
				task: 'Enter customer details into records systems.',
				weight: 0.55,
				penetration: 0.8
			},
			{
				task: 'Analyze performance trends and recommend process changes.',
				weight: 0.3,
				penetration: 0.6
			},
			{
				task: 'Coordinate with clients and guide teams on service issues.',
				weight: 0.15,
				penetration: 0.3
			}
		]);

		assert.equal(summary.method, 'task_mode_proxy_v5a');
		assert.ok(summary.task_mode_shares !== null);
		assertClose(
			(summary.task_mode_shares?.delegable ?? 0) +
				(summary.task_mode_shares?.copilot ?? 0) +
				(summary.task_mode_shares?.human_led ?? 0),
			1,
			1e-6
		);
		assert.ok((summary.task_mode_effective_coverage ?? -1) >= 0);
		assert.ok((summary.task_mode_effective_coverage ?? 2) <= 1);
		assert.ok((summary.demand_fragility ?? -1) >= 0);
		assert.ok((summary.demand_fragility ?? 2) <= 1);
		assert.ok((summary.reallocation_capacity ?? -1) >= 0);
		assert.ok((summary.reallocation_capacity ?? 2) <= 1);
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

describe('forecast readiness invariants', () => {
	const requiredInputs = [
		'vacancy_trends',
		'vacancy_rates',
		'recruitment_minus_resignation',
		'retrenchment_incidence',
		'wage_movement',
		'postings_volume',
		'ai_skill_share_in_postings',
		'firm_ai_adoption',
		'forecast_horizon_protocol'
	];

	test('forecast-readiness stays non-promoted and does not duplicate realized-risk scoring', () => {
		assert.equal(forecastReadiness.status, 'non_promoted_forecast_readiness_layer');
		assert.equal(forecastReadiness.version, DATA_VINTAGE.model_version);
		assert.equal(forecastReadiness.non_duplication_policy.headline_score_mutated, false);
		assert.equal(forecastReadiness.non_duplication_policy.realized_risk_score_created, false);

		for (const artifact of [
			'data/labour-monitor.json',
			'data/postings/postings-monitor.json',
			'data/ai-in-singapore.json',
			'data/v5-realized-risk.json',
			'data/backtests/multi-period-validation.json'
		]) {
			assert.ok(
				forecastReadiness.non_duplication_policy.existing_artifacts_reused.includes(artifact)
			);
		}
	});

	test('forecast-readiness input matrix is complete and source-backed', () => {
		const inputKeys = forecastReadiness.inputs.map(input => input.key);
		assert.equal(new Set(inputKeys).size, inputKeys.length);

		for (const key of requiredInputs) {
			assert.ok(inputKeys.includes(key), key);
		}

		for (const input of forecastReadiness.inputs) {
			for (const sourceKey of input.source_keys) {
				assert.ok(
					dataSourceRegistry.some(source => source.key === sourceKey),
					`${input.key} source ${sourceKey}`
				);
			}
			assert.match(input.non_duplication_rule, /do not|reuse|keep|extend|use the existing/i);
		}
	});

	test('forecast-readiness health and promotion gates are explicit', () => {
		const statusCounts = forecastReadiness.inputs.reduce(
			(acc, input) => {
				acc[input.status] = (acc[input.status] ?? 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		assert.deepEqual(forecastReadiness.summary.status_counts, statusCounts);
		assert.ok(forecastReadiness.summary.mom_ai_adopting_firms_pct > 0);
		assert.equal(forecastReadiness.file_health.length, forecastReadiness.inputs.length);
		assert.ok(forecastReadiness.file_health.every(entry => entry.all_present));
		assert.deepEqual(forecastReadiness.validation_protocol.horizons, ['t+1Q', 't+2Q', 't+4Q']);
		assert.ok(forecastReadiness.validation_protocol.promotion_gates.length >= 4);
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
		assert.ok(shadowComparison.validation_pass_count >= 2);
		assert.equal(shadowAnchorReview.screening_complete, true);
		assert.equal(
			shadowComparison.anchor_review_summary.review_candidate_count,
			shadowAnchorReview.review_candidate_count
		);
		if (shadowAnchorReview.review_candidate_count > 0) {
			assert.equal(experimentalMethodology.headline_promotion_ready, false);
		}
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

describe('v5 sidecar invariants', () => {
	test('summary artifact publishes all four workstreams', () => {
		assert.equal(v5Sidecars.status, 'pilot_sidecars_published');
		assert.equal(Object.keys(v5Sidecars.sidecars).length, 4);
	});

	test('augmentation and mobility sidecars cover all occupations with bounded scores', () => {
		assert.equal(v5Augmentation.entries.length, occupations.length);
		assert.equal(v5Mobility.entries.length, occupations.length);
		assert.ok(
			v5Augmentation.entries.every(
				entry =>
					entry.workflow_augmentation_readiness >= 0 &&
					entry.workflow_augmentation_readiness <= 1 &&
					entry.heterogeneous_augmentation_proxy >= 0 &&
					entry.heterogeneous_augmentation_proxy <= 1
			)
		);
		assert.ok(v5Mobility.entries.some(entry => entry.status === 'observed_enriched'));
		assert.ok(
			v5Mobility.entries.every(
				entry =>
					entry.observed_transition_coverage >= 0 &&
					entry.observed_transition_coverage <= 1 &&
					entry.empirical_mobility_score >= 0 &&
					entry.empirical_mobility_score <= 1
			)
		);
	});

	test('posterior uncertainty and realized-risk sidecars remain ordered and conservative', () => {
		assert.equal(v5Posterior.entries.length, occupations.length);
		assert.equal(v5RealizedRisk.entries.length, occupations.length);
		assert.ok(
			v5Posterior.entries.every(
				entry =>
					entry.prior_precision > 0 &&
					entry.posterior_variance > 0 &&
					entry.posterior_stdev > 0 &&
					entry.observation_precision >= 0 &&
					entry.exposure_p025 <= entry.exposure_p10 &&
					entry.exposure_p10 <= entry.exposure_p50 &&
					entry.exposure_p50 <= entry.exposure_p90 &&
					entry.exposure_p90 <= entry.exposure_p975 &&
					entry.net_risk_p025 <= entry.net_risk_p10 &&
					entry.net_risk_p10 <= entry.net_risk_p50 &&
					entry.net_risk_p50 <= entry.net_risk_p90 &&
					entry.net_risk_p90 <= entry.net_risk_p975
			)
		);
		assert.ok(
			v5RealizedRisk.entries.every(
				entry =>
					entry.base_realized_risk_proxy <= entry.base_near_term_risk &&
					entry.base_near_term_risk <= entry.structural_risk &&
					entry.realization_scalar >= 0 &&
					entry.realization_scalar <= 1 &&
					typeof entry.archetype === 'string' &&
					entry.short_run_cap_score >= 0 &&
					entry.short_run_cap_score <= 1 &&
					entry.employer_pressure_score >= 0 &&
					entry.employer_pressure_score <= 1 &&
					entry.labour_softness_score >= 0 &&
					entry.labour_softness_score <= 1 &&
					(entry.postings_support_score === null ||
						(entry.postings_support_score >= 0 && entry.postings_support_score <= 1)) &&
					entry.postings_resistance_score >= 0 &&
					entry.postings_resistance_score <= 1 &&
					entry.transition_friction_score >= 0 &&
					entry.transition_friction_score <= 1 &&
					entry.offset_buffer_score >= 0 &&
					entry.offset_buffer_score <= 1 &&
					entry.signal_alignment_score >= 0 &&
					entry.signal_alignment_score <= 1
			)
		);
	});

	test('mobility and posterior sidecars expose bounded upgraded components', () => {
		assert.ok(
			v5Mobility.entries.every(
				entry =>
					entry.destination_quality_score >= 0 &&
					entry.destination_quality_score <= 1 &&
					entry.wage_preservation_score >= 0 &&
					entry.wage_preservation_score <= 1 &&
					entry.training_ease_score >= 0 &&
					entry.training_ease_score <= 1 &&
					(entry.observed_signal_strength === null ||
						(entry.observed_signal_strength >= 0 && entry.observed_signal_strength <= 1)) &&
					(entry.best_transition === null ||
						(entry.best_transition.destination_quality >= 0 &&
							entry.best_transition.destination_quality <= 1 &&
							entry.best_transition.wage_preservation >= 0 &&
							entry.best_transition.wage_preservation <= 1 &&
							entry.best_transition.training_ease >= 0 &&
							entry.best_transition.training_ease <= 1))
			)
		);
	});
});

describe('v5 experimental model invariants', () => {
	test('experimental model covers all occupations and preserves ordered risk layers', () => {
		assert.equal(v5ExperimentalModel.entries.length, occupations.length);
		assert.ok(
			v5ExperimentalModel.entries.every(
				entry =>
					entry.v5_structural_exposure_p10 <= entry.v5_structural_exposure &&
					entry.v5_structural_exposure <= entry.v5_structural_exposure_p90 &&
					entry.task_mode_blend_weight >= 0 &&
					entry.task_mode_blend_weight <= 0.45 &&
					(entry.task_mode_matched_task_weight_share === null ||
						(entry.task_mode_matched_task_weight_share >= 0 &&
							entry.task_mode_matched_task_weight_share <= 1)) &&
					(entry.task_mode_delegable_share === null ||
						Math.abs(
							(entry.task_mode_delegable_share ?? 0) +
								(entry.task_mode_copilot_share ?? 0) +
								(entry.task_mode_human_led_share ?? 0) -
								1
						) <= 0.0002) &&
					entry.v5_structural_risk_p10 <= entry.v5_structural_risk &&
					entry.v5_structural_risk <= entry.v5_structural_risk_p90 &&
					entry.v5_realized_risk_proxy <= entry.v5_transition_adjusted_risk &&
					entry.v5_transition_adjusted_risk <= entry.v5_structural_risk &&
					entry.v5_effective_augmentation >= 0 &&
					entry.v5_effective_augmentation <= 1 &&
					entry.v5_heterogeneous_augmentation >= 0 &&
					entry.v5_heterogeneous_augmentation <= 1 &&
					entry.v5_empirical_mobility >= 0 &&
					entry.v5_empirical_mobility <= 1 &&
					entry.v5_adaptation_capacity >= 0 &&
					entry.v5_adaptation_capacity <= 1 &&
					entry.v5_adaptation_buffer >= 0 &&
					entry.v5_adaptation_buffer <= 1 &&
					entry.v5_demand_fragility >= 0 &&
					entry.v5_demand_fragility <= 1 &&
					entry.v5_reallocation_capacity >= 0 &&
					entry.v5_reallocation_capacity <= 1 &&
					entry.v5_concentration_adjustment >= 1
			)
		);
	});

	test('experimental validation summary matches the model artifact', () => {
		assert.equal(v5ExperimentalValidation.status, 'experimental_only');
		assert.equal(v5ExperimentalValidation.comparison_baseline_version, DATA_VINTAGE.model_version);
		assert.equal(
			v5ExperimentalValidation.summary.occupation_count,
			v5ExperimentalModel.entries.length
		);
		assert.equal(
			v5ExperimentalValidation.summary.transition_band_flip_count,
			v5ExperimentalModel.entries.filter(
				entry => entry.live_risk_band !== entry.v5_transition_adjusted_band
			).length
		);
		assert.equal(
			v5ExperimentalValidation.summary.impact_flip_count,
			v5ExperimentalModel.entries.filter(entry => entry.live_impact_type !== entry.v5_impact_type)
				.length
		);
		assert.equal(
			v5ExperimentalValidation.summary.task_mode_blended_count,
			v5ExperimentalModel.entries.filter(entry => entry.task_mode_blend_weight > 0).length
		);
		assert.ok(
			typeof v5ExperimentalValidation.structural_validation.bls_spearman_rho.experimental ===
				'number'
		);
		assert.ok(
			typeof v5ExperimentalValidation.realized_validation.vacancy_trend_rho.experimental ===
				'number'
		);
		assert.equal(
			v5ExperimentalValidation.summary.realized_pass_count,
			[
				v5ExperimentalValidation.realized_validation.vacancy_trend_rho.pass,
				v5ExperimentalValidation.realized_validation.hiring_net_pressure_rho.pass,
				v5ExperimentalValidation.realized_validation.retrenchment_incidence_rho.pass,
				v5ExperimentalValidation.realized_validation.employer_pressure_rho.pass,
				v5ExperimentalValidation.realized_validation.postings_support_rho.pass
			].filter(pass => pass === true).length
		);
	});
});

describe('global expansion invariants', () => {
	test('country registry exposes the expected launch set', () => {
		assert.deepEqual(supportedCountryCodes, ['global', 'sg', 'us', 'uk', 'ca']);
		assert.equal(countryConfigs.global.canonicalSystem, 'ISCO-08');
		assert.equal(countryConfigs.sg.status, 'live');
		assert.equal(countryConfigs.us.status, 'ready');
		assert.equal(countryConfigs.us.currency, 'USD');
		assert.equal(countryConfigs.uk.status, 'research');
		assert.equal(countryConfigs.uk.classificationSystem, 'SOC 2020');
		assert.equal(countryConfigs.ca.status, 'research');
		assert.equal(countryConfigs.ca.methodologyLabel, 'Canada country layer');
	});

	test('global methodology separates structural and country layers', () => {
		assert.match(globalMethodology.structuralFormula, /exposure/);
		assert.match(globalMethodology.structuralFormula, /bottleneck/);
		assert.match(globalMethodology.localFormula, /country_demand_resilience/);
		assert.ok(globalMethodology.principles.length >= 4);
		assert.ok(globalMethodology.validationLadder.length >= 4);
		assert.ok(globalMethodology.publicationGates.length >= 4);
		assert.equal(globalMethodology.publicationRules.minimumMappingCoverage, 0.8);
		assert.equal(globalMethodology.publicationRules.maximumFallbackShare, 0.2);
		assert.equal(globalMethodology.publicationRules.minimumConfidenceLevel, 'medium');
		assert.equal(globalMethodology.publicationRules.requireOfficialLocalDemandSource, true);
		assert.ok(globalMethodology.publicationGates.some(entry => entry.key === 'regulatory_overlay'));
		assert.ok(globalMethodology.countryReadiness.some(entry => entry.code === 'sg'));
		assert.ok(globalMethodology.countryReadiness.some(entry => entry.code === 'us'));
		assert.ok(globalMethodology.countryReadiness.some(entry => entry.code === 'uk'));
		assert.ok(globalMethodology.countryReadiness.some(entry => entry.code === 'ca'));
		assert.equal(
			globalMethodology.countryReadiness.find(entry => entry.code === 'uk')?.readiness,
			'research'
		);
	});

	test('global and US datasets are generated from the shared methodology contract', () => {
		assert.ok(globalOccupations.length >= 250);
		assert.ok(
			globalOccupations.every(row => row.structuralPressure >= 0 && row.structuralPressure <= 1)
		);
		assert.ok(getGlobalOccupationEntries().length >= 250);
		assert.ok(getGlobalOccupationRow('1120'));
		assert.ok(usOccupations.length >= 700);
		assert.ok(usOccupations.some(row => row.mappingMethod === 'crosswalk_exact'));
		assert.ok(usOccupations.some(row => row.mappingMethod === 'major_group_fallback'));
		assert.ok(usOccupations.every(row => row.countryCode === 'us'));
		assert.ok(usOccupations.every(row => row.wage.currency === 'USD'));
		assert.ok(usOccupations.every(row => row.headlineRisk >= 0 && row.headlineRisk <= 1));
	});

	test('country occupation page helpers expose live SG and US pages', () => {
		const sgRows = getCountryOccupationRows('sg');
		const usRows = getCountryOccupationRows('us');

		assert.ok(sgRows.length >= 500);
		assert.ok(usRows.length >= 700);
		assert.ok(getCountryOccupationEntries().some(entry => entry.country === 'sg'));
		assert.ok(getCountryOccupationEntries().some(entry => entry.country === 'us'));

		const sgSoftware = getCountryOccupationRow('sg', '25121');
		const usSoftware = getCountryOccupationRow('us', '15-1252');

		assert.ok(sgSoftware);
		assert.ok(usSoftware);
		assert.equal(sgSoftware?.currency, 'SGD');
		assert.equal(usSoftware?.currency, 'USD');
		assert.ok((sgSoftware?.headlineRisk ?? 0) >= 0 && (sgSoftware?.headlineRisk ?? 1) <= 1);
		assert.ok((usSoftware?.headlineRisk ?? 0) >= 0 && (usSoftware?.headlineRisk ?? 1) <= 1);
	});

	test('homepage surface contract defaults to global and exposes country views', () => {
		assert.equal(resolveHomeSurfaceCode(null), 'global');
		assert.deepEqual(
			homeSurfaceChoices.map(choice => choice.code),
			['global', 'sg', 'us']
		);

		const globalSurface = getHomeSurface('global');
		const sgSurface = getHomeSurface('sg');
		const usSurface = getHomeSurface('us');

		assert.equal(globalSurface.drilldownHref, '/global');
		assert.equal(globalSurface.metrics[0]?.label, 'Jobs under pressure');
		assert.equal(globalSurface.metrics[1]?.label, 'Occupations at risk');
		assert.equal(globalSurface.metrics[2]?.label, 'Occupations scored');
		assert.equal(globalSurface.occupations[0]?.valueKind, 'count');
		assert.ok(globalSurface.occupations[0]?.linkHref?.startsWith('/global/occupation/'));

		assert.equal(sgSurface.drilldownHref, '/sg');
		assert.equal(sgSurface.metrics[0]?.label, 'Jobs under pressure');
		assert.equal(sgSurface.metrics[1]?.label, 'Wages at risk');
		assert.equal(sgSurface.metrics[2]?.label, 'Occupations at risk');
		assert.equal(sgSurface.occupations[0]?.currency, 'SGD');
		assert.ok(sgSurface.occupations[0]?.linkHref?.startsWith('/occupation/'));

		assert.equal(usSurface.drilldownHref, '/us');
		assert.equal(usSurface.metrics[0]?.label, 'Jobs under pressure');
		assert.equal(usSurface.metrics[1]?.label, 'Wages at risk');
		assert.equal(usSurface.metrics[2]?.label, 'Occupations at risk');
		assert.equal(usSurface.occupations[0]?.currency, 'USD');
		assert.ok(usSurface.occupations[0]?.linkHref?.startsWith('/us/occupation/'));
	});

	test('sitemap only publishes canonical occupation URLs', () => {
		const sitemap = fs.readFileSync(path.join(process.cwd(), 'static', 'sitemap.xml'), 'utf-8');
		const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
		const uniqueLocs = new Set(locs);

		assert.ok(locs.length > 1800);
		assert.equal(locs.length, uniqueLocs.size);
		assert.ok(locs.every(loc => loc?.startsWith('https://aiworkindex.com/')));
		assert.equal(sitemap.includes('kirillso.com'), false);
		assert.equal(sitemap.includes('/sg/occupation/'), false);
		assert.equal(sitemap.includes('/occupation/'), true);
		assert.equal(sitemap.includes('/us/occupation/'), true);
		assert.equal(sitemap.includes('/global/occupation/'), true);
	});
});
