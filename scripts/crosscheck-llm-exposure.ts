#!/usr/bin/env bun
/**
 * crosscheck-llm-exposure.ts — Compare multiple AI exposure measures.
 *
 * Loads Eloundou et al. (2023) GPTs-are-GPTs exposure scores alongside
 * Felten AIOE and Anthropic observed usage, then matches to SSOC via
 * the SOC crosswalk. Outputs exposure_agreement for each occupation.
 *
 * Data source: Eloundou et al. (2023) "GPTs are GPTs: An Early Look at the
 * Labor Market Impact Potential of Large Language Models"
 * Download: https://arxiv.org/abs/2303.10130 (supplementary data)
 *
 * Expected input format (CSV): data/raw/external/gpts_are_gpts_exposure.csv
 *   soc_code,title,alpha_overall,beta_overall,zeta_overall
 *   11-1011,"Chief Executives",0.42,0.28,0.35
 *
 * alpha = human assessment, beta = GPT-4 assessment, zeta = combined
 *
 * Run: bun run scripts/crosscheck-llm-exposure.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ssocToIsco, iscoToSoc } from './crosswalk';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const EXT_DIR = path.join(DATA_DIR, 'raw', 'external');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'occupations.json');

interface _GptExposureRow {
	soc_code: string;
	title: string;
	alpha_overall: number; // Human assessment
	beta_overall: number; // GPT-4 assessment
	zeta_overall: number; // Combined
}

interface Occupation {
	ssoc: string;
	title: string;
	exposure: number;
	evidence: {
		anthropic_calibrated: boolean;
		anthropic_gap: number | null;
		anthropic_observed_pctile: number | null;
		sol_match: string | false;
		jobs_in_demand_match: string | false;
		gpt_exposure?: number | null;
		exposure_agreement?: string | null;
	};
	isco_codes_matched: string[];
	[key: string]: unknown;
}

function loadGptExposure(): Map<string, number> {
	const filePath = path.join(EXT_DIR, 'gpts_are_gpts_exposure.csv');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: gpts_are_gpts_exposure.csv not found');
		console.log('  Download from: https://arxiv.org/abs/2303.10130 (supplementary)');
		console.log('  Expected columns: soc_code,title,alpha_overall,beta_overall,zeta_overall');
		return new Map();
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	const exposureMap = new Map<string, number>();

	for (let i = 1; i < lines.length; i++) {
		// Handle quoted CSV fields
		const match = lines[i].match(/^([^,]+),(?:"[^"]*"|[^,]*),([^,]*),([^,]*),([^,]*)$/);
		if (!match) continue;

		const socCode = match[1].trim();
		const zeta = parseFloat(match[4].trim());
		if (socCode && !isNaN(zeta)) {
			exposureMap.set(socCode, zeta);
		}
	}

	console.log(`  Loaded ${exposureMap.size} GPT exposure scores`);
	return exposureMap;
}

/**
 * Percentile-normalize an array of values to [0, 1].
 */
function _percentileNormalize(values: number[]): Map<number, number> {
	const sorted = [...values].sort((a, b) => a - b);
	const result = new Map<number, number>();
	for (const v of values) {
		const rank = sorted.indexOf(v);
		result.set(v, rank / (sorted.length - 1));
	}
	return result;
}

/**
 * Classify exposure agreement across available measures.
 * Returns: "consensus_high" | "consensus_low" | "divergent" | "insufficient_data"
 */
function classifyAgreement(
	aioeExposure: number,
	gptExposure: number | null,
	anthropicCalibrated: boolean
): string {
	const measures: Array<{ label: string; high: boolean }> = [];

	// AIOE: high exposure if > 0.5
	measures.push({ label: 'aioe', high: aioeExposure > 0.5 });

	// GPT exposure: high if > 0.5
	if (gptExposure != null) {
		measures.push({ label: 'gpt', high: gptExposure > 0.5 });
	}

	// Anthropic: if calibrated, it already influenced the score
	if (anthropicCalibrated) {
		measures.push({ label: 'anthropic', high: aioeExposure > 0.5 }); // same direction as calibrated score
	}

	if (measures.length < 2) return 'insufficient_data';

	const highCount = measures.filter(m => m.high).length;
	const agreementRatio = Math.max(highCount, measures.length - highCount) / measures.length;

	if (agreementRatio >= 0.75) {
		return highCount > measures.length / 2 ? 'consensus_high' : 'consensus_low';
	}
	return 'divergent';
}

function main() {
	console.log('=== LLM Exposure Crosscheck ===\n');

	const gptExposure = loadGptExposure();

	if (gptExposure.size === 0) {
		console.log('\nNo GPT exposure data available. Generating stub fields...');
	}

	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));

	let matched = 0;
	let unmatched = 0;

	// Collect all GPT exposure values for percentile normalization
	const rawGptValues: number[] = [];
	const occGptMap = new Map<string, number>();

	for (const occ of occupations) {
		// Use the same crosswalk: SSOC → ISCO → SOC
		const iscoCodes = ssocToIsco(occ.ssoc);

		let gptScores: number[] = [];
		for (const isco of iscoCodes) {
			const socCodes = iscoToSoc(isco);
			for (const soc of socCodes) {
				const score = gptExposure.get(soc);
				if (score != null) {
					gptScores.push(score);
				}
			}
		}

		if (gptScores.length > 0) {
			const avg = gptScores.reduce((s, v) => s + v, 0) / gptScores.length;
			rawGptValues.push(avg);
			occGptMap.set(occ.ssoc, avg);
			matched++;
		} else {
			unmatched++;
		}
	}

	// Percentile-normalize GPT exposure scores (if we have them)
	let gptPctileMap = new Map<string, number>();
	if (rawGptValues.length > 0) {
		const sorted = [...rawGptValues].sort((a, b) => a - b);
		for (const [ssoc, raw] of occGptMap) {
			const rank = sorted.filter(v => v <= raw).length;
			gptPctileMap.set(ssoc, rank / sorted.length);
		}
	}

	// Enrich occupations
	for (const occ of occupations) {
		const gptPctile = gptPctileMap.get(occ.ssoc) ?? null;

		occ.evidence.gpt_exposure = gptPctile != null ? Number(gptPctile.toFixed(4)) : null;
		occ.evidence.exposure_agreement = classifyAgreement(
			occ.exposure,
			gptPctile,
			occ.evidence.anthropic_calibrated
		);
	}

	console.log(`\nMatched: ${matched}/${occupations.length} occupations`);
	console.log(`Unmatched: ${unmatched}`);

	// Distribution of agreement
	const agreementDist: Record<string, number> = {};
	for (const occ of occupations) {
		const ag = occ.evidence.exposure_agreement ?? 'unknown';
		agreementDist[ag] = (agreementDist[ag] || 0) + 1;
	}
	console.log('\nExposure agreement distribution:');
	for (const [key, count] of Object.entries(agreementDist)) {
		console.log(`  ${key}: ${count}`);
	}

	// Write enriched data
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(occupations, null, 2));
	console.log(`\nWritten enriched occupations to ${OUTPUT_FILE}`);
}

main();
