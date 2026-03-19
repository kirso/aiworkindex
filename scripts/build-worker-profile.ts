#!/usr/bin/env bun
/**
 * build-worker-profile.ts — Build a Singapore worker-profile context layer
 * from official Labour Force Survey section D tables and wages-by-sex tables.
 *
 * Inputs:
 *   - data/raw/LFR2024_SectionD.xlsx
 *   - data/raw/wages_by_sex.xlsx
 *
 * Outputs:
 *   - data/worker-profile.json
 *   - src/lib/data/worker-profile.json
 *
 * Notes:
 *   - Broad-group worker composition comes from official 2024 labour-force tables.
 *   - Detailed gender anchors use published 2-digit occupation families from Table D8.
 *   - Occupation-level male/female wage medians are only available for common occupations.
 *   - This artifact is contextual and does not affect the structural score.
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const OUT_FILE = path.join(DATA_DIR, 'worker-profile.json');
const SRC_OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'worker-profile.json');
const STATIC_OUT_FILE = path.join(
	import.meta.dir,
	'..',
	'static',
	'data',
	'sg-worker-profile-2024.json'
);

type MajorGroupKey =
	| 'MANAGERS'
	| 'PROFESSIONALS'
	| 'ASSOCIATE PROFESSIONALS AND TECHNICIANS'
	| 'CLERICAL SUPPORT WORKERS'
	| 'SERVICE AND SALES WORKERS'
	| 'CRAFTSMEN AND RELATED TRADES WORKERS'
	| 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS'
	| 'CLEANERS, LABOURERS AND RELATED WORKERS';

interface GroupWorkerProfile {
	major_group: MajorGroupKey;
	total_employment_2024: number;
	sex_share: {
		male: number;
		female: number;
	};
	employment_status_share: {
		employers: number;
		employees: number;
		own_account_workers: number;
		contributing_family_workers: number;
		self_employed: number;
	};
	work_arrangement_share: {
		full_time: number;
		part_time: number;
	};
	age_share: {
		age_15_29: number;
		age_30_49: number;
		age_50_59: number;
		age_60_plus: number;
	};
	qualification_share: {
		below_secondary: number;
		secondary: number;
		post_secondary_non_tertiary: number;
		diploma_professional: number;
		degree: number;
	};
}

interface DetailedGenderAnchor {
	prefix2: string;
	label: string;
	total_employment_2024: number;
	male_share: number;
	female_share: number;
}

interface OccupationWageBySex {
	ssoc: string;
	occupation: string;
	male_gross_wage: number | null;
	female_gross_wage: number | null;
	gap_pct: number | null;
}

interface WorkerProfileOutput {
	groups: Record<MajorGroupKey, GroupWorkerProfile>;
	detailed_gender: Record<string, DetailedGenderAnchor>;
	occupation_wage_by_sex: Record<string, OccupationWageBySex>;
	metadata: {
		data_as_of: string;
		notes: string[];
	};
}

const GROUP_HEADER_MAP: Record<string, MajorGroupKey> = {
	'Managers & Administrators (Including Working Proprietors)': 'MANAGERS',
	Professionals: 'PROFESSIONALS',
	'Associate Professionals & Technicians': 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
	'Clerical Support Workers': 'CLERICAL SUPPORT WORKERS',
	'Service & Sales Workers': 'SERVICE AND SALES WORKERS',
	'Craftsmen & Related Trades Workers': 'CRAFTSMEN AND RELATED TRADES WORKERS',
	'Plant & Machine Operators & Assemblers': 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
	'Cleaners, Labourers & Related Workers': 'CLEANERS, LABOURERS AND RELATED WORKERS'
};

const AGE_BUCKET_MAP: Record<string, keyof GroupWorkerProfile['age_share']> = {
	'15 - 19': 'age_15_29',
	'20 - 24': 'age_15_29',
	'25 - 29': 'age_15_29',
	'30 - 34': 'age_30_49',
	'35 - 39': 'age_30_49',
	'40 - 44': 'age_30_49',
	'45 - 49': 'age_30_49',
	'50 - 54': 'age_50_59',
	'55 - 59': 'age_50_59',
	'60 - 64': 'age_60_plus',
	'65 - 69': 'age_60_plus',
	'70 & Over': 'age_60_plus'
};

const QUALIFICATION_BUCKET_MAP: Record<string, keyof GroupWorkerProfile['qualification_share']> = {
	'Below Secondary': 'below_secondary',
	Secondary: 'secondary',
	'Post-Secondary (Non-Tertiary)': 'post_secondary_non_tertiary',
	'Diploma & Professional Qualification': 'diploma_professional',
	Degree: 'degree'
};

function normalizeText(value: unknown): string {
	return String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim();
}

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function parseNumber(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	const normalized = normalizeText(value);
	if (!normalized || normalized === '-' || normalized.toLowerCase() === 'na') return null;
	const parsed = Number(normalized.replace(/,/g, ''));
	return Number.isFinite(parsed) ? parsed : null;
}

function readSheetRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
	return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
}

function getGroupColumns(rows: unknown[][]): Array<{ key: MajorGroupKey; column: number }> {
	const header = rows[6] ?? [];
	const columns: Array<{ key: MajorGroupKey; column: number }> = [];
	for (let column = 3; column <= 10; column++) {
		const key = GROUP_HEADER_MAP[normalizeText(header[column])];
		if (key) columns.push({ key, column });
	}
	if (columns.length !== 8) {
		throw new Error(`Expected 8 occupation-group columns, found ${columns.length}`);
	}
	return columns;
}

function rowValuesByGroup(
	rows: unknown[][],
	rowIndex: number,
	groupColumns: Array<{ key: MajorGroupKey; column: number }>
): Record<MajorGroupKey, number> {
	const row = rows[rowIndex] ?? [];
	return Object.fromEntries(
		groupColumns.map(({ key, column }) => [key, parseNumber(row[column]) ?? 0])
	) as Record<MajorGroupKey, number>;
}

function initializeGroups(
	totalRow: Record<MajorGroupKey, number>
): Record<MajorGroupKey, GroupWorkerProfile> {
	return Object.fromEntries(
		Object.entries(totalRow).map(([majorGroup, total]) => [
			majorGroup,
			{
				major_group: majorGroup as MajorGroupKey,
				total_employment_2024: total,
				sex_share: { male: 0, female: 0 },
				employment_status_share: {
					employers: 0,
					employees: 0,
					own_account_workers: 0,
					contributing_family_workers: 0,
					self_employed: 0
				},
				work_arrangement_share: { full_time: 0, part_time: 0 },
				age_share: {
					age_15_29: 0,
					age_30_49: 0,
					age_50_59: 0,
					age_60_plus: 0
				},
				qualification_share: {
					below_secondary: 0,
					secondary: 0,
					post_secondary_non_tertiary: 0,
					diploma_professional: 0,
					degree: 0
				}
			}
		])
	) as Record<MajorGroupKey, GroupWorkerProfile>;
}

function parseGroupProfiles(workbook: XLSX.WorkBook): Record<MajorGroupKey, GroupWorkerProfile> {
	const d3 = readSheetRows(workbook, 'D3');
	const d4 = readSheetRows(workbook, 'D4');
	const d5 = readSheetRows(workbook, 'D5');
	const d6 = readSheetRows(workbook, 'D6');
	const groupColumns = getGroupColumns(d3);
	const totals = rowValuesByGroup(d3, 7, groupColumns);
	const groups = initializeGroups(totals);

	const d3Rows = {
		employers: rowValuesByGroup(d3, 8, groupColumns),
		employees: rowValuesByGroup(d3, 9, groupColumns),
		own_account_workers: rowValuesByGroup(d3, 10, groupColumns),
		contributing_family_workers: rowValuesByGroup(d3, 11, groupColumns),
		male_total: rowValuesByGroup(d3, 12, groupColumns),
		female_total: rowValuesByGroup(d3, 17, groupColumns)
	};

	for (const [majorGroup, profile] of Object.entries(groups) as Array<
		[MajorGroupKey, GroupWorkerProfile]
	>) {
		const total = profile.total_employment_2024 || 1;
		profile.sex_share.male = round(d3Rows.male_total[majorGroup] / total);
		profile.sex_share.female = round(d3Rows.female_total[majorGroup] / total);
		profile.employment_status_share.employers = round(d3Rows.employers[majorGroup] / total);
		profile.employment_status_share.employees = round(d3Rows.employees[majorGroup] / total);
		profile.employment_status_share.own_account_workers = round(
			d3Rows.own_account_workers[majorGroup] / total
		);
		profile.employment_status_share.contributing_family_workers = round(
			d3Rows.contributing_family_workers[majorGroup] / total
		);
		profile.employment_status_share.self_employed = round(
			profile.employment_status_share.employers +
				profile.employment_status_share.own_account_workers +
				profile.employment_status_share.contributing_family_workers
		);
	}

	const fullTime = rowValuesByGroup(d4, 8, groupColumns);
	const partTime = rowValuesByGroup(d4, 9, groupColumns);
	for (const [majorGroup, profile] of Object.entries(groups) as Array<
		[MajorGroupKey, GroupWorkerProfile]
	>) {
		const total = profile.total_employment_2024 || 1;
		profile.work_arrangement_share.full_time = round(fullTime[majorGroup] / total);
		profile.work_arrangement_share.part_time = round(partTime[majorGroup] / total);
	}

	for (let rowIndex = 8; rowIndex <= 19; rowIndex++) {
		const row = d5[rowIndex] ?? [];
		const ageBucket = AGE_BUCKET_MAP[normalizeText(row[1])];
		if (!ageBucket) continue;
		const values = rowValuesByGroup(d5, rowIndex, groupColumns);
		for (const [majorGroup, profile] of Object.entries(groups) as Array<
			[MajorGroupKey, GroupWorkerProfile]
		>) {
			profile.age_share[ageBucket] = round(
				profile.age_share[ageBucket] + values[majorGroup] / (profile.total_employment_2024 || 1)
			);
		}
	}

	for (let rowIndex = 8; rowIndex <= 12; rowIndex++) {
		const row = d6[rowIndex] ?? [];
		const qualificationBucket = QUALIFICATION_BUCKET_MAP[normalizeText(row[1])];
		if (!qualificationBucket) continue;
		const values = rowValuesByGroup(d6, rowIndex, groupColumns);
		for (const [majorGroup, profile] of Object.entries(groups) as Array<
			[MajorGroupKey, GroupWorkerProfile]
		>) {
			profile.qualification_share[qualificationBucket] = round(
				values[majorGroup] / (profile.total_employment_2024 || 1)
			);
		}
	}

	return groups;
}

function parseDetailedGenderAnchors(workbook: XLSX.WorkBook): Record<string, DetailedGenderAnchor> {
	const d8 = readSheetRows(workbook, 'D8');
	const anchors: Record<string, DetailedGenderAnchor> = {};
	for (const row of d8.slice(8)) {
		const labelCell = normalizeText(row[0]);
		if (!labelCell) continue;
		const codeMatch = labelCell.match(/^(\d{2})\s+(.*)$/);
		if (!codeMatch) continue;
		const total = parseNumber(row[1]);
		const male = parseNumber(row[2]);
		const female = parseNumber(row[3]);
		if (total === null || male === null || female === null || total <= 0) continue;
		const [, prefix2, label] = codeMatch;
		anchors[prefix2] = {
			prefix2,
			label,
			total_employment_2024: total,
			male_share: round(male / total),
			female_share: round(female / total)
		};
	}
	return anchors;
}

function parseWagesBySex(): Record<string, OccupationWageBySex> {
	const workbook = XLSX.readFile(path.join(RAW_DIR, 'wages_by_sex.xlsx'));
	const maleRows = readSheetRows(workbook, 'T1.1');
	const femaleRows = readSheetRows(workbook, 'T1.2');
	const bySsoc = new Map<string, OccupationWageBySex>();

	function mergeRows(rows: unknown[][], sex: 'male' | 'female') {
		for (const row of rows.slice(8)) {
			const ssoc = normalizeText(row[1]);
			if (!/^\d{5}$/.test(ssoc)) continue;
			const occupation = normalizeText(row[2]);
			const grossWage = parseNumber(row[4]);
			const existing = bySsoc.get(ssoc) ?? {
				ssoc,
				occupation,
				male_gross_wage: null,
				female_gross_wage: null,
				gap_pct: null
			};
			if (sex === 'male') existing.male_gross_wage = grossWage;
			else existing.female_gross_wage = grossWage;
			bySsoc.set(ssoc, existing);
		}
	}

	mergeRows(maleRows, 'male');
	mergeRows(femaleRows, 'female');

	return Object.fromEntries(
		[...bySsoc.entries()].map(([ssoc, row]) => [
			ssoc,
			{
				...row,
				gap_pct:
					row.male_gross_wage && row.female_gross_wage
						? round((row.female_gross_wage - row.male_gross_wage) / row.male_gross_wage)
						: null
			}
		])
	);
}

function validate(output: WorkerProfileOutput) {
	for (const [majorGroup, profile] of Object.entries(output.groups)) {
		const sexTotal = round(profile.sex_share.male + profile.sex_share.female);
		const employmentStatusTotal = round(
			profile.employment_status_share.employers +
				profile.employment_status_share.employees +
				profile.employment_status_share.own_account_workers +
				profile.employment_status_share.contributing_family_workers
		);
		const workArrangementTotal = round(
			profile.work_arrangement_share.full_time + profile.work_arrangement_share.part_time
		);
		const ageTotal = round(
			profile.age_share.age_15_29 +
				profile.age_share.age_30_49 +
				profile.age_share.age_50_59 +
				profile.age_share.age_60_plus
		);
		const qualificationTotal = round(
			profile.qualification_share.below_secondary +
				profile.qualification_share.secondary +
				profile.qualification_share.post_secondary_non_tertiary +
				profile.qualification_share.diploma_professional +
				profile.qualification_share.degree
		);

		for (const [name, total] of [
			['sex', sexTotal],
			['employment status', employmentStatusTotal],
			['work arrangement', workArrangementTotal],
			['age', ageTotal],
			['qualification', qualificationTotal]
		]) {
			if (Math.abs(total - 1) > 0.02) {
				throw new Error(`${majorGroup} ${name} shares sum to ${total}, expected ~1`);
			}
		}
	}
}

const labourWorkbook = XLSX.readFile(path.join(RAW_DIR, 'LFR2024_SectionD.xlsx'));
const output: WorkerProfileOutput = {
	groups: parseGroupProfiles(labourWorkbook),
	detailed_gender: parseDetailedGenderAnchors(labourWorkbook),
	occupation_wage_by_sex: parseWagesBySex(),
	metadata: {
		data_as_of: '2024',
		notes: [
			'Broad-group worker composition uses Labour Force in Singapore 2024 Section D tables.',
			'Detailed gender anchors use published 2-digit occupation families from Table D8.',
			'Occupation-level male/female gross wage medians are only available for common occupations in the wages-by-sex tables.',
			'This artifact is contextual and does not feed into the canonical structural score.'
		]
	}
};

validate(output);

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');

console.log(
	`Built worker profile context for ${Object.keys(output.groups).length} major groups, ${
		Object.keys(output.detailed_gender).length
	} detailed gender anchors, and ${
		Object.keys(output.occupation_wage_by_sex).length
	} wage-by-sex occupations.`
);
