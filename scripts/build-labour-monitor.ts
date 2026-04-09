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
const SRC_OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'labour-monitor.json');

// ===== Types =====
type ClusterKey = 'pmet' | 'clerical_sales_service' | 'production_transport';

interface VacancySignal {
	latest_rate: number;
	latest_quarter: string;
	trend_4q_pct: number;
	signal: 1 | 0 | -1;
	recent_quarters: Array<{ quarter: string; rate: number }>;
	annual_rates?: Array<{ year: string; rate: number }>;
	qoq_delta_pp?: number;
	latest_count?: number;
	count_trend_4q_pct?: number;
	count_signal?: 1 | 0 | -1;
	count_qoq_delta?: number;
	recent_counts?: Array<{ quarter: string; count: number }>;
	annual_counts?: Array<{ year: string; count: number }>;
}

interface HiringSignal {
	recruitment_rate: number;
	resignation_rate: number;
	net_pressure: number;
	signal: 1 | 0 | -1;
	quarter?: string;
	frequency?: 'quarterly' | 'annual';
	recruitment_delta_pp?: number;
	resignation_delta_pp?: number;
	net_pressure_delta_pp?: number;
	note?: string;
}

interface RetrenchmentSignal {
	latest_count: number;
	latest_quarter: string;
	trend_4q_pct: number;
	signal: 1 | 0 | -1;
	recent_quarters: Array<{ quarter: string; count: number }>;
	incidence_per_1000?: number;
	qoq_delta_count?: number;
	trend_direction?: 'rising' | 'stable' | 'falling';
}

interface ReEntrySignal {
	rate_6m: number;
	rate_12m: number;
	quarter: string;
	rate_6m_delta_pp?: number;
	rate_12m_delta_pp?: number;
	note?: string;
}

interface FieldProvenance {
	source_key: string;
	source_type: 'official_raw_feed' | 'official_report_table' | 'derived_official';
	vintage: string;
	reference: string;
	transform?: string;
	note?: string;
}

interface LabourMonitorProvenance {
	method: 'raw_only' | 'raw_plus_report_enrichment';
	report?: {
		label: string;
		published_at: string;
		url: string;
	};
	fields: Record<string, FieldProvenance>;
}

interface LabourClusterMonitor {
	cluster_key: ClusterKey;
	cluster_label: string;
	vacancy: VacancySignal;
	hiring: HiringSignal | null;
	retrenchment: RetrenchmentSignal | null;
	re_entry?: ReEntrySignal | null;
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	summary?: string | null;
	data_as_of: string;
	source?: string;
	provenance?: LabourMonitorProvenance;
}

// ===== CSV parsing =====
const CLUSTER_CSV_NAMES: Record<ClusterKey, string> = {
	pmet: 'professional, managers, executive and technicians',
	clerical_sales_service: 'clerical, sales and services workers',
	production_transport: 'production and transport operators, cleaners and labourers'
};

const CLUSTER_VACANCY_COUNT_NAMES: Record<ClusterKey, string> = {
	pmet: 'professionals, managers, executives & technicians',
	clerical_sales_service: 'clerical, sales & service workers',
	production_transport: 'production & transport operators, cleaners & labourers'
};

const CLUSTER_LABELS: Record<ClusterKey, string> = {
	pmet: 'Professionals, Managers, Executives & Technicians',
	clerical_sales_service: 'Clerical, Sales & Service Workers',
	production_transport: 'Production & Transport Operators, Cleaners & Labourers'
};

const LATEST_LABOUR_REPORT = {
	label: 'MOM Labour Market Report Q4 2025',
	published_at: '2026-03-20',
	url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-4Q-2025.aspx'
} as const;

const CLUSTER_RETRENCHMENT_PATTERNS: Record<ClusterKey, string[]> = {
	pmet: [
		'professionals managers executives technicians',
		'professional managers executive technicians'
	],
	clerical_sales_service: ['clerical sales service workers', 'clerical sales services workers'],
	production_transport: [
		'production transport operators cleaners labourers',
		'production and transport operators cleaners and labourers'
	]
};

