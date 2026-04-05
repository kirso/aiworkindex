#!/usr/bin/env bun
/**
 * build-geography-context.ts — Build Singapore geography context from official
 * Census 2020 occupation tables.
 *
 * Inputs:
 *   - data/raw/planning_area_residence_by_occupation.json
 *   - data/raw/travel_time_to_work_by_occupation.json
 *
 * Outputs:
 *   - data/geography-context.json
 *   - src/lib/data/geography-context.json
 *   - static/data/sg-geography-context-2020.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const RESIDENCE_FILE = path.join(RAW_DIR, 'planning_area_residence_by_occupation.json');
const COMMUTE_FILE = path.join(RAW_DIR, 'travel_time_to_work_by_occupation.json');

const OUT_FILE = path.join(DATA_DIR, 'geography-context.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'geography-context.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-geography-context-2020.json');

type GroupKey =
	| 'MANAGERS'
	| 'PROFESSIONALS'
	| 'ASSOCIATE PROFESSIONALS AND TECHNICIANS'
	| 'CLERICAL SUPPORT WORKERS'
	| 'SERVICE AND SALES WORKERS'
	| 'CRAFTSMEN AND RELATED TRADES WORKERS'
	| 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS'
	| 'CLEANERS, LABOURERS AND RELATED WORKERS';

type RawRecord = Record<string, string | number | null>;

interface ResidenceSummary {
	group_key: GroupKey;
	label: string;
	total_residents: number;
	top_planning_areas: Array<{
		planning_area: string;
		count: number;
		share: number;
	}>;
	top_3_share: number;
	top_5_share: number;
}

interface CommuteSummary {
	group_key: GroupKey;
	label: string;
	total_commuters: number;
	estimated_average_minutes: number;
	long_commute_share: number;
	commute_share: {
		upto_15_mins: number;
		mins_16_30: number;
		mins_31_45: number;
		mins_46_60: number;
		more_than_60_mins: number;
	};
}

const GROUPS: Array<{
	key: GroupKey;
	label: string;
	residenceColumn: string;
	commuteRow: string;
}> = [
	{
		key: 'MANAGERS',
		label: 'Managers',
		residenceColumn: 'Legislators_SeniorOfficialsandManagers',
		commuteRow: 'Legislators, Senior Officials & Managers'
	},
	{
		key: 'PROFESSIONALS',
		label: 'Professionals',
		residenceColumn: 'Professionals',
		commuteRow: 'Professionals'
	},
	{
		key: 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
		label: 'Associate Professionals & Technicians',
		residenceColumn: 'AssociateProfessionalsandTechnicians',
		commuteRow: 'Associate Professionals & Technicians'
	},
	{
		key: 'CLERICAL SUPPORT WORKERS',
		label: 'Clerical Support Workers',
		residenceColumn: 'ClericalSupportWorkers',
		commuteRow: 'Clerical Support Workers'
	},
	{
		key: 'SERVICE AND SALES WORKERS',
		label: 'Service & Sales Workers',
		residenceColumn: 'ServiceandSalesWorkers',
		commuteRow: 'Service & Sales Workers'
	},
	{
		key: 'CRAFTSMEN AND RELATED TRADES WORKERS',
		label: 'Craftsmen & Related Trades Workers',
		residenceColumn: 'CraftsmenandRelatedTradesWorkers',
		commuteRow: 'Craftsmen & Related Trades Workers'
	},
	{
		key: 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
		label: 'Plant & Machine Operators & Assemblers',
		residenceColumn: 'PlantandMachineOperatorsandAssemblers',
		commuteRow: 'Plant & Machine Operators & Assemblers'
	},
	{
		key: 'CLEANERS, LABOURERS AND RELATED WORKERS',
		label: 'Cleaners, Labourers & Related Workers',
		residenceColumn: 'Cleaners_LabourersandRelatedWorkers',
		commuteRow: 'Cleaners, Labourers & Related Workers'
	}
];

function readJsonRecords(filePath: string): RawRecord[] {
	const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
		result?: { records?: RawRecord[] };
	};
	return payload.result?.records ?? [];
}

function asNumber(value: string | number | null | undefined): number {
	if (value === null || value === undefined) return 0;
	const parsed = Number(String(value).replace(/,/g, '').trim());
	return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function parseResidence(records: RawRecord[]) {
	const rows = records.filter(record => String(record.Number ?? '').trim() !== 'Total');
	const totalRow = records.find(record => String(record.Number ?? '').trim() === 'Total') ?? null;

	const summaries: ResidenceSummary[] = GROUPS.map(group => {
		const totalResidents = asNumber(totalRow?.[group.residenceColumn]);
		const topAreas = rows
			.map(record => {
				const count = asNumber(record[group.residenceColumn]);
				return {
					planning_area: String(record.Number ?? '').trim(),
					count,
					share: totalResidents > 0 ? round(count / totalResidents) : 0
				};
			})
			.filter(area => area.planning_area && area.count > 0)
			.sort((a, b) => b.count - a.count);

		return {
			group_key: group.key,
			label: group.label,
			total_residents: totalResidents,
			top_planning_areas: topAreas.slice(0, 5),
			top_3_share: round(topAreas.slice(0, 3).reduce((sum, area) => sum + area.share, 0)),
			top_5_share: round(topAreas.slice(0, 5).reduce((sum, area) => sum + area.share, 0))
		};
	});

	const overallTopAreas = rows
		.map(record => ({
			planning_area: String(record.Number ?? '').trim(),
			count: asNumber(record.Total),
			share: totalRow ? round(asNumber(record.Total) / asNumber(totalRow.Total)) : 0
		}))
		.filter(area => area.planning_area && area.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	return {
		overall_top_planning_areas: overallTopAreas,
		by_group: summaries
	};
}

function parseCommute(records: RawRecord[]) {
	const rows = records.filter(record => String(record.Number ?? '').trim() !== 'Total');
	const weights = {
		Upto15mins_Total: 7.5,
		'16_30mins_Total': 23,
		'31_45mins_Total': 38,
		'46_60mins_Total': 53,
		Morethan60mins_Total: 75
	} as const;

	const summaries: CommuteSummary[] = GROUPS.map(group => {
		const row =
			rows.find(record => String(record.Number ?? '').trim() === group.commuteRow) ?? null;
		const total = asNumber(row?.Total_Total);
		const shares = {
			upto_15_mins: total > 0 ? round(asNumber(row?.Upto15mins_Total) / total) : 0,
			mins_16_30: total > 0 ? round(asNumber(row?.['16_30mins_Total']) / total) : 0,
			mins_31_45: total > 0 ? round(asNumber(row?.['31_45mins_Total']) / total) : 0,
			mins_46_60: total > 0 ? round(asNumber(row?.['46_60mins_Total']) / total) : 0,
			more_than_60_mins: total > 0 ? round(asNumber(row?.Morethan60mins_Total) / total) : 0
		};

		const estimatedAverageMinutes =
			total > 0
				? round(
						(Object.entries(weights) as Array<[keyof typeof weights, number]>).reduce(
							(sum, [column, midpoint]) => sum + asNumber(row?.[column]) * midpoint,
							0
						) / total,
						1
					)
				: 0;

		return {
			group_key: group.key,
			label: group.label,
			total_commuters: total,
			estimated_average_minutes: estimatedAverageMinutes,
			long_commute_share: round(shares.mins_46_60 + shares.more_than_60_mins),
			commute_share: shares
		};
	});

	return {
		by_group: summaries
	};
}

const residenceRecords = readJsonRecords(RESIDENCE_FILE);
const commuteRecords = readJsonRecords(COMMUTE_FILE);

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Official Singapore geography context derived from Census of Population 2020 planning-area residence and travel-time occupation tables. This artifact is contextual and does not affect the structural score.',
	residence: parseResidence(residenceRecords),
	commute: parseCommute(commuteRecords),
	metadata: {
		data_as_of: 'Census of Population 2020',
		notes: [
			'Planning-area residence is available at broad occupation-group level, not detailed SSOC occupation level.',
			'Travel-time data excludes employed persons working at their residence and persons overseas for at least 6 months.',
			'Average commute minutes are estimated from bucket midpoints and should be read as a contextual summary, not an exact measured average.'
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

console.log(`Built geography context artifact at ${STATIC_OUT_FILE}`);
