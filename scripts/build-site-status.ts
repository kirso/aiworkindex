#!/usr/bin/env bun
/**
 * build-site-status.ts — Build canonical public site-status and releases artifacts
 * so structural versioning, monitor vintages, and official update announcements
 * can be surfaced consistently across the site.
 *
 * Run: bun run scripts/build-site-status.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');

const QUARTERLY_REPORT_FILE = path.join(STATIC_DATA_DIR, 'quarterly-report.json');
const POSTINGS_MONITOR_FILE = path.join(STATIC_DATA_DIR, 'postings-monitor.json');
const EMPLOYER_SIGNALS_FILE = path.join(STATIC_DATA_DIR, 'employer-signals.json');
const BACKTEST_FILE = path.join(STATIC_DATA_DIR, 'backtests', 'current-validation.json');
const MULTI_PERIOD_BACKTEST_FILE = path.join(
	STATIC_DATA_DIR,
	'backtests',
	'multi-period-validation.json'
);
const CALIBRATION_DIAGNOSTICS_FILE = path.join(
	STATIC_DATA_DIR,
	'backtests',
	'calibration-diagnostics.json'
);
const OCCUPATION_FAMILY_VALIDATION_FILE = path.join(
	STATIC_DATA_DIR,
	'backtests',
	'occupation-family-validation.json'
);
const SENSITIVITY_ANALYSIS_FILE = path.join(
	STATIC_DATA_DIR,
	'backtests',
	'sensitivity-analysis.json'
);
const IMF_CONVERGENCE_FILE = path.join(STATIC_DATA_DIR, 'backtests', 'imf-convergence.json');
const FORECAST_HORIZON_FILE = path.join(
	STATIC_DATA_DIR,
	'backtests',
	'forecast-horizon-validation.json'
);
const CONFIDENCE_RATINGS_FILE = path.join(STATIC_DATA_DIR, 'confidence-ratings.json');
const SCENARIO_FAMILIES_FILE = path.join(STATIC_DATA_DIR, 'scenario-families.json');
const ADOPTION_DIFFUSION_FILE = path.join(STATIC_DATA_DIR, 'adoption-diffusion.json');
const AGE_STRUCTURE_FILE = path.join(STATIC_DATA_DIR, 'age-structure.json');
const OFFSET_POTENTIAL_FILE = path.join(STATIC_DATA_DIR, 'sg-offset-potential-v4.json');
const EXPERIMENTAL_METHODOLOGY_FILE = path.join(
	STATIC_DATA_DIR,
	'experimental-methodology-v43.json'
);
const V5_SIDECARS_FILE = path.join(STATIC_DATA_DIR, 'v5-sidecars.json');
const V5_EXPERIMENTAL_VALIDATION_FILE = path.join(
	STATIC_DATA_DIR,
	'v5-experimental-validation.json'
);

const SITE_STATUS_OUT = path.join(STATIC_DATA_DIR, 'site-status.json');
const SITE_STATUS_SRC_OUT = path.join(SRC_DATA_DIR, 'site-status.json');
const RELEASES_OUT = path.join(STATIC_DATA_DIR, 'releases.json');
const RELEASES_SRC_OUT = path.join(SRC_DATA_DIR, 'releases.json');

const LATEST_OFFICIAL_LABOUR_REPORT = {
	label: 'MOM Labour Market Report Q1 2026',
	period: 'Q1 2026',
	published_at: '2026-06-15',
	url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-1Q-2026.aspx',
	status: 'published_live' as const
};

const STRUCTURAL_VERSION_HISTORY = [
	{
		id: 'public-v8-2026-07-15',
		version_label: 'V8',
		label: 'V8 truthful AI exposure release',
		published_at: '2026-07-15',
		display_date: '15 Jul 2026',
		availability: 'current_download',
		href: '/data',
		notes: [
			'Introduces a clean relative 0-100 Singapore AI exposure contract with substitution, augmentation, pathway, confidence and sensitivity fields.',
			'Demand, adoption, attrition, entry-level and transition economics are reported separately from the headline score.',
			'United States and global occupation scores are withdrawn until local validation gates pass.'
		]
	},
	{
		id: 'structural-v7-2026-04-07',
		version_label: 'V7',
		label: 'V7 structural release',
		published_at: '2026-04-07',
		display_date: '7 Apr 2026',
		availability: 'current_download',
		href: '/data',
		notes: [
			'Promotes the live V7 release: a task-concentration exposure buffer and a demand-persistence proxy on top of the V6 two-axis structural model.',
			'Revised 7 Jun 2026: the task-concentration term was corrected from an exposure amplifier to a buffer, matching the cited Hampole et al. (2025) finding that concentrated exposure offsets labour-demand losses.',
			'The canonical public export, sitemap, release manifest, claims matrix, and LLM surfaces share the same V7 release contract. V6 remains preserved as the immediate previous structural baseline for auditability.'
		]
	},
	{
		id: 'structural-v6-2026-04-01',
		version_label: 'V6',
		label: 'V6 structural release',
		published_at: '2026-04-01',
		display_date: '1 Apr 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v6.json',
		notes: [
			'Promotes the live V6 two-axis structural release: deterministic 4-source exposure ensemble, human bottleneck, displacement pressure, and explicit demand resilience.',
			'The canonical public export now matches the live app dataset and release-governance artifacts.',
			'Retained as the immediate pre-V7 structural baseline for auditability.'
		]
	},
	{
		id: 'structural-v5-2026-03-21',
		version_label: 'V5',
		label: 'V5 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v5.json',
		notes: [
			'Promotes the V5 structural model: latent-source posterior exposure, task-mode blending, concentration-driven fragility, and heterogeneous augmentation.',
			'Transition-adjusted and realized-risk layers are now published alongside the live structural score instead of being collapsed into the headline number.',
			'Retained as the immediate pre-V6 live baseline for auditability.'
		]
	},
	{
		id: 'structural-v43-2026-03-21',
		version_label: 'V4.3',
		label: 'V4.3 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v43.json',
		notes: [
			'Retained task-aware structural snapshot from the V4 lineage.',
			'The separate V4.3 shadow-governance artifact remains published with its own validation and anchor-review gates.',
			'Retained for auditability beneath the later V5, V6, and V7 releases.'
		]
	},
	{
		id: 'structural-v42-2026-03-21',
		version_label: 'V4.2',
		label: 'V4.2 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v42.json',
		notes: [
			'Shared methodology core, bootstrap uncertainty, forecast separation, and governance hardening.',
			'Retained as the final pre-promotion baseline before the task-aware V4.3 release.'
		]
	},
	{
		id: 'structural-v40-2026-03-19',
		version_label: 'V4.0',
		label: 'V4.0 four-source ensemble milestone',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Expanded exposure into the four-source ensemble: AIOE, Anthropic, Eloundou, and ILO.',
			'Preceded the later V4.2 methodology hardening pass.'
		]
	},
	{
		id: 'structural-v33-2026-03-19',
		version_label: 'V3.3',
		label: 'V3.3 ensemble exposure iteration',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Introduced the first ensemble-style exposure blend before the final four-source V4 lineage.',
			'Tracked here for version continuity; no separate frozen public snapshot is retained.'
		]
	},
	{
		id: 'structural-v32-2026-03-19',
		version_label: 'V3.2',
		label: 'V3.2 confidence-interval milestone',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Surfaced confidence intervals and recalibrated seniority adjustments.',
			'Tracked as a methodology milestone, not a retained standalone download.'
		]
	},
	{
		id: 'structural-v31-2026-03-16',
		version_label: 'V3.1',
		label: 'V3.1 observed-exposure and demand-signal milestone',
		published_at: '2026-03-16',
		display_date: '16 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Added Anthropic observed usage and stronger Singapore demand/context layers.',
			'Version tracked from git history; no separate retained public snapshot.'
		]
	},
	{
		id: 'structural-v30-2026-03-16',
		version_label: 'V3.0',
		label: 'V3.0 three-layer structural score',
		published_at: '2026-03-16',
		display_date: '16 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v3.json',
		notes: [
			'First full three-layer structural score: exposure, bottleneck, and market modifier.',
			'Historical public JSON snapshot is still retained.'
		]
	},
	{
		id: 'structural-v2-2026-01',
		version_label: 'V2',
		label: 'V2 Singapore occupation scorer',
		published_at: null,
		display_date: 'Jan 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Second-generation methodology before the V3 structural formula rewrite.',
			'Tracked for lineage continuity; no retained standalone public snapshot.'
		]
	},
	{
		id: 'structural-v1-2025-12',
		version_label: 'V1',
		label: 'V1 public alpha',
		published_at: null,
		display_date: 'Dec 2025',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'First public alpha of the Singapore occupation AI-impact project.',
			'Tracked for release lineage only.'
		]
	}
] as const;

function readJson<T>(filePath: string): T | null {
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function formatExperimentalReleaseNote(
	experimentalMethodology: {
		summary: string;
		shadow_score_published: boolean;
		headline_promotion_ready: boolean;
		blocker_count?: number;
	} | null
) {
	if (!experimentalMethodology) return 'Experimental shadow-model artifact is not available.';
	if ((experimentalMethodology.blocker_count ?? 0) > 0) {
		return `${experimentalMethodology.summary} Required local inputs remain incomplete.`;
	}
	if (!experimentalMethodology.shadow_score_published) {
		return `${experimentalMethodology.summary} All required local inputs are present; headline promotion still depends on publishing the shadow score and clearing validation review.`;
	}
	if (
		experimentalMethodology.headline_promotion_ready &&
		(DATA_VINTAGE.model_version === 'V4.3' ||
			DATA_VINTAGE.model_version === 'V5' ||
			DATA_VINTAGE.model_version === 'V6' ||
			DATA_VINTAGE.model_version === 'V7')
	) {
		return DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
			? 'The former V4.3 shadow model remains published as part of the retained audit trail beneath later live releases.'
			: DATA_VINTAGE.model_version === 'V5'
				? 'The former V4.3 shadow model remains published as the retained pre-V5 live baseline and promotion trail.'
				: 'The former V4.3 shadow model is now promoted into the live structural release. Shadow artifacts remain published for auditability.';
	}
	if (!experimentalMethodology.headline_promotion_ready) {
		return 'Shadow score is published, but promotion into the headline model is still gated by validation and anchor review.';
	}
	return 'Shadow score is fully ready for headline-promotion review.';
}

function buildSiteStatus() {
	const quarterlyReport = readJson<{
		generated_at?: string;
		current_snapshot: string;
		previous_snapshot: string | null;
	}>(QUARTERLY_REPORT_FILE);
	const postingsMonitor = readJson<{
		generated_at: string;
		observed_through?: string | null;
		coverage?: {
			occupations_covered: number;
			occupations_total: number;
			roles_covered: number;
			roles_total: number;
		};
		summary: { total_postings: number; posting_volume_30d: number };
	}>(POSTINGS_MONITOR_FILE);
	const employerSignals = readJson<{
		generated_at: string;
		summary: { total_signals: number; latest_signal_date: string | null };
	}>(EMPLOYER_SIGNALS_FILE);
	const currentBacktest = readJson<{
		data_period: string;
		summary?: { checks_passed: number; checks_total: number };
	}>(BACKTEST_FILE);
	const multiPeriodBacktest = readJson<{
		metrics?: {
			vacancy_rate_yoy?: { summary?: { avg_pairwise_accuracy: number; period_count: number } };
			annual_hiring_net?: { summary?: { avg_pairwise_accuracy: number; period_count: number } };
		};
	}>(MULTI_PERIOD_BACKTEST_FILE);
	const calibrationDiagnostics = readJson<{
		segments?: {
			by_match_quality?: {
				direct?: { spearman_rho: number | null; sample_size: number };
			};
			by_confidence_level?: {
				high_or_medium?: { spearman_rho: number | null; sample_size: number };
				low?: { sample_size: number };
			};
		};
	}>(CALIBRATION_DIAGNOSTICS_FILE);
	const sensitivityAnalysis = readJson<{
		recompute_fidelity?: { ok: boolean };
		monte_carlo?: { spearman_p50: number; top20_jaccard_p50: number };
	}>(SENSITIVITY_ANALYSIS_FILE);
	const imfConvergence = readJson<{
		employment_weighted_bins?: {
			top_half?: { exposed_share_pct: number; high_to_low_ratio: number };
		};
	}>(IMF_CONVERGENCE_FILE);
	const forecastHorizon = readJson<{
		status?: string;
		post_baseline_quarters_available?: number;
	}>(FORECAST_HORIZON_FILE);
	const confidenceRatings = readJson<{
		summary?: {
			counts?: { high?: number; medium?: number; low?: number };
			top_limiting_factors?: Array<{ factor: string; count: number }>;
		};
	}>(CONFIDENCE_RATINGS_FILE);
	const scenarioFamilies = readJson<{
		summary?: {
			scenario_count?: number;
			base_avg_near_term_risk?: number | null;
			fast_adoption_avg_near_term_risk?: number | null;
		};
	}>(SCENARIO_FAMILIES_FILE);
	const adoptionDiffusion = readJson<{
		summary?: {
			headline_adoption_pct?: number;
			headcount_reduction_among_adopters_pct?: number;
			role_redesign_among_adopters_pct?: number;
			top_sector?: { label: string; adoption_pct: number };
		};
	}>(ADOPTION_DIFFUSION_FILE);
	const ageStructure = readJson<{
		summary?: {
			high_attrition_absorber_count?: number;
			known_coverage_count?: number;
			unknown_coverage_count?: number;
			avg_age_50_plus_share?: number | null;
		};
	}>(AGE_STRUCTURE_FILE);
	const occupationFamilyValidation = readJson<{
		family_count: number;
		spearman_rho: number;
		p_value_below_01: boolean;
	}>(OCCUPATION_FAMILY_VALIDATION_FILE);
	const experimentalMethodology = readJson<{
		version: string;
		shadow_readiness: {
			status:
				| 'blocked'
				| 'not_ready'
				| 'ready_for_shadow_scoring'
				| 'shadow_published'
				| 'promoted';
			summary: string;
		};
		shadow_score_published: boolean;
		headline_promotion_ready: boolean;
		coverage?: {
			direct_task_weighted_occupation_count?: number;
			median_direct_matched_task_weight_share?: number | null;
		};
		blockers?: Array<{ key: string }>;
	}>(EXPERIMENTAL_METHODOLOGY_FILE);
	const offsetPotential = readJson<{
		generated_at: string;
		entries?: Array<{ band: 'low' | 'medium' | 'high' }>;
	}>(OFFSET_POTENTIAL_FILE);
	const v5Sidecars = readJson<{
		status: string;
		summary: string;
		sidecars?: Record<string, { status: string }>;
	}>(V5_SIDECARS_FILE);
	const v5ExperimentalValidation = readJson<{
		status: string;
		summary?: {
			transition_band_flip_count?: number;
			impact_flip_count?: number;
		};
		structural_validation?: {
			bls_spearman_rho?: { pass: boolean };
			occupation_family_spearman_rho?: { pass: boolean };
		};
		realized_validation?: {
			vacancy_trend_rho?: { pass: boolean | null; scorable?: boolean };
			hiring_net_pressure_rho?: { pass: boolean | null; scorable?: boolean };
			retrenchment_incidence_rho?: { pass: boolean | null; scorable?: boolean };
			employer_pressure_rho?: { pass: boolean | null; scorable?: boolean };
		};
		summary?: {
			transition_band_flip_count?: number;
			impact_flip_count?: number;
			realized_pass_count?: number;
			realized_scorable_check_count?: number;
		};
	}>(V5_EXPERIMENTAL_VALIDATION_FILE);
	const v5StructuralPasses = v5ExperimentalValidation
		? [
				v5ExperimentalValidation.structural_validation?.bls_spearman_rho?.pass,
				v5ExperimentalValidation.structural_validation?.occupation_family_spearman_rho?.pass
			].filter(Boolean).length
		: 0;
	const v5RealizedPasses = v5ExperimentalValidation?.summary?.realized_pass_count ?? 0;
	const v5RealizedScorableChecks =
		v5ExperimentalValidation?.summary?.realized_scorable_check_count ?? 0;

	return {
		updated_at: new Date().toISOString(),
		structural_release: {
			version: DATA_VINTAGE.public_version,
			label: `${DATA_VINTAGE.public_version} truthful AI exposure release`,
			generated_at: new Date().toISOString(),
			score_dataset_generated_at: new Date().toISOString().slice(0, 10),
			release_manifest: `release-manifest-${DATA_VINTAGE.public_version.toLowerCase()}.json`
		},
		experimental_release: experimentalMethodology
			? {
					version: experimentalMethodology.version,
					label: `${experimentalMethodology.version} task-weighted shadow model`,
					status: experimentalMethodology.shadow_readiness.status,
					summary: experimentalMethodology.shadow_readiness.summary,
					artifact: 'experimental-methodology-v43.json',
					shadow_score_published: experimentalMethodology.shadow_score_published,
					headline_promotion_ready: experimentalMethodology.headline_promotion_ready,
					direct_task_weighted_occupation_count:
						experimentalMethodology.coverage?.direct_task_weighted_occupation_count ?? 0,
					median_direct_matched_task_weight_share:
						experimentalMethodology.coverage?.median_direct_matched_task_weight_share ?? null,
					blocker_count: experimentalMethodology.blockers?.length ?? 0
				}
			: null,
		v5_program: v5Sidecars
			? {
					status:
						DATA_VINTAGE.model_version === 'V5'
							? 'promoted_live'
							: DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
								? 'archived_live_release'
								: v5ExperimentalValidation
									? 'experimental_model_published'
									: v5Sidecars.status,
					summary: v5ExperimentalValidation
						? DATA_VINTAGE.model_version === 'V5'
							? 'V5 is now the live structural release. The retained V4.3 baseline and promotion-comparison artifacts remain published for auditability.'
							: DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
								? 'The former live V5 model is archived with its published sidecars and comparison artifacts retained for auditability.'
								: 'The first integrated V5 experimental model is published on top of the audited sidecars. It remains separate from the live headline score.'
						: v5Sidecars.summary,
					workstream_count: Object.keys(v5Sidecars.sidecars ?? {}).length,
					experimental_model_published: !!v5ExperimentalValidation,
					structural_validation_result: v5ExperimentalValidation ? `${v5StructuralPasses}/2` : null,
					realized_validation_result: v5ExperimentalValidation
						? `${v5RealizedPasses}/${v5RealizedScorableChecks}`
						: null,
					transition_band_flip_count:
						v5ExperimentalValidation?.summary?.transition_band_flip_count ?? null,
					impact_flip_count: v5ExperimentalValidation?.summary?.impact_flip_count ?? null
				}
			: null,
		live_monitor: {
			labour_monitor_artifact_vintage: DATA_VINTAGE.labour_monitor,
			labour_monitor_validation_vintage: currentBacktest?.data_period ?? null,
			labour_monitor_source_label: 'MOM cluster labour monitor artifact',
			latest_official_labour_report: LATEST_OFFICIAL_LABOUR_REPORT,
			refresh_note:
				'The current labour context uses the full MOM Labour Market Report Q1 2026. Cluster figures remain broad context and do not become occupation-level outcomes.',
			macro_vintage: '2026 1Q',
			ai_context_vintage: '2025-2026 publications; underlying periods vary by metric',
			postings_generated_at: postingsMonitor?.generated_at ?? null,
			postings_observed_through: postingsMonitor?.observed_through ?? null,
			postings_occupation_coverage: postingsMonitor?.coverage
				? `${postingsMonitor.coverage.occupations_covered}/${postingsMonitor.coverage.occupations_total}`
				: null,
			postings_role_coverage: postingsMonitor?.coverage
				? `${postingsMonitor.coverage.roles_covered}/${postingsMonitor.coverage.roles_total}`
				: null,
			postings_volume_30d: postingsMonitor?.summary.posting_volume_30d ?? 0,
			employer_pressure_generated_at: employerSignals?.generated_at ?? null,
			employer_pressure_latest_signal_date: employerSignals?.summary.latest_signal_date ?? null,
			quarterly_report_generated_at: quarterlyReport?.generated_at ?? null,
			quarterly_current_snapshot: quarterlyReport?.current_snapshot ?? null,
			quarterly_previous_snapshot: quarterlyReport?.previous_snapshot ?? null,
			cluster_validation_checks_passed: currentBacktest?.summary?.checks_passed ?? null,
			cluster_validation_checks_total: currentBacktest?.summary?.checks_total ?? null,
			temporal_validation_vacancy_accuracy:
				multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.avg_pairwise_accuracy ?? null,
			temporal_validation_vacancy_periods:
				multiPeriodBacktest?.metrics?.vacancy_rate_yoy?.summary?.period_count ?? null,
			temporal_validation_hiring_accuracy:
				multiPeriodBacktest?.metrics?.annual_hiring_net?.summary?.avg_pairwise_accuracy ?? null,
			temporal_validation_hiring_periods:
				multiPeriodBacktest?.metrics?.annual_hiring_net?.summary?.period_count ?? null,
			calibration_direct_rho:
				calibrationDiagnostics?.segments?.by_match_quality?.direct?.spearman_rho ?? null,
			calibration_direct_sample:
				calibrationDiagnostics?.segments?.by_match_quality?.direct?.sample_size ?? null,
			calibration_high_medium_rho:
				calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.spearman_rho ?? null,
			calibration_high_medium_sample:
				calibrationDiagnostics?.segments?.by_confidence_level?.high_or_medium?.sample_size ?? null,
			calibration_low_confidence_sample:
				calibrationDiagnostics?.segments?.by_confidence_level?.low?.sample_size ?? null,
			sensitivity_spearman_p50: sensitivityAnalysis?.monte_carlo?.spearman_p50 ?? null,
			sensitivity_top20_jaccard_p50: sensitivityAnalysis?.monte_carlo?.top20_jaccard_p50 ?? null,
			sensitivity_fidelity_ok: sensitivityAnalysis?.recompute_fidelity?.ok ?? null,
			imf_top_half_exposed_share_pct:
				imfConvergence?.employment_weighted_bins?.top_half?.exposed_share_pct ?? null,
			imf_top_half_high_to_low_ratio:
				imfConvergence?.employment_weighted_bins?.top_half?.high_to_low_ratio ?? null,
			forecast_horizon_status: forecastHorizon?.status ?? null,
			forecast_horizon_post_baseline_quarters:
				forecastHorizon?.post_baseline_quarters_available ?? null,
			confidence_rating_high_count: confidenceRatings?.summary?.counts?.high ?? null,
			confidence_rating_medium_count: confidenceRatings?.summary?.counts?.medium ?? null,
			confidence_rating_low_count: confidenceRatings?.summary?.counts?.low ?? null,
			confidence_rating_top_limiter:
				confidenceRatings?.summary?.top_limiting_factors?.[0]?.factor ?? null,
			confidence_rating_top_limiter_count:
				confidenceRatings?.summary?.top_limiting_factors?.[0]?.count ?? null,
			scenario_family_count: scenarioFamilies?.summary?.scenario_count ?? null,
			scenario_base_avg_near_term_risk: scenarioFamilies?.summary?.base_avg_near_term_risk ?? null,
			scenario_fast_adoption_avg_near_term_risk:
				scenarioFamilies?.summary?.fast_adoption_avg_near_term_risk ?? null,
			adoption_diffusion_headline_pct: adoptionDiffusion?.summary?.headline_adoption_pct ?? null,
			adoption_diffusion_headcount_reduction_pct:
				adoptionDiffusion?.summary?.headcount_reduction_among_adopters_pct ?? null,
			adoption_diffusion_role_redesign_pct:
				adoptionDiffusion?.summary?.role_redesign_among_adopters_pct ?? null,
			adoption_diffusion_top_sector_label: adoptionDiffusion?.summary?.top_sector?.label ?? null,
			adoption_diffusion_top_sector_pct:
				adoptionDiffusion?.summary?.top_sector?.adoption_pct ?? null,
			age_structure_high_attrition_absorber_count:
				ageStructure?.summary?.high_attrition_absorber_count ?? null,
			age_structure_known_coverage_count: ageStructure?.summary?.known_coverage_count ?? null,
			age_structure_unknown_coverage_count: ageStructure?.summary?.unknown_coverage_count ?? null,
			age_structure_avg_age_50_plus_share: ageStructure?.summary?.avg_age_50_plus_share ?? null,
			occupation_family_validation_rho: occupationFamilyValidation?.spearman_rho ?? null,
			occupation_family_validation_family_count: occupationFamilyValidation?.family_count ?? null,
			occupation_family_validation_significant:
				occupationFamilyValidation?.p_value_below_01 ?? null,
			offset_potential_generated_at: offsetPotential?.generated_at ?? null,
			offset_potential_high_count: (offsetPotential?.entries ?? []).filter(
				entry => entry.band === 'high'
			).length
		},
		homepage_banner: {
			tag: 'Live now',
			title: 'V8 is live with a truthful relative AI exposure contract',
			body: 'Scores are now relative 0–100 ranks, not probabilities. Economics is reported separately, and only Singapore remains a live scored market.',
			link_href: '/methodology',
			link_label: 'Read the V8 methodology'
		}
	};
}

function buildReleases(siteStatus: ReturnType<typeof buildSiteStatus>) {
	return [
		...STRUCTURAL_VERSION_HISTORY.map(entry => ({
			id: entry.id,
			type: 'structural_release',
			label: entry.label,
			version_label: entry.version_label,
			published_at: entry.published_at,
			display_date: entry.display_date,
			score_version:
				entry.version_label === DATA_VINTAGE.model_version
					? DATA_VINTAGE.model_version
					: entry.version_label,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: entry.href,
			availability: entry.availability,
			notes: entry.notes
		})),
		{
			id:
				DATA_VINTAGE.model_version === 'V4.3' || DATA_VINTAGE.model_version === 'V5'
					? 'shadow-score-v43-promoted'
					: 'shadow-score-v43-published',
			type: 'experimental_update',
			label:
				DATA_VINTAGE.model_version === 'V4.3' || DATA_VINTAGE.model_version === 'V5'
					? 'V4.3 shadow model promoted'
					: 'V4.3 shadow score published',
			published_at: DATA_VINTAGE.last_updated,
			display_date: '21 Mar 2026',
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: '/reports/v4-3-shadow',
			availability: 'current_download',
			notes: [
				DATA_VINTAGE.model_version === 'V4.3'
					? 'Task-weighted shadow evidence is now reflected in the live structural release, while the full shadow comparison remains published.'
					: DATA_VINTAGE.model_version === 'V5'
						? 'V4.3 remains retained as the immediate pre-V5 live baseline, while the full shadow comparison stays published for auditability.'
						: 'V4.3 remains published as part of the retained audit trail beneath later live releases.',
				formatExperimentalReleaseNote(siteStatus.experimental_release)
			]
		},
		...(siteStatus.v5_program
			? [
					{
						id: 'v5-sidecars-published',
						type: 'experimental_update',
						label: 'V5 sidecars published',
						published_at: DATA_VINTAGE.last_updated,
						display_date: '21 Mar 2026',
						score_version: DATA_VINTAGE.model_version,
						monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
						href: '/reports/v5-roadmap',
						availability: 'current_download',
						notes: [
							siteStatus.v5_program.summary,
							'Each V5 workstream now ships as an auditable sidecar artifact before any future headline-score change.'
						]
					},
					...(siteStatus.v5_program.experimental_model_published
						? [
								{
									id:
										DATA_VINTAGE.model_version === 'V5'
											? 'v5-model-promoted'
											: 'v5-experimental-model-published',
									type: 'experimental_update',
									label:
										DATA_VINTAGE.model_version === 'V5'
											? 'V5 model promoted'
											: 'V5 experimental model published',
									published_at: DATA_VINTAGE.last_updated,
									display_date: '21 Mar 2026',
									score_version: DATA_VINTAGE.model_version,
									monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
									href: '/reports/v5-experimental',
									availability: 'current_download',
									notes: [
										DATA_VINTAGE.model_version === 'V5'
											? 'The V5 structural release is now live, while the transition-adjusted and realized-risk layers remain published as auditable adjunct fields.'
											: DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
												? 'The former live V5 model is retained as a historical baseline together with its validation and adjunct artifacts.'
												: 'Combines posterior uncertainty, augmentation heterogeneity, empirical mobility, and realized-risk calibration into one auditable candidate.',
										`Current validation snapshot: structural ${siteStatus.v5_program.structural_validation_result}, realized ${siteStatus.v5_program.realized_validation_result}.`
									]
								}
							]
						: [])
				]
			: []),
		{
			id: 'official-labour-report-q1-2026',
			type: 'official_update',
			label: siteStatus.live_monitor.latest_official_labour_report.label,
			published_at: siteStatus.live_monitor.latest_official_labour_report.published_at,
			display_date: '15 Jun 2026',
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: siteStatus.live_monitor.latest_official_labour_report.url,
			availability: 'current_download',
			notes: [
				'Fresh official labour report published by MOM.',
				'Current labour context refreshed to the Q1 2026 full vintage.'
			]
		},
		{
			id: 'quarterly-briefing-2026-q1',
			type: 'report_refresh',
			label: '2026 Q1 quarterly briefing',
			published_at: DATA_VINTAGE.last_updated,
			display_date: '21 Mar 2026',
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: '/reports',
			availability: 'current_download',
			notes: [
				'Quarterly movers and briefing context refreshed from frozen snapshots.',
				'Uses the live monitor artifact vintage current at the time of publication.'
			]
		}
	];
}

const siteStatus = buildSiteStatus();
const releases = buildReleases(siteStatus);

fs.mkdirSync(STATIC_DATA_DIR, { recursive: true });
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.writeFileSync(SITE_STATUS_OUT, JSON.stringify(siteStatus, null, 2), 'utf-8');
fs.writeFileSync(SITE_STATUS_SRC_OUT, JSON.stringify(siteStatus, null, 2), 'utf-8');
fs.writeFileSync(RELEASES_OUT, JSON.stringify(releases, null, 2), 'utf-8');
fs.writeFileSync(RELEASES_SRC_OUT, JSON.stringify(releases, null, 2), 'utf-8');

console.log(`Built site status at ${SITE_STATUS_OUT}`);
console.log(`Built releases history at ${RELEASES_OUT}`);
