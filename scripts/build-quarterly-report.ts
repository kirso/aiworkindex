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
const MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const REPORT_DIR = path.join(DATA_DIR, 'reports');
const SRC_DATA_DIR = path.join(import.meta.dir, '..', 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(import.meta.dir, '..', 'static', 'data');

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
	labour_monitor?: {
		data_as_of: string;
		source: string | null;
		strongest_vacancy_pickup: string | null;
		sharpest_vacancy_cooling: string | null;
		clusters: Array<{
			cluster_key: string;
			cluster_label: string;
			overall: string;
			summary: string | null;
			vacancy_rate: number;
			vacancy_qoq_delta_pp: number | null;
			vacancy_count: number | null;
			vacancy_count_qoq_delta: number | null;
			recruitment_rate: number | null;
			recruitment_delta_pp: number | null;
			resignation_rate: number | null;
			resignation_delta_pp: number | null;
			retrenchment_count: number | null;
			retrenchment_qoq_delta_count: number | null;
			reentry_6m: number | null;
			reentry_6m_delta_pp: number | null;
			reentry_12m: number | null;
			reentry_12m_delta_pp: number | null;
		}>;
	};
	summary?: {
		band_mover_count: number;
		positive_drift_count: number;
		negative_drift_count: number;
	};
	briefing?: {
		what_changed: string[];
		why_it_matters: string[];
		what_to_watch: string[];
	};
}

interface LabourMonitorCluster {
	cluster_key: string;
	cluster_label: string;
	overall: string;
	summary?: string | null;
	data_as_of: string;
	source?: string;
	vacancy: {
		latest_rate: number;
		qoq_delta_pp?: number;
		latest_count?: number;
		count_qoq_delta?: number;
	};
	hiring: {
		recruitment_rate: number;
		recruitment_delta_pp?: number;
		resignation_rate: number;
		resignation_delta_pp?: number;
	} | null;
	retrenchment: {
		latest_count: number;
		qoq_delta_count?: number;
	} | null;
	re_entry?: {
		rate_6m: number;
		rate_6m_delta_pp?: number;
		rate_12m: number;
		rate_12m_delta_pp?: number;
	};
}

function main() {
	console.log('=== Quarterly Report Builder ===\n');

	if (!fs.existsSync(CURRENT_FILE)) {
		console.error('ERROR: occupations.json not found. Run score.ts first.');
		process.exit(1);
	}
	if (!fs.existsSync(MONITOR_FILE)) {
		console.error(
			'ERROR: labour-monitor.json not found. Run scripts/build-labour-monitor.ts first.'
		);
		process.exit(1);
	}

	fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
	fs.mkdirSync(REPORT_DIR, { recursive: true });

	const current: Occupation[] = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
	const labourMonitor: LabourMonitorCluster[] = JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf-8'));
	console.log(`Current data: ${current.length} occupations`);

	// Save current as snapshot
	const now = new Date();
	const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
	const snapshotName = `occupations-v4-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.json`;
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
		},
		labour_monitor: buildLabourMonitorSummary(labourMonitor)
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
	report.summary = {
		band_mover_count: report.band_movers.length,
		positive_drift_count: report.top_risers.length,
		negative_drift_count: report.top_fallers.length
	};
	report.briefing = buildBriefing(report);

	const serialized = JSON.stringify(report, null, 2) + '\n';
	fs.writeFileSync(reportPath, serialized, 'utf-8');
	fs.writeFileSync(path.join(REPORT_DIR, 'quarterly-latest.json'), serialized, 'utf-8');
	fs.writeFileSync(path.join(SRC_DATA_DIR, 'quarterly-report.json'), serialized, 'utf-8');
	fs.writeFileSync(path.join(STATIC_DATA_DIR, 'quarterly-report.json'), serialized, 'utf-8');
	console.log(`\nReport written: ${reportPath}`);
	console.log(`Band distribution: ${JSON.stringify(bandDist)}`);
}

