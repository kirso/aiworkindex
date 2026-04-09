#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import type { ImpactType, RiskBand } from '../src/lib/data';
import type { WorkflowOverlay } from '../src/lib/data/workflow-overlay';
import { clamp01 } from '../src/lib/data/methodology-core';
import { classifyArchetype } from '../src/lib/data/role-archetypes';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import { minMaxNormalize, normalizeTaskText } from '../src/lib/data/task-primitives-core';
import { computeTaskModeSummary, type TaskModeSummary } from '../src/lib/data/v5-task-mode-core';
import {
	computeV5ExperimentalScores,
	type V5ExperimentalProfile
} from '../src/lib/data/v5-experimental-core';
import { ssocToSocCodes } from './crosswalk';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const BACKTEST_DIR = path.join(DATA_DIR, 'backtests');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OCCUPATIONS_V43_FILE = path.join(DATA_DIR, 'occupations-v43.json');
const ENRICHMENT_FILE = path.join(DATA_DIR, 'onet-enrichment.json');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const BLS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_projections_2024_2034.xlsx');
const ONET_DIR = path.join(DATA_DIR, 'raw', 'external', 'onet');
const ANTHROPIC_TASKS_FILE = path.join(
	DATA_DIR,
	'raw',
	'external',
	'anthropic_task_penetration.csv'
);
const TASK_STATEMENTS_FILE = path.join(ONET_DIR, 'Task_Statements.txt');
const TASK_RATINGS_FILE = path.join(ONET_DIR, 'Task_Ratings.txt');
const LIVE_BLS_VALIDATION_FILE = path.join(BACKTEST_DIR, 'bls-crosswalk-validation.json');
const LIVE_FAMILY_VALIDATION_FILE = path.join(BACKTEST_DIR, 'occupation-family-validation.json');
const V43_BLS_VALIDATION_FILE = path.join(BACKTEST_DIR, 'bls-crosswalk-validation-v43.json');
const V43_FAMILY_VALIDATION_FILE = path.join(BACKTEST_DIR, 'occupation-family-validation-v43.json');

const V5_AUGMENTATION_FILE = path.join(DATA_DIR, 'v5-augmentation-heterogeneity.json');
const V5_MOBILITY_FILE = path.join(DATA_DIR, 'v5-empirical-mobility.json');
const V5_POSTERIOR_FILE = path.join(DATA_DIR, 'v5-posterior-uncertainty.json');
const V5_REALIZED_FILE = path.join(DATA_DIR, 'v5-realized-risk.json');
const EMPLOYER_SIGNALS_FILE = path.join(DATA_DIR, 'employer-signals.json');
const LFR_SECTION_D_SIGNALS_FILE = path.join(DATA_DIR, 'lfr-section-d-signals.json');

const MODEL_FILE = path.join(DATA_DIR, 'v5-experimental-model.json');
const VALIDATION_FILE = path.join(DATA_DIR, 'v5-experimental-validation.json');
const SRC_MODEL_FILE = path.join(SRC_DATA_DIR, 'v5-experimental-model.json');
const SRC_VALIDATION_FILE = path.join(SRC_DATA_DIR, 'v5-experimental-validation.json');
const STATIC_MODEL_FILE = path.join(STATIC_DATA_DIR, 'v5-experimental-model.json');
const STATIC_VALIDATION_FILE = path.join(STATIC_DATA_DIR, 'v5-experimental-validation.json');

interface OccupationRecord {
	ssoc: string;
	title: string;
	major_group: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	scoring_basis?: 'task_aware_exposure_v43' | 'ensemble_fallback_v42';
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	impact_type: ImpactType;
	task_primitives?: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: 'anthropic_task_penetration_v1' | null;
	};
	uncertainty?: {
		exposure_p10: number;
		exposure_p90: number;
	};
	workflow_overlay?: WorkflowOverlay;
	market: {
		market_resilience: number;
	};
	labour_monitor_key: string | null;
}

interface OnetEnrichmentEntry {
	ssoc: string;
	onet_soc: string | null;
}

interface TaskStatementRow {
	soc: string;
	taskId: string;
	task: string;
}

interface TaskRatingRow {
	importance: number | null;
	frequency: number | null;
}

interface LabourMonitorCluster {
	cluster_key: string;
	cluster_label: string;
	vacancy: {
		trend_4q_pct: number;
	};
	hiring: {
		net_pressure: number;
	} | null;
	retrenchment: {
		incidence_per_1000?: number;
	} | null;
}

interface AugmentationEntry {
	ssoc: string;
	heterogeneous_augmentation_proxy: number;
	method?: string;
	research_keys?: string[];
}

interface MobilityEntry {
	ssoc: string;
	status: 'observed_enriched' | 'heuristic_only';
	empirical_mobility_score: number;
	destination_quality_score?: number;
	wage_preservation_score?: number;
	training_ease_score?: number;
	observed_signal_strength?: number | null;
	best_transition: {
		to_ssoc: string;
		to_title: string;
		composite: number;
		observed_transition_rate: number | null;
		destination_quality: number;
		wage_preservation: number;
		training_ease: number;
		empirical_priority: number;
	} | null;
	method?: string;
	research_keys?: string[];
}

interface PosteriorEntry {
	ssoc: string;
	exposure_p10: number;
	exposure_p50: number;
	exposure_p90: number;
	live_posterior_mean: number;
	method?: string;
	research_keys?: string[];
}

