import type { CountryCode } from './country-config';
import type { ConfidenceResult } from './confidence-core';
import type { RiskBand } from './index';

export interface GlobalOccupationRecord {
	canonicalCode: string;
	canonicalTitle: string;
	structuralPressure: number;
	structuralBand: RiskBand;
	exposure: number;
	bottleneck: number;
	employmentThousandWeight: number;
	sourceOccupationCount: number;
	sourceOccupationCodes: string[];
	confidence: ConfidenceResult;
	confidenceLevel: ConfidenceResult['level'];
	dataVintage: string;
}

export interface CountryOccupationRecord {
	countryCode: Exclude<CountryCode, 'global'>;
	localCode: string;
	localTitle: string;
	canonicalCode: string;
	canonicalTitle: string;
	mappingMethod: 'crosswalk_exact' | 'title_match' | 'major_group_fallback';
	structuralPressure: number;
	structuralBand: RiskBand;
	demandResilience: number;
	headlineRisk: number;
	headlineBand: RiskBand;
	wage: {
		median: number | null;
		p25?: number | null;
		p75?: number | null;
		currency: string;
	};
	employment: {
		current: number | null;
		projected: number | null;
		openings: number | null;
		projectedChangePct: number | null;
	};
	confidence: ConfidenceResult;
	dataVintage: string;
	sourceOccupations: string[];
}

export interface CountryIndexMetadata {
	countryCode: Exclude<CountryCode, 'global'>;
	countryName: string;
	classificationSystem: string;
	canonicalSystem: string;
	methodologyVersion: string;
	status: 'ready' | 'research' | 'live';
	sourceVintage: string;
}

export function weightedMean(values: Array<{ value: number | null | undefined; weight: number }>): number {
	let totalWeight = 0;
	let weightedSum = 0;
	for (const entry of values) {
		if (entry.value == null || Number.isNaN(entry.value)) continue;
		if (!Number.isFinite(entry.weight) || entry.weight <= 0) continue;
		totalWeight += entry.weight;
		weightedSum += entry.value * entry.weight;
	}
	return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function percentileRanks(values: number[]): number[] {
	if (values.length === 0) return [];
	const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
	const ranks = new Array<number>(values.length);
	let i = 0;
	while (i < indexed.length) {
		let j = i;
		while (j < indexed.length - 1 && indexed[j + 1]!.value === indexed[i]!.value) j++;
		const percentile = indexed.length === 1 ? 1 : (i + j) / 2 / (indexed.length - 1);
		for (let k = i; k <= j; k++) {
			ranks[indexed[k]!.index] = percentile;
		}
		i = j + 1;
	}
	return ranks;
}

export function confidenceLevelFromScore(score: number): ConfidenceResult['level'] {
	if (score >= 0.7) return 'high';
	if (score >= 0.45) return 'medium';
	return 'low';
}
