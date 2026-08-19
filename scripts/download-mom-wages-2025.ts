#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = path.join(import.meta.dir, '..');
const OUT_DIR = path.join(ROOT, 'data', 'raw', 'official', 'mom-wages-2025');
const FILENAME = 'mom-occupational-wages-2025.xlsx';
const URL = 'https://stats.mom.gov.sg/iMAS_Tables1/Wages/Wages_2025/mrsd_2025Wages_table4.xlsx';
const SOURCE_PAGE = 'https://stats.mom.gov.sg/Pages/Occupational-Wages-Tables2025.aspx';

function sha256(data: Uint8Array): string {
	return createHash('sha256').update(data).digest('hex');
}

function detailedCodes(bytes: Uint8Array): Set<string> {
	const workbook = XLSX.read(bytes, { type: 'array' });
	const sheet = workbook.Sheets.T4;
	if (!sheet) throw new Error('expected worksheet T4');
	const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
		header: 1,
		defval: null
	});
	return new Set(rows.map(row => String(row[1] ?? '').trim()).filter(code => /^\d{5}$/.test(code)));
}

async function main() {
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const response = await fetch(URL, { redirect: 'follow' });
	if (!response.ok) throw new Error(`${URL}: HTTP ${response.status}`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	if (bytes.length < 1_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
		throw new Error(`${URL}: response is not a valid XLSX/ZIP file`);
	}
	const codes = detailedCodes(bytes);
	if (codes.size !== 523) throw new Error(`expected 523 detailed occupations, found ${codes.size}`);

	const destination = path.join(OUT_DIR, FILENAME);
	const temporary = `${destination}.tmp`;
	fs.writeFileSync(temporary, bytes);
	fs.renameSync(temporary, destination);
	fs.writeFileSync(
		path.join(OUT_DIR, 'source-metadata.json'),
		`${JSON.stringify(
			{
				publisher: 'Singapore Ministry of Manpower',
				dataset: 'Occupational Wages 2025, Table 4',
				source_page: SOURCE_PAGE,
				terms_url: 'https://www.mom.gov.sg/terms-of-use',
				retrieved_at: new Date().toISOString(),
				coverage: {
					taxonomy: 'SSOC 2024',
					detailed_occupations: codes.size,
					population:
						'Full-time resident employees in establishments with at least 25 employees, June 2025'
				},
				file: {
					filename: FILENAME,
					url: URL,
					bytes: bytes.length,
					sha256: sha256(bytes)
				}
			},
			null,
			2
		)}\n`
	);
	console.log(`MOM wages 2025: ${codes.size} detailed occupations, ${bytes.length} bytes`);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
