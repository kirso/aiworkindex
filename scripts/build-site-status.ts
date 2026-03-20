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

function readJson<T>(filePath: string): T | null {
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
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
		{
			id: `structural-${DATA_VINTAGE.model_version.toLowerCase()}-${DATA_VINTAGE.last_updated}`,
			type: 'structural_release',
			label: `${DATA_VINTAGE.model_version} structural release`,
			published_at: DATA_VINTAGE.last_updated,
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: '/data',
			notes: [
				'Canonical structural score dataset and schema release.',
				'Release manifest and claims matrix regenerated for this version.'
			]
		},
		{
			id: 'official-labour-report-q4-2025',
			type: 'official_update',
			label: siteStatus.live_monitor.latest_official_labour_report.label,
			published_at: siteStatus.live_monitor.latest_official_labour_report.published_at,
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: siteStatus.live_monitor.latest_official_labour_report.url,
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
			score_version: DATA_VINTAGE.model_version,
			monitor_vintage: siteStatus.live_monitor.labour_monitor_artifact_vintage,
			href: '/reports',
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
