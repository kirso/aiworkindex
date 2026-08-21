#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OCCUPATIONS_FILE = path.join(ROOT, 'data', 'occupations-v9.json');
const CAPABILITIES_FILE = path.join(ROOT, 'data', 'v9-capability-profiles.json');
const ELOUNDOU_FILE = path.join(ROOT, 'data', 'raw', 'external', 'eloundou_gpts_occ_level.csv');
const ANTHROPIC_FILE = path.join(ROOT, 'data', 'raw', 'external', 'anthropic_job_exposure.csv');
const METADATA_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'external',
	'v9-research-signals-source-metadata.json'
);
const OUTPUTS = [
	path.join(ROOT, 'data', 'v9-research-signals.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-research-signals.json'),
	path.join(ROOT, 'static', 'data', 'v9-research-signals.json')
];

interface OccupationRelease {
	occupations: Array<{ taxonomy: { code: string; title: string } }>;
}

interface AcceptedIdentity {
	onet_soc_code: string;
	title: string;
	relation: 'exactMatch';
	detailed_title_identity: true;
	matched_ssoc_title_variant: string;
}

interface CapabilityArtifact {
	profiles: Record<
		string,
		{
			occupation: { ssoc2024: string; title: string };
			mapping: {
				ssoc_isco_quality: string;
				official_isco08_codes: string[];
				oecd_candidates: AcceptedIdentity[];
			};
		}
	>;
}

interface SourceMetadata {
	reviewed_at: string;
	eloundou: Record<string, unknown> & {
		artifact_sha256: string;
		artifact_git_blob: string;
		row_count: number;
	};
	anthropic_observed_exposure: Record<string, unknown> & {
		artifact_sha256: string;
		artifact_git_blob: string;
		row_count: number;
	};
}

interface EloundouRow {
	code: string;
	title: string;
	value: number;
}

interface AnthropicRow {
	code: string;
	title: string;
	value: number;
}

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function gitBlob(file: string): string {
	const buffer = fs.readFileSync(file);
	return createHash('sha1')
		.update(Buffer.from(`blob ${buffer.length}\0`))
		.update(buffer)
		.digest('hex');
}

function parseCsvRow(line: string): string[] {
	const fields: string[] = [];
	let value = '';
	let quoted = false;
	for (let index = 0; index < line.length; index += 1) {
		const character = line[index]!;
		if (character === '"') {
			if (quoted && line[index + 1] === '"') {
				value += '"';
				index += 1;
			} else {
				quoted = !quoted;
			}
		} else if (character === ',' && !quoted) {
			fields.push(value);
			value = '';
		} else {
			value += character;
		}
	}
	fields.push(value);
	return fields;
}

function readCsv(file: string): Array<Record<string, string>> {
	const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
	const header = parseCsvRow(lines[0]!);
	return lines.slice(1).map(line => {
		const fields = parseCsvRow(line);
		if (fields.length !== header.length) {
			throw new Error(`${path.basename(file)}: malformed row with ${fields.length} fields`);
		}
		return Object.fromEntries(header.map((field, index) => [field, fields[index] ?? '']));
	});
}

function numeric(value: string, label: string): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
		throw new Error(`${label}: expected a value on the 0–1 scale, received ${value}`);
	}
	return parsed;
}

function round(value: number): number {
	return Number(value.toFixed(4));
}

