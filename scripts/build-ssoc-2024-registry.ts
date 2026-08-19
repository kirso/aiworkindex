#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = path.join(import.meta.dir, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw', 'official', 'ssoc-2024');
const COMPAT_RAW_DIR = path.join(ROOT, 'data', 'raw', 'compatibility', 'ssoc-2020-url-continuity');
const DATA_DIR = path.join(ROOT, 'data');
const COMPAT_DIR = path.join(DATA_DIR, 'compat');

const DEFINITION_FILE = path.join(RAW_DIR, 'ssoc-2024-detailed-definitions.xlsx');
const ALPHABETICAL_FILE = path.join(RAW_DIR, 'ssoc-2024-alphabetical-index.xlsx');
const ISCO_FILE = path.join(RAW_DIR, 'ssoc-2024-isco08-correspondence.xlsx');
const LEGACY_FILE = path.join(COMPAT_RAW_DIR, 'ssoc-2020-2024-correspondence.xlsx');
const SOURCE_METADATA_FILE = path.join(RAW_DIR, 'source-metadata.json');

type Cell = string | number | boolean | Date | null;
type Row = Cell[];

interface HierarchyEntry {
	code: string;
	title: string;
}

interface IscoCandidate {
	code: string;
	title: string;
	part: string | null;
}

interface RegistryEntry {
	code: string;
	title: string;
	entry_kind: 'occupation' | 'residual';
	hierarchy: {
		major_group: HierarchyEntry;
		sub_major_group: HierarchyEntry | null;
		minor_group: HierarchyEntry | null;
		unit_group: HierarchyEntry | null;
	};
	groups_classified_under_code: string[];
	detailed_definition: string | null;
	tasks: string[];
	notes: string | null;
	examples_included: string[];
	examples_excluded: string[];
	search_synonyms: string[];
	isco08: {
		quality: 'one_to_one' | 'one_to_many' | 'partial' | 'unmatched';
		candidates: IscoCandidate[];
	};
	page_eligible: boolean;
}

function rows(file: string, sheetName?: string): Row[] {
	const workbook = XLSX.readFile(file);
	const selected = sheetName ?? workbook.SheetNames[0];
	if (!selected || !workbook.Sheets[selected]) throw new Error(`${file}: sheet not found`);
	return XLSX.utils.sheet_to_json<Row>(workbook.Sheets[selected], { header: 1, defval: null });
}

function text(value: Cell): string {
	return value == null ? '' : String(value).trim();
}

function classificationCode(value: Cell): string | null {
	const normalized = text(value);
	return /^(?:\d{1,5}|X\d{0,4})$/.test(normalized) ? normalized : null;
}

function fiveDigitCode(value: Cell): string | null {
	const normalized = text(value);
	return /^(?:\d{5}|X\d{4})$/.test(normalized) ? normalized : null;
}

function cleanList(value: Cell): string[] {
	const raw = text(value);
	if (!raw) return [];
	return raw
		.split(/\r?\n/)
		.map(item => item.replace(/^[\s•●▪◦\u009f\u00a0]+/u, '').trim())
		.filter(Boolean);
}

function nullableText(value: Cell): string | null {
	const normalized = text(value);
	return normalized || null;
}

function hierarchyCode(code: string, length: number): string | null {
	if (code.startsWith('X')) return length === 1 ? 'X' : null;
	return code.slice(0, length);
}

function hierarchyEntry(
	code: string,
	length: number,
	titles: Map<string, string>
): HierarchyEntry | null {
	const key = hierarchyCode(code, length);
	if (!key) return null;
	const title = titles.get(key);
	if (!title) throw new Error(`${code}: missing ${length}-digit hierarchy title for ${key}`);
	return { code: key, title };
}

