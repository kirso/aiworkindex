import { clamp01, computeNetRisk } from './methodology-core';

export interface ExposureBootstrapInput {
	key: string;
	value: number;
}

export interface UncertaintyInputs {
	exposureInputs: ExposureBootstrapInput[];
	exposureWeights: Record<string, number>;
	bottleneck: number;
	market_resilience: number;
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
	market_resilience,
	marketSpread = 0,
	sampleCount = 5000,
	seedValues = []
}: UncertaintyInputs): UncertaintyResult {
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
			market_resilience,
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
		const marketDraw = clamp01(market_resilience + sigma * randn(random));
		exposureDraws.push(exposure);
		netRiskDraws.push(
			computeNetRisk({
				exposure,
				bottleneck: bottleneckDraw,
				market_resilience: marketDraw
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
