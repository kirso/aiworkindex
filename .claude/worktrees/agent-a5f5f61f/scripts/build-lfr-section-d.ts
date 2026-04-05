#!/usr/bin/env bun
/**
 * build-lfr-section-d.ts — Normalize MOM Labour Force Section D tables across
 * 2024 and 2025 into a stable artifact for downstream scoring, validation, and
 * context publishing.
 *
 * Inputs:
 *   - data/raw/LFR2024_SectionD.xlsx
 *   - data/raw/LFR2025_SectionD.xlsx
 *
 * Outputs:
 *   - data/lfr-section-d-signals.json
 *   - src/lib/data/lfr-section-d-signals.json
 *   - static/data/sg-lfr-section-d-2025.json
 *   - static/data/sg-lfr-deltas-2025.json
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OUT_FILE = path.join(DATA_DIR, 'lfr-section-d-signals.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'lfr-section-d-signals.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-lfr-section-d-2025.json');
const STATIC_DELTAS_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-lfr-deltas-2025.json');

const GROUP_HEADER_MAP = {
	'Managers & Administrators (Including Working Proprietors)': 'MANAGERS',
	Professionals: 'PROFESSIONALS',
	'Associate Professionals & Technicians': 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
	'Clerical Support Workers': 'CLERICAL SUPPORT WORKERS',
	'Service & Sales Workers': 'SERVICE AND SALES WORKERS',
	'Craftsmen & Related Trades Workers': 'CRAFTSMEN AND RELATED TRADES WORKERS',
	'Plant & Machine Operators & Assemblers': 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
	'Cleaners, Labourers & Related Workers': 'CLEANERS, LABOURERS AND RELATED WORKERS'
} as const;

type MajorGroupKey = keyof {
	MANAGERS: true;
	PROFESSIONALS: true;
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': true;
	'CLERICAL SUPPORT WORKERS': true;
	'SERVICE AND SALES WORKERS': true;
	'CRAFTSMEN AND RELATED TRADES WORKERS': true;
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': true;
	'CLEANERS, LABOURERS AND RELATED WORKERS': true;
};

type ClusterKey = 'pmet' | 'clerical_sales_service' | 'production_transport';

interface FamilyEmploymentSnapshot {
	code: string;
	label: string;
	total: number;
	male: number;
	female: number;
	male_share: number;
	female_share: number;
}

interface FamilyEmploymentSeries extends FamilyEmploymentSnapshot {
	total_2024: number;
	total_2025: number;
	male_2024: number;
	male_2025: number;
	female_2024: number;
	female_2025: number;
	delta_k: number;
	delta_pct: number | null;
}

interface GroupProfile {
	major_group: MajorGroupKey;
	total_employment: number;
	sex_share: { male: number; female: number };
	employment_status_share: {
		employers: number;
		employees: number;
		own_account_workers: number;
		contributing_family_workers: number;
		self_employed: number;
	};
	work_arrangement_share: { full_time: number; part_time: number };
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
	marital_status_share: {
		single: number;
		married: number;
		widowed_divorced: number;
	};
}

interface ClusterCharacteristicRow {
	label: string;
	metric_group: 'age' | 'qualification' | 'employment_status' | 'nature_of_employment';
	total_2024: number;
	total_2025: number;
	male_2024: number;
	male_2025: number;
	female_2024: number;
	female_2025: number;
	delta_k: number;
	delta_pct: number | null;
}

interface ClusterIndustryRow {
	label: string;
	total_2024: number;
	total_2025: number;
	share_2024: number | null;
	share_2025: number | null;
	share_delta_pp: number | null;
}

interface IndustryOccupationMix {
	industry: string;
	total_employment: number;
	sex_share: { male: number; female: number };
	major_group_share: Record<MajorGroupKey, number>;
}

interface IndustryProfile {
	industry: string;
	total_employment: number;
	sex_share: { male: number; female: number };
	employment_status_share: {
		employers: number;
		employees: number;
		own_account_workers: number;
		contributing_family_workers: number;
		self_employed: number;
	};
	work_arrangement_share: { full_time: number; part_time: number };
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
	marital_status_share: {
		single: number;
		married: number;
		widowed_divorced: number;
	};
}

interface SectionDSignals {
	metadata: {
		data_as_of: string;
		source_files: string[];
		notes: string[];
	};
	family_employment: Record<string, FamilyEmploymentSeries>;
	group_profile: {
		'2024': Record<MajorGroupKey, GroupProfile>;
		'2025': Record<MajorGroupKey, GroupProfile>;
	};
	cluster_characteristics: Record<ClusterKey, ClusterCharacteristicRow[]>;
	cluster_industry_mix: Record<ClusterKey, ClusterIndustryRow[]>;
	industry_occupation_mix: {
		'2024': Record<string, IndustryOccupationMix>;
		'2025': Record<string, IndustryOccupationMix>;
	};
	industry_profile: {
		'2024': Record<string, IndustryProfile>;
		'2025': Record<string, IndustryProfile>;
	};
}

function normalizeText(value: unknown): string {
	return String(value ?? '')
		.replace(/\r/g, ' ')
		.replace(/\n/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseNumber(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	const normalized = normalizeText(value);
	if (!normalized || normalized === '-' || normalized.toLowerCase() === 'na') return null;
	const parsed = Number(normalized.replace(/,/g, ''));
	return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function readRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
	return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
}

function getGroupColumns(rows: unknown[][]): Array<{ key: MajorGroupKey; column: number }> {
	const header = rows[6] ?? [];
	const columns: Array<{ key: MajorGroupKey; column: number }> = [];
	for (let column = 3; column <= 10; column++) {
		const key = GROUP_HEADER_MAP[normalizeText(header[column]) as keyof typeof GROUP_HEADER_MAP];
		if (key) columns.push({ key, column });
	}
	if (columns.length !== 8) {
		throw new Error(`Expected 8 major-group columns, found ${columns.length}`);
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

function createEmptyGroupProfile(major_group: MajorGroupKey, total: number): GroupProfile {
	return {
		major_group,
		total_employment: total,
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
		},
		marital_status_share: {
			single: 0,
			married: 0,
			widowed_divorced: 0
		}
	};
}

function createEmptyIndustryProfile(industry: string, total: number): IndustryProfile {
	return {
		industry,
		total_employment: total,
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
		},
		marital_status_share: {
			single: 0,
			married: 0,
			widowed_divorced: 0
		}
	};
}

function parseGroupProfiles(workbook: XLSX.WorkBook): Record<MajorGroupKey, GroupProfile> {
	const d3 = readRows(workbook, 'D3');
	const d4 = readRows(workbook, 'D4');
	const d5 = readRows(workbook, 'D5');
	const d6 = readRows(workbook, 'D6');
	const d7 = readRows(workbook, 'D7');
	const groupColumns = getGroupColumns(d3);
	const totals = rowValuesByGroup(d3, 7, groupColumns);
	const groups = Object.fromEntries(
		Object.entries(totals).map(([majorGroup, total]) => [
			majorGroup,
			createEmptyGroupProfile(majorGroup as MajorGroupKey, total)
		])
	) as Record<MajorGroupKey, GroupProfile>;

	const d3Rows = {
		employers: rowValuesByGroup(d3, 8, groupColumns),
		employees: rowValuesByGroup(d3, 9, groupColumns),
		own_account_workers: rowValuesByGroup(d3, 10, groupColumns),
		contributing_family_workers: rowValuesByGroup(d3, 11, groupColumns),
		male_total: rowValuesByGroup(d3, 12, groupColumns),
		female_total: rowValuesByGroup(d3, 17, groupColumns)
	};
	for (const [majorGroup, profile] of Object.entries(groups) as Array<
		[MajorGroupKey, GroupProfile]
	>) {
		const total = profile.total_employment || 1;
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
		[MajorGroupKey, GroupProfile]
	>) {
		const total = profile.total_employment || 1;
		profile.work_arrangement_share.full_time = round(fullTime[majorGroup] / total);
		profile.work_arrangement_share.part_time = round(partTime[majorGroup] / total);
	}

	const ageMap = {
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
	} as const;
	for (let rowIndex = 8; rowIndex <= 19; rowIndex++) {
		const bucket = ageMap[normalizeText(d5[rowIndex]?.[1]) as keyof typeof ageMap];
		if (!bucket) continue;
		const values = rowValuesByGroup(d5, rowIndex, groupColumns);
		for (const [majorGroup, profile] of Object.entries(groups) as Array<
			[MajorGroupKey, GroupProfile]
		>) {
			profile.age_share[bucket] = round(
				profile.age_share[bucket] + values[majorGroup] / (profile.total_employment || 1)
			);
		}
	}

	const qualificationMap = {
		'Below Secondary': 'below_secondary',
		Secondary: 'secondary',
		'Post-Secondary (Non-Tertiary)': 'post_secondary_non_tertiary',
		'Diploma & Professional Qualification': 'diploma_professional',
		Degree: 'degree'
	} as const;
	for (let rowIndex = 8; rowIndex <= 12; rowIndex++) {
		const bucket =
			qualificationMap[normalizeText(d6[rowIndex]?.[1]) as keyof typeof qualificationMap];
		if (!bucket) continue;
		const values = rowValuesByGroup(d6, rowIndex, groupColumns);
		for (const [majorGroup, profile] of Object.entries(groups) as Array<
			[MajorGroupKey, GroupProfile]
		>) {
			profile.qualification_share[bucket] = round(values[majorGroup] / (profile.total_employment || 1));
		}
	}

	const maritalMap = {
		Single: 'single',
		Married: 'married',
		'Widowed / Divorced': 'widowed_divorced'
	} as const;
	for (let rowIndex = 8; rowIndex <= 10; rowIndex++) {
		const bucket = maritalMap[normalizeText(d7[rowIndex]?.[1]) as keyof typeof maritalMap];
		if (!bucket) continue;
		const values = rowValuesByGroup(d7, rowIndex, groupColumns);
		for (const [majorGroup, profile] of Object.entries(groups) as Array<
			[MajorGroupKey, GroupProfile]
		>) {
			profile.marital_status_share[bucket] = round(values[majorGroup] / (profile.total_employment || 1));
		}
	}

	return groups;
}

function getIndustryRows(
	rows: unknown[][],
	startRow: number,
	stopMarkers: string[] = []
): Array<{ rowIndex: number; label: string }> {
	const entries: Array<{ rowIndex: number; label: string }> = [];
	for (let rowIndex = startRow; rowIndex < rows.length; rowIndex++) {
		const firstCell = normalizeText(rows[rowIndex]?.[0]);
		const label = normalizeText(rows[rowIndex]?.[1]);
		if (stopMarkers.includes(firstCell)) break;
		if (firstCell.startsWith('Source:')) break;
		if (firstCell && firstCell !== 'Total' && !label) break;
		if (!label || label === 'Total') continue;
		const total = parseNumber(rows[rowIndex]?.[2]) ?? parseNumber(rows[rowIndex]?.[1]);
		if (total === null) continue;
		entries.push({ rowIndex, label });
	}
	return entries;
}

function parseIndustryOccupationMix(workbook: XLSX.WorkBook): Record<string, IndustryOccupationMix> {
	const rows = readRows(workbook, 'D2');
	const totalBlock = getIndustryRows(rows, 8, ['Male', 'Female']);
	const maleBlock = getIndustryRows(rows, 25, ['Female']);
	const femaleBlock = getIndustryRows(rows, 42);
	const groupColumns: Array<{ key: MajorGroupKey; column: number }> = [
		{ key: 'MANAGERS', column: 3 },
		{ key: 'PROFESSIONALS', column: 4 },
		{ key: 'ASSOCIATE PROFESSIONALS AND TECHNICIANS', column: 5 },
		{ key: 'CLERICAL SUPPORT WORKERS', column: 6 },
		{ key: 'SERVICE AND SALES WORKERS', column: 7 },
		{ key: 'CRAFTSMEN AND RELATED TRADES WORKERS', column: 8 },
		{ key: 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS', column: 9 },
		{ key: 'CLEANERS, LABOURERS AND RELATED WORKERS', column: 10 }
	];

	const maleByIndustry = new Map(
		maleBlock.map(({ rowIndex, label }) => [label, parseNumber(rows[rowIndex]?.[2]) ?? 0])
	);
	const femaleByIndustry = new Map(
		femaleBlock.map(({ rowIndex, label }) => [label, parseNumber(rows[rowIndex]?.[2]) ?? 0])
	);

	return Object.fromEntries(
		totalBlock.map(({ rowIndex, label }) => {
			const total = parseNumber(rows[rowIndex]?.[2]) ?? 0;
			const majorGroupShare = Object.fromEntries(
				groupColumns.map(({ key, column }) => [key, round((parseNumber(rows[rowIndex]?.[column]) ?? 0) / (total || 1))])
			) as Record<MajorGroupKey, number>;
			const male = maleByIndustry.get(label) ?? 0;
			const female = femaleByIndustry.get(label) ?? 0;
			return [
				label,
				{
					industry: label,
					total_employment: total,
					sex_share: {
						male: round(male / (total || 1)),
						female: round(female / (total || 1))
					},
					major_group_share: majorGroupShare
				}
			];
		})
	) as Record<string, IndustryOccupationMix>;
}

function parseIndustryProfiles(workbook: XLSX.WorkBook): Record<string, IndustryProfile> {
	const d13 = readRows(workbook, 'D13');
	const d14 = readRows(workbook, 'D14');
	const d15 = readRows(workbook, 'D15');
	const d16 = readRows(workbook, 'D16');
	const d17 = readRows(workbook, 'D17');
	const industries = getIndustryRows(d13, 8, ['Male', 'Female']);
	const d14Rows = new Map(getIndustryRows(d14, 9).map(({ rowIndex, label }) => [label, rowIndex]));
	const d15Rows = new Map(getIndustryRows(d15, 8).map(({ rowIndex, label }) => [label, rowIndex]));
	const d16Rows = new Map(getIndustryRows(d16, 8).map(({ rowIndex, label }) => [label, rowIndex]));
	const d17Rows = new Map(getIndustryRows(d17, 8).map(({ rowIndex, label }) => [label, rowIndex]));
	const profiles = Object.fromEntries(
		industries.map(({ rowIndex, label }) => [
			label,
			createEmptyIndustryProfile(label, parseNumber(d13[rowIndex]?.[2]) ?? 0)
		])
	) as Record<string, IndustryProfile>;

	for (const { rowIndex, label } of industries) {
		const profile = profiles[label];
		const total = profile.total_employment || 1;
		const d14Row = d14Rows.get(label) ?? rowIndex;
		const male = parseNumber(d14[d14Row]?.[2]) ?? 0;
		const female = parseNumber(d14[d14Row]?.[3]) ?? 0;
		profile.sex_share.male = round(male / total);
		profile.sex_share.female = round(female / total);
		profile.employment_status_share.employers = round((parseNumber(d13[rowIndex]?.[3]) ?? 0) / total);
		profile.employment_status_share.employees = round((parseNumber(d13[rowIndex]?.[4]) ?? 0) / total);
		profile.employment_status_share.own_account_workers = round((parseNumber(d13[rowIndex]?.[5]) ?? 0) / total);
		profile.employment_status_share.contributing_family_workers = round((parseNumber(d13[rowIndex]?.[6]) ?? 0) / total);
		profile.employment_status_share.self_employed = round(
			profile.employment_status_share.employers +
				profile.employment_status_share.own_account_workers +
				profile.employment_status_share.contributing_family_workers
		);
		profile.work_arrangement_share.full_time = round((parseNumber(d14[d14Row]?.[4]) ?? 0) / total);
		profile.work_arrangement_share.part_time = round((parseNumber(d14[d14Row]?.[7]) ?? 0) / total);
	}

	const ageColumns = [
		{ column: 3, bucket: 'age_15_29' as const },
		{ column: 4, bucket: 'age_15_29' as const },
		{ column: 5, bucket: 'age_15_29' as const },
		{ column: 6, bucket: 'age_30_49' as const },
		{ column: 7, bucket: 'age_30_49' as const },
		{ column: 8, bucket: 'age_30_49' as const },
		{ column: 9, bucket: 'age_30_49' as const },
		{ column: 10, bucket: 'age_50_59' as const },
		{ column: 11, bucket: 'age_50_59' as const },
		{ column: 12, bucket: 'age_60_plus' as const },
		{ column: 13, bucket: 'age_60_plus' as const },
		{ column: 14, bucket: 'age_60_plus' as const }
	];
	for (const { label } of industries) {
		const industryRow = d15Rows.get(label);
		if (industryRow === undefined) continue;
		for (const { column, bucket } of ageColumns) {
			profiles[label].age_share[bucket] = round(
				profiles[label].age_share[bucket] +
					(parseNumber(d15[industryRow]?.[column]) ?? 0) / (profiles[label].total_employment || 1)
			);
		}
	}

	const qualificationColumns = [
		{ column: 3, bucket: 'below_secondary' as const },
		{ column: 4, bucket: 'secondary' as const },
		{ column: 5, bucket: 'post_secondary_non_tertiary' as const },
		{ column: 6, bucket: 'diploma_professional' as const },
		{ column: 7, bucket: 'degree' as const }
	];
	for (const { label } of industries) {
		const industryRow = d16Rows.get(label);
		if (industryRow === undefined) continue;
		for (const { column, bucket } of qualificationColumns) {
			profiles[label].qualification_share[bucket] = round(
				(parseNumber(d16[industryRow]?.[column]) ?? 0) / (profiles[label].total_employment || 1)
			);
		}
	}

	const maritalColumns = [
		{ column: 3, bucket: 'single' as const },
		{ column: 4, bucket: 'married' as const },
		{ column: 5, bucket: 'widowed_divorced' as const }
	];
	for (const { label } of industries) {
		const industryRow = d17Rows.get(label);
		if (industryRow === undefined) continue;
		for (const { column, bucket } of maritalColumns) {
			profiles[label].marital_status_share[bucket] = round(
				(parseNumber(d17[industryRow]?.[column]) ?? 0) / (profiles[label].total_employment || 1)
			);
		}
	}

	return profiles;
}

function parseD8Snapshots(workbook: XLSX.WorkBook): Record<string, FamilyEmploymentSnapshot> {
	const rows = readRows(workbook, 'D8');
	const snapshots: Record<string, FamilyEmploymentSnapshot> = {};
	for (const row of rows.slice(8)) {
		const labelCell = normalizeText(row[0]);
		const match = labelCell.match(/^(\d{2})\s+(.*)$/);
		if (!match) continue;
		const total = parseNumber(row[1]);
		const male = parseNumber(row[2]);
		const female = parseNumber(row[3]);
		if (total === null || male === null || female === null || total <= 0) continue;
		const [, code, label] = match;
		snapshots[code] = {
			code,
			label,
			total,
			male,
			female,
			male_share: round(male / total),
			female_share: round(female / total)
		};
	}
	return snapshots;
}

function mergeD8Series(
	snapshots2024: Record<string, FamilyEmploymentSnapshot>,
	snapshots2025: Record<string, FamilyEmploymentSnapshot>
): Record<string, FamilyEmploymentSeries> {
	return Object.fromEntries(
		Object.keys({ ...snapshots2024, ...snapshots2025 })
			.sort()
			.map((code) => {
				const prior = snapshots2024[code];
				const current = snapshots2025[code];
				if (!prior || !current) {
					throw new Error(`Missing family snapshot for code ${code} in one of the Section D vintages.`);
				}
				const delta_k = round(current.total - prior.total, 1);
				const delta_pct = prior.total > 0 ? round((current.total - prior.total) / prior.total, 4) : null;
				return [
					code,
					{
						code,
						label: current.label,
						total: current.total,
						male: current.male,
						female: current.female,
						male_share: current.male_share,
						female_share: current.female_share,
						total_2024: prior.total,
						total_2025: current.total,
						male_2024: prior.male,
						male_2025: current.male,
						female_2024: prior.female,
						female_2025: current.female,
						delta_k,
						delta_pct
					}
				];
			})
	) as Record<string, FamilyEmploymentSeries>;
}

function parseD9ClusterRows(workbook: XLSX.WorkBook) {
	const rows = readRows(workbook, 'D9');
	const clusters: Array<{ key: ClusterKey; start: number }> = [
		{ key: 'pmet', start: 1 },
		{ key: 'clerical_sales_service', start: 4 },
		{ key: 'production_transport', start: 7 }
	];
	const sections = [
		{ start: 8, end: 17, metric_group: 'age' as const },
		{ start: 18, end: 24, metric_group: 'qualification' as const },
		{ start: 25, end: 30, metric_group: 'employment_status' as const },
		{ start: 31, end: 34, metric_group: 'nature_of_employment' as const }
	];
	const result: Record<ClusterKey, Array<Omit<ClusterCharacteristicRow, 'total_2024' | 'total_2025' | 'male_2024' | 'male_2025' | 'female_2024' | 'female_2025' | 'delta_k' | 'delta_pct'>>> = {
		pmet: [],
		clerical_sales_service: [],
		production_transport: []
	};
	for (const section of sections) {
		for (let rowIndex = section.start + 1; rowIndex <= section.end; rowIndex++) {
			const label = normalizeText(rows[rowIndex]?.[0]);
			if (!label || label === 'Total') continue;
			for (const cluster of clusters) {
				result[cluster.key].push({
					label,
					metric_group: section.metric_group
				});
			}
		}
	}

	const values: Record<ClusterKey, Record<string, { total: number; male: number; female: number }>> = {
		pmet: {},
		clerical_sales_service: {},
		production_transport: {}
	};
	for (const section of sections) {
		for (let rowIndex = section.start + 1; rowIndex <= section.end; rowIndex++) {
			const label = normalizeText(rows[rowIndex]?.[0]);
			if (!label || label === 'Total') continue;
			for (const cluster of clusters) {
				values[cluster.key][label] = {
					total: parseNumber(rows[rowIndex]?.[cluster.start]) ?? 0,
					male: parseNumber(rows[rowIndex]?.[cluster.start + 1]) ?? 0,
					female: parseNumber(rows[rowIndex]?.[cluster.start + 2]) ?? 0
				};
			}
		}
	}
	return values;
}

function mergeD9Series(
	workbook2024: XLSX.WorkBook,
	workbook2025: XLSX.WorkBook
): Record<ClusterKey, ClusterCharacteristicRow[]> {
	const prior = parseD9ClusterRows(workbook2024);
	const current = parseD9ClusterRows(workbook2025);
	const result = {
		pmet: [] as ClusterCharacteristicRow[],
		clerical_sales_service: [] as ClusterCharacteristicRow[],
		production_transport: [] as ClusterCharacteristicRow[]
	};

	for (const key of Object.keys(result) as ClusterKey[]) {
		for (const label of Object.keys(current[key])) {
			const priorRow = prior[key][label];
			const currentRow = current[key][label];
			if (!priorRow || !currentRow) continue;
			const metricGroup =
				['15 - 24', '25 - 29', '30 - 39', '40 - 49', '50 - 59', '60 & Over', '60 - 69', '70 & Over'].includes(label)
					? 'age'
					: ['Below Secondary', 'Secondary', 'Post-Secondary (Non-Tertiary)', 'Diploma & Professional Qualification', 'Degree'].includes(label)
						? 'qualification'
						: ['Employers', 'Employees', 'Own Account Workers', 'Contributing Family Workers'].includes(label)
							? 'employment_status'
							: 'nature_of_employment';
			result[key].push({
				label,
				metric_group: metricGroup,
				total_2024: priorRow.total,
				total_2025: currentRow.total,
				male_2024: priorRow.male,
				male_2025: currentRow.male,
				female_2024: priorRow.female,
				female_2025: currentRow.female,
				delta_k: round(currentRow.total - priorRow.total, 1),
				delta_pct: priorRow.total > 0 ? round((currentRow.total - priorRow.total) / priorRow.total, 4) : null
			});
		}
	}
	return result;
}

function parseIndustryMix(workbook: XLSX.WorkBook, sheetName: 'D10' | 'D11' | 'D12'): Record<string, number> {
	const rows = readRows(workbook, sheetName);
	const totals = new Map<string, number>();
	const grandTotal = parseNumber(rows[7]?.[1]) ?? 0;
	for (let rowIndex = 8; rowIndex < rows.length; rowIndex++) {
		const label = normalizeText(rows[rowIndex]?.[0]);
		if (!label || label.startsWith('Source:')) continue;
		const total = parseNumber(rows[rowIndex]?.[1]);
		if (total === null) continue;
		totals.set(label, total);
	}
	if (grandTotal <= 0) {
		throw new Error(`Grand total missing for ${sheetName}.`);
	}
	return Object.fromEntries(
		[...totals.entries()].map(([label, total]) => [label, total])
	);
}

function mergeIndustrySeries(
	workbook2024: XLSX.WorkBook,
	workbook2025: XLSX.WorkBook,
	sheetName: 'D10' | 'D11' | 'D12'
): ClusterIndustryRow[] {
	const prior = parseIndustryMix(workbook2024, sheetName);
	const current = parseIndustryMix(workbook2025, sheetName);
	const priorTotal = prior.Total;
	const currentTotal = current.Total;
	return Object.keys(current)
		.filter((label) => label !== 'Total')
		.map((label) => {
			const total2024 = prior[label] ?? 0;
			const total2025 = current[label] ?? 0;
			const share2024 = priorTotal > 0 ? round(total2024 / priorTotal, 4) : null;
			const share2025 = currentTotal > 0 ? round(total2025 / currentTotal, 4) : null;
			return {
				label,
				total_2024: total2024,
				total_2025: total2025,
				share_2024: share2024,
				share_2025: share2025,
				share_delta_pp:
					share2024 !== null && share2025 !== null ? round((share2025 - share2024) * 100, 2) : null
			};
		});
}

function buildDeltaArtifact(signals: SectionDSignals) {
	return {
		data_as_of: signals.metadata.data_as_of,
		family_employment: Object.values(signals.family_employment)
			.sort((a, b) => Math.abs(b.delta_k) - Math.abs(a.delta_k))
			.map((row) => ({
				code: row.code,
				label: row.label,
				total_2024: row.total_2024,
				total_2025: row.total_2025,
				delta_k: row.delta_k,
				delta_pct: row.delta_pct
			})),
		cluster_characteristics: signals.cluster_characteristics,
		cluster_industry_mix: signals.cluster_industry_mix,
		industry_occupation_mix: signals.industry_occupation_mix['2025'],
		industry_profile: signals.industry_profile['2025']
	};
}

function main() {
	const workbook2024 = XLSX.readFile(path.join(RAW_DIR, 'LFR2024_SectionD.xlsx'));
	const workbook2025 = XLSX.readFile(path.join(RAW_DIR, 'LFR2025_SectionD.xlsx'));
	const signals: SectionDSignals = {
		metadata: {
			data_as_of: '2025',
			source_files: ['LFR2024_SectionD.xlsx', 'LFR2025_SectionD.xlsx'],
			notes: [
				'D8 provides official 2-digit occupation-family totals, not detailed 4-digit or 5-digit SSOC occupation headcounts.',
				'D1 is intentionally excluded because broad occupation history is already handled by the published employment-by-occupation-group series.',
				'D2 and D13 to D17 add industry-composition and workforce-context cross-tabs; these are normalized for context and future methodology work, not treated as detailed occupation headcounts.',
				'D9 to D12 are published for validation, reporting, and experimental overlays; they are not direct structural-score multipliers.'
			]
		},
		family_employment: mergeD8Series(parseD8Snapshots(workbook2024), parseD8Snapshots(workbook2025)),
		group_profile: {
			'2024': parseGroupProfiles(workbook2024),
			'2025': parseGroupProfiles(workbook2025)
		},
		cluster_characteristics: mergeD9Series(workbook2024, workbook2025),
		cluster_industry_mix: {
			pmet: mergeIndustrySeries(workbook2024, workbook2025, 'D10'),
			clerical_sales_service: mergeIndustrySeries(workbook2024, workbook2025, 'D11'),
			production_transport: mergeIndustrySeries(workbook2024, workbook2025, 'D12')
		},
		industry_occupation_mix: {
			'2024': parseIndustryOccupationMix(workbook2024),
			'2025': parseIndustryOccupationMix(workbook2025)
		},
		industry_profile: {
			'2024': parseIndustryProfiles(workbook2024),
			'2025': parseIndustryProfiles(workbook2025)
		}
	};

	const deltaArtifact = buildDeltaArtifact(signals);

	fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
	fs.mkdirSync(STATIC_DATA_DIR, { recursive: true });
	fs.writeFileSync(OUT_FILE, JSON.stringify(signals, null, 2) + '\n', 'utf-8');
	fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(signals, null, 2) + '\n', 'utf-8');
	fs.writeFileSync(STATIC_OUT_FILE, JSON.stringify(signals, null, 2) + '\n', 'utf-8');
	fs.writeFileSync(STATIC_DELTAS_OUT_FILE, JSON.stringify(deltaArtifact, null, 2) + '\n', 'utf-8');

	console.log(
		`Built Section D signals for ${Object.keys(signals.family_employment).length} occupation families and exported 2024→2025 deltas.`
	);
}

main();