function uniqueSorted(values: Iterable<string>): string[] {
	return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function writeJson(file: string, value: unknown) {
	fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
	for (const file of [DEFINITION_FILE, ALPHABETICAL_FILE, ISCO_FILE, LEGACY_FILE]) {
		if (!fs.existsSync(file)) throw new Error(`${file} missing; run bun run download:ssoc-2024`);
	}

	const sourceMetadata = JSON.parse(fs.readFileSync(SOURCE_METADATA_FILE, 'utf8'));
	const definitionRows = rows(DEFINITION_FILE, 'SSOC2024 Detailed Definitions');
	const definitionHeader = definitionRows.findIndex(row => text(row[0]) === 'SSOC 2024');
	if (definitionHeader < 0) throw new Error('SSOC definitions header not found');

	const hierarchyTitles = new Map<string, string>();
	const detailByCode = new Map<string, Row>();
	for (const row of definitionRows.slice(definitionHeader + 1)) {
		const code = classificationCode(row[0]);
		const title = text(row[1]);
		if (!code || !title) continue;
		hierarchyTitles.set(code, title);
		if (fiveDigitCode(code)) detailByCode.set(code, row);
	}

	const synonymRows = rows(ALPHABETICAL_FILE, 'SSOC 2024 Alpha Index');
	const synonymHeader = synonymRows.findIndex(row => text(row[0]) === 'SSOC 2024');
	if (synonymHeader < 0) throw new Error('SSOC alphabetical-index header not found');
	const synonymsByCode = new Map<string, Set<string>>();
	for (const row of synonymRows.slice(synonymHeader + 1)) {
		const code = fiveDigitCode(row[0]);
		const label = text(row[1]);
		if (!code || !label) continue;
		const values = synonymsByCode.get(code) ?? new Set<string>();
		values.add(label);
		synonymsByCode.set(code, values);
	}

	const iscoRows = rows(ISCO_FILE, 'SSOC2024-ISCO08');
	const iscoHeader = iscoRows.findIndex(row => text(row[1]) === 'SSOC 2024');
	if (iscoHeader < 0) throw new Error('SSOC to ISCO header not found');
	const iscoByCode = new Map<string, IscoCandidate[]>();
	for (const row of iscoRows.slice(iscoHeader + 1)) {
		const code = fiveDigitCode(row[1]);
		const isco = text(row[2]);
		if (!code) continue;
		const values = iscoByCode.get(code) ?? [];
		if (/^\d{4}$/.test(isco)) {
			values.push({ code: isco, title: text(row[4]), part: nullableText(row[3]) });
		}
		iscoByCode.set(code, values);
	}

	const registry: RegistryEntry[] = [...detailByCode]
		.map(([code, row]) => {
			const candidates = iscoByCode.get(code) ?? [];
			const hasPartial = candidates.some(candidate => candidate.part !== null);
			const quality =
				candidates.length === 0
					? 'unmatched'
					: hasPartial
						? 'partial'
						: candidates.length > 1
							? 'one_to_many'
							: 'one_to_one';
			const entryKind = code.startsWith('X') ? 'residual' : 'occupation';
			return {
				code,
				title: text(row[1]),
				entry_kind: entryKind,
				hierarchy: {
					major_group: hierarchyEntry(code, 1, hierarchyTitles)!,
					sub_major_group: hierarchyEntry(code, 2, hierarchyTitles),
					minor_group: hierarchyEntry(code, 3, hierarchyTitles),
					unit_group: hierarchyEntry(code, 4, hierarchyTitles)
				},
				groups_classified_under_code: cleanList(row[2]),
				detailed_definition: nullableText(row[3]),
				tasks: cleanList(row[4]),
				notes: nullableText(row[5]),
				examples_included: cleanList(row[6]),
				examples_excluded: cleanList(row[7]),
				search_synonyms: uniqueSorted(synonymsByCode.get(code) ?? []),
				isco08: { quality, candidates },
				page_eligible: entryKind === 'occupation'
			} satisfies RegistryEntry;
		})
		.sort((a, b) => a.code.localeCompare(b.code));

	const numeric = registry.filter(entry => entry.entry_kind === 'occupation');
	const residual = registry.filter(entry => entry.entry_kind === 'residual');
	if (registry.length !== 1006)
		throw new Error(`expected 1006 registry entries, found ${registry.length}`);
	if (numeric.length !== 1001)
		throw new Error(`expected 1001 occupations, found ${numeric.length}`);
	if (residual.length !== 5)
		throw new Error(`expected 5 residual entries, found ${residual.length}`);
	if (new Set(registry.map(entry => entry.code)).size !== registry.length) {
		throw new Error('duplicate SSOC 2024 registry codes');
	}

	const crosswalk = registry.map(entry => ({
		ssoc2024: entry.code,
		ssoc2024_title: entry.title,
		quality: entry.isco08.quality,
		isco08: entry.isco08.candidates
	}));

	const legacyRows = rows(LEGACY_FILE, 'SSOC2020-2024');
	const legacyHeader = legacyRows.findIndex(row => text(row[1]) === 'SSOC 2020');
	if (legacyHeader < 0) throw new Error('SSOC 2020 to 2024 header not found');
	const currentCodes = new Set(registry.map(entry => entry.code));
	const legacyMap = new Map<string, { title: string; successors: Set<string> }>();
	for (const row of legacyRows.slice(legacyHeader + 1)) {
		const previous = fiveDigitCode(row[1]);
		const current = fiveDigitCode(row[2]);
		if (!previous || !current) continue;
		const record = legacyMap.get(previous) ?? {
			title: text(row[0]),
			successors: new Set<string>()
		};
		record.successors.add(current);
		legacyMap.set(previous, record);
	}

	const retired = [...legacyMap]
		.filter(([code]) => !currentCodes.has(code))
		.map(([code, value]) => ({
			ssoc2020: code,
			title: value.title,
			successors: [...value.successors]
				.map(successor => {
					const entry = registry.find(candidate => candidate.code === successor);
					if (!entry) throw new Error(`${code}: successor ${successor} missing from registry`);
					return { ssoc2024: successor, title: entry.title };
				})
				.sort((a, b) => a.ssoc2024.localeCompare(b.ssoc2024))
		}))
		.sort((a, b) => a.ssoc2020.localeCompare(b.ssoc2020));
	const redirects = retired.filter(entry => entry.successors.length === 1);
	const ambiguous = retired.filter(entry => entry.successors.length > 1);
	if (retired.length !== 47 || redirects.length !== 43 || ambiguous.length !== 4) {
		throw new Error(
			`unexpected legacy continuity counts: ${retired.length} retired, ${redirects.length} redirects, ${ambiguous.length} ambiguous`
		);
	}

	fs.mkdirSync(COMPAT_DIR, { recursive: true });
	writeJson(path.join(DATA_DIR, 'ssoc-2024-registry.json'), {
		schema_version: '1.0',
		taxonomy: 'SSOC 2024',
		source: sourceMetadata,
		counts: {
			total: registry.length,
			occupations: numeric.length,
			residual: residual.length
		},
		entries: registry
	});
	writeJson(path.join(DATA_DIR, 'ssoc-2024-isco08.json'), {
		schema_version: '1.0',
		source_key: 'singstat_ssoc2024_isco08',
		entries: crosswalk
	});
	writeJson(path.join(DATA_DIR, 'ssoc-2024-search-synonyms.json'), {
		schema_version: '1.0',
		source_key: 'singstat_ssoc2024_alphabetical_index',
		entries: registry.map(entry => ({
			ssoc2024: entry.code,
			title: entry.title,
			synonyms: entry.search_synonyms
		}))
	});
	writeJson(path.join(COMPAT_DIR, 'ssoc-2020-url-continuity.json'), {
		schema_version: '1.0',
		purpose:
			'URL continuity only. This artifact is forbidden from active data or methodology imports.',
		redirects,
		ambiguous
	});

	const redirectLines = [
		'# Generated SSOC 2020 occupation redirects — URL continuity only',
		...redirects.map(
			entry => `/occupation/${entry.ssoc2020} /occupation/${entry.successors[0]!.ssoc2024} 308`
		),
		'',
		'# SG occupation path aliases — redirect to canonical /occupation/ paths at the edge',
		'/sg/occupation/* /occupation/:splat 308',
		''
	];
	fs.writeFileSync(path.join(ROOT, 'static', '_redirects'), redirectLines.join('\n'));

	console.log(
		`Registry: ${registry.length} total / ${numeric.length} occupations / ${residual.length} residual`
	);
	console.log(`Legacy URLs: ${redirects.length} redirects / ${ambiguous.length} migration pages`);
	console.log(
		`ISCO mapping: ${crosswalk.filter(entry => entry.quality === 'one_to_one').length} one-to-one / ${crosswalk.filter(entry => entry.quality === 'unmatched').length} unmatched`
	);
}

main();
