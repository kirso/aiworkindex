#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'official',
	'skills-framework',
	'v9-pilot-reviewed-extracts.json'
);
const OCCUPATIONS_FILE = path.join(ROOT, 'data', 'occupations-v9.json');
const OUTPUTS = [
	path.join(ROOT, 'data', 'v9-skills-pilot.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-skills-pilot.json'),
	path.join(ROOT, 'static', 'data', 'v9-skills-pilot.json')
];

type MappingQuality = 'exact_title' | 'reviewed_definition_equivalent';
type Skill = [name: string, proficiency: string];

interface SourceExtract {
	schema_version: '9.0';
	reviewed_at: string;
	scope: string;
	rights_boundary: string;
	sources: Record<
		string,
		{
			sector: string;
			publisher: string;
			title: string;
			url: string;
			artifact_sha256: string | null;
			verification: string;
			sector_page: string;
		}
	>;
	profiles: Array<{
		sector_key: string;
		source_job_role: string;
		ssoc2024: string;
		expected_ssoc_title: string;
		mapping_quality: MappingQuality;
		mapping_rationale: string;
		technical_skills: Skill[];
		core_skills: Skill[];
	}>;
	training_discovery_url: string;
}

interface OccupationRelease {
	occupations: Array<{ taxonomy: { code: string; title: string } }>;
}

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function validateSkills(skills: Skill[], label: string): void {
	if (skills.length === 0) throw new Error(`${label}: expected at least one skill`);
	const names = new Set<string>();
	for (const [name, proficiency] of skills) {
		if (!name.trim() || !proficiency.trim()) throw new Error(`${label}: blank skill field`);
		if (names.has(name)) throw new Error(`${label}: duplicate skill ${name}`);
		names.add(name);
	}
}

const source = readJson<SourceExtract>(SOURCE_FILE);
const occupations = readJson<OccupationRelease>(OCCUPATIONS_FILE).occupations;
const occupationByCode = new Map(
	occupations.map(occupation => [occupation.taxonomy.code, occupation.taxonomy])
);

if (occupations.length !== 1001)
	throw new Error(`Expected 1,001 occupations, got ${occupations.length}`);
if (source.profiles.length !== 7)
	throw new Error('The V9 skills pilot must contain seven sector-role profiles');
if (Object.keys(source.sources).sort().join(',') !== 'financial_services,healthcare,ict') {
	throw new Error('The V9 skills pilot must contain exactly the three reviewed sectors');
}

const uniqueProfileKeys = new Set<string>();
const profilesByOccupation = new Map<string, Array<Record<string, unknown>>>();
for (const profile of source.profiles) {
	const key = `${profile.ssoc2024}:${profile.sector_key}:${profile.source_job_role}`;
	if (uniqueProfileKeys.has(key)) throw new Error(`${key}: duplicate sector-role profile`);
	uniqueProfileKeys.add(key);
	const occupation = occupationByCode.get(profile.ssoc2024);
	if (!occupation) throw new Error(`${profile.ssoc2024}: occupation is not in V9`);
	if (occupation.title !== profile.expected_ssoc_title) {
		throw new Error(`${profile.ssoc2024}: SSOC title drift`);
	}
	const sector = source.sources[profile.sector_key];
	if (!sector) throw new Error(`${profile.sector_key}: missing sector source`);
	validateSkills(profile.technical_skills, key);
	validateSkills(profile.core_skills, key);
	const rows = profilesByOccupation.get(profile.ssoc2024) ?? [];
	rows.push({
		sector_key: profile.sector_key,
		sector: sector.sector,
		source_job_role: profile.source_job_role,
		mapping: {
			quality: profile.mapping_quality,
			rationale: profile.mapping_rationale,
			reviewed_at: source.reviewed_at
		},
		technical_skills: profile.technical_skills.map(([name, proficiency]) => ({
			name,
			proficiency
		})),
		core_skills: profile.core_skills.map(([name, proficiency]) => ({ name, proficiency })),
		source: {
			publisher: sector.publisher,
			title: sector.title,
			url: sector.url,
			sector_page: sector.sector_page,
			verification: sector.verification
		}
	});
	profilesByOccupation.set(profile.ssoc2024, rows);
}

const profiles = Object.fromEntries(
	[...profilesByOccupation.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([code, sectorProfiles]) => [
			code,
			{
				occupation: occupationByCode.get(code),
				status: 'available_pilot',
				headline_effect: 'none',
				sector_profiles: sectorProfiles
			}
		])
);

const artifact = {
	schema_version: '9.0',
	release: 'V9',
	generated_at: '2026-08-22',
	reviewed_at: source.reviewed_at,
	construct: 'official_sector_role_skills_pilot',
	headline_effect: 'none',
	claim_boundary:
		'Selected official sector-role skill labels for practical self-assessment. They are not a measured worker skill level, training recommendation, transition score or pressure input.',
	publication_rule: {
		owner: 'data/raw/official/skills-framework/v9-pilot-reviewed-extracts.json',
		mapping: 'exact role title or explicit reviewed definition-equivalent relation',
		content: 'selected skill names and source proficiency labels only',
		excluded: [
			'skill descriptions',
			'full task text',
			'course endorsements',
			'inferred skill gaps'
		],
		missingness: 'outside_pilot_never_zero'
	},
	rights_boundary: source.rights_boundary,
	training_discovery_url: source.training_discovery_url,
	sources: source.sources,
	coverage: {
		ssoc_occupations: occupations.length,
		sectors: Object.keys(source.sources).length,
		unique_occupations: profilesByOccupation.size,
		sector_role_profiles: source.profiles.length,
		exact_title_profiles: source.profiles.filter(
			profile => profile.mapping_quality === 'exact_title'
		).length,
		reviewed_definition_equivalent_profiles: source.profiles.filter(
			profile => profile.mapping_quality === 'reviewed_definition_equivalent'
		).length,
		unavailable_outside_pilot: occupations.length - profilesByOccupation.size
	},
	occupation_status: Object.fromEntries(
		occupations.map(occupation => [
			occupation.taxonomy.code,
			profilesByOccupation.has(occupation.taxonomy.code)
				? 'available_pilot'
				: 'unavailable_outside_pilot'
		])
	),
	profiles
};

const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
for (const output of OUTPUTS) {
	fs.mkdirSync(path.dirname(output), { recursive: true });
	fs.writeFileSync(output, serialized, 'utf8');
}

console.log(
	`V9 skills pilot: ${artifact.coverage.unique_occupations} occupations, ${artifact.coverage.sector_role_profiles} sector-role profiles, ${artifact.coverage.sectors} sectors`
);
