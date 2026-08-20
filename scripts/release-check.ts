#!/usr/bin/env bun

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { countryConfigs } from '../src/lib/data/country-config';
import type { V9PublicRelease } from './v9-public-export';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = path.join(ROOT, 'static');
const STATIC_DATA = path.join(STATIC, 'data');
const SITE_URL = 'https://aiworkindex.com';

function readJson<T>(file: string): T {
	assert(fs.existsSync(file), `missing release artifact: ${file}`);
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function readText(file: string): string {
	assert(fs.existsSync(file), `missing release artifact: ${file}`);
	return fs.readFileSync(file, 'utf8');
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function collectKeys(value: unknown, result = new Set<string>()): Set<string> {
	if (Array.isArray(value)) {
		for (const item of value) collectKeys(item, result);
		return result;
	}
	if (!value || typeof value !== 'object') return result;
	for (const [key, child] of Object.entries(value)) {
		result.add(key);
		collectKeys(child, result);
	}
	return result;
}

function listFiles(directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const absolute = path.join(directory, entry.name);
		return entry.isDirectory() ? listFiles(absolute) : [absolute];
	});
}

function noindexPatterns(contents: string): string[] {
	const patterns: string[] = [];
	let currentPath: string | null = null;
	for (const line of contents.split('\n')) {
		if (line.startsWith('/')) currentPath = line.trim();
		if (/^\s+X-Robots-Tag:\s*noindex/i.test(line) && currentPath) patterns.push(currentPath);
	}
	return patterns;
}

function pathMatchesHeaderPattern(publicPath: string, pattern: string): boolean {
	const expression = pattern
		.split('*')
		.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('.*');
	return new RegExp(`^${expression}$`).test(publicPath);
}

const core = readJson<{
	schema_version: string;
	generated_at: string;
	counts: V9PublicRelease['counts'];
	occupations: V9PublicRelease['occupations'];
}>(path.join(ROOT, 'data', 'occupations-v9.json'));
const publicRelease = readJson<V9PublicRelease>(
	path.join(STATIC_DATA, 'sg-ai-occupations-v9.json')
);
const market = readJson<{
	schema_version: string;
	taxonomy: string;
	rules: Record<string, string>;
	demand_by_code: Record<string, unknown[]>;
	withheld_demand_mappings: unknown[];
	labour_by_major_group: Record<string, unknown>;
	national: {
		labour_market_q2_2026_advance: { status: string };
		postings_monitor: {
			public_demand_input: boolean;
			status: string;
			observed_through: string | null;
		};
	};
}>(path.join(STATIC_DATA, 'v9-market-context.json'));
const roleRelease = readJson<{
	schema_version: string;
	taxonomy: string;
	counts: {
		roles: number;
		exact_title_matches: number;
		reviewed_alias_matches: number;
		official_query_matches: number;
		non_official_roles: number;
		component_references: number;
		composite_roles: number;
		mapping_withheld: number;
	};
	roles: Array<{
		slug: string;
		official_status: string;
		resolution_basis: string;
		estimate: unknown;
		official_occupation: { ssoc2024: string; pressure_rank: number | null } | null;
		components: Array<{ ssoc2024: string }>;
	}>;
}>(path.join(STATIC_DATA, 'synthetic-roles-v9.json'));
const searchIndex = readJson<{
	schema_version: string;
	occupations: Array<{ code: string }>;
	roles: Array<{ slug: string }>;
	official_role_aliases: Array<{ slug: string; official_ssoc2024: string }>;
	role_queries: Array<{
		slug: string;
		journey_kind: string;
		official_ssoc2024: string | null;
		pressure_rank: number | null;
		pressure_kind: string;
		href: string;
		family_key: string;
	}>;
	role_query_counts: {
		all: number;
		exact_official_titles: number;
		reviewed_official_matches: number;
		composite_estimates: number;
		mapping_withheld: number;
	};
}>(path.join(STATIC_DATA, 'v9-search-index.json'));
const uiIndex = readJson<{
	schema_version: string;
	query_aliases: Record<string, string>;
	checker_entries: Array<{ id: string; searchText: string; queryAliases: string[] }>;
	compare_entities: Array<{ id: string; searchText: string; queryAliases: string[] }>;
}>(path.join(STATIC_DATA, 'v9-ui-index.json'));
const siteStatus = readJson<{
	schema_version: string;
	structural_release: {
		version: string;
		status: string;
		release_manifest: string;
		taxonomy: string;
		headline_construct: string;
		headline_source: string;
		counts: V9PublicRelease['counts'];
	};
	role_query_layer: {
		status: string;
		artifact: string;
		count: number;
		exact_title_match_count: number;
		reviewed_alias_match_count: number;
		official_match_count: number;
		non_official_count: number;
		estimated_count: number;
		withheld_count: number;
		headline_effect: string;
	};
	external_comparisons: {
		status: string;
		headline_effect: string;
		reason_code: string;
		coverage: Record<string, { published: number; total: number }>;
	};
	live_monitor: {
		market_context_artifact: string;
		market_context_generated_at: string;
		named_demand: {
			occupation_count: number;
			reviewed_source_label_count: number;
			withheld_generic_label_count: number;
		};
		postings: {
			status: string;
			public_demand_input: boolean;
			observed_through: string | null;
		};
		quarterly_comparison: {
			status: string;
			current_snapshot: null;
			previous_snapshot: null;
		};
		research_review_cutoff: string;
		research_record_count: number;
	};
	archives: {
		status: string;
		releases_artifact: string;
		release_history_page: string;
		reports_index: string;
	};
}>(path.join(STATIC_DATA, 'site-status.json'));
const releases = readJson<
	Array<{
		id: string;
		type: string;
		version_label: string | null;
		score_version: string;
		published_at: string | null;
		display_date: string;
		availability: string;
		status: string;
		archive: boolean;
	}>
