#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { occupations, type Occupation } from '../src/lib/data';
import type { ExposureSourceKey } from '../src/lib/data/scoring-constants';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import {
	computeAugmentationPrior,
	computeExposureSourceCalibrations,
	computeMobilityPrior,
	computePosteriorExposure,
	computeRealizedRiskSidecar,
	type V5WorkstreamStatus
} from '../src/lib/data/v5-sidecar-core';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const TRANSITION_SUPPORT_FILE = path.join(DATA_DIR, 'transition-support.json');
const OFFSET_POTENTIAL_FILE = path.join(DATA_DIR, 'offset-potential.json');
const SHADOW_SCORES_FILE = path.join(DATA_DIR, 'shadow-scores-v43.json');
const EMPLOYER_SIGNALS_FILE = path.join(DATA_DIR, 'employer-signals.json');
const POSTINGS_MONITOR_FILE = path.join(DATA_DIR, 'postings', 'postings-monitor.json');

const AUGMENTATION_FILE = 'v5-augmentation-heterogeneity.json';
const MOBILITY_FILE = 'v5-empirical-mobility.json';
const POSTERIOR_FILE = 'v5-posterior-uncertainty.json';
const REALIZED_FILE = 'v5-realized-risk.json';
const SUMMARY_FILE = 'v5-sidecars.json';

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function round(value: number | null, digits = 4): number | null {
	if (value === null || !Number.isFinite(value)) return null;
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

interface TransitionSupportRow {
	from_ssoc: string;
	from_title: string;
	top_overall: Array<{
		to_ssoc: string;
		to_title: string;
		composite: number;
		skill_overlap?: number;
		wage_preservation?: number;
		demand_strength?: number;
		risk_improvement?: number;
		credential_gap?: number;
		observed_transition_rate: number | null;
		observed_wage_delta?: number | null;
		observed_training_duration_months?: number | null;
	}>;
}

interface OffsetPotentialData {
	entries: Array<{
		ssoc: string;
		score: number;
		band: 'low' | 'medium' | 'high';
		components?: {
			demand_persistence?: number;
			transition_support?: number;
			reallocation_room?: number;
			mobility_friction?: number;
		};
	}>;
}

interface EmployerSignalsData {
	by_archetype: Record<
		string,
		{
			pressure_score: number;
			label: string;
			signal_count: number;
		}
	>;
}

interface PostingsMonitorData {
	by_ssoc?: Record<
		string,
		{
			posting_volume_30d?: number;
			trend_90d?: string;
			hiring_state?: string;
			freshness_days?: number;
		}
	>;
}

interface ShadowScoreRow {
	ssoc: string;
	shadow_eligibility_status: string;
	shadow_calibrated_task_exposure: number | null;
	shadow_reallocation_buffer: number | null;
}

function topMovers<T extends { ssoc: string; title: string; delta_vs_live?: number | null }>(
	rows: T[],
	direction: 'positive' | 'negative',
	limit = 5
) {
	const sorted = [...rows]
		.filter((row): row is T & { delta_vs_live: number } => typeof row.delta_vs_live === 'number')
		.sort((a, b) =>
			direction === 'positive'
				? b.delta_vs_live - a.delta_vs_live
				: a.delta_vs_live - b.delta_vs_live
		)
		.slice(0, limit);

	return sorted.map(row => ({
		ssoc: row.ssoc,
		title: row.title,
		delta_vs_live: round(row.delta_vs_live)
	}));
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function buildGroupPriorStats(rows: Occupation[]) {
	const byGroup = new Map<string, number[]>();
	for (const occupation of rows) {
		const value =
			occupation.baseline_v43?.exposure ?? occupation.baseline_v42?.exposure ?? occupation.exposure;
		const list = byGroup.get(occupation.major_group) ?? [];
		list.push(value);
		byGroup.set(occupation.major_group, list);
	}

	return new Map(
		[...byGroup.entries()].map(([group, values]) => {
			const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
			const variance =
				values.length > 1
					? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
					: 0.01;
			return [group, { mean, variance }];
		})
	);
}

function buildOutputs() {
	const transitionSupport = readJson<{ transitions: TransitionSupportRow[] }>(
		TRANSITION_SUPPORT_FILE
	);
	const offsetPotential = readJson<OffsetPotentialData>(OFFSET_POTENTIAL_FILE);
	const shadowScores = readJson<ShadowScoreRow[]>(SHADOW_SCORES_FILE);
	const employerSignals = readJson<EmployerSignalsData>(EMPLOYER_SIGNALS_FILE);
	const postingsMonitor = readJson<PostingsMonitorData>(POSTINGS_MONITOR_FILE);

	const transitionsBySsoc = new Map(
		transitionSupport.transitions.map(entry => [entry.from_ssoc, entry])
	);
	const offsetBySsoc = new Map(offsetPotential.entries.map(entry => [entry.ssoc, entry]));
	const shadowBySsoc = new Map(shadowScores.map(entry => [entry.ssoc, entry]));
	const groupPriorStats = buildGroupPriorStats(occupations);
	const sourceCalibrations = computeExposureSourceCalibrations(occupations);

	const augmentationEntries = occupations.map(occupation => {
		const result = computeAugmentationPrior(occupation);
		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			live_augmentation: round(occupation.augmentation),
			...Object.fromEntries(
				Object.entries(result).map(([key, value]) => [
					key,
					typeof value === 'number' ? round(value) : value
				])
			)
		};
	});

	const mobilityEntries = occupations.map(occupation => {
		const transitionRow = transitionsBySsoc.get(occupation.ssoc);
		const result = computeMobilityPrior(transitionRow?.top_overall ?? []);
		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			from_risk_band: occupation.risk_band,
			...Object.fromEntries(
				Object.entries(result).map(([key, value]) => {
					if (typeof value === 'number') return [key, round(value)];
					if (
						value &&
						typeof value === 'object' &&
						'composite' in value &&
						'empirical_priority' in value
					) {
						return [
							key,
							{
								...value,
								composite: round(value.composite),
								observed_transition_rate: round(value.observed_transition_rate),
								destination_quality: round(value.destination_quality),
								wage_preservation: round(value.wage_preservation),
								training_ease: round(value.training_ease),
								empirical_priority: round(value.empirical_priority)
							}
						];
					}
					return [key, value];
				})
			),
			research_keys: ['imf_occupational_mobility_2024']
		};
	});

	const posteriorEntries = occupations.map(occupation => {
		const priorStats = groupPriorStats.get(occupation.major_group) ?? { mean: 0.5, variance: 0.02 };
		const shadow = shadowBySsoc.get(occupation.ssoc);
		const result = computePosteriorExposure(
			occupation,
			priorStats.mean,
			priorStats.variance,
			(occupation.evidence.exposure_source_pctiles ?? {}) as Partial<
				Record<ExposureSourceKey, number>
			>,
			sourceCalibrations,
			shadow
				? {
						eligibility_status: shadow.shadow_eligibility_status,
						calibrated_task_exposure: shadow.shadow_calibrated_task_exposure,
						reallocation_buffer: shadow.shadow_reallocation_buffer
					}
				: undefined
		);

		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			scoring_basis: occupation.scoring_basis ?? null,
			source_pctiles: occupation.evidence.exposure_source_pctiles ?? {},
			research_keys: ['coyle_poquiz_2025', 'anthropic_economic_index_2026'],
			...Object.fromEntries(
				Object.entries(result).map(([key, value]) => [
					key,
					typeof value === 'number' ? round(value) : value
				])
			)
		};
	});

	const realizedEntries = occupations.map(occupation => {
		const offset = offsetBySsoc.get(occupation.ssoc);
		const archetype = computeAugmentationPrior(occupation).archetype;
		const result = computeRealizedRiskSidecar(
			occupation,
			offset
				? {
						score: offset.score,
						components: offset.components
					}
				: null,
			postingsMonitor?.by_ssoc?.[occupation.ssoc] ?? null,
			employerSignals?.by_archetype?.[archetype]?.pressure_score ?? null
		);
		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			risk_band: occupation.risk_band,
			archetype: result.archetype,
			short_run_cap_score: round(result.short_run_cap_score),
			offset_potential_score: round(offset?.score ?? null),
			offset_potential_band: offset?.band ?? null,
			labour_signal: occupation.labour_monitor?.overall ?? null,
			employer_pressure_score: round(result.employer_pressure_score),
			labour_softness_score: round(result.labour_softness_score),
			postings_support_score: round(result.postings_support_score),
			postings_resistance_score: round(result.postings_resistance_score),
			transition_friction_score: round(result.transition_friction_score),
			offset_buffer_score: round(result.offset_buffer_score),
			demand_persistence_score: round(result.demand_persistence_score),
			signal_alignment_score: round(result.signal_alignment_score),
			research_keys: [
				'bick_blandin_deming_2025',
				'humlum_vestergaard_2025',
				'metr_time_horizons_2026',
				'anthropic_labor_market_impacts_2026',
				'imf_occupational_mobility_2024'
			],
			structural_risk: round(result.structural_risk),
			base_near_term_risk: round(result.base_near_term_risk),
			base_realized_risk_proxy: round(result.base_realized_risk_proxy),
			realization_scalar: round(result.realization_scalar),
			gap_to_structural: round(result.gap_to_structural),
			scenarios: Object.fromEntries(
				Object.entries(result.scenarios).map(([key, value]) => [
					key,
					{
						near_term_risk: round(value.near_term_risk),
						realized_risk_proxy: round(value.realized_risk_proxy)
					}
				])
			),
			method: result.method
		};
	});

	const sidecars = {
		augmentation_heterogeneity: {
			status: 'pilot_sidecar' as V5WorkstreamStatus,
			artifact: AUGMENTATION_FILE,
			coverage_count: augmentationEntries.length,
			median_delta_vs_live: round(
				median(
					augmentationEntries
						.map(entry => entry.delta_vs_live)
						.filter((value): value is number => typeof value === 'number')
				)
			),
			top_positive_shift: topMovers(augmentationEntries, 'positive'),
			top_negative_shift: topMovers(augmentationEntries, 'negative')
		},
		empirical_mobility: {
			status: 'enriched_sidecar' as V5WorkstreamStatus,
			artifact: MOBILITY_FILE,
			coverage_count: mobilityEntries.length,
			observed_enriched_count: mobilityEntries.filter(entry => entry.status === 'observed_enriched')
				.length,
			median_empirical_mobility_score: round(
				median(
					mobilityEntries
						.map(entry => entry.empirical_mobility_score)
						.filter((value): value is number => typeof value === 'number')
				)
			)
		},
		posterior_uncertainty: {
			status: 'pilot_sidecar' as V5WorkstreamStatus,
			artifact: POSTERIOR_FILE,
			coverage_count: posteriorEntries.length,
			median_live_interval_width_80: round(
				median(
					posteriorEntries
						.map(entry =>
							typeof entry.exposure_p90 === 'number' && typeof entry.exposure_p10 === 'number'
								? entry.exposure_p90 - entry.exposure_p10
								: null
						)
						.filter((value): value is number => typeof value === 'number')
				)
			),
			task_adjusted_count: posteriorEntries.filter(
				entry => entry.scoring_basis === 'task_aware_exposure_v43'
			).length
		},
		realized_risk_forecast: {
			status: 'pilot_sidecar' as V5WorkstreamStatus,
			artifact: REALIZED_FILE,
			coverage_count: realizedEntries.length,
			median_realization_scalar: round(
				median(
					realizedEntries
						.map(entry => entry.realization_scalar)
						.filter((value): value is number => typeof value === 'number')
				)
			),
			high_realized_risk_count: realizedEntries.filter(
				entry =>
					typeof entry.base_realized_risk_proxy === 'number' &&
					entry.base_realized_risk_proxy >= 0.25
			).length
		}
	};

	return {
		augmentationEntries,
		mobilityEntries,
		posteriorEntries,
		realizedEntries,
		sidecars
	};
}