function normalizeLabel(value: string | undefined | null): string {
	return (value ?? '')
		.toLowerCase()
		.replace(/"/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function isTotalLabel(value: string | undefined | null): boolean {
	const normalized = normalizeLabel(value);
	return normalized === 'total' || normalized === 'all industries' || normalized === 'all industry';
}

function parseNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value !== 'string') return null;
	const cleaned = value.replace(/"/g, '').replace(/,/g, '').trim();
	if (
		!cleaned ||
		cleaned === '-' ||
		cleaned.toLowerCase() === 'na' ||
		cleaned.toLowerCase() === 'null'
	) {
		return null;
	}
	const parsed = parseFloat(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
}

function getSupportedJsonRecords(parsed: unknown): Array<Record<string, unknown>> | null {
	if (!parsed || typeof parsed !== 'object') return null;
	if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
	const root = parsed as Record<string, unknown>;
	if (Array.isArray(root.records)) return root.records as Array<Record<string, unknown>>;
	if (
		root.result &&
		typeof root.result === 'object' &&
		Array.isArray((root.result as Record<string, unknown>).records)
	) {
		return (root.result as { records: Array<Record<string, unknown>> }).records;
	}
	if (
		root.data &&
		typeof root.data === 'object' &&
		Array.isArray((root.data as Record<string, unknown>).records)
	) {
		return (root.data as { records: Array<Record<string, unknown>> }).records;
	}
	return null;
}

function computeHiringAverages(
	rows: Array<{ period: string; recruitment_rate: number; resignation_rate: number }>
): {
	recruitment_avg: number;
	resignation_avg: number;
	latest_period: string;
	frequency: 'quarterly' | 'annual';
} | null {
	if (rows.length === 0) return null;
	rows.sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period));
	const recent = rows.slice(0, Math.min(4, rows.length));
	return {
		recruitment_avg: recent.reduce((sum, row) => sum + row.recruitment_rate, 0) / recent.length,
		resignation_avg: recent.reduce((sum, row) => sum + row.resignation_rate, 0) / recent.length,
		latest_period: recent[0].period,
		frequency: /^\d{4}$/.test(recent[0].period) ? 'annual' : 'quarterly'
	};
}

function parseRecruitmentResignationRows(rows: Array<Record<string, unknown>>): Map<
	ClusterKey,
	{
		recruitment_avg: number;
		resignation_avg: number;
		latest_period: string;
		frequency: 'quarterly' | 'annual';
	}
> | null {
	const grouped = new Map<
		ClusterKey,
		Array<{ period: string; recruitment_rate: number; resignation_rate: number }>
	>();
	for (const key of Object.keys(CLUSTER_CSV_NAMES) as ClusterKey[]) grouped.set(key, []);

	for (const row of rows) {
		const period =
			parseQuarter(String(row.quarter ?? row.Quarter ?? '')) ??
			parseYear(String(row.year ?? row.Year ?? ''));
		if (!period) continue;
		if (!isTotalLabel(String(row.industry1 ?? row.Industry1 ?? ''))) continue;
		const industry2 = row.industry2 ?? row.Industry2;
		if (industry2 != null && String(industry2).trim() !== '' && !isTotalLabel(String(industry2))) {
			continue;
		}

		const occLabel = normalizeLabel(
			String(row.occupation1 ?? row.Occupation1 ?? row.occupation ?? row.occupation_group ?? '')
		);
		if (!occLabel || occLabel === 'total') continue;

		const recruitmentRate = parseNumber(row.recruitment_rate ?? row['Recruitment Rate']);
		const resignationRate = parseNumber(row.resignation_rate ?? row['Resignation Rate']);
		if (recruitmentRate == null || resignationRate == null) continue;

		for (const [key, csvName] of Object.entries(CLUSTER_CSV_NAMES) as Array<[ClusterKey, string]>) {
			if (occLabel === normalizeLabel(csvName)) {
				grouped.get(key)!.push({
					period,
					recruitment_rate: recruitmentRate,
					resignation_rate: resignationRate
				});
				break;
			}
		}
	}

	const result = new Map<
		ClusterKey,
		{
			recruitment_avg: number;
			resignation_avg: number;
			latest_period: string;
			frequency: 'quarterly' | 'annual';
		}
	>();
	for (const key of Object.keys(CLUSTER_CSV_NAMES) as ClusterKey[]) {
		const averages = computeHiringAverages(grouped.get(key) ?? []);
		if (averages) result.set(key, averages);
	}
	return result.size > 0 ? result : null;
}