>(path.join(STATIC_DATA, 'releases.json'));
const researchLibrary = readJson<{
	version: string;
	generated_at: string;
	review_cutoff: string;
	entry_count: number;
}>(path.join(STATIC_DATA, 'research-library.json'));
const manifest = readJson<{
	version: string;
	schema_version: string;
	generated_at: string;
	taxonomy: string;
	counts: V9PublicRelease['counts'];
	artifacts: Array<{ file: string; public_path: string; sha256: string; generated_at: string }>;
}>(path.join(STATIC_DATA, 'release-manifest-v9.json'));
const csv = readText(path.join(STATIC_DATA, 'sg-ai-occupations-v9.csv'));
const llms = readText(path.join(STATIC, 'llms.txt'));
const llmsFull = readText(path.join(STATIC, 'llms-full.txt'));
const sitemap = readText(path.join(STATIC, 'sitemap.xml'));
const robots = readText(path.join(STATIC, 'robots.txt'));
const redirects = readText(path.join(STATIC, '_redirects'));
const headers = readText(path.join(STATIC, '_headers'));

assert.equal(core.schema_version, '9.0');
assert.equal(publicRelease.schema_version, '9.0');
assert.equal(publicRelease.public_contract.current, true);
assert.equal(publicRelease.public_contract.taxonomy, 'SSOC 2024');
assert.equal(publicRelease.public_contract.headline, 'AI Work Pressure Rank');
assert.deepEqual(publicRelease.counts, {
	occupations: 1001,
	scored: 987,
	insufficient_evidence: 14,
	direct_wages: 523
});
assert.deepEqual(publicRelease.counts, core.counts);
assert.equal(publicRelease.occupations.length, 1001);
assert.equal(
	new Set(publicRelease.occupations.map(occupation => occupation.taxonomy.code)).size,
	1001,
	'V9 public export has duplicate occupation codes'
);

