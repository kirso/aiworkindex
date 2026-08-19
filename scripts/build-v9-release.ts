#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import type {
	ExposureBand,
	V9GenAiTaskExposure,
	V9Occupation,
	V9WageEvidence
} from '../src/lib/data/v9-contract';

const ROOT = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT, 'data');
const REGISTRY_FILE = path.join(DATA_DIR, 'ssoc-2024-registry.json');
const ILO_FILE = path.join(DATA_DIR, 'raw', 'external', 'ilo_genai_scores_isco08_2025.xlsx');
const WAGE_FILE = path.join(
	DATA_DIR,
	'raw',
	'official',
	'mom-wages-2025',
	'mom-occupational-wages-2025.xlsx'
);
const WAGE_METADATA_FILE = path.join(
	DATA_DIR,
	'raw',
	'official',
	'mom-wages-2025',
	'source-metadata.json'
);
const OUTPUT_FILE = path.join(DATA_DIR, 'occupations-v9.json');

interface RegistryEntry {
	code: string;
	title: string;
	entry_kind: 'occupation' | 'residual';
	hierarchy: V9Occupation['taxonomy']['hierarchy'];
	detailed_definition: string | null;
	tasks: string[];
	search_synonyms: string[];
	isco08: {
		quality: V9Occupation['evidence']['mapping_quality'];
		candidates: { code: string; title: string; part: string | null }[];
	};
}

type Cell = string | number | boolean | Date | null;

function round(value: number, decimals: number): number {
	const multiplier = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function band(percentile: number): ExposureBand {
	if (percentile < 20) return 'very_low';
	if (percentile < 40) return 'low';
	if (percentile < 60) return 'moderate';
	if (percentile < 80) return 'high';
	return 'very_high';
}

function loadIloScores(): Map<string, number> {
	const workbook = XLSX.readFile(ILO_FILE);
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) throw new Error('ILO workbook has no worksheet');
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
	const valuesByIsco = new Map<string, Set<number>>();
	for (const row of rows) {
		const isco = String(row.ISCO_08 ?? '').trim();
		const value = row.mean_score_2025;
		if (!/^\d{4}$/.test(isco) || typeof value !== 'number' || !Number.isFinite(value)) continue;
		const values = valuesByIsco.get(isco) ?? new Set<number>();
		values.add(value);
		valuesByIsco.set(isco, values);
	}
	const result = new Map<string, number>();
	for (const [isco, values] of valuesByIsco) {
		if (values.size !== 1) throw new Error(`${isco}: inconsistent mean_score_2025 values`);
		result.set(isco, [...values][0]);
	}
	if (result.size !== 427) throw new Error(`expected 427 ILO ISCO groups, found ${result.size}`);
	return result;
}

function wageNumber(row: Cell[], column: number, code: string): number {
	const value = row[column];
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`${code}: invalid wage value in column ${column}`);
	}
	return value;
}

function loadWages(): Map<string, V9WageEvidence> {
	const workbook = XLSX.readFile(WAGE_FILE);
	const sheet = workbook.Sheets.T4;
	if (!sheet) throw new Error('MOM wages workbook has no T4 worksheet');
	const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null });
	const result = new Map<string, V9WageEvidence>();
	for (const row of rows) {
		const code = String(row[1] ?? '').trim();
		if (!/^\d{5}$/.test(code)) continue;
		if (result.has(code)) throw new Error(`${code}: duplicate MOM wage row`);
		result.set(code, {
			source: 'mom_occupational_wages_2025',
			population: 'full_time_resident_employees_in_establishments_25_plus',
			reference_period: '2025-06',
			basic_monthly_sgd: {
				p25: wageNumber(row, 3, code),
				median: wageNumber(row, 4, code),
				p75: wageNumber(row, 5, code)
			},
			gross_monthly_sgd: {
				p25: wageNumber(row, 6, code),
				median: wageNumber(row, 7, code),
				p75: wageNumber(row, 8, code)
			}
		});
	}
	if (result.size !== 523) throw new Error(`expected 523 MOM wage rows, found ${result.size}`);
	if (result.get('12112')?.gross_monthly_sgd.median !== 8050) {
		throw new Error('Administration manager wage sentinel changed');
	}
	return result;
}

function midrankPercentiles(valuesByCode: Map<string, number>): Map<string, number> {
	const rows = [...valuesByCode].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
	const result = new Map<string, number>();
	let start = 0;
	while (start < rows.length) {
		let end = start;
		while (end + 1 < rows.length && rows[end + 1][1] === rows[start][1]) end += 1;
		const averageZeroBasedRank = (start + end) / 2;
		const percentile = rows.length === 1 ? 50 : (averageZeroBasedRank / (rows.length - 1)) * 100;
		for (let index = start; index <= end; index += 1)
			result.set(rows[index][0], round(percentile, 1));
		start = end + 1;
	}
	return result;
}