function buildLabourMonitorSummary(clusters: LabourMonitorCluster[]) {
	const mapped = clusters.map(cluster => ({
		cluster_key: cluster.cluster_key,
		cluster_label: cluster.cluster_label,
		overall: cluster.overall,
		summary: cluster.summary ?? null,
		vacancy_rate: cluster.vacancy.latest_rate,
		vacancy_qoq_delta_pp: cluster.vacancy.qoq_delta_pp ?? null,
		vacancy_count: cluster.vacancy.latest_count ?? null,
		vacancy_count_qoq_delta: cluster.vacancy.count_qoq_delta ?? null,
		recruitment_rate: cluster.hiring?.recruitment_rate ?? null,
		recruitment_delta_pp: cluster.hiring?.recruitment_delta_pp ?? null,
		resignation_rate: cluster.hiring?.resignation_rate ?? null,
		resignation_delta_pp: cluster.hiring?.resignation_delta_pp ?? null,
		retrenchment_count: cluster.retrenchment?.latest_count ?? null,
		retrenchment_qoq_delta_count: cluster.retrenchment?.qoq_delta_count ?? null,
		reentry_6m: cluster.re_entry?.rate_6m ?? null,
		reentry_6m_delta_pp: cluster.re_entry?.rate_6m_delta_pp ?? null,
		reentry_12m: cluster.re_entry?.rate_12m ?? null,
		reentry_12m_delta_pp: cluster.re_entry?.rate_12m_delta_pp ?? null
	}));

	const strongestVacancyPickup =
		mapped
			.filter(cluster => typeof cluster.vacancy_qoq_delta_pp === 'number')
			.sort((a, b) => (b.vacancy_qoq_delta_pp ?? 0) - (a.vacancy_qoq_delta_pp ?? 0))[0]
			?.cluster_label ?? null;
	const sharpestVacancyCooling =
		mapped
			.filter(cluster => typeof cluster.vacancy_qoq_delta_pp === 'number')
			.sort((a, b) => (a.vacancy_qoq_delta_pp ?? 0) - (b.vacancy_qoq_delta_pp ?? 0))[0]
			?.cluster_label ?? null;

	return {
		data_as_of: clusters[0]?.data_as_of ?? '',
		source: clusters[0]?.source ?? null,
		strongest_vacancy_pickup: strongestVacancyPickup,
		sharpest_vacancy_cooling: sharpestVacancyCooling,
		clusters: mapped
	};
}

function buildBriefing(report: QuarterlyReport) {
	const labour = report.labour_monitor;
	const strongestPickup = labour?.strongest_vacancy_pickup;
	const sharpestCooling = labour?.sharpest_vacancy_cooling;
	const strongestCluster = labour?.clusters.find(cluster => cluster.overall === 'strong');
	const weakestCluster = labour?.clusters.find(cluster => cluster.overall === 'deteriorating');
	const topRiser = report.top_risers[0];
	const topFaller = report.top_fallers[0];

	return {
		what_changed: [
			report.band_movers.length > 0
				? `${report.band_movers.length} occupations changed risk band between ${report.previous_snapshot} and ${report.current_snapshot}.`
				: 'No occupations changed risk band in the latest frozen comparison.',
			strongestPickup && sharpestCooling
				? `${strongestPickup} saw the strongest vacancy pickup while ${sharpestCooling} saw the sharpest vacancy cooling in the live labour monitor.`
				: 'The labour monitor refreshed with new vacancy, hiring, retrenchment, and re-entry deltas.',
			topRiser && topFaller
				? `Top structural riser: ${topRiser.title}. Top structural faller: ${topFaller.title}.`
				: 'Structural movers remain limited in the latest snapshot comparison.'
		],
		why_it_matters: [
			weakestCluster
				? `${weakestCluster.cluster_label} now reads as ${weakestCluster.overall}, which means structural pressure is landing on a weaker live labour backdrop for that family of work.`
				: 'The weaker live labour clusters deserve the closest reading because structural pressure lands differently when demand is softening.',
			strongestCluster
				? `${strongestCluster.cluster_label} still reads as ${strongestCluster.overall}, so not every high-exposure occupation faces the same near-term labour conditions.`
				: 'The live labour monitor still separates structural pressure from current demand conditions.'
		],
		what_to_watch: [
			labour?.clusters.some(cluster => (cluster.retrenchment_qoq_delta_count ?? 0) > 0)
				? 'Watch whether rising retrenchment counts persist into the next quarter rather than treating one quarter as a trend.'
				: 'Watch whether retrenchment remains contained even where vacancy growth is cooling.',
			report.demand_changes.new_sol.length + report.demand_changes.new_jid.length > 0
				? `Watch whether the new official demand additions (${report.demand_changes.new_sol.length + report.demand_changes.new_jid.length}) persist in the next release cycle.`
				: 'Watch whether official demand lists change meaningfully in the next release cycle.',
			'Read snapshot movers together with the live monitor, not as standalone proof of labour-market deterioration.'
		]
	};
}

main();
