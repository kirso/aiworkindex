import {
	clamp01,
	computeDisplacementPressure,
	computeHeadlineRisk,
	computeDemandResilience,
	computeTaskSignal,
	computeExposureV7,
	computeDemandResilienceV7
} from './methodology-core';

export interface ExposureBootstrapInput {
	key: string;
	value: number;
}

export interface UncertaintyInputs {
	exposureInputs: ExposureBootstrapInput[];
	exposureWeights: Record<string, number>;
	bottleneck: number;
	base_resilience?: number;
	market_resilience?: number;
	demand_signal_bonus?: number;
	marketSpread?: number;
	sampleCount?: number;
	seedValues?: number[];
}

export interface UncertaintyResult {
	exposure_p10: number;
	exposure_p50: number;
	exposure_p90: number;
	net_risk_p10: number;
	net_risk_p50: number;
	net_risk_p90: number;
	method: 'bootstrap_v1';
}

function seedFromInputs(values: number[]): number {
	let seed = 2166136261;
	for (const value of values) {
		const scaled = Math.round(value * 10000);
		seed ^= scaled;
		seed = Math.imul(seed, 16777619);
	}
	return seed >>> 0;
}

function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function randn(random: () => number): number {
	const u1 = Math.max(random(), 1e-12);
	const u2 = random();
	return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function quantile(sortedValues: number[], probability: number): number {
	if (sortedValues.length === 0) return 0;
	const index = Math.max(
		0,
		Math.min(sortedValues.length - 1, Math.floor(probability * (sortedValues.length - 1)))
	);
	return sortedValues[index] ?? 0;
}

function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

export function computeBootstrapUncertainty({
	exposureInputs,
	exposureWeights,
	bottleneck,
	base_resilience,
	market_resilience,
	demand_signal_bonus = 0,
	marketSpread = 0,
	sampleCount = 5000,
	seedValues = []
}: UncertaintyInputs): UncertaintyResult {
	const baseResilience = base_resilience ?? market_resilience ?? 0.5;
	const validExposureInputs = exposureInputs.filter(
		(input) => Number.isFinite(input.value) && Number.isFinite(exposureWeights[input.key] ?? 0)
	);
	const sigma = 0.04 + Math.min(marketSpread * 0.5, 0.03);
	const exposureDraws: number[] = [];
	const netRiskDraws: number[] = [];
	const random = mulberry32(
		seedFromInputs([
			...seedValues,
			validExposureInputs.length,
			bottleneck,
			baseResilience,
			demand_signal_bonus,
			marketSpread
		])
	);

	const drawExposure = (): number => {
		if (validExposureInputs.length === 0) return 0.5;
		if (validExposureInputs.length === 1) return clamp01(validExposureInputs[0]!.value);

		let weightedSum = 0;
		let totalWeight = 0;
		for (let i = 0; i < validExposureInputs.length; i++) {
			const sampled =
				validExposureInputs[Math.floor(random() * validExposureInputs.length)] ??
				validExposureInputs[0]!;
			const weight = exposureWeights[sampled.key] ?? 0;
			weightedSum += sampled.value * weight;
			totalWeight += weight;
		}

		if (totalWeight <= 0) {
			return clamp01(
				validExposureInputs.reduce((sum, input) => sum + input.value, 0) /
					validExposureInputs.length
			);
		}

		return clamp01(weightedSum / totalWeight);
	};

	for (let i = 0; i < sampleCount; i++) {
		const exposure = drawExposure();
		const bottleneckDraw = clamp01(bottleneck + sigma * randn(random));
		const baseResilienceDraw = clamp01(baseResilience + sigma * randn(random));
		const displacementPressure = computeDisplacementPressure({
			exposure,
			bottleneck: bottleneckDraw
		});
		const demandResilienceDraw = computeDemandResilience({
			base_resilience: baseResilienceDraw,
			demand_signal_bonus
		});
		exposureDraws.push(exposure);
		netRiskDraws.push(
			computeHeadlineRisk({
				displacement_pressure: displacementPressure,
				demand_resilience: demandResilienceDraw
			})
		);
	}

	exposureDraws.sort((a, b) => a - b);
	netRiskDraws.sort((a, b) => a - b);

	return {
		exposure_p10: round4(quantile(exposureDraws, 0.1)),
		exposure_p50: round4(quantile(exposureDraws, 0.5)),
		exposure_p90: round4(quantile(exposureDraws, 0.9)),
		net_risk_p10: round4(quantile(netRiskDraws, 0.1)),
		net_risk_p50: round4(quantile(netRiskDraws, 0.5)),
		net_risk_p90: round4(quantile(netRiskDraws, 0.9)),
		method: 'bootstrap_v1'
	};
}

// ============================================
// V7 Bootstrap — includes task-concentration and demand persistence
// ============================================

export interface V7UncertaintyInputs extends UncertaintyInputs {
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	demand_persistence: number;
	task_concentration_lambda: number;
	demand_persist_lambda: number;
}

export interface V7UncertaintyResult {
	exposure_p10: number;
	exposure_p50: number;
	exposure_p90: number;
	net_risk_p10: number;
	net_risk_p50: number;
	net_risk_p90: number;
	method: 'bootstrap_v1' | 'bootstrap_v1_task_adjusted' | 'latent_source_measurement_v1' | 'bootstrap_v2';
}

export function computeBootstrapUncertaintyV7({
	exposureInputs,
	exposureWeights,
	bottleneck,
	base_resilience,
	market_resilience,
	demand_signal_bonus = 0,
	marketSpread = 0,
	sampleCount = 5000,
	seedValues = [],
	task_effective_coverage,
	task_exposure_concentration,
	demand_persistence,
	task_concentration_lambda,
	demand_persist_lambda
}: V7UncertaintyInputs): V7UncertaintyResult {
	const baseResilience = base_resilience ?? market_resilience ?? 0.5;
	const validExposureInputs = exposureInputs.filter(
		(input) => Number.isFinite(input.value) && Number.isFinite(exposureWeights[input.key] ?? 0)
	);
	const sigma = 0.04 + Math.min(marketSpread * 0.5, 0.03);
	const exposureDraws: number[] = [];
	const netRiskDraws: number[] = [];
	const random = mulberry32(
		seedFromInputs([
			...seedValues,
			validExposureInputs.length,
			bottleneck,
			baseResilience,
			demand_signal_bonus,
			marketSpread,
			demand_persistence
		])
	);

	// Task signal is fixed per occupation (not perturbed in Monte Carlo)
	const taskSignal = computeTaskSignal({
		task_effective_coverage,
		task_exposure_concentration
	});

	const drawExposure = (): number => {
		if (validExposureInputs.length === 0) return 0.5;
		if (validExposureInputs.length === 1) return clamp01(validExposureInputs[0]!.value);

		let weightedSum = 0;
		let totalWeight = 0;
		for (let i = 0; i < validExposureInputs.length; i++) {
			const sampled =
				validExposureInputs[Math.floor(random() * validExposureInputs.length)] ??
				validExposureInputs[0]!;
			const weight = exposureWeights[sampled.key] ?? 0;
			weightedSum += sampled.value * weight;
			totalWeight += weight;
		}

		if (totalWeight <= 0) {
			return clamp01(
				validExposureInputs.reduce((sum, input) => sum + input.value, 0) /
					validExposureInputs.length
			);
		}

		return clamp01(weightedSum / totalWeight);
	};

	for (let i = 0; i < sampleCount; i++) {
		const rawExposure = drawExposure();
		const exposureV7 = computeExposureV7(rawExposure, taskSignal, task_concentration_lambda);
		const bottleneckDraw = clamp01(bottleneck + sigma * randn(random));
		const baseResilienceDraw = clamp01(baseResilience + sigma * randn(random));
		const displacementPressure = computeDisplacementPressure({
			exposure: exposureV7,
			bottleneck: bottleneckDraw
		});
		const demandResilienceDraw = computeDemandResilienceV7({
			base_resilience: baseResilienceDraw,
			demand_signal_bonus,
			demand_persistence,
			persist_lambda: demand_persist_lambda
		});
		exposureDraws.push(exposureV7);
		netRiskDraws.push(
			computeHeadlineRisk({
				displacement_pressure: displacementPressure,
				demand_resilience: demandResilienceDraw
			})
		);
	}

	exposureDraws.sort((a, b) => a - b);
	netRiskDraws.sort((a, b) => a - b);

	return {
		exposure_p10: round4(quantile(exposureDraws, 0.1)),
		exposure_p50: round4(quantile(exposureDraws, 0.5)),
		exposure_p90: round4(quantile(exposureDraws, 0.9)),
		net_risk_p10: round4(quantile(netRiskDraws, 0.1)),
		net_risk_p50: round4(quantile(netRiskDraws, 0.5)),
		net_risk_p90: round4(quantile(netRiskDraws, 0.9)),
		method: 'bootstrap_v2'
	};
}
