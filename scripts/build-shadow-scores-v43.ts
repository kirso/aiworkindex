#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import { ssocToSocCodes } from './crosswalk';
import { classifyImpactType, getRiskBand } from '../src/lib/data/scoring-constants';
import {
	computeShadowModelScores,
	type ShadowEligibilityStatus
} from '../src/lib/data/shadow-model-core';
import type { ImpactType, RiskBand } from '../src/lib/data';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const BACKTEST_DIR = path.join(STATIC_DATA_DIR, 'backtests');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const BLS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_projections_2024_2034.xlsx');
const CURRENT_VALIDATION_FILE = path.join(BACKTEST_DIR, 'current-validation.json');
const BLS_VALIDATION_FILE = path.join(BACKTEST_DIR, 'bls-crosswalk-validation.json');
const FAMILY_VALIDATION_FILE = path.join(BACKTEST_DIR, 'occupation-family-validation.json');

const SHADOW_SCORES_FILE = path.join(DATA_DIR, 'shadow-scores-v43.json');
const SHADOW_COMPARISON_FILE = path.join(DATA_DIR, 'shadow-comparison-v43.json');
const SHADOW_VALIDATION_FILE = path.join(DATA_DIR, 'shadow-validation-v43.json');
const SHADOW_ANCHOR_FILE = path.join(DATA_DIR, 'shadow-anchor-review-v43.json');

const SRC_SHADOW_SCORES_FILE = path.join(SRC_DATA_DIR, 'shadow-scores-v43.json');
const SRC_SHADOW_COMPARISON_FILE = path.join(SRC_DATA_DIR, 'shadow-comparison-v43.json');
const SRC_SHADOW_VALIDATION_FILE = path.join(SRC_DATA_DIR, 'shadow-validation-v43.json');
const SRC_SHADOW_ANCHOR_FILE = path.join(SRC_DATA_DIR, 'shadow-anchor-review-v43.json');

const STATIC_SHADOW_SCORES_FILE = path.join(STATIC_DATA_DIR, 'shadow-scores-v43.json');
const STATIC_SHADOW_COMPARISON_FILE = path.join(STATIC_DATA_DIR, 'shadow-comparison-v43.json');
const STATIC_SHADOW_VALIDATION_FILE = path.join(STATIC_DATA_DIR, 'shadow-validation-v43.json');
const STATIC_SHADOW_ANCHOR_FILE = path.join(STATIC_DATA_DIR, 'shadow-anchor-review-v43.json');

interface OccupationRecord {
	ssoc: string;
	title: string;
	major_group: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	impact_type: ImpactType;
	labour_monitor_key: string | null;
	market: {
		market_modifier: number;
	};
	task_primitives?: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: 'anthropic_task_penetration_v1' | null;
	};
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

interface LabourMonitorCluster {
	cluster_key: string;
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		trend_4q_pct: number;
		signal: number;
	};
	hiring: {
		net_pressure: number;
		signal: number;
	} | null;
	retrenchment: {
		incidence_per_1000?: number;
		signal: number;
	} | null;
	overall: string;
}

interface ShadowScoreRow {
	ssoc: string;
	title: string;
	match_quality: OccupationRecord['match_quality'];
	baseline_net_risk: number;
	baseline_risk_band: RiskBand;
	baseline_impact_type: ImpactType;
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	shadow_automation_pressure: number;
	shadow_augmentation_upside: number;
	shadow_net_risk: number;
	shadow_risk_band: RiskBand;
	shadow_impact_type: ImpactType;
	delta_vs_v42: number;
	shadow_eligibility_status: ShadowEligibilityStatus;
	shadow_method: string;
	shadow_success_proxy: number;
	shadow_autonomy_proxy: number | null;
	shadow_reallocation_buffer: number | null;
}

type MetricComparison = {
	baseline: number;
	shadow: number;
	delta: number;
	pass: boolean;
};

