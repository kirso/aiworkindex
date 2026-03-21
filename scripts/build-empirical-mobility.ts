#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..');
const RAW_EXTERNAL_DIR = path.join(ROOT_DIR, 'data', 'raw', 'external');
const OUT_FILE = path.join(RAW_EXTERNAL_DIR, 'sg_empirical_mobility.json');

const GROUPS = [
	'Managers & Administrators (Including Working Proprietors)',
	'Professionals',
	'Associate Professionals & Technicians',
	'Clerical Support Workers',
	'Service & Sales Workers',
	'Craftsmen & Related Trades Workers',
	'Plant & Machine Operators & Assemblers',
	'Cleaners, Labourers & Related Workers'
] as const;

type CoveredGroup = (typeof GROUPS)[number];

const MATRIX_COUNTS: Record<CoveredGroup, Record<CoveredGroup, number>> = {
	'Managers & Administrators (Including Working Proprietors)': {
		'Managers & Administrators (Including Working Proprietors)': 19973,
		Professionals: 5554,
		'Associate Professionals & Technicians': 7677,
		'Clerical Support Workers': 1768,
		'Service & Sales Workers': 2532,
		'Craftsmen & Related Trades Workers': 1384,
		'Plant & Machine Operators & Assemblers': 999,
		'Cleaners, Labourers & Related Workers': 324
	},
	Professionals: {
		'Managers & Administrators (Including Working Proprietors)': 3773,
		Professionals: 25058,
		'Associate Professionals & Technicians': 6146,
		'Clerical Support Workers': 1047,
		'Service & Sales Workers': 240,
		'Craftsmen & Related Trades Workers': 121,
		'Plant & Machine Operators & Assemblers': 114,
		'Cleaners, Labourers & Related Workers': 26
	},
	'Associate Professionals & Technicians': {
		'Managers & Administrators (Including Working Proprietors)': 5373,
		Professionals: 6209,
		'Associate Professionals & Technicians': 36299,
		'Clerical Support Workers': 9021,
		'Service & Sales Workers': 4222,
		'Craftsmen & Related Trades Workers': 2515,
		'Plant & Machine Operators & Assemblers': 2026,
		'Cleaners, Labourers & Related Workers': 364
	},
	'Clerical Support Workers': {
		'Managers & Administrators (Including Working Proprietors)': 1014,
		Professionals: 627,
		'Associate Professionals & Technicians': 5366,
		'Clerical Support Workers': 31790,
		'Service & Sales Workers': 4510,
		'Craftsmen & Related Trades Workers': 873,
		'Plant & Machine Operators & Assemblers': 2642,
		'Cleaners, Labourers & Related Workers': 1022
	},
	'Service & Sales Workers': {
		'Managers & Administrators (Including Working Proprietors)': 1224,
		Professionals: 195,
		'Associate Professionals & Technicians': 3033,
		'Clerical Support Workers': 4113,
		'Service & Sales Workers': 18988,
		'Craftsmen & Related Trades Workers': 2143,
		'Plant & Machine Operators & Assemblers': 3841,
		'Cleaners, Labourers & Related Workers': 3367
	},
	'Craftsmen & Related Trades Workers': {
		'Managers & Administrators (Including Working Proprietors)': 690,
		Professionals: 69,
		'Associate Professionals & Technicians': 1757,
		'Clerical Support Workers': 593,
		'Service & Sales Workers': 1203,
		'Craftsmen & Related Trades Workers': 9798,
		'Plant & Machine Operators & Assemblers': 2669,
		'Cleaners, Labourers & Related Workers': 1386
	},
	'Plant & Machine Operators & Assemblers': {
		'Managers & Administrators (Including Working Proprietors)': 898,
		Professionals: 75,
		'Associate Professionals & Technicians': 1737,
		'Clerical Support Workers': 2174,
		'Service & Sales Workers': 3169,
		'Craftsmen & Related Trades Workers': 3621,
		'Plant & Machine Operators & Assemblers': 21813,
		'Cleaners, Labourers & Related Workers': 2925
	},
	'Cleaners, Labourers & Related Workers': {
		'Managers & Administrators (Including Working Proprietors)': 219,
		Professionals: 53,
		'Associate Professionals & Technicians': 426,
		'Clerical Support Workers': 1084,
		'Service & Sales Workers': 2968,
		'Craftsmen & Related Trades Workers': 1894,
		'Plant & Machine Operators & Assemblers': 4568,
		'Cleaners, Labourers & Related Workers': 9617
	}
};

function round(value: number, digits = 6): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function main() {
	const columnTotals = new Map<CoveredGroup, number>();
	for (const fromGroup of GROUPS) {
		const total = GROUPS.reduce((sum, toGroup) => sum + MATRIX_COUNTS[toGroup][fromGroup], 0);
		columnTotals.set(fromGroup, total);
	}

	const transitions = GROUPS.flatMap(from_major_group =>
		GROUPS.map(to_major_group => {
			const count = MATRIX_COUNTS[to_major_group][from_major_group];
			const coveredTotal = columnTotals.get(from_major_group) ?? 0;
			return {
				from_major_group,
				to_major_group,
				count,
				covered_group_total_from: coveredTotal,
				covered_share: coveredTotal > 0 ? round(count / coveredTotal) : null
			};
		})
	);

	const payload = {
		version: 'v1',
		generated_at: new Date().toISOString(),
		source: {
			title:
				'Resident Working Persons Aged 15 Years and Over Who Changed Job During Last 2 Years by Current Occupation, Previous Occupation and Age Group (Census of Population 2000)',
			dataset_url: 'https://data.gov.sg/datasets/d_2da44348341b7cb4e30766b361bf2611/view',
			dataset_id: 'd_2da44348341b7cb4e30766b361bf2611',
			agency: 'SINGSTAT (Singapore Department of Statistics)',
			survey_period: 'Census of Population 2000',
			data_last_updated: '2016-03-31',
			page_last_updated: '2026-02-21'
		},
		granularity: 'major_group_current_x_previous',
		observed_transition_rate_basis: 'covered_share',
		covered_groups: GROUPS,
		limitations: [
			'Observed mobility is available only at broad occupation-group level, not occupation-to-occupation level.',
			'Agricultural/Fishery workers and Workers Not Classifiable by Occupation are excluded because they are outside the published AI Work Index occupation universe.',
			'covered_share is normalized only across the 8 in-scope occupation groups, so it is suitable as a within-universe transition prior rather than a whole-economy probability.',
			'The source vintage is old (Census of Population 2000) and should be treated as a conservative empirical prior, not a live labour-market estimate.'
		],
		transitions
	};

	fs.mkdirSync(RAW_EXTERNAL_DIR, { recursive: true });
	fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');

	console.log(`Built empirical mobility source at ${OUT_FILE}`);
}

main();
