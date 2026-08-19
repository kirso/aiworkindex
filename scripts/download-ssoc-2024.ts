#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(import.meta.dir, '..');
const CURRENT_OUT_DIR = path.join(ROOT, 'data', 'raw', 'official', 'ssoc-2024');
const COMPAT_OUT_DIR = path.join(ROOT, 'data', 'raw', 'compatibility', 'ssoc-2020-url-continuity');
const SOURCE_PAGE =
	'https://www.singstat.gov.sg/standard-classifications/national-classifications/singapore-standard-occupational-classification-ssoc';

const sources = [
	{
		key: 'definitions',
		purpose: 'current_taxonomy',
		filename: 'ssoc-2024-detailed-definitions.xlsx',
		url: 'https://www.singstat.gov.sg/files/456a230e-fa6a-41f6-9e7f-6d3f0ffcf521.xlsx',
		published: '2026-06-24'
	},
	{
		key: 'alphabetical_index',
		purpose: 'current_taxonomy',
		filename: 'ssoc-2024-alphabetical-index.xlsx',
		url: 'https://www.singstat.gov.sg/files/e1468cad-4d50-412e-97b7-40d3621a4953.xlsx',
		published: '2026-06-24'
	},
	{
		key: 'ssoc2024_isco08',
		purpose: 'current_taxonomy',
		filename: 'ssoc-2024-isco08-correspondence.xlsx',
		url: 'https://www.singstat.gov.sg/files/64fec1e2-8a1f-426b-87f7-07b29aae61b3.xlsx',
		published: '2024-03-21'
	},
	{
		key: 'ssoc2020_2024_url_continuity',
		purpose: 'url_continuity_only',
		filename: 'ssoc-2020-2024-correspondence.xlsx',
		url: 'https://www.singstat.gov.sg/files/9c84e968-93bb-44e2-8e96-2c7142c1cf42.xlsx',
		published: '2024-03-21'
	}
] as const;

function sha256(data: Uint8Array): string {
	return createHash('sha256').update(data).digest('hex');
}

async function download(url: string, destination: string): Promise<Uint8Array> {
	const response = await fetch(url, { redirect: 'follow' });
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	if (bytes.length < 1_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
		throw new Error(`${url}: response is not a valid XLSX/ZIP file`);
	}
	const temporary = `${destination}.tmp`;
	fs.writeFileSync(temporary, bytes);
	fs.renameSync(temporary, destination);
	return bytes;
}

async function main() {
	fs.mkdirSync(CURRENT_OUT_DIR, { recursive: true });
	fs.mkdirSync(COMPAT_OUT_DIR, { recursive: true });
	const retrievedAt = new Date().toISOString();
	const currentFiles = [];
	const compatibilityFiles = [];

	for (const source of sources) {
		const outDir = source.purpose === 'current_taxonomy' ? CURRENT_OUT_DIR : COMPAT_OUT_DIR;
		const destination = path.join(outDir, source.filename);
		const bytes = await download(source.url, destination);
		const record = {
			...source,
			bytes: bytes.length,
			sha256: sha256(bytes)
		};
		if (source.purpose === 'current_taxonomy') currentFiles.push(record);
		else compatibilityFiles.push(record);
		console.log(`${source.key}: ${bytes.length} bytes`);
	}

	fs.writeFileSync(
		path.join(CURRENT_OUT_DIR, 'source-metadata.json'),
		`${JSON.stringify(
			{
				publisher: 'Singapore Department of Statistics',
				taxonomy: 'Singapore Standard Occupational Classification 2024',
				source_page: SOURCE_PAGE,
				terms_url: 'https://www.singstat.gov.sg/terms-of-use',
				retrieved_at: retrievedAt,
				files: currentFiles
			},
			null,
			2
		)}\n`
	);
	fs.writeFileSync(
		path.join(COMPAT_OUT_DIR, 'source-metadata.json'),
		`${JSON.stringify(
			{
				publisher: 'Singapore Department of Statistics',
				purpose:
					'URL continuity only. This source is forbidden from active data and methodology imports.',
				source_page: SOURCE_PAGE,
				terms_url: 'https://www.singstat.gov.sg/terms-of-use',
				retrieved_at: retrievedAt,
				files: compatibilityFiles
			},
			null,
			2
		)}\n`
	);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