const coreByCode = new Map(
	core.occupations.map(occupation => [occupation.taxonomy.code, occupation])
);
let scored = 0;
let directWages = 0;
for (const occupation of publicRelease.occupations) {
	assert.match(occupation.taxonomy.code, /^\d{5}$/);
	assert.equal(occupation.taxonomy.edition, '2024');
	const canonical = coreByCode.get(occupation.taxonomy.code);
	assert(canonical, `${occupation.taxonomy.code}: missing from canonical V9 data`);
	assert.deepEqual(occupation.genai_task_exposure, canonical.genai_task_exposure);
	assert.deepEqual(occupation.singapore_market.wages, canonical.singapore_market.wages);
	assert.deepEqual(
		occupation.market_evidence.demand_signals,
		market.demand_by_code[occupation.taxonomy.code] ?? []
	);
	if (occupation.singapore_market.wages) directWages += 1;
	const exposure = occupation.genai_task_exposure;
	if (!exposure) {
		assert.equal(occupation.score_status, 'insufficient_evidence');
		continue;
	}
	scored += 1;
	assert.equal(occupation.score_status, 'scored');
	assert.equal(exposure.source, 'ilo_genai_2025');
	assert.equal(exposure.pressure_rank.method, 'midrank_percentile');
	assert.equal(exposure.pressure_rank.population_size, 987);
	assert(exposure.pressure_rank.percentile >= 0 && exposure.pressure_rank.percentile <= 100);
	assert(exposure.mean_score_2025.min <= exposure.mean_score_2025.median);
	assert(exposure.mean_score_2025.median <= exposure.mean_score_2025.max);
	assert(exposure.task_score_sd_2025.min <= exposure.task_score_sd_2025.median);
	assert(exposure.task_score_sd_2025.median <= exposure.task_score_sd_2025.max);
}
assert.equal(scored, 987);
assert.equal(directWages, 523);

const forbiddenCurrentFields = [
	'net_risk',
	'risk_band',
	'ai_exposure_rank',
	'jobs_affected',
	'wage_pool',
	'substitution_score',
	'augmentation_score',
	'likely_pathway',
	'employment_estimate',
	'transition_adjusted_risk',
	'realized_risk_proxy'
];
const publicKeys = collectKeys(publicRelease);
for (const field of forbiddenCurrentFields) {
	assert(!publicKeys.has(field), `current V9 JSON contains retired field ${field}`);
}

const csvLines = csv.trimEnd().split('\n');
const csvHeader = csvLines[0] ?? '';
assert.equal(csvLines.length, 1002, 'V9 CSV must contain one header plus 1,001 occupations');
for (const required of [
	'ssoc_2024',
	'ai_work_pressure_percentile',
	'ilo_potential25_categories',
	'ilo_task_score_sd_2025_median',
	'gross_monthly_median_sgd',
	'direct_demand_signal_count',
	'evidence_support'
]) {
	assert(csvHeader.split(',').includes(required), `V9 CSV missing ${required}`);
}
for (const field of forbiddenCurrentFields) {
	assert(!csvHeader.split(',').includes(field), `current V9 CSV contains retired field ${field}`);
}

assert.equal(market.schema_version, '9.0');
assert.equal(market.taxonomy, 'SSOC 2024');
assert.match(market.rules.demand, /No code-prefix/);
assert.match(market.rules.headline_separation, /No market field changes AI Work Pressure Rank/);
assert.equal(market.national.labour_market_q2_2026_advance.status, 'preliminary');
assert.equal(market.national.postings_monitor.public_demand_input, false);
assert.equal(market.national.postings_monitor.status, 'withheld_stale_convenience_sample');