const ANCHOR_PATTERNS: Array<{ key: string; label: string; pattern: RegExp }> = [
	{ key: 'software_developer', label: 'Software developer', pattern: /software developer/i },
	{ key: 'data_entry_clerk', label: 'Data entry clerk', pattern: /data entry clerk/i },
	{
		key: 'registered_nurse',
		label: 'Registered nurse',
		pattern: /registered nurse/i
	},
	{
		key: 'accountant',
		label: 'Accountant',
		pattern: /^accountant \(excluding tax accountant\)$/i
	},
	{ key: 'graphic_designer', label: 'Graphic designer', pattern: /graphic designer/i },
	{
		key: 'customer_service_officer',
		label: 'Customer service officer/clerk',
		pattern: /customer service officer\/clerk/i
	},
	{ key: 'marketing_manager', label: 'Marketing manager', pattern: /marketing manager/i },
	{
		key: 'teacher',
		label: 'Pre-primary education teacher',
		pattern: /pre-primary education teacher/i
	}
];

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function round(value: number, digits = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[middle] ?? null;
	return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function rankBandIndex(band: RiskBand): number {
	return ['very_low', 'low', 'moderate', 'high', 'very_high'].indexOf(band);
}

function bandShiftMagnitude(from: RiskBand, to: RiskBand): number {
	return Math.abs(rankBandIndex(to) - rankBandIndex(from));
}

function averageRank(values: number[]): number[] {
	const indexed = values
		.map((value, index) => ({ value, index }))
		.sort((a, b) => a.value - b.value);
	const ranks = new Array<number>(values.length);
	let i = 0;
	while (i < indexed.length) {
		let j = i;
		while (j < indexed.length - 1 && indexed[j + 1]?.value === indexed[j]?.value) j++;
		const avgRank = (i + j) / 2 + 1;
		for (let k = i; k <= j; k++) {
			ranks[indexed[k]!.index] = avgRank;
		}
		i = j + 1;
	}
	return ranks;
}

function spearmanCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 3) return Number.NaN;

	const rx = averageRank(x);
	const ry = averageRank(y);
	const meanRx = average(rx);
	const meanRy = average(ry);
	let numerator = 0;
	let denX = 0;
	let denY = 0;
	for (let i = 0; i < x.length; i++) {
		const dx = rx[i]! - meanRx;
		const dy = ry[i]! - meanRy;
		numerator += dx * dy;
		denX += dx * dx;
		denY += dy * dy;
	}
	if (denX === 0 || denY === 0) return 0;
	return numerator / Math.sqrt(denX * denY);
}

function readSocPctChange(): Map<string, number> {
	const workbook = XLSX.readFile(BLS_FILE);
	const sheet = workbook.Sheets['Table 1.2'];
	const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
	const socPctChange = new Map<string, number>();
	for (let i = 2; i < rows.length; i++) {
		const row = rows[i];
		if (!row || row[2] !== 'Line item') continue;
		const socCode = row[1];
		const pctChange = row[8];
		if (typeof socCode === 'string' && typeof pctChange === 'number') {
			socPctChange.set(socCode, pctChange);
		}
	}
	return socPctChange;
}

function compareDirectionalMetric(
	baseline: number,
	shadow: number,
	mode: 'higher_is_better' | 'more_negative_is_better',
	tolerance = 0
): MetricComparison {
	const delta = round(shadow - baseline, 4);
	const pass =
		mode === 'higher_is_better'
			? shadow >= baseline - tolerance
			: shadow < 0 && Math.abs(shadow) + tolerance >= Math.abs(baseline);

	return {
		baseline: round(baseline, 4),
		shadow: round(shadow, 4),
		delta,
		pass
	};
}

