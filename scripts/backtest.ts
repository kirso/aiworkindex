#!/usr/bin/env bun
/**
 * backtest.ts — Validate structural risk scores against actual labour outcomes.
 *
 * Compares average risk scores per labour cluster vs actual vacancy trends,
 * retrenchment incidence, and hiring net pressure from Q3 2025 data.
 *
 * Outputs:
 *   data/backtests/q3-2025-validation.json
 *
 * Methodology:
 *   - Group occupations by labour_monitor cluster (pmet, clerical_sales_service, production_transport)
 *   - Compute average net_risk, exposure, bottleneck per cluster
 *   - Compare against actual vacancy trend, retrenchment incidence, hiring net pressure
 *   - Compute Spearman rank correlation and directional accuracy
 *
 * Run: bun run scripts/backtest.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const OUTPUT_DIR = path.join(DATA_DIR, 'backtests');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'q3-2025-validation.json');

interface Occupation {
	ssoc: string;
	title: string;
	net_risk: number;
	exposure: number;
	bottleneck: number;
	risk_band: string;
	impact_type: string;
	labour_monitor_key: string | null;
}

interface LabourClusterMonitor {
	cluster_key: string;
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		trend_4q_pct: number;
		signal: number;
	};
	hiring: {
		recruitment_rate: number;
		resignation_rate: number;
		net_pressure: number;
		signal: number;
	} | null;
	retrenchment: {
		latest_count: number;
		trend_4q_pct: number;
		signal: number;
		incidence_per_1000?: number;
	} | null;
	re_entry?: {
		rate_6m: number;
		rate_12m: number;
	};
	overall: string;
}

interface ClusterStats {
	cluster_key: string;
	cluster_label: string;
	occupation_count: number;
	avg_net_risk: number;
	avg_exposure: number;
	avg_bottleneck: number;
	risk_band_distribution: Record<string, number>;
	impact_type_distribution: Record<string, number>;
	// Actual outcomes
	vacancy_rate: number;
	vacancy_trend_4q_pct: number;
	hiring_net_pressure: number | null;
	retrenchment_incidence: number | null;
	re_entry_rate_12m: number | null;
	overall_signal: string;
}

/**
 * Compute Spearman rank correlation between two arrays.
 */
function spearmanCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 3) return NaN;
	const n = x.length;

	function rank(arr: number[]): number[] {
		const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
		const ranks = new Array(n);
		for (let i = 0; i < n; i++) {
			ranks[sorted[i].i] = i + 1;
		}
		return ranks;
	}

	const rx = rank(x);
	const ry = rank(y);

	let sumD2 = 0;
	for (let i = 0; i < n; i++) {
		const d = rx[i] - ry[i];
		sumD2 += d * d;
	}

	return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function main() {
	console.log('=== Backtest: Risk Scores vs Labour Outcomes (Q3 2025) ===\n');

	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const labourMonitors: LabourClusterMonitor[] = JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf-8'));
	const labourMonitorByKey = new Map(labourMonitors.map(monitor => [monitor.cluster_key, monitor]));

	// Group by cluster
	const clusters = new Map<string, Occupation[]>();
	let withMonitor = 0;
	for (const occ of occupations) {
		if (!occ.labour_monitor_key || !labourMonitorByKey.has(occ.labour_monitor_key)) continue;
		withMonitor++;
		const key = occ.labour_monitor_key;
		const list = clusters.get(key) ?? [];
		list.push(occ);
		clusters.set(key, list);
	}

	console.log(`Occupations with labour_monitor: ${withMonitor}/${occupations.length}`);
	console.log(`Clusters: ${clusters.size}\n`);

	const clusterStats: ClusterStats[] = [];

	for (const [key, occs] of clusters) {
		const first = labourMonitorByKey.get(key)!;
		const avgRisk = occs.reduce((s, o) => s + o.net_risk, 0) / occs.length;
		const avgExposure = occs.reduce((s, o) => s + o.exposure, 0) / occs.length;
		const avgBottleneck = occs.reduce((s, o) => s + o.bottleneck, 0) / occs.length;

		// Band distribution
		const bandDist: Record<string, number> = {};
		const impactDist: Record<string, number> = {};
		for (const occ of occs) {
			bandDist[occ.risk_band] = (bandDist[occ.risk_band] || 0) + 1;
			impactDist[occ.impact_type] = (impactDist[occ.impact_type] || 0) + 1;
		}

		const stat: ClusterStats = {
			cluster_key: key,
			cluster_label: first.cluster_label,
			occupation_count: occs.length,
			avg_net_risk: Number(avgRisk.toFixed(4)),
			avg_exposure: Number(avgExposure.toFixed(4)),
			avg_bottleneck: Number(avgBottleneck.toFixed(4)),
			risk_band_distribution: bandDist,
			impact_type_distribution: impactDist,
			vacancy_rate: first.vacancy.latest_rate,
			vacancy_trend_4q_pct: first.vacancy.trend_4q_pct,
			hiring_net_pressure: first.hiring?.net_pressure ?? null,
			retrenchment_incidence: first.retrenchment?.incidence_per_1000 ?? null,
			re_entry_rate_12m: first.re_entry?.rate_12m ?? null,
			overall_signal: first.overall
		};

		clusterStats.push(stat);
		console.log(`${stat.cluster_label} (${stat.cluster_key}):`);
		console.log(`  Occupations: ${stat.occupation_count}`);
		console.log(`  Avg risk: ${(stat.avg_net_risk * 100).toFixed(1)}%`);
		console.log(`  Avg exposure: ${(stat.avg_exposure * 100).toFixed(1)}%`);
		console.log(
			`  Vacancy trend: ${stat.vacancy_trend_4q_pct > 0 ? '+' : ''}${stat.vacancy_trend_4q_pct.toFixed(1)}%`
		);
		console.log(`  Hiring net: ${stat.hiring_net_pressure ?? 'N/A'}`);
		console.log(`  Retrenchment/1000: ${stat.retrenchment_incidence ?? 'N/A'}`);
		console.log(`  Overall: ${stat.overall_signal}\n`);
	}

	// Sort clusters by avg_net_risk (highest first) for rank correlation
	const sorted = [...clusterStats].sort((a, b) => b.avg_net_risk - a.avg_net_risk);
	const _riskRanks = sorted.map(s => s.avg_net_risk);

	// Directional checks
	const checks: Array<{
		test: string;
		expected: string;
		actual: string;
		pass: boolean;
		note: string;
	}> = [];

	// Check 1: Higher risk clusters should have lower/declining vacancy growth
	const _riskByCluster = new Map(clusterStats.map(s => [s.cluster_key, s.avg_net_risk]));
	const _vacancyByCluster = new Map(clusterStats.map(s => [s.cluster_key, s.vacancy_trend_4q_pct]));

	if (clusterStats.length >= 2) {
		const risks = clusterStats.map(s => s.avg_net_risk);
		const vacancies = clusterStats.map(s => s.vacancy_trend_4q_pct);
		const rho = spearmanCorrelation(risks, vacancies);
		checks.push({
			test: 'Risk vs vacancy trend (Spearman)',
			expected: 'Negative correlation (higher risk → lower vacancy growth)',
			actual: `ρ = ${isNaN(rho) ? 'N/A (too few clusters)' : rho.toFixed(3)}`,
			pass: !isNaN(rho) && rho < 0,
			note: isNaN(rho)
				? 'Need ≥3 clusters for meaningful correlation'
				: rho < 0
					? 'Directionally consistent'
					: 'No negative relationship found — structural risk may not yet manifest in aggregate demand'
		});

		// Check 2: Higher risk clusters should have higher retrenchment
		const retrenchmentVals = clusterStats
			.filter(s => s.retrenchment_incidence != null)
			.map(s => s.retrenchment_incidence!);
		const matchedRisks = clusterStats
			.filter(s => s.retrenchment_incidence != null)
			.map(s => s.avg_net_risk);

		if (retrenchmentVals.length >= 2) {
			const rho2 = spearmanCorrelation(matchedRisks, retrenchmentVals);
			checks.push({
				test: 'Risk vs retrenchment incidence (Spearman)',
				expected: 'Positive correlation (higher risk → higher retrenchment)',
				actual: `ρ = ${isNaN(rho2) ? 'N/A' : rho2.toFixed(3)}`,
				pass: !isNaN(rho2) && rho2 > 0,
				note: isNaN(rho2)
					? 'Insufficient data'
					: rho2 > 0
						? 'Directionally consistent'
						: 'Structural risk scores do not yet predict short-run retrenchment patterns'
			});
		}

		// Check 3: Higher risk clusters should have lower hiring net pressure
		const hiringVals = clusterStats
			.filter(s => s.hiring_net_pressure != null)
			.map(s => s.hiring_net_pressure!);
		const matchedRisks2 = clusterStats
			.filter(s => s.hiring_net_pressure != null)
			.map(s => s.avg_net_risk);

		if (hiringVals.length >= 2) {
			const rho3 = spearmanCorrelation(matchedRisks2, hiringVals);
			checks.push({
				test: 'Risk vs hiring net pressure (Spearman)',
				expected: 'Negative correlation (higher risk → weaker hiring)',
				actual: `ρ = ${isNaN(rho3) ? 'N/A' : rho3.toFixed(3)}`,
				pass: !isNaN(rho3) && rho3 < 0,
				note: isNaN(rho3)
					? 'Insufficient data'
					: rho3 < 0
						? 'Directionally consistent'
						: 'Hiring pressure not yet reflecting structural AI risk differences across clusters'
			});
		}
	}

	// Directional accuracy: count how many "high risk" clusters have worse outcomes
	const highRiskClusters = clusterStats.filter(s => s.avg_net_risk > 0.2);
	const lowRiskClusters = clusterStats.filter(s => s.avg_net_risk <= 0.2);

	let directionalHits = 0;
	let directionalTotal = 0;

	for (const hi of highRiskClusters) {
		for (const lo of lowRiskClusters) {
			directionalTotal++;
			// High risk should have worse vacancy trend
			if (hi.vacancy_trend_4q_pct <= lo.vacancy_trend_4q_pct) {
				directionalHits++;
			}
		}
	}

	const directionalAccuracy =
		directionalTotal > 0 ? Number((directionalHits / directionalTotal).toFixed(3)) : null;

	checks.push({
		test: 'Directional accuracy (risk rank vs vacancy trend)',
		expected: 'High-risk clusters have equal or lower vacancy growth than low-risk',
		actual:
			directionalAccuracy != null
				? `${directionalHits}/${directionalTotal} = ${(directionalAccuracy * 100).toFixed(0)}%`
				: 'N/A (need both high and low risk clusters)',
		pass: directionalAccuracy != null && directionalAccuracy >= 0.5,
		note:
			directionalAccuracy != null && directionalAccuracy >= 0.5
				? 'Majority of pairwise comparisons are directionally correct'
				: 'Structural risk model captures long-run pressure, not short-run demand fluctuations'
	});

	// ===== Sub-major group analysis (2-digit SSOC) =====
	console.log('\n=== Sub-major Group Analysis ===\n');
	const subMajorGroups = new Map<string, { occs: Occupation[]; label: string }>();
	for (const occ of occupations) {
		const prefix = occ.ssoc.substring(0, 2);
		const group = subMajorGroups.get(prefix) ?? { occs: [], label: occ.major_group ?? prefix };
		group.occs.push(occ);
		subMajorGroups.set(prefix, group);
	}

	const subMajorStats = [...subMajorGroups.entries()]
		.filter(([_, g]) => g.occs.length >= 5)
		.map(([prefix, g]) => {
			const avgRisk = g.occs.reduce((s, o) => s + o.net_risk, 0) / g.occs.length;
			const avgWage = g.occs.reduce((s, o) => s + o.gross_wage_median, 0) / g.occs.length;
			const avgExposure = g.occs.reduce((s, o) => s + o.exposure, 0) / g.occs.length;
			return {
				prefix,
				label: g.label,
				count: g.occs.length,
				avg_net_risk: Number(avgRisk.toFixed(4)),
				avg_wage: Math.round(avgWage),
				avg_exposure: Number(avgExposure.toFixed(4))
			};
		})
		.sort((a, b) => b.avg_net_risk - a.avg_net_risk);

	console.log(`Sub-major groups with 5+ occupations: ${subMajorStats.length}`);
	for (const s of subMajorStats.slice(0, 10)) {
		console.log(
			`  ${s.prefix} ${s.label.substring(0, 40).padEnd(40)} | n=${String(s.count).padStart(3)} | risk=${(s.avg_net_risk * 100).toFixed(1).padStart(5)}% | wage=${String(s.avg_wage).padStart(6)}`
		);
	}

	// Cross-group risk-wage correlation (higher risk → lower wages as structural pressure signal)
	if (subMajorStats.length >= 5) {
		const smRisks = subMajorStats.map(s => s.avg_net_risk);
		const smWages = subMajorStats.map(s => s.avg_wage);
		const riskWageRho = spearmanCorrelation(smRisks, smWages);
		console.log(
			`\n  Risk vs wage correlation (n=${subMajorStats.length}): ρ = ${isNaN(riskWageRho) ? 'N/A' : riskWageRho.toFixed(3)}`
		);
		console.log(
			riskWageRho < 0
				? '  Negative: higher risk groups tend to have lower wages (consistent with structural pressure)'
				: '  Non-negative: higher risk groups do not systematically have lower wages'
		);
	}

	// Summary
	const passCount = checks.filter(c => c.pass).length;
	const totalChecks = checks.length;

	const result = {
		validation_date: new Date().toISOString().split('T')[0],
		data_period: 'Q3 2025',
		model_version: 'V4.0',
		cluster_stats: clusterStats,
		sub_major_group_stats: subMajorStats,
		correlation_checks: checks,
		directional_accuracy: directionalAccuracy,
		summary: {
			checks_passed: passCount,
			checks_total: totalChecks,
			interpretation:
				passCount >= totalChecks / 2
					? 'Structural risk scores show directional consistency with cluster-level labour outcomes. The model captures broad patterns but is not designed to predict short-run employment fluctuations.'
					: 'Structural risk scores show limited correlation with short-run labour outcomes at the cluster level. This is consistent with Brookings/PIIE (2026) findings that individual AI exposure scores are poor short-run predictors. The model captures long-run structural pressure, not cyclical employment patterns.',
			caveats: [
				'Only 3 labour clusters available — statistical power is very limited',
				'Cluster-level aggregation masks within-cluster variation',
				'Q3 2025 is a single observation — trends need multi-quarter validation',
				'Vacancy rates reflect overall demand, not AI-specific displacement',
				'V4.0: 4-source exposure ensemble (AIOE + Anthropic + Eloundou + ILO)'
			]
		}
	};

	console.log('\n=== Validation Results ===');
	for (const check of checks) {
		console.log(`${check.pass ? '✓' : '✗'} ${check.test}`);
		console.log(`  Expected: ${check.expected}`);
		console.log(`  Actual: ${check.actual}`);
		console.log(`  ${check.note}\n`);
	}

	console.log(`\nPassed: ${passCount}/${totalChecks}`);
	console.log(
		`Directional accuracy: ${directionalAccuracy != null ? (directionalAccuracy * 100).toFixed(0) + '%' : 'N/A'}`
	);

	// Write output
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
	console.log(`\nWritten to ${OUTPUT_FILE}`);
}

main();
