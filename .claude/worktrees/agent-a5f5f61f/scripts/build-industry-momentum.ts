#!/usr/bin/env bun
/**
 * build-industry-momentum.ts — Parse MOM industry × occupation cross-tab CSV
 * and compute per-(industry × occupation group) employment momentum signals.
 *
 * Input:  data/raw/industry_x_occupation.csv
 * Output: data/industry-momentum.json
 *
 * For each (industry × occupation_group) pair, computes:
 *   - 5-year employment CAGR (2020 → 2025)
 *   - 2-year recent change (2023 → 2025)
 *   - 2025 employment level (thousands)
 *
 * The CSV structure is a flat list of rows where:
 *   - Row 1: header with years
 *   - "All Occupation Groups" section (lines 2–18): total employment by industry
 *   - Then 9 occupation group sections, each with the same industry breakdown
 *
 * Occupation group rows have NO leading whitespace; industry rows have 4-space indent.
 * Service sub-industries have 8-space indent.
 *
 * Run: bun run scripts/build-industry-momentum.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const INPUT_FILE = path.join(RAW_DIR, 'industry_x_occupation.csv');
const OUTPUT_FILE = path.join(DATA_DIR, 'industry-momentum.json');

// ===== Types =====

interface IndustryMomentum {
	cagr_5y: number | null;
	change_2y: number | null;
	employment_2025: number | null;
}

type OccupationGroupData = Record<string, IndustryMomentum>;
type IndustryMomentumOutput = Record<string, OccupationGroupData>;

// ===== Occupation group names as they appear in the CSV =====
// Maps CSV row label → normalized key used in the output JSON
const OCCUPATION_GROUP_LABELS: Record<string, string> = {
	'All Occupation Groups, (Total Employed Residents)': 'ALL_GROUPS',
	'Managers & Administrators (Including Working Proprietors)': 'MANAGERS',
	Professionals: 'PROFESSIONALS',
	'Associate Professionals & Technicians': 'ASSOCIATE_PROFESSIONALS_AND_TECHNICIANS',
	'Clerical Support Workers': 'CLERICAL_SUPPORT_WORKERS',
	'Service & Sales Workers': 'SERVICE_AND_SALES_WORKERS',
	'Craftsmen & Related Trades Workers': 'CRAFTSMEN_AND_RELATED_TRADES_WORKERS',
	'Plant & Machine Operators & Assemblers': 'PLANT_AND_MACHINE_OPERATORS_AND_ASSEMBLERS',
	'Cleaners, Labourers & Related Workers': 'CLEANERS_LABOURERS_AND_RELATED_WORKERS',
	'Other Occupation Groups Nes': 'OTHER_OCCUPATION_GROUPS'
};

// Industry labels → normalized keys
// 4-space indent = top-level industry; 8-space indent = services sub-sector
const INDUSTRY_LABELS: Record<string, string> = {
	Manufacturing: 'manufacturing',
	Construction: 'construction',
	Services: 'services',
	'Wholesale & Retail Trade': 'wholesale_retail_trade',
	'Transportation & Storage': 'transportation_storage',
	'Accommodation & Food Services': 'accommodation_food_services',
	'Information & Communications': 'information_communications',
	'Financial & Insurance Services': 'financial_insurance_services',
	'Real Estate Services': 'real_estate_services',
	'Professional Services': 'professional_services',
	'Administrative & Support Services': 'administrative_support_services',
	'Public Administration & Education Services': 'public_admin_education',
	'Health & Social Services': 'health_social_services',
	'Arts, Entertainment & Recreation': 'arts_entertainment_recreation',
	'Other Community, Social & Personal Services': 'other_community_social_personal',
	'Other Industries Nes': 'other_industries'
};

// ===== CSV parsing =====

function parseCSVRow(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

function parseNumericValue(s: string): number | null {
	const cleaned = s.trim();
	if (cleaned === '' || cleaned === 'na' || cleaned === '-' || cleaned === 'n.a.') {
		return null;
	}
	const val = parseFloat(cleaned);
	return isNaN(val) ? null : val;
}

/**
 * Detect the indentation level of a DataSeries label:
 *   0 spaces = occupation group header
 *   4 spaces = top-level industry (Manufacturing, Construction, Services, Other Industries Nes)
 *   8 spaces = services sub-sector
 */
function getIndentLevel(rawLabel: string): number {
	let spaces = 0;
	for (const ch of rawLabel) {
		if (ch === ' ') spaces++;
		else break;
	}
	return spaces;
}

/**
 * Clean a label by removing leading/trailing whitespace and surrounding quotes.
 */
function cleanLabel(raw: string): string {
	return raw.replace(/^"+|"+$/g, '').trim();
}

// ===== CAGR computation =====

function computeCAGR(startValue: number, endValue: number, years: number): number | null {
	if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
	return Math.pow(endValue / startValue, 1 / years) - 1;
}

function computeChange(startValue: number, endValue: number): number | null {
	if (startValue <= 0) return null;
	return (endValue - startValue) / startValue;
}

// ===== Main =====

