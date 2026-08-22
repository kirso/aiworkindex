#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syntheticRoles } from '../src/lib/data/synthetic-roles';
import type { V9IloExposureCategory, V9Occupation } from '../src/lib/data/v9-contract';
import { reviewedV9RoleMappings } from './v9-role-mappings';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_FILE = path.join(ROOT, 'data', 'occupations-v9.json');
const MARKET_FILE = path.join(ROOT, 'data', 'v9-market-context.json');

const categoryOrder: V9IloExposureCategory[] = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
];

function normalizeTitle(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function round(value: number, decimals: number): number {
	const multiplier = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function weighted(values: Array<{ value: number; weight: number }>): number {
	return values.reduce((sum, item) => sum + item.value * item.weight, 0);
}

function comparisonPercentile(value: number, officialValues: number[]): number {
	const less = officialValues.filter(item => item < value).length;
	const equal = officialValues.filter(item => item === value).length;
	if (officialValues.length <= 1) return 50;
	const zeroBasedPosition =
		equal > 0
			? less + (equal - 1) / 2
			: less === 0
				? 0
				: less === officialValues.length
					? officialValues.length - 1
					: less - 0.5;
	return round((zeroBasedPosition / (officialValues.length - 1)) * 100, 1);
}

function officialOccupationView(occupation: V9Occupation, demandByCode: Record<string, unknown[]>) {
	const exposure = occupation.genai_task_exposure;
	const code = occupation.taxonomy.code;
	return {
		ssoc2024: code,
		title: occupation.taxonomy.title,
		score_status: occupation.score_status,
		mean_score_2025: exposure?.mean_score_2025 ?? null,
		potential25: exposure?.potential25 ?? null,
		pressure_rank: exposure?.pressure_rank.percentile ?? null,
		wage_evidence: occupation.singapore_market.wages ?? null,
		demand_signals: demandByCode[code] ?? []
	};
}

function main() {
	const release = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf8')) as {
		occupations: V9Occupation[];
	};
	const market = JSON.parse(fs.readFileSync(MARKET_FILE, 'utf8')) as {
		demand_by_code: Record<string, unknown[]>;
	};
	const occupationsByCode = new Map(release.occupations.map(item => [item.taxonomy.code, item]));
	const occupationsByNormalizedTitle = new Map<string, V9Occupation[]>();
	for (const occupation of release.occupations) {
		const key = normalizeTitle(occupation.taxonomy.title);
		const matches = occupationsByNormalizedTitle.get(key) ?? [];
		matches.push(occupation);
		occupationsByNormalizedTitle.set(key, matches);
	}
	const officialValues = release.occupations.flatMap(item =>
		item.genai_task_exposure ? [item.genai_task_exposure.mean_score_2025.median] : []
	);
	const reviewedSlugs = new Set(Object.keys(reviewedV9RoleMappings));
	const nonExactSlugs = new Set<string>();

	const roles = syntheticRoles.map(role => {
		const exactOfficialMatches = occupationsByNormalizedTitle.get(normalizeTitle(role.title)) ?? [];
		if (exactOfficialMatches.length > 1) {
			throw new Error(`${role.slug}: ambiguous normalized SSOC 2024 title match`);
		}
		const exactOfficialMatch = exactOfficialMatches[0];
		if (exactOfficialMatch) {
			if (reviewedSlugs.has(role.slug)) {
				throw new Error(
					`${role.slug}: exact title match must not also have a reviewed disposition`
				);
			}
			return {
				schema_version: '9.0',
				kind: 'role_query',
				official_status: 'official_occupation_match',
				resolution_basis: 'normalized_exact_title',
				mapping_rationale: `Normalized exact title match to SSOC 2024 occupation ${exactOfficialMatch.taxonomy.code}.`,
				disclosure: `This title duplicates official SSOC 2024 occupation ${exactOfficialMatch.taxonomy.code}. Its role URL canonicalizes to the official occupation; no second page or score is published.`,
				slug: role.slug,
				title: role.title,
				description: role.description,
				tags: role.tags,
				estimate_status: 'official_occupation_match',
				estimate: null,
				official_occupation: officialOccupationView(exactOfficialMatch, market.demand_by_code),
				components: [],
				limitations: [
					'This query label resolves to an official SSOC 2024 occupation rather than an editorial composite.',
					'The official AI Work Pressure Rank is a relative task-exposure measure, not a job-loss probability.',
					'Missing wage or demand evidence remains unknown.'
				]
			};
		}

		nonExactSlugs.add(role.slug);
		const disposition = reviewedV9RoleMappings[role.slug as keyof typeof reviewedV9RoleMappings];
		if (!disposition) throw new Error(`${role.slug}: missing reviewed V9 role disposition`);

		if (disposition.kind === 'official_alias') {
			const occupation = occupationsByCode.get(disposition.ssoc2024);
			if (!occupation) {
				throw new Error(`${role.slug}: reviewed alias ${disposition.ssoc2024} does not exist`);
			}
			if (occupation.taxonomy.title !== disposition.expectedTitle) {
				throw new Error(
					`${role.slug}: reviewed alias ${disposition.ssoc2024} expected "${disposition.expectedTitle}" but found "${occupation.taxonomy.title}"`
				);
			}
			return {
				schema_version: '9.0',
				kind: 'role_query',
				official_status: 'official_occupation_match',
				resolution_basis:
					disposition.basis === 'official_synonym'
						? 'reviewed_official_synonym'
						: 'reviewed_definition_equivalent',
				mapping_rationale: disposition.rationale,
				disclosure: `This familiar-title guide uses a reviewed title, synonym or definition match to official SSOC 2024 occupation ${disposition.ssoc2024}. It reuses the official occupation score unchanged; no synthetic estimate is published.`,
				slug: role.slug,
				title: role.title,
				description: role.description,
				tags: role.tags,
				estimate_status: 'official_occupation_match',
				estimate: null,
				official_occupation: officialOccupationView(occupation, market.demand_by_code),
				components: [],
				limitations: [
					'The public query label is not itself an official SSOC title; the reviewed mapping resolves it to one official occupation.',
					'The official AI Work Pressure Rank is a relative task-exposure measure, not a job-loss probability.',
					'Missing exposure, wage or demand evidence remains unknown.'
				]
			};
		}

		if (disposition.kind === 'withheld') {
			return {
				schema_version: '9.0',
				kind: 'role_query',
				official_status: 'non_official_role_query',
				resolution_basis: 'mapping_withheld',
				mapping_rationale: disposition.reason,
				disclosure:
					'Non-official familiar-title guide. No score is published because this title needs a sector and task profile before it can be mapped without false precision.',
				slug: role.slug,
				title: role.title,
				description: role.description,
				tags: role.tags,
				estimate_status: 'mapping_withheld',
				estimate: null,
				official_occupation: null,
				components: [],
				limitations: [
					disposition.reason,
					'No broad occupation-group, title-similarity or legacy component fallback is used.',
					'No job-loss probability, role wage or role demand estimate is published.'
				]
			};
		}

		const componentCodes = disposition.components.map(component => component.ssoc2024);
		if (new Set(componentCodes).size !== componentCodes.length) {
			throw new Error(`${role.slug}: reviewed composite has duplicate SSOC 2024 components`);
		}
		const totalWeight = disposition.components.reduce(
			(sum, component) => sum + component.weight,
			0
		);
		if (Math.abs(totalWeight - 1) > 1e-9) {
			throw new Error(`${role.slug}: reviewed composite weights sum to ${totalWeight}`);
		}
		const components = disposition.components.map(component => {
			const occupation = occupationsByCode.get(component.ssoc2024);
			if (!occupation) {
				throw new Error(`${role.slug}: component ${component.ssoc2024} does not exist`);
			}
			if (!occupation.genai_task_exposure || occupation.score_status !== 'scored') {
				throw new Error(`${role.slug}: component ${component.ssoc2024} is not scored`);
			}
			return {
				ssoc2024: component.ssoc2024,
				title: occupation.taxonomy.title,
				weight: component.weight,
				rationale: component.rationale,
				migration_note: null,
				score_status: occupation.score_status,
				mean_score_2025: occupation.genai_task_exposure.mean_score_2025,
				potential25: occupation.genai_task_exposure.potential25,
				pressure_rank: occupation.genai_task_exposure.pressure_rank.percentile,
				wage_evidence: occupation.singapore_market.wages ?? null,
				demand_signals: market.demand_by_code[component.ssoc2024] ?? []
			};
		});

		const point = round(
			weighted(
				components.map(component => ({
					value: component.mean_score_2025.median,
					weight: component.weight
				}))
			),
			4
		);
		const lower = round(
			weighted(
				components.map(component => ({
					value: component.mean_score_2025.min,
					weight: component.weight
				}))
			),
			4
		);
		const upper = round(
			weighted(
				components.map(component => ({
					value: component.mean_score_2025.max,
					weight: component.weight
				}))
			),
			4
		);
		const equalWeight = 1 / components.length;
		const equalWeightPoint = round(
			components.reduce(
				(sum, component) => sum + component.mean_score_2025.median * equalWeight,
				0
			),
			4
		);
		const leaveOneOut = components.map((_, omittedIndex) => {
			const retained = components.filter((__, index) => index !== omittedIndex);
			const retainedWeight = retained.reduce((sum, component) => sum + component.weight, 0);
			return round(
				retained.reduce(
					(sum, component) =>
						sum + component.mean_score_2025.median * (component.weight / retainedWeight),
					0
				),
				4
			);
		});
		const categories = components.flatMap(component => component.potential25.categories);
		const sortedCategories = [...new Set(categories)].sort(
			(a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
		);
		const estimate = {
			mean_score_2025: point,
			mapping_range: { min: lower, max: upper },
			estimated_comparison_percentile: comparisonPercentile(point, officialValues),
			comparison_population: '987 scored official SSOC 2024 occupations',
			potential25_component_range: {
				least_exposed: sortedCategories[0]!,
				most_exposed: sortedCategories.at(-1)!,
				categories: sortedCategories
			},
			weighting_sensitivity: {
				editorial_weight_point: point,
				equal_weight_point: equalWeightPoint,
				leave_one_component_out_min: Math.min(...leaveOneOut),
				leave_one_component_out_max: Math.max(...leaveOneOut)
			}
		};

		return {
			schema_version: '9.0',
			kind: 'synthetic_role',
			official_status: 'non_official_role_query',
			resolution_basis: 'reviewed_composite',
			mapping_rationale: disposition.rationale,
			disclosure:
				'Synthetic, non-official role estimate built from a reviewed SSOC 2024 occupation composite. The components and weights are published assumptions.',
			slug: role.slug,
			title: role.title,
			description: role.description,
			tags: role.tags,
			estimate_status: 'estimated',
			estimate,
			official_occupation: null,
			components,
			limitations: [
				'This role query is not an official SSOC occupation.',
				'Component selection and weights are editorial assumptions and are published for review.',
				'The estimated comparison percentile is not an official occupation rank or a probability of job loss.',
				'Component wage and demand observations are not a role-level wage or demand estimate.'
			]
		};
	});

	if (roles.length !== 88) throw new Error(`expected 88 role queries, found ${roles.length}`);
	if (reviewedSlugs.size !== nonExactSlugs.size) {
		throw new Error(
			`reviewed mapping coverage mismatch: ${reviewedSlugs.size} dispositions for ${nonExactSlugs.size} non-exact queries`
		);
	}
	for (const slug of reviewedSlugs) {
		if (!nonExactSlugs.has(slug)) throw new Error(`${slug}: reviewed disposition is not used`);
	}

	const exactTitleMatches = roles.filter(
		role => role.resolution_basis === 'normalized_exact_title'
	);
	const reviewedAliasMatches = roles.filter(
		role =>
			role.resolution_basis.startsWith('reviewed_') &&
			role.official_status === 'official_occupation_match'
	);
	const officialQueryMatches = roles.filter(
		role => role.official_status === 'official_occupation_match'
	);
	const nonOfficialRoles = roles.filter(role => role.official_status === 'non_official_role_query');
	const compositeRoles = nonOfficialRoles.filter(role => role.estimate_status === 'estimated');
	const withheldRoles = nonOfficialRoles.filter(
		role => role.estimate_status === 'mapping_withheld'
	);
	const componentReferences = roles.reduce((sum, role) => sum + role.components.length, 0);
	if (exactTitleMatches.length !== 11) {
		throw new Error(`expected 11 exact title matches, found ${exactTitleMatches.length}`);
	}
	if (reviewedAliasMatches.length !== 56) {
		throw new Error(`expected 56 reviewed alias matches, found ${reviewedAliasMatches.length}`);
	}
	if (compositeRoles.length !== 18 || withheldRoles.length !== 3) {
		throw new Error(
			`expected 18 composites and 3 withheld queries, found ${compositeRoles.length} and ${withheldRoles.length}`
		);
	}

	const output = {
		schema_version: '9.0',
		generated_at: '2026-08-19',
		taxonomy: 'SSOC 2024',
		method: {
			exact_title_rule:
				'Normalized exact matches to current SSOC 2024 titles resolve to the official occupation; no competing composite is published.',
			reviewed_alias_rule:
				'An explicit reviewed title, synonym or definition match may resolve a query to one current SSOC 2024 occupation. Synonyms are not auto-resolved globally.',
			composite_rule:
				'Only task definitions that genuinely span occupations receive an editorial composite with unique, scored SSOC 2024 components and weights summing to one.',
			withheld_rule:
				'Cross-sector or unstable labels are withheld when a fixed mapping would create false precision.',
			point_estimate: 'Editorial component-weighted mean of ILO 2025 mean_score_2025 values.',
			assumption_sensitivity:
				'Official mapping range plus equal-weight and leave-one-component-out sensitivity checks.',
			comparison:
				'Midrank-compatible empirical location against scored official occupations, with midpoint interpolation between observed values; not an official rank.',
			forbidden_interpretations: [
				'job-loss probability',
				'official SSOC occupation for a composite or withheld query',
				'role wage estimate',
				'role demand estimate'
			]
		},
		counts: {
			roles: roles.length,
			exact_title_matches: exactTitleMatches.length,
			reviewed_alias_matches: reviewedAliasMatches.length,
			official_query_matches: officialQueryMatches.length,
			non_official_roles: nonOfficialRoles.length,
			composite_roles: compositeRoles.length,
			mapping_withheld: withheldRoles.length,
			component_references: componentReferences,
			unique_ssoc2024_components: new Set(
				roles.flatMap(role => role.components.map(component => component.ssoc2024))
			).size,
			estimated: compositeRoles.length,
			official_matches_ranked: officialQueryMatches.filter(
				role => role.official_occupation?.pressure_rank != null
			).length,
			official_matches_unranked: officialQueryMatches.filter(
				role => role.official_occupation?.pressure_rank == null
			).length
		},
		roles
	};
	const serialized = `${JSON.stringify(output, null, 2)}\n`;
	for (const file of [
		path.join(ROOT, 'data', 'synthetic-roles-v9.json'),
		path.join(ROOT, 'src', 'lib', 'data', 'synthetic-roles-v9.json'),
		path.join(ROOT, 'static', 'data', 'synthetic-roles-v9.json')
	]) {
		fs.writeFileSync(file, serialized);
	}
	console.log(
		`V9 roles: ${roles.length} queries, ${output.counts.official_query_matches} official resolutions, ${output.counts.composite_roles} composites, ${output.counts.mapping_withheld} withheld`
	);
}

main();