function parseWideRows(
	rows: Array<Record<string, unknown>>,
	clusterPatterns: Record<ClusterKey, string[]>
): Map<ClusterKey, Array<{ quarter: string; count: number }>> | null {
	const result = new Map<ClusterKey, Array<{ quarter: string; count: number }>>();

	for (const [clusterKey, patterns] of Object.entries(clusterPatterns) as Array<
		[ClusterKey, string[]]
	>) {
		const candidates = rows
			.map(row => {
				const entries = Object.entries(row);
				const labelEntry = entries.find(([key]) => parseCompactQuarter(key) === null);
				const label = normalizeLabel(String(labelEntry?.[1] ?? ''));
				if (!label || !patterns.some(pattern => label.includes(pattern))) return null;

				const quarterPoints = entries
					.map(([key, value]) => {
						const quarter = parseCompactQuarter(key);
						const count = parseNumber(value);
						return quarter && count != null ? { quarter, count } : null;
					})
					.filter((value): value is { quarter: string; count: number } => value !== null)
					.sort((a, b) => quarterSortKey(b.quarter) - quarterSortKey(a.quarter));
				if (quarterPoints.length === 0) return null;

				const aggregateScore =
					isTotalLabel(label) || label.startsWith('total ') || label.includes('all industries')
						? 0
						: 100;
				return { score: aggregateScore + label.length, quarterPoints };
			})
			.filter(
				(
					value
				): value is {
					score: number;
					quarterPoints: Array<{ quarter: string; count: number }>;
				} => value !== null
			)
			.sort((a, b) => a.score - b.score);

		if (candidates[0]) result.set(clusterKey, candidates[0].quarterPoints);
	}

	return result.size > 0 ? result : null;
}

