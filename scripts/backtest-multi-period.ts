#!/usr/bin/env bun
/**
 * backtest-multi-period.ts — Temporal robustness checks for structural risk rankings.
 *
 * Uses the fixed cluster-level average structural risk ordering and compares it against:
 *   - quarterly vacancy-rate year-over-year deltas
 *   - quarterly vacancy-count year-over-year deltas
 *   - annual hiring net pressure (recruitment - resignation)
 *
 * Outputs:
 *   data/backtests/multi-period-validation.json
 *   src/lib/data/backtests/multi-period-validation.json
 *   static/data/backtests/multi-period-validation.json
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const RECRUITMENT_FILE = path.join(RAW_DIR, 'recruitment_resignation_rates.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'backtests', 'multi-period-validation.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'multi-period-validation.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'multi-period-validation.json'
);

type ClusterKey = 'pmet' | 'clerical_sales_service' | 'production_transport';

interface Occupation {
	labour_monitor_key: ClusterKey | null;
	net_risk: number;
}

interface LabourMonitor {
	cluster_key: ClusterKey;
	cluster_label: string;
	vacancy: {
		recent_quarters: Array<{ quarter: string; rate: number }>;
		recent_counts?: Array<{ quarter: string; count: number }>;
	};
}

interface RecruitmentRecord {
	year: string;
	industry1: string;
	occupation1: string;
	recruitment_rate: string;
	resignation_rate: string;
}

interface PeriodCheck {
	period: string;
	values: Record<string, number>;
	spearman_rho: number;
	pairwise_accuracy: number;
}

interface MetricSummary {
	period_count: number;
	negative_rho_share: number;
	avg_spearman_rho: number;
	avg_pairwise_accuracy: number;
}

const HIRING_LABELS: Record<ClusterKey, string> = {
	pmet: 'professional, managers, executive and technicians',
	clerical_sales_service: 'clerical, sales and services workers',
	production_transport: 'production and transport operators, cleaners and labourers'
};

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, decimals = 3): number {
	return Number(value.toFixed(decimals));
}

function spearmanCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 3) return NaN;
	const n = x.length;

	function averageRank(arr: number[]): number[] {
		const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
		const ranks = new Array<number>(n);
		let i = 0;
		while (i < n) {
			let j = i;
			while (j < n - 1 && indexed[j + 1].v === indexed[j].v) j++;
			const avgRank = (i + j) / 2 + 1;
			for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
			i = j + 1;
		}
		return ranks;
	}

	const rx = averageRank(x);
	const ry = averageRank(y);
	const meanRx = average(rx);
	const meanRy = average(ry);

	let numerator = 0;
	let denX = 0;
	let denY = 0;
	for (let i = 0; i < n; i++) {
		const dx = rx[i] - meanRx;
		const dy = ry[i] - meanRy;
		numerator += dx * dy;
		denX += dx * dx;
		denY += dy * dy;
	}
	return denX === 0 || denY === 0 ? 0 : numerator / Math.sqrt(denX * denY);
}

function pairwiseAccuracy(
	clusterRisk: Record<ClusterKey, number>,
	values: Partial<Record<ClusterKey, number>>
): number {
	const ordered = Object.entries(clusterRisk)
		.sort((a, b) => b[1] - a[1])
		.map(([key]) => key as ClusterKey);

	let hits = 0;
	let total = 0;
	for (let i = 0; i < ordered.length; i++) {
		for (let j = i + 1; j < ordered.length; j++) {
			const hi = ordered[i];
			const lo = ordered[j];
			const hiValue = values[hi];
			const loValue = values[lo];
			if (typeof hiValue !== 'number' || typeof loValue !== 'number') continue;
			total++;
			if (hiValue <= loValue) hits++;
		}
	}
	return total > 0 ? round(hits / total) : 0;
}

function summarizeMetric(checks: PeriodCheck[]): MetricSummary {
	return {
		period_count: checks.length,
		negative_rho_share: round(
			checks.filter(check => Number.isFinite(check.spearman_rho) && check.spearman_rho < 0).length /
				Math.max(checks.length, 1)
		),
		avg_spearman_rho: round(average(checks.map(check => check.spearman_rho))),
		avg_pairwise_accuracy: round(average(checks.map(check => check.pairwise_accuracy)))
	};
}

function yearQuarterKey(period: string): { year: number; quarter: number } | null {
	const match = period.match(/^(\d{4}) Q([1-4])$/);
	if (!match) return null;
	return { year: Number(match[1]), quarter: Number(match[2]) };
}

function buildYoYChecks(
	clusterRisk: Record<ClusterKey, number>,
	seriesByCluster: Record<ClusterKey, Array<{ period: string; value: number }>>
): PeriodCheck[] {
	const allPeriods = new Set<string>();
	for (const series of Object.values(seriesByCluster)) {
		for (const point of series) allPeriods.add(point.period);
	}

	const checks: PeriodCheck[] = [];
	for (const period of [...allPeriods].sort()) {
		const parsed = yearQuarterKey(period);
		if (!parsed) continue;
		const previous = `${parsed.year - 1} Q${parsed.quarter}`;
		const values: Partial<Record<ClusterKey, number>> = {};

		for (const key of Object.keys(seriesByCluster) as ClusterKey[]) {
			const current = seriesByCluster[key].find(point => point.period === period)?.value;
			const baseline = seriesByCluster[key].find(point => point.period === previous)?.value;
			if (typeof current === 'number' && typeof baseline === 'number') {
				values[key] = round(current - baseline, 2);
			}
		}

		const present = Object.values(values).filter(value => typeof value === 'number');
		if (present.length < 3) continue;
		const risks = (Object.keys(values) as ClusterKey[]).map(key => clusterRisk[key]);
		const metricValues = (Object.keys(values) as ClusterKey[]).map(key => values[key] as number);
		checks.push({
			period,
			values: values as Record<string, number>,
			spearman_rho: round(spearmanCorrelation(risks, metricValues)),
			pairwise_accuracy: pairwiseAccuracy(clusterRisk, values)
		});
	}

	return checks;
}

function buildAnnualHiringChecks(
	clusterRisk: Record<ClusterKey, number>,
	rows: RecruitmentRecord[]
): PeriodCheck[] {
	const grouped = new Map<string, Partial<Record<ClusterKey, number>>>();
	for (const row of rows) {
		if (row.industry1 !== 'total') continue;
		for (const [cluster, label] of Object.entries(HIRING_LABELS) as Array<[ClusterKey, string]>) {
			if (row.occupation1 === label) {
				const year = row.year;
				const bucket = grouped.get(year) ?? {};
				bucket[cluster] = Number(row.recruitment_rate) - Number(row.resignation_rate);
				grouped.set(year, bucket);
			}
		}
	}

	const checks: PeriodCheck[] = [];
	for (const [year, values] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
		if (Number(year) < 2015) continue;
		const present = Object.values(values).filter(value => typeof value === 'number');
		if (present.length < 3) continue;
		const keys = Object.keys(values) as ClusterKey[];
		checks.push({
			period: year,
			values: values as Record<string, number>,
			spearman_rho: round(
				spearmanCorrelation(
					keys.map(key => clusterRisk[key]),
					keys.map(key => values[key] as number)
				)
			),
			pairwise_accuracy: pairwiseAccuracy(clusterRisk, values)
		});
	}
	return checks;
}

function main() {
	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const labourMonitor: LabourMonitor[] = JSON.parse(fs.readFileSync(LABOUR_MONITOR_FILE, 'utf-8'));
	const recruitmentRows: RecruitmentRecord[] = JSON.parse(
		fs.readFileSync(RECRUITMENT_FILE, 'utf-8')
	).result.records;

	const clusterRisk = Object.fromEntries(
		(['pmet', 'clerical_sales_service', 'production_transport'] as ClusterKey[]).map(key => {
			const rows = occupations.filter(occupation => occupation.labour_monitor_key === key);
			return [key, round(average(rows.map(row => row.net_risk)), 4)];
		})
	) as Record<ClusterKey, number>;

	const vacancyRateSeries = Object.fromEntries(
		labourMonitor.map(monitor => [
			monitor.cluster_key,
			monitor.vacancy.recent_quarters
				.filter(point => /^20\d{2} Q[1-4]$/.test(point.quarter))
				.map(point => ({ period: point.quarter, value: point.rate }))
		])
	) as Record<ClusterKey, Array<{ period: string; value: number }>>;

	const vacancyCountSeries = Object.fromEntries(
		labourMonitor.map(monitor => [
			monitor.cluster_key,
			(monitor.vacancy.recent_counts ?? []).map(point => ({
				period: point.quarter,
				value: point.count
			}))
		])
	) as Record<ClusterKey, Array<{ period: string; value: number }>>;

	const vacancyRateChecks = buildYoYChecks(clusterRisk, vacancyRateSeries);
	const vacancyCountChecks = buildYoYChecks(clusterRisk, vacancyCountSeries);
	const hiringChecks = buildAnnualHiringChecks(clusterRisk, recruitmentRows);

	const result = {
		generated_at: new Date().toISOString(),
		model_version: 'V4.0',
		cluster_risk_order: Object.entries(clusterRisk).sort((a, b) => b[1] - a[1]),
		metrics: {
			vacancy_rate_yoy: {
				summary: summarizeMetric(vacancyRateChecks),
				periods: vacancyRateChecks
			},
			vacancy_count_yoy: {
				summary: summarizeMetric(vacancyCountChecks),
				periods: vacancyCountChecks
			},
			annual_hiring_net: {
				summary: summarizeMetric(hiringChecks),
				periods: hiringChecks
			}
		},
		interpretation: {
			strength:
				summarizeMetric(vacancyRateChecks).avg_pairwise_accuracy >= 0.66
					? 'Vacancy cooling is directionally consistent with structural risk across the available year-over-year quarters.'
					: 'Vacancy direction is mixed across the available year-over-year quarters.',
			caution:
				'Annual hiring pressure does not consistently rank with structural AI risk. Treat the score as a long-run pressure indicator, not a short-run demand forecaster.',
			scope:
				'These are cluster-level checks using only three labour clusters. They test rank-order robustness over time, not occupation-level predictive accuracy.'
		}
	};

	const serialized = JSON.stringify(result, null, 2) + '\n';
	for (const file of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, serialized, 'utf-8');
	}

	console.log('Built multi-period validation artifact');
	console.log(
		`  vacancy_rate_yoy periods=${vacancyRateChecks.length}, avg_accuracy=${result.metrics.vacancy_rate_yoy.summary.avg_pairwise_accuracy}`
	);
	console.log(
		`  vacancy_count_yoy periods=${vacancyCountChecks.length}, avg_accuracy=${result.metrics.vacancy_count_yoy.summary.avg_pairwise_accuracy}`
	);
	console.log(
		`  annual_hiring_net periods=${hiringChecks.length}, avg_accuracy=${result.metrics.annual_hiring_net.summary.avg_pairwise_accuracy}`
	);
}

main();
