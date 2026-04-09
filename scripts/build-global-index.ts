#!/usr/bin/env bun
/**
 * build-global-index.ts — Canonical ISCO-08 baseline aggregated from the live reference market.
 *
 * This produces a country-agnostic structural baseline from the current Singapore
 * occupation dataset using equal-weight structural aggregation so country layers can
 * reuse the same comparable spine without inheriting local employment totals.
 *
 * Run: bun run scripts/build-global-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getRiskBand } from '../src/lib/data/scoring-constants';
import {
	confidenceLevelFromScore,
	type GlobalOccupationRecord,
	weightedMean
} from '../src/lib/data/country-index';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

type SourceOccupation = {
	ssoc: string;
	title: string;
	isco_codes_matched?: string[];
	employment_thousands?: number | null;
	estimated_sg_employment_thousands?: number | null;
	exposure: number;
	bottleneck: number;
	displacement_pressure: number;
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
		crosswalk_quality: number;
		market_data_granularity: number;
		source_freshness: number;
		source_coverage: number;
		signal_agreement: number;
		sensitivity: number;
	};
};

type Aggregate = {
	isco: string;
	titleWeights: Map<string, number>;
	sourceOccupationCodes: string[];
	sourceOccupationCount: number;
	exposure: Array<{ value: number; weight: number }>;
	bottleneck: Array<{ value: number; weight: number }>;
	structuralPressure: Array<{ value: number; weight: number }>;
	confidence: Array<{
		score: number;
		crosswalk_quality: number;
		market_data_granularity: number;
		source_freshness: number;
		source_coverage: number;
		signal_agreement: number;
		sensitivity: number;
		weight: number;
	}>;
};

function ensureDir(filepath: string): void {
	fs.mkdirSync(path.dirname(filepath), { recursive: true });
}

function representativeTitle(titleWeights: Map<string, number>): string {
	return (
		[...titleWeights.entries()].sort(
			(a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0])
		)[0]?.[0] ?? 'Unknown occupation'
	);
}

function aggregateGlobalIndex(occupations: SourceOccupation[]): GlobalOccupationRecord[] {
	const groups = new Map<string, Aggregate>();

	for (const occupation of occupations) {
		const isco = occupation.isco_codes_matched?.[0] ?? occupation.ssoc.slice(0, 4);
		const aggregate = groups.get(isco) ?? {
			isco,
			titleWeights: new Map<string, number>(),
			sourceOccupationCodes: [],
			sourceOccupationCount: 0,
			exposure: [],
			bottleneck: [],
			structuralPressure: [],
			confidence: []
		};

		aggregate.titleWeights.set(
			occupation.title,
			(aggregate.titleWeights.get(occupation.title) ?? 0) + 1
		);
		aggregate.sourceOccupationCodes.push(occupation.ssoc);
		aggregate.sourceOccupationCount += 1;
		aggregate.exposure.push({ value: occupation.exposure, weight: 1 });
		aggregate.bottleneck.push({ value: occupation.bottleneck, weight: 1 });
		aggregate.structuralPressure.push({
			value: occupation.displacement_pressure,
			weight: 1
		});
		aggregate.confidence.push({
			score: occupation.confidence.score,
			crosswalk_quality: occupation.confidence.crosswalk_quality,
			market_data_granularity: occupation.confidence.market_data_granularity,
			source_freshness: occupation.confidence.source_freshness,
			source_coverage: occupation.confidence.source_coverage,
			signal_agreement: occupation.confidence.signal_agreement,
			sensitivity: occupation.confidence.sensitivity,
			weight: 1
		});

		groups.set(isco, aggregate);
	}

	return [...groups.values()]
		.sort((a, b) => a.isco.localeCompare(b.isco))
		.map(group => {
			const confidenceScore = weightedMean(
				group.confidence.map(entry => ({ value: entry.score, weight: entry.weight }))
			);
			const confidence = {
				score: confidenceScore,
				level: confidenceLevelFromScore(confidenceScore),
				crosswalk_quality: weightedMean(
					group.confidence.map(entry => ({ value: entry.crosswalk_quality, weight: entry.weight }))
				),
				market_data_granularity: weightedMean(
					group.confidence.map(entry => ({
						value: entry.market_data_granularity,
						weight: entry.weight
					}))
				),
				source_freshness: weightedMean(
					group.confidence.map(entry => ({ value: entry.source_freshness, weight: entry.weight }))
				),
				source_coverage: weightedMean(
					group.confidence.map(entry => ({ value: entry.source_coverage, weight: entry.weight }))
				),
				signal_agreement: weightedMean(
					group.confidence.map(entry => ({ value: entry.signal_agreement, weight: entry.weight }))
				),
				sensitivity: weightedMean(
					group.confidence.map(entry => ({ value: entry.sensitivity, weight: entry.weight }))
				),
				exposure_source_count: 4
			} satisfies GlobalOccupationRecord['confidence'];
			const exposure = weightedMean(group.exposure);
			const bottleneck = weightedMean(group.bottleneck);
			const structuralPressure = weightedMean(group.structuralPressure);
			return {
				canonicalCode: group.isco,
				canonicalTitle: representativeTitle(group.titleWeights),
				structuralPressure,
				structuralBand: getRiskBand(structuralPressure),
				exposure,
				bottleneck,
				structuralFootprint: group.sourceOccupationCount,
				sourceOccupationCount: group.sourceOccupationCount,
				sourceOccupationCodes: [...new Set(group.sourceOccupationCodes)].sort(),
				confidence,
				confidenceLevel: confidence.level,
				dataVintage: 'Global structural baseline v7'
			};
		});
}

async function main() {
	const occupationsPath = path.join(DATA_DIR, 'occupations.json');
	const outputPath = path.join(DATA_DIR, 'global', 'occupations.json');
	const srcOutputPath = path.join(SRC_DATA_DIR, 'global-occupations.json');
	const staticOutputPath = path.join(STATIC_DATA_DIR, 'global', 'occupations.json');

	const occupations: SourceOccupation[] = JSON.parse(fs.readFileSync(occupationsPath, 'utf-8'));
	const globalIndex = aggregateGlobalIndex(occupations);

	for (const filepath of [outputPath, srcOutputPath, staticOutputPath]) {
		ensureDir(filepath);
		fs.writeFileSync(filepath, JSON.stringify(globalIndex, null, 2));
	}

	const mappedFootprint = globalIndex.reduce((sum, row) => sum + row.structuralFootprint, 0);
	console.log(
		`Global ISCO baseline written: ${globalIndex.length} groups, ${mappedFootprint} mapped occupations`
	);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
