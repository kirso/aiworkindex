#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';
import {
	getRoleFamilyPresentation,
	getRoleHref,
	getRoleJourneyKind
} from '../src/lib/data/role-presentation';

const ROOT = path.join(import.meta.dir, '..');

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

const occupations = readJson<{
	occupations: Array<{
		taxonomy: {
			code: string;
			title: string;
			search_synonyms: string[];
			hierarchy: { major_group: { code: string; title: string } };
		};
		genai_task_exposure: {
			pressure_rank: { percentile: number; midrank_position: number; population_size: number };
			potential25: { least_exposed: string; most_exposed: string; categories: string[] };
			mean_score_2025: { min: number; max: number };
			task_score_sd_2025: { median: number };
			official_isco08_codes: string[];
		} | null;
		singapore_market: {
			wages: { value: { gross_monthly_sgd: { median: number } } } | null;
		};
		evidence: { mapping_quality: string };
	}>;
}>(path.join(ROOT, 'data', 'occupations-v9.json'));

const market = readJson<{ demand_by_code: Record<string, unknown[]> }>(
	path.join(ROOT, 'data', 'v9-market-context.json')
);

const roles = readJson<{
	roles: Array<{
		slug: string;
		title: string;
		description: string;
		tags: string[];
		resolution_basis: string;
		estimate: { estimated_comparison_percentile: number } | null;
		official_status: 'official_occupation_match' | 'non_official_role_query';
		official_occupation: { ssoc2024: string; pressure_rank: number | null } | null;
	}>;
}>(path.join(ROOT, 'data', 'synthetic-roles-v9.json'));

const roleQueries = roles.roles.map(role => {
	const family = getRoleFamilyPresentation(role.slug);
	const journeyKind = getRoleJourneyKind(role);
	return {
		slug: role.slug,
		title: role.title,
		description: role.description,
		tags: role.tags,
		resolution_basis: role.resolution_basis,
		journey_kind: journeyKind,
		official_ssoc2024: role.official_occupation?.ssoc2024 ?? null,
		pressure_rank:
			role.official_occupation?.pressure_rank ??
			role.estimate?.estimated_comparison_percentile ??
			null,
		pressure_kind:
			journeyKind === 'exact_official_title' || journeyKind === 'reviewed_official_match'
				? 'official'
				: journeyKind === 'composite_estimate'
					? 'estimated'
					: 'withheld',
		href: getRoleHref(role),
		family_key: family.key,
		family_label: family.label,
		family_accent: family.accent,
		family_surface: family.surface
	};
});

const output = {
	schema_version: '9.0',
	generated_at: '2026-08-19',
	occupations: occupations.occupations.map(occupation => ({
		code: occupation.taxonomy.code,
		title: occupation.taxonomy.title,
		synonyms: occupation.taxonomy.search_synonyms,
		pressure_rank: occupation.genai_task_exposure?.pressure_rank.percentile ?? null,
		official_category: occupation.genai_task_exposure
			? occupation.genai_task_exposure.potential25.least_exposed ===
				occupation.genai_task_exposure.potential25.most_exposed
				? occupation.genai_task_exposure.potential25.least_exposed
				: `${occupation.genai_task_exposure.potential25.least_exposed} to ${occupation.genai_task_exposure.potential25.most_exposed}`
			: 'Not ranked'
	})),
	browser_occupations: occupations.occupations.map(occupation => {
		const exposure = occupation.genai_task_exposure;
		return {
			code: occupation.taxonomy.code,
			title: occupation.taxonomy.title,
			majorGroupCode: occupation.taxonomy.hierarchy.major_group.code,
			majorGroupTitle: occupation.taxonomy.hierarchy.major_group.title,
			pressureRank: exposure?.pressure_rank.percentile ?? null,
			pressurePosition: exposure?.pressure_rank.midrank_position ?? null,
			pressurePopulation: exposure?.pressure_rank.population_size ?? null,
			officialCategory: exposure
				? exposure.potential25.least_exposed === exposure.potential25.most_exposed
					? exposure.potential25.least_exposed
					: `${exposure.potential25.least_exposed} to ${exposure.potential25.most_exposed}`
				: 'Not ranked',
			officialCategories: exposure?.potential25.categories ?? [],
			mostExposedCategory: exposure?.potential25.most_exposed ?? null,
			wageMedian: occupation.singapore_market.wages?.value.gross_monthly_sgd.median ?? null,
			demandSignalCount: market.demand_by_code[occupation.taxonomy.code]?.length ?? 0,
			taskDispersion: exposure?.task_score_sd_2025.median ?? null,
			mappingQuality: occupation.evidence.mapping_quality,
			mappedScoreRangeWidth: exposure
				? exposure.mean_score_2025.max - exposure.mean_score_2025.min
				: null,
			mappedIscoCount: exposure?.official_isco08_codes.length ?? 0,
			searchSynonyms: []
		};
	}),
	roles: roles.roles
		.filter(role => role.official_status === 'non_official_role_query')
		.map(role => ({
			slug: role.slug,
			title: role.title,
			description: role.description,
			tags: role.tags,
			estimated_pressure_percentile: role.estimate?.estimated_comparison_percentile ?? null
		})),
	role_queries: roleQueries,
	role_query_counts: {
		all: roleQueries.length,
		exact_official_titles: roleQueries.filter(role => role.journey_kind === 'exact_official_title')
			.length,
		reviewed_official_matches: roleQueries.filter(
			role => role.journey_kind === 'reviewed_official_match'
		).length,
		composite_estimates: roleQueries.filter(role => role.journey_kind === 'composite_estimate')
			.length,
		mapping_withheld: roleQueries.filter(role => role.journey_kind === 'mapping_withheld').length
	},
	official_role_aliases: roles.roles
		.filter(
			(role): role is typeof role & { official_occupation: { ssoc2024: string } } =>
				role.official_status === 'official_occupation_match' && role.official_occupation !== null
		)
		.map(role => ({
			slug: role.slug,
			title: role.title,
			official_ssoc2024: role.official_occupation.ssoc2024,
			resolution_basis: role.resolution_basis,
			href: getRoleHref(role)
		}))
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
for (const file of [
	path.join(ROOT, 'data', 'v9-search-index.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-search-index.json'),
	path.join(ROOT, 'static', 'data', 'v9-search-index.json')
]) {
	fs.writeFileSync(file, serialized);
}

console.log(
	`V9 search: ${output.occupations.length} occupations, ${output.role_queries.length} modern-title journeys (${output.role_query_counts.reviewed_official_matches} familiar-title guides, ${output.role_query_counts.composite_estimates} composites, ${output.role_query_counts.mapping_withheld} withheld)`
);
