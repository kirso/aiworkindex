#!/usr/bin/env bun
/**
 * export-csv.ts — Export the live occupation dataset and retained historical
 * snapshots to clean CSV files.
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
	bottleneck: number;
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
	structural_risk?: number;
	structural_risk_band?: string;
	transition_adjusted_risk?: number;
	transition_adjusted_band?: string;
	transition_adjusted_impact_type?: string;
	realized_risk_proxy?: number;
	adaptation_capacity?: number;
	adaptation_buffer?: number;
	demand_fragility?: number;
	reallocation_capacity?: number;
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
	scoring_basis?: string;
	baseline_v42?: {
		exposure: number;
		net_risk: number;
		risk_band: string;
		augmentation: number;
		impact_type: string;
	};
	baseline_v43?: {
		exposure: number;
		net_risk: number;
		risk_band: string;
		augmentation: number;
		impact_type: string;
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
	'bottleneck',
	'market_resilience',
	'market_modifier',
	'net_risk',
	'risk_band',
	'augmentation',
	'augmentation_band',
	'impact_type',
	'structural_risk',
	'structural_risk_band',
	'transition_adjusted_risk',
	'transition_adjusted_band',
	'transition_adjusted_impact_type',
	'realized_risk_proxy',
	'adaptation_capacity',
	'adaptation_buffer',
	'demand_fragility',
	'reallocation_capacity',
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
	'scoring_basis',
	'baseline_v42_exposure',
	'baseline_v42_net_risk',
	'baseline_v42_risk_band',
	'baseline_v42_augmentation',
	'baseline_v42_impact_type',
	'baseline_v43_exposure',
	'baseline_v43_net_risk',
	'baseline_v43_risk_band',
	'baseline_v43_augmentation',
	'baseline_v43_impact_type',
	'match_quality',
	'education_label',
	'education_tier',
	'pwm_covered',
	'licensed_profession',
	'foreign_worker_dependency',
	'skillsfuture_eligible'
];

function escapeCSV(value: string | number): string {
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
		o.bottleneck.toFixed(4),
		o.market.market_resilience.toFixed(4),
		o.market.market_modifier.toFixed(4),
		o.net_risk.toFixed(4),
		o.risk_band,
		o.augmentation.toFixed(4),
		o.augmentation_band,
		o.impact_type,
		o.structural_risk?.toFixed(4) ?? '',
		o.structural_risk_band ?? '',
		o.transition_adjusted_risk?.toFixed(4) ?? '',
		o.transition_adjusted_band ?? '',
		o.transition_adjusted_impact_type ?? '',
		o.realized_risk_proxy?.toFixed(4) ?? '',
		o.adaptation_capacity?.toFixed(4) ?? '',
		o.adaptation_buffer?.toFixed(4) ?? '',
		o.demand_fragility?.toFixed(4) ?? '',
		o.reallocation_capacity?.toFixed(4) ?? '',
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
		o.scoring_basis ?? '',
		o.baseline_v42?.exposure?.toFixed(4) ?? '',
		o.baseline_v42?.net_risk?.toFixed(4) ?? '',
		o.baseline_v42?.risk_band ?? '',
		o.baseline_v42?.augmentation?.toFixed(4) ?? '',
		o.baseline_v42?.impact_type ?? '',
		o.baseline_v43?.exposure?.toFixed(4) ?? '',
		o.baseline_v43?.net_risk?.toFixed(4) ?? '',
		o.baseline_v43?.risk_band ?? '',
		o.baseline_v43?.augmentation?.toFixed(4) ?? '',
		o.baseline_v43?.impact_type ?? '',
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

for (const entry of fs.readdirSync(DATA_DIR)) {
	const match = entry.match(/^occupations-(v\d+(?:\.\d+)?)\.json$/i);
	if (!match) continue;
	const occupations: Occupation[] = JSON.parse(
		fs.readFileSync(path.join(DATA_DIR, entry), 'utf-8')
	);
	fs.writeFileSync(
		path.join(OUT_DIR, `sg-ai-occupations-${match[1]!.toLowerCase().replaceAll('.', '')}.csv`),
		buildCsv(occupations),
		'utf-8'
	);
}

console.log(`Exported ${liveOccupations.length} occupations to ${liveOutFile}`);
