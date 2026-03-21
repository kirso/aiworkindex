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
const OFFSET_POTENTIAL_FILE = path.join(STATIC_DATA_DIR, 'sg-offset-potential-v4.json');
const EXPERIMENTAL_METHODOLOGY_FILE = path.join(
	STATIC_DATA_DIR,
	'experimental-methodology-v43.json'
);

const SITE_STATUS_OUT = path.join(STATIC_DATA_DIR, 'site-status.json');
const SITE_STATUS_SRC_OUT = path.join(SRC_DATA_DIR, 'site-status.json');
const RELEASES_OUT = path.join(STATIC_DATA_DIR, 'releases.json');
const RELEASES_SRC_OUT = path.join(SRC_DATA_DIR, 'releases.json');

const LATEST_OFFICIAL_LABOUR_REPORT = {
	label: 'MOM Labour Market Report Q4 2025',
	period: 'Q4 2025',
	published_at: '2026-03-20',
	url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-4Q-2025.aspx',
	status: 'published_live' as const
};

const STRUCTURAL_VERSION_HISTORY = [
	{
		id: 'structural-v42-2026-03-21',
		version_label: 'V4.2',
		label: 'V4.2 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'current_download',
		href: '/data',
		notes: [
			'Shared methodology core, bootstrap uncertainty, forecast separation, and governance hardening.',
			'This is the live headline structural release.'
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

	return {
		updated_at: new Date().toISOString(),
		structural_release: {
			version: DATA_VINTAGE.model_version,
			label: `${DATA_VINTAGE.model_version} structural release`,
			generated_at: `${DATA_VINTAGE.last_updated}T00:00:00.000Z`,
			score_dataset_generated_at: DATA_VINTAGE.last_updated,
			release_manifest: 'release-manifest-v4.json'
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
		live_monitor: {
			labour_monitor_artifact_vintage: DATA_VINTAGE.labour_monitor,
			labour_monitor_validation_vintage: currentBacktest?.data_period ?? 'Q4 2025',
			labour_monitor_source_label: 'MOM cluster labour monitor artifact',
			latest_official_labour_report: LATEST_OFFICIAL_LABOUR_REPORT,
			refresh_note:
				'The live labour monitor now uses the full MOM Labour Market Report Q4 2025, including explicit Q3-to-Q4 deltas for vacancy, hiring, retrenchment and re-entry signals.',
			macro_vintage: '2025 4Q',
			ai_context_vintage: '2024 data',
			postings_generated_at: postingsMonitor?.generated_at ?? null,
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
			tag: 'Update',
			title: 'MOM Labour Market Report Q4 2025 is now live in the monitor',
			body: `Structural score remains ${DATA_VINTAGE.model_version}. The live labour monitor now runs on ${DATA_VINTAGE.labour_monitor}, with explicit Q3 → Q4 deltas across the Singapore labour layer.`,
			link_href: '/reports',
			link_label: 'See report updates'
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
			id: 'shadow-score-v43-published',
			type: 'experimental_update',
			label: 'V4.3 shadow score published',
			published_at: DATA_VINTAGE.last_updated,
			display_date: '21 Mar 2026',
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: '/reports/v4-3-shadow',
			availability: 'current_download',
			notes: [
				'Task-weighted shadow scores, validation comparison, and anchor-review artifacts published.',
				formatExperimentalReleaseNote(siteStatus.experimental_release)
			]
		},
		{
			id: 'official-labour-report-q4-2025',
			type: 'official_update',
			label: siteStatus.live_monitor.latest_official_labour_report.label,
			published_at: siteStatus.live_monitor.latest_official_labour_report.published_at,
			display_date: '20 Mar 2026',
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: siteStatus.live_monitor.latest_official_labour_report.url,
			availability: 'current_download',
			notes: [
				'Fresh official labour report published by MOM.',
				'Live labour monitor refreshed to the Q4 2025 full vintage.'
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
