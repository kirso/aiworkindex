#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSX from 'xlsx';

import { reviewedCapabilityMappings } from './v9-capability-reviewed-mappings';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'raw', 'external', 'oecd-ai-capability-gap-2026.xlsx');
const SOURCE_METADATA_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'external',
	'oecd-ai-capability-gap-2026.source.json'
);
const REGISTRY_FILE = path.join(ROOT, 'data', 'ssoc-2024-registry.json');
const CROSSWALK_AUDIT_FILE = path.join(ROOT, 'data', 'v9-external-crosswalk-audit.json');
const OUTPUTS = [
	path.join(ROOT, 'data', 'v9-capability-profiles.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-capability-profiles.json'),
	path.join(ROOT, 'static', 'data', 'v9-capability-profiles.json')
];

const EXPECTED_SOURCE_SHA256 = '11643c1e5aa002613a8652c15aa93975652089eda5d005017e7ea165ead24dcd';
const REVIEWED_AT = '2026-08-21';

const DOMAINS = [
	{
		key: 'language',
		label: 'Language',
		gapField: 'Lang_Gap',
		demandField: 'Lang_Dmd',
		gapMaximum: 2
	},
	{
		key: 'social_interaction',
		label: 'Social interaction',
		gapField: 'Soc_Gap',
		demandField: 'Soc_Dmd',
		gapMaximum: 3
	},
	{
		key: 'problem_solving',
		label: 'Problem solving',
		gapField: 'ProbSolv_Gap',
		demandField: 'ProbSolv_Dmd',
		gapMaximum: 3
	},
	{
		key: 'creativity',
		label: 'Creativity',
		gapField: 'Creativity_Gap',
		demandField: 'Creativity_Dmd',
		gapMaximum: 2
	},
	{
		key: 'metacognition_critical_thinking',
		label: 'Critical thinking',
		gapField: 'Metacognition_Gap',
		demandField: 'Metacognition_Dmd',
		gapMaximum: 3
	},
	{
		key: 'knowledge_learning_memory',
		label: 'Knowledge, learning and memory',
		gapField: 'KLM_Gap',
		demandField: 'KLM_Dmd',
		gapMaximum: 2
	},
	{
		key: 'vision',
		label: 'Vision',
		gapField: 'Vision_Gap',
		demandField: 'Vision_Dmd',
		gapMaximum: 2
	},
	{
		key: 'manipulation',
		label: 'Physical manipulation',
		gapField: 'Manip_Gap',
		demandField: 'Manip_Dmd',
		gapMaximum: 3
	},
	{
		key: 'robotic_intelligence',
		label: 'Robotic intelligence',
		gapField: 'Robot_Gap',
		demandField: 'Robot_Dmd',
		gapMaximum: 3
	}
] as const;

type DomainKey = (typeof DOMAINS)[number]['key'];

interface RegistryDocument {
	entries: Array<{
		entry_kind: string;
		code: string;
		title: string;
		isco08: {
			quality: string;
			candidates: Array<{ code: string; title: string }>;
		};
	}>;
}

interface CrosswalkAudit {
	sources: { esco_onet: unknown };
	per_isco08: Record<
		string,
		{
			exact_onet_ids: string[];
			close_onet_ids: string[];
		}
	>;
}

interface SourceMetadata {
	sha256: string;
	occupation_rows: number;
	[key: string]: unknown;
}

interface OecdRow {
	code: string;
	title: string;
	overallProximity: number;
	totalGap: number;
	domains: Record<DomainKey, { gap: number; demand: number }>;
}

const GENERIC_TITLE_TOKENS = new Set([
	'manager',
	'officer',
	'worker',
	'professional',
	'specialist',
	'technician',
	'engineer',
	'operator',
	'director',
	'supervisor',
	'assistant',
	'associate',
	'clerk',
	'other',
	'related',
	'general'
]);

function titleTokens(value: string): string[] {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9/ ]+/g, ' ')
		.split(/\s+/)
		.filter(Boolean)
		.map(token => {
			if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
			if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) {
				return token.slice(0, -1);
			}
			return token;
		});
}

