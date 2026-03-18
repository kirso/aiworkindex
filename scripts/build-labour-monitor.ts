#!/usr/bin/env bun
/**
 * build-labour-monitor.ts — Parse official MOM/SingStat CSVs and compute
 * per-cluster labour signals. Outputs data/labour-monitor.json.
 *
 * Signals:
 *   - Vacancy: 4Q-over-4Q average trend, latest rate, 8Q sparkline
 *   - Hiring: recruitment - resignation rates (if CSV available)
 *   - Retrenchment: count + trend (if CSV available)
 *   - Overall: deterministic rules engine
 *
 * Run: bun run scripts/build-labour-monitor.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const OUT_FILE = path.join(DATA_DIR, 'labour-monitor.json');

// ===== Types =====
type ClusterKey = 'pmet' | 'clerical_sales_service' | 'production_transport';

interface VacancySignal {
	latest_rate: number;
	latest_quarter: string;
	trend_4q_pct: number;
	signal: 1 | 0 | -1;
	recent_quarters: Array<{ quarter: string; rate: number }>;
}

interface HiringSignal {
	recruitment_rate: number;
	resignation_rate: number;
	net_pressure: number;
	signal: 1 | 0 | -1;
}

interface RetrenchmentSignal {
	latest_count: number;
	latest_quarter: string;
	trend_4q_pct: number;
	signal: 1 | 0 | -1;
	recent_quarters: Array<{ quarter: string; count: number }>;
}

interface LabourClusterMonitor {
	cluster_key: ClusterKey;
	cluster_label: string;
	vacancy: VacancySignal;
	hiring: HiringSignal | null;
	retrenchment: RetrenchmentSignal | null;
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	data_as_of: string;
}

// ===== CSV parsing =====
const CLUSTER_CSV_NAMES: Record<ClusterKey, string> = {
	pmet: 'professional, managers, executive and technicians',
	clerical_sales_service: 'clerical, sales and services workers',
	production_transport: 'production and transport operators, cleaners and labourers'
};

const CLUSTER_LABELS: Record<ClusterKey, string> = {
	pmet: 'Professionals, Managers, Executives & Technicians',
	clerical_sales_service: 'Clerical, Sales & Service Workers',
	production_transport: 'Production & Transport Operators, Cleaners & Labourers'
};

function parseCSVRow(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current.trim());
	return result;
}

function parseQuarter(token: string): string | null {
	const cleaned = token.replace(/^"+|"+$/g, '').trim();
	// Match formats like "2024-Q4", "2024Q4", "2024 Q4"
	let match = cleaned.match(/^(\d{4})[-\s]?Q([1-4])$/);
	if (match) return `${match[1]} Q${match[2]}`;
	// Also match "2024-Q4" format
	match = cleaned.match(/^(\d{4})-Q([1-4])$/);
	if (match) return `${match[1]} Q${match[2]}`;
	return null;
}

function quarterSortKey(q: string): number {
	const match = q.match(/^(\d{4})\s+Q([1-4])$/);
	if (!match) return 0;
	return parseInt(match[1]) * 10 + parseInt(match[2]);
}

// ===== Parse vacancy rates CSV =====
// Format: quarter,industry1,industry2,occupation1,job_vacancy_rate
// We want rows where industry1="total" AND industry2="total" (economy-wide)
function parseVacancyRates(): Map<ClusterKey, Array<{ quarter: string; rate: number }>> {
	const filePath = path.join(RAW_DIR, 'vacancy_rates_by_occupation_group.csv');
	if (!fs.existsSync(filePath)) {
		console.error('ERROR: vacancy_rates_by_occupation_group.csv not found!');
		process.exit(1);
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	const header = parseCSVRow(lines[0]);

	// Find column indices
	const quarterIdx = header.findIndex(h => h.toLowerCase().includes('quarter'));
	const industry1Idx = header.findIndex(h => h.toLowerCase().includes('industry1'));
	const industry2Idx = header.findIndex(h => h.toLowerCase().includes('industry2'));
	const occupationIdx = header.findIndex(h => h.toLowerCase().includes('occupation'));
	const rateIdx = header.findIndex(
		h => h.toLowerCase().includes('vacancy_rate') || h.toLowerCase().includes('job_vacancy_rate')
	);

	if (quarterIdx < 0 || rateIdx < 0 || occupationIdx < 0) {
		console.error('ERROR: Cannot find required columns in vacancy CSV');
		console.error('Headers found:', header);
		process.exit(1);
	}

	const result = new Map<ClusterKey, Array<{ quarter: string; rate: number }>>();
	for (const key of Object.keys(CLUSTER_CSV_NAMES) as ClusterKey[]) {
		result.set(key, []);
	}

	for (let i = 1; i < lines.length; i++) {
		const fields = parseCSVRow(lines[i]);
		if (fields.length < Math.max(quarterIdx, rateIdx, occupationIdx) + 1) continue;

		// Filter: economy-wide only (industry1=total, industry2=total)
		const ind1 = fields[industry1Idx]?.toLowerCase().replace(/"/g, '').trim();
		const ind2 = fields[industry2Idx]?.toLowerCase().replace(/"/g, '').trim();
		if (ind1 !== 'total' || ind2 !== 'total') continue;

		const occLabel = fields[occupationIdx]?.toLowerCase().replace(/"/g, '').trim();
		const rateStr = fields[rateIdx]?.replace(/"/g, '').trim();
		const quarterStr = fields[quarterIdx]?.replace(/"/g, '').trim();

		// Skip total rows and non-numeric rates
		if (occLabel === 'total') continue;
		if (rateStr === '-' || rateStr === 'na' || rateStr === '') continue;
		const rate = parseFloat(rateStr);
		if (isNaN(rate)) continue;

		const quarter = parseQuarter(quarterStr);
		if (!quarter) continue;

		// Map occupation label to cluster
		for (const [key, csvName] of Object.entries(CLUSTER_CSV_NAMES) as Array<[ClusterKey, string]>) {
			if (occLabel === csvName) {
				result.get(key)!.push({ quarter, rate });
				break;
			}
		}
	}

	// Sort each cluster by quarter descending
	for (const [, series] of result) {
		series.sort((a, b) => quarterSortKey(b.quarter) - quarterSortKey(a.quarter));
	}

	return result;
}

// ===== Parse recruitment/resignation CSV (if available) =====
function parseRecruitmentResignation(): Map<
	ClusterKey,
	{ recruitment_4q_avg: number; resignation_4q_avg: number }
> | null {
	const filePath = path.join(RAW_DIR, 'recruitment_resignation_rates.csv');
	if (!fs.existsSync(filePath)) {
		console.log('  INFO: recruitment_resignation_rates.csv not found, skipping hiring signal');
		return null;
	}

	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const lines = content.split('\n').filter(l => l.trim());
		if (lines.length < 2) return null;

		// Parse and extract data (structure may vary)
		console.log('  Found recruitment/resignation CSV, parsing...');
		// TODO: implement when CSV format is known
		return null;
	} catch {
		console.log('  WARNING: Error reading recruitment/resignation CSV');
		return null;
	}
}

// ===== Parse retrenchment CSV (if available) =====
function parseRetrenchment(): Map<ClusterKey, Array<{ quarter: string; count: number }>> | null {
	const filePath = path.join(RAW_DIR, 'retrenchment_by_occupation_group.csv');
	if (!fs.existsSync(filePath)) {
		console.log(
			'  INFO: retrenchment_by_occupation_group.csv not found, skipping retrenchment signal'
		);
		return null;
	}

	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const lines = content.split('\n').filter(l => l.trim());
		if (lines.length < 2) return null;

		console.log('  Found retrenchment CSV, parsing...');
		// TODO: implement when CSV format is known
		return null;
	} catch {
		console.log('  WARNING: Error reading retrenchment CSV');
		return null;
	}
}

// ===== Compute signals =====
function computeVacancySignal(
	series: Array<{ quarter: string; rate: number }>
): VacancySignal | null {
	if (series.length < 8) {
		console.log(`  WARNING: Only ${series.length} quarters of vacancy data`);
		if (series.length < 4) return null;
	}

	const latest = series[0];
	const recent8 = series.slice(0, 8);

	// Year-over-year comparison: latest vs same quarter 1 year ago
	// Find the quarter from ~4 quarters back with the same Q designation
	const latestQ = latest.quarter.split(' ').pop(); // e.g. "Q3"
	const yoyMatch = series
		.slice(2, 8)
		.find(p => p.quarter.includes(latestQ || '') && p.quarter !== latest.quarter);

	let trend4qPct = 0;
	if (yoyMatch && yoyMatch.rate > 0) {
		trend4qPct = (latest.rate / yoyMatch.rate - 1) * 100;
	} else {
		// Fallback: compare to 4 quarters back
		const fourBack = series[4];
		if (fourBack && fourBack.rate > 0) {
			trend4qPct = (latest.rate / fourBack.rate - 1) * 100;
		}
	}

	// Signal: YoY change > +5% -> improving (+1), < -5% -> weakening (-1), else stable (0)
	let signal: 1 | 0 | -1 = 0;
	if (trend4qPct > 5) signal = 1;
	else if (trend4qPct < -5) signal = -1;

	// Sparkline data (oldest to newest for display)
	const sparkline = [...recent8].reverse().map(p => ({
		quarter: p.quarter,
		rate: p.rate
	}));

	return {
		latest_rate: latest.rate,
		latest_quarter: latest.quarter,
		trend_4q_pct: Math.round(trend4qPct * 100) / 100,
		signal,
		recent_quarters: sparkline
	};
}

function computeOverallSignal(
	vacancySignal: 1 | 0 | -1,
	hiringSignal: 1 | 0 | -1 | null,
	retrenchmentSignal: 1 | 0 | -1 | null
): 'strong' | 'moderate' | 'weak' | 'deteriorating' {
	let total = vacancySignal;
	let signalCount = 1;
	if (hiringSignal !== null) {
		total += hiringSignal;
		signalCount++;
	}
	if (retrenchmentSignal !== null) {
		total += retrenchmentSignal;
		signalCount++;
	}

	// When only 1 signal available, require stronger evidence for extreme labels
	if (signalCount === 1) {
		if (total > 0) return 'moderate'; // single positive → moderate (not strong)
		if (total === 0) return 'moderate'; // neutral → moderate
		return 'weak'; // single negative → weak (not deteriorating)
	}

	if (total >= 2) return 'strong';
	if (total >= 1) return 'moderate';
	if (total === 0) return 'weak';
	return 'deteriorating'; // only when multiple signals agree on decline
}

// ===== Main =====
function main() {
	console.log('=== Building Labour Monitor ===\n');

	// Parse vacancy rates
	console.log('Parsing vacancy rates CSV...');
	const vacancyData = parseVacancyRates();
	for (const [key, series] of vacancyData) {
		console.log(`  ${key}: ${series.length} quarters`);
	}

	// Parse recruitment/resignation (optional)
	const hiringData = parseRecruitmentResignation();

	// Parse retrenchment (optional)
	const _retrenchmentData = parseRetrenchment();

	// Build monitor for each cluster
	const monitors: LabourClusterMonitor[] = [];
	let dataAsOf = '';

	for (const clusterKey of Object.keys(CLUSTER_CSV_NAMES) as ClusterKey[]) {
		const vacancySeries = vacancyData.get(clusterKey) ?? [];

		if (vacancySeries.length === 0) {
			console.error(`ERROR: No vacancy data for cluster ${clusterKey}`);
			process.exit(1);
		}

		const vacancy = computeVacancySignal(vacancySeries);
		if (!vacancy) {
			console.error(`ERROR: Could not compute vacancy signal for ${clusterKey}`);
			process.exit(1);
		}

		if (!dataAsOf) {
			dataAsOf = vacancy.latest_quarter;
		}

		// Hiring signal (if available)
		let hiring: HiringSignal | null = null;
		if (hiringData) {
			const hd = hiringData.get(clusterKey);
			if (hd) {
				const netPressure = hd.recruitment_4q_avg - hd.resignation_4q_avg;
				let hiringSignal: 1 | 0 | -1 = 0;
				if (netPressure > 0.1) hiringSignal = 1;
				else if (netPressure < -0.1) hiringSignal = -1;
				hiring = {
					recruitment_rate: Math.round(hd.recruitment_4q_avg * 100) / 100,
					resignation_rate: Math.round(hd.resignation_4q_avg * 100) / 100,
					net_pressure: Math.round(netPressure * 100) / 100,
					signal: hiringSignal
				};
			}
		}

		// Retrenchment signal (if available)
		let retrenchment: RetrenchmentSignal | null = null;
		// (reserved for when CSV is available)

		// Overall signal
		const _overall = computeOverallSignal(
			vacancy.signal,
			hiring?.signal ?? null,
			retrenchment?.signal ?? null
		);

		// Compute annual rates for sparkline from vacancy series
		const annualRates: Array<{ year: string; rate: number }> = [];
		const yearMap = new Map<string, number[]>();
		for (const q of vacancySeries) {
			const year = q.quarter.split(' ')[0];
			if (!yearMap.has(year)) yearMap.set(year, []);
			yearMap.get(year)!.push(q.rate);
		}
		// Show last 4 years + latest quarter
		const recentYears = [...yearMap.entries()]
			.sort((a, b) => b[0].localeCompare(a[0]))
			.slice(0, 5)
			.reverse();
		for (const [year, rates] of recentYears) {
			annualRates.push({
				year,
				rate: Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100) / 100
			});
		}

		// Enrich with supplementary Q3 2025 data (from PDF)
		const enrichmentFile = path.join(DATA_DIR, 'labour-monitor-q3-2025.json');
		let enrichment: any = null;
		if (fs.existsSync(enrichmentFile)) {
			const enrichData = JSON.parse(fs.readFileSync(enrichmentFile, 'utf-8'));
			enrichment = enrichData.find((e: any) => e.cluster_key === clusterKey);
		}

		// Merge hiring from enrichment if no CSV data
		if (!hiring && enrichment?.hiring) {
			const h = enrichment.hiring;
			const netPressure = h.recruitment_rate - h.resignation_rate;
			hiring = {
				recruitment_rate: h.recruitment_rate,
				resignation_rate: h.resignation_rate,
				net_pressure: Math.round(netPressure * 100) / 100,
				signal: netPressure > 0.1 ? 1 : netPressure < -0.1 ? -1 : 0
			};
		}

		// Merge retrenchment from enrichment
		if (!retrenchment && enrichment?.retrenchment) {
			const r = enrichment.retrenchment;
			retrenchment = {
				latest_count: r.latest_count,
				latest_quarter: r.latest_quarter,
				trend_4q_pct: 0,
				signal: r.signal,
				recent_quarters: r.recent_quarters || [],
				incidence_per_1000: r.incidence_per_1000
			};
		}

		// Re-entry data
		const re_entry = enrichment?.re_entry || null;

		// Recompute overall with enriched signals
		const overallFinal = computeOverallSignal(
			vacancy.signal,
			hiring?.signal ?? null,
			retrenchment?.signal ?? null
		);

		// Summary from enrichment or generated
		const summary = enrichment?.summary || null;

		monitors.push({
			cluster_key: clusterKey,
			cluster_label: CLUSTER_LABELS[clusterKey],
			vacancy: { ...vacancy, annual_rates: annualRates },
			hiring,
			retrenchment,
			re_entry,
			overall: overallFinal,
			summary,
			data_as_of: dataAsOf,
			source: 'Labour Market Report Q3 2025, MRSD, MOM'
		});
	}

	// Write output
	const output = JSON.stringify(monitors, null, 2);
	fs.writeFileSync(OUT_FILE, output);
	console.log(`\nWrote ${OUT_FILE} (${monitors.length} clusters)`);

	// Summary
	for (const m of monitors) {
		console.log(
			`  ${m.cluster_key}: vacancy ${m.vacancy.signal > 0 ? '+' : ''}${m.vacancy.signal}, trend ${m.vacancy.trend_4q_pct.toFixed(1)}%, overall: ${m.overall}`
		);
	}

	console.log('\n=== Done ===');
}

main();