function computeClusterValidation(
	occupations: OccupationRecord[],
	shadowScoresBySsoc: Map<string, ShadowScoreRow>,
	labourMonitors: LabourMonitorCluster[]
) {
	const monitorByKey = new Map(labourMonitors.map(monitor => [monitor.cluster_key, monitor]));
	const clusterRisks = new Map<string, number[]>();

	for (const occupation of occupations) {
		if (!occupation.labour_monitor_key || !monitorByKey.has(occupation.labour_monitor_key))
			continue;
		const shadow = shadowScoresBySsoc.get(occupation.ssoc);
		if (!shadow) continue;
		const list = clusterRisks.get(occupation.labour_monitor_key) ?? [];
		list.push(shadow.shadow_net_risk);
		clusterRisks.set(occupation.labour_monitor_key, list);
	}

	const rows = [...clusterRisks.entries()].map(([clusterKey, risks]) => {
		const monitor = monitorByKey.get(clusterKey)!;
		return {
			cluster_key: clusterKey,
			cluster_label: monitor.cluster_label,
			avg_shadow_net_risk: round(average(risks)),
			vacancy_trend_4q_pct: monitor.vacancy.trend_4q_pct,
			hiring_net_pressure: monitor.hiring?.net_pressure ?? null,
			retrenchment_incidence: monitor.retrenchment?.incidence_per_1000 ?? null
		};
	});

	const vacancyRho = spearmanCorrelation(
		rows.map(row => row.avg_shadow_net_risk),
		rows.map(row => row.vacancy_trend_4q_pct)
	);
	const retrenchmentRows = rows.filter(row => row.retrenchment_incidence !== null);
	const retrenchmentRho = spearmanCorrelation(
		retrenchmentRows.map(row => row.avg_shadow_net_risk),
		retrenchmentRows.map(row => row.retrenchment_incidence ?? 0)
	);
	const hiringRows = rows.filter(row => row.hiring_net_pressure !== null);
	const hiringRho = spearmanCorrelation(
		hiringRows.map(row => row.avg_shadow_net_risk),
		hiringRows.map(row => row.hiring_net_pressure ?? 0)
	);

	const checks = [
		{ key: 'vacancy', pass: !Number.isNaN(vacancyRho) && vacancyRho < 0 },
		{ key: 'retrenchment', pass: !Number.isNaN(retrenchmentRho) && retrenchmentRho > 0 },
		{ key: 'hiring', pass: !Number.isNaN(hiringRho) && hiringRho < 0 }
	];

	return {
		cluster_count: rows.length,
		rows,
		vacancy_rho: round(vacancyRho, 4),
		retrenchment_rho: round(retrenchmentRho, 4),
		hiring_rho: round(hiringRho, 4),
		directional_accuracy: round(checks.filter(check => check.pass).length / checks.length, 4)
	};
}

function computeBlsValidation(
	occupations: OccupationRecord[],
	shadowScoresBySsoc: Map<string, ShadowScoreRow>,
	socPctChange: Map<string, number>
) {
	const matched: Array<{ shadow_net_risk: number; bls_pct_change: number }> = [];

	for (const occupation of occupations) {
		const shadow = shadowScoresBySsoc.get(occupation.ssoc);
		if (!shadow) continue;
		const matchedChanges = ssocToSocCodes(occupation.ssoc)
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');
		if (matchedChanges.length === 0) continue;
		matched.push({
			shadow_net_risk: shadow.shadow_net_risk,
			bls_pct_change: average(matchedChanges)
		});
	}

	return {
		sample_size: matched.length,
		spearman_rho: round(
			spearmanCorrelation(
				matched.map(row => row.shadow_net_risk),
				matched.map(row => row.bls_pct_change)
			),
			4
		)
	};
}

function computeFamilyValidation(
	occupations: OccupationRecord[],
	shadowScoresBySsoc: Map<string, ShadowScoreRow>,
	socPctChange: Map<string, number>
) {
	const familyMap = new Map<string, Array<{ shadow_net_risk: number; bls_pct_change: number }>>();

	for (const occupation of occupations) {
		const shadow = shadowScoresBySsoc.get(occupation.ssoc);
		if (!shadow) continue;
		const matchedChanges = ssocToSocCodes(occupation.ssoc)
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');
		if (matchedChanges.length === 0) continue;
		const prefix = occupation.ssoc.slice(0, 2);
		const rows = familyMap.get(prefix) ?? [];
		rows.push({
			shadow_net_risk: shadow.shadow_net_risk,
			bls_pct_change: average(matchedChanges)
		});
		familyMap.set(prefix, rows);
	}

	const families = [...familyMap.values()].filter(rows => rows.length >= 3);

	return {
		family_count: families.length,
		spearman_rho: round(
			spearmanCorrelation(
				families.map(rows => average(rows.map(row => row.shadow_net_risk))),
				families.map(rows => average(rows.map(row => row.bls_pct_change)))
			),
			4
		)
	};
}