interface RealizedEntry {
	ssoc: string;
	realization_scalar: number;
	base_realized_risk_proxy: number;
	archetype?: string;
	short_run_cap_score?: number;
	postings_support_score?: number | null;
	postings_resistance_score?: number;
	signal_alignment_score?: number;
	method?: string;
	research_keys?: string[];
}

interface EmployerSignalsData {
	by_archetype: Record<
		string,
		{
			pressure_score: number;
		}
	>;
}

interface LfrSectionDSignals {
	family_employment: Record<
		string,
		{
			code: string;
			label: string;
			delta_pct: number | null;
		}
	>;
}

interface V5ExperimentalEntry {
	ssoc: string;
	title: string;
	major_group: string;
	match_quality: OccupationRecord['match_quality'];
	live_scoring_basis: OccupationRecord['scoring_basis'] | null;
	live_structural_risk: number;
	live_risk_band: RiskBand;
	live_augmentation: number;
	live_impact_type: ImpactType;
	structural_basis: string;
	posterior_exposure_p10: number;
	posterior_exposure_p50: number;
	posterior_exposure_p90: number;
	posterior_interval_width_80: number;
	v5_structural_risk_p10: number;
	v5_structural_risk: number;
	v5_structural_risk_p90: number;
	v5_structural_band: RiskBand;
	v5_structural_exposure_p10: number;
	v5_structural_exposure: number;
	v5_structural_exposure_p90: number;
	task_mode_blend_weight: number;
	task_mode_matched_task_weight_share: number | null;
	task_mode_delegable_share: number | null;
	task_mode_copilot_share: number | null;
	task_mode_human_led_share: number | null;
	task_mode_effective_coverage: number | null;
	task_mode_automation_pressure: number | null;
	task_mode_augmentation_upside: number | null;
	task_mode_concentration: number | null;
	v5_effective_augmentation: number;
	v5_demand_fragility: number;
	v5_reallocation_capacity: number;
	v5_concentration_adjustment: number;
	v5_heterogeneous_augmentation: number;
	v5_augmentation_band: string;
	v5_empirical_mobility: number;
	v5_adaptation_capacity: number;
	v5_adaptation_buffer: number;
	v5_transition_adjusted_risk: number;
	v5_transition_adjusted_band: RiskBand;
	v5_realized_risk_proxy: number;
	v5_impact_type: ImpactType;
	v5_profile: V5ExperimentalProfile;
	delta_vs_live_structural: number;
	delta_vs_live_transition: number;
	best_transition: MobilityEntry['best_transition'];
	realization_scalar: number;
	methods: {
		posterior: string | null;
		augmentation: string | null;
		mobility: string | null;
		realized: string | null;
		task_mode: string | null;
	};
	research_keys: string[];
}

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function buildFamilyDeltaPressure(signals: LfrSectionDSignals): Map<string, number> {
	const rows = Object.values(signals.family_employment)
		.filter(row => row.delta_pct !== null)
		.sort((a, b) => (a.delta_pct ?? 0) - (b.delta_pct ?? 0));
	const result = new Map<string, number>();
	if (rows.length === 0) return result;
	const denominator = rows.length - 1 || 1;
	rows.forEach((row, index) => {
		const percentileRank = index / denominator;
		result.set(row.code, round(1 - percentileRank));
	});
	return result;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function round(value: number, digits = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function roundNullable(value: number | null, digits = 4): number | null {
	if (value === null || !Number.isFinite(value)) return null;
	return round(value, digits);
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function parseTsv(filePath: string): Record<string, string>[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
	if (lines.length === 0) return [];
	const headers = lines[0]!.split('\t').map(header => header.trim());
	return lines.slice(1).map(line => {
		const values = line.split('\t');
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			row[header] = (values[index] ?? '').trim();
		});
		return row;
	});
}

function parseAnthropicTaskPenetration(filePath: string): Map<string, number> {
	const workbook = XLSX.readFile(filePath, { raw: true });
	const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
	const rows = XLSX.utils.sheet_to_json<{ task?: string; penetration?: number | string }>(sheet);
	const map = new Map<string, number>();
	for (const row of rows) {
		const penetration =
			typeof row.penetration === 'number' ? row.penetration : Number(row.penetration);
		if (!row.task || !Number.isFinite(penetration)) continue;
		map.set(normalizeTaskText(row.task), penetration);
	}
	return map;
}

function parseTaskStatements(filePath: string): Map<string, TaskStatementRow[]> {
	const rows = parseTsv(filePath);
	const tasksByBaseSoc = new Map<string, TaskStatementRow[]>();
	for (const row of rows) {
		const soc = row['O*NET-SOC Code'] ?? '';
		const taskId = row['Task ID'] ?? '';
		const task = row['Task'] ?? '';
		if (!soc || !taskId || !task) continue;
		const baseSoc = soc.split('.')[0] ?? soc;
		const list = tasksByBaseSoc.get(baseSoc) ?? [];
		list.push({ soc, taskId, task });
		tasksByBaseSoc.set(baseSoc, list);
	}
	return tasksByBaseSoc;
}

function isImportanceScale(row: Record<string, string>): boolean {
	const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
	const scaleName = (row['Scale Name'] ?? '').toLowerCase();
	return scaleId === 'im' || scaleName.includes('importance');
}

function isFrequencyScale(row: Record<string, string>): boolean {
	const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
	const scaleName = (row['Scale Name'] ?? '').toLowerCase();
	return (
		scaleId === 'ft' || scaleId === 'rt' || scaleId === 'fr' || scaleName.includes('frequency')
	);
}

function parseTaskRatings(filePath: string): Map<string, { weight: number }> {
	const rawRows = parseTsv(filePath);
	const ratings = new Map<string, TaskRatingRow>();

	for (const row of rawRows) {
		const soc = row['O*NET-SOC Code'] ?? '';
		const taskId = row['Task ID'] ?? '';
		const value = Number(row['Data Value'] ?? row['DataValue'] ?? row['Value'] ?? '');
		if (!soc || !taskId || !Number.isFinite(value)) continue;
		const key = `${soc}::${taskId}`;
		const current = ratings.get(key) ?? { importance: null, frequency: null };

		if (isImportanceScale(row)) current.importance = value;
		if (isFrequencyScale(row)) current.frequency = value;

		ratings.set(key, current);
	}

	const importanceValues = [...ratings.values()]
		.map(rating => rating.importance)
		.filter((value): value is number => value !== null);
	const frequencyValues = [...ratings.values()]
		.map(rating => rating.frequency)
		.filter((value): value is number => value !== null);

	const minImportance = Math.min(...importanceValues);
	const maxImportance = Math.max(...importanceValues);
	const minFrequency = Math.min(...frequencyValues);
	const maxFrequency = Math.max(...frequencyValues);

	const normalized = new Map<string, { weight: number }>();
	for (const [key, rating] of ratings) {
		if (rating.importance === null || rating.frequency === null) continue;
		const importance = minMaxNormalize(rating.importance, minImportance, maxImportance);
		const frequency = minMaxNormalize(rating.frequency, minFrequency, maxFrequency);
		const weight = importance * frequency;
		if (weight > 0) normalized.set(key, { weight });
	}

	return normalized;
}

function quantileMap(values: number[], targets: number[]): number[] {
	if (values.length === 0 || targets.length === 0) return [];
	const sortedValues = values
		.map((value, index) => ({ value, index }))
		.sort((a, b) => a.value - b.value);
	const sortedTargets = [...targets].sort((a, b) => a - b);
	const mapped = new Array<number>(values.length);

	for (let i = 0; i < sortedValues.length; i++) {
		const probability = sortedValues.length === 1 ? 0.5 : i / (sortedValues.length - 1);
		const targetIndex = Math.round(probability * (sortedTargets.length - 1));
		mapped[sortedValues[i]!.index] = sortedTargets[targetIndex] ?? sortedTargets[0] ?? 0;
	}

	return mapped;
}

function computeTaskModeBlendWeight(matchedTaskWeightShare: number | null): number {
	if (matchedTaskWeightShare === null || matchedTaskWeightShare < 0.25) return 0;
	if (matchedTaskWeightShare < 0.6) {
		return round(0.05 + 0.2 * ((matchedTaskWeightShare - 0.25) / 0.35), 4);
	}
	return round(0.25 + 0.2 * ((matchedTaskWeightShare - 0.6) / 0.4), 4);
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

function compareNegativeMetric(live: number, experimental: number, tolerance = 0.05) {
	return {
		live: round(live),
		experimental: round(experimental),
		delta: round(experimental - live),
		pass: experimental < 0 && Math.abs(experimental) + tolerance >= Math.abs(live)
	};
}

function compareDirectionalMetric(
	experimental: number,
	expected: 'negative' | 'positive',
	scorable = true
) {
	return {
		experimental: round(experimental),
		expected_direction: expected,
		scorable,
		pass: !scorable ? null : expected === 'negative' ? experimental < 0 : experimental > 0
	};
}

function countBy<T extends string>(values: T[]): Record<T, number> {
	return values.reduce(
		(acc, value) => {
			acc[value] = (acc[value] ?? 0) + 1;
			return acc;
		},
		{} as Record<T, number>
	);
}

function topMovers(
	rows: V5ExperimentalEntry[],
	field: 'delta_vs_live_structural' | 'delta_vs_live_transition',
	direction: 'positive' | 'negative',
	limit = 5
) {
	return [...rows]
		.sort((a, b) => (direction === 'positive' ? b[field] - a[field] : a[field] - b[field]))
		.slice(0, limit)
		.map(row => ({
			ssoc: row.ssoc,
			title: row.title,
			value: round(row[field])
		}));
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

function computeBlsRho(
	occupations: OccupationRecord[],
	rowsBySsoc: Map<string, V5ExperimentalEntry>,
	field: 'v5_structural_risk' | 'v5_transition_adjusted_risk'
): number {
	const socPctChange = readSocPctChange();
	const pairs: Array<{ score: number; pctChange: number }> = [];

	for (const occupation of occupations) {
		const row = rowsBySsoc.get(occupation.ssoc);
		if (!row) continue;
		const matchedChanges = ssocToSocCodes(occupation.ssoc)
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');
		if (matchedChanges.length === 0) continue;
		pairs.push({
			score: row[field],
			pctChange: average(matchedChanges)
		});
	}

	return spearmanCorrelation(
		pairs.map(pair => pair.score),
		pairs.map(pair => pair.pctChange)
	);
}

function computeFamilyRho(
	occupations: OccupationRecord[],
	rowsBySsoc: Map<string, V5ExperimentalEntry>,
	field: 'v5_structural_risk' | 'v5_transition_adjusted_risk'
): number {
	const socPctChange = readSocPctChange();
	const familyMap = new Map<
		string,
		{
			totalOccupationCount: number;
			matchedRows: Array<{ score: number; pctChange: number }>;
		}
	>();

	for (const occupation of occupations) {
		const prefix = occupation.ssoc.slice(0, 2);
		const family = familyMap.get(prefix) ?? {
			totalOccupationCount: 0,
			matchedRows: []
		};
		family.totalOccupationCount += 1;
		const row = rowsBySsoc.get(occupation.ssoc);
		const matchedChanges = ssocToSocCodes(occupation.ssoc)
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');
		if (row && matchedChanges.length > 0) {
			family.matchedRows.push({
				score: row[field],
				pctChange: average(matchedChanges)
			});
		}
		familyMap.set(prefix, family);
	}

	const families = [...familyMap.values()]
		.filter(family => family.totalOccupationCount >= 5 && family.matchedRows.length >= 3)
		.map(family => ({
			score: average(family.matchedRows.map(row => row.score)),
			pctChange: average(family.matchedRows.map(row => row.pctChange))
		}));

	return spearmanCorrelation(
		families.map(family => family.score),
		families.map(family => family.pctChange)
	);
}

function computeRealizedClusterValidation(
	occupations: OccupationRecord[],
	rowsBySsoc: Map<string, V5ExperimentalEntry>,
	labourMonitors: LabourMonitorCluster[]
) {
	const monitorByKey = new Map(labourMonitors.map(monitor => [monitor.cluster_key, monitor]));
	const clusterRows = new Map<string, number[]>();

	for (const occupation of occupations) {
		if (!occupation.labour_monitor_key) continue;
		const row = rowsBySsoc.get(occupation.ssoc);
		if (!row || !monitorByKey.has(occupation.labour_monitor_key)) continue;
		const list = clusterRows.get(occupation.labour_monitor_key) ?? [];
		list.push(row.v5_realized_risk_proxy);
		clusterRows.set(occupation.labour_monitor_key, list);
	}

	const aggregated = [...clusterRows.entries()].map(([clusterKey, scores]) => {
		const monitor = monitorByKey.get(clusterKey)!;
		return {
			cluster_key: clusterKey,
			avg_realized_risk: average(scores),
			vacancy_trend_4q_pct: monitor.vacancy.trend_4q_pct,
			hiring_net_pressure: monitor.hiring?.net_pressure ?? null,
			retrenchment_incidence: monitor.retrenchment?.incidence_per_1000 ?? null
		};
	});

	const vacancyRho = spearmanCorrelation(
		aggregated.map(row => row.avg_realized_risk),
		aggregated.map(row => row.vacancy_trend_4q_pct)
	);
	const hiringRows = aggregated.filter(row => row.hiring_net_pressure !== null);
	const hiringRho = spearmanCorrelation(
		hiringRows.map(row => row.avg_realized_risk),
		hiringRows.map(row => row.hiring_net_pressure ?? 0)
	);
	const retrenchmentRows = aggregated.filter(row => row.retrenchment_incidence !== null);
	const retrenchmentRho = spearmanCorrelation(
		retrenchmentRows.map(row => row.avg_realized_risk),
		retrenchmentRows.map(row => row.retrenchment_incidence ?? 0)
	);
	const hiringScorable = new Set(hiringRows.map(row => row.hiring_net_pressure)).size > 1;
	const retrenchmentScorable =
		new Set(retrenchmentRows.map(row => row.retrenchment_incidence)).size > 1;

	return {
		rows: aggregated.map(row => ({
			...row,
			avg_realized_risk: round(row.avg_realized_risk),
			vacancy_trend_4q_pct: round(row.vacancy_trend_4q_pct, 2),
			hiring_net_pressure: roundNullable(row.hiring_net_pressure, 2),
			retrenchment_incidence: roundNullable(row.retrenchment_incidence, 2)
		})),
		vacancy_rho: vacancyRho,
		hiring_rho: hiringRho,
		retrenchment_rho: retrenchmentRho,
		hiring_scorable: hiringScorable,
		retrenchment_scorable: retrenchmentScorable
	};
}

function computeEmployerPressureValidation(
	rows: V5ExperimentalEntry[],
	employerSignals: EmployerSignalsData
) {
	const paired = rows
		.map(row => {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			const pressure = employerSignals.by_archetype?.[archetype]?.pressure_score;
			return typeof pressure === 'number'
				? {
						realized_risk: row.v5_realized_risk_proxy,
						pressure
					}
				: null;
		})
		.filter((row): row is { realized_risk: number; pressure: number } => row !== null);

	return {
		sample_size: paired.length,
		rho: spearmanCorrelation(
			paired.map(row => row.realized_risk),
			paired.map(row => row.pressure)
		)
	};
}

function computePostingsSupportValidation(
	rows: V5ExperimentalEntry[],
	realizedBySsoc: Map<string, RealizedEntry>
) {
	const paired = rows
		.map(row => {
			const postingsSupport = realizedBySsoc.get(row.ssoc)?.postings_support_score;
			return typeof postingsSupport === 'number'
				? {
						realized_risk: row.v5_realized_risk_proxy,
						postings_support: postingsSupport
					}
				: null;
		})
		.filter(
			(
				row
			): row is {
				realized_risk: number;
				postings_support: number;
			} => row !== null
		);

	return {
		sample_size: paired.length,
		rho: spearmanCorrelation(
			paired.map(row => row.realized_risk),
			paired.map(row => row.postings_support)
		)
	};
}

function main() {
	const comparisonBaselineVersion =
		DATA_VINTAGE.model_version === 'V5' && fs.existsSync(OCCUPATIONS_V43_FILE)
			? 'V4.3'
			: DATA_VINTAGE.model_version;
	const comparisonOccupationsFile =
		comparisonBaselineVersion === 'V4.3' ? OCCUPATIONS_V43_FILE : OCCUPATIONS_FILE;
	const comparisonBlsFile =
		comparisonBaselineVersion === 'V4.3' && fs.existsSync(V43_BLS_VALIDATION_FILE)
			? V43_BLS_VALIDATION_FILE
			: LIVE_BLS_VALIDATION_FILE;
	const comparisonFamilyFile =
		comparisonBaselineVersion === 'V4.3' && fs.existsSync(V43_FAMILY_VALIDATION_FILE)
			? V43_FAMILY_VALIDATION_FILE
			: LIVE_FAMILY_VALIDATION_FILE;

	const occupations = readJson<OccupationRecord[]>(comparisonOccupationsFile);
	const labourMonitors = readJson<LabourMonitorCluster[]>(LABOUR_MONITOR_FILE);
	const liveBlsValidation = readJson<{ spearman_rho: number }>(comparisonBlsFile);
	const liveFamilyValidation = readJson<{ spearman_rho: number }>(comparisonFamilyFile);
	const employerSignals = readJson<EmployerSignalsData>(EMPLOYER_SIGNALS_FILE);
	const lfrSectionDSignals = readJson<LfrSectionDSignals>(LFR_SECTION_D_SIGNALS_FILE);
	const enrichment = readJson<OnetEnrichmentEntry[]>(ENRICHMENT_FILE);
	const augmentation = readJson<{ method: string; entries: AugmentationEntry[] }>(
		V5_AUGMENTATION_FILE
	);
	const mobility = readJson<{ method: string; entries: MobilityEntry[] }>(V5_MOBILITY_FILE);
	const posterior = readJson<{ method: string; entries: PosteriorEntry[] }>(V5_POSTERIOR_FILE);
	const realized = readJson<{ method: string; entries: RealizedEntry[] }>(V5_REALIZED_FILE);
	const penetrationByTask = parseAnthropicTaskPenetration(ANTHROPIC_TASKS_FILE);
	const tasksByBaseSoc = parseTaskStatements(TASK_STATEMENTS_FILE);
	const weightsByTask = parseTaskRatings(TASK_RATINGS_FILE);

	const augmentationBySsoc = new Map(augmentation.entries.map(entry => [entry.ssoc, entry]));
	const mobilityBySsoc = new Map(mobility.entries.map(entry => [entry.ssoc, entry]));
	const posteriorBySsoc = new Map(posterior.entries.map(entry => [entry.ssoc, entry]));
	const realizedBySsoc = new Map(realized.entries.map(entry => [entry.ssoc, entry]));
	const onetSocBySsoc = new Map(enrichment.map(entry => [entry.ssoc, entry.onet_soc]));
	const taskModeSummaryBySsoc = new Map<string, TaskModeSummary>();
	const familyDeltaPressureByCode = buildFamilyDeltaPressure(lfrSectionDSignals);

	for (const occupation of occupations) {
		const onetSoc = onetSocBySsoc.get(occupation.ssoc) ?? null;
		if (!onetSoc) {
			taskModeSummaryBySsoc.set(occupation.ssoc, computeTaskModeSummary([]));
			continue;
		}

		const baseSoc = onetSoc.split('.')[0] ?? onetSoc;
		const taskRows = tasksByBaseSoc.get(baseSoc) ?? [];
		const weightedTasks = taskRows
			.map(taskRow => {
				const rating = weightsByTask.get(`${taskRow.soc}::${taskRow.taskId}`);
				if (!rating) return null;
				return {
					task: taskRow.task,
					weight: rating.weight,
					penetration: penetrationByTask.get(normalizeTaskText(taskRow.task)) ?? null
				};
			})
			.filter(
				(task): task is { task: string; weight: number; penetration: number | null } =>
					task !== null
			);

		if (weightedTasks.length === 0) {
			taskModeSummaryBySsoc.set(occupation.ssoc, computeTaskModeSummary([]));
			continue;
		}

		const totalWeight = weightedTasks.reduce((sum, task) => sum + task.weight, 0);
		if (totalWeight <= 0) {
			taskModeSummaryBySsoc.set(occupation.ssoc, computeTaskModeSummary([]));
			continue;
		}

		taskModeSummaryBySsoc.set(
			occupation.ssoc,
			computeTaskModeSummary(
				weightedTasks.map(task => ({
					task: task.task,
					weight: task.weight / totalWeight,
					penetration: task.penetration
				})),
				occupation.workflow_overlay
			)
		);
	}

	const taskModeSignalRows = occupations
		.map(occupation => {
			const summary = taskModeSummaryBySsoc.get(occupation.ssoc);
			const posteriorExposure =
				posteriorBySsoc.get(occupation.ssoc)?.exposure_p50 ?? occupation.exposure;
			return {
				ssoc: occupation.ssoc,
				rawSignal: summary?.task_mode_exposure_signal ?? null,
				matchedTaskWeightShare: summary?.matched_task_weight_share ?? null,
				posteriorExposure
			};
		})
		.filter(
			row =>
				row.rawSignal !== null &&
				row.matchedTaskWeightShare !== null &&
				row.matchedTaskWeightShare > 0
		);

	const strongTaskModeRows = taskModeSignalRows.filter(
		row => (row.matchedTaskWeightShare ?? 0) >= 0.6
	);
	const taskModeTargetDistribution =
		strongTaskModeRows.length > 0
			? strongTaskModeRows.map(row => row.posteriorExposure)
			: taskModeSignalRows.map(row => row.posteriorExposure);
	const calibratedTaskModeSignals = quantileMap(
		taskModeSignalRows.map(row => row.rawSignal ?? 0),
		taskModeTargetDistribution
	);
	const calibratedTaskModeSignalBySsoc = new Map(
		taskModeSignalRows.map((row, index) => [
			row.ssoc,
			clamp01(calibratedTaskModeSignals[index] ?? row.posteriorExposure)
		])
	);

	const entries: V5ExperimentalEntry[] = occupations.map(occupation => {
		const posteriorEntry = posteriorBySsoc.get(occupation.ssoc);
		const augmentationEntry = augmentationBySsoc.get(occupation.ssoc);
		const mobilityEntry = mobilityBySsoc.get(occupation.ssoc);
		const realizedEntry = realizedBySsoc.get(occupation.ssoc);
		const taskModeSummary = taskModeSummaryBySsoc.get(occupation.ssoc);
		const taskModeBlendWeight = computeTaskModeBlendWeight(
			taskModeSummary?.matched_task_weight_share ??
				occupation.task_primitives?.matched_task_weight_share ??
				null
		);
		const familyDeltaPressure = familyDeltaPressureByCode.get(occupation.ssoc.slice(0, 2)) ?? null;
		const blendedDemandFragility =
			taskModeSummary?.demand_fragility !== null && taskModeSummary?.demand_fragility !== undefined
				? clamp01(0.8 * taskModeSummary.demand_fragility + 0.2 * (familyDeltaPressure ?? 0.5))
				: familyDeltaPressure;

		const scores = computeV5ExperimentalScores({
			live_scoring_basis: occupation.scoring_basis,
			live_net_risk: occupation.net_risk,
			bottleneck: occupation.bottleneck,
			market_resilience: occupation.market.market_resilience,
			posterior_exposure_p10:
				posteriorEntry?.exposure_p10 ?? occupation.uncertainty?.exposure_p10 ?? occupation.exposure,
			posterior_exposure_p50: posteriorEntry?.exposure_p50 ?? occupation.exposure,
			posterior_exposure_p90:
				posteriorEntry?.exposure_p90 ?? occupation.uncertainty?.exposure_p90 ?? occupation.exposure,
			heterogeneous_augmentation:
				augmentationEntry?.heterogeneous_augmentation_proxy ?? occupation.augmentation,
			empirical_mobility: mobilityEntry?.empirical_mobility_score ?? 0.5,
			realization_scalar: realizedEntry?.realization_scalar ?? 0.3,
			task_mode_exposure_signal: calibratedTaskModeSignalBySsoc.get(occupation.ssoc) ?? null,
			task_mode_effective_coverage: taskModeSummary?.task_mode_effective_coverage ?? null,
			task_mode_automation_pressure: taskModeSummary?.task_mode_automation_pressure ?? null,
			task_mode_augmentation_upside: taskModeSummary?.task_mode_augmentation_upside ?? null,
			demand_fragility: blendedDemandFragility ?? null,
			reallocation_capacity: taskModeSummary?.reallocation_capacity ?? null,
			task_mode_blend_weight: taskModeBlendWeight
		});

		const researchKeys = Array.from(
			new Set([
				'felten_raj_seamans_2018',
				'felten_raj_seamans_2021',
				'openai_gpts_are_gpts_2023',
				'pizzinelli_etal_2023',
				'onet_database_2024',
				'hampole_etal_2025',
				...(posteriorEntry?.research_keys ?? []),
				...(augmentationEntry?.research_keys ?? []),
				...(mobilityEntry?.research_keys ?? []),
				...(realizedEntry?.research_keys ?? [])
			])
		).sort();

		return {
			ssoc: occupation.ssoc,
			title: occupation.title,
			major_group: occupation.major_group,
			match_quality: occupation.match_quality,
			live_scoring_basis: occupation.scoring_basis ?? null,
			live_structural_risk: round(occupation.net_risk),
			live_risk_band: occupation.risk_band,
			live_augmentation: round(occupation.augmentation),
			live_impact_type: occupation.impact_type,
			structural_basis: scores.structural_basis,
			posterior_exposure_p10: round(
				posteriorEntry?.exposure_p10 ?? occupation.uncertainty?.exposure_p10 ?? occupation.exposure
			),
			posterior_exposure_p50: round(posteriorEntry?.exposure_p50 ?? occupation.exposure),
			posterior_exposure_p90: round(
				posteriorEntry?.exposure_p90 ?? occupation.uncertainty?.exposure_p90 ?? occupation.exposure
			),
			posterior_interval_width_80: round(scores.posterior_interval_width_80),
			v5_structural_exposure_p10: round(scores.structural_exposure_p10),
			v5_structural_exposure: round(scores.structural_exposure),
			v5_structural_exposure_p90: round(scores.structural_exposure_p90),
			task_mode_blend_weight: round(scores.task_mode_blend_weight),
			task_mode_matched_task_weight_share: roundNullable(
				taskModeSummary?.matched_task_weight_share ?? null
			),
			task_mode_delegable_share: roundNullable(
				taskModeSummary?.task_mode_shares?.delegable ?? null
			),
			task_mode_copilot_share: roundNullable(taskModeSummary?.task_mode_shares?.copilot ?? null),
			task_mode_human_led_share: roundNullable(
				taskModeSummary?.task_mode_shares?.human_led ?? null
			),
			task_mode_effective_coverage: roundNullable(scores.task_mode_effective_coverage),
			task_mode_automation_pressure: roundNullable(scores.task_mode_automation_pressure),
			task_mode_augmentation_upside: roundNullable(scores.task_mode_augmentation_upside),
			task_mode_concentration: roundNullable(taskModeSummary?.task_mode_concentration ?? null),
			v5_effective_augmentation: round(scores.effective_augmentation),
			v5_demand_fragility: round(scores.demand_fragility),
			v5_reallocation_capacity: round(scores.reallocation_capacity),
			v5_concentration_adjustment: round(scores.concentration_adjustment),
			v5_structural_risk_p10: round(scores.structural_risk_p10),
			v5_structural_risk: round(scores.structural_risk),
			v5_structural_risk_p90: round(scores.structural_risk_p90),
			v5_structural_band: scores.structural_band,
			v5_heterogeneous_augmentation: round(scores.heterogeneous_augmentation),
			v5_augmentation_band: scores.augmentation_band,
			v5_empirical_mobility: round(scores.empirical_mobility),
			v5_adaptation_capacity: round(scores.adaptation_capacity),
			v5_adaptation_buffer: round(scores.adaptation_buffer),
			v5_transition_adjusted_risk: round(scores.transition_adjusted_risk),
			v5_transition_adjusted_band: scores.transition_adjusted_band,
			v5_realized_risk_proxy: round(scores.realized_risk_proxy),
			v5_impact_type: scores.impact_type,
			v5_profile: scores.profile,
			delta_vs_live_structural: round(scores.delta_vs_live_structural),
			delta_vs_live_transition: round(scores.delta_vs_live_transition),
			best_transition: mobilityEntry?.best_transition
				? {
						...mobilityEntry.best_transition,
						composite: round(mobilityEntry.best_transition.composite),
						observed_transition_rate: roundNullable(
							mobilityEntry.best_transition.observed_transition_rate
						),
						destination_quality: round(mobilityEntry.best_transition.destination_quality),
						wage_preservation: round(mobilityEntry.best_transition.wage_preservation),
						training_ease: round(mobilityEntry.best_transition.training_ease),
						empirical_priority: round(mobilityEntry.best_transition.empirical_priority)
					}
				: null,
			realization_scalar: round(realizedEntry?.realization_scalar ?? 0.3),
			methods: {
				posterior: posteriorEntry?.method ?? posterior.method ?? null,
				augmentation: augmentationEntry?.method ?? augmentation.method ?? null,
				mobility: mobilityEntry?.method ?? mobility.method ?? null,
				realized: realizedEntry?.method ?? realized.method ?? null,
				task_mode: taskModeSummary?.method ?? null
			},
			research_keys: researchKeys
		};
	});

	const entriesBySsoc = new Map(entries.map(entry => [entry.ssoc, entry]));
	const structuralBlsRho = computeBlsRho(occupations, entriesBySsoc, 'v5_structural_risk');
	const transitionBlsRho = computeBlsRho(occupations, entriesBySsoc, 'v5_transition_adjusted_risk');
	const structuralFamilyRho = computeFamilyRho(occupations, entriesBySsoc, 'v5_structural_risk');
	const transitionFamilyRho = computeFamilyRho(
		occupations,
		entriesBySsoc,
		'v5_transition_adjusted_risk'
	);
	const realizedClusterValidation = computeRealizedClusterValidation(
		occupations,
		entriesBySsoc,
		labourMonitors
	);
	const employerPressureValidation = employerSignals
		? computeEmployerPressureValidation(entries, employerSignals)
		: { sample_size: 0, rho: Number.NaN };
	const postingsSupportValidation = computePostingsSupportValidation(entries, realizedBySsoc);
	const realizedValidationChecks = [
		compareDirectionalMetric(realizedClusterValidation.vacancy_rho, 'negative'),
		compareDirectionalMetric(
			realizedClusterValidation.hiring_rho,
			'negative',
			realizedClusterValidation.hiring_scorable
		),
		compareDirectionalMetric(
			realizedClusterValidation.retrenchment_rho,
			'positive',
			realizedClusterValidation.retrenchment_scorable
		),
		compareDirectionalMetric(
			employerPressureValidation.rho,
			'positive',
			employerPressureValidation.sample_size >= 25
		),
		compareDirectionalMetric(
			postingsSupportValidation.rho,
			'negative',
			postingsSupportValidation.sample_size >= 25
		)
	];
	const realizedPassCount = realizedValidationChecks.filter(check => check.pass === true).length;
	const realizedScorableCount = realizedValidationChecks.filter(check => check.scorable).length;

	const modelPayload = {
		version: 'V5-experimental-model',
		generated_at: new Date().toISOString(),
		live_version: DATA_VINTAGE.model_version,
		comparison_baseline_version: comparisonBaselineVersion,
		status:
			DATA_VINTAGE.model_version === 'V5' ? 'promoted_live' : 'experimental_candidate_published',
		method:
			DATA_VINTAGE.model_version === 'V5'
				? 'posterior exposure + task-mode proxies + concentration-driven fragility + heterogeneous augmentation + empirical mobility + archetype-capped realized-risk calibration (promotion archive against the retained V4.3 baseline)'
				: 'posterior exposure + task-mode proxies + concentration-driven fragility + heterogeneous augmentation + empirical mobility + archetype-capped realized-risk calibration (experimental candidate, not the live headline score)',
		entries
	};

	const transitionBandFlipCount = entries.filter(
		entry => entry.live_risk_band !== entry.v5_transition_adjusted_band
	).length;
	const structuralBandFlipCount = entries.filter(
		entry => entry.live_risk_band !== entry.v5_structural_band
	).length;
	const impactFlipCount = entries.filter(
		entry => entry.live_impact_type !== entry.v5_impact_type
	).length;

	const validationPayload = {
		version: 'V5-experimental-validation',
		generated_at: new Date().toISOString(),
		live_version: DATA_VINTAGE.model_version,
		comparison_baseline_version: comparisonBaselineVersion,
		status: DATA_VINTAGE.model_version === 'V5' ? 'promoted_live' : 'experimental_only',
		summary: {
			occupation_count: entries.length,
			structural_basis_counts: countBy(entries.map(entry => entry.structural_basis)),
			profile_counts: countBy(entries.map(entry => entry.v5_profile)),
			task_mode_method_count: entries.filter(
				entry => entry.methods.task_mode === 'task_mode_proxy_v5a'
			).length,
			task_mode_blended_count: entries.filter(entry => entry.task_mode_blend_weight > 0).length,
			observed_enriched_mobility_count: mobility.entries.filter(
				entry => entry.status === 'observed_enriched'
			).length,
			realized_pass_count: realizedPassCount,
			realized_scorable_check_count: realizedScorableCount,
			structural_band_flip_count: structuralBandFlipCount,
			transition_band_flip_count: transitionBandFlipCount,
			impact_flip_count: impactFlipCount,
			mean_delta_vs_live_structural: round(
				average(entries.map(entry => entry.delta_vs_live_structural))
			),
			mean_delta_vs_live_transition: round(
				average(entries.map(entry => entry.delta_vs_live_transition))
			),
			median_realized_risk_proxy: round(
				median(entries.map(entry => entry.v5_realized_risk_proxy)) ?? 0
			),
			median_adaptation_capacity: round(
				median(entries.map(entry => entry.v5_adaptation_capacity)) ?? 0
			),
			median_demand_fragility: round(median(entries.map(entry => entry.v5_demand_fragility)) ?? 0),
			median_reallocation_capacity: round(
				median(entries.map(entry => entry.v5_reallocation_capacity)) ?? 0
			)
		},
		top_changes: {
			structural_risers: topMovers(entries, 'delta_vs_live_structural', 'positive'),
			structural_fallers: topMovers(entries, 'delta_vs_live_structural', 'negative'),
			transition_risers: topMovers(entries, 'delta_vs_live_transition', 'positive'),
			transition_fallers: topMovers(entries, 'delta_vs_live_transition', 'negative'),
			highest_realized_risk: [...entries]
				.sort((a, b) => b.v5_realized_risk_proxy - a.v5_realized_risk_proxy)
				.slice(0, 5)
				.map(entry => ({
					ssoc: entry.ssoc,
					title: entry.title,
					value: round(entry.v5_realized_risk_proxy)
				}))
		},
		structural_validation: {
			bls_spearman_rho: compareNegativeMetric(liveBlsValidation.spearman_rho, structuralBlsRho),
			transition_bls_spearman_rho: compareNegativeMetric(
				liveBlsValidation.spearman_rho,
				transitionBlsRho
			),
			occupation_family_spearman_rho: compareNegativeMetric(
				liveFamilyValidation.spearman_rho,
				structuralFamilyRho
			),
			transition_family_spearman_rho: compareNegativeMetric(
				liveFamilyValidation.spearman_rho,
				transitionFamilyRho
			)
		},
		realized_validation: {
			cluster_rows: realizedClusterValidation.rows,
			vacancy_trend_rho: realizedValidationChecks[0],
			hiring_net_pressure_rho: realizedValidationChecks[1],
			retrenchment_incidence_rho: realizedValidationChecks[2],
			employer_pressure_rho: {
				sample_size: employerPressureValidation.sample_size,
				...realizedValidationChecks[3]
			},
			postings_support_rho: {
				sample_size: postingsSupportValidation.sample_size,
				...realizedValidationChecks[4]
			}
		},
		readiness: {
			status: DATA_VINTAGE.model_version === 'V5' ? 'promoted_live' : 'experimental_only',
			summary:
				DATA_VINTAGE.model_version === 'V5'
					? 'V5 is now the live structural release. This artifact preserves the final comparison against the retained V4.3 baseline and keeps the transition-adjusted and realized-risk layers auditable.'
					: 'V5 is a published experimental candidate that now adds task-mode proxies, concentration-driven fragility, source-calibrated latent exposure, hybrid mobility, and archetype-capped realized-risk calibration on top of the existing sidecars. It remains separate from the live V4.3 headline score until its validation family is explicitly promoted.'
		}
	};

	for (const [filePath, payload] of [
		[MODEL_FILE, modelPayload],
		[SRC_MODEL_FILE, modelPayload],
		[STATIC_MODEL_FILE, modelPayload],
		[VALIDATION_FILE, validationPayload],
		[SRC_VALIDATION_FILE, validationPayload],
		[STATIC_VALIDATION_FILE, validationPayload]
	] as const) {
		writeJson(filePath, payload);
	}

	console.log(`Built V5 experimental model at ${STATIC_MODEL_FILE}`);
	console.log(`Built V5 experimental validation at ${STATIC_VALIDATION_FILE}`);
}

main();