function officialTitleVariants(title: string): string[] {
	const normalized = title.replace(/\s+/g, ' ').trim();
	const slash = normalized.match(/^([^/]+)\/([^/]+)(\s+.+)$/);
	if (!slash) return [normalized];
	return [`${slash[1]}${slash[3]}`, `${slash[2]}${slash[3]}`].map(value => value.trim());
}

function containsContiguousTokens(needle: readonly string[], haystack: readonly string[]): boolean {
	outer: for (let start = 0; start <= haystack.length - needle.length; start += 1) {
		for (let offset = 0; offset < needle.length; offset += 1) {
			if (needle[offset] !== haystack[start + offset]) continue outer;
		}
		return true;
	}
	return false;
}

function detailedTitleIdentity(
	ssocTitle: string,
	onetTitle: string
): { matched: true; ssoc_title_variant: string } | { matched: false } {
	const onetTokens = titleTokens(onetTitle);
	for (const variant of officialTitleVariants(ssocTitle)) {
		const ssocTokens = titleTokens(variant);
		if (ssocTokens.length === 0) continue;
		if (!ssocTokens.some(token => !GENERIC_TITLE_TOKENS.has(token))) continue;
		if (!containsContiguousTokens(ssocTokens, onetTokens)) continue;

		// A one-word SSOC title must be the whole O*NET title after singularisation. This prevents
		// broad list titles such as “Appraisers and Assessors of Real Estate” from being treated as
		// detailed identity for the SSOC title “Assessor”.
		if (ssocTokens.length === 1 && onetTokens.length !== 1) continue;
		return { matched: true, ssoc_title_variant: variant };
	}
	return { matched: false };
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function round(value: number): number {
	return Number(value.toFixed(4));
}

function numeric(row: Record<string, unknown>, field: string, code: string): number {
	const value = row[field];
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`${code}: ${field} must be a finite number`);
	}
	return value;
}

function assertRange(value: number, minimum: number, maximum: number, label: string): void {
	if (value < minimum - 1e-8 || value > maximum + 1e-8) {
		throw new Error(`${label}: ${value} outside ${minimum}–${maximum}`);
	}
}

function summary(values: readonly number[]) {
	if (values.length === 0) throw new Error('Cannot summarize an empty value list');
	const sorted = values.slice().sort((a, b) => a - b);
	const midpoint = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
	return {
		median: round(median),
		min: round(sorted[0]!),
		max: round(sorted.at(-1)!),
		candidate_count: sorted.length
	};
}

function loadOecdRows(): Map<string, OecdRow> {
	const workbook = XLSX.readFile(SOURCE_FILE);
	const sheet = workbook.Sheets.Data;
	if (!sheet) throw new Error('OECD workbook is missing the Data worksheet');
	const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 2 });
	const result = new Map<string, OecdRow>();

	for (const row of rawRows) {
		const code = String(row.OCC_Code ?? '').trim();
		if (!/^\d{2}-\d{4}\.\d{2}$/.test(code)) continue;
		if (result.has(code)) throw new Error(`${code}: duplicate OECD occupation row`);
		const title = String(row.OCC_Title ?? '').trim();
		if (!title) throw new Error(`${code}: missing OECD occupation title`);
		const overallProximity = numeric(row, 'AI Capability Gap Index_Rev. norm.', code);
		const totalGap = numeric(row, 'AI Capability Gap Index_Total', code);
		assertRange(overallProximity, 0, 1, `${code} overall proximity`);
		assertRange(totalGap, 0, 23, `${code} total gap`);

		const domains = Object.fromEntries(
			DOMAINS.map(domain => {
				const gap = numeric(row, domain.gapField, code);
				const demand = numeric(row, domain.demandField, code);
				assertRange(gap, 0, domain.gapMaximum, `${code} ${domain.key} gap`);
				assertRange(demand, 0, 5, `${code} ${domain.key} demand`);
				return [domain.key, { gap: round(gap), demand: round(demand) }];
			})
		) as Record<DomainKey, { gap: number; demand: number }>;

		result.set(code, {
			code,
			title,
			overallProximity: round(overallProximity),
			totalGap: round(totalGap),
			domains
		});
	}

	return result;
}

