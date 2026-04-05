#!/usr/bin/env bun
/**
 * validate-labour-monitor.ts — Validate labour-monitor.json
 *
 * Checks:
 * - All 3 expected clusters present
 * - Quarter ordering correct
 * - No all-null series
 * - Overall signal distribution not degenerate
 * - Label honesty: no "occupation-level" language for cluster data
 *
 * Run: bun run scripts/validate-labour-monitor.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');

type ClusterKey = 'pmet' | 'clerical_sales_service' | 'production_transport';

const EXPECTED_CLUSTERS: ClusterKey[] = ['pmet', 'clerical_sales_service', 'production_transport'];

let errors = 0;
let warnings = 0;

function error(msg: string) {
	console.error(`  ERROR: ${msg}`);
	errors++;
}

function warn(msg: string) {
	console.warn(`  WARNING: ${msg}`);
	warnings++;
}

function ok(msg: string) {
	console.log(`  OK: ${msg}`);
}

function quarterSortKey(q: string): number {
	const match = q.match(/^(\d{4})\s+Q([1-4])$/);
	if (!match) return 0;
	return parseInt(match[1]) * 10 + parseInt(match[2]);
}

function main() {
	console.log('=== Validating Labour Monitor ===\n');

	// 1. File exists
	if (!fs.existsSync(MONITOR_FILE)) {
		error(`File not found: ${MONITOR_FILE}`);
		process.exit(1);
	}
	ok('labour-monitor.json exists');

	const raw = fs.readFileSync(MONITOR_FILE, 'utf-8');
	let monitors: any[];
	try {
		monitors = JSON.parse(raw);
	} catch (e) {
		error(`Invalid JSON: ${e}`);
		process.exit(1);
	}
	ok('Valid JSON');

	// 2. Is array
	if (!Array.isArray(monitors)) {
		error('Expected an array');
		process.exit(1);
	}

	// 3. All 3 clusters present
	const clusterKeys = monitors.map((m: any) => m.cluster_key);
	for (const expected of EXPECTED_CLUSTERS) {
		if (clusterKeys.includes(expected)) {
			ok(`Cluster present: ${expected}`);
		} else {
			error(`Missing cluster: ${expected}`);
		}
	}

	// 4. Exactly 3 clusters
	if (monitors.length !== 3) {
		error(`Expected 3 clusters, got ${monitors.length}`);
	} else {
		ok('Exactly 3 clusters');
	}

	// 5. Per-cluster validation
	for (const m of monitors) {
		const key = m.cluster_key;
		console.log(`\n  Validating cluster: ${key}`);

		// cluster_label present
		if (!m.cluster_label || typeof m.cluster_label !== 'string') {
			error(`${key}: missing or invalid cluster_label`);
		}

		// Vacancy data present
		if (!m.vacancy) {
			error(`${key}: missing vacancy signal`);
			continue;
		}

		if (typeof m.vacancy.latest_rate !== 'number') {
			error(`${key}: vacancy.latest_rate is not a number`);
		}

		if (typeof m.vacancy.latest_quarter !== 'string') {
			error(`${key}: vacancy.latest_quarter is not a string`);
		}

		if (typeof m.vacancy.trend_4q_pct !== 'number') {
			error(`${key}: vacancy.trend_4q_pct is not a number`);
		}

		if (![-1, 0, 1].includes(m.vacancy.signal)) {
			error(`${key}: vacancy.signal must be -1, 0, or 1`);
		}

		if (typeof m.vacancy.latest_count !== 'number') {
			error(`${key}: vacancy.latest_count is not a number`);
		}

		if (typeof m.vacancy.count_trend_4q_pct !== 'number') {
			error(`${key}: vacancy.count_trend_4q_pct is not a number`);
		}

		if (![-1, 0, 1].includes(m.vacancy.count_signal)) {
			error(`${key}: vacancy.count_signal must be -1, 0, or 1`);
		}

		// Check recent_quarters ordering (should be ascending for sparkline)
		const quarters = m.vacancy.recent_quarters;
		if (!Array.isArray(quarters) || quarters.length === 0) {
			error(`${key}: vacancy.recent_quarters is empty or not an array`);
		} else {
			ok(`${key}: ${quarters.length} recent quarters`);

			// Check ascending order
			let ordered = true;
			for (let i = 1; i < quarters.length; i++) {
				if (quarterSortKey(quarters[i].quarter) <= quarterSortKey(quarters[i - 1].quarter)) {
					ordered = false;
					break;
				}
			}
			if (ordered) {
				ok(`${key}: quarters in ascending order`);
			} else {
				error(`${key}: quarters not in ascending order`);
			}

			// Check no all-zero rates
			const allZero = quarters.every((q: any) => q.rate === 0 || q.rate === null);
			if (allZero) {
				error(`${key}: all vacancy rates are zero/null`);
			} else {
				ok(`${key}: vacancy rates have non-zero values`);
			}
		}

		const countQuarters = m.vacancy.recent_counts;
		if (!Array.isArray(countQuarters) || countQuarters.length === 0) {
			error(`${key}: vacancy.recent_counts is empty or not an array`);
		} else {
			ok(`${key}: ${countQuarters.length} recent vacancy-count quarters`);

			let ordered = true;
			for (let i = 1; i < countQuarters.length; i++) {
				if (
					quarterSortKey(countQuarters[i].quarter) <= quarterSortKey(countQuarters[i - 1].quarter)
				) {
					ordered = false;
					break;
				}
			}
			if (ordered) {
				ok(`${key}: vacancy-count quarters in ascending order`);
			} else {
				error(`${key}: vacancy-count quarters not in ascending order`);
			}

			const allZero = countQuarters.every((q: any) => q.count === 0 || q.count === null);
			if (allZero) {
				error(`${key}: all vacancy counts are zero/null`);
			} else {
				ok(`${key}: vacancy counts have non-zero values`);
			}
		}

		// Overall signal
		if (!['strong', 'moderate', 'weak', 'deteriorating'].includes(m.overall)) {
			error(`${key}: invalid overall signal: ${m.overall}`);
		} else {
			ok(`${key}: overall = ${m.overall}`);
		}

		// data_as_of
		if (!m.data_as_of || typeof m.data_as_of !== 'string') {
			error(`${key}: missing or invalid data_as_of`);
		}
	}

	// 6. Overall distribution check
	const overalls = monitors.map((m: any) => m.overall);
	const uniqueOveralls = new Set(overalls);
	if (uniqueOveralls.size === 1) {
		warn(`All clusters have same overall signal: ${overalls[0]} — may indicate data issue`);
	}

	// 7. Label honesty check — scan for forbidden language in JSON
	console.log('\n  Label honesty check...');
	const jsonStr = raw.toLowerCase();
	const forbiddenPhrases = [
		'occupation-level',
		'occupation level',
		'per-occupation',
		'per occupation',
		'individual occupation'
	];
	for (const phrase of forbiddenPhrases) {
		if (jsonStr.includes(phrase)) {
			error(
				`Label honesty violation: found "${phrase}" in labour-monitor.json — cluster data must not be labeled as occupation-level`
			);
		}
	}
	ok('No occupation-level claims found in data file');

	// Summary
	console.log('\n=== Validation Summary ===');
	console.log(`  Errors: ${errors}`);
	console.log(`  Warnings: ${warnings}`);

	if (errors > 0) {
		console.error('\nVALIDATION FAILED');
		process.exit(1);
	} else {
		console.log('\nVALIDATION PASSED');
	}
}

main();