function buildAnchorReview(shadowScores: ShadowScoreRow[]) {
	const anchors = ANCHOR_PATTERNS.map(anchor => {
		const row = shadowScores.find(score => anchor.pattern.test(score.title));
		if (!row) {
			return {
				key: anchor.key,
				label: anchor.label,
				found: false
			};
		}

		const bandShift = bandShiftMagnitude(row.baseline_risk_band, row.shadow_risk_band);
		const reviewCandidate =
			bandShift >= 2 ||
			Math.abs(row.delta_vs_v42) >= 0.15 ||
			row.baseline_impact_type !== row.shadow_impact_type;

		return {
			key: anchor.key,
			label: anchor.label,
			found: true,
			ssoc: row.ssoc,
			title: row.title,
			eligibility_status: row.shadow_eligibility_status,
			baseline_net_risk: row.baseline_net_risk,
			shadow_net_risk: row.shadow_net_risk,
			delta_vs_v42: row.delta_vs_v42,
			baseline_risk_band: row.baseline_risk_band,
			shadow_risk_band: row.shadow_risk_band,
			baseline_impact_type: row.baseline_impact_type,
			shadow_impact_type: row.shadow_impact_type,
			manual_review_candidate: reviewCandidate
		};
	});

	const foundAnchors = anchors.filter(
		(anchor): anchor is Extract<(typeof anchors)[number], { found: true }> => anchor.found === true
	);
	const reviewCandidates = foundAnchors.filter(anchor => anchor.manual_review_candidate);

	return {
		version: 'V4.3-shadow',
		generated_at: new Date().toISOString(),
		required_anchor_count: ANCHOR_PATTERNS.length,
		found_anchor_count: foundAnchors.length,
		task_native_anchor_count: foundAnchors.filter(
			anchor => anchor.eligibility_status === 'task_native'
		).length,
		review_candidate_count: reviewCandidates.length,
		screening_complete: foundAnchors.length === ANCHOR_PATTERNS.length,
		anchors
	};
}

