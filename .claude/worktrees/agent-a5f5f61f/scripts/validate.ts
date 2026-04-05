#!/usr/bin/env bun
/**
 * validate.ts — Regression and anchor checks for the current scoring model.
 *
 * Run: bun run scripts/validate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
	DATA_VINTAGE,
	RISK_BAND_THRESHOLDS,
	classifyImpactType,
	getRiskBand
} from '../src/lib/data/scoring-constants';
import { dataSourceRegistry } from '../src/lib/data/data-contract';
import type { ImpactType, RiskBand } from '../src/lib/data/index';

const DATA_FILE = path.join(import.meta.dir, '..', 'data', 'occupations.json');
const MONITOR_FILE = path.join(import.meta.dir, '..', 'data', 'labour-monitor.json');
const QUARTERLY_REPORT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'quarterly-report.json'
);
const POSTINGS_MONITOR_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'postings-monitor.json'
);
const EMPLOYER_SIGNALS_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'employer-signals.json'
);
const POSTINGS_SOURCE_REGISTRY_FILE = path.join(
	import.meta.dir,
	'..',
	'data',
	'postings',
	'source-registry.json'
);
const POSTINGS_RAW_DIR = path.join(import.meta.dir, '..', 'data', 'postings', 'raw');
const SITE_STATUS_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'site-status.json');
const RELEASES_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'releases.json');
const CURRENT_BACKTEST_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'backtests',
	'current-validation.json'
);
const BLS_BACKTEST_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'backtests',
	'bls-crosswalk-validation.json'
);
const MULTI_PERIOD_BACKTEST_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'backtests',
	'multi-period-validation.json'
);
const CALIBRATION_DIAGNOSTICS_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'backtests',
	'calibration-diagnostics.json'
);
const OCCUPATION_FAMILY_VALIDATION_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'backtests',
	'occupation-family-validation.json'
);
const RELEASE_MANIFEST_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'release-manifest.json'
);
const EXPERIMENTAL_METHODOLOGY_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'experimental-methodology-v43.json'
);
const TRANSITION_SUPPORT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'transition-support.json'
);
const RAW_DATA_AUDIT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'raw-data-audit.json'
);
const ONET_ENRICHMENT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'onet-enrichment.json'
);
const OFFSET_POTENTIAL_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'offset-potential.json'
);
const INDUSTRY_CONTEXT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'industry-context.json'
);
const CLAIMS_MATRIX_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'claims-matrix.json'
);
const RESEARCH_LIBRARY_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'research-library.json'
);
const V5_SIDECARS_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'v5-sidecars.json');
const V5_AUGMENTATION_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-augmentation-heterogeneity.json'
);
const V5_MOBILITY_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-empirical-mobility.json'
);
const V5_POSTERIOR_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-posterior-uncertainty.json'
);
const V5_REALIZED_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-realized-risk.json'
);
const V5_EXPERIMENTAL_MODEL_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-experimental-model.json'
);
const V5_EXPERIMENTAL_VALIDATION_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'v5-experimental-validation.json'
);
const SHADOW_SCORES_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'shadow-scores-v43.json'
);
const SHADOW_COMPARISON_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'shadow-comparison-v43.json'
);
const SHADOW_VALIDATION_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'shadow-validation-v43.json'
);
const SHADOW_ANCHOR_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'shadow-anchor-review-v43.json'
);

const ACTIVE_VERSION_SURFACES = [
	path.join(import.meta.dir, '..', 'src', 'routes', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', '+layout.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'changelog', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'reports', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'reports', 'v4-3-shadow', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'reports', 'v5-experimental', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'reports', 'v5-roadmap', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'data', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'methodology', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'occupation', '[ssoc]', '+page.svelte'),
	path.join(import.meta.dir, '..', 'src', 'routes', 'role', '[slug]', '+page.svelte')
];

const FORBIDDEN_ACTIVE_COPY = [
	'This should become the next official monitor refresh',
	'Next obvious refresh',
	'most recent curated official signal',
	'Q4 2025 advance release'
];

interface Occupation {
	ssoc: string;
	title: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	estimated_sg_employment_thousands?: number;
	employment_thousands: number;
	employment_family_code?: string | null;
	employment_family_total_thousands?: number | null;
	employment_weight_within_family?: number | null;
	employment_estimate_method?: 'bls_wage_blend' | 'bls_only' | 'wage_only' | 'equal_fallback' | null;
	education_label?: string;
	sg_context?: {
		pwm_covered: boolean;
		licensed_profession: 'strict' | 'partial' | false;
		foreign_worker_dependency: 'very_high' | 'high' | 'moderate' | false;
		skillsfuture_eligible: boolean;
	};
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	impact_type: ImpactType;
	market: {
		market_momentum: number;
		occupation_scarcity: number;
		market_resilience: number;
		market_modifier: number;
	};
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
		threshold_level?: 'high' | 'medium' | 'low';
		policy_cap_reason?:
			| 'insufficient_source_count'
			| 'fallback_mapping'
			| 'major_fallback_mapping'
			| 'signal_conflict'
			| null;
		exposure_source_count?: number;
		source_coverage?: number;
		signal_agreement?: number;
		sensitivity?: number;
	};
	evidence: {
		anthropic_calibrated: boolean;
		anthropic_gap: number | null;
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
		exposure_blend_strategy?: string;
		exposure_agreement?: string | null;
		exposure_source_count?: number;
		exposure_source_keys?: string[];
		exposure_source_weights?: Record<string, number>;
		exposure_source_pctiles?: Record<string, number>;
		signal_conflict?: boolean;
		signal_conflict_reasons?: string[];
	};
	stability: {
		label: 'stable' | 'watch' | 'sensitive';
	};
	task_primitives: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: 'anthropic_task_penetration_v1' | null;
	};
	uncertainty: {
		exposure_p10: number;
		exposure_p50: number;
		exposure_p90: number;
		net_risk_p10: number;
		net_risk_p50: number;
		net_risk_p90: number;
		method: 'bootstrap_v1' | 'bootstrap_v1_task_adjusted' | 'latent_source_measurement_v1';
	};
	structural_model_version?: 'V4.2' | 'V4.3' | 'V5';
	scoring_basis?:
		| 'ensemble_fallback_v42'
		| 'task_aware_exposure_v43'
		| 'posterior_task_aware_v5'
		| 'posterior_ensemble_fallback_v5';
	baseline_v42?: {
		structural_model_version?: 'V4.2';
		net_risk: number;
	};
	baseline_v43?: {
		structural_model_version?: 'V4.3';
		net_risk: number;
	};
	structural_risk?: number;
	transition_adjusted_risk?: number;
	realized_risk_proxy?: number;
	labour_monitor_key: string | null;
	workflow_overlay?: {
		creative_generation: number;
		real_time_coordination: number;
		ambiguity_tolerance: number;
		institutional_knowledge: number;
		relationship_intensity: number;
		regulatory_weight: number;
		physical_presence: number;
		tool_velocity: number;
	};
}

interface LabourClusterMonitor {
	cluster_key: string;
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: number;
		recent_quarters: Array<{ quarter: string; rate: number }>;
		qoq_delta_pp?: number;
		latest_count?: number;
		count_qoq_delta?: number;
	};
	hiring?: {
		recruitment_delta_pp?: number;
		resignation_delta_pp?: number;
	};
	retrenchment?: {
		qoq_delta_count?: number;
	};
	re_entry?: {
		rate_6m_delta_pp?: number;
		rate_12m_delta_pp?: number;
	};
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	data_as_of: string;
}

async function main() {
	console.log('=== Validation Report ===\n');

	if (!fs.existsSync(DATA_FILE)) {
		console.error(`ERROR: ${DATA_FILE} not found. Run score.ts first.`);
		process.exit(1);
	}

	if (!fs.existsSync(MONITOR_FILE)) {
		console.error(`ERROR: ${MONITOR_FILE} not found. Run scripts/build-labour-monitor.ts first.`);
		process.exit(1);
	}

	const data: Occupation[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
	const labourMonitors: LabourClusterMonitor[] = JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf-8'));
	const labourMonitorByKey = new Map(labourMonitors.map(monitor => [monitor.cluster_key, monitor]));
	const isLiveV5 = DATA_VINTAGE.model_version === 'V5';

	let passed = 0;
	let failed = 0;
	let warnings = 0;

	function check(name: string, condition: boolean, detail?: string) {
		if (condition) {
			console.log(`  PASS: ${name}`);
			passed++;
		} else {
			console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
			failed++;
		}
	}

	function warn(name: string, detail: string) {
		console.log(`  WARN: ${name} — ${detail}`);
		warnings++;
	}

	function find(pattern: RegExp): Occupation | undefined {
		return data.find(row => pattern.test(row.title));
	}

	function readJson<T>(filePath: string): T | null {
		if (!fs.existsSync(filePath)) return null;
		return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
	}

	function getLabourMonitor(row: Occupation): LabourClusterMonitor | null {
		if (!row.labour_monitor_key) return null;
		return labourMonitorByKey.get(row.labour_monitor_key) ?? null;
	}

	console.log('--- Record counts ---');
	check('Total occupations = 562', data.length === 562, `got ${data.length}`);

	console.log('\n--- Completeness ---');
	check(
		'All occupations have current core fields',
		data.every(
			row =>
				typeof row.estimated_sg_employment_thousands === 'number' &&
				typeof row.employment_thousands === 'number' &&
				row.estimated_sg_employment_thousands === row.employment_thousands &&
				typeof row.employment_family_code === 'string' &&
				typeof row.employment_family_total_thousands === 'number' &&
				typeof row.employment_weight_within_family === 'number' &&
				typeof row.employment_estimate_method === 'string' &&
				typeof row.education_label === 'string' &&
				typeof row.sg_context?.pwm_covered === 'boolean' &&
				'skillsfuture_eligible' in (row.sg_context ?? {}) &&
				typeof row.exposure === 'number' &&
				typeof row.bottleneck === 'number' &&
				typeof row.net_risk === 'number' &&
				typeof row.augmentation === 'number' &&
				!!row.market &&
				!!row.confidence &&
				!!row.evidence &&
				!!row.stability &&
				!!row.task_primitives &&
				!!row.uncertainty
		)
	);
	check(
		'All occupations have labour monitor coverage',
		data.every(row => getLabourMonitor(row))
	);

	console.log('\n--- Coverage ---');
	const direct = data.filter(row => row.match_quality === 'direct').length;
	const submajor = data.filter(row => row.match_quality === 'submajor_fallback').length;
	const major = data.filter(row => row.match_quality === 'major_fallback').length;
	check(
		'Direct crosswalk coverage > 90%',
		direct / data.length > 0.9,
		`${direct}/${data.length} direct`
	);
	console.log(
		`       Direct: ${direct}, Sub-major fallback: ${submajor}, Major fallback: ${major}`
	);

	const anthropicCount = data.filter(row => row.evidence.anthropic_calibrated).length;
	const demandFlagged = data.filter(
		row => row.evidence.sol_match || row.evidence.jobs_in_demand_match
	).length;
	check(
		'Anthropic calibration covers most occupations',
		anthropicCount > 450,
		`${anthropicCount} calibrated`
	);
	check(
		'Official demand signals cover a meaningful subset',
		demandFlagged >= 50,
		`${demandFlagged} flagged`
	);
	check(
		'Exposure source coverage metadata is populated',
		data.every(
			row =>
				typeof row.evidence.exposure_source_count === 'number' &&
				typeof row.confidence.exposure_source_count === 'number' &&
				row.evidence.exposure_source_count === row.confidence.exposure_source_count
		)
	);
	check(
		'Exposure blend strategy is populated',
		data.every(row => row.evidence.exposure_blend_strategy === 'reliability_weighted')
	);
	check(
		'Exposure source weights sum to ~1',
		data.every(row => {
			const weights = Object.values(row.evidence.exposure_source_weights ?? {});
			if (weights.length === 0) return false;
			const total = weights.reduce((sum, value) => sum + value, 0);
			return Math.abs(total - 1) <= 0.001;
		})
	);
	check(
		'Exposure source percentiles are persisted for matched ensemble sources',
		data.every(row => {
			const sourceKeys = row.evidence.exposure_source_keys ?? [];
			const pctiles = row.evidence.exposure_source_pctiles ?? {};
			return sourceKeys.every(sourceKey => typeof pctiles[sourceKey] === 'number');
		})
	);
	check(
		'Uncertainty intervals are ordered',
		data.every(
			row =>
				row.uncertainty.exposure_p10 <= row.uncertainty.exposure_p50 &&
				row.uncertainty.exposure_p50 <= row.uncertainty.exposure_p90 &&
				row.uncertainty.net_risk_p10 <= row.uncertainty.net_risk_p50 &&
				row.uncertainty.net_risk_p50 <= row.uncertainty.net_risk_p90
		)
	);
	check(
		'Task primitive fields are explicit nulls or bounded values',
		data.every(row => {
			const taskPrimitives = row.task_primitives;
			const values = [
				taskPrimitives.matched_task_weight_share,
				taskPrimitives.task_effective_coverage,
				taskPrimitives.task_exposure_concentration
			];
			return values.every(value => value === null || (value >= 0 && value <= 1));
		})
	);

	console.log('\n--- Distribution sanity ---');
	const bandCounts: Record<RiskBand, number> = {
		very_low: 0,
		low: 0,
		moderate: 0,
		high: 0,
		very_high: 0
	};
	const impactCounts: Record<ImpactType, number> = {
		at_risk: 0,
		ai_leveraged: 0,
		stable: 0,
		mixed: 0
	};
	const confidenceCounts = { high: 0, medium: 0, low: 0 };
	const stabilityCounts = { stable: 0, watch: 0, sensitive: 0 };

	for (const row of data) {
		bandCounts[row.risk_band]++;
		impactCounts[row.impact_type]++;
		confidenceCounts[row.confidence.level]++;
		stabilityCounts[row.stability.label]++;
	}

	check(
		'Every risk band is populated',
		Object.values(bandCounts).every(count => count > 0)
	);
	check(
		'Stored risk bands match stored net_risk thresholds',
		data.every(row => getRiskBand(row.net_risk) === row.risk_band)
	);

	check(
		'Stored impact types match recomputed classification',
		data.every(row => classifyImpactType(row.net_risk, row.augmentation) === row.impact_type)
	);
	check(
		'At Risk and Augmented occupations both exist',
		impactCounts.at_risk > 0 && impactCounts.ai_leveraged > 0
	);
	check(
		'Confidence has at least two populated tiers',
		[confidenceCounts.high, confidenceCounts.medium, confidenceCounts.low].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(confidenceCounts)
	);
	check(
		'Confidence components stay within 0-1',
		data.every(row => {
			const values = [
				row.confidence.score,
				row.confidence.source_coverage,
				row.confidence.signal_agreement,
				row.confidence.sensitivity
			].filter((value): value is number => typeof value === 'number');
			return values.every(value => value >= 0 && value <= 1);
		})
	);
	check(
		'Confidence threshold metadata is populated',
		data.every(
			row =>
				row.confidence.threshold_level === 'high' ||
				row.confidence.threshold_level === 'medium' ||
				row.confidence.threshold_level === 'low'
		)
	);
	check(
		'Confidence caps are explicitly explained when level differs from threshold',
		data.every(row => {
			const thresholdLevel = row.confidence.threshold_level ?? row.confidence.level;
			if (row.confidence.level === thresholdLevel) {
				return row.confidence.policy_cap_reason == null;
			}
			return typeof row.confidence.policy_cap_reason === 'string';
		})
	);
	check(
		'At least one occupation is marked as contested',
		data.some(row => row.evidence.signal_conflict === true)
	);
	check(
		'Pure exposure divergence does not trigger contested state by itself',
		data.every(row => {
			const reasons = row.evidence.signal_conflict_reasons ?? [];
			if (reasons.length !== 1 || reasons[0] !== 'divergent_exposure_sources') return true;
			return row.evidence.signal_conflict !== true;
		})
	);
	check(
		'Low confidence remains possible for sparse evidence cases',
		data.some(row => row.confidence.level === 'low')
	);
	check(
		'High confidence is reserved for direct, clean, multi-source cases',
		data
			.filter(row => row.confidence.level === 'high')
			.every(
				row =>
					row.match_quality === 'direct' &&
					(row.confidence.exposure_source_count ?? 0) >= 3 &&
					row.evidence.signal_conflict !== true
			)
	);
	check(
		'Fallback mappings never present as high confidence',
		data.filter(row => row.match_quality !== 'direct').every(row => row.confidence.level !== 'high')
	);
	check(
		'Contested occupations never present as high confidence',
		data
			.filter(row => row.evidence.signal_conflict === true)
			.every(row => row.confidence.level !== 'high')
	);
	check(
		'Stability has at least two populated tiers',
		[stabilityCounts.stable, stabilityCounts.watch, stabilityCounts.sensitive].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(stabilityCounts)
	);

	console.log(`       Bands: ${JSON.stringify(bandCounts)}`);
	console.log(`       Impact: ${JSON.stringify(impactCounts)}`);
	console.log(`       Confidence: ${JSON.stringify(confidenceCounts)}`);
	console.log(`       Stability: ${JSON.stringify(stabilityCounts)}`);

	console.log('\n--- Anchor occupations ---');
	const software = find(/software developer/i);
	const dataEntry = find(/data entry clerk/i);
	const surgeon = find(/surgeon/i);
	const telemarketer = find(/telemarketer/i);
	const nurse = find(/registered nurse/i);
	const dataScientist = find(/data scientist/i);

	check('Software developer exists', !!software);
	check(
		'Software developer is a direct crosswalk',
		!!software && software.match_quality === 'direct'
	);
	check(
		'Software developer is not classified At Risk',
		!!software && software.impact_type !== 'at_risk'
	);
	check(
		'Software developer has official demand evidence',
		!!software && !!(software.evidence.sol_match || software.evidence.jobs_in_demand_match)
	);
	check(
		'Software developer is not Very High risk',
		!!software && software.risk_band !== 'very_high'
	);

	check('Data entry clerk exists', !!dataEntry);
	check('Data entry clerk is high displacement', !!dataEntry && dataEntry.net_risk >= 0.25);
	check('Data entry clerk is At Risk', !!dataEntry && dataEntry.impact_type === 'at_risk');

	check('Surgeon exists', !!surgeon);
	check('Surgeon is very low risk', !!surgeon && surgeon.net_risk < 0.1);
	check(
		'Surgeon is low risk (Augmented or Stable)',
		!!surgeon && ['ai_leveraged', 'stable'].includes(surgeon.impact_type)
	);

	check('Telemarketer exists', !!telemarketer);
	check('Telemarketer remains highly exposed', !!telemarketer && telemarketer.exposure > 0.7);
	check('Telemarketer is At Risk', !!telemarketer && telemarketer.impact_type === 'at_risk');

	check('Registered nurse exists', !!nurse);
	check('Registered nurse is low risk', !!nurse && nurse.net_risk < 0.15);
	check(
		'Registered nurse remains non-displacement-led',
		!!nurse && nurse.impact_type !== 'at_risk'
	);

	check('Data scientist exists', !!dataScientist);
	check(
		'Data scientist has official demand evidence',
		!!dataScientist &&
			!!(dataScientist.evidence.sol_match || dataScientist.evidence.jobs_in_demand_match)
	);
	check(
		'Data scientist is not classified Stable',
		!!dataScientist && dataScientist.impact_type !== 'stable'
	);

	console.log('\n--- Labour monitor sanity ---');
	const staleMonitor = data.find(row => {
		const monitor = getLabourMonitor(row);
		return (monitor?.vacancy.recent_quarters.length ?? 0) < 4;
	});
	check(
		'Labour monitor has recent quarters for all occupations',
		!staleMonitor,
		staleMonitor?.title
	);
	const labourSignals = {
		strong: data.filter(row => getLabourMonitor(row)?.overall === 'strong').length,
		moderate: data.filter(row => getLabourMonitor(row)?.overall === 'moderate').length,
		weak: data.filter(row => getLabourMonitor(row)?.overall === 'weak').length,
		deteriorating: data.filter(row => getLabourMonitor(row)?.overall === 'deteriorating').length
	};
	check(
		'Labour monitor overall signals present',
		Object.values(labourSignals).some(count => count > 0),
		JSON.stringify(labourSignals)
	);

	console.log('\n--- Synthetic role validation ---');
	try {
		const { computeRoleScores, syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		const { occupationsBySSoc } = await import('../src/lib/data');
		check('Synthetic roles defined', syntheticRoles.length > 0);
		const roleScores = syntheticRoles.map(role => computeRoleScores(role, occupationsBySSoc));
		check(
			'All synthetic roles compute without errors',
			roleScores.length === syntheticRoles.length
		);
		check(
			'Synthetic roles include workflow context',
			roleScores.every(
				role =>
					role.workflow_overlay !== null &&
					role.workflow_scores !== null &&
					role.workflow_narrative !== null
			)
		);
		check(
			'High-context synthetic roles remain conservative',
			roleScores
				.filter(role => role.estimate_type !== 'modern_role')
				.every(
					role =>
						role.confidence !== 'high' &&
						role.context_adjustment >= 0.85 &&
						role.context_adjustment <= 1.15
				)
		);
	} catch (error) {
		check('All synthetic roles compute without errors', false, String(error));
	}

	console.log('\n--- Role taxonomy validation ---');
	try {
		const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		const taxonomy = await import('../src/lib/data/role-taxonomy');
		check(
			'Taxonomy covers all synthetic roles',
			syntheticRoles.every(role => taxonomy.getRoleCategory(role.slug) !== null)
		);
	} catch (error) {
		warn('Taxonomy validation', `Could not import: ${error}`);
	}

	console.log('\n--- Alias SSOC validation ---');
	try {
		const { jobAliases } = await import('../src/lib/data/aliases');
		const aliasEntries = Object.values(jobAliases).flat();
		const validSSOCs = new Set(data.map(row => row.ssoc));
		const invalidAliases = aliasEntries.filter(ssoc => !validSSOCs.has(ssoc));
		check(
			'All alias SSOC codes exist in occupations data',
			invalidAliases.length === 0,
			invalidAliases.length > 0 ? invalidAliases.join(', ') : undefined
		);
	} catch (error) {
		warn('Alias SSOC validation', `Could not import: ${error}`);
	}

	console.log('\n--- Archetype classification validation ---');
	try {
		const { classifyArchetype } = await import('../src/lib/data/role-archetypes');
		const professional = data.filter(
			row =>
				row.major_group === 'PROFESSIONALS' || row.major_group === 'MANAGERS AND ADMINISTRATORS'
		);
		const fieldManualMisclassified = professional.filter(row => {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			return archetype === 'field_manual';
		});
		check(
			'No professional/manager occupation gets field_manual archetype',
			fieldManualMisclassified.length === 0,
			fieldManualMisclassified.length > 0
				? fieldManualMisclassified
						.slice(0, 3)
						.map(row => row.title)
						.join('; ')
				: undefined
		);

		const archetypeCounts = new Map<string, number>();
		for (const row of data) {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			archetypeCounts.set(archetype, (archetypeCounts.get(archetype) ?? 0) + 1);
		}
		check(
			'Every archetype has at least 3 occupations',
			Array.from(archetypeCounts.values()).every(count => count >= 3),
			JSON.stringify(Object.fromEntries(archetypeCounts))
		);
	} catch (error) {
		warn('Archetype validation', `Could not import: ${error}`);
	}

	console.log('\n--- Context modifier validation ---');
	try {
		const contextModule = await import('../src/lib/data/role-context-modifiers');
		const valid = contextModule.validateContextModifiers?.();
		if (valid === undefined) {
			warn('Context modifiers', 'validateContextModifiers() not exported');
		} else {
			check('All context modifiers valid', valid);
		}
	} catch {
		console.log('  INFO: Context modifiers module not shipped; skipping optional validation');
	}

	console.log('\n--- Workflow overlay validation ---');
	try {
		const { archetypeOverlayDefaults } = await import('../src/lib/data/workflow-overlay');
		const { classifyArchetype } = await import('../src/lib/data/role-archetypes');
		const missingOverlay = data.find(row => {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			return archetypeOverlayDefaults[archetype] == null;
		});
		check('Workflow overlay defaults cover all archetypes', !missingOverlay, missingOverlay?.title);
		const validOverlay = data.every(row => {
			const overlay = row.workflow_overlay;
			return (
				!overlay ||
				(typeof overlay.creative_generation === 'number' &&
					typeof overlay.real_time_coordination === 'number' &&
					typeof overlay.ambiguity_tolerance === 'number' &&
					typeof overlay.institutional_knowledge === 'number' &&
					typeof overlay.relationship_intensity === 'number' &&
					typeof overlay.regulatory_weight === 'number' &&
					typeof overlay.physical_presence === 'number' &&
					typeof overlay.tool_velocity === 'number')
			);
		});
		check('All workflow overlays valid', validOverlay);
		check(
			'Regulated archetypes do not publish implausibly low regulatory weight',
			data.every(row => {
				const overlay = row.workflow_overlay;
				if (!overlay) return true;
				const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
				if (['finance_investing', 'legal_compliance', 'healthcare_clinical'].includes(archetype)) {
					return overlay.regulatory_weight >= 0.4;
				}
				return true;
			})
		);
	} catch (error) {
		warn('Workflow overlay validation', `Could not import: ${error}`);
	}

	console.log('\n--- Transition capacity validation ---');
	try {
		const { computeTransitionScore } = await import('../src/lib/data/transition-capacity');
		if (software && dataScientist) {
			const transition = computeTransitionScore(software as never, dataScientist as never);
			check(
				'Transition score computes',
				typeof transition.composite === 'number' &&
					transition.composite >= 0 &&
					transition.composite <= 1
			);
			check(
				'Transition has valid label',
				['easy', 'moderate', 'stretch', 'difficult'].includes(transition.label)
			);
		}
	} catch (error) {
		warn('Transition capacity validation', `Could not import: ${error}`);
	}

	console.log('\n--- Data vintage & consistency ---');
	try {
		const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		const siteStatus = readJson<{
			structural_release: { version: string; release_manifest: string };
			experimental_release: {
				version: string;
				status:
					| 'blocked'
					| 'not_ready'
					| 'ready_for_shadow_scoring'
					| 'shadow_published'
					| 'promoted';
				artifact: string;
				headline_promotion_ready: boolean;
				median_direct_matched_task_weight_share: number | null;
			} | null;
			v5_program?: {
				status: string;
				experimental_model_published?: boolean;
				structural_validation_result?: string | null;
				realized_validation_result?: string | null;
				transition_band_flip_count?: number | null;
				impact_flip_count?: number | null;
			} | null;
			live_monitor: {
				labour_monitor_artifact_vintage: string;
				labour_monitor_validation_vintage?: string;
				postings_volume_30d?: number;
				temporal_validation_vacancy_accuracy?: number;
				temporal_validation_vacancy_periods?: number;
				temporal_validation_hiring_accuracy?: number;
				temporal_validation_hiring_periods?: number;
				calibration_direct_rho?: number | null;
				calibration_direct_sample?: number | null;
				calibration_high_medium_rho?: number | null;
				calibration_high_medium_sample?: number | null;
				calibration_low_confidence_sample?: number | null;
				occupation_family_validation_rho?: number | null;
				occupation_family_validation_family_count?: number | null;
				occupation_family_validation_significant?: boolean | null;
				offset_potential_generated_at?: string | null;
				offset_potential_high_count?: number | null;
				latest_official_labour_report: { label: string; url: string };
			};
			homepage_banner: { title: string; body: string };
		}>(SITE_STATUS_FILE);
		const releases = readJson<
			Array<{
				id: string;
				type: string;
				version_label?: string;
				score_version: string;
				monitor_vintage: string;
				display_date?: string | null;
				published_at?: string | null;
			}>
		>(RELEASES_FILE);
		const quarterlyReport = readJson<{
			labour_monitor?: {
				data_as_of: string;
				clusters: Array<{
					cluster_key: string;
					vacancy_qoq_delta_pp: number | null;
				}>;
			};
			briefing?: {
				what_changed: string[];
				why_it_matters: string[];
				what_to_watch: string[];
			};
		}>(QUARTERLY_REPORT_FILE);
		const postingsMonitor = readJson<{
			generated_at: string;
			sources?: Array<{ source: string; source_tier: string }>;
			summary?: { salary_min_hint?: number | null; posting_volume_30d?: number | null };
		}>(POSTINGS_MONITOR_FILE);
		const currentBacktest = readJson<{
			data_period: string;
			summary?: { checks_passed: number; checks_total: number };
		}>(CURRENT_BACKTEST_FILE);
		const blsBacktest = readJson<{
			sample_size: number;
			spearman_rho: number;
		}>(BLS_BACKTEST_FILE);
		const multiPeriodBacktest = readJson<{
			metrics?: {
				vacancy_rate_yoy?: {
					summary?: { period_count: number; avg_pairwise_accuracy: number };
				};
				vacancy_count_yoy?: {
					summary?: { period_count: number; avg_pairwise_accuracy: number };
				};
				annual_hiring_net?: {
					summary?: { period_count: number; avg_pairwise_accuracy: number };
				};
			};
		}>(MULTI_PERIOD_BACKTEST_FILE);
		const calibrationDiagnostics = readJson<{
			segments?: {
				by_match_quality?: {
					direct?: {
						sample_size: number;
						spearman_rho: number | null;
						p_value_below_01: boolean | null;
						share_of_matched_sample: number;
					};
				};
				by_confidence_level?: {
					high_or_medium?: {
						sample_size: number;
						spearman_rho: number | null;
						p_value_below_01: boolean | null;
						share_of_matched_sample: number;
					};
					low?: { sample_size: number; share_of_matched_sample: number };
				};
			};
		}>(CALIBRATION_DIAGNOSTICS_FILE);
		const occupationFamilyValidation = readJson<{
			family_count: number;
			spearman_rho: number;
			negative_direction: boolean;
		}>(OCCUPATION_FAMILY_VALIDATION_FILE);
		const postingsRawFiles = fs.existsSync(POSTINGS_RAW_DIR)
			? fs.readdirSync(POSTINGS_RAW_DIR).filter(file => file.endsWith('.json'))
			: [];
		const rawPostings = postingsRawFiles.flatMap(
			file =>
				readJson<
					Array<{
						source: string;
						location: string | null;
						skills: string[];
						ai_tools_mentioned: string[];
					}>
				>(path.join(POSTINGS_RAW_DIR, file)) ?? []
		);
		const employerSignals = readJson<{
			generated_at: string;
			summary?: { total_signals: number; latest_signal_date: string | null };
			by_archetype?: Record<string, { pressure_score: number; signal_count: number }>;
			by_sector?: Record<string, { pressure_score: number; signal_count: number }>;
		}>(EMPLOYER_SIGNALS_FILE);
		const releaseManifest = readJson<{ version: string; artifacts: Array<{ file: string }> }>(
			RELEASE_MANIFEST_FILE
		);
		const experimentalMethodology = readJson<{
			version: string;
			shadow_readiness: {
				status:
					| 'blocked'
					| 'not_ready'
					| 'ready_for_shadow_scoring'
					| 'shadow_published'
					| 'promoted';
			};
			shadow_score_published: boolean;
			headline_promotion_ready: boolean;
			shadow_artifacts?: {
				shadow_scores: string;
				shadow_validation: string;
				shadow_anchor_review: string;
			} | null;
			coverage?: {
				median_direct_matched_task_weight_share?: number | null;
			};
			required_inputs?: {
				onet_task_ratings?: { present: boolean };
			};
			promotion_gates?: Array<{
				key: string;
				state: 'pass' | 'fail' | 'blocked' | 'pending';
				actual: string | number | null;
			}>;
		}>(EXPERIMENTAL_METHODOLOGY_FILE);
		const researchLibrary = readJson<{
			entries?: Array<{ key: string; source_keys: string[]; claim_ids: string[] }>;
		}>(RESEARCH_LIBRARY_FILE);
		const v5Sidecars = readJson<{
			status: string;
			sidecars?: Record<string, { status: string; artifact: string; coverage_count: number }>;
		}>(V5_SIDECARS_FILE);
		const v5Augmentation = readJson<{
			entries?: Array<{
				heterogeneous_augmentation_proxy: number;
				workflow_augmentation_readiness: number;
			}>;
		}>(V5_AUGMENTATION_FILE);
		const v5Mobility = readJson<{
			entries?: Array<{
				status: string;
				observed_transition_coverage: number;
				empirical_mobility_score: number;
			}>;
		}>(V5_MOBILITY_FILE);
		const v5Posterior = readJson<{
			entries?: Array<{
				exposure_p025: number;
				exposure_p10: number;
				exposure_p50: number;
				exposure_p90: number;
				exposure_p975: number;
				net_risk_p025: number;
				net_risk_p10: number;
				net_risk_p50: number;
				net_risk_p90: number;
				net_risk_p975: number;
				sources_used_count: number;
			}>;
		}>(V5_POSTERIOR_FILE);
		const v5Realized = readJson<{
			entries?: Array<{
				structural_risk: number;
				base_near_term_risk: number;
				base_realized_risk_proxy: number;
				realization_scalar: number;
			}>;
		}>(V5_REALIZED_FILE);
		const v5ExperimentalModel = readJson<{
			entries?: Array<{
				structural_basis: string;
				live_risk_band: string;
				live_impact_type: string;
				v5_structural_risk_p10: number;
				v5_structural_risk: number;
				v5_structural_risk_p90: number;
				v5_heterogeneous_augmentation: number;
				v5_empirical_mobility: number;
				v5_adaptation_capacity: number;
				v5_adaptation_buffer: number;
				v5_transition_adjusted_risk: number;
				v5_realized_risk_proxy: number;
				v5_transition_adjusted_band: string;
				v5_impact_type: string;
				v5_profile: string;
			}>;
		}>(V5_EXPERIMENTAL_MODEL_FILE);
		const v5ExperimentalValidation = readJson<{
			status: string;
			comparison_baseline_version?: string;
			summary?: {
				occupation_count: number;
				structural_basis_counts: Record<string, number>;
				profile_counts: Record<string, number>;
				transition_band_flip_count: number;
				impact_flip_count: number;
				task_mode_blended_count: number;
				realized_pass_count: number;
				realized_scorable_check_count: number;
			};
			structural_validation?: {
				bls_spearman_rho?: { live: number; experimental: number; pass: boolean };
				occupation_family_spearman_rho?: { live: number; experimental: number; pass: boolean };
			};
			realized_validation?: {
				vacancy_trend_rho?: { experimental: number; pass: boolean; scorable?: boolean };
				hiring_net_pressure_rho?: { experimental: number; pass: boolean; scorable?: boolean };
				retrenchment_incidence_rho?: { experimental: number; pass: boolean; scorable?: boolean };
				employer_pressure_rho?: { experimental: number; pass: boolean; sample_size?: number };
				postings_support_rho?: { experimental: number; pass: boolean; sample_size?: number };
			};
		}>(V5_EXPERIMENTAL_VALIDATION_FILE);
		const shadowScores = readJson<
			Array<{
				ssoc: string;
				shadow_net_risk: number;
				baseline_net_risk: number;
				shadow_eligibility_status: string;
				delta_vs_v42: number;
			}>
		>(SHADOW_SCORES_FILE);
		const shadowComparison = readJson<{
			occupation_count: number;
			task_native_count: number;
			validation_pass_count: number;
			validation_total: number;
			anchor_review_summary?: { found_anchor_count: number; review_candidate_count: number };
		}>(SHADOW_COMPARISON_FILE);
		const shadowValidation = readJson<{
			cluster_directional_accuracy: { pass: boolean };
			bls_spearman_rho: { pass: boolean };
			occupation_family_spearman_rho: { pass: boolean };
		}>(SHADOW_VALIDATION_FILE);
		const shadowAnchorReview = readJson<{
			required_anchor_count: number;
			found_anchor_count: number;
			review_candidate_count: number;
		}>(SHADOW_ANCHOR_FILE);
		const transitionSupport = readJson<{
			transitions: Array<{
				from_ssoc: string;
				official_programme_support: {
					support_tier: string;
					recommended_programmes: string[];
					jtm_sector_alignment?: string[];
					wsq_training_reference?: {
						latest_year: string | null;
						total_trainees_latest: number | null;
					} | null;
				};
				top_overall: Array<{
					observed_transition_rate?: number | null;
					observed_source?: string | null;
					observed_vintage?: string | null;
				}>;
			}>;
		}>(TRANSITION_SUPPORT_FILE);
		const industryContext = readJson<{
			metadata?: {
				employment_vintage?: string;
				vacancy_overlay_vintage?: string;
				vacancy_overlay_source_note?: string;
			};
			groups?: Record<
				string,
				{
					top_industries?: Array<{
						vacancy_share_latest?: number | null;
						vacancy_rank_latest?: number | null;
						vacancy_signal?: string | null;
					}>;
				}
			>;
		}>(INDUSTRY_CONTEXT_FILE);
		const rawDataAudit = readJson<{
			entries?: Array<{
				key: string;
				status: 'valid' | 'placeholder_error' | 'missing' | 'reference_only';
				exists: boolean;
			}>;
		}>(RAW_DATA_AUDIT_FILE);
		const claimsMatrix = readJson<{
			claims?: Array<{
				id: string;
				source_keys: string[];
				research_keys: string[];
			}>;
		}>(CLAIMS_MATRIX_FILE);
		const onetEnrichment = readJson<
			Array<{
				ssoc: string;
				tasks: string[];
				technologies: Array<{ name: string; hot: boolean }>;
			}>
		>(ONET_ENRICHMENT_FILE);
		const offsetPotential = readJson<{
			entries?: Array<{
				ssoc: string;
				band: 'low' | 'medium' | 'high';
				score: number;
				components: {
					demand_persistence: number;
					transition_support: number;
					reallocation_room: number;
					mobility_friction: number;
				};
			}>;
		}>(OFFSET_POTENTIAL_FILE);
		const packageJson = readJson<{ scripts?: Record<string, string> }>(
			path.join(import.meta.dir, '..', 'package.json')
		);
		const postingsSourceRegistry = readJson<
			Array<{
				source_type: 'greenhouse' | 'lever' | 'ashby';
				board_token: string;
				employer: string;
				active?: boolean;
			}>
		>(POSTINGS_SOURCE_REGISTRY_FILE);
		const activePostingsSources = (postingsSourceRegistry ?? []).filter(
			entry => entry.active !== false
		);

		check(
			'DATA_VINTAGE.occupation_count matches actual data',
			DATA_VINTAGE.occupation_count === data.length,
			`constant=${DATA_VINTAGE.occupation_count}, actual=${data.length}`
		);
		check(
			'DATA_VINTAGE.role_count matches actual synthetic roles',
			DATA_VINTAGE.role_count === syntheticRoles.length,
			`constant=${DATA_VINTAGE.role_count}, actual=${syntheticRoles.length}`
		);
		check(
			'Risk band moderate upper = 0.30',
			RISK_BAND_THRESHOLDS.moderate.upper === 0.3,
			String(RISK_BAND_THRESHOLDS.moderate.upper)
		);
		check(
			'Risk band high upper = 0.50',
			RISK_BAND_THRESHOLDS.high.upper === 0.5,
			String(RISK_BAND_THRESHOLDS.high.upper)
		);
		const lastUpdated = new Date(DATA_VINTAGE.last_updated);
		const today = new Date();
		const daysOld = Math.floor((today.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
		check('Data vintage is fresh (<= 1 day old)', daysOld <= 1, `${daysOld} days old`);
		check('Site status artifact exists', siteStatus !== null);
		check(
			'Site status structural version matches DATA_VINTAGE',
			siteStatus?.structural_release.version === DATA_VINTAGE.model_version,
			siteStatus?.structural_release.version
		);
		check('Experimental methodology artifact exists', experimentalMethodology !== null);
		check(
			'Site status includes experimental release summary',
			siteStatus?.experimental_release?.artifact === 'experimental-methodology-v43.json',
			siteStatus?.experimental_release?.artifact
		);
		check(
			'Experimental release version is V4.3-shadow',
			experimentalMethodology?.version === 'V4.3-shadow' &&
				siteStatus?.experimental_release?.version === 'V4.3-shadow',
			`${experimentalMethodology?.version} / ${siteStatus?.experimental_release?.version}`
		);
		check(
			'Experimental release shadow publication state matches site status',
			experimentalMethodology?.shadow_score_published ===
				(siteStatus?.experimental_release?.status === 'shadow_published' ||
					siteStatus?.experimental_release?.status === 'promoted')
		);
		check(
			'Experimental release status matches published shadow state and task-weight availability',
			experimentalMethodology?.shadow_score_published === true
				? DATA_VINTAGE.model_version === 'V4.3' || DATA_VINTAGE.model_version === 'V5'
					? experimentalMethodology?.shadow_readiness.status === 'promoted'
					: experimentalMethodology?.shadow_readiness.status === 'shadow_published'
				: experimentalMethodology?.required_inputs?.onet_task_ratings?.present === false
					? experimentalMethodology.shadow_readiness.status === 'blocked'
					: (experimentalMethodology?.coverage?.median_direct_matched_task_weight_share ?? 0) >= 0.6
						? experimentalMethodology?.shadow_readiness.status === 'ready_for_shadow_scoring'
						: experimentalMethodology?.shadow_readiness.status === 'not_ready',
			experimentalMethodology?.shadow_readiness.status
		);
		check(
			'Experimental release promotion-ready flag matches site status',
			experimentalMethodology?.headline_promotion_ready ===
				siteStatus?.experimental_release?.headline_promotion_ready
		);
		check(
			'Experimental methodology publishes shadow artifact paths when shadow score exists',
			experimentalMethodology?.shadow_score_published === true
				? experimentalMethodology?.shadow_artifacts?.shadow_scores ===
						'data/shadow-scores-v43.json' &&
						experimentalMethodology?.shadow_artifacts?.shadow_validation ===
							'data/shadow-validation-v43.json' &&
						experimentalMethodology?.shadow_artifacts?.shadow_anchor_review ===
							'data/shadow-anchor-review-v43.json'
				: experimentalMethodology?.shadow_artifacts === null
		);
		check(
			'Site status monitor vintage matches DATA_VINTAGE',
			siteStatus?.live_monitor.labour_monitor_artifact_vintage === DATA_VINTAGE.labour_monitor,
			siteStatus?.live_monitor.labour_monitor_artifact_vintage
		);
		check(
			'Site status postings volume matches postings monitor',
			siteStatus?.live_monitor?.postings_volume_30d ===
				(postingsMonitor?.summary?.posting_volume_30d ?? 0),
			`${siteStatus?.live_monitor?.postings_volume_30d} vs ${postingsMonitor?.summary?.posting_volume_30d}`
		);
		check(
			'Releases history exists and preserves full structural lineage',
			(releases?.length ?? 0) >= 8 &&
				['V5', 'V4.3', 'V4.2', 'V4.0', 'V3.3', 'V3.2', 'V3.1', 'V3.0', 'V2', 'V1'].every(
					versionLabel => (releases ?? []).some(release => release.version_label === versionLabel)
				),
			releases
				? JSON.stringify(releases.map(release => release.version_label ?? release.type))
				: undefined
		);
		check(
			'Releases history keeps exact dates or explicit display dates for historical entries',
			(releases ?? []).every(release => !!release.display_date || !!release.published_at)
		);
		check(
			'Releases history includes the V4.3 shadow trail',
			(releases ?? []).some(
				release =>
					release.type === 'experimental_update' &&
					release.href === '/reports/v4-3-shadow' &&
					(release.label === 'V4.3 shadow score published' ||
						release.label === 'V4.3 shadow model promoted')
			)
		);
		check(
			'Releases history includes the V5 sidecar publication note',
			(releases ?? []).some(
				release =>
					release.type === 'experimental_update' &&
					release.href === '/reports/v5-roadmap' &&
					release.label === 'V5 sidecars published'
			)
		);
		check(
			'Releases history includes the V5 experimental-model note',
			(releases ?? []).some(
				release =>
					release.type === 'experimental_update' &&
					release.href === '/reports/v5-experimental' &&
					(isLiveV5
						? release.label === 'V5 model promoted'
						: release.label === 'V5 experimental model published')
			)
		);
		check(
			'Release manifest includes governance, research, and shadow artifacts',
			(releaseManifest?.artifacts ?? []).some(artifact => artifact.file === 'site-status.json') &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'experimental-methodology-v43.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(artifact => artifact.file === 'releases.json') &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'research-library.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(artifact => artifact.file === 'v5-roadmap.json') &&
				(releaseManifest?.artifacts ?? []).some(artifact => artifact.file === 'v5-sidecars.json') &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-augmentation-heterogeneity.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-empirical-mobility.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-posterior-uncertainty.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-realized-risk.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-experimental-model.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'v5-experimental-validation.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'shadow-scores-v43.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'shadow-comparison-v43.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'shadow-validation-v43.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'shadow-anchor-review-v43.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'sg-offset-potential-v4.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'backtests/calibration-diagnostics.json'
				) &&
				(releaseManifest?.artifacts ?? []).some(
					artifact => artifact.file === 'backtests/occupation-family-validation.json'
				)
		);
		check(
			'Experimental direct task-share summary matches occupation data when present',
			(() => {
				const directTaskShares = data
					.filter(row => row.match_quality === 'direct')
					.map(row => row.task_primitives.matched_task_weight_share)
					.filter((value): value is number => value !== null)
					.sort((a, b) => a - b);
				if (directTaskShares.length === 0) {
					return (
						experimentalMethodology?.coverage?.median_direct_matched_task_weight_share === null
					);
				}
				const midpoint = Math.floor(directTaskShares.length / 2);
				const median =
					directTaskShares.length % 2 === 1
						? directTaskShares[midpoint]
						: (directTaskShares[midpoint - 1] + directTaskShares[midpoint]) / 2;
				return (
					Math.abs(
						(experimentalMethodology?.coverage?.median_direct_matched_task_weight_share ?? 0) -
							median
					) <= 0.0001
				);
			})(),
			String(experimentalMethodology?.coverage?.median_direct_matched_task_weight_share ?? null)
		);
		check(
			'V5 sidecar summary artifact exists and publishes four workstreams',
			v5Sidecars?.status === 'pilot_sidecars_published' &&
				Object.keys(v5Sidecars.sidecars ?? {}).length === 4
		);
		check(
			'V5 augmentation sidecar covers all occupations and stays bounded',
			(v5Augmentation?.entries?.length ?? 0) === data.length &&
				(v5Augmentation?.entries ?? []).every(
					entry =>
						entry.heterogeneous_augmentation_proxy >= 0 &&
						entry.heterogeneous_augmentation_proxy <= 1 &&
						entry.workflow_augmentation_readiness >= 0 &&
						entry.workflow_augmentation_readiness <= 1
				)
		);
		check(
			'V5 empirical mobility sidecar publishes observed enrichment cleanly',
			(v5Mobility?.entries?.length ?? 0) === data.length &&
				(v5Mobility?.entries ?? []).some(entry => entry.status === 'observed_enriched') &&
				(v5Mobility?.entries ?? []).every(
					entry =>
						entry.observed_transition_coverage >= 0 &&
						entry.observed_transition_coverage <= 1 &&
						entry.destination_quality_score >= 0 &&
						entry.destination_quality_score <= 1 &&
						entry.wage_preservation_score >= 0 &&
						entry.wage_preservation_score <= 1 &&
						entry.training_ease_score >= 0 &&
						entry.training_ease_score <= 1 &&
						(entry.observed_signal_strength === null ||
							(entry.observed_signal_strength >= 0 && entry.observed_signal_strength <= 1)) &&
						entry.empirical_mobility_score >= 0 &&
						entry.empirical_mobility_score <= 1
				)
		);
		check(
			'V5 posterior uncertainty sidecar stays ordered and fully populated',
			(v5Posterior?.entries?.length ?? 0) === data.length &&
				(v5Posterior?.entries ?? []).every(
					entry =>
						entry.sources_used_count >= 1 &&
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
		check(
			'V5 realized-risk sidecar remains conservative relative to structural and near-term risk',
			(v5Realized?.entries?.length ?? 0) === data.length &&
				(v5Realized?.entries ?? []).every(
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
		check(
			'V5 experimental model exists, covers all occupations, and preserves ordered risk layers',
			(v5ExperimentalModel?.entries?.length ?? 0) === data.length &&
				(v5ExperimentalModel?.entries ?? []).every(
					entry =>
						entry.v5_structural_exposure_p10 <= entry.v5_structural_exposure &&
						entry.v5_structural_exposure <= entry.v5_structural_exposure_p90 &&
						entry.task_mode_blend_weight >= 0 &&
						entry.task_mode_blend_weight <= 0.45 &&
						(entry.task_mode_matched_task_weight_share === null ||
							(entry.task_mode_matched_task_weight_share >= 0 &&
								entry.task_mode_matched_task_weight_share <= 1)) &&
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
		check(
			'V5 experimental validation summary matches the published model artifact',
			(v5ExperimentalValidation?.summary?.occupation_count ?? -1) ===
				(v5ExperimentalModel?.entries?.length ?? -2) &&
				(v5ExperimentalValidation?.summary?.task_mode_blended_count ?? -1) ===
					(v5ExperimentalModel?.entries ?? []).filter(entry => entry.task_mode_blend_weight > 0)
						.length &&
				(v5ExperimentalValidation?.summary?.transition_band_flip_count ?? -1) ===
					(v5ExperimentalModel?.entries ?? []).filter(
						entry => entry.live_risk_band !== entry.v5_transition_adjusted_band
					).length &&
				(v5ExperimentalValidation?.summary?.impact_flip_count ?? -1) ===
					(v5ExperimentalModel?.entries ?? []).filter(
						entry => entry.live_impact_type !== entry.v5_impact_type
					).length
		);
		check(
			'V5 experimental validation publishes both structural and realized-risk families',
			(isLiveV5
				? v5ExperimentalValidation?.status === 'promoted_live' &&
					v5ExperimentalValidation?.comparison_baseline_version === 'V4.3'
				: v5ExperimentalValidation?.status === 'experimental_only') &&
				typeof v5ExperimentalValidation?.structural_validation?.bls_spearman_rho?.experimental ===
					'number' &&
				typeof v5ExperimentalValidation?.structural_validation?.occupation_family_spearman_rho
					?.experimental === 'number' &&
				typeof v5ExperimentalValidation?.realized_validation?.vacancy_trend_rho?.experimental ===
					'number' &&
				typeof v5ExperimentalValidation?.realized_validation?.hiring_net_pressure_rho
					?.experimental === 'number' &&
				typeof v5ExperimentalValidation?.realized_validation?.retrenchment_incidence_rho
					?.experimental === 'number' &&
				typeof v5ExperimentalValidation?.realized_validation?.employer_pressure_rho
					?.experimental === 'number' &&
				typeof v5ExperimentalValidation?.realized_validation?.postings_support_rho?.experimental ===
					'number' &&
				typeof v5ExperimentalValidation?.summary?.realized_pass_count === 'number' &&
				typeof v5ExperimentalValidation?.summary?.realized_scorable_check_count === 'number'
		);
		check(
			'Site status exposes the V5 experimental-program state',
			!!siteStatus?.v5_program &&
				siteStatus.v5_program.experimental_model_published === true &&
				(isLiveV5
					? siteStatus.v5_program.status === 'promoted_live'
					: siteStatus.v5_program.status === 'experimental_model_published') &&
				typeof siteStatus.v5_program.structural_validation_result === 'string' &&
				typeof siteStatus.v5_program.realized_validation_result === 'string'
		);
		check(
			'Research library artifact exists',
			(researchLibrary?.entries?.length ?? 0) >= 10,
			String(researchLibrary?.entries?.length ?? 0)
		);
		check(
			'Claims matrix research keys resolve against the research library',
			(claimsMatrix?.claims ?? []).every(claim =>
				(claim.research_keys ?? []).every(researchKey =>
					(researchLibrary?.entries ?? []).some(entry => entry.key === researchKey)
				)
			)
		);
		check(
			'Source registry research keys resolve against the research library',
			dataSourceRegistry.every(entry =>
				(entry.research_keys ?? []).every(researchKey =>
					(researchLibrary?.entries ?? []).some(researchEntry => researchEntry.key === researchKey)
				)
			)
		);
		check(
			'Research library references current claims and source keys cleanly',
			(researchLibrary?.entries ?? []).every(
				entry =>
					entry.source_keys.every(sourceKey =>
						dataSourceRegistry.some(sourceEntry => sourceEntry.key === sourceKey)
					) &&
					entry.claim_ids.every(claimId =>
						(claimsMatrix?.claims ?? []).some(claim => claim.id === claimId)
					)
			)
		);
		check(
			'Shadow score artifacts exist and cover every occupation',
			(shadowScores?.length ?? 0) === data.length &&
				shadowComparison?.occupation_count === data.length,
			`${shadowScores?.length ?? 0} / ${shadowComparison?.occupation_count ?? 0}`
		);
		check(
			'Shadow scores include meaningful task-native coverage',
			(shadowScores ?? []).filter(row => row.shadow_eligibility_status === 'task_native').length >=
				450,
			String(
				(shadowScores ?? []).filter(row => row.shadow_eligibility_status === 'task_native').length
			)
		);
		check(
			'Shadow validation and anchor-review artifacts exist',
			shadowValidation !== null && shadowAnchorReview !== null
		);
		check(
			'Shadow comparison validation counts match the validation artifact',
			(shadowComparison?.validation_pass_count ?? -1) ===
				[
					shadowValidation?.cluster_directional_accuracy.pass,
					shadowValidation?.bls_spearman_rho.pass,
					shadowValidation?.occupation_family_spearman_rho.pass
				].filter(Boolean).length
		);
		check(
			'Shadow anchor review covers the required anchor set',
			shadowAnchorReview?.found_anchor_count === shadowAnchorReview?.required_anchor_count,
			`${shadowAnchorReview?.found_anchor_count ?? 0}/${shadowAnchorReview?.required_anchor_count ?? 0}`
		);
		check(
			'build:release-data regenerates shadow and research artifacts',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes(
				'scripts/build-shadow-scores-v43.ts'
			) &&
				(packageJson?.scripts?.['build:release-data'] ?? '').includes(
					'scripts/build-research-library.ts'
				)
		);
		check(
			'Active surfaces do not hardcode stale MOM Q3 2025 labels',
			ACTIVE_VERSION_SURFACES.every(
				filePath => !fs.readFileSync(filePath, 'utf-8').includes('MOM Q3 2025')
			)
		);
		check(
			'Active surfaces do not describe Q4 2025 as a pending monitor refresh',
			ACTIVE_VERSION_SURFACES.every(filePath => {
				const content = fs.readFileSync(filePath, 'utf-8');
				return FORBIDDEN_ACTIVE_COPY.every(pattern => !content.includes(pattern));
			})
		);
		if (
			DATA_VINTAGE.labour_monitor === 'Q4 2025 full' &&
			industryContext?.metadata?.vacancy_overlay_vintage &&
			industryContext.metadata.vacancy_overlay_vintage !== 'Q4 2025'
		) {
			check(
				'Detail pages disclose that industry vacancy overlays lag the main labour monitor',
				[
					path.join(import.meta.dir, '..', 'src', 'routes', 'occupation', '[ssoc]', '+page.svelte'),
					path.join(import.meta.dir, '..', 'src', 'routes', 'role', '[slug]', '+page.svelte')
				].every(filePath =>
					fs
						.readFileSync(filePath, 'utf-8')
						.includes('Industry vacancy overlays use the latest published detailed cross-tab')
				)
			);
		}
		check('Current cluster backtest artifact exists', currentBacktest !== null);
		check('BLS crosswalk validation artifact exists', blsBacktest !== null);
		check('Multi-period validation artifact exists', multiPeriodBacktest !== null);
		check('Calibration diagnostics artifact exists', calibrationDiagnostics !== null);
		check('Occupation-family validation artifact exists', occupationFamilyValidation !== null);
		check('Quarterly report artifact exists', quarterlyReport !== null);
		check('Postings monitor artifact exists', postingsMonitor !== null);
		check('Employer pressure artifact exists', employerSignals !== null);
		check('Transition support artifact exists', transitionSupport !== null);
		check('Offset potential artifact exists', offsetPotential !== null);
		check('Industry context artifact exists', industryContext !== null);
		check('Raw data audit artifact exists', rawDataAudit !== null);
		check('O*NET enrichment artifact exists', onetEnrichment !== null);
		check('Claims matrix artifact exists', claimsMatrix !== null);
		check(
			'Industry context carries vacancy-overlay metadata',
			typeof industryContext?.metadata?.vacancy_overlay_vintage === 'string' &&
				typeof industryContext?.metadata?.vacancy_overlay_source_note === 'string'
		);
		check(
			'Industry context carries detailed vacancy rank/share fields',
			Object.values(industryContext?.groups ?? {}).some(group =>
				(group.top_industries ?? []).some(
					item =>
						typeof item.vacancy_share_latest === 'number' &&
						typeof item.vacancy_rank_latest === 'number'
				)
			)
		);
		check(
			'Industry context groups remain populated',
			Object.keys(industryContext?.groups ?? {}).length >= 8,
			String(Object.keys(industryContext?.groups ?? {}).length)
		);
		check(
			'Raw data audit tracks the Singapore occupations base feed as valid',
			rawDataAudit?.entries?.some(
				entry =>
					entry.key === 'sg_occupations_complete_2024' &&
					entry.status === 'valid' &&
					entry.exists === true
			) === true
		);
		check(
			'Raw data audit tracks O*NET task ratings as valid after ingestion',
			rawDataAudit?.entries?.some(
				entry =>
					entry.key === 'onet_task_ratings' && entry.status === 'valid' && entry.exists === true
			) === true
		);
		check(
			'Raw data audit tracks empirical mobility as valid after ingestion',
			rawDataAudit?.entries?.some(
				entry =>
					entry.key === 'sg_empirical_mobility' && entry.status === 'valid' && entry.exists === true
			) === true
		);
		check(
			'O*NET enrichment covers a meaningful share of occupations',
			(onetEnrichment ?? []).filter(
				entry => entry.tasks.length > 0 || entry.technologies.length > 0
			).length >= 250,
			String(
				(onetEnrichment ?? []).filter(
					entry => entry.tasks.length > 0 || entry.technologies.length > 0
				).length
			)
		);
		check(
			'build:release-data regenerates O*NET enrichment',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes('scripts/enrich-onet.ts')
		);
		check(
			'build:release-data regenerates empirical mobility',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes(
				'scripts/build-empirical-mobility.ts'
			)
		);
		check(
			'build:release-data regenerates offset potential',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes(
				'scripts/build-offset-potential.ts'
			)
		);
		check(
			'Claims matrix source keys resolve against the published source registry',
			(claimsMatrix?.claims ?? []).every(claim =>
				claim.source_keys.every(sourceKey =>
					dataSourceRegistry.some(entry => entry.key === sourceKey)
				)
			)
		);
		check(
			'Transition support covers all occupations',
			(transitionSupport?.transitions?.length ?? 0) === data.length,
			String(transitionSupport?.transitions?.length ?? 0)
		);
		check(
			'Transition support includes stronger official programme tiers beyond general public support',
			(transitionSupport?.transitions ?? []).some(
				row => row.official_programme_support.support_tier !== 'general_public_support'
			)
		);
		check(
			'Transition support includes JTM-aligned sectors for a meaningful subset',
			(transitionSupport?.transitions ?? []).filter(
				row => (row.official_programme_support.jtm_sector_alignment?.length ?? 0) > 0
			).length >= 50
		);
		check(
			'Transition support carries WSQ training references',
			(transitionSupport?.transitions ?? []).some(
				row =>
					(row.official_programme_support.wsq_training_reference?.total_trainees_latest ?? 0) > 0
			)
		);
		check(
			'Transition support publishes observed mobility priors when the empirical source exists',
			rawDataAudit?.entries?.some(
				entry =>
					entry.key === 'sg_empirical_mobility' && entry.status === 'valid' && entry.exists === true
			) === true
				? (transitionSupport?.transitions ?? []).some(row =>
						(row.top_overall ?? []).some(
							transition =>
								typeof transition.observed_transition_rate === 'number' &&
								transition.observed_transition_rate > 0 &&
								typeof transition.observed_source === 'string' &&
								typeof transition.observed_vintage === 'string'
						)
					)
				: true
		);
		check(
			'Transition infrastructure exposes latest WSQ attainment mix',
			readJson<{
				wsq_training?: {
					statement_attainment_latest_year?: string;
					statement_attainment_shares_latest?: Array<{ label: string; share: number | null }>;
				};
			}>(
				path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'transition-infrastructure.json')
			)?.wsq_training?.statement_attainment_shares_latest?.some(
				entry => typeof entry.share === 'number' && entry.share > 0
			) === true
		);
		check(
			'Offset potential covers all occupations',
			(offsetPotential?.entries?.length ?? 0) === data.length,
			String(offsetPotential?.entries?.length ?? 0)
		);
		check(
			'Offset potential has meaningful band spread',
			(() => {
				const counts = (offsetPotential?.entries ?? []).reduce(
					(acc, entry) => {
						acc[entry.band] += 1;
						return acc;
					},
					{ low: 0, medium: 0, high: 0 }
				);
				return counts.low > 0 && counts.medium > 0 && counts.high > 0;
			})()
		);
		check(
			'Offset potential component scores stay within 0-1',
			(offsetPotential?.entries ?? []).every(entry =>
				Object.values(entry.components).every(value => value >= 0 && value <= 1)
			)
		);
		check(
			'Site status mirrors offset-potential summary',
			siteStatus?.live_monitor?.offset_potential_high_count ===
				(offsetPotential?.entries ?? []).filter(entry => entry.band === 'high').length,
			`${siteStatus?.live_monitor?.offset_potential_high_count} vs ${
				(offsetPotential?.entries ?? []).filter(entry => entry.band === 'high').length
			}`
		);
		check(
			'Employer pressure includes meaningful signal coverage',
			(employerSignals?.summary?.total_signals ?? 0) >= 8,
			String(employerSignals?.summary?.total_signals ?? 0)
		);
		check(
			'Employer pressure spans multiple sectors',
			Object.keys(employerSignals?.by_sector ?? {}).length >= 5,
			String(Object.keys(employerSignals?.by_sector ?? {}).length)
		);
		check(
			'Employer pressure spans multiple archetypes',
			Object.keys(employerSignals?.by_archetype ?? {}).length >= 5,
			String(Object.keys(employerSignals?.by_archetype ?? {}).length)
		);
		check(
			'Postings source registry exists with ATS sources',
			activePostingsSources.length >= 3 &&
				new Set(activePostingsSources.map(entry => entry.source_type)).size >= 3
		);
		check(
			'Postings raw snapshots exist for active sources',
			postingsRawFiles.some(file => file.startsWith('mycareersfuture-')) &&
				postingsRawFiles.some(file => file.startsWith('greenhouse-')) &&
				postingsRawFiles.some(file => file.startsWith('lever-')) &&
				postingsRawFiles.some(file => file.startsWith('ashby-'))
		);
		check(
			'Postings monitor source tiers stay truthful',
			(postingsMonitor?.sources ?? []).every(source => {
				if (source.source === 'mycareersfuture') {
					return source.source_tier === 'official_sg_job_portal';
				}
				return source.source_tier === 'employer_career_site';
			})
		);
		check(
			'ATS raw postings stay Singapore-only by location',
			rawPostings
				.filter(posting => posting.source !== 'mycareersfuture')
				.every(posting =>
					typeof posting.location === 'string'
						? /singapore|sg - singapore|sg, singapore/i.test(posting.location)
						: false
				)
		);
		const atsPostings = rawPostings.filter(posting => posting.source !== 'mycareersfuture');
		const atsWithSkills = atsPostings.filter(posting => (posting.skills?.length ?? 0) > 0).length;
		check(
			'ATS postings extract skills for a meaningful share',
			atsPostings.length > 0 && atsWithSkills / atsPostings.length >= 0.6,
			`${atsWithSkills}/${atsPostings.length}`
		);
		check(
			'Postings salary hints ignore tiny placeholder values',
			(postingsMonitor?.summary?.salary_min_hint ?? 0) >= 1000
		);
		check(
			'build:release-data regenerates postings monitor',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes(
				'scripts/pipelines/normalize-postings.ts'
			)
		);
		check(
			'build:release-data regenerates validation artifacts',
			(packageJson?.scripts?.['build:release-data'] ?? '').includes('scripts/backtest.ts') &&
				(packageJson?.scripts?.['build:release-data'] ?? '').includes(
					'scripts/backtest-multi-period.ts'
				) &&
				(packageJson?.scripts?.['build:release-data'] ?? '').includes(
					'scripts/backtest-occupation-families.ts'
				) &&
				(packageJson?.scripts?.['build:release-data'] ?? '').includes(
					'scripts/validate-bls-crosswalk.ts'
				) &&
				(packageJson?.scripts?.['build:release-data'] ?? '').includes(
					'scripts/build-calibration-diagnostics.ts'
				)
		);
		if (DATA_VINTAGE.labour_monitor === 'Q4 2025 full') {
			check(
				'Labour monitor latest quarter is Q4 2025 for all clusters',
				labourMonitors.every(monitor => monitor.vacancy.latest_quarter === '2025 Q4')
			);
			check(
				'Labour monitor exposes Q3→Q4 delta fields',
				labourMonitors.every(
					monitor =>
						typeof monitor.vacancy.qoq_delta_pp === 'number' &&
						typeof monitor.vacancy.count_qoq_delta === 'number' &&
						typeof monitor.hiring?.recruitment_delta_pp === 'number' &&
						typeof monitor.hiring?.resignation_delta_pp === 'number' &&
						typeof monitor.retrenchment?.qoq_delta_count === 'number' &&
						typeof monitor.re_entry?.rate_6m_delta_pp === 'number' &&
						typeof monitor.re_entry?.rate_12m_delta_pp === 'number'
				)
			);
			check(
				'Quarterly report includes labour monitor delta summary',
				(quarterlyReport?.labour_monitor?.clusters?.length ?? 0) === labourMonitors.length &&
					quarterlyReport?.labour_monitor?.data_as_of === '2025 Q4' &&
					(quarterlyReport?.labour_monitor?.clusters ?? []).every(
						cluster => typeof cluster.vacancy_qoq_delta_pp === 'number'
					)
			);
			check(
				'Quarterly report includes generated briefing narrative',
				(quarterlyReport?.briefing?.what_changed?.length ?? 0) >= 2 &&
					(quarterlyReport?.briefing?.why_it_matters?.length ?? 0) >= 1 &&
					(quarterlyReport?.briefing?.what_to_watch?.length ?? 0) >= 2
			);
			check(
				'Current cluster backtest uses Q4 2025 monitor data',
				currentBacktest?.data_period === 'Q4 2025',
				currentBacktest?.data_period
			);
			check(
				'Site status validation vintage matches current cluster backtest',
				siteStatus?.live_monitor?.labour_monitor_validation_vintage ===
					currentBacktest?.data_period,
				`${siteStatus?.live_monitor?.labour_monitor_validation_vintage} vs ${currentBacktest?.data_period}`
			);
			check(
				'Multi-period vacancy validation covers multiple periods',
				(multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.period_count ?? 0) >= 2 &&
					(multiPeriodBacktest?.metrics?.vacancy_count_yoy?.summary?.period_count ?? 0) >= 2
			);
			check(
				'Site status temporal vacancy validation matches artifact',
				siteStatus?.live_monitor?.temporal_validation_vacancy_accuracy ===
					(multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.avg_pairwise_accuracy ??
						null) &&
					siteStatus?.live_monitor?.temporal_validation_vacancy_periods ===
						(multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.period_count ?? null),
				`${siteStatus?.live_monitor?.temporal_validation_vacancy_accuracy} vs ${multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.avg_pairwise_accuracy}`
			);
			check(
				'Site status temporal hiring validation matches artifact',
				siteStatus?.live_monitor?.temporal_validation_hiring_accuracy ===
					(multiPeriodBacktest?.metrics?.annual_hiring_net?.summary?.avg_pairwise_accuracy ??
						null) &&
					siteStatus?.live_monitor?.temporal_validation_hiring_periods ===
						(multiPeriodBacktest?.metrics?.annual_hiring_net?.summary?.period_count ?? null),
				`${siteStatus?.live_monitor?.temporal_validation_hiring_accuracy} vs ${multiPeriodBacktest?.metrics?.annual_hiring_net?.summary?.avg_pairwise_accuracy}`
			);
			check(
				'Calibration diagnostics direct segment covers most matched sample',
				(calibrationDiagnostics?.segments?.by_match_quality?.direct?.share_of_matched_sample ?? 0) >
					0.85,
				String(
					calibrationDiagnostics?.segments?.by_match_quality?.direct?.share_of_matched_sample ?? 0
				)
			);
			check(
				'Calibration diagnostics direct segment remains significantly negative',
				calibrationDiagnostics?.segments?.by_match_quality?.direct?.spearman_rho != null &&
					(calibrationDiagnostics?.segments?.by_match_quality?.direct?.spearman_rho ?? 0) < 0 &&
					calibrationDiagnostics?.segments?.by_match_quality?.direct?.p_value_below_01 === true,
				JSON.stringify(calibrationDiagnostics?.segments?.by_match_quality?.direct)
			);
			check(
				'Calibration diagnostics high/medium confidence segment remains significantly negative',
				calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.spearman_rho !=
					null &&
					(calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.spearman_rho ??
						0) < 0 &&
					calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium
						?.p_value_below_01 === true,
				JSON.stringify(calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium)
			);
			check(
				'Low confidence segment remains intentionally small',
				(calibrationDiagnostics?.segments?.by_confidence_level?.low?.share_of_matched_sample ?? 1) <
					0.05,
				String(
					calibrationDiagnostics?.segments?.by_confidence_level?.low?.share_of_matched_sample ?? 1
				)
			);
			check(
				'Site status calibration summary matches diagnostics artifact',
				siteStatus?.live_monitor?.calibration_direct_rho ===
					(calibrationDiagnostics?.segments?.by_match_quality?.direct?.spearman_rho ?? null) &&
					siteStatus?.live_monitor?.calibration_direct_sample ===
						(calibrationDiagnostics?.segments?.by_match_quality?.direct?.sample_size ?? null) &&
					siteStatus?.live_monitor?.calibration_high_medium_rho ===
						(calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.spearman_rho ??
							null) &&
					siteStatus?.live_monitor?.calibration_high_medium_sample ===
						(calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.sample_size ??
							null) &&
					siteStatus?.live_monitor?.calibration_low_confidence_sample ===
						(calibrationDiagnostics?.segments?.by_confidence_level?.low?.sample_size ?? null),
				JSON.stringify({
					siteStatus: {
						direct: siteStatus?.live_monitor?.calibration_direct_rho,
						highMedium: siteStatus?.live_monitor?.calibration_high_medium_rho,
						lowSample: siteStatus?.live_monitor?.calibration_low_confidence_sample
					},
					artifact: {
						direct: calibrationDiagnostics?.segments?.by_match_quality?.direct?.spearman_rho,
						highMedium:
							calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.spearman_rho,
						lowSample: calibrationDiagnostics?.segments?.by_confidence_level?.low?.sample_size
					}
				})
			);
			check(
				'Occupation-family validation covers a meaningful number of families',
				(occupationFamilyValidation?.family_count ?? 0) >= 20,
				String(occupationFamilyValidation?.family_count ?? 0)
			);
			check(
				'Occupation-family validation remains directionally negative',
				occupationFamilyValidation?.negative_direction === true &&
					(occupationFamilyValidation?.spearman_rho ?? 0) < 0,
				JSON.stringify(occupationFamilyValidation)
			);
			check(
				'Site status occupation-family summary matches artifact',
				siteStatus?.live_monitor?.occupation_family_validation_rho ===
					(occupationFamilyValidation?.spearman_rho ?? null) &&
					siteStatus?.live_monitor?.occupation_family_validation_family_count ===
						(occupationFamilyValidation?.family_count ?? null),
				JSON.stringify({
					siteStatus: {
						rho: siteStatus?.live_monitor?.occupation_family_validation_rho,
						count: siteStatus?.live_monitor?.occupation_family_validation_family_count
					},
					artifact: {
						rho: occupationFamilyValidation?.spearman_rho,
						count: occupationFamilyValidation?.family_count
					}
				})
			);
		}
		console.log(`  INFO: DATA_VINTAGE expects ${DATA_VINTAGE.validation_checks} checks`);
	} catch (error) {
		warn('Data vintage validation', `Could not import: ${error}`);
	}

	console.log('\n=== Summary ===');
	console.log(`  Passed: ${passed}`);
	console.log(`  Failed: ${failed}`);
	console.log(`  Warnings: ${warnings}`);

	if (failed > 0) {
		console.log('\nValidation FAILED.');
		process.exit(1);
	}

	console.log('\nAll checks passed.');
}

main();
