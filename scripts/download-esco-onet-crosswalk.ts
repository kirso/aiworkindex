#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT, 'data', 'raw', 'external', 'esco-onet');
const CLASSIFICATION_URL =
	'https://ec.europa.eu/esco/download/ESCO%20dataset%20-%20v1.1.0%20-%20classification%20-%20en%20-%20csv.zip';
const CROSSWALK_URL =
	'https://esco.ec.europa.eu/system/files/2023-08/ONET_%28Occupations%29_0_updated.csv';
const EXPECTED = {
	classificationZip: '3b2ed440310d85edda9594773abbf113246eb11d07de83393879b3f167e5e45a',
	crosswalk: '82179a0a3340da97b63df90134d8d941ec3c2c478334d855b69e4dd57a91b620'
} as const;

function digest(bytes: Uint8Array): string {
	return createHash('sha256').update(bytes).digest('hex');
}

async function download(url: string): Promise<Uint8Array> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: download returned ${response.status}`);
	return new Uint8Array(await response.arrayBuffer());
}

async function main() {
	const [classificationZip, crosswalk] = await Promise.all([
		download(CLASSIFICATION_URL),
		download(CROSSWALK_URL)
	]);
	if (digest(classificationZip) !== EXPECTED.classificationZip) {
		throw new Error('ESCO v1.1.0 classification checksum changed');
	}
	if (digest(crosswalk) !== EXPECTED.crosswalk) {
		throw new Error('ESCO-O*NET crosswalk checksum changed');
	}

	const temporaryZip = path.join(os.tmpdir(), 'ai-work-index-esco-v1.1.0-en-csv.zip');
	await Bun.write(temporaryZip, classificationZip);
	const extracted = Bun.spawnSync(['unzip', '-p', temporaryZip, 'occupations_en.csv']);
	if (extracted.exitCode !== 0 || extracted.stdout.length === 0) {
		throw new Error(`Could not extract occupations_en.csv: ${extracted.stderr.toString()}`);
	}

	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	const occupationsFile = path.join(OUTPUT_DIR, 'occupations_en_v1.1.0.csv');
	const crosswalkFile = path.join(OUTPUT_DIR, 'onet-esco-crosswalk_v1.0.csv');
	fs.writeFileSync(occupationsFile, extracted.stdout);
	fs.writeFileSync(crosswalkFile, crosswalk);
	const metadata = {
		publisher: 'European Commission, ESCO Secretariat',
		retrieved_at: '2026-08-20',
		classification: {
			version: 'ESCO v1.1.0',
			artifact: path.basename(occupationsFile),
			source_package_url: CLASSIFICATION_URL,
			source_package_sha256: EXPECTED.classificationZip,
			artifact_sha256: digest(extracted.stdout)
		},
		crosswalk: {
			version: '1',
			version_date: '2022-09',
			onet_version: 'O*NET-SOC 2019',
			esco_version: 'ESCO v1.1.0',
			artifact: path.basename(crosswalkFile),
			url: CROSSWALK_URL,
			sha256: EXPECTED.crosswalk,
			methodology_url:
				'https://esco.ec.europa.eu/publication/crosswalk-between-esco-and-onet-technical-report',
			quality_note:
				'Official European Commission and US Department of Labor collaboration. Exact, close, broad and narrow relations were human validated; related matches are excluded from this artifact.'
		},
		use_boundary:
			'Crosswalk audit input only. No row may enter the V9 headline. Any external sidecar also requires exact source-code compatibility, transfer rules, aggregation and coverage review.'
	};
	fs.writeFileSync(
		path.join(OUTPUT_DIR, 'source-metadata.json'),
		`${JSON.stringify(metadata, null, 2)}\n`,
		'utf8'
	);
	console.log(
		`Downloaded ${path.basename(occupationsFile)} and ${path.basename(crosswalkFile)} with pinned checksums`
	);
}

await main();