assert.equal(roleRelease.schema_version, '9.0');
assert.equal(roleRelease.taxonomy, 'SSOC 2024');
assert.equal(roleRelease.counts.roles, 88);
assert.equal(roleRelease.counts.exact_title_matches, 11);
assert.equal(roleRelease.counts.reviewed_alias_matches, 56);
assert.equal(roleRelease.counts.official_query_matches, 67);
assert.equal(roleRelease.counts.non_official_roles, 21);
assert.equal(roleRelease.counts.component_references, 56);
assert.equal(roleRelease.counts.composite_roles, 18);
assert.equal(roleRelease.counts.mapping_withheld, 3);
assert.equal(roleRelease.roles.length, 88);
for (const role of roleRelease.roles) {
	assert(
		role.official_status === 'non_official_role_query' ||
			role.official_status === 'official_occupation_match'
	);
	if (role.official_status === 'official_occupation_match') {
		assert(role.official_occupation);
		assert(coreByCode.has(role.official_occupation.ssoc2024));
		assert.equal(role.components.length, 0);
		continue;
	}
	for (const component of role.components) {
		assert(
			coreByCode.has(component.ssoc2024),
			`${role.slug}: unknown SSOC 2024 component ${component.ssoc2024}`
		);
	}
}
for (const field of forbiddenCurrentFields) {
	assert(
		!collectKeys(roleRelease).has(field),
		`current V9 role JSON contains retired field ${field}`
	);
}
assert.equal(searchIndex.schema_version, '9.0');
assert.equal(searchIndex.occupations.length, 1001);
assert.equal(searchIndex.roles.length, roleRelease.counts.non_official_roles);
assert.equal(searchIndex.official_role_aliases.length, roleRelease.counts.official_query_matches);
assert.equal(searchIndex.role_queries.length, roleRelease.counts.roles);
assert.deepEqual(searchIndex.role_query_counts, {
	all: roleRelease.counts.roles,
	exact_official_titles: roleRelease.counts.exact_title_matches,
	reviewed_official_matches: roleRelease.counts.reviewed_alias_matches,
	composite_estimates: roleRelease.counts.composite_roles,
	mapping_withheld: roleRelease.counts.mapping_withheld
});
assert.equal(
	new Set(searchIndex.role_queries.map(role => role.slug)).size,
	roleRelease.counts.roles
);
for (const query of searchIndex.role_queries) {
	const source = roleRelease.roles.find(role => role.slug === query.slug);
	assert(source, `search role query has no release source: ${query.slug}`);
	assert(query.family_key.length > 0, `${query.slug}: missing family presentation`);
	if (source.resolution_basis === 'normalized_exact_title') {
		assert.equal(query.journey_kind, 'exact_official_title');
		assert.equal(query.href, `/occupation/${source.official_occupation?.ssoc2024}`);
	} else {
		assert.equal(query.href, `/role/${source.slug}`);
	}
	if (source.official_occupation) {
		assert.equal(query.pressure_kind, 'official');
		assert.equal(query.pressure_rank, source.official_occupation.pressure_rank);
	}
}
assert.deepEqual(
	new Set(searchIndex.occupations.map(occupation => occupation.code)),
	new Set(publicRelease.occupations.map(occupation => occupation.taxonomy.code))
);
assert.equal(uiIndex.schema_version, '9.0');
assert.equal(
	uiIndex.checker_entries.length,
	publicRelease.counts.occupations + roleRelease.counts.non_official_roles
);
assert.equal(uiIndex.compare_entities.length, uiIndex.checker_entries.length);
assert.equal(Object.keys(uiIndex.query_aliases).length, roleRelease.counts.official_query_matches);
assert.equal(uiIndex.query_aliases['role:ai-engineer'], 'occupation:25143');
assert.equal(
	new Set(uiIndex.checker_entries.map(entry => entry.id)).size,
	uiIndex.checker_entries.length
);
assert.equal(
	uiIndex.checker_entries.some(entry => entry.id === 'role:ai-engineer'),
	false
);
const aiEngineerOccupation = uiIndex.checker_entries.find(entry => entry.id === 'occupation:25143');
assert(aiEngineerOccupation);
assert(aiEngineerOccupation.searchText.includes('ai engineer'));
assert(aiEngineerOccupation.queryAliases.includes('AI Engineer'));
assert.equal(
	uiIndex.checker_entries.reduce((sum, entry) => sum + entry.queryAliases.length, 0),
	roleRelease.counts.official_query_matches
);
for (const field of forbiddenCurrentFields) {
	assert(!collectKeys(uiIndex).has(field), `current V9 UI index contains retired field ${field}`);
}
assert.deepEqual(
	new Set(searchIndex.roles.map(role => role.slug)),
	new Set(
		roleRelease.roles
			.filter(role => role.official_status === 'non_official_role_query')
			.map(role => role.slug)
	)
);
assert.deepEqual(
	new Map(searchIndex.official_role_aliases.map(alias => [alias.slug, alias.official_ssoc2024])),
	new Map(
		roleRelease.roles
			.filter(role => role.official_status === 'official_occupation_match')
			.map(role => [role.slug, role.official_occupation?.ssoc2024])
	)
);

