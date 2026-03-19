#!/usr/bin/env bun
/**
 * build-occupation-industry-wages.ts — Build occupation-level industry wage anchors
 * from MOM published common-occupation wage tables by industry.
 *
 * Inputs:
 *   - data/raw/wages_by_industry.xlsx
 *
 * Outputs:
 *   - data/occupation-industry-wages.json
 *   - src/lib/data/occupation-industry-wages.json
 *
 * Notes:
 *   - Coverage is limited to occupations included in the published "common occupations"
 *     wage tables, not the full SSOC universe.
 *   - These values are contextual anchors and do not affect the core structural score.
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const OUT_FILE = path.join(DATA_DIR, 'occupation-industry-wages.json');
const SRC_OUT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'occupation-industry-wages.json'
);

interface IndustryWageEntry {
	key: string;
	label: string;
	gross_wage_25th: number | null;
	gross_wage_median: number | null;
	gross_wage_75th: number | null;
}

interface OccupationIndustryWageRecord {
	ssoc: string;
	occupation: string;
	industries: IndustryWageEntry[];
}

type Output = Record<string, OccupationIndustryWageRecord>;

const SHEET_MAP: Record<string, { key: string; label: string }> = {
	'T4.1': { key: 'manufacturing', label: 'Manufacturing' },
	'T4.2': { key: 'construction', label: 'Construction' },
	'T4.3': { key: 'wholesale_retail_trade', label: 'Wholesale & Retail Trade' },
	'T4.4': { key: 'transportation_storage', label: 'Transportation & Storage' },
	'T4.5': { key: 'accommodation_food_services', label: 'Accommodation & Food Services' },
	'T4.6': { key: 'information_communications', label: 'Information & Communications' },
	'T4.7': { key: 'financial_insurance_services', label: 'Financial & Insurance Services' },
	'T4.8': { key: 'real_estate_services', label: 'Real Estate Services' },
	'T4.9': { key: 'professional_services', label: 'Professional Services' },
	'T4.10': { key: 'administrative_support_services', label: 'Administrative & Support Services' },
	'T4.11': { key: 'public_admin_education', label: 'Public Administration & Education Services' },
	'T4.12': { key: 'health_social_services', label: 'Health & Social Services' },
	'T4.13': { key: 'arts_entertainment_recreation', label: 'Arts, Entertainment & Recreation' },
	'T4.14': {
		key: 'other_community_social_personal',
		label: 'Other Community, Social & Personal Services'
	}
};

function normalizeText(value: unknown): string {
	return String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseNumber(value: unknown): number | null {
	const normalized = normalizeText(value);
	if (!normalized || normalized === '-' || normalized.toLowerCase() === 'na') return null;
	const parsed = Number(normalized.replace(/,/g, ''));
	return Number.isFinite(parsed) ? parsed : null;
}

function readRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
	return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
}

function main() {
	const workbook = XLSX.readFile(path.join(RAW_DIR, 'wages_by_industry.xlsx'));
	const output = new Map<string, OccupationIndustryWageRecord>();

	for (const [sheetName, industry] of Object.entries(SHEET_MAP)) {
		const rows = readRows(workbook, sheetName);
		for (const row of rows.slice(8)) {
			const ssoc = normalizeText(row[1]);
			if (!/^\d{5}$/.test(ssoc)) continue;

			const occupation = normalizeText(row[2]);
			const entry: IndustryWageEntry = {
				key: industry.key,
				label: industry.label,
				gross_wage_25th: parseNumber(row[6]),
				gross_wage_median: parseNumber(row[7]),
				gross_wage_75th: parseNumber(row[8])
			};

			if (
				entry.gross_wage_25th === null &&
				entry.gross_wage_median === null &&
				entry.gross_wage_75th === null
			) {
				continue;
			}

			const existing = output.get(ssoc) ?? {
				ssoc,
				occupation,
				industries: []
			};
			existing.industries.push(entry);
			output.set(ssoc, existing);
		}
	}

	const sortedOutput = Object.fromEntries(
		[...output.entries()]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([ssoc, record]) => [
				ssoc,
				{
					...record,
					industries: [...record.industries].sort((a, b) => {
						const aValue = a.gross_wage_median ?? -1;
						const bValue = b.gross_wage_median ?? -1;
						return bValue - aValue;
					})
				}
			])
	) as Output;

	fs.writeFileSync(OUT_FILE, JSON.stringify(sortedOutput, null, 2) + '\n', 'utf-8');
	fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(sortedOutput, null, 2) + '\n', 'utf-8');

	console.log(
		`Built industry wage anchors for ${Object.keys(sortedOutput).length} occupations across ${Object.keys(SHEET_MAP).length} industry tables.`
	);
}

main();
