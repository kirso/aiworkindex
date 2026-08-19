import { syntheticRolesV9 } from './synthetic-roles-v9';
import { toV9OccupationView } from './v9-display';
import { v9Counts, v9Occupations } from './v9';

const officialRoleAliasesByCode = new Map<string, string[]>();
for (const role of syntheticRolesV9) {
	if (role.official_status !== 'official_occupation_match' || !role.official_occupation) continue;
	const aliases = officialRoleAliasesByCode.get(role.official_occupation.ssoc2024) ?? [];
	aliases.push(role.title);
	officialRoleAliasesByCode.set(role.official_occupation.ssoc2024, aliases);
}

function officialRoleAliases(code: string): string[] {
	return [...(officialRoleAliasesByCode.get(code) ?? [])].sort((a, b) => a.localeCompare(b));
}

export function buildV9CheckerEntries() {
	const occupations = v9Occupations.map(occupation => {
		const view = toV9OccupationView(occupation);
		const queryAliases = officialRoleAliases(view.code);
		return {
			id: `occupation:${view.code}`,
			kind: 'occupation' as const,
			code: view.code,
			title: view.title,
			searchText: [view.title, view.code, ...occupation.taxonomy.search_synonyms, ...queryAliases]
				.join(' ')
				.toLowerCase(),
			queryAliases,
			href: `/occupation/${view.code}`,
			statusLabel: 'Official SSOC 2024 occupation',
			position: view.pressureRank,
			positionKind: 'Official AI Work Pressure Rank',
			comparisonPopulation: view.pressurePopulation,
			rawExposure: view.rawExposure,
			category: view.officialCategory,
			wage: view.wageMedian,
			demandSignals: view.demandSignals.map(signal => signal.label),
			labourContext: view.labourContext?.summary ?? null,
			mappingQuality: occupation.evidence.mapping_quality,
			componentCount: null
		};
	});

	const roles = syntheticRolesV9
		.filter(role => role.official_status === 'non_official_role_query')
		.map(role => ({
			id: `role:${role.slug}`,
			kind: 'role' as const,
			code: role.slug,
			title: role.title,
			searchText: [role.title, role.description, role.slug, ...role.tags].join(' ').toLowerCase(),
			queryAliases: [] as string[],
			href: `/role/${role.slug}`,
			statusLabel:
				role.estimate_status === 'estimated'
					? 'Non-official role estimate'
					: 'Non-official role query · estimate withheld',
			position: role.estimate?.estimated_comparison_percentile ?? null,
			positionKind: 'Estimated comparison percentile',
			comparisonPopulation: v9Counts.scored,
			rawExposure: role.estimate?.mean_score_2025 ?? null,
			category: role.estimate
				? role.estimate.potential25_component_range.least_exposed ===
					role.estimate.potential25_component_range.most_exposed
					? role.estimate.potential25_component_range.least_exposed
					: `${role.estimate.potential25_component_range.least_exposed} to ${role.estimate.potential25_component_range.most_exposed}`
				: 'Composite withheld',
			wage: null,
			demandSignals: role.components.flatMap(component =>
				component.demand_signals.map(signal => signal.label)
			),
			labourContext: null,
			mappingQuality: 'editorial_component_mix',
			componentCount: role.components.length
		}));

	return [...occupations, ...roles];
}

export function buildV9CompareEntities() {
	const occupations = v9Occupations.map(occupation => {
		const view = toV9OccupationView(occupation);
		const exposure = occupation.genai_task_exposure;
		const queryAliases = officialRoleAliases(view.code);
		return {
			id: `occupation:${view.code}`,
			kind: 'occupation' as const,
			code: view.code,
			title: view.title,
			description: occupation.taxonomy.detailed_definition,
			searchText: [view.title, view.code, ...occupation.taxonomy.search_synonyms, ...queryAliases]
				.join(' ')
				.toLowerCase(),
			queryAliases,
			href: `/occupation/${view.code}`,
			statusLabel: 'Official SSOC 2024 occupation',
			position: view.pressureRank,
			positionKind: 'Official pressure rank',
			rawExposure: view.rawExposure,
			exposureRange: view.rawExposureRange,
			officialCategory: view.officialCategory,
			taskDispersion: view.taskDispersion,
			wage: view.wageMedian,
			wageLabel:
				view.wageMedian == null ? 'No direct MOM wage row' : 'Direct MOM 2025 observation',
			demand: view.demandSignals.length
				? view.demandSignals.map(signal => signal.label).join(' · ')
				: 'No reviewed named match',
			demandDetail: view.demandSignals.length
				? 'Named in a current official demand source'
				: 'Absence is not evidence of weak demand',
			labourContext: view.labourContext?.summary ?? null,
			observedUse: occupation.comparison_evidence.observed_ai_use,
			complementarity: occupation.comparison_evidence.potential_complementarity,
			mapping: occupation.evidence.mapping_quality,
			mappingDetail: exposure
				? `${exposure.scored_isco08_matches.length} scored of ${exposure.official_isco08_codes.length} official ISCO match${exposure.official_isco08_codes.length === 1 ? '' : 'es'}`
				: occupation.evidence.support
		};
	});

	const roles = syntheticRolesV9
		.filter(role => role.official_status === 'non_official_role_query')
		.map(role => ({
			id: `role:${role.slug}`,
			kind: 'role' as const,
			code: role.slug,
			title: role.title,
			description: role.description,
			searchText: [role.title, role.description, role.slug, ...role.tags].join(' ').toLowerCase(),
			queryAliases: [] as string[],
			href: `/role/${role.slug}`,
			statusLabel:
				role.estimate_status === 'estimated'
					? 'Non-official role estimate'
					: 'Non-official role query · estimate withheld',
			position: role.estimate?.estimated_comparison_percentile ?? null,
			positionKind: 'Estimated comparison percentile',
			rawExposure: role.estimate?.mean_score_2025 ?? null,
			exposureRange: role.estimate?.mapping_range ?? null,
			officialCategory: role.estimate
				? role.estimate.potential25_component_range.least_exposed ===
					role.estimate.potential25_component_range.most_exposed
					? role.estimate.potential25_component_range.least_exposed
					: `${role.estimate.potential25_component_range.least_exposed} to ${role.estimate.potential25_component_range.most_exposed}`
				: 'Composite withheld',
			taskDispersion: null,
			wage: null,
			wageLabel: `${role.components.filter(component => component.wage_evidence).length} component wage observation${role.components.filter(component => component.wage_evidence).length === 1 ? '' : 's'}; no role estimate`,
			demand: role.components.some(component => component.demand_signals.length)
				? `${role.components.filter(component => component.demand_signals.length).length} component${role.components.filter(component => component.demand_signals.length).length === 1 ? '' : 's'} named in current sources`
				: 'No reviewed component match',
			demandDetail: 'Component evidence only; not a role-level demand measure',
			labourContext: null,
			observedUse: null,
			complementarity: null,
			mapping: 'editorial_component_mix',
			mappingDetail: `${role.components.length} published SSOC 2024 components`
		}));

	return [...occupations, ...roles];
}