assert.equal(siteStatus.structural_release.version, 'V9');
assert.equal(siteStatus.schema_version, '9.0');
assert.equal(siteStatus.structural_release.status, 'current');
assert.equal(siteStatus.structural_release.release_manifest, 'release-manifest-v9.json');
assert.equal(siteStatus.structural_release.taxonomy, 'SSOC 2024');
assert.equal(siteStatus.structural_release.headline_construct, 'AI Work Pressure Rank');
assert.equal(siteStatus.structural_release.headline_source, 'ILO 2025 mean_score_2025');
assert.deepEqual(siteStatus.structural_release.counts, publicRelease.counts);
assert.deepEqual(Object.keys(siteStatus).sort(), [
	'archives',
	'external_comparisons',
	'homepage_banner',
	'live_monitor',
	'role_query_layer',
	'schema_version',
	'structural_release',
	'updated_at'
]);
assert.equal(
	siteStatus.role_query_layer.status,
	'official_resolutions_composites_and_withheld_queries'
);
assert.equal(siteStatus.role_query_layer.artifact, 'synthetic-roles-v9.json');
assert.equal(siteStatus.role_query_layer.count, roleRelease.counts.roles);
assert.equal(
	siteStatus.role_query_layer.official_match_count,
	roleRelease.counts.official_query_matches
);
assert.equal(
	siteStatus.role_query_layer.exact_title_match_count,
	roleRelease.counts.exact_title_matches
);
assert.equal(
	siteStatus.role_query_layer.reviewed_alias_match_count,
	roleRelease.counts.reviewed_alias_matches
);
assert.equal(siteStatus.role_query_layer.non_official_count, roleRelease.counts.non_official_roles);
assert.equal(siteStatus.role_query_layer.estimated_count, roleRelease.counts.composite_roles);
assert.equal(siteStatus.role_query_layer.withheld_count, roleRelease.counts.mapping_withheld);
assert.equal(siteStatus.role_query_layer.headline_effect, 'none');
assert.equal(siteStatus.external_comparisons.status, 'withheld');
assert.equal(siteStatus.external_comparisons.headline_effect, 'none');
assert.equal(
	siteStatus.external_comparisons.reason_code,
	'missing_verified_isco08_to_soc_provenance_or_construct_replication'
);
assert.deepEqual(Object.keys(siteStatus.external_comparisons.coverage).sort(), [
	'aioe',
	'eloundou',
	'observed_ai_use',
	'potential_complementarity'
]);
assert(
	Object.values(siteStatus.external_comparisons.coverage).every(
		coverage => coverage.published === 0 && coverage.total === publicRelease.counts.occupations
	)
);
assert.equal(siteStatus.live_monitor.market_context_artifact, 'v9-market-context.json');
assert.equal(siteStatus.live_monitor.market_context_generated_at, core.generated_at);
const demandEvidence = Object.values(market.demand_by_code).flat() as Array<{
	source_key: string;
	source_occupation: string;
}>;
const reviewedDemandLabels = new Set(
	demandEvidence.map(item => `${item.source_key}\u0000${item.source_occupation}`)
);
assert.equal(
	siteStatus.live_monitor.named_demand.occupation_count,
	Object.keys(market.demand_by_code).length
);
assert.equal(
	siteStatus.live_monitor.named_demand.reviewed_source_label_count,
	reviewedDemandLabels.size
);
assert.equal(
	siteStatus.live_monitor.named_demand.withheld_generic_label_count,
	market.withheld_demand_mappings.length
);
assert.equal(siteStatus.live_monitor.postings.public_demand_input, false);
assert.equal(siteStatus.live_monitor.postings.status, market.national.postings_monitor.status);
assert.equal(
	siteStatus.live_monitor.postings.observed_through,
	market.national.postings_monitor.observed_through
);
assert.equal(
	siteStatus.live_monitor.quarterly_comparison.status,
	'withheld_until_two_comparable_v9_snapshots'
);
assert.equal(siteStatus.live_monitor.quarterly_comparison.current_snapshot, null);
assert.equal(siteStatus.live_monitor.quarterly_comparison.previous_snapshot, null);
assert.equal(siteStatus.live_monitor.research_review_cutoff, researchLibrary.review_cutoff);
assert.equal(siteStatus.live_monitor.research_record_count, researchLibrary.entry_count);
assert.equal(researchLibrary.generated_at, researchLibrary.review_cutoff);
assert.equal(siteStatus.archives.status, 'dated_historical_records_not_current_v9');
assert.equal(siteStatus.archives.releases_artifact, 'releases.json');
assert.equal(siteStatus.archives.release_history_page, '/changelog');
assert.equal(siteStatus.archives.reports_index, '/reports');

