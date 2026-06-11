#!/usr/bin/env bun
/**
 * backtest-forecast-horizons.ts — Forecast-horizon harness (non-promoted sidecar).
 *
 * Tests whether cluster-level structural risk, FROZEN at the May 2026 V7
 * snapshot, predicts subsequent official labour outcomes at t+1Q, t+2Q, and
 * t+4Q. The protocol (frozen baseline, naive benchmark, pooled sign test,
 * promotion gate) is published now; correlations are computed only as
 * post-baseline quarters become available in the outcome panels.
 *
 * Current honest state: the labour monitor ends before the frozen baseline,
 * so post_baseline_quarters_available = 0 and no horizon test is possible
 * yet. The harness activates as MOM publishes Q3 2026+ data.
 *
 * Sidecar rules (enforced by validate.ts):
 *   - never folded into headline scores
 *   - never shown as SSOC-level evidence on occupation/role pages
 *
 * Outputs:
 *   data/backtests/forecast-horizon-validation.json
 *   src/lib/data/backtests/forecast-horizon-validation.json
 *   static/data/backtests/forecast-horizon-validation.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import { spearmanCorrelation } from '../src/lib/utils/validation-stats';

const ROOT_DIR = path.join(import.meta.dir, '..');
const SNAPSHOT_FILE = path.join(ROOT_DIR, 'data', 'snapshots', 'occupations-v7-2026-05.json');
const PANELS_FILE = path.join(ROOT_DIR, 'data', 'outcomes', 'outcome-panels.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'backtests', 'forecast-horizon-validation.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'forecast-horizon-validation.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'forecast-horizon-validation.json'
);

/** The frozen snapshot is dated May 2026 → baseline quarter 2026 Q2. */
const BASELINE_QUARTER = '2026 Q2';
const HORIZONS = [1, 2, 4] as const;
const PROMOTION_GATE_QUARTERS = 4;

interface SnapshotOccupation {
	ssoc: string;
	net_risk: number;
	labour_monitor_key: string | null;
}

interface PanelCluster {
	cluster_key: string;
	cluster_label: string;
	quarterly: Array<{ quarter: string; vacancy_rate?: number; retrenchment_count?: number }>;
}

function quarterIndex(quarter: string): number | null {
	const match = quarter.match(/^(\d{4}) Q([1-4])$/);
	if (!match) return null;
	return Number(match[1]) * 4 + Number(match[2]);
}

function quarterLabel(index: number): string {
	const year = Math.floor((index - 1) / 4);
	const q = ((index - 1) % 4) + 1;
	return `${year} Q${q}`;
}

function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