function main() {
	const occupations = readJson<OccupationRecord[]>(OCCUPATIONS_FILE);
	const labourMonitors = readJson<LabourMonitorCluster[]>(LABOUR_MONITOR_FILE);
	const currentValidation = readJson<{ directional_accuracy: number }>(CURRENT_VALIDATION_FILE);
	const blsValidation = readJson<{ spearman_rho: number }>(BLS_VALIDATION_FILE);
	const familyValidation = readJson<{ spearman_rho: number }>(FAMILY_VALIDATION_FILE);
	const socPctChange = readSocPctChange();

	const shadowScores: ShadowScoreRow[] = occupations.map(occupation => {
		const shadow = computeShadowModelScores({
			match_quality: occupation.match_quality,
			baseline_net_risk: occupation.net_risk,
			baseline_augmentation: occupation.augmentation,
			bottleneck: occupation.bottleneck,
			market_modifier: occupation.market.market_modifier,
			task_matched_weight_share: occupation.task_primitives?.matched_task_weight_share ?? null,
			task_effective_coverage: occupation.task_primitives?.task_effective_coverage ?? null,
			task_exposure_concentration: occupation.task_primitives?.task_exposure_concentration ?? null,
			workflow_overlay: occupation.workflow_overlay
		});

		const shadowRiskBand = getRiskBand(shadow.net_risk);
		const shadowImpactType = classifyImpactType(shadow.net_risk, shadow.augmentation_upside);

		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			match_quality: occupation.match_quality,
			baseline_net_risk: occupation.net_risk,
			baseline_risk_band: occupation.risk_band,
			baseline_impact_type: occupation.impact_type,
			task_effective_coverage: occupation.task_primitives?.task_effective_coverage ?? null,
			task_exposure_concentration: occupation.task_primitives?.task_exposure_concentration ?? null,
			shadow_automation_pressure: round(shadow.automation_pressure),
			shadow_augmentation_upside: round(shadow.augmentation_upside),
			shadow_net_risk: round(shadow.net_risk),
			shadow_risk_band: shadowRiskBand,
			shadow_impact_type: shadowImpactType,
			delta_vs_v42: round(shadow.net_risk - occupation.net_risk),
			shadow_eligibility_status: shadow.eligibility_status,
			shadow_method:
				shadow.eligibility_status === 'task_native'
					? 'task_native_proxy_v43'
					: shadow.eligibility_status === 'occupation_fallback'
						? 'occupation_baseline_fallback_v42'
						: 'insufficient_task_evidence_v42_fallback',
			shadow_success_proxy: round(shadow.success_proxy),
			shadow_autonomy_proxy: shadow.autonomy_proxy === null ? null : round(shadow.autonomy_proxy),
			shadow_reallocation_buffer:
				shadow.reallocation_buffer === null ? null : round(shadow.reallocation_buffer)
		};
	});

	const shadowScoresBySsoc = new Map(shadowScores.map(score => [score.ssoc, score]));
	const anchorReview = buildAnchorReview(shadowScores);
	const clusterValidation = computeClusterValidation(
		occupations,
		shadowScoresBySsoc,
		labourMonitors
	);
	const shadowBlsValidation = computeBlsValidation(occupations, shadowScoresBySsoc, socPctChange);
	const shadowFamilyValidation = computeFamilyValidation(
		occupations,
		shadowScoresBySsoc,
		socPctChange
	);

	const validationComparison = {
		version: 'V4.3-shadow',
		generated_at: new Date().toISOString(),
		cluster_directional_accuracy: compareDirectionalMetric(
			currentValidation.directional_accuracy,
			clusterValidation.directional_accuracy,
			'higher_is_better'
		),
		bls_spearman_rho: compareDirectionalMetric(
			blsValidation.spearman_rho,
			shadowBlsValidation.spearman_rho,
			'more_negative_is_better',
			0.02
		),
		occupation_family_spearman_rho: compareDirectionalMetric(
			familyValidation.spearman_rho,
			shadowFamilyValidation.spearman_rho,
			'more_negative_is_better',
			0.02
		),
		shadow_metrics: {
			cluster: clusterValidation,
			bls: shadowBlsValidation,
			occupation_family: shadowFamilyValidation
		}
	};

	const validationPassCount = [
		validationComparison.cluster_directional_accuracy.pass,
		validationComparison.bls_spearman_rho.pass,
		validationComparison.occupation_family_spearman_rho.pass
	].filter(Boolean).length;

	const bandFlips = shadowScores
		.filter(score => score.shadow_risk_band !== score.baseline_risk_band)
		.map(score => ({
			ssoc: score.ssoc,
			title: score.title,
			from: score.baseline_risk_band,
			to: score.shadow_risk_band,
			delta_vs_v42: score.delta_vs_v42,
			shadow_eligibility_status: score.shadow_eligibility_status
		}));

	const comparison = {
		version: 'V4.3-shadow',
		generated_at: new Date().toISOString(),
		occupation_count: shadowScores.length,
		task_native_count: shadowScores.filter(
			score => score.shadow_eligibility_status === 'task_native'
		).length,
		occupation_fallback_count: shadowScores.filter(
			score => score.shadow_eligibility_status === 'occupation_fallback'
		).length,
		insufficient_task_evidence_count: shadowScores.filter(
			score => score.shadow_eligibility_status === 'insufficient_task_evidence'
		).length,
		mean_delta_vs_v42: round(average(shadowScores.map(score => score.delta_vs_v42))),
		median_delta_vs_v42: round(median(shadowScores.map(score => score.delta_vs_v42)) ?? 0),
		mean_task_native_delta_vs_v42: round(
			average(
				shadowScores
					.filter(score => score.shadow_eligibility_status === 'task_native')
					.map(score => score.delta_vs_v42)
			)
		),
		band_flip_count: bandFlips.length,
		impact_flip_count: shadowScores.filter(
			score => score.shadow_impact_type !== score.baseline_impact_type
		).length,
		validation_pass_count: validationPassCount,
		validation_total: 3,
		band_flips: bandFlips.slice(0, 50),
		top_increases: [...shadowScores].sort((a, b) => b.delta_vs_v42 - a.delta_vs_v42).slice(0, 20),
		top_decreases: [...shadowScores].sort((a, b) => a.delta_vs_v42 - b.delta_vs_v42).slice(0, 20),
		anchor_review_summary: {
			found_anchor_count: anchorReview.found_anchor_count,
			review_candidate_count: anchorReview.review_candidate_count
		}
	};

	writeJson(SHADOW_SCORES_FILE, shadowScores);
	writeJson(SRC_SHADOW_SCORES_FILE, shadowScores);
	writeJson(STATIC_SHADOW_SCORES_FILE, shadowScores);

	writeJson(SHADOW_VALIDATION_FILE, validationComparison);
	writeJson(SRC_SHADOW_VALIDATION_FILE, validationComparison);
	writeJson(STATIC_SHADOW_VALIDATION_FILE, validationComparison);

	writeJson(SHADOW_ANCHOR_FILE, anchorReview);
	writeJson(SRC_SHADOW_ANCHOR_FILE, anchorReview);
	writeJson(STATIC_SHADOW_ANCHOR_FILE, anchorReview);

	writeJson(SHADOW_COMPARISON_FILE, comparison);
	writeJson(SRC_SHADOW_COMPARISON_FILE, comparison);
	writeJson(STATIC_SHADOW_COMPARISON_FILE, comparison);

	console.log(`Built shadow scores (${shadowScores.length} rows) at ${STATIC_SHADOW_SCORES_FILE}`);
}

main();
