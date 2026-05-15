#!/usr/bin/env bun
/**
 * export-csv.ts — Export the live occupation dataset to a clean CSV file.
 *
 * Run: bun run scripts/export-csv.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OUT_DIR = path.join(import.meta.dir, '..', 'static', 'data');
const IN_FILE = path.join(DATA_DIR, 'occupations.json');

interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	gross_wage_median: number;
	gross_wage_25th: number;
	gross_wage_75th: number;
	estimated_sg_employment_thousands?: number;
	employment_thousands: number;
	employment_basis?: string;
	employment_family_code?: string | null;
	employment_family_total_thousands?: number | null;
	employment_weight_within_family?: number | null;
	employment_estimate_method?:
		| 'bls_wage_blend'
		| 'bls_only'
		| 'wage_only'
		| 'equal_fallback'
		| null;
	bls_proxy_employment?: number;
	data_basis?: {
		employment_estimate?: {
			tier: string;
		};
		wage_pool_proxy?: {
			tier: string;
		};
		education?: {
			tier: string;
		};
	};
	sg_context?: {
		pwm_covered?: boolean;
		licensed_profession?: 'strict' | 'partial' | false;
		foreign_worker_dependency?: 'very_high' | 'high' | 'moderate' | false;
		skillsfuture_eligible?: boolean;
	};
	exposure: number;
	task_signal?: number;
	exposure_v7?: number;
	bottleneck: number;
	displacement_pressure?: number;
	demand_signal_bonus?: number;
	demand_persistence?: number;
	demand_resilience?: number;
	market: {
		market_momentum: number;
		occupation_scarcity: number;
		market_resilience: number;
		market_modifier: number;
	};
	net_risk: number;
	risk_band: string;
	augmentation: number;
	augmentation_band: string;
	impact_type: string;
	profile?: string;
	evidence: {
		anthropic_calibrated: boolean;
		anthropic_gap: number | null;
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
		exposure_blend_strategy?: string;
		exposure_agreement?: string | null;
		exposure_source_count?: number;
		exposure_source_weights?: Record<string, number>;
		signal_conflict?: boolean;
		signal_conflict_reasons?: string[];
	};
	confidence: {
		score: number;
		level: string;
		source_coverage?: number;
		signal_agreement?: number;
		sensitivity?: number;
		exposure_source_count?: number;
	};
	match_quality: string;
	education_label?: string;
	structural_model_version?: string;
	baseline_v6?: {
		exposure: number;
		net_risk: number;
	};
	task_primitives?: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: string | null;
	};
	uncertainty?: {
		exposure_p10: number;
		exposure_p50: number;
		exposure_p90: number;
		net_risk_p10: number;
		net_risk_p50: number;
		net_risk_p90: number;
		method: string;
	};
}

const columns = [
	'ssoc',
	'title',
	'major_group',
	'gross_wage_median',
	'gross_wage_25th',
	'gross_wage_75th',
	'estimated_sg_employment_thousands',
	'employment_thousands',
	'employment_basis',
	'employment_family_code',
	'employment_family_total_thousands',
	'employment_weight_within_family',
	'employment_estimate_method',
	'employment_tier',
	'bls_proxy_employment',
	'wage_pool_proxy_tier',
	'exposure',
	'task_signal',
	'exposure_v7',
	'bottleneck',
	'displacement_pressure',
	'demand_signal_bonus',
	'demand_persistence',
	'demand_resilience',
	'market_resilience',
	'market_modifier',
	'net_risk',
	'risk_band',
	'augmentation',
	'augmentation_band',
	'impact_type',
	'profile',
	'anthropic_calibrated',
	'anthropic_gap',
	'sol_match',
	'jobs_in_demand_match',
	'exposure_blend_strategy',
	'exposure_agreement',
	'exposure_source_count',
	'exposure_source_weights',
	'signal_conflict',
	'signal_conflict_reasons',
	'confidence_level',
	'confidence_score',
	'confidence_source_coverage',
	'confidence_signal_agreement',
	'confidence_sensitivity',
	'structural_model_version',
	'baseline_v6_exposure',
	'baseline_v6_net_risk',
	'task_primitives_matched_task_weight_share',
	'task_primitives_task_effective_coverage',
	'task_primitives_task_exposure_concentration',
	'task_primitives_method',
	'uncertainty_exposure_p10',
	'uncertainty_exposure_p50',
	'uncertainty_exposure_p90',
	'uncertainty_net_risk_p10',
	'uncertainty_net_risk_p50',
	'uncertainty_net_risk_p90',
	'uncertainty_method',
	'match_quality',
	'education_label',
	'education_tier',
	'pwm_covered',
	'licensed_profession',
	'foreign_worker_dependency',
	'skillsfuture_eligible'
];

function escapeCSV(value: string | number | boolean): string {
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function versionTag(version: string): string {
	return version.toLowerCase().replaceAll('.', '');
}

function buildCsv(occupations: Occupation[]): string {
	const rows = occupations.map(o => [
		o.ssoc,
		o.title,
		o.major_group,
		o.gross_wage_median,
		o.gross_wage_25th,
		o.gross_wage_75th,
		o.estimated_sg_employment_thousands ?? o.employment_thousands,
		o.employment_thousands,
		o.employment_basis ?? '',
		o.employment_family_code ?? '',
		o.employment_family_total_thousands ?? '',
		o.employment_weight_within_family?.toFixed(6) ?? '',
		o.employment_estimate_method ?? '',
		o.data_basis?.employment_estimate?.tier ?? '',
		o.bls_proxy_employment ?? '',
		o.data_basis?.wage_pool_proxy?.tier ?? '',
		o.exposure.toFixed(4),
		o.task_signal?.toFixed(4) ?? '',
		o.exposure_v7?.toFixed(4) ?? '',
		o.bottleneck.toFixed(4),
		o.displacement_pressure?.toFixed(4) ?? '',
		o.demand_signal_bonus?.toFixed(4) ?? '',
		o.demand_persistence?.toFixed(4) ?? '',
		o.demand_resilience?.toFixed(4) ?? '',
		o.market.market_resilience.toFixed(4),
		o.market.market_modifier.toFixed(4),
		o.net_risk.toFixed(4),
		o.risk_band,
		o.augmentation.toFixed(4),
		o.augmentation_band,
		o.impact_type,
		o.profile ?? '',
		o.evidence.anthropic_calibrated,
		o.evidence.anthropic_gap ?? '',
		o.evidence.sol_match,
		o.evidence.jobs_in_demand_match,
		o.evidence.exposure_blend_strategy ?? '',
		o.evidence.exposure_agreement ?? '',
		o.evidence.exposure_source_count ?? '',
		Object.entries(o.evidence.exposure_source_weights ?? {})
			.map(([key, value]) => `${key}:${value.toFixed(4)}`)
			.join('|'),
		o.evidence.signal_conflict ?? false,
		(o.evidence.signal_conflict_reasons ?? []).join('|'),
		o.confidence.level,
		o.confidence.score.toFixed(4),
		o.confidence.source_coverage?.toFixed(4) ?? '',
		o.confidence.signal_agreement?.toFixed(4) ?? '',
		o.confidence.sensitivity?.toFixed(4) ?? '',
		o.structural_model_version ?? '',
		o.baseline_v6?.exposure?.toFixed(4) ?? '',
		o.baseline_v6?.net_risk?.toFixed(4) ?? '',
		o.task_primitives?.matched_task_weight_share?.toFixed(4) ?? '',
		o.task_primitives?.task_effective_coverage?.toFixed(4) ?? '',
		o.task_primitives?.task_exposure_concentration?.toFixed(4) ?? '',
		o.task_primitives?.method ?? '',
		o.uncertainty?.exposure_p10?.toFixed(4) ?? '',
		o.uncertainty?.exposure_p50?.toFixed(4) ?? '',
		o.uncertainty?.exposure_p90?.toFixed(4) ?? '',
		o.uncertainty?.net_risk_p10?.toFixed(4) ?? '',
		o.uncertainty?.net_risk_p50?.toFixed(4) ?? '',
		o.uncertainty?.net_risk_p90?.toFixed(4) ?? '',
		o.uncertainty?.method ?? '',
		o.match_quality,
		o.education_label ?? '',
		o.data_basis?.education?.tier ?? '',
		o.sg_context?.pwm_covered ?? false,
		o.sg_context?.licensed_profession ?? '',
		o.sg_context?.foreign_worker_dependency ?? '',
		o.sg_context?.skillsfuture_eligible ?? false
	]);

	return [columns.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const liveOccupations: Occupation[] = JSON.parse(fs.readFileSync(IN_FILE, 'utf-8'));
const liveCsv = buildCsv(liveOccupations);
const liveOutFile = path.join(
	OUT_DIR,
	`sg-ai-occupations-${versionTag(DATA_VINTAGE.model_version)}.csv`
);
fs.writeFileSync(liveOutFile, liveCsv, 'utf-8');

console.log(`Exported ${liveOccupations.length} occupations to ${liveOutFile}`);