const forbiddenCurrentStatusFields = [
	'experimental_release',
	'v5_program',
	'labour_monitor_validation_vintage',
	'postings_volume_30d',
	'employer_pressure_generated_at',
	'cluster_validation_checks_passed',
	'temporal_validation_vacancy_accuracy',
	'calibration_direct_rho',
	'sensitivity_spearman_p50',
	'imf_top_half_exposed_share_pct',
	'forecast_horizon_status',
	'confidence_rating_high_count',
	'scenario_family_count',
	'adoption_diffusion_headcount_reduction_pct',
	'age_structure_high_attrition_absorber_count',
	'occupation_family_validation_rho',
	'offset_potential_high_count'
];
const siteStatusKeys = collectKeys(siteStatus);
for (const field of forbiddenCurrentStatusFields) {
	assert(!siteStatusKeys.has(field), `current site-status contains archived field ${field}`);
}

const currentReleaseEntries = releases.filter(release => release.score_version === 'V9');
const archivedReleaseEntries = releases.filter(release => release.score_version !== 'V9');
assert(currentReleaseEntries.some(release => release.id === 'public-v9-2026-08-19'));
assert(currentReleaseEntries.every(release => release.archive === false));
assert(archivedReleaseEntries.length >= 10);
assert(archivedReleaseEntries.every(release => release.archive === true));
assert(archivedReleaseEntries.every(release => release.status === 'archive'));
assert(
	archivedReleaseEntries.every(
		release =>
			release.availability !== 'current_download' && release.availability !== 'current_source'
	)
);
assert(releases.every(release => Boolean(release.display_date || release.published_at)));
assert.equal(
	readText(path.join(STATIC_DATA, 'site-status.json')),
	readText(path.join(ROOT, 'src', 'lib', 'data', 'site-status.json')),
	'source and public site-status copies differ'
);
assert.equal(
	readText(path.join(STATIC_DATA, 'releases.json')),
	readText(path.join(ROOT, 'src', 'lib', 'data', 'releases.json')),
	'source and public releases copies differ'
);