function buildMonitorProvenance(options: {
	usedVacancyEnrichment: boolean;
	usedHiringEnrichment: boolean;
	usedRetrenchmentEnrichment: boolean;
	usedReEntryEnrichment: boolean;
}): LabourMonitorProvenance {
	const method =
		options.usedVacancyEnrichment ||
		options.usedHiringEnrichment ||
		options.usedRetrenchmentEnrichment ||
		options.usedReEntryEnrichment
			? 'raw_plus_report_enrichment'
			: 'raw_only';

	const fields: Record<string, FieldProvenance> = {
		'vacancy.annual_rates': {
			source_key: 'mom_job_vacancy_rates',
			source_type: 'derived_official',
			vintage: '2021-2025',
			reference: 'data/raw/vacancy_rates_by_occupation_group.csv',
			transform: 'Annualized from published vacancy-rate series by occupation group.'
		},
		'vacancy.recent_quarters': {
			source_key: options.usedVacancyEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_job_vacancy_rates',
			source_type: options.usedVacancyEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedVacancyEnrichment
				? 'MOM Labour Market Report Q4 2025 vacancy tables / dashboard'
				: 'data/raw/vacancy_rates_by_occupation_group.csv',
			note: options.usedVacancyEnrichment
				? 'Latest quarter appended from the published Q4 2025 report because the raw vacancy-rate feed lags.'
				: undefined
		},
		'vacancy.latest_rate': {
			source_key: options.usedVacancyEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_job_vacancy_rates',
			source_type: options.usedVacancyEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedVacancyEnrichment
				? 'MOM Labour Market Report Q4 2025 vacancy table'
				: 'data/raw/vacancy_rates_by_occupation_group.csv'
		},
		'vacancy.qoq_delta_pp': {
			source_key: options.usedVacancyEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_job_vacancy_rates',
			source_type: options.usedVacancyEnrichment ? 'official_report_table' : 'derived_official',
			vintage: 'Q4 2025',
			reference: options.usedVacancyEnrichment
				? 'MOM Labour Market Report Q4 2025 quarter-on-quarter vacancy comparison'
				: 'data/raw/vacancy_rates_by_occupation_group.csv',
			transform: options.usedVacancyEnrichment
				? undefined
				: 'Computed from the latest two published quarters in the raw vacancy-rate feed.'
		},
		'vacancy.latest_count': {
			source_key: options.usedVacancyEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'job_vacancies_industry_occupation',
			source_type: options.usedVacancyEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedVacancyEnrichment
				? 'MOM Labour Market Report Q4 2025 published vacancy-count table'
				: 'data/raw/job_vacancies_by_industry_and_occupation_quarterly.csv'
		},
		'vacancy.count_qoq_delta': {
			source_key: options.usedVacancyEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'job_vacancies_industry_occupation',
			source_type: options.usedVacancyEnrichment ? 'official_report_table' : 'derived_official',
			vintage: 'Q4 2025',
			reference: options.usedVacancyEnrichment
				? 'MOM Labour Market Report Q4 2025 published vacancy-count quarter comparison'
				: 'data/raw/job_vacancies_by_industry_and_occupation_quarterly.csv',
			transform: options.usedVacancyEnrichment
				? undefined
				: 'Computed from the latest two published quarters in the raw vacancy-count feed.'
		},
		'hiring.recruitment_rate': {
			source_key: options.usedHiringEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_recruitment_resignation_rates',
			source_type: options.usedHiringEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: options.usedHiringEnrichment ? 'Q4 2025' : 'latest published series',
			reference: options.usedHiringEnrichment
				? 'MOM Labour Market Report Q4 2025 recruitment/resignation table'
				: 'data/raw/recruitment_resignation_rates.json',
			note: options.usedHiringEnrichment
				? 'Quarterly report values override the annualized raw dataset for the live Q4 2025 view.'
				: 'Raw dataset remains annualized where a quarterly breakdown is not available.'
		},
		'hiring.resignation_rate': {
			source_key: options.usedHiringEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_recruitment_resignation_rates',
			source_type: options.usedHiringEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: options.usedHiringEnrichment ? 'Q4 2025' : 'latest published series',
			reference: options.usedHiringEnrichment
				? 'MOM Labour Market Report Q4 2025 recruitment/resignation table'
				: 'data/raw/recruitment_resignation_rates.json'
		},
		'hiring.net_pressure': {
			source_key: options.usedHiringEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_recruitment_resignation_rates',
			source_type: 'derived_official',
			vintage: options.usedHiringEnrichment ? 'Q4 2025' : 'latest published series',
			reference: options.usedHiringEnrichment
				? 'MOM Labour Market Report Q4 2025 recruitment/resignation table'
				: 'data/raw/recruitment_resignation_rates.json',
			transform: 'Computed as recruitment_rate minus resignation_rate.'
		},
		'retrenchment.latest_count': {
			source_key: options.usedRetrenchmentEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_retrenchment_by_occupation_group',
			source_type: options.usedRetrenchmentEnrichment
				? 'official_report_table'
				: 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedRetrenchmentEnrichment
				? 'MOM Labour Market Report Q4 2025 retrenchment table'
				: 'data/raw/retrenchment_by_occupation_group.json'
		},
		'retrenchment.qoq_delta_count': {
			source_key: options.usedRetrenchmentEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_retrenchment_by_occupation_group',
			source_type: options.usedRetrenchmentEnrichment
				? 'official_report_table'
				: 'derived_official',
			vintage: 'Q4 2025',
			reference: options.usedRetrenchmentEnrichment
				? 'MOM Labour Market Report Q4 2025 retrenchment quarter comparison'
				: 'data/raw/retrenchment_by_occupation_group.json',
			transform: options.usedRetrenchmentEnrichment
				? undefined
				: 'Computed from the latest two published retrenchment quarters.'
		},
		'retrenchment.incidence_per_1000': {
			source_key: 'mom_labour_market_report_q4_2025',
			source_type: 'official_report_table',
			vintage: 'Q4 2025',
			reference: 'MOM Labour Market Report Q4 2025 retrenchment incidence table'
		},
		're_entry.rate_6m': {
			source_key: options.usedReEntryEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_labour_monitor_2025',
			source_type: options.usedReEntryEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedReEntryEnrichment
				? 'MOM Labour Market Report Q4 2025 re-entry table'
				: 'MOM labour monitor source feed'
		},
		're_entry.rate_12m': {
			source_key: options.usedReEntryEnrichment
				? 'mom_labour_market_report_q4_2025'
				: 'mom_labour_monitor_2025',
			source_type: options.usedReEntryEnrichment ? 'official_report_table' : 'official_raw_feed',
			vintage: 'Q4 2025',
			reference: options.usedReEntryEnrichment
				? 'MOM Labour Market Report Q4 2025 re-entry table'
				: 'MOM labour monitor source feed'
		},
		overall: {
			source_key: 'ai_work_index_labour_monitor_rules',
			source_type: 'derived_official',
			vintage: 'Q4 2025',
			reference: 'scripts/build-labour-monitor.ts',
			transform:
				'Deterministic sum of vacancy, hiring, and retrenchment signals into strong / moderate / weak / deteriorating.'
		},
		summary: {
			source_key: 'mom_labour_market_report_q4_2025',
			source_type: 'official_report_table',
			vintage: 'Q4 2025',
			reference:
				'Curated narrative summary derived from the published MOM Labour Market Report Q4 2025.',
			note: 'Narrative compression of the official figures; not a separate statistical input.'
		}
	};

	return {
		method,
		report: method === 'raw_plus_report_enrichment' ? LATEST_LABOUR_REPORT : undefined,
		fields
	};
}

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

function parseCompactQuarter(token: string): string | null {
	const cleaned = token.replace(/^"+|"+$/g, '').trim();
	let match = cleaned.match(/^(\d{4})([1-4])Q$/);
	if (match) return `${match[1]} Q${match[2]}`;
	match = cleaned.match(/^(\d{4})Q([1-4])$/);
	if (match) return `${match[1]} Q${match[2]}`;
	match = cleaned.match(/^(\d{4})([1-4])$/);
	if (match) return `${match[1]} Q${match[2]}`;
	return parseQuarter(cleaned);
}