function main() {
	for (const file of [REGISTRY_FILE, ILO_FILE, WAGE_FILE, WAGE_METADATA_FILE]) {
		if (!fs.existsSync(file)) throw new Error(`${file} missing`);
	}
	const registryDocument = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) as {
		counts: { total: number; occupations: number; residual: number };
		entries: RegistryEntry[];
	};
	if (
		registryDocument.counts.total !== 1006 ||
		registryDocument.counts.occupations !== 1001 ||
		registryDocument.counts.residual !== 5
	) {
		throw new Error('SSOC 2024 registry count contract changed');
	}
	const registry = registryDocument.entries.filter(entry => entry.entry_kind === 'occupation');
	const iloScores = loadIloScores();
	const wages = loadWages();

	const rawByCode = new Map<string, number>();
	const iscoValuesByCode = new Map<string, { code: string; value: number }[]>();
	for (const entry of registry) {
		const candidates = entry.isco08.candidates
			.map(candidate => ({ code: candidate.code, value: iloScores.get(candidate.code) }))
			.filter(
				(candidate): candidate is { code: string; value: number } => candidate.value !== undefined
			);
		iscoValuesByCode.set(entry.code, candidates);
		if (candidates.length > 0)
			rawByCode.set(entry.code, median(candidates.map(candidate => candidate.value)));
	}
	const percentiles = midrankPercentiles(rawByCode);

	const occupations: V9Occupation[] = registry.map(entry => {
		const candidates = iscoValuesByCode.get(entry.code) ?? [];
		const rawMedian = rawByCode.get(entry.code);
		const percentile = percentiles.get(entry.code);
		let exposure: V9GenAiTaskExposure | null = null;
		if (rawMedian !== undefined && percentile !== undefined) {
			const values = candidates.map(candidate => candidate.value);
			exposure = {
				source: 'ilo_genai_2025',
				raw_median: round(rawMedian, 4),
				raw_min: round(Math.min(...values), 4),
				raw_max: round(Math.max(...values), 4),
				percentile,
				band: band(percentile),
				isco08_codes: candidates.map(candidate => candidate.code),
				aggregation: 'median_across_official_isco_matches'
			};
		}
		const limitations = [
			'Exposure measures task overlap with current GenAI capabilities; it is not a job-loss probability or forecast.'
		];
		if (entry.isco08.candidates.length > 1) {
			limitations.push(
				'SSOC maps to multiple ISCO groups without official employment weights; the median and range are shown.'
			);
		}
		if (!exposure)
			limitations.push('No usable ILO 2025 score exists for the official ISCO mapping.');
		if (!wages.has(entry.code)) {
			limitations.push('MOM does not publish a 2025 detailed wage row for this occupation.');
		}
		return {
			schema_version: '9.0',
			taxonomy: {
				system: 'SSOC',
				edition: '2024',
				code: entry.code,
				title: entry.title,
				hierarchy: entry.hierarchy,
				detailed_definition: entry.detailed_definition,
				tasks: entry.tasks,
				search_synonyms: entry.search_synonyms
			},
			score_status: exposure ? 'scored' : 'insufficient_evidence',
			genai_task_exposure: exposure,
			comparison_evidence: {
				eloundou: null,
				aioe: null,
				observed_ai_use: null,
				potential_complementarity: null
			},
			singapore_market: {
				wages: wages.get(entry.code) ?? null,
				demand: null,
				labour_context: null,
				entry_level: null
			},
			evidence: {
				mapping_quality: entry.isco08.quality,
				support: exposure ? 'official_crosswalk' : 'unavailable',
				sources: [
					'Singapore Department of Statistics SSOC 2024',
					...(exposure ? ['ILO Generative AI and Jobs refined index (2025)'] : []),
					...(wages.has(entry.code)
						? ['Singapore Ministry of Manpower Occupational Wages 2025']
						: [])
				],
				limitations,
				data_as_of: '2026-08-19'
			}
		} satisfies V9Occupation;
	});

	const scored = occupations.filter(occupation => occupation.score_status === 'scored');
	const insufficient = occupations.filter(
		occupation => occupation.score_status === 'insufficient_evidence'
	);
	if (scored.length !== 987 || insufficient.length !== 14) {
		throw new Error(
			`expected 987 scored / 14 insufficient, found ${scored.length} / ${insufficient.length}`
		);
	}
	const wageCoverage = occupations.filter(occupation => occupation.singapore_market.wages).length;
	if (wageCoverage !== 523)
		throw new Error(`expected 523 matched wage rows, found ${wageCoverage}`);

	const wageMetadata = JSON.parse(fs.readFileSync(WAGE_METADATA_FILE, 'utf8'));
	fs.writeFileSync(
		OUTPUT_FILE,
		`${JSON.stringify(
			{
				schema_version: '9.0',
				release: 'SSOC 2024 evidence-first V9',
				generated_at: '2026-08-19',
				method: {
					headline_construct: 'Relative GenAI task exposure',
					headline_owner: 'ILO 2025 mean_score_2025',
					multi_mapping:
						'Median of available official ISCO-08 matches; minimum and maximum retained',
					ranking: 'Midrank percentile among scored SSOC 2024 occupations',
					bands: 'Five equal-width percentile intervals',
					fallbacks: 'None'
				},
				sources: {
					taxonomy:
						registryDocument.entries.length === 1006 ? 'data/ssoc-2024-registry.json' : null,
					exposure: {
						file: 'data/raw/external/ilo_genai_scores_isco08_2025.xlsx',
						url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure'
					},
					wages: wageMetadata
				},
				counts: {
					occupations: occupations.length,
					scored: scored.length,
					insufficient_evidence: insufficient.length,
					direct_wages: wageCoverage
				},
				occupations
			},
			null,
			2
		)}\n`
	);
	console.log(
		`V9: ${occupations.length} occupations, ${scored.length} scored, ${insufficient.length} insufficient, ${wageCoverage} direct wages`
	);
}

main();
