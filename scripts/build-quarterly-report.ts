#!/usr/bin/env bun
/**
 * build-quarterly-report.ts — Generate quarterly snapshot and diff report.
 *
 * 1. Saves current occupations.json as a dated snapshot
 * 2. If a prior snapshot exists, computes:
 *    - Band movers (occupations that changed risk band)
 *    - Score drifters (largest net_risk changes)
 *    - Demand changes (new/removed SOL/JiD matches)
 * 3. Writes a report summary JSON for the reports page
 *
 * Run: bun run scripts/build-quarterly-report.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const CURRENT_FILE = path.join(DATA_DIR, 'occupations.json');
const REPORT_DIR = path.join(DATA_DIR, 'reports');

interface Occupation {
	ssoc: string;
	title: string;
	net_risk: number;
	risk_band: string;
	impact_type: string;
	exposure: number;
	bottleneck: number;
	market: { market_resilience: number };
	evidence: {
		sol_match: string | false;
		jobs_in_demand_match: string | false;
	};
}

interface BandMover {
	ssoc: string;
	title: string;
	from_band: string;
	to_band: string;
	risk_delta: number;
}

interface DriftEntry {
	ssoc: string;
	title: string;
	old_risk: number;
	new_risk: number;
	delta: number;
}

interface QuarterlyReport {
	generated_at: string;
	current_snapshot: string;
	previous_snapshot: string | null;
	total_occupations: number;
	band_distribution: Record<string, number>;
	band_movers: BandMover[];
	top_risers: DriftEntry[];
	top_fallers: DriftEntry[];
	demand_changes: {
		new_sol: string[];
		removed_sol: string[];
		new_jid: string[];
		removed_jid: string[];
	};
}

function main() {
	console.log('=== Quarterly Report Builder ===\n');

	if (!fs.existsSync(CURRENT_FILE)) {
		console.error('ERROR: occupations.json not found. Run score.ts first.');
		process.exit(1);
	}

	fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
	fs.mkdirSync(REPORT_DIR, { recursive: true });

	const current: Occupation[] = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
	console.log(`Current data: ${current.length} occupations`);

	// Save current as snapshot
	const now = new Date();
	const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
	const snapshotName = `occupations-v3-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.json`;
	const snapshotPath = path.join(SNAPSHOTS_DIR, snapshotName);

	if (!fs.existsSync(snapshotPath)) {
		fs.writeFileSync(snapshotPath, JSON.stringify(current, null, 2));
		console.log(`Saved snapshot: ${snapshotName}`);
	} else {
		console.log(`Snapshot already exists: ${snapshotName}`);
	}

	// Find previous snapshot
	const snapshots = fs
		.readdirSync(SNAPSHOTS_DIR)
		.filter(f => f.startsWith('occupations-') && f.endsWith('.json'))
		.sort()
		.reverse();

	const previousSnapshot = snapshots.length > 1 ? snapshots[1] : null;

	// Band distribution
	const bandDist: Record<string, number> = {};
	for (const occ of current) {
		bandDist[occ.risk_band] = (bandDist[occ.risk_band] || 0) + 1;
	}

	const report: QuarterlyReport = {
		generated_at: now.toISOString(),
		current_snapshot: snapshotName,
		previous_snapshot: previousSnapshot,
		total_occupations: current.length,
		band_distribution: bandDist,
		band_movers: [],
		top_risers: [],
		top_fallers: [],
		demand_changes: {
			new_sol: [],
			removed_sol: [],
			new_jid: [],
			removed_jid: []
		}
	};

	if (previousSnapshot) {
		console.log(`\nComparing with: ${previousSnapshot}`);
		const previous: Occupation[] = JSON.parse(
			fs.readFileSync(path.join(SNAPSHOTS_DIR, previousSnapshot), 'utf-8')
		);

		const prevMap = new Map(previous.map(o => [o.ssoc, o]));

		// Band movers
		for (const occ of current) {
			const prev = prevMap.get(occ.ssoc);
			if (prev && prev.risk_band !== occ.risk_band) {
				report.band_movers.push({
					ssoc: occ.ssoc,
					title: occ.title,
					from_band: prev.risk_band,
					to_band: occ.risk_band,
					risk_delta: occ.net_risk - prev.net_risk
				});
			}
		}

		// Score drift
		const drifts: DriftEntry[] = [];
		for (const occ of current) {
			const prev = prevMap.get(occ.ssoc);
			if (prev) {
				drifts.push({
					ssoc: occ.ssoc,
					title: occ.title,
					old_risk: prev.net_risk,
					new_risk: occ.net_risk,
					delta: occ.net_risk - prev.net_risk
				});
			}
		}
		drifts.sort((a, b) => b.delta - a.delta);
		report.top_risers = drifts.filter(d => d.delta > 0).slice(0, 10);
		report.top_fallers = drifts
			.filter(d => d.delta < 0)
			.sort((a, b) => a.delta - b.delta)
			.slice(0, 10);

		// Demand changes
		for (const occ of current) {
			const prev = prevMap.get(occ.ssoc);
			if (!prev) continue;
			if (occ.evidence.sol_match && !prev.evidence.sol_match) {
				report.demand_changes.new_sol.push(occ.title);
			}
			if (!occ.evidence.sol_match && prev.evidence.sol_match) {
				report.demand_changes.removed_sol.push(occ.title);
			}
			if (occ.evidence.jobs_in_demand_match && !prev.evidence.jobs_in_demand_match) {
				report.demand_changes.new_jid.push(occ.title);
			}
			if (!occ.evidence.jobs_in_demand_match && prev.evidence.jobs_in_demand_match) {
				report.demand_changes.removed_jid.push(occ.title);
			}
		}

		console.log(`  Band movers: ${report.band_movers.length}`);
		console.log(`  Top risers: ${report.top_risers.length}`);
		console.log(`  Top fallers: ${report.top_fallers.length}`);
	} else {
		console.log('\nNo previous snapshot found — first report (baseline only).');
	}

	// Write report
	const reportName = `quarterly-${now.getFullYear()}-${quarter}.json`;
	const reportPath = path.join(REPORT_DIR, reportName);
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	console.log(`\nReport written: ${reportPath}`);
	console.log(`Band distribution: ${JSON.stringify(bandDist)}`);
}

main();
