#!/usr/bin/env bun
/**
 * download-official-sg-transition.ts — Download official Singapore transition
 * infrastructure inputs used by the transition-support layer.
 *
 * Run:
 *   bun run scripts/download-official-sg-transition.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');

const WSQ_RESOURCE_ID = 'd_711ea9c032baf00470246b09499b65c9';
const WSQ_OUT_FILE = path.join(RAW_DIR, 'wsq_trainees_by_statement_attainment.json');
const JTM_URL = 'https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps';
const JTM_OUT_FILE = path.join(RAW_DIR, 'jtm_overview.html');

const HEADERS = {
	'User-Agent': 'Mozilla/5.0',
	Referer: 'https://data.gov.sg/'
};

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJsonDataset(resourceId: string) {
	const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=1000`;
	for (let attempt = 0; attempt < 4; attempt++) {
		const response = await fetch(url, { headers: HEADERS });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const payload = (await response.json()) as {
			code?: number;
			name?: string;
			errorMsg?: string;
			success?: boolean;
			result?: {
				records?: Array<Record<string, unknown>>;
				total?: number;
			};
		};
		if (payload.code === 24 || payload.name === 'TOO_MANY_REQUESTS') {
			await sleep(12_000);
			continue;
		}
		if (!payload.success || !payload.result?.records) {
			throw new Error(payload.errorMsg ?? 'Unexpected API response');
		}
		return {
			downloaded_at: new Date().toISOString(),
			resource_id: resourceId,
			result: payload.result
		};
	}

	throw new Error(`Failed to fetch resource ${resourceId} after retries`);
}

async function fetchHtml(url: string) {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0'
		}
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return await response.text();
}

fs.mkdirSync(RAW_DIR, { recursive: true });

console.log('Downloading official WSQ transition statistics...');
const wsqPayload = await fetchJsonDataset(WSQ_RESOURCE_ID);
fs.writeFileSync(WSQ_OUT_FILE, JSON.stringify(wsqPayload, null, 2), 'utf-8');
console.log(
	`  Saved ${wsqPayload.result.total ?? wsqPayload.result.records?.length ?? 0} records to ${path.relative(ROOT_DIR, WSQ_OUT_FILE)}`
);

console.log('Downloading WSG Jobs Transformation Maps overview page...');
const jtmHtml = await fetchHtml(JTM_URL);
fs.writeFileSync(JTM_OUT_FILE, jtmHtml, 'utf-8');
console.log(`  Saved HTML to ${path.relative(ROOT_DIR, JTM_OUT_FILE)}`);

console.log('Done.');
