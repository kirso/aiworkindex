#!/usr/bin/env bun
/**
 * download-official-sg-labour.ts — Download the official public Singapore labour
 * datasets used by the labour monitor into stable raw JSON files.
 *
 * This keeps the raw folder reproducible even when data.gov.sg throttles the
 * search API. The downloader uses the public datastore API with browser-like
 * headers and paginates through the full result set.
 *
 * Run:
 *   bun run scripts/download-official-sg-labour.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');

interface DatasetDownload {
	resourceId: string;
	label: string;
	outFile: string;
}

const DATASETS: DatasetDownload[] = [
	{
		resourceId: 'd_236436f8bdb9bbac677c4e5637c6430e',
		label: 'MOM annual recruitment/resignation rates by occupation group',
		outFile: path.join(RAW_DIR, 'recruitment_resignation_rates.json')
	},
	{
		resourceId: 'd_3eaf52cdcc405a80b602d031d0bd092b',
		label: 'SingStat quarterly retrenched employees by occupation group',
		outFile: path.join(RAW_DIR, 'retrenchment_by_occupation_group.json')
	}
];

const HEADERS = {
	'User-Agent': 'Mozilla/5.0',
	Referer: 'https://data.gov.sg/'
};

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(resourceId: string, offset: number, limit: number) {
	const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&offset=${offset}&limit=${limit}`;
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			const response = await fetch(url, { headers: HEADERS });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const payload = (await response.json()) as {
				success?: boolean;
				code?: number;
				name?: string;
				errorMsg?: string;
				result?: {
					total?: number;
					records?: Array<Record<string, unknown>>;
				};
			};

			if (payload.code === 24 || payload.name === 'TOO_MANY_REQUESTS') {
				await sleep(12_000);
				continue;
			}

			if (!payload.success || !payload.result?.records) {
				throw new Error(payload.errorMsg ?? 'Unexpected API payload');
			}

			return payload;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			await sleep(2_000 * (attempt + 1));
		}
	}

	throw lastError ?? new Error(`Failed to fetch ${resourceId}`);
}

async function fetchAllRecords(resourceId: string) {
	const limit = 1000;
	let offset = 0;
	let total = Infinity;
	const records: Array<Record<string, unknown>> = [];

	while (offset < total) {
		const payload = await fetchPage(resourceId, offset, limit);
		const pageRecords = payload.result?.records ?? [];
		const pageTotal = payload.result?.total ?? pageRecords.length;
		total = pageTotal;
		records.push(...pageRecords);
		offset += pageRecords.length;

		if (pageRecords.length === 0) break;
		await sleep(300);
	}

	return {
		downloaded_at: new Date().toISOString(),
		resource_id: resourceId,
		result: {
			total: records.length,
			records
		}
	};
}

fs.mkdirSync(RAW_DIR, { recursive: true });

for (const dataset of DATASETS) {
	console.log(`Downloading ${dataset.label}...`);
	const payload = await fetchAllRecords(dataset.resourceId);
	fs.writeFileSync(dataset.outFile, JSON.stringify(payload, null, 2), 'utf-8');
	console.log(
		`  Saved ${payload.result.total} records to ${path.relative(ROOT_DIR, dataset.outFile)}`
	);
}

console.log('Done.');