function main() {
	for (const file of [SOURCE_FILE, SOURCE_METADATA_FILE, REGISTRY_FILE, CROSSWALK_AUDIT_FILE]) {
		if (!fs.existsSync(file)) throw new Error(`${file}: required input is missing`);
	}

	const sourceDigest = sha256(SOURCE_FILE);
	if (sourceDigest !== EXPECTED_SOURCE_SHA256) {
		throw new Error(`OECD workbook checksum changed: ${sourceDigest}`);
	}
	const sourceMetadata = JSON.parse(
		fs.readFileSync(SOURCE_METADATA_FILE, 'utf8')
	) as SourceMetadata;
	if (sourceMetadata.sha256 !== EXPECTED_SOURCE_SHA256) {
		throw new Error('OECD source metadata checksum does not match the pinned workbook');
	}

	const oecdByCode = loadOecdRows();
	if (oecdByCode.size !== sourceMetadata.occupation_rows) {
		throw new Error(
			`OECD row count changed: ${oecdByCode.size} !== ${sourceMetadata.occupation_rows}`
		);
	}

	const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) as RegistryDocument;
	const audit = JSON.parse(fs.readFileSync(CROSSWALK_AUDIT_FILE, 'utf8')) as CrosswalkAudit;
	const occupations = registry.entries.filter(entry => entry.entry_kind === 'occupation');
	if (occupations.length !== 1001) {
		throw new Error(`Expected 1,001 SSOC occupations, found ${occupations.length}`);
	}

	const profiles: Record<string, unknown> = {};
	const occupationStatus: Record<string, unknown> = {};
	const usedOecdCodes = new Set<string>();
	const reviewedBySsoc = new Map(
		reviewedCapabilityMappings.map(mapping => [mapping.ssoc2024, mapping])
	);
	if (reviewedBySsoc.size !== reviewedCapabilityMappings.length) {
		throw new Error('Reviewed capability mappings contain duplicate SSOC codes');
	}
	let mappingSensitive = 0;
	let severalCandidates = 0;
	let closeOnlyCoverage = 0;
	let rawExactCoverage = 0;
	let rejectedRawExactCandidates = 0;
	let automatedIdentityProfiles = 0;
	let manuallyReviewedProfiles = 0;
	let publishedCloseMatches = 0;

	for (const occupation of occupations) {
		const officialIscoCodes = occupation.isco08.candidates.map(candidate => candidate.code);
		const exactCandidateCodes = [
			...new Set(
				officialIscoCodes.flatMap(
					isco => audit.per_isco08[isco]?.exact_onet_ids.filter(code => oecdByCode.has(code)) ?? []
				)
			)
		].sort();
		const exactOrCloseCandidateCodes = [
			...new Set(
				officialIscoCodes.flatMap(isco => {
					const row = audit.per_isco08[isco];
					return row
						? [...row.exact_onet_ids, ...row.close_onet_ids].filter(code => oecdByCode.has(code))
						: [];
				})
			)
		].sort();

		const reviewedMapping = reviewedBySsoc.get(occupation.code);
		if (reviewedMapping && reviewedMapping.expected_ssoc_title !== occupation.title) {
			throw new Error(`${occupation.code}: reviewed SSOC title drift`);
		}

		if (exactCandidateCodes.length === 0 && !reviewedMapping) {
			if (exactOrCloseCandidateCodes.length > 0) closeOnlyCoverage += 1;
			occupationStatus[occupation.code] = {
				status: 'unavailable_no_exact_crosswalk',
				official_isco08_codes: officialIscoCodes,
				exact_oecd_candidate_count: 0,
				close_candidates_not_used: exactOrCloseCandidateCodes.length
			};
			continue;
		}
		if (exactCandidateCodes.length > 0) rawExactCoverage += 1;

		const automatedCandidates = exactCandidateCodes.flatMap(code => {
			const candidate = oecdByCode.get(code)!;
			const identity = detailedTitleIdentity(occupation.title, candidate.title);
			return identity.matched
				? [
						{
							candidate,
							relation: 'exactMatch' as const,
							identity_basis: 'conservative_title_rule' as const,
							matched_ssoc_title_variant: identity.ssoc_title_variant,
							reviewed_at: null,
							review_rationale: null
						}
					]
				: [];
		});
		rejectedRawExactCandidates += exactCandidateCodes.length - automatedCandidates.length;

		let acceptedCandidates = automatedCandidates;
		if (reviewedMapping) {
			const candidate = oecdByCode.get(reviewedMapping.onet_soc_code);
			if (!candidate) throw new Error(`${occupation.code}: reviewed OECD code is unavailable`);
			if (candidate.title !== reviewedMapping.expected_onet_title) {
				throw new Error(`${occupation.code}: reviewed OECD title drift`);
			}
			const officialCandidatePool =
				reviewedMapping.relation === 'exactMatch'
					? exactCandidateCodes
					: exactOrCloseCandidateCodes;
			if (!officialCandidatePool.includes(reviewedMapping.onet_soc_code)) {
				throw new Error(
					`${occupation.code}: reviewed ${reviewedMapping.relation} code is not in the official candidate chain`
				);
			}
			acceptedCandidates = [
				{
					candidate,
					relation: reviewedMapping.relation,
					identity_basis: 'reviewed_title_and_definition' as const,
					matched_ssoc_title_variant: occupation.title,
					reviewed_at: reviewedMapping.reviewed_at,
					review_rationale: reviewedMapping.review_rationale
				}
			];
			manuallyReviewedProfiles += 1;
			if (reviewedMapping.relation === 'closeMatch') publishedCloseMatches += 1;
		} else if (acceptedCandidates.length > 0) automatedIdentityProfiles += 1;

		if (acceptedCandidates.length === 0) {
			occupationStatus[occupation.code] = {
				status: 'unavailable_no_detailed_title_identity',
				official_isco08_codes: officialIscoCodes,
				raw_exact_oecd_candidate_count: exactCandidateCodes.length,
				accepted_title_identity_count: 0,
				close_candidates_not_used: Math.max(
					0,
					exactOrCloseCandidateCodes.length - exactCandidateCodes.length
				)
			};
			continue;
		}

		const candidates = acceptedCandidates.map(({ candidate }) => candidate);
		for (const candidate of candidates) usedOecdCodes.add(candidate.code);
		if (candidates.length > 1) severalCandidates += 1;
		const overallProximity = summary(candidates.map(candidate => candidate.overallProximity));
		if (overallProximity.min !== overallProximity.max) mappingSensitive += 1;

		profiles[occupation.code] = {
			occupation: {
				ssoc2024: occupation.code,
				title: occupation.title
			},
			status: 'available_reviewed_identity',
			headline_effect: 'none',
			mapping: {
				method:
					'official SSOC 2024 to ISCO-08 candidates, official ESCO v1.1.0 to O*NET-SOC candidate relation, identical OECD O*NET 30.3 code, then either the conservative detailed-title rule or an explicit reviewed title-and-definition decision',
				ssoc_isco_quality: occupation.isco08.quality,
				official_isco08_codes: officialIscoCodes,
				oecd_candidates: acceptedCandidates.map(candidateRow => ({
					onet_soc_code: candidateRow.candidate.code,
					title: candidateRow.candidate.title,
					relation: candidateRow.relation,
					detailed_title_identity: true,
					identity_basis: candidateRow.identity_basis,
					matched_ssoc_title_variant: candidateRow.matched_ssoc_title_variant,
					reviewed_at: candidateRow.reviewed_at,
					review_rationale: candidateRow.review_rationale
				})),
				raw_exact_candidates_rejected_by_title_rule:
					exactCandidateCodes.length - automatedCandidates.length,
				aggregation: 'median_across_unique_reviewed_identity_candidates',
				version_limitation:
					'The official ESCO crosswalk identifies O*NET-SOC 2019 while the OECD workbook uses O*NET 30.3. Only identical detailed codes are retained; title and range remain visible.'
			},
			overall: {
				ai_capability_proximity_0_1: overallProximity,
				total_capability_gap_0_23: summary(candidates.map(candidate => candidate.totalGap)),
				interpretation:
					'Higher proximity means current AI capabilities are closer to the capability demands of the mapped O*NET occupations. It does not measure adoption or employment effects.'
			},
			domains: Object.fromEntries(
				DOMAINS.map(domain => [
					domain.key,
					{
						label: domain.label,
						capability_gap: summary(candidates.map(candidate => candidate.domains[domain.key].gap)),
						gap_scale: { min: 0, max: domain.gapMaximum, lower_is_closer: true },
						job_demand: summary(candidates.map(candidate => candidate.domains[domain.key].demand)),
						demand_scale: { min: 0, max: 5, higher_is_more_demanded: true }
					}
				])
			)
		};
		occupationStatus[occupation.code] = {
			status: 'available_reviewed_identity',
			official_isco08_codes: officialIscoCodes,
			raw_exact_oecd_candidate_count: exactCandidateCodes.length,
			accepted_title_identity_count: candidates.length,
			close_candidates_not_used: Math.max(0, exactOrCloseCandidateCodes.length - candidates.length)
		};
	}

	const available = Object.keys(profiles).length;
	const artifact = {
		schema_version: '9.0',
		release: 'V9',
		generated_at: REVIEWED_AT,
		reviewed_at: REVIEWED_AT,
		headline_effect: 'none',
		construct: 'mapped_oecd_ai_capability_gap_profile',
		claim_boundary:
			'A separate mapped international comparison of occupational capability demands and current AI capabilities. It is published only for a conservative detailed-title subset. It is not a Singapore observation, adoption measure, task-automation share or employment forecast.',
		source: {
			...sourceMetadata,
			local_artifact: path.relative(ROOT, SOURCE_FILE)
		},
		crosswalk_source: audit.sources.esco_onet,
		publication_rule: {
			relations_used: ['exactMatch', 'reviewed closeMatch allow-list'],
			relations_excluded_without_review: ['closeMatch', 'broadMatch', 'narrowMatch'],
			detailed_identity_modes: {
				automated:
					'The singularised official SSOC detailed-title variant, including any parenthetical qualifier, must appear as a contiguous phrase in the O*NET title. A one-word SSOC title must equal the whole singularised O*NET title.',
				reviewed:
					'An explicit allow-list may accept an exact or close official candidate after the current SSOC and O*NET titles, occupation definitions and scope qualifiers are reviewed. The decision, date and rationale are published on the record.'
			},
			manual_review_registry: 'scripts/v9-capability-reviewed-mappings.ts',
			candidate_chain_boundary:
				'An exact ESCO–O*NET relation generates candidates but does not establish identity for a five-digit SSOC occupation.',
			aggregation: 'median_across_unique_reviewed_identity_candidates',
			uncertainty: 'Publish minimum, median, maximum and candidate count for every measure.',
			missingness:
				'No accepted automated or explicitly reviewed detailed identity means unavailable. Search synonyms, examples and broad-group fallbacks are never accepted automatically.'
		},
		domains: DOMAINS.map(domain => ({
			key: domain.key,
			label: domain.label,
			gap_scale: { min: 0, max: domain.gapMaximum, lower_is_closer: true },
			demand_scale: { min: 0, max: 5, higher_is_more_demanded: true }
		})),
		coverage: {
			ssoc_occupations: occupations.length,
			raw_exact_candidate_coverage: rawExactCoverage,
			available_reviewed_identity_profiles: available,
			available_automated_title_rule_profiles: automatedIdentityProfiles,
			available_manual_review_profiles: manuallyReviewedProfiles,
			unavailable_without_published_profile: occupations.length - available,
			coverage_pct: round((available / occupations.length) * 100),
			unique_oecd_rows_used: usedOecdCodes.size,
			profiles_with_several_title_identity_candidates: severalCandidates,
			profiles_with_nonzero_overall_mapping_range: mappingSensitive,
			raw_exact_candidates_rejected_by_title_rule: rejectedRawExactCandidates,
			occupations_available_only_if_close_matches_were_allowed: closeOnlyCoverage,
			close_match_profiles_published: publishedCloseMatches
		},
		occupation_status: occupationStatus,
		profiles
	};

	const payload = `${JSON.stringify(artifact, null, 2)}\n`;
	for (const output of OUTPUTS) {
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, payload, 'utf8');
	}

	console.log(
		`V9 capability profiles: ${available}/${occupations.length} reviewed SSOC identities (${automatedIdentityProfiles} automated, ${manuallyReviewedProfiles} manual); ${usedOecdCodes.size} OECD rows; headline unchanged`
	);
}

main();