function main() {
	const { augmentationEntries, mobilityEntries, posteriorEntries, realizedEntries, sidecars } =
		buildOutputs();
	const generatedAt = new Date().toISOString();
	const baseMetadata = {
		generated_at: generatedAt,
		live_version: DATA_VINTAGE.model_version,
		live_release_date: DATA_VINTAGE.last_updated
	};

	const augmentationArtifact = {
		version: 'V5-augmentation-sidecar',
		...baseMetadata,
		method:
			'workflow_and_archetype_prior_blend_v1 (pilot sidecar, not part of the live headline score)',
		entries: augmentationEntries
	};
	const mobilityArtifact = {
		version: 'V5-empirical-mobility-sidecar',
		...baseMetadata,
		method:
			'hybrid transition mobility score combining observed priors, destination quality, wage preservation, and training ease',
		entries: mobilityEntries
	};
	const posteriorArtifact = {
		version: 'V5-posterior-uncertainty-sidecar',
		...baseMetadata,
		method:
			'latent_source_measurement_v1 over persisted exposure-source percentiles, calibrated against baseline exposure and optionally aligned to task-aware V4.3 evidence',
		entries: posteriorEntries
	};
	const realizedArtifact = {
		version: 'V5-realized-risk-sidecar',
		...baseMetadata,
		method:
			'market-calibrated realized-risk proxy derived from live forecast risk, archetype short-run caps, employer pressure, labour softness, direct posting support where available, transition friction, and offset buffers',
		entries: realizedEntries
	};
	const summaryArtifact = {
		version: 'V5-sidecars',
		...baseMetadata,
		status: 'pilot_sidecars_published',
		summary:
			DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
				? `V5 sidecar workstreams are archived as audit artifacts beneath the live ${DATA_VINTAGE.model_version} headline score.`
				: 'V5 sidecar workstreams are published as audit artifacts without changing the live headline score.',
		sidecars
	};

	for (const [file, payload] of [
		[AUGMENTATION_FILE, augmentationArtifact],
		[MOBILITY_FILE, mobilityArtifact],
		[POSTERIOR_FILE, posteriorArtifact],
		[REALIZED_FILE, realizedArtifact],
		[SUMMARY_FILE, summaryArtifact]
	] as const) {
		writeJson(path.join(DATA_DIR, file), payload);
		writeJson(path.join(SRC_DATA_DIR, file), payload);
		writeJson(path.join(STATIC_DATA_DIR, file), payload);
	}

	console.log(`Built V5 sidecar artifacts at ${STATIC_DATA_DIR}`);
}

main();
