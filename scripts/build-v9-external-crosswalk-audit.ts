#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSX from 'xlsx';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESCO_DIR = path.join(ROOT, 'data', 'raw', 'external', 'esco-onet');
const OCCUPATIONS_FILE = path.join(ESCO_DIR, 'occupations_en_v1.1.0.csv');
const CROSSWALK_FILE = path.join(ESCO_DIR, 'onet-esco-crosswalk_v1.0.csv');
const ESCO_METADATA_FILE = path.join(ESCO_DIR, 'source-metadata.json');
const REGISTRY_FILE = path.join(ROOT, 'data', 'ssoc-2024-registry.json');
const ELOUNDOU_FILE = path.join(ROOT, 'data', 'raw', 'external', 'eloundou_gpts_occ_level.csv');
const ANTHROPIC_FILE = path.join(ROOT, 'data', 'raw', 'external', 'anthropic_job_exposure.csv');
const AIOE_FILE = path.join(ROOT, 'data', 'raw', 'external', 'AIOE_DataAppendix.xlsx');
const OUTPUTS = [
	path.join(ROOT, 'data', 'v9-external-crosswalk-audit.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-external-crosswalk-audit.json'),
	path.join(ROOT, 'static', 'data', 'v9-external-crosswalk-audit.json')
];

type MatchType = 'exactMatch' | 'closeMatch' | 'broadMatch' | 'narrowMatch';

interface EscoOccupationRow {
	conceptUri?: unknown;
	iscoGroup?: unknown;
}

interface CrosswalkRow {
	'O*NET Id'?: unknown;
	'ESCO or ISCO URI'?: unknown;
	'Type of Match'?: unknown;
}

interface RegistryDocument {
	entries: Array<{
		entry_kind: string;
		code: string;
		isco08: { candidates: Array<{ code: string }> };
	}>;
}

interface ValueRow {
	code: string;
	value: number;
}

function rows<T extends Record<string, unknown>>(file: string, range?: number): T[] {
	const workbook = XLSX.readFile(file);
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) throw new Error(`${file}: no worksheet`);
	const sheet = workbook.Sheets[sheetName];
	if (!sheet) throw new Error(`${file}: worksheet ${sheetName} unavailable`);
	return XLSX.utils.sheet_to_json<T>(sheet, range == null ? undefined : { range });
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function numeric(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function summary(values: readonly number[]) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
	return {
		rows: sorted.length,
		median: Number(median.toFixed(4)),
		min: Number(sorted[0]!.toFixed(4)),
		max: Number(sorted.at(-1)!.toFixed(4)),
		spread: Number((sorted.at(-1)! - sorted[0]!).toFixed(4))
	};
}

function sourceMap(valueRows: readonly ValueRow[]): Map<string, number> {
	const result = new Map<string, number>();
	for (const row of valueRows) {
		if (result.has(row.code)) throw new Error(`${row.code}: duplicate external source row`);
		result.set(row.code, row.value);
	}
	return result;
}

function add(map: Map<string, Set<string>>, key: string, value: string) {
	const values = map.get(key) ?? new Set<string>();
	values.add(value);
	map.set(key, values);
}

