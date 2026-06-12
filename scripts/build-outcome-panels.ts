#!/usr/bin/env bun
/**
 * build-outcome-panels.ts — Materialize quarterly cluster-level outcome panels
 * from the official labour monitor, for the forecast-horizon backtest harness.
 *
 * v1 scope (deliberately boring): official MOM labour outcomes only — vacancy
 * rate, retrenchment count (the two fields with quarterly series), plus the
 * latest-quarter hiring (recruitment − resignation) and re-entry snapshots.
 * Postings volume, AI-skill share, and wage movement are reserved as null:
 * per data/forecast-readiness.json they need scheduled postings snapshots, a
 * skills dictionary + denominator + time series, and a multi-year nominal +
 * CPI-adjusted transform respectively before they are valid outcomes.
 *
 * References existing owners; adds no new realized-risk model.
 *
 * Output: data/outcomes/outcome-panels.json (pipeline input, not a public artifact)
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const MONITOR_FILE = path.join(ROOT_DIR, 'data', 'labour-monitor.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'outcomes', 'outcome-panels.json');

const QUARTER_PATTERN = /^(\d{4}) Q([1-4])$/;

interface ClusterMonitor {
	cluster_key: string;
	cluster_label: string;
	data_as_of: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		recent_quarters: Array<{ quarter: string; rate: number }>;
	};
	hiring: {
		recruitment_rate: number;
		resignation_rate: number;
		net_pressure: number;
		quarter: string;
	};
	retrenchment: {
		latest_count: number;
		latest_quarter: string;
		trend_4q_pct: number;
		recent_quarters: Array<{ quarter: string; count: number }>;
	};
	re_entry: { rate_6m: number; rate_12m: number; quarter: string };
}

function quarterIndex(quarter: string): number | null {
	const match = quarter.match(QUARTER_PATTERN);
	if (!match) return null;
	return Number(match[1]) * 4 + Number(match[2]);
}

function main() {
	console.log('=== Outcome Panels (v1: official labour outcomes) ===\n');
	const monitors: ClusterMonitor[] = JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf-8'));

	let latestQuarter = '';
	let latestIndex = -1;

	const clusters = monitors.map(monitor => {
		// Merge the quarterly series (annual entries like "2022" are excluded).
		const byQuarter = new Map<string, { vacancy_rate?: number; retrenchment_count?: number }>();
		for (const entry of monitor.vacancy.recent_quarters) {
			if (quarterIndex(entry.quarter) === null) continue;
			byQuarter.set(entry.quarter, {
				...byQuarter.get(entry.quarter),
				vacancy_rate: entry.rate
			});
		}
		for (const entry of monitor.retrenchment.recent_quarters) {
			if (quarterIndex(entry.quarter) === null) continue;
			byQuarter.set(entry.quarter, {
				...byQuarter.get(entry.quarter),
				retrenchment_count: entry.count
			});
		}
		const quarterly = [...byQuarter.entries()]
			.map(([quarter, values]) => ({ quarter, ...values }))
			.sort((a, b) => (quarterIndex(a.quarter) ?? 0) - (quarterIndex(b.quarter) ?? 0));

		const last = quarterly[quarterly.length - 1];
		const lastIndex = last ? (quarterIndex(last.quarter) ?? -1) : -1;
		if (lastIndex > latestIndex) {
			latestIndex = lastIndex;
			latestQuarter = last?.quarter ?? '';
		}

		return {
			cluster_key: monitor.cluster_key,
			cluster_label: monitor.cluster_label,
			data_as_of: monitor.data_as_of,
			quarterly,
			latest: {
				quarter: monitor.vacancy.latest_quarter,
				vacancy_rate: monitor.vacancy.latest_rate,
				vacancy_trend_4q_pct: monitor.vacancy.trend_4q_pct,
				hiring_recruitment_rate: monitor.hiring.recruitment_rate,
				hiring_resignation_rate: monitor.hiring.resignation_rate,
				hiring_net_pressure: monitor.hiring.net_pressure,
				retrenchment_count: monitor.retrenchment.latest_count,
				retrenchment_trend_4q_pct: monitor.retrenchment.trend_4q_pct,
				re_entry_rate_6m: monitor.re_entry.rate_6m,
				re_entry_rate_12m: monitor.re_entry.rate_12m
			}
		};
	});

	const payload = {
		generated_date: new Date().toISOString().split('T')[0],
		model_version: DATA_VINTAGE.model_version,
		provenance: {
			source: 'data/labour-monitor.json',
			owners: ['scripts/build-labour-monitor.ts'],
			note: 'Official MOM labour outcomes re-shaped into cluster-quarter panels. No new realized-risk model; values are copied, not derived.'
		},
		latest_quarter: latestQuarter,
		outcomes_v1: ['vacancy_rate', 'retrenchment_count', 'hiring_net_pressure', 're_entry_rate'],
		reserved_v2_outcomes: {
			postings_volume: null,
			ai_skill_share: null,
			wage_movement: null,
			note: 'Deferred per forecast-readiness: postings need scheduled snapshots, AI-skill share needs a fixed dictionary + denominator + time series, and wage movement needs a multi-year nominal + CPI-adjusted transform before use as outcomes.'
		},
		clusters
	};

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
	console.log(
		`Clusters: ${clusters.length}; latest quarter: ${latestQuarter}; quarterly rows: ${clusters
			.map(cluster => cluster.quarterly.length)
			.join('/')}`
	);
	console.log(`Built outcome panels at ${OUTPUT_FILE}`);
}

main();
