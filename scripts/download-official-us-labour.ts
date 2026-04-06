#!/usr/bin/env bun
/**
 * download-official-us-labour.ts — Download the official U.S. labor sources
 * used by the composite US support bundle.
 *
 * This keeps the raw corpus reproducible without scraping the browser UI.
 *
 * Run:
 *   bun run scripts/download-official-us-labour.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const ROOT_DIR = path.join(import.meta.dir, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw', 'external', 'us');
const OEWS_ZIP_URL = 'https://www.bls.gov/oes/special-requests/oesm24nat.zip';
const ORS_XLSX_URL = 'https://www.bls.gov/web/ors/ors-complete-dataset.xlsx';
const OOH_XML_URL = 'https://www.bls.gov/ooh/xml-compilation.xml';
const EP_OCCUPATION_URL = 'https://www.bls.gov/emp/ind-occ-matrix/occupation.xlsx';
const EP_SKILLS_URL = 'https://www.bls.gov/emp/skills/skills.xlsx';

const HEADERS = {
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
	Referer: 'https://www.bls.gov/'
};

interface DownloadedFile {
	label: string;
	url: string;
	path: string;
	sizeBytes: number;
}

function ensureDir(filepath: string): void {
	fs.mkdirSync(path.dirname(filepath), { recursive: true });
}

async function fetchBuffer(url: string): Promise<Buffer> {
	const response = await fetch(url, { headers: HEADERS });
	if (!response.ok) {
		throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

async function downloadFile(url: string, outPath: string): Promise<DownloadedFile> {
	const buffer = await fetchBuffer(url);
	ensureDir(outPath);
	fs.writeFileSync(outPath, buffer);
	return {
		label: path.basename(outPath),
		url,
		path: outPath,
		sizeBytes: buffer.length
	};
}

async function downloadZipAndExtract(url: string, outDir: string): Promise<DownloadedFile[]> {
	const buffer = await fetchBuffer(url);
	ensureDir(path.join(outDir, 'placeholder'));

	const zipPath = path.join(outDir, path.basename(new URL(url).pathname));
	fs.writeFileSync(zipPath, buffer);

	const result = spawnSync('unzip', ['-o', zipPath, '-d', outDir], { stdio: 'inherit' });
	if (result.status !== 0) {
		throw new Error(`Failed to unzip ${zipPath} (status ${result.status ?? 'unknown'})`);
	}

	const entries: DownloadedFile[] = [];
	for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
		const fullPath = path.join(outDir, entry.name);
		if (entry.isFile()) {
			entries.push({
				label: entry.name,
				url,
				path: fullPath,
				sizeBytes: fs.statSync(fullPath).size
			});
		}
	}

	return entries;
}

async function main() {
	fs.mkdirSync(RAW_DIR, { recursive: true });

	const files: DownloadedFile[] = [];

	console.log('Downloading OEWS national workbook...');
	files.push(
		...(await downloadZipAndExtract(OEWS_ZIP_URL, path.join(RAW_DIR, 'oesm24nat'))).filter(file =>
			file.path.endsWith('.xlsx')
		)
	);

	console.log('Downloading ORS complete dataset...');
	files.push(
		await downloadFile(ORS_XLSX_URL, path.join(RAW_DIR, 'ors-complete-dataset.xlsx'))
	);

	console.log('Downloading OOH XML compilation...');
	files.push(await downloadFile(OOH_XML_URL, path.join(RAW_DIR, 'ooh-xml-compilation.xml')));

	console.log('Downloading EP occupation workbook...');
	files.push(await downloadFile(EP_OCCUPATION_URL, path.join(RAW_DIR, 'occupation.xlsx')));

	console.log('Downloading EP skills workbook...');
	files.push(await downloadFile(EP_SKILLS_URL, path.join(RAW_DIR, 'skills.xlsx')));

	const manifest = {
		downloaded_at: new Date().toISOString(),
		source: 'official_bls',
		files: files.map(file => ({
			label: file.label,
			url: file.url,
			path: path.relative(ROOT_DIR, file.path),
			size_bytes: file.sizeBytes
		}))
	};

	const manifestPath = path.join(RAW_DIR, 'manifest.json');
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
	console.log(`Wrote ${path.relative(ROOT_DIR, manifestPath)}`);

	console.log(`Done. Downloaded ${files.length} files.`);
	for (const file of files) {
		console.log(`  ${path.relative(ROOT_DIR, file.path)} (${file.sizeBytes} bytes)`);
	}
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
