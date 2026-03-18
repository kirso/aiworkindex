#!/usr/bin/env bun
/**
 * fetch-postings.ts — Fetch job postings from Singapore job boards.
 *
 * Sources (require API keys or scraping setup):
 *   - MyCareersFuture (government portal)
 *   - LinkedIn Jobs API
 *   - JobStreet Singapore
 *
 * Outputs: data/postings/raw/{source}-{date}.json
 *
 * Status: STUB — infrastructure ready, needs API credentials.
 * Run: bun run scripts/pipelines/fetch-postings.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.join(import.meta.dir, '..', '..', 'data', 'postings', 'raw');

interface RawPosting {
	source: string;
	title: string;
	employer: string;
	sector: string;
	salary_min: number | null;
	salary_max: number | null;
	skills: string[];
	ai_tools_mentioned: string[];
	posted_date: string;
	ssoc_inferred: string | null;
}

async function fetchMyCareersFuture(): Promise<RawPosting[]> {
	// TODO: Implement MyCareersFuture API integration
	// API docs: https://www.mycareersfuture.gov.sg/api
	console.log('  MyCareersFuture: STUB — needs API integration');
	return [];
}

async function fetchLinkedIn(): Promise<RawPosting[]> {
	// TODO: Implement LinkedIn Jobs API
	// Requires LinkedIn API partner access
	console.log('  LinkedIn: STUB — needs API partner credentials');
	return [];
}

async function fetchJobStreet(): Promise<RawPosting[]> {
	// TODO: Implement JobStreet scraping/API
	console.log('  JobStreet: STUB — needs scraping setup');
	return [];
}

async function main() {
	console.log('=== Job Postings Pipeline ===\n');
	console.log('This script fetches job postings from Singapore job boards.');
	console.log('Currently in STUB mode — API integrations not yet configured.\n');

	fs.mkdirSync(OUT_DIR, { recursive: true });

	const date = new Date().toISOString().split('T')[0];
	const sources = [
		{ name: 'mycareersfuture', fn: fetchMyCareersFuture },
		{ name: 'linkedin', fn: fetchLinkedIn },
		{ name: 'jobstreet', fn: fetchJobStreet }
	];

	for (const source of sources) {
		const postings = await source.fn();
		if (postings.length > 0) {
			const outFile = path.join(OUT_DIR, `${source.name}-${date}.json`);
			fs.writeFileSync(outFile, JSON.stringify(postings, null, 2));
			console.log(`  Saved ${postings.length} postings to ${outFile}`);
		}
	}

	console.log('\nTo activate:');
	console.log('  1. Set API keys in .env');
	console.log('  2. Implement fetch functions above');
	console.log('  3. Run: bun run scripts/pipelines/fetch-postings.ts');
	console.log('  4. Then: bun run scripts/pipelines/normalize-postings.ts');
}

main().catch(console.error);
