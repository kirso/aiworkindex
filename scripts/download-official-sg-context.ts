#!/usr/bin/env bun
/**
 * download-official-sg-context.ts — Download official Singapore geography and
 * macro context datasets used around the structural score.
 *
 * Run:
 *   bun run scripts/download-official-sg-context.ts
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
		resourceId: 'd_63449f74c83eb941f87c2172f08d299c',
		label: 'Planning area of residence by occupation (Census 2020)',
		outFile: path.join(RAW_DIR, 'planning_area_residence_by_occupation.json')
	},
	{
		resourceId: 'd_0888806f369c8527e969a5f6f8528d1c',
		label: 'Travel time to work by occupation and sex (Census 2020)',
		outFile: path.join(RAW_DIR, 'travel_time_to_work_by_occupation.json')
	},
	{
		resourceId: 'd_b816a930bca0eb19fdf20fcbfcdd4c39',
		label: 'Quarterly unemployment rate (seasonally adjusted)',
		outFile: path.join(RAW_DIR, 'unemployment_rate_quarterly.json')
	},
	{
		resourceId: 'd_6530db8211d9538872eb7b1f5dd366d0',
		label: 'Job vacancy to unemployed person ratio',
		outFile: path.join(RAW_DIR, 'job_vacancy_to_unemployed_ratio.json')
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