assert.equal(manifest.version, 'V9');
assert.equal(manifest.schema_version, '9.0');
assert.equal(manifest.taxonomy, 'SSOC 2024');
assert.deepEqual(manifest.counts, publicRelease.counts);
assert.equal(
	readText(path.join(STATIC_DATA, 'release-manifest-v9.json')),
	readText(path.join(ROOT, 'src', 'lib', 'data', 'release-manifest.json')),
	'source and public release-manifest copies differ'
);
for (const artifact of manifest.artifacts) {
	const file = path.join(STATIC, artifact.public_path.replace(/^\//, ''));
	assert(fs.existsSync(file), `manifest artifact missing: ${artifact.public_path}`);
	assert.equal(artifact.sha256, sha256(file), `${artifact.file}: manifest hash drift`);
	assert.equal(
		artifact.generated_at,
		manifest.generated_at,
		`${artifact.file}: nondeterministic artifact timestamp`
	);
}
assert(!manifest.artifacts.some(artifact => /v[3-8]\b/i.test(artifact.file)));
assert(manifest.artifacts.some(artifact => artifact.file === 'synthetic-roles-v9.json'));
assert(manifest.artifacts.some(artifact => artifact.file === 'v9-search-index.json'));
assert(manifest.artifacts.some(artifact => artifact.file === 'releases.json'));
assert(fs.existsSync(path.join(STATIC_DATA, 'sg-ai-occupations-v8.json')));
assert.equal(fs.existsSync(path.join(STATIC_DATA, 'global', 'occupations.json')), false);
assert.equal(fs.existsSync(path.join(STATIC_DATA, 'sg-ai-occupations-2024.csv')), false);

const currentMachineArtifacts = new Set([
	'/data/release-manifest-v9.json',
	'/data/releases.json',
	'/data/research-library.json',
	'/data/sg-ai-occupations-v9.csv',
	'/data/sg-ai-occupations-v9.json',
	'/data/site-status.json',
	'/data/synthetic-roles-v9.json',
	'/data/v9-market-context.json',
	'/data/v9-search-index.json',
	'/data/v9-ui-index.json'
]);
const archiveHeaderPatterns = noindexPatterns(headers);
for (const file of listFiles(STATIC_DATA)) {
	const publicPath = `/${path.relative(STATIC, file).split(path.sep).join('/')}`;
	const isNoindex = archiveHeaderPatterns.some(pattern =>
		pathMatchesHeaderPattern(publicPath, pattern)
	);
	if (currentMachineArtifacts.has(publicPath)) {
		assert.equal(isNoindex, false, `${publicPath}: current V9 artifact is marked noindex`);
	} else {
		assert.equal(isNoindex, true, `${publicPath}: superseded artifact lacks noindex header`);
	}
}

for (const contents of [llms, llmsFull]) {
	assert(contents.includes('V9'));
	assert(contents.includes('SSOC 2024'));
	assert(contents.includes('AI Work Pressure Rank'));
	assert(!contents.includes('likely_pathway'));
	assert(!contents.includes('augmentation_score'));
	assert(!contents.includes('substitution_score'));
}
assert(llms.includes('/data/sg-ai-occupations-v9.json'));
assert(llmsFull.includes('Official occupations without a pressure rank'));
for (const role of roleRelease.roles) {
	const expectedUrl =
		role.official_status === 'official_occupation_match'
			? `${SITE_URL}/occupation/${role.official_occupation?.ssoc2024}`
			: `${SITE_URL}/role/${role.slug}`;
	assert(llmsFull.includes(expectedUrl), `llms-full missing role query ${role.slug}`);
}

const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!);
const sitemapSet = new Set(sitemapLocs);
assert.equal(sitemapLocs.length, sitemapSet.size, 'sitemap contains duplicate URLs');
assert(sitemapLocs.every(url => url.startsWith(`${SITE_URL}/`)));
for (const occupation of publicRelease.occupations) {
	assert(
		sitemapSet.has(`${SITE_URL}/occupation/${occupation.taxonomy.code}`),
		`sitemap missing occupation ${occupation.taxonomy.code}`
	);
}
for (const role of roleRelease.roles) {
	if (role.resolution_basis === 'normalized_exact_title') {
		assert(
			!sitemapSet.has(`${SITE_URL}/role/${role.slug}`),
			`sitemap includes duplicate official title ${role.slug}`
		);
		assert(
			redirects.includes(
				`/role/${role.slug} /occupation/${role.official_occupation?.ssoc2024} 308`
			),
			`redirects missing duplicate official title ${role.slug}`
		);
	} else {
		assert(
			sitemapSet.has(`${SITE_URL}/role/${role.slug}`),
			`sitemap missing title guide ${role.slug}`
		);
		assert(
			!redirects.split('\n').some(line => line.startsWith(`/role/${role.slug} `)),
			`title guide is incorrectly redirected: ${role.slug}`
		);
	}
}
assert(redirects.includes('/calculator /will-ai-take-my-job 308'));
for (const route of [
	'/rankings',
	'/rankings/highest-risk',
	'/rankings/high-exposure-in-demand',
	'/reports',
	'/reports/job-market-evidence',
	'/will-ai-take-my-job',
	'/compare',
	'/roles',
	'/groups'
]) {
	assert(sitemapSet.has(`${SITE_URL}${route}`), `sitemap missing retained surface ${route}`);
}
for (const excluded of [
	'/reports/q4-2024',
	'/reports/v4-3-shadow',
	'/reports/v5-experimental',
	'/reports/v5-roadmap',
	'/reports/v6-release',
	'/reports/v7-release',
	'/rankings/quarterly-movers',
	'/rankings/best-transitions',
	'/rankings/high-risk-few-exits',
	'/rankings/high-risk-in-demand',
	'/reports/wage-exposure',
	'/watchlist',
	'/calculator'
]) {
	assert(!sitemapSet.has(`${SITE_URL}${excluded}`), `sitemap includes excluded page ${excluded}`);
}
assert(!sitemapLocs.some(url => /\/(?:sg|us|global)\/occupation\//.test(url)));
assert(!sitemapLocs.some(url => url.includes('?')));
assert(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));

for (const protectedRoute of [
	'/rankings',
	'/reports',
	'/will-ai-take-my-job',
	'/compare',
	'/roles',
	'/groups'
]) {
	assert(
		!redirects.split('\n').some(line => line.trim().startsWith(`${protectedRoute} `)),
		`retained surface is redirected: ${protectedRoute}`
	);
}

assert.equal(countryConfigs.sg.classificationSystem, 'SSOC 2024');
assert.equal(countryConfigs.sg.status, 'live');
assert.equal(countryConfigs.us.status, 'preview');
assert.equal(countryConfigs.global.status, 'research');

console.log(
	`release-check: V9 ok (${publicRelease.counts.occupations} occupations, ${roleRelease.counts.roles - roleRelease.counts.exact_title_matches} modern-title guides, ${sitemapLocs.length} sitemap URLs)`
);
