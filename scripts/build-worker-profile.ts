#!/usr/bin/env bun
/**
 * build-worker-profile.ts — Build a Singapore worker-profile context layer
 * from official Labour Force Survey section D tables and wages-by-sex tables.
 *
 * Inputs:
 *   - data/lfr-section-d-signals.json
 *   - data/raw/wages_by_sex.xlsx
 *
 * Outputs:
 *   - data/worker-profile.json
 *   - src/lib/data/worker-profile.json
 *
 * Notes:
 *   - Broad-group worker composition comes from official 2025 labour-force tables.
 *   - Detailed gender anchors use published 2-digit occupation families from Table D8.
 *   - Occupation-level male/female wage medians are only available for common occupations.
 *   - This artifact is contextual and does not affect the structural score.
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';
const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SECTION_D_SIGNALS_FILE = path.join(DATA_DIR, 'lfr-section-d-signals.json');
const OUT_FILE = path.join(DATA_DIR, 'worker-profile.json');
const SRC_OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'worker-profile.json');
const STATIC_OUT_FILE = path.join(
	import.meta.dir,
	'..',
	'static',
	'data',
	'sg-worker-profile-2025.json'
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
	total_employment: number;
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
	marital_status_share: {
		single: number;
		married: number;
		widowed_divorced: number;
	};
}

interface DetailedGenderAnchor {
	prefix2: string;
	label: string;
	total_employment: number;
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

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function normalizeText(value: unknown): string {
	return String(value ?? '')
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

function readSectionDSignals(): {
	group_profile: { '2025': Record<MajorGroupKey, GroupWorkerProfile> };
	family_employment: Record<
		string,
		{
			label: string;
			total_2025: number;
			male_share: number;
			female_share: number;
		}
	>;
} {
	return JSON.parse(fs.readFileSync(SECTION_D_SIGNALS_FILE, 'utf-8')) as {
		group_profile: { '2025': Record<MajorGroupKey, GroupWorkerProfile> };
		family_employment: Record<
			string,
			{
				label: string;
				total_2025: number;
				male_share: number;
				female_share: number;
			}
		>;
	};
}

function parseWagesBySex(): Record<string, OccupationWageBySex> {
	const workbook = XLSX.readFile(path.join(RAW_DIR, 'wages_by_sex.xlsx'));
	const maleRows = XLSX.utils.sheet_to_json(workbook.Sheets['T1.1'], {
		header: 1,
		defval: ''
	}) as unknown[][];
	const femaleRows = XLSX.utils.sheet_to_json(workbook.Sheets['T1.2'], {
		header: 1,
		defval: ''
	}) as unknown[][];
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
		const maritalTotal = round(
			profile.marital_status_share.single +
				profile.marital_status_share.married +
				profile.marital_status_share.widowed_divorced
		);

		for (const [name, total] of [
			['sex', sexTotal],
			['employment status', employmentStatusTotal],
			['work arrangement', workArrangementTotal],
			['age', ageTotal],
			['qualification', qualificationTotal],
			['marital status', maritalTotal]
		]) {
			if (Math.abs(total - 1) > 0.02) {
				throw new Error(`${majorGroup} ${name} shares sum to ${total}, expected ~1`);
			}
		}
	}
}

const sectionDSignals = readSectionDSignals();
const output: WorkerProfileOutput = {
	groups: sectionDSignals.group_profile['2025'],
	detailed_gender: Object.fromEntries(
		Object.entries(sectionDSignals.family_employment).map(([prefix2, family]) => [
			prefix2,
			{
				prefix2,
				label: family.label,
				total_employment: family.total_2025,
				male_share: family.male_share,
				female_share: family.female_share
			}
		])
	),
	occupation_wage_by_sex: parseWagesBySex(),
	metadata: {
		data_as_of: '2025',
		notes: [
			'Broad-group worker composition uses Labour Force in Singapore 2025 Section D tables.',
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