function main() {
	console.log('=== Forecast-Horizon Backtest (non-promoted sidecar) ===\n');

	const snapshot: SnapshotOccupation[] = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
	const panels: { latest_quarter: string; clusters: PanelCluster[] } = JSON.parse(
		fs.readFileSync(PANELS_FILE, 'utf-8')
	);

	// Cluster average net_risk from the FROZEN snapshot only.
	const clusterRisks = new Map<string, { sum: number; count: number }>();
	for (const occ of snapshot) {
		if (!occ.labour_monitor_key) continue;
		const entry = clusterRisks.get(occ.labour_monitor_key) ?? { sum: 0, count: 0 };
		entry.sum += occ.net_risk;
		entry.count += 1;
		clusterRisks.set(occ.labour_monitor_key, entry);
	}
	const frozenClusterRisk = [...clusterRisks.entries()].map(([cluster_key, entry]) => ({
		cluster_key,
		avg_net_risk: round4(entry.sum / entry.count),
		occupation_count: entry.count
	}));
	console.log(
		`Frozen baseline (${BASELINE_QUARTER}): ${frozenClusterRisk
			.map(cluster => `${cluster.cluster_key}=${cluster.avg_net_risk}`)
			.join(', ')}`
	);

	const baselineIndex = quarterIndex(BASELINE_QUARTER) ?? 0;
	const availableQuarterIndices = new Set<number>();
	for (const cluster of panels.clusters) {
		for (const row of cluster.quarterly) {
			const index = quarterIndex(row.quarter);
			if (index !== null && index > baselineIndex) availableQuarterIndices.add(index);
		}
	}
	const postBaselineQuarters = availableQuarterIndices.size;
	console.log(
		`Post-baseline quarters available: ${postBaselineQuarters} (panels end ${panels.latest_quarter}, baseline ${BASELINE_QUARTER})`
	);

	// Compute horizon correlations only where outcome data exists.
	const risksInOrder = panels.clusters.map(
		cluster =>
			frozenClusterRisk.find(entry => entry.cluster_key === cluster.cluster_key)?.avg_net_risk ??
			NaN
	);
	const horizons = HORIZONS.map(horizon => {
		const targetIndex = baselineIndex + horizon;
		const targetQuarter = quarterLabel(targetIndex);
		if (!availableQuarterIndices.has(targetIndex)) {
			return {
				horizon: `t+${horizon}Q`,
				target_quarter: targetQuarter,
				status: 'no_data_yet' as const,
				outcomes: null
			};
		}
		const outcomes = (['vacancy_rate', 'retrenchment_count'] as const).map(outcomeKey => {
			const baselineValues: number[] = [];
			const realizedChanges: number[] = [];
			panels.clusters.forEach((cluster, clusterIdx) => {
				const baseRow = cluster.quarterly.find(row => quarterIndex(row.quarter) === baselineIndex);
				const targetRow = cluster.quarterly.find(row => quarterIndex(row.quarter) === targetIndex);
				const base = baseRow?.[outcomeKey];
				const target = targetRow?.[outcomeKey];
				if (base !== undefined && target !== undefined) {
					baselineValues.push(risksInOrder[clusterIdx]);
					realizedChanges.push(target - base);
				}
			});
			return {
				outcome: outcomeKey,
				cluster_count: baselineValues.length,
				spearman_risk_vs_realized_change:
					baselineValues.length >= 3
						? round4(spearmanCorrelation(baselineValues, realizedChanges))
						: null
			};
		});
		return {
			horizon: `t+${horizon}Q`,
			target_quarter: targetQuarter,
			status: 'computed' as const,
			outcomes
		};
	});

	const status: 'pending_sufficient_quarters' | 'directional' =
		postBaselineQuarters >= 1 ? 'directional' : 'pending_sufficient_quarters';

	const payload = {
		validation_date: new Date().toISOString().split('T')[0],
		model_version: DATA_VINTAGE.model_version,
		non_promoted: true,
		sidecar_rules: [
			'Never folded into headline scores.',
			'Never shown as SSOC-level evidence on occupation or role pages.',
			'Activates only as official post-baseline quarters land; no forecast claim is made before the promotion gate.'
		],
		frozen_baseline: {
			snapshot_file: 'data/snapshots/occupations-v7-2026-05.json',
			baseline_quarter: BASELINE_QUARTER,
			cluster_risk: frozenClusterRisk
		},
		post_baseline_quarters_available: postBaselineQuarters,
		status,
		horizons,
		protocol: {
			design:
				'Cluster-level structural risk frozen at the baseline snapshot is rank-correlated (tie-corrected Spearman) against realized changes in official outcomes at t+1Q, t+2Q, and t+4Q, with directional calls pooled across quarters and outcomes into an exact binomial sign test.',
			outcomes_v1: ['vacancy_rate', 'retrenchment_count'],
			naive_benchmark:
				'Random-walk (no-change) and historical-trend continuation. The frozen ranking must beat the naive benchmark before any forecast-skill claim is made.',
			pooling_rule:
				'Directional calls accumulate across quarters and outcomes toward a sample where an exact binomial sign test has power (~24 calls after ~8 quarters); no pass/fail claim is published from underpowered samples.',
			promotion_gate: `At least ${PROMOTION_GATE_QUARTERS} post-baseline quarters of official outcome data before any result is promoted beyond this sidecar.`,
			pre_registration:
				'The frozen snapshot is committed in-repo (git-timestamped) before outcome data exists; the protocol above is published with zero post-baseline quarters so the test cannot be tuned after seeing outcomes.'
		},
		summary:
			postBaselineQuarters === 0
				? `Harness built and protocol published. The labour monitor ends at ${panels.latest_quarter}, which precedes the frozen ${BASELINE_QUARTER} baseline, so no horizon test is possible yet — status is pending_sufficient_quarters. No forecast evidence exists or is claimed.`
				: `${postBaselineQuarters} post-baseline quarter(s) available; directional horizon results computed where outcome data exists. Promotion gate: ${PROMOTION_GATE_QUARTERS} quarters.`,
		caveats: [
			'Three clusters only — any single-quarter directional result is statistically uninformative on its own; only the pooled sign test across quarters and outcomes carries evidential weight.',
			'Hiring net pressure and re-entry rates are published as latest-quarter snapshots, not quarterly series, so v1 horizons cover vacancy rate and retrenchment count only.',
			'Postings volume, AI-skill share, and wage movement are reserved for v2 panels per forecast-readiness.',
			'This artifact is a sidecar: it never feeds headline scores and is not occupation-level evidence.'
		]
	};

	for (const filePath of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
	}
	console.log(`Status: ${status}`);
	console.log(`Built forecast-horizon validation at ${OUTPUT_FILE}`);
}

main();