function main() {
	for (const file of [
		OCCUPATIONS_FILE,
		CROSSWALK_FILE,
		ESCO_METADATA_FILE,
		REGISTRY_FILE,
		ELOUNDOU_FILE,
		ANTHROPIC_FILE,
		AIOE_FILE
	]) {
		if (!fs.existsSync(file)) throw new Error(`${file}: required audit input missing`);
	}

	const escoMetadata = JSON.parse(fs.readFileSync(ESCO_METADATA_FILE, 'utf8'));
	const escoToIsco = new Map<string, string>();
	for (const row of rows<EscoOccupationRow>(OCCUPATIONS_FILE)) {
		const uri = String(row.conceptUri ?? '').trim();
		const isco = String(row.iscoGroup ?? '').trim();
		if (!uri || !/^\d{4}$/.test(isco)) continue;
		if (escoToIsco.has(uri)) throw new Error(`${uri}: duplicate ESCO occupation`);
		escoToIsco.set(uri, isco);
	}

	const allowedRelations = new Set<MatchType>([
		'exactMatch',
		'closeMatch',
		'broadMatch',
		'narrowMatch'
	]);
	const relationCounts: Record<MatchType, number> = {
		exactMatch: 0,
		closeMatch: 0,
		broadMatch: 0,
		narrowMatch: 0
	};
	const strictByIsco = new Map<string, Set<string>>();
	const exactByIsco = new Map<string, Set<string>>();
	const closeByIsco = new Map<string, Set<string>>();
	let missingEscoUri = 0;
	for (const row of rows<CrosswalkRow>(CROSSWALK_FILE, 16)) {
		const onet = String(row['O*NET Id'] ?? '').trim();
		const uri = String(row['ESCO or ISCO URI'] ?? '').trim();
		const relation = String(row['Type of Match'] ?? '').trim() as MatchType;
		if (!allowedRelations.has(relation)) continue;
		if (!/^\d{2}-\d{4}\.\d{2}$/.test(onet)) throw new Error(`${onet}: invalid O*NET ID`);
		relationCounts[relation] += 1;
		const isco = escoToIsco.get(uri);
		if (!isco) {
			missingEscoUri += 1;
			continue;
		}
		if (relation === 'exactMatch') add(exactByIsco, isco, onet);
		if (relation === 'closeMatch') add(closeByIsco, isco, onet);
		if (relation === 'exactMatch' || relation === 'closeMatch') add(strictByIsco, isco, onet);
	}

	const eloundou = sourceMap(
		rows<Record<string, unknown>>(ELOUNDOU_FILE).flatMap(row => {
			const code = String(row['O*NET-SOC Code'] ?? '').trim();
			const value = numeric(row.dv_rating_beta);
			return /^\d{2}-\d{4}\.\d{2}$/.test(code) && value != null ? [{ code, value }] : [];
		})
	);
	const anthropic = sourceMap(
		rows<Record<string, unknown>>(ANTHROPIC_FILE).flatMap(row => {
			const code = String(row.occ_code ?? '').trim();
			const value = numeric(row.observed_exposure);
			return /^\d{2}-\d{4}$/.test(code) && value != null ? [{ code, value }] : [];
		})
	);
	const aioeWorkbook = XLSX.readFile(AIOE_FILE);
	const aioeSheet = aioeWorkbook.Sheets['Appendix A'];
	if (!aioeSheet) throw new Error('AIOE workbook missing Appendix A');
	const aioe = sourceMap(
		XLSX.utils.sheet_to_json<Record<string, unknown>>(aioeSheet).flatMap(row => {
			const code = String(row['SOC Code'] ?? '').trim();
			const value = numeric(row.AIOE);
			return /^\d{2}-\d{4}$/.test(code) && value != null ? [{ code, value }] : [];
		})
	);

	const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) as RegistryDocument;
	const occupations = registry.entries.filter(entry => entry.entry_kind === 'occupation');
	const relevantIsco = new Set(
		occupations.flatMap(entry => entry.isco08.candidates.map(candidate => candidate.code))
	);
	const perIsco = Object.fromEntries(
		[...relevantIsco].sort().map(isco => {
			const onetIds = [...(strictByIsco.get(isco) ?? [])].sort();
			const socIds = [...new Set(onetIds.map(code => code.slice(0, 7)))].sort();
			const eloundouValues = onetIds.flatMap(code => {
				const value = eloundou.get(code);
				return value == null ? [] : [value];
			});
			const anthropicValues = socIds.flatMap(code => {
				const value = anthropic.get(code);
				return value == null ? [] : [value];
			});
			const aioeValues = socIds.flatMap(code => {
				const value = aioe.get(code);
				return value == null ? [] : [value];
			});
			return [
				isco,
				{
					exact_onet_ids: [...(exactByIsco.get(isco) ?? [])].sort(),
					close_onet_ids: [...(closeByIsco.get(isco) ?? [])].sort(),
					strict_unique_onet_ids: onetIds,
					strict_unique_soc_ids: socIds,
					candidate_value_summary: {
						eloundou_dv_rating_beta: summary(eloundouValues),
						anthropic_observed_exposure: summary(anthropicValues),
						aioe_soc2010: summary(aioeValues)
					}
				}
			];
		})
	);

	function coverage(
		key: 'eloundou_dv_rating_beta' | 'anthropic_observed_exposure' | 'aioe_soc2010'
	) {
		const coveredIsco = new Set(
			Object.entries(perIsco)
				.filter(([, row]) => row.candidate_value_summary[key] != null)
				.map(([isco]) => isco)
		);
		const coveredOccupations = occupations.filter(entry =>
			entry.isco08.candidates.some(candidate => coveredIsco.has(candidate.code))
		).length;
		return {
			isco08_groups: coveredIsco.size,
			isco08_denominator: relevantIsco.size,
			ssoc_occupations: coveredOccupations,
			ssoc_denominator: occupations.length
		};
	}

	const strictCounts = Object.values(perIsco).map(row => row.strict_unique_onet_ids.length);
	const sortedCounts = [...strictCounts].sort((a, b) => a - b);
	const audit = {
		schema_version: '9.0',
		generated_at: '2026-08-20',
		headline_effect: 'none',
		status: 'crosswalk_chain_available_sidecars_still_withheld',
		chain:
			'official SSOC 2024 to ISCO-08 candidates → ESCO v1.1.0 occupations → official ESCO-O*NET v1 exact/close matches → exact compatible source occupation code',
		transfer_rule_under_review:
			'Exact and close ESCO-O*NET relations only. Broad and narrow relations remain excluded. No candidate-value aggregation is published until source code versions and mapping sensitivity are validated.',
		sources: {
			esco_onet: escoMetadata,
			eloundou: {
				artifact: path.relative(ROOT, ELOUNDOU_FILE),
				sha256: sha256(ELOUNDOU_FILE),
				code_system_in_file: 'O*NET-SOC with detail suffix; exact taxonomy version not recorded'
			},
			anthropic_observed_use: {
				artifact: path.relative(ROOT, ANTHROPIC_FILE),
				sha256: sha256(ANTHROPIC_FILE),
				code_system_in_file: 'six-digit US SOC; exact taxonomy version not recorded'
			},
			aioe: {
				artifact: path.relative(ROOT, AIOE_FILE),
				sha256: sha256(AIOE_FILE),
				code_system_in_file:
					'SOC 2010; incompatible with the O*NET-SOC 2019 crosswalk without a verified version bridge'
			},
			oecd_ai_capability_gap: {
				publication_url:
					'https://www.oecd.org/en/publications/the-oecd-ai-exposure-measure_f3da0f0a-en.html',
				publication_revision: '2026-07',
				row_level_artifact: null,
				status: 'withheld_no_row_level_occupation_artifact'
			}
		},
		quality: {
			esco_occupation_rows: escoToIsco.size,
			crosswalk_relation_rows: relationCounts,
			crosswalk_rows_without_classification_uri: missingEscoUri,
			relevant_official_isco08_groups: relevantIsco.size,
			strict_mapped_isco08_groups: strictCounts.filter(count => count > 0).length,
			strict_onet_candidates_per_isco08: {
				median: sortedCounts[Math.floor(sortedCounts.length / 2)] ?? 0,
				max: sortedCounts.at(-1) ?? 0
			},
			candidate_coverage_not_public_coverage: {
				eloundou: coverage('eloundou_dv_rating_beta'),
				anthropic_observed_use: coverage('anthropic_observed_exposure'),
				aioe: coverage('aioe_soc2010')
			}
		},
		dispositions: {
			eloundou: 'withheld_pending_source_taxonomy_version_and_many_to_many_transfer_validation',
			anthropic_observed_use:
				'withheld_pending_source_taxonomy_version_and_many_to_many_transfer_validation',
			aioe: 'withheld_soc2010_to_onet_soc2019_version_bridge_missing',
			oecd_ai_capability_gap: 'withheld_no_row_level_occupation_artifact'
		},
		publication_gates: [
			'Pin the exact occupation-code taxonomy version for each source snapshot.',
			'Pre-register an aggregation rule for several exact/close O*NET candidates and report range, count and relation mix.',
			'Compare exact-only and exact-plus-close results; withhold records whose interpretation is mapping-sensitive.',
			'Keep geography, observation period, platform selection and construct limitations on every published block.',
			'Prove with an invariance test that external evidence cannot change the ILO headline.'
		],
		per_isco08: perIsco
	};
	const payload = `${JSON.stringify(audit, null, 2)}\n`;
	for (const output of OUTPUTS) {
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, payload, 'utf8');
	}
	console.log(
		`External crosswalk audit: ${audit.quality.strict_mapped_isco08_groups}/${relevantIsco.size} relevant ISCO groups have exact/close O*NET candidates; publication remains withheld`
	);
}

main();
