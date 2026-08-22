#!/usr/bin/env bun
/**
 * build-macro-context.ts — Build Singapore macro labour context from official
 * unemployment and labour-tightness series.
 *
 * Inputs:
 *   - data/raw/unemployment_rate_quarterly.json
 *   - data/raw/job_vacancy_to_unemployed_ratio.json
 *
 * Outputs:
 *   - data/macro-context.json
 *   - src/lib/data/macro-context.json
 *   - static/data/sg-macro-context.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const UNEMPLOYMENT_FILE = path.join(RAW_DIR, 'unemployment_rate_quarterly.json');
const JV_TO_UE_FILE = path.join(RAW_DIR, 'job_vacancy_to_unemployed_ratio.json');

const OUT_FILE = path.join(DATA_DIR, 'macro-context.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'macro-context.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-macro-context.json');
const LEGACY_STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-macro-context-2025.json');

const CURRENT_QUARTER_LABOUR_TIGHTNESS = {
	quarter: '2026 1Q',
	ratio: 1.46,
	vacancy_count_thousands: 73.3,
	total_employment_change_thousands: 9.4,
	resident_employment_change_thousands: 5.4,
	total_retrenchments: 3830,
	retrenchment_incidence_per_1000: 1.6,
	re_entry_rate_6m: 60.7,
	average_weekly_hours: 42.9,
	average_weekly_overtime_hours: 1.7,
	source: 'MOM Labour Market Report Q1 2026',
	published_at: '2026-06-15',
	url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-1Q-2026.aspx'
} as const;

type RawRecord = Record<string, string | number | null>;

function readJsonRecords(filePath: string): RawRecord[] {
	const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
		result?: { records?: RawRecord[] };
	};
	return payload.result?.records ?? [];
}

function normalize(value: unknown): string {
	return String(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function asNumber(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const parsed = Number(String(value).replace(/,/g, '').trim());
	return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits: number = 2): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function quarterSortKey(value: string): number {
	const match = value.match(/^(\d{4})\s*([1-4])Q$/i);
	if (!match) return -1;
	return Number(match[1]) * 10 + Number(match[2]);
}

function labelQuarter(compactQuarter: string): string {
	const match = compactQuarter.match(/^(\d{4})([1-4])Q$/i);
	if (!match) return compactQuarter;
	return `${match[1]} ${match[2]}Q`;
}

function classifySeries(label: string): 'total' | 'resident' | 'citizen' | null {
	const normalized = normalize(label);
	if (normalized.includes('resident')) return 'resident';
	if (normalized.includes('citizen')) return 'citizen';
	if (normalized.includes('total')) return 'total';
	return null;
}

function parseUnemployment(records: RawRecord[]) {
	const seriesRows = new Map<'total' | 'resident' | 'citizen', RawRecord>();
	for (const record of records) {
		const key = classifySeries(String(record.DataSeries ?? ''));
		if (key) seriesRows.set(key, record);
	}

	const quarterKeys = Object.keys(records[0] ?? {})
		.filter(key => /^\d{5}Q$/i.test(key))
		.sort((a, b) => quarterSortKey(b) - quarterSortKey(a));

	const history = quarterKeys
		.map(quarter => {
			const total = asNumber(seriesRows.get('total')?.[quarter]);
			const resident = asNumber(seriesRows.get('resident')?.[quarter]);
			const citizen = asNumber(seriesRows.get('citizen')?.[quarter]);
			if (total == null && resident == null && citizen == null) return null;
			return {
				quarter: labelQuarter(quarter),
				total_rate: total,
				resident_rate: resident,
				citizen_rate: citizen
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

	const latest = history[0] ?? null;
	const priorYear = latest
		? history.find(
				entry =>
					entry.quarter.endsWith(latest.quarter.slice(-2)) && entry.quarter !== latest.quarter
			)
		: null;

	return {
		latest,
		history: [...history].reverse(),
		change_vs_year_ago:
			latest && priorYear
				? {
						total_rate_pp:
							latest.total_rate != null && priorYear.total_rate != null
								? round(latest.total_rate - priorYear.total_rate)
								: null,
						resident_rate_pp:
							latest.resident_rate != null && priorYear.resident_rate != null
								? round(latest.resident_rate - priorYear.resident_rate)
								: null,
						citizen_rate_pp:
							latest.citizen_rate != null && priorYear.citizen_rate != null
								? round(latest.citizen_rate - priorYear.citizen_rate)
								: null
					}
				: null
	};
}

function parseJvToUe(records: RawRecord[]) {
	const history = records
		.map(record => ({
			year: String(record.year ?? '').trim(),
			ratio: asNumber(record.jv_to_ue)
		}))
		.filter(
			(entry): entry is { year: string; ratio: number } =>
				Boolean(entry.year) && entry.ratio != null
		)
		.sort((a, b) => Number(a.year) - Number(b.year));

	const latest = history.at(-1) ?? null;
	const priorYear = history.length >= 2 ? (history.at(-2) ?? null) : null;

	return {
		latest,
		history,
		change_vs_prior_year: latest && priorYear ? round(latest.ratio - priorYear.ratio) : null
	};
}

const unemployment = parseUnemployment(readJsonRecords(UNEMPLOYMENT_FILE));
const labourTightness = parseJvToUe(readJsonRecords(JV_TO_UE_FILE));

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Official Singapore macro labour context derived from unemployment and labour-tightness series. This artifact is contextual and does not affect the structural score.',
	unemployment,
	labour_tightness: labourTightness,
	latest_snapshot: {
		quarter: unemployment.latest?.quarter ?? null,
		resident_unemployment_rate: unemployment.latest?.resident_rate ?? null,
		total_unemployment_rate: unemployment.latest?.total_rate ?? null,
		citizen_unemployment_rate: unemployment.latest?.citizen_rate ?? null,
		job_vacancy_to_unemployed_ratio_year: labourTightness.latest?.year ?? null,
		job_vacancy_to_unemployed_ratio: labourTightness.latest?.ratio ?? null,
		current_quarter_job_vacancy_to_unemployed_ratio: CURRENT_QUARTER_LABOUR_TIGHTNESS.ratio,
		current_quarter_vacancy_count_thousands:
			CURRENT_QUARTER_LABOUR_TIGHTNESS.vacancy_count_thousands,
		total_employment_change_thousands:
			CURRENT_QUARTER_LABOUR_TIGHTNESS.total_employment_change_thousands,
		resident_employment_change_thousands:
			CURRENT_QUARTER_LABOUR_TIGHTNESS.resident_employment_change_thousands,
		total_retrenchments: CURRENT_QUARTER_LABOUR_TIGHTNESS.total_retrenchments,
		retrenchment_incidence_per_1000:
			CURRENT_QUARTER_LABOUR_TIGHTNESS.retrenchment_incidence_per_1000,
		re_entry_rate_6m: CURRENT_QUARTER_LABOUR_TIGHTNESS.re_entry_rate_6m,
		average_weekly_hours: CURRENT_QUARTER_LABOUR_TIGHTNESS.average_weekly_hours,
		average_weekly_overtime_hours: CURRENT_QUARTER_LABOUR_TIGHTNESS.average_weekly_overtime_hours
	},
	metadata: {
		current_quarter_labour_tightness: CURRENT_QUARTER_LABOUR_TIGHTNESS,
		notes: [
			'Unemployment rates are seasonally adjusted end-of-period series from MOM / SingStat.',
			'The historical job-vacancy-to-unemployed series is annual; latest_snapshot separately publishes the latest official quarterly ratio.',
			'These metrics are published as macro context around the score and do not act as direct occupation-level multipliers.'
		]
	}
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const serialized = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, serialized, 'utf-8');
// Backward-compatible download alias. The payload carries its own current quarter and provenance.
fs.writeFileSync(LEGACY_STATIC_OUT_FILE, serialized, 'utf-8');

console.log(`Built macro context artifact at ${STATIC_OUT_FILE}`);