function parseYear(token: string): string | null {
	const cleaned = token.replace(/^"+|"+$/g, '').trim();
	return /^\d{4}$/.test(cleaned) ? cleaned : null;
}

function quarterSortKey(q: string): number {
	const match = q.match(/^(\d{4})\s+Q([1-4])$/);
	if (!match) return 0;
	return parseInt(match[1]) * 10 + parseInt(match[2]);
}

function periodSortKey(period: string): number {
	const q = quarterSortKey(period);
	if (q > 0) return q;
	const year = parseYear(period);
	if (year) return parseInt(year) * 10 + 9;
	return 0;
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

function parseVacancyCounts(): Map<ClusterKey, Array<{ quarter: string; count: number }>> {
	const filePath = path.join(RAW_DIR, 'job_vacancies_by_industry_and_occupation_quarterly.csv');
	if (!fs.existsSync(filePath)) {
		console.log('  INFO: job_vacancies_by_industry_and_occupation_quarterly.csv not found');
		return new Map();
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	if (lines.length < 2) return new Map();

	const header = parseCSVRow(lines[0]);
	const quarterColumns = header
		.map((column, index) => {
			if (index === 0) return null;
			const quarter = parseCompactQuarter(column);
			return quarter ? { index, quarter } : null;
		})
		.filter((value): value is { index: number; quarter: string } => value !== null)
		.sort((a, b) => quarterSortKey(b.quarter) - quarterSortKey(a.quarter));

	const result = new Map<ClusterKey, Array<{ quarter: string; count: number }>>();
	for (const key of Object.keys(CLUSTER_VACANCY_COUNT_NAMES) as ClusterKey[]) {
		result.set(key, []);
	}

	for (let i = 1; i < lines.length; i++) {
		const fields = parseCSVRow(lines[i]);
		const label = fields[0]?.toLowerCase().replace(/"/g, '').trim();
		if (!label) continue;

		for (const [key, expectedLabel] of Object.entries(CLUSTER_VACANCY_COUNT_NAMES) as Array<
			[ClusterKey, string]
		>) {
			if (label !== expectedLabel) continue;
			const series = result.get(key)!;
			for (const { index, quarter } of quarterColumns) {
				const rawValue = fields[index]?.replace(/"/g, '').trim();
				if (!rawValue || rawValue.toLowerCase() === 'na' || rawValue === '-') continue;
				const count = parseFloat(rawValue);
				if (Number.isFinite(count)) series.push({ quarter, count });
			}
		}
	}

	for (const [, series] of result) {
		series.sort((a, b) => quarterSortKey(b.quarter) - quarterSortKey(a.quarter));
	}

	return result;
}

// ===== Parse recruitment/resignation CSV (if available) =====
function parseRecruitmentResignation(): Map<
	ClusterKey,
	{
		recruitment_avg: number;
		resignation_avg: number;
		latest_period: string;
		frequency: 'quarterly' | 'annual';
	}
> | null {
	const filePath = path.join(RAW_DIR, 'recruitment_resignation_rates.csv');
	try {
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf-8');
			const lines = content.split('\n').filter(l => l.trim());
			if (lines.length >= 2) {
				console.log('  Found recruitment/resignation CSV, parsing...');
				const header = parseCSVRow(lines[0]);
				const rows = lines.slice(1).map(line => {
					const values = parseCSVRow(line);
					return Object.fromEntries(header.map((key, index) => [key, values[index] ?? '']));
				});
				const parsed = parseRecruitmentResignationRows(rows);
				if (parsed) return parsed;
			}
		}

		const jsonFallbackPath = path.join(RAW_DIR, 'recruitment_resignation_rates.json');
		if (fs.existsSync(jsonFallbackPath)) {
			const parsed = JSON.parse(fs.readFileSync(jsonFallbackPath, 'utf-8')) as Record<
				string,
				unknown
			>;
			if (
				typeof parsed.code === 'number' &&
				typeof parsed.name === 'string' &&
				typeof parsed.errorMsg === 'string'
			) {
				console.log(
					`  INFO: recruitment_resignation_rates.json is a saved API error payload (${parsed.name}), skipping hiring signal`
				);
				return null;
			}
			const records = getSupportedJsonRecords(parsed);
			if (records) {
				console.log('  Found recruitment/resignation JSON payload, parsing...');
				return parseRecruitmentResignationRows(records);
			}
			console.log(
				'  INFO: recruitment_resignation_rates.json exists but is not yet mapped to a supported schema, skipping hiring signal'
			);
			return null;
		}

		console.log('  INFO: recruitment_resignation_rates.csv not found, skipping hiring signal');
		return null;
	} catch {
		console.log('  WARNING: Error reading recruitment/resignation dataset');
		return null;
	}
}

// ===== Parse retrenchment CSV (if available) =====
function parseRetrenchment(): Map<ClusterKey, Array<{ quarter: string; count: number }>> | null {
	const filePath = path.join(RAW_DIR, 'retrenchment_by_occupation_group.csv');
	try {
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf-8');
			const lines = content.split('\n').filter(l => l.trim());
			if (lines.length >= 2) {
				console.log('  Found retrenchment CSV, parsing...');
				const header = parseCSVRow(lines[0]);
				const rows = lines.slice(1).map(line => {
					const values = parseCSVRow(line);
					return Object.fromEntries(header.map((key, index) => [key, values[index] ?? '']));
				});
				const parsed = parseWideRows(rows, CLUSTER_RETRENCHMENT_PATTERNS);
				if (parsed) return parsed;
			}
		}

		const jsonFallbackPath = path.join(RAW_DIR, 'retrenchment_by_occupation_group.json');
		if (fs.existsSync(jsonFallbackPath)) {
			const parsed = JSON.parse(fs.readFileSync(jsonFallbackPath, 'utf-8'));
			const records = getSupportedJsonRecords(parsed);
			if (records) {
				console.log('  Found retrenchment JSON payload, parsing...');
				return parseWideRows(records, CLUSTER_RETRENCHMENT_PATTERNS);
			}
		}

		console.log(
			'  INFO: retrenchment_by_occupation_group.csv not found, skipping retrenchment signal'
		);
		return null;
	} catch {
		console.log('  WARNING: Error reading retrenchment dataset');
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

function computeVacancyCountSignal(series: Array<{ quarter: string; count: number }>): {
	latest_count: number;
	latest_quarter: string;
	count_trend_4q_pct: number;
	count_signal: 1 | 0 | -1;
	recent_counts: Array<{ quarter: string; count: number }>;
	annual_counts: Array<{ year: string; count: number }>;
} | null {
	if (series.length < 4) return null;

	const latest = series[0];
	const recent8 = series.slice(0, 8);
	const latestQ = latest.quarter.split(' ').pop();
	const yoyMatch = series
		.slice(2, 8)
		.find(point => point.quarter.includes(latestQ || '') && point.quarter !== latest.quarter);

	let trend4qPct = 0;
	if (yoyMatch && yoyMatch.count > 0) {
		trend4qPct = (latest.count / yoyMatch.count - 1) * 100;
	} else {
		const fourBack = series[4];
		if (fourBack && fourBack.count > 0) {
			trend4qPct = (latest.count / fourBack.count - 1) * 100;
		}
	}

	let signal: 1 | 0 | -1 = 0;
	if (trend4qPct > 5) signal = 1;
	else if (trend4qPct < -5) signal = -1;

	const recentCounts = [...recent8].reverse();
	const annualCounts: Array<{ year: string; count: number }> = [];
	const yearMap = new Map<string, number[]>();
	for (const point of series) {
		const year = point.quarter.split(' ')[0];
		if (!yearMap.has(year)) yearMap.set(year, []);
		yearMap.get(year)!.push(point.count);
	}
	const recentYears = [...yearMap.entries()]
		.sort((a, b) => b[0].localeCompare(a[0]))
		.slice(0, 5)
		.reverse();
	for (const [year, counts] of recentYears) {
		annualCounts.push({
			year,
			count: Math.round(counts.reduce((sum, count) => sum + count, 0) / counts.length)
		});
	}

	return {
		latest_count: latest.count,
		latest_quarter: latest.quarter,
		count_trend_4q_pct: Math.round(trend4qPct * 100) / 100,
		count_signal: signal,
		recent_counts: recentCounts,
		annual_counts: annualCounts
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

function computeRetrenchmentSignal(
	series: Array<{ quarter: string; count: number }>
): RetrenchmentSignal | null {
	if (series.length < 2) return null;

	const latest = series[0];
	const recent = series.slice(0, Math.min(8, series.length));
	const latestQ = latest.quarter.split(' ').pop();
	const yoyMatch = series
		.slice(2, 8)
		.find(point => point.quarter.includes(latestQ || '') && point.quarter !== latest.quarter);

	let trend4qPct = 0;
	if (yoyMatch && yoyMatch.count > 0) {
		trend4qPct = (latest.count / yoyMatch.count - 1) * 100;
	} else {
		const fourBack = series[4];
		if (fourBack && fourBack.count > 0) {
			trend4qPct = (latest.count / fourBack.count - 1) * 100;
		}
	}

	let signal: 1 | 0 | -1 = 0;
	if (trend4qPct > 5) signal = -1;
	else if (trend4qPct < -5) signal = 1;

	return {
		latest_count: latest.count,
		latest_quarter: latest.quarter,
		trend_4q_pct: Math.round(trend4qPct * 100) / 100,
		signal,
		trend_direction: trend4qPct > 5 ? 'rising' : trend4qPct < -5 ? 'falling' : 'stable',
		recent_quarters: [...recent].reverse()
	};
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
	const retrenchmentData = parseRetrenchment();

	// Parse published vacancy counts by cluster
	console.log('Parsing published vacancy counts CSV...');
	const vacancyCountData = parseVacancyCounts();
	for (const [key, series] of vacancyCountData) {
		console.log(`  ${key}: ${series.length} vacancy-count quarters`);
	}

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

		const vacancyCountSeries = vacancyCountData.get(clusterKey) ?? [];
		const vacancyCounts = computeVacancyCountSignal(vacancyCountSeries);

		if (!dataAsOf) {
			dataAsOf = vacancy.latest_quarter;
		}

		// Hiring signal (if available)
		let hiring: HiringSignal | null = null;
		if (hiringData) {
			const hd = hiringData.get(clusterKey);
			if (hd) {
				const netPressure = hd.recruitment_avg - hd.resignation_avg;
				let hiringSignal: 1 | 0 | -1 = 0;
				if (netPressure > 0.1) hiringSignal = 1;
				else if (netPressure < -0.1) hiringSignal = -1;
				hiring = {
					recruitment_rate: Math.round(hd.recruitment_avg * 100) / 100,
					resignation_rate: Math.round(hd.resignation_avg * 100) / 100,
					net_pressure: Math.round(netPressure * 100) / 100,
					signal: hiringSignal,
					quarter: hd.latest_period,
					frequency: hd.frequency,
					note:
						hd.frequency === 'annual'
							? 'Uses latest available annual average monthly rates from the published MOM dataset.'
							: undefined
				};
			}
		}

		// Retrenchment signal (if available)
		let retrenchment: RetrenchmentSignal | null = null;
		const retrenchmentSeries = retrenchmentData?.get(clusterKey) ?? [];
		if (retrenchmentSeries.length > 0) {
			retrenchment = computeRetrenchmentSignal(retrenchmentSeries);
		}

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

		// Enrich with supplementary Q4 2025 official PDF data
		const enrichmentFile = path.join(DATA_DIR, 'labour-monitor-q4-2025.json');
		let enrichment: any = null;
		if (fs.existsSync(enrichmentFile)) {
			const enrichData = JSON.parse(fs.readFileSync(enrichmentFile, 'utf-8'));
			enrichment = enrichData.find((e: any) => e.cluster_key === clusterKey);
		}

		// Merge vacancy/latest published cluster data from the Q4 PDF while the raw vacancy CSV lags.
		let vacancyFinal: VacancySignal = {
			...vacancy,
			annual_rates: annualRates,
			latest_count: vacancyCounts?.latest_count,
			count_trend_4q_pct: vacancyCounts?.count_trend_4q_pct,
			count_signal: vacancyCounts?.count_signal,
			recent_counts: vacancyCounts?.recent_counts,
			annual_counts: vacancyCounts?.annual_counts
		};
		if (enrichment?.vacancy) {
			const q4Vacancy = enrichment.vacancy;
			vacancyFinal = {
				...vacancyFinal,
				latest_rate: q4Vacancy.latest_rate ?? vacancyFinal.latest_rate,
				latest_quarter: q4Vacancy.latest_quarter ?? vacancyFinal.latest_quarter,
				trend_4q_pct: q4Vacancy.trend_4q_pct ?? vacancyFinal.trend_4q_pct,
				signal: q4Vacancy.signal ?? vacancyFinal.signal,
				qoq_delta_pp: q4Vacancy.qoq_delta_pp ?? vacancyFinal.qoq_delta_pp,
				recent_quarters: q4Vacancy.recent_quarters ?? vacancyFinal.recent_quarters,
				latest_count: q4Vacancy.latest_count ?? vacancyFinal.latest_count,
				count_trend_4q_pct: q4Vacancy.count_trend_4q_pct ?? vacancyFinal.count_trend_4q_pct,
				count_signal: q4Vacancy.count_signal ?? vacancyFinal.count_signal,
				count_qoq_delta: q4Vacancy.count_qoq_delta ?? vacancyFinal.count_qoq_delta,
				recent_counts: q4Vacancy.recent_counts ?? vacancyFinal.recent_counts
			};
			dataAsOf = q4Vacancy.latest_quarter ?? dataAsOf;
		}
		const usedVacancyEnrichment = Boolean(enrichment?.vacancy);

		// Merge hiring from enrichment if raw data is absent or only annual
		const usedHiringEnrichment = Boolean(
			(!hiring || hiring.frequency === 'annual') && enrichment?.hiring
		);
		if ((!hiring || hiring.frequency === 'annual') && enrichment?.hiring) {
			const h = enrichment.hiring;
			const netPressure = h.recruitment_rate - h.resignation_rate;
			hiring = {
				recruitment_rate: h.recruitment_rate,
				resignation_rate: h.resignation_rate,
				net_pressure: Math.round(netPressure * 100) / 100,
				signal: netPressure > 0.1 ? 1 : netPressure < -0.1 ? -1 : 0,
				quarter: h.quarter,
				frequency: 'quarterly',
				recruitment_delta_pp: h.recruitment_delta_pp,
				resignation_delta_pp: h.resignation_delta_pp,
				net_pressure_delta_pp: h.net_pressure_delta_pp,
				note: h.note
			};
		} else if (hiring && enrichment?.hiring?.note) {
			hiring.note = enrichment.hiring.note;
			hiring.recruitment_delta_pp = enrichment.hiring.recruitment_delta_pp;
			hiring.resignation_delta_pp = enrichment.hiring.resignation_delta_pp;
			hiring.net_pressure_delta_pp = enrichment.hiring.net_pressure_delta_pp;
		}

		// Merge retrenchment from enrichment
		const usedRetrenchmentEnrichment = Boolean(
			(!retrenchment && enrichment?.retrenchment) ||
			(retrenchment && enrichment?.retrenchment?.incidence_per_1000 != null)
		);
		if (!retrenchment && enrichment?.retrenchment) {
			const r = enrichment.retrenchment;
			retrenchment = {
				latest_count: r.latest_count,
				latest_quarter: r.latest_quarter,
				trend_4q_pct: r.trend_4q_pct ?? 0,
				signal: r.signal,
				trend_direction: r.trend_direction,
				recent_quarters: r.recent_quarters || [],
				incidence_per_1000: r.incidence_per_1000,
				qoq_delta_count: r.qoq_delta_count
			};
		} else if (retrenchment && enrichment?.retrenchment?.incidence_per_1000 != null) {
			retrenchment.incidence_per_1000 = enrichment.retrenchment.incidence_per_1000;
			retrenchment.trend_direction =
				retrenchment.trend_direction ?? enrichment.retrenchment.trend_direction;
			retrenchment.qoq_delta_count = enrichment.retrenchment.qoq_delta_count;
		}

		// Re-entry data
		const re_entry: ReEntrySignal | null = enrichment?.re_entry || null;
		const usedReEntryEnrichment = Boolean(enrichment?.re_entry);

		// Recompute overall with enriched signals
		const overallFinal = computeOverallSignal(
			vacancyFinal.signal,
			hiring?.signal ?? null,
			retrenchment?.signal ?? null
		);

		// Summary from enrichment or generated
		const summary = enrichment?.summary || null;

		monitors.push({
			cluster_key: clusterKey,
			cluster_label: CLUSTER_LABELS[clusterKey],
			vacancy: vacancyFinal,
			hiring,
			retrenchment,
			re_entry,
			overall: overallFinal,
			summary,
			data_as_of: enrichment?.data_as_of ?? dataAsOf,
			source: enrichment?.source ?? 'Labour Market Report Q4 2025, MRSD, MOM',
			provenance: buildMonitorProvenance({
				usedVacancyEnrichment,
				usedHiringEnrichment,
				usedRetrenchmentEnrichment,
				usedReEntryEnrichment
			})
		});
	}

	// Write output
	const output = JSON.stringify(monitors, null, 2);
	fs.writeFileSync(OUT_FILE, output);
	fs.writeFileSync(SRC_OUT_FILE, output);
	console.log(`\nWrote ${OUT_FILE} (${monitors.length} clusters)`);
	console.log(`Copied to ${SRC_OUT_FILE}`);

	// Summary
	for (const m of monitors) {
		console.log(
			`  ${m.cluster_key}: vacancy ${m.vacancy.signal > 0 ? '+' : ''}${m.vacancy.signal}, trend ${m.vacancy.trend_4q_pct.toFixed(1)}%, overall: ${m.overall}`
		);
	}

	console.log('\n=== Done ===');
}

main();
