#!/usr/bin/env bun
/**
 * build-transition-infrastructure.ts — Publish official Singapore transition
 * infrastructure anchors used around the heuristic transition-support layer.
 *
 * Run:
 *   bun run scripts/build-transition-infrastructure.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const WSQ_FILE = path.join(RAW_DIR, 'wsq_trainees_by_statement_attainment.json');
const JTM_FILE = path.join(RAW_DIR, 'jtm_overview.html');

const OUT_FILE = path.join(DATA_DIR, 'transition-infrastructure.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'transition-infrastructure.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-transition-infrastructure-2025.json');

type WsqRow = Record<string, string | number | null>;

const PROGRAMMES = [
	{
		key: 'career_conversion_programmes',
		label: 'Career Conversion Programmes',
		agency: 'Workforce Singapore',
		url: 'https://www.wsg.gov.sg/home/individuals/attachment-placement-programmes/career-conversion-programmes-for-individuals',
		type: 'reskilling_support',
		scope: 'Mid-career workers and employers redesigning or converting job roles.'
	},
	{
		key: 'skillsfuture_career_transition_programme',
		label: 'SkillsFuture Career Transition Programme',
		agency: 'SkillsFuture Singapore',
		url: 'https://www.skillsfuture.gov.sg/careertransition',
		type: 'training_support',
		scope: 'Career-switching and upskilling support through subsidised modular training.'
	},
	{
		key: 'careersfinder',
		label: 'CareersFinder',
		agency: 'Workforce Singapore',
		url: 'https://www.wsg.gov.sg/home/media-room/media-releases-speeches/factsheet-on-careersfinder',
		type: 'career_navigation',
		scope:
			'Official career exploration tool using skills adjacencies and labour-market transitions.'
	},
	{
		key: 'skills_framework',
		label: 'Skills Framework',
		agency: 'SkillsFuture Singapore',
		url: 'https://www.skillsfuture.gov.sg/skills-framework',
		type: 'sector_framework',
		scope: 'Published sector role, task, and skills frameworks for workforce development.'
	},
	{
		key: 'jobs_transformation_maps',
		label: 'Jobs Transformation Maps',
		agency: 'Workforce Singapore',
		url: 'https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps',
		type: 'sector_transition_map',
		scope: 'Official sector job-redesign and skills-transition maps.'
	}
];

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function parseWsqSummary() {
	if (!fs.existsSync(WSQ_FILE)) {
		return null;
	}

	const payload = readJson<{ result?: { records?: WsqRow[] } }>(WSQ_FILE);
	const rows = payload.result?.records ?? [];
	if (rows.length === 0) return null;

	const totalRow = rows.find(
		row => String(row.DataSeries ?? '').trim() === 'Number Of WSQ Trainees'
	);
	const latestYear = '2024';
	const totalTrainees = totalRow ? Number(totalRow[latestYear] ?? 0) : 0;
	const attainmentLatestYear =
		['2024', '2023', '2022', '2021'].find(year =>
			rows.some(
				row =>
					String(row.DataSeries ?? '').startsWith('    ') &&
					String(row[year] ?? '').toLowerCase() !== 'na' &&
					String(row[year] ?? '').trim() !== ''
			)
		) ?? '2022';
	const attainmentRows = rows
		.filter(row => String(row.DataSeries ?? '').startsWith('    '))
		.map(row => ({
			label: String(row.DataSeries ?? '').trim(),
			count_2022: Number(row['2022'] ?? 0) || null,
			count_2024: Number(row['2024'] ?? 0) || null,
			count_latest_available:
				String(row[attainmentLatestYear] ?? '').toLowerCase() !== 'na'
					? Number(row[attainmentLatestYear] ?? 0) || null
					: null
		}));
	const attainmentTotalLatest = attainmentRows.reduce(
		(sum, row) => sum + (row.count_latest_available ?? 0),
		0
	);

	const historicalTotal = totalRow
		? Object.keys(totalRow)
				.filter(key => /^\d{4}$/.test(key))
				.sort()
				.map(year => ({
					year,
					count: Number(totalRow[year] ?? 0) || 0
				}))
		: [];

	return {
		source_file: path.basename(WSQ_FILE),
		latest_year: latestYear,
		total_trainees_latest: totalTrainees,
		statement_attainment_latest_year: attainmentLatestYear,
		statement_attainment_shares_latest:
			attainmentTotalLatest > 0
				? attainmentRows.map(row => ({
						label: row.label,
						share:
							row.count_latest_available !== null
								? Number((row.count_latest_available / attainmentTotalLatest).toFixed(4))
								: null
					}))
				: [],
		historical_total: historicalTotal,
		statement_attainment_breakdown: attainmentRows
	};
}

function stripHtml(value: string): string {
	return value
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseJtmOverview() {
	if (!fs.existsSync(JTM_FILE)) {
		return null;
	}

	const html = fs.readFileSync(JTM_FILE, 'utf-8');
	const text = stripHtml(html);
	const match = text.match(
		/Since 2019,\s+(\d+)\s+JTMs have been launched, collectively covering sectors such as (.+?)\./i
	);

	let launchedCount = 19;
	let sectors = [
		'Aviation',
		'Built Environment',
		'Environmental Services',
		'Financial Services',
		'Food Manufacturing',
		'Food Services',
		'Hotel',
		'Information and Communications',
		'Land Transport',
		'Logistics',
		'Professional Services',
		'Retail',
		'Wholesale Trade'
	];

	if (match) {
		launchedCount = Number(match[1]) || launchedCount;
		sectors = match[2]
			.split(/,\s+| and /)
			.map(part => part.trim())
			.filter(Boolean);
	}

	return {
		source_file: path.basename(JTM_FILE),
		launched_count: launchedCount,
		sector_coverage: sectors
	};
}

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Official Singapore transition infrastructure anchors used around the heuristic transition-support layer. This artifact captures published programmes, training-system activity, and Jobs Transformation Map coverage.',
	programmes: PROGRAMMES,
	wsq_training: parseWsqSummary(),
	jobs_transformation_maps: parseJtmOverview()
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const serialized = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, serialized, 'utf-8');

console.log(`Built transition infrastructure artifact at ${STATIC_OUT_FILE}`);
