#!/usr/bin/env bun
/**
 * build-us-index.ts — Build the United States country layer on top of the canonical ISCO baseline.
 *
 * Uses the BLS occupational projections workbook for current employment, projected employment,
 * annual openings, and median wage. Structural pressure is inherited from the canonical ISCO
 * baseline built from the live Singapore release.
 *
 * Run:
 *   bun run scripts/build-global-index.ts
 *   bun run scripts/build-us-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { computeConfidence } from '../src/lib/data/confidence-core';
import { confidenceLevelFromScore, percentileRanks, type CountryOccupationRecord } from '../src/lib/data/country-index';
import { clamp01 } from '../src/lib/data/methodology-core';
import { getRiskBand } from '../src/lib/data/scoring-constants';
import { socToIsco, socToIscoCodes } from './crosswalk';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const BLS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_projections_2024_2034.xlsx');

type GlobalOccupationRecord = {
	canonicalCode: string;
	canonicalTitle: string;
	structuralPressure: number;
	structuralBand: CountryOccupationRecord['structuralBand'];
	exposure: number;
	bottleneck: number;
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
		crosswalk_quality: number;
		market_data_granularity: number;
		source_freshness: number;
		source_coverage: number;
		signal_agreement: number;
		sensitivity: number;
		exposure_source_count: number;
	};
	sourceOccupationCodes: string[];
};

type BlsRow = {
	localCode: string;
	localTitle: string;
	employment2024: number | null;
	employment2034: number | null;
	changePct: number | null;
	openings: number | null;
	medianWage: number | null;
};

function ensureDir(filepath: string): void {
	fs.mkdirSync(path.dirname(filepath), { recursive: true });
}

function normalizeTitle(title: string): string[] {
	return String(title || '')
		.toLowerCase()
		.replace(/\((?:excluding|including|except|e\.g\.).*?\)/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(
			word =>
				word.length > 2 &&
				![
					'and',
					'or',
					'the',
					'of',
					'for',
					'to',
					'a',
					'an',
					'other',
					'general',
					'senior',
					'junior',
					'chief',
					'assistant',
					'associate',
					'deputy',
					'acting',
					'officer',
					'specialist',
					'professional',
					'technician',
					'worker',
					'operator',
					'supervisor',
					'adviser',
					'advisor',
					'coordinator',
					'practitioner',
					'assistants'
				].includes(word)
		);
}

function titleSimilarity(leftTitle: string, rightTitle: string): number {
	const left = new Set(normalizeTitle(leftTitle));
	const right = new Set(normalizeTitle(rightTitle));
	if (left.size === 0 || right.size === 0) return 0;

	let matches = 0;
	for (const word of left) {
		for (const candidate of right) {
			if (word === candidate) {
				matches += 1;
				break;
			}
			const shorter = word.length <= candidate.length ? word : candidate;
			const longer = word.length <= candidate.length ? candidate : word;
			if (shorter.length >= 5 && longer.startsWith(shorter)) {
				matches += 1;
				break;
			}
		}
	}

	if (matches === 0) return 0;
	return matches + matches / Math.max(right.size, 1) * 0.2;
}

function pickBestGlobalRecord(
	title: string,
	candidates: GlobalOccupationRecord[]
): { record: GlobalOccupationRecord; score: number } {
	let best: GlobalOccupationRecord | null = null;
	let bestScore = 0;

	for (const record of candidates) {
		const score = titleSimilarity(title, record.canonicalTitle);
		if (score > bestScore) {
			bestScore = score;
			best = record;
		}
	}

	if (!best) {
		best = candidates[0] ?? null;
		bestScore = 0;
	}

	if (!best) {
		throw new Error(`No global record candidates available for title: ${title}`);
	}

	return { record: best, score: bestScore };
}

function buildSocToIscoPrefixMap(mappedRows: Array<{ localCode: string; canonicalCode: string }>): Map<string, string> {
	const counts = new Map<string, Map<string, number>>();
	for (const row of mappedRows) {
		const socPrefix = row.localCode.slice(0, 2);
		const iscoPrefix = row.canonicalCode.slice(0, 2);
		const bucket = counts.get(socPrefix) ?? new Map<string, number>();
		bucket.set(iscoPrefix, (bucket.get(iscoPrefix) ?? 0) + 1);
		counts.set(socPrefix, bucket);
	}

	const result = new Map<string, string>();
	for (const [socPrefix, bucket] of counts.entries()) {
		const sorted = [...bucket.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
		if (sorted[0]) result.set(socPrefix, sorted[0][0]);
	}
	return result;
}

function parseBlsWorkbook(): BlsRow[] {
	const workbook = XLSX.readFile(BLS_FILE);
	const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Table 1.2'], { header: 1 }) as unknown[][];
	const parsed: BlsRow[] = [];

	for (const row of rows) {
		if (row?.[2] !== 'Line item') continue;
		parsed.push({
			localCode: String(row[1] ?? '').trim(),
			localTitle: String(row[0] ?? '').trim(),
			employment2024: Number.isFinite(Number(row[3])) ? Number(row[3]) : null,
			employment2034: Number.isFinite(Number(row[4])) ? Number(row[4]) : null,
			changePct: Number.isFinite(Number(row[8])) ? Number(row[8]) : null,
			openings: Number.isFinite(Number(row[10])) ? Number(row[10]) : null,
			medianWage: Number.isFinite(Number(row[11])) ? Number(row[11]) : null
		});
	}

	return parsed;
}

function buildCountryIndex(
	globalIndex: GlobalOccupationRecord[],
	blsRows: BlsRow[]
): CountryOccupationRecord[] {
	const globalByCode = new Map(globalIndex.map(entry => [entry.canonicalCode, entry] as const));
	const allCandidatesByPrefix = new Map<string, GlobalOccupationRecord[]>();
	for (const record of globalIndex) {
		const prefix = record.canonicalCode.slice(0, 2);
		const bucket = allCandidatesByPrefix.get(prefix) ?? [];
		bucket.push(record);
		allCandidatesByPrefix.set(prefix, bucket);
	}

	const rowsWithLookup = blsRows.map(row => {
		const directCandidates = socToIscoCodes(row.localCode)
			.map(code => globalByCode.get(code))
			.filter((value): value is GlobalOccupationRecord => value !== undefined);
		const exactSocMatch = socToIsco(row.localCode);
		let mappingMethod: CountryOccupationRecord['mappingMethod'] = 'major_group_fallback';
		let resolved: { record: GlobalOccupationRecord; score: number };

		if (directCandidates.length > 0) {
			resolved = {
				record: directCandidates[0]!,
				score: titleSimilarity(row.localTitle, directCandidates[0]!.canonicalTitle)
			};
			mappingMethod = 'crosswalk_exact';
		} else {
			const socPrefix = row.localCode.slice(0, 2);
			const prefixCandidates = allCandidatesByPrefix.get(socPrefix) ?? globalIndex;
			resolved = pickBestGlobalRecord(row.localTitle, prefixCandidates);
			mappingMethod = resolved.score >= 1.05 || exactSocMatch ? 'title_match' : 'major_group_fallback';
		}

		return {
			...row,
			canonicalCode: resolved.record.canonicalCode,
			canonicalTitle: resolved.record.canonicalTitle,
			structuralPressure: resolved.record.structuralPressure,
			structuralBand: resolved.record.structuralBand,
			globalConfidence: resolved.record.confidence,
			mappingMethod,
			matchScore: resolved.score
		};
	});

	const growthPercentiles = percentileRanks(
		rowsWithLookup.map(row => row.changePct ?? Number.NEGATIVE_INFINITY)
	);
	const openingsPercentiles = percentileRanks(
		rowsWithLookup.map(row => row.openings ?? Number.NEGATIVE_INFINITY)
	);
	const wagePercentiles = percentileRanks(
		rowsWithLookup.map(row => row.medianWage ?? Number.NEGATIVE_INFINITY)
	);

	return rowsWithLookup
		.map((row, index) => {
			const growth = growthPercentiles[index] ?? 0.5;
			const openings = openingsPercentiles[index] ?? 0.5;
			const wagePercentile = wagePercentiles[index] ?? 0.5;
			const demandResilience = clamp01(0.6 * growth + 0.4 * openings);
			const headlineRisk = clamp01(row.structuralPressure * (1 - demandResilience));
			const localConfidence = clamp01(
				row.mappingMethod === 'crosswalk_exact' ? 1 : row.mappingMethod === 'title_match' ? 0.82 : 0.62
			);
			const globalConfidence = row.globalConfidence;
			const combinedConfidenceScore = clamp01(
				globalConfidence.score * 0.7 +
					localConfidence * 0.2 +
					(row.changePct != null && row.openings != null ? 0.1 : 0)
			);
			const confidence = computeConfidence({
				matchQuality:
					row.mappingMethod === 'crosswalk_exact'
						? 'direct'
						: row.mappingMethod === 'title_match'
							? 'submajor_fallback'
							: 'major_fallback',
				aioeDispersion: 0,
				thetaDispersion: 0,
				hasExactDemand: true,
				hasPrefixDemand: false,
				hasIndustryFootprint: false,
				exposureSourceKeys: ['aioe', 'anthropic', 'eloundou', 'ilo'],
				exposureSourceWeights: { aioe: 0.25, anthropic: 0.25, eloundou: 0.25, ilo: 0.25 },
				exposureAgreement:
					globalConfidence.score >= 0.75
						? 'consensus_high'
						: globalConfidence.score >= 0.6
							? 'aligned_mid'
							: 'consensus_low',
				stabilityLabel:
					globalConfidence.score >= 0.75 ? 'stable' : globalConfidence.score >= 0.6 ? 'watch' : 'sensitive',
				signalConflict: false
			}) satisfies CountryOccupationRecord['confidence'];

			return {
				countryCode: 'us',
				localCode: row.localCode,
				localTitle: row.localTitle,
				canonicalCode: row.canonicalCode,
				canonicalTitle: row.canonicalTitle,
				mappingMethod: row.mappingMethod,
				structuralPressure: row.structuralPressure,
				structuralBand: row.structuralBand,
				demandResilience,
				headlineRisk,
				headlineBand: getRiskBand(headlineRisk),
				wage: {
					median: row.medianWage,
					p25: null,
					p75: null,
					currency: 'USD'
				},
				employment: {
					current: row.employment2024,
					projected: row.employment2034,
					openings: row.openings,
					projectedChangePct: row.changePct
				},
				confidence: {
					...confidence,
					score: combinedConfidenceScore,
					level: confidenceLevelFromScore(combinedConfidenceScore),
					exposure_source_count: 4
				} satisfies CountryOccupationRecord['confidence'],
				dataVintage: 'BLS Occupational Projections 2024-2034',
				sourceOccupations: [row.localCode]
			} satisfies CountryOccupationRecord;
		})
		.sort((a, b) => a.localCode.localeCompare(b.localCode));
}

async function main() {
	const globalPath = path.join(DATA_DIR, 'global', 'occupations.json');
	const globalIndex: GlobalOccupationRecord[] = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
	const blsRows = parseBlsWorkbook();
	const countryIndex = buildCountryIndex(globalIndex, blsRows);

	const outputPath = path.join(DATA_DIR, 'countries', 'us', 'occupations.json');
	const srcOutputPath = path.join(SRC_DATA_DIR, 'countries', 'us', 'occupations.json');
	const staticOutputPath = path.join(STATIC_DATA_DIR, 'countries', 'us', 'occupations.json');

	for (const filepath of [outputPath, srcOutputPath, staticOutputPath]) {
		ensureDir(filepath);
		fs.writeFileSync(filepath, JSON.stringify(countryIndex, null, 2));
	}

	const matched = countryIndex.filter(entry => entry.mappingMethod === 'crosswalk_exact').length;
	const titled = countryIndex.filter(entry => entry.mappingMethod === 'title_match').length;
	const fallback = countryIndex.filter(entry => entry.mappingMethod === 'major_group_fallback').length;

	console.log(
		`US country index written: ${countryIndex.length} occupations (${matched} crosswalk, ${titled} title match, ${fallback} fallback)`
	);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