function main() {
	console.log('=== Building Industry × Occupation Momentum ===\n');

	if (!fs.existsSync(INPUT_FILE)) {
		console.error(`ERROR: Input file not found: ${INPUT_FILE}`);
		process.exit(1);
	}

	const content = fs.readFileSync(INPUT_FILE, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());

	// Parse header to find year column indices
	const headerFields = parseCSVRow(lines[0]);
	const yearIdx2025 = headerFields.indexOf('2025');
	const yearIdx2023 = headerFields.indexOf('2023');
	const yearIdx2020 = headerFields.indexOf('2020');

	if (yearIdx2025 < 0 || yearIdx2023 < 0 || yearIdx2020 < 0) {
		console.error('ERROR: Could not find required year columns (2025, 2023, 2020)');
		console.error('Header fields:', headerFields.slice(0, 10));
		process.exit(1);
	}

	console.log(
		`  Year column indices: 2025=${yearIdx2025}, 2023=${yearIdx2023}, 2020=${yearIdx2020}`
	);

	// Parse all data rows
	// Track current occupation group as we iterate
	let currentOccGroup: string | null = null;
	const output: IndustryMomentumOutput = {};

	let rowsParsed = 0;
	let pairsComputed = 0;

	for (let i = 1; i < lines.length; i++) {
		const fields = parseCSVRow(lines[i]);
		if (fields.length < 2) continue;

		const rawLabel = fields[0];
		const indent = getIndentLevel(rawLabel);
		const label = cleanLabel(rawLabel);

		// Check if this is an occupation group header (0 indent)
		if (indent === 0) {
			const groupKey = OCCUPATION_GROUP_LABELS[label];
			if (groupKey) {
				currentOccGroup = groupKey;
				if (!output[currentOccGroup]) {
					output[currentOccGroup] = {};
				}
				// Also record the occupation group's own total row
				const e2025 = parseNumericValue(fields[yearIdx2025] ?? '');
				const e2023 = parseNumericValue(fields[yearIdx2023] ?? '');
				const e2020 = parseNumericValue(fields[yearIdx2020] ?? '');

				const cagr5y = e2020 !== null && e2025 !== null ? computeCAGR(e2020, e2025, 5) : null;
				const change2y = e2023 !== null && e2025 !== null ? computeChange(e2023, e2025) : null;
				output[currentOccGroup]['total'] = {
					cagr_5y: cagr5y !== null ? round(cagr5y, 6) : null,
					change_2y: change2y !== null ? round(change2y, 6) : null,
					employment_2025: e2025
				};
				rowsParsed++;
				pairsComputed++;
			} else {
				console.warn(`  WARNING: Unrecognized occupation group label: "${label}"`);
			}
			continue;
		}

		// This is an industry row (4 or 8 space indent)
		if (!currentOccGroup) continue;

		const industryKey = INDUSTRY_LABELS[label];
		if (!industryKey) {
			// Could be a minor variation — skip silently
			continue;
		}

		const e2025 = parseNumericValue(fields[yearIdx2025] ?? '');
		const e2023 = parseNumericValue(fields[yearIdx2023] ?? '');
		const e2020 = parseNumericValue(fields[yearIdx2020] ?? '');

		const cagr5y = e2020 !== null && e2025 !== null ? computeCAGR(e2020, e2025, 5) : null;
		const change2y = e2023 !== null && e2025 !== null ? computeChange(e2023, e2025) : null;

		output[currentOccGroup][industryKey] = {
			cagr_5y: cagr5y !== null ? round(cagr5y, 6) : null,
			change_2y: change2y !== null ? round(change2y, 6) : null,
			employment_2025: e2025
		};

		rowsParsed++;
		pairsComputed++;
	}

	// Write output
	const jsonOutput = JSON.stringify(output, null, 2);
	fs.writeFileSync(OUTPUT_FILE, jsonOutput);

	// Summary
	const groupCount = Object.keys(output).length;
	console.log(`\n  Parsed ${rowsParsed} data rows`);
	console.log(`  ${groupCount} occupation groups with industry breakdowns`);
	console.log(`  ${pairsComputed} (industry × occupation) pairs computed`);

	// Print highlights for key occupation groups
	const highlights = ['MANAGERS', 'PROFESSIONALS', 'ASSOCIATE_PROFESSIONALS_AND_TECHNICIANS'];
	for (const group of highlights) {
		const data = output[group];
		if (!data) continue;
		console.log(`\n  ${group}:`);
		for (const [industry, momentum] of Object.entries(data)) {
			if (industry === 'total' || industry === 'services' || industry === 'other_industries')
				continue;
			if (momentum.employment_2025 !== null && momentum.employment_2025 >= 5) {
				const cagr = momentum.cagr_5y !== null ? `${(momentum.cagr_5y * 100).toFixed(2)}%` : 'n/a';
				const ch2y =
					momentum.change_2y !== null ? `${(momentum.change_2y * 100).toFixed(2)}%` : 'n/a';
				console.log(
					`    ${industry}: CAGR=${cagr}, 2y_change=${ch2y}, emp_2025=${momentum.employment_2025}k`
				);
			}
		}
	}

	console.log(`\nWrote ${OUTPUT_FILE}`);
	console.log('\n=== Done ===');
}

function round(value: number, decimals: number): number {
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

main();