function midrankPercentiles(values: Map<string, number>): Map<string, number> {
	const ordered = [...values.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
	const result = new Map<string, number>();
	let start = 0;
	while (start < ordered.length) {
		let end = start;
		while (end + 1 < ordered.length && ordered[end + 1]![1] === ordered[start]![1]) end += 1;
		const midrank = (start + end) / 2;
		const percentile = ordered.length === 1 ? 100 : round((midrank / (ordered.length - 1)) * 100);
		for (let index = start; index <= end; index += 1) result.set(ordered[index]![0], percentile);
		start = end + 1;
	}
	return result;
}

const occupations = readJson<OccupationRelease>(OCCUPATIONS_FILE).occupations;
const capabilities = readJson<CapabilityArtifact>(CAPABILITIES_FILE);
const metadata = readJson<SourceMetadata>(METADATA_FILE);

if (sha256(ELOUNDOU_FILE) !== metadata.eloundou.artifact_sha256) {
	throw new Error('Eloundou source checksum does not match the reviewed metadata');
}
if (gitBlob(ELOUNDOU_FILE) !== metadata.eloundou.artifact_git_blob) {
	throw new Error('Eloundou source is not the reviewed upstream Git blob');
}
if (sha256(ANTHROPIC_FILE) !== metadata.anthropic_observed_exposure.artifact_sha256) {
	throw new Error('Anthropic source checksum does not match the reviewed metadata');
}
if (gitBlob(ANTHROPIC_FILE) !== metadata.anthropic_observed_exposure.artifact_git_blob) {
	throw new Error('Anthropic source is not the reviewed upstream Git blob');
}

const eloundouRows = readCsv(ELOUNDOU_FILE);
const anthropicRows = readCsv(ANTHROPIC_FILE);
if (eloundouRows.length !== metadata.eloundou.row_count)
	throw new Error('Eloundou row-count drift');
if (anthropicRows.length !== metadata.anthropic_observed_exposure.row_count) {
	throw new Error('Anthropic row-count drift');
}

const eloundou = new Map<string, EloundouRow>();
for (const row of eloundouRows) {
	const code = row['O*NET-SOC Code']!;
	if (eloundou.has(code)) throw new Error(`${code}: duplicate Eloundou row`);
	eloundou.set(code, {
		code,
		title: row.Title!,
		value: numeric(row.dv_rating_beta!, `${code} Eloundou beta`)
	});
}

const anthropic = new Map<string, AnthropicRow>();
for (const row of anthropicRows) {
	const code = row.occ_code!;
	if (anthropic.has(code)) throw new Error(`${code}: duplicate Anthropic row`);
	anthropic.set(code, {
		code,
		title: row.title!,
		value: numeric(row.observed_exposure!, `${code} Anthropic observed exposure`)
	});
}

const mappedRows = new Map<
	string,
	{
		occupation: { ssoc2024: string; title: string };
		mapping: {
			method: string;
			ssoc_isco_quality: string;
			official_isco08_codes: string[];
			onet_soc_code: string;
			onet_title: string;
			matched_ssoc_title_variant: string;
		};
		eloundou: EloundouRow;
		anthropic: AnthropicRow | null;
	}
>();

for (const [ssoc, profile] of Object.entries(capabilities.profiles)) {
	if (profile.mapping.oecd_candidates.length !== 1) {
		throw new Error(
			`${ssoc}: research-signal publication requires one reviewed identity candidate`
		);
	}
	const identity = profile.mapping.oecd_candidates[0]!;
	const eloundouRow = eloundou.get(identity.onet_soc_code);
	if (!eloundouRow) throw new Error(`${ssoc}: reviewed O*NET identity has no Eloundou source row`);
	if (eloundouRow.title !== identity.title) {
		throw new Error(`${ssoc}: Eloundou and reviewed O*NET titles disagree`);
	}
	mappedRows.set(ssoc, {
		occupation: profile.occupation,
		mapping: {
			method:
				'official SSOC 2024 to ISCO-08, exact ESCO to O*NET-SOC, reviewed detailed-title identity, then exact source occupation code',
			ssoc_isco_quality: profile.mapping.ssoc_isco_quality,
			official_isco08_codes: profile.mapping.official_isco08_codes,
			onet_soc_code: identity.onet_soc_code,
			onet_title: identity.title,
			matched_ssoc_title_variant: identity.matched_ssoc_title_variant
		},
		eloundou: eloundouRow,
		anthropic: anthropic.get(identity.onet_soc_code.slice(0, 7)) ?? null
	});
}

const eloundouValues = new Map([...mappedRows].map(([code, row]) => [code, row.eloundou.value]));
const anthropicValues = new Map(
	[...mappedRows]
		.filter((entry): entry is [string, (typeof entry)[1] & { anthropic: AnthropicRow }] =>
			Boolean(entry[1].anthropic)
		)
		.map(([code, row]) => [code, row.anthropic.value])
);
const eloundouPercentiles = midrankPercentiles(eloundouValues);
const anthropicPercentiles = midrankPercentiles(anthropicValues);

const profiles = Object.fromEntries(
	[...mappedRows.entries()].map(([code, row]) => [
		code,
		{
			occupation: row.occupation,
			status: 'available_reviewed_identity',
			headline_effect: 'none',
			mapping: row.mapping,
			eloundou_theoretical_exposure: {
				value_0_1: round(row.eloundou.value),
				within_published_subset_midrank_percentile: eloundouPercentiles.get(code),
				source_occupation: { code: row.eloundou.code, title: row.eloundou.title },
				interpretation:
					'Higher values mean more tasks were judged directly exposed to an LLM or exposed with complementary software under the beta rubric. This is potential, not observed adoption.'
			},
			anthropic_observed_exposure: row.anthropic
				? {
						value_0_1: round(row.anthropic.value),
						within_published_subset_midrank_percentile: anthropicPercentiles.get(code),
						source_occupation: { code: row.anthropic.code, title: row.anthropic.title },
						interpretation:
							'Higher values mean more theoretically feasible tasks were observed in work-related Claude usage, with automated use weighted more than augmentative use. This is platform evidence, not Singapore adoption.'
					}
				: null,
			derived_theory_use_gap: row.anthropic
				? {
						value_0_1: round(row.eloundou.value - row.anthropic.value),
						interpretation:
							'Eloundou beta minus Anthropic observed exposure. A larger positive gap indicates more theoretical scope than observed Claude use in the source periods; it is not a forecast.'
					}
				: null
		}
	])
);

const occupationStatus = Object.fromEntries(
	occupations.map(occupation => {
		const row = mappedRows.get(occupation.taxonomy.code);
		return [
			occupation.taxonomy.code,
			row
				? {
						identity: 'available_reviewed_identity',
						eloundou_theoretical_exposure: 'available',
						anthropic_observed_exposure: row.anthropic ? 'available' : 'unavailable_source_row'
					}
				: {
						identity: 'unavailable_no_reviewed_identity',
						eloundou_theoretical_exposure: 'unavailable_no_reviewed_identity',
						anthropic_observed_exposure: 'unavailable_no_reviewed_identity'
					}
		];
	})
);

const artifact = {
	schema_version: '9.0',
	release: 'V9',
	generated_at: '2026-08-19',
	reviewed_at: metadata.reviewed_at,
	headline_effect: 'none',
	construct: 'separate_theoretical_and_platform_observed_exposure_signals',
	claim_boundary:
		'These US occupation research signals are transferred only through reviewed detailed-title identities. They do not measure Singapore adoption, employment effects or job-loss probability and cannot change the ILO headline.',
	publication_rule: {
		identity_owner: 'data/v9-capability-profiles.json',
		relations_allowed: ['exactMatch'],
		detailed_title_identity_required: true,
		close_broad_narrow_relations_allowed: false,
		source_code_match: 'exact',
		aggregation: 'not_needed_one_reviewed_identity_candidate_per_published_occupation',
		missingness: 'unavailable_never_zero'
	},
	coverage: {
		ssoc_occupations: occupations.length,
		reviewed_identity_profiles: mappedRows.size,
		eloundou_theoretical_exposure_available: eloundouValues.size,
		anthropic_observed_exposure_available: anthropicValues.size,
		both_signals_available: anthropicValues.size,
		unavailable_without_reviewed_identity: occupations.length - mappedRows.size,
		anthropic_unavailable_source_rows_after_identity: mappedRows.size - anthropicValues.size
	},
	sources: {
		eloundou: metadata.eloundou,
		anthropic_observed_exposure: metadata.anthropic_observed_exposure
	},
	occupation_status: occupationStatus,
	profiles
};

const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
for (const output of OUTPUTS) {
	fs.mkdirSync(path.dirname(output), { recursive: true });
	fs.writeFileSync(output, serialized);
}

console.log(
	`Built V9 research signals: ${eloundouValues.size} Eloundou, ${anthropicValues.size} Anthropic, ${occupations.length} occupation statuses.`
);
