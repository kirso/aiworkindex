#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import {
	classifyLikelyPathway,
	midrankPercentiles,
	v8BandFromPoints,
	type AdoptionTier,
	type DemandContext,
	type V8OccupationProjection,
	type V8PublicOccupation
} from '../src/lib/data/v8-contract';
import type { Occupation } from '../src/lib/data';

const ROOT = path.join(import.meta.dir, '..');
const DATA = path.join(ROOT, 'data');
const SRC_DATA = path.join(ROOT, 'src', 'lib', 'data');
const STATIC_DATA = path.join(ROOT, 'static', 'data');
const REFERENCE_DATE = '2026-07-15';

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function writeJson(file: string, value: unknown): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function points(value: number): number {
	return Math.round(Math.max(0, Math.min(100, value)));
}

function rankedIndex(value: number, label: string) {
	const score = points(value);
	return {
		points: score,
		percentile: round(value, 1),
		band: v8BandFromPoints(score),
		interpretation: `${label} is higher than approximately ${score}% of occupations in the Singapore reference market.`
	};
}

type ConfidenceEntry = {
	ssoc: string;
	evidence_quality: { level: 'high' | 'medium' | 'low' };
	limiting_factors: string[];
	policy_cap_reason: string | null;
	match_quality: string;
	exposure_source_count: number;
};

type AgeEntry = {
	ssoc: string;
	attrition_absorber: 'high' | 'medium' | 'low' | 'unknown';
};

type TransitionEntry = {
	from_ssoc: string;
	top_overall: Array<{
		to_ssoc: string;
		to_title: string;
		label: string;
		composite: number;
	}>;
};

type AdoptionArtifact = {
	sector_adoption: Array<{ key: string; adoption_pct: number }>;
};

type IndustryWageEntry = {
	industries: Array<{ key: string; label: string }>;
};

const occupations = readJson<Occupation[]>(path.join(DATA, 'occupations.json'));
const confidence = readJson<{ entries: ConfidenceEntry[] }>(
	path.join(DATA, 'confidence-ratings.json')
);
const ages = readJson<{ entries: AgeEntry[] }>(path.join(DATA, 'age-structure.json'));
const transitions = readJson<{ transitions: TransitionEntry[] }>(
	path.join(DATA, 'transition-support.json')
);
const adoption = readJson<AdoptionArtifact>(path.join(DATA, 'adoption-diffusion.json'));
const industryWages = readJson<Record<string, IndustryWageEntry>>(
	path.join(DATA, 'occupation-industry-wages.json')
);

const confidenceBySsoc = new Map(confidence.entries.map(entry => [entry.ssoc, entry]));
const ageBySsoc = new Map(ages.entries.map(entry => [entry.ssoc, entry]));
const transitionBySsoc = new Map(transitions.transitions.map(entry => [entry.from_ssoc, entry]));
const adoptionBySector = new Map(
	adoption.sector_adoption.map(row => [row.key.replaceAll('_and_', '_'), row.adoption_pct])
);

const exposureRaw = occupations.map(occupation => occupation.exposure);
const substitutionRaw = occupations.map(
	occupation => occupation.exposure * (1 - occupation.bottleneck)
);
const augmentationRaw = occupations.map(occupation => occupation.exposure * occupation.bottleneck);
const exposurePercentiles = midrankPercentiles(exposureRaw);
const substitutionPercentiles = midrankPercentiles(substitutionRaw);
const augmentationPercentiles = midrankPercentiles(augmentationRaw);

const sourceKeys = ['aioe', 'anthropic', 'eloundou', 'ilo'] as const;
const sensitivityVariants = [
	'equal_weight',
	...sourceKeys.map(source => `without_${source}`)
] as const;
const variantRaw = new Map<string, number[]>();

for (const variant of sensitivityVariants) {
	variantRaw.set(
		variant,
		occupations.map(occupation => {
			const pctiles = occupation.evidence.exposure_source_pctiles ?? {};
			const storedWeights = occupation.evidence.exposure_source_weights ?? {};
			const omitted = variant.startsWith('without_') ? variant.slice('without_'.length) : null;
			const available = sourceKeys.filter(
				source => source !== omitted && typeof pctiles[source] === 'number'
			);
			if (available.length === 0) return occupation.exposure;
			if (variant === 'equal_weight') {
				return (
					available.reduce((sum, source) => sum + (pctiles[source] ?? 0), 0) / available.length
				);
			}
			const weightTotal = available.reduce((sum, source) => sum + (storedWeights[source] ?? 0), 0);
			if (weightTotal <= 0) {
				return (
					available.reduce((sum, source) => sum + (pctiles[source] ?? 0), 0) / available.length
				);
			}
			return available.reduce(
				(sum, source) =>
					sum + (pctiles[source] ?? 0) * ((storedWeights[source] ?? 0) / weightTotal),
				0
			);
		})
	);
}

