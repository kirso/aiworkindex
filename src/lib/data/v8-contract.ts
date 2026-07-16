export type V8Band = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type DemandContext = 'strong' | 'mixed' | 'weak' | 'unknown';
export type AdoptionTier = 'leading' | 'established' | 'emerging' | 'limited' | 'unknown';
export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type LikelyPathway =
	| 'limited_direct_change'
	| 'workflow_redesign'
	| 'augmentation_led_growth'
	| 'demand_buffered_redesign'
	| 'hiring_or_substitution_pressure';

export interface V8RankedIndex {
	points: number;
	percentile: number;
	band: V8Band;
	interpretation: string;
}

export interface V8OccupationProjection {
	schema_version: '8.0';
	reference_market: 'Singapore SSOC 2020';
	reference_occupation_count: number;
	reference_date: string;
	ai_exposure_rank: V8RankedIndex;
	substitution_pressure: V8RankedIndex;
	augmentation_potential: V8RankedIndex;
	likely_pathway: LikelyPathway;
	market_context: {
		demand: DemandContext;
		demand_basis: string;
		adoption: AdoptionTier;
		adoption_coverage: 'direct' | 'partial' | 'unknown';
		adoption_basis: string;
		attrition_absorber: 'high' | 'medium' | 'low' | 'unknown';
		attrition_granularity: 'major_group' | 'unknown';
		entry_level_sensitivity: 'elevated' | 'watch' | 'limited' | 'unknown';
	};
	evidence_confidence: {
		level: EvidenceConfidence;
		limiting_factors: string[];
		exposure_source_count: number;
		mapping_quality: string;
	};
	sensitivity: {
		label: 'stable' | 'crosses_band';
		minimum_points: number;
		maximum_points: number;
		minimum_band: V8Band;
		maximum_band: V8Band;
		method: 'leave_one_source_out_and_equal_weight_v1';
	};
	task_evidence: {
		effective_coverage: number | null;
		exposure_concentration: number | null;
		framing: string;
	};
	transition: {
		to_ssoc: string;
		to_title: string;
		label: string;
		composite: number;
	} | null;
}

export interface V8PublicOccupation {
	schema_version: '8.0';
	ssoc: string;
	title: string;
	major_group: string;
	major_group_code: number;
	wages: {
		gross_monthly_median_sgd: number;
		gross_monthly_25th_sgd: number;
		gross_monthly_75th_sgd: number;
	};
	employment: {
		estimated_thousands: number | null;
		basis: string;
	};
	ai_task_exposure_index: number;
	human_bottleneck_index: number;
	v8: V8OccupationProjection;
	evidence_sources: string[];
}

export function v8BandFromPoints(points: number): V8Band {
	if (points < 20) return 'very_low';
	if (points < 40) return 'low';
	if (points < 60) return 'moderate';
	if (points < 80) return 'high';
	return 'very_high';
}

export function midrankPercentiles(values: number[]): number[] {
	if (values.length <= 1) return values.map(() => 50);
	const indexed = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
	const result = new Array<number>(values.length);
	let start = 0;
	while (start < indexed.length) {
		let end = start;
		while (end + 1 < indexed.length && indexed[end + 1]!.value === indexed[start]!.value) end++;
		const midrank = (start + end) / 2;
		const percentile = (100 * midrank) / (values.length - 1);
		for (let cursor = start; cursor <= end; cursor++) result[indexed[cursor]!.index] = percentile;
		start = end + 1;
	}
	return result;
}

export function classifyLikelyPathway(input: {
	exposureRankPoints: number;
	substitutionPoints: number;
	augmentationPoints: number;
	demand: DemandContext;
	adoption: AdoptionTier;
	adoptionCoverage: 'direct' | 'partial' | 'unknown';
}): LikelyPathway {
	if (input.exposureRankPoints < 40) return 'limited_direct_change';
	const adoptionSupported =
		input.adoptionCoverage === 'direct' &&
		(input.adoption === 'leading' || input.adoption === 'established');
	if (input.substitutionPoints >= 60 && adoptionSupported && input.demand !== 'strong') {
		return 'hiring_or_substitution_pressure';
	}
	if (input.augmentationPoints >= 60 && input.demand === 'strong') {
		return 'augmentation_led_growth';
	}
	if (input.substitutionPoints >= 60 && input.demand === 'strong') {
		return 'demand_buffered_redesign';
	}
	return 'workflow_redesign';
}