const variantPercentiles = new Map(
	[...variantRaw].map(([key, values]) => [key, midrankPercentiles(values)])
);

function demandContext(occupation: Occupation): { demand: DemandContext; basis: string } {
	if (
		occupation.evidence.sol_match === 'exact' ||
		occupation.evidence.jobs_in_demand_match === 'exact'
	) {
		return {
			demand: 'strong',
			basis: 'Exact official Shortage Occupation List or Jobs in Demand match.'
		};
	}
	const momentum = occupation.market.market_momentum;
	const scarcity = occupation.market.occupation_scarcity;
	if (!Number.isFinite(momentum) || !Number.isFinite(scarcity)) {
		return { demand: 'unknown', basis: 'No usable official local demand pair is available.' };
	}
	if (momentum >= 0.6 && scarcity >= 0.6) {
		return {
			demand: 'strong',
			basis: 'Both official-derived momentum and scarcity ranks are in the top 40%.'
		};
	}
	if (momentum < 0.4 && scarcity < 0.4) {
		return {
			demand: 'weak',
			basis: 'Both official-derived momentum and scarcity ranks are in the bottom 40%.'
		};
	}
	return { demand: 'mixed', basis: 'Official-derived momentum and scarcity signals are mixed.' };
}

function adoptionContext(ssoc: string): {
	adoption: AdoptionTier;
	coverage: 'direct' | 'partial' | 'unknown';
	basis: string;
} {
	const industries = industryWages[ssoc]?.industries ?? [];
	const matched = industries
		.map(industry => ({
			...industry,
			pct: adoptionBySector.get(industry.key.replaceAll('_and_', '_'))
		}))
		.filter((row): row is typeof row & { pct: number } => typeof row.pct === 'number');
	if (matched.length === 0) {
		return {
			adoption: 'unknown',
			coverage: 'unknown',
			basis: 'MOM does not publish a directly mappable adoption rate for the listed industries.'
		};
	}
	const average = matched.reduce((sum, row) => sum + row.pct, 0) / matched.length;
	const tier: AdoptionTier =
		average >= 50
			? 'leading'
			: average >= 25
				? 'established'
				: average >= 10
					? 'emerging'
					: 'limited';
	const coverage = matched.length === industries.length ? 'direct' : 'partial';
	return {
		adoption: tier,
		coverage,
		basis: `${coverage === 'direct' ? 'All' : 'Some'} listed industries have MOM sector adoption evidence; observed-sector average ${round(average, 1)}%.`
	};
}

function evidenceConfidence(occupation: Occupation) {
	const entry = confidenceBySsoc.get(occupation.ssoc);
	const sourceCount =
		entry?.exposure_source_count ?? occupation.evidence.exposure_source_count ?? 0;
	const mapping = entry?.match_quality ?? occupation.match_quality;
	const hasTaskEvidence = (occupation.task_primitives?.task_effective_coverage ?? 0) >= 0.2;
	const high =
		mapping === 'direct' &&
		sourceCount >= 3 &&
		hasTaskEvidence &&
		entry?.evidence_quality.level === 'high' &&
		entry.policy_cap_reason == null;
	const medium = !mapping.includes('major') && sourceCount >= 2;
	return {
		level: high ? ('high' as const) : medium ? ('medium' as const) : ('low' as const),
		limiting_factors: entry?.limiting_factors ?? ['Evidence coverage'],
		exposure_source_count: sourceCount,
		mapping_quality: mapping
	};
}

const enriched = occupations.map((occupation, index) => {
	const exposureRank = exposurePercentiles[index]!;
	const substitution = substitutionPercentiles[index]!;
	const augmentation = augmentationPercentiles[index]!;
	const demand = demandContext(occupation);
	const adoptionContextValue = adoptionContext(occupation.ssoc);
	const age = ageBySsoc.get(occupation.ssoc);
	const transition = transitionBySsoc.get(occupation.ssoc)?.top_overall[0] ?? null;
	const sensitivityPoints = [
		exposureRank,
		...[...variantPercentiles.values()].map(values => values[index]!)
	];
	const minimumSensitivity = Math.min(...sensitivityPoints);
	const maximumSensitivity = Math.max(...sensitivityPoints);
	const minimumBand = v8BandFromPoints(points(minimumSensitivity));
	const maximumBand = v8BandFromPoints(points(maximumSensitivity));

	const v8: V8OccupationProjection = {
		schema_version: '8.0',
		reference_market: 'Singapore SSOC 2020',
		reference_occupation_count: occupations.length,
		reference_date: REFERENCE_DATE,
		ai_exposure_rank: rankedIndex(exposureRank, 'AI exposure'),
		substitution_pressure: rankedIndex(substitution, 'Structural substitution pressure'),
		augmentation_potential: rankedIndex(augmentation, 'AI augmentation potential'),
		likely_pathway: classifyLikelyPathway({
			exposureRankPoints: points(exposureRank),
			substitutionPoints: points(substitution),
			augmentationPoints: points(augmentation),
			demand: demand.demand,
			adoption: adoptionContextValue.adoption,
			adoptionCoverage: adoptionContextValue.coverage
		}),
		market_context: {
			demand: demand.demand,
			demand_basis: demand.basis,
			adoption: adoptionContextValue.adoption,
			adoption_coverage: adoptionContextValue.coverage,
			adoption_basis: adoptionContextValue.basis,
			attrition_absorber: age?.attrition_absorber ?? 'unknown',
			attrition_granularity: age ? 'major_group' : 'unknown',
			// No open official occupation-level series currently isolates graduate or
			// entry-level hiring. Preserve unknown instead of deriving it from the score.
			entry_level_sensitivity: 'unknown'
		},
		evidence_confidence: evidenceConfidence(occupation),
		sensitivity: {
			label: minimumBand === maximumBand ? 'stable' : 'crosses_band',
			minimum_points: points(minimumSensitivity),
			maximum_points: points(maximumSensitivity),
			minimum_band: minimumBand,
			maximum_band: maximumBand,
			method: 'leave_one_source_out_and_equal_weight_v1'
		},
		task_evidence: {
			effective_coverage: occupation.task_primitives?.task_effective_coverage ?? null,
			exposure_concentration: occupation.task_primitives?.task_exposure_concentration ?? null,
			framing:
				'Task concentration is supporting evidence in V8 and does not apply a heuristic multiplier to the headline score.'
		},
		transition: transition
			? {
					to_ssoc: transition.to_ssoc,
					to_title: transition.to_title,
					label: transition.label,
					composite: transition.composite
				}
			: null
	};

	return { ...occupation, v8 };
});

const publicRows: V8PublicOccupation[] = enriched.map(occupation => ({
	schema_version: '8.0',
	ssoc: occupation.ssoc,
	title: occupation.title,
	major_group: occupation.major_group,
	major_group_code: occupation.major_group_code,
	wages: {
		gross_monthly_median_sgd: occupation.gross_wage_median,
		gross_monthly_25th_sgd: occupation.gross_wage_25th,
		gross_monthly_75th_sgd: occupation.gross_wage_75th
	},
	employment: {
		estimated_thousands:
			occupation.estimated_sg_employment_thousands ?? occupation.employment_thousands ?? null,
		basis:
			occupation.employment_basis ??
			'estimated Singapore occupation-family allocation; not an official detailed occupation count'
	},
	ai_task_exposure_index: round(occupation.exposure),
	human_bottleneck_index: round(occupation.bottleneck),
	v8: occupation.v8,
	evidence_sources: occupation.evidence.exposure_source_keys ?? []
}));

// The application still has mature visual components that accept the historical
// top-level score fields. Feed those components V8 index fractions while the
// canonical research file retains the untouched V7 inputs for reproducibility.
const applicationRows = enriched.map(occupation => ({
	...occupation,
	net_risk: occupation.v8.ai_exposure_rank.points / 100,
	risk_band: occupation.v8.ai_exposure_rank.band,
	augmentation: occupation.v8.augmentation_potential.points / 100,
	augmentation_band: occupation.v8.augmentation_potential.band,
	impact_type:
		occupation.v8.likely_pathway === 'limited_direct_change'
			? 'stable'
			: occupation.v8.likely_pathway === 'augmentation_led_growth'
				? 'ai_leveraged'
				: occupation.v8.likely_pathway === 'hiring_or_substitution_pressure'
					? 'at_risk'
					: 'mixed'
}));

writeJson(path.join(DATA, 'occupations.json'), enriched);
writeJson(path.join(SRC_DATA, 'occupations.json'), applicationRows);
writeJson(path.join(DATA, 'occupations-v8.json'), publicRows);
writeJson(path.join(STATIC_DATA, 'sg-ai-occupations-v8.json'), publicRows);

console.log(`Built V8 public contract for ${publicRows.length} Singapore occupations.`);
