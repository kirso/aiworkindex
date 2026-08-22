import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import roles from '../data/synthetic-roles-v9.json';
import release from '../data/occupations-v9.json';
import { reviewedV9RoleMappings } from '../scripts/v9-role-mappings';
import {
	getRoleFamilyPresentation,
	getRoleHref,
	getRoleJourneyKind,
	ROLE_GUIDANCE_DISCLOSURE
} from '../src/lib/data/role-presentation';

function normalizeTitle(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

describe('V9 modern-role query layer', () => {
	test('has one reviewed disposition for every non-exact query', () => {
		assert.deepEqual(roles.counts, {
			roles: 88,
			exact_title_matches: 11,
			reviewed_alias_matches: 56,
			official_query_matches: 67,
			non_official_roles: 21,
			composite_roles: 18,
			mapping_withheld: 3,
			component_references: 56,
			unique_ssoc2024_components: 43,
			estimated: 18,
			official_matches_ranked: 65,
			official_matches_unranked: 2
		});

		const currentByCode = new Map(
			release.occupations.map(occupation => [occupation.taxonomy.code, occupation])
		);
		const reviewedSlugs = new Set(Object.keys(reviewedV9RoleMappings));
		const nonExactSlugs = new Set<string>();

		for (const role of roles.roles) {
			if (role.resolution_basis === 'normalized_exact_title') {
				assert.equal(role.official_status, 'official_occupation_match');
				assert.equal(role.kind, 'role_query');
				assert.ok(role.official_occupation);
				const official = currentByCode.get(role.official_occupation.ssoc2024);
				assert.ok(official);
				assert.equal(normalizeTitle(role.title), normalizeTitle(official.taxonomy.title));
				assert.equal(reviewedSlugs.has(role.slug), false);
				assert.equal(role.estimate, null);
				assert.equal(role.components.length, 0);
				continue;
			}

			nonExactSlugs.add(role.slug);
			const disposition = reviewedV9RoleMappings[role.slug as keyof typeof reviewedV9RoleMappings];
			assert.ok(disposition, role.slug);
			if (disposition.kind === 'official_alias') {
				assert.equal(role.official_status, 'official_occupation_match');
				assert.equal(role.kind, 'role_query');
				assert.equal(role.official_occupation?.ssoc2024, disposition.ssoc2024);
				assert.equal(role.official_occupation?.title, disposition.expectedTitle);
				assert.equal(role.estimate, null);
				assert.equal(role.components.length, 0);
				continue;
			}

			assert.equal(role.official_status, 'non_official_role_query');
			assert.equal(role.official_occupation, null);
			if (disposition.kind === 'withheld') {
				assert.equal(role.kind, 'role_query');
				assert.equal(role.estimate_status, 'mapping_withheld');
				assert.equal(role.estimate, null);
				assert.equal(role.components.length, 0);
				continue;
			}

			assert.equal(role.kind, 'synthetic_role');
			assert.equal(role.estimate_status, 'estimated');
			assert.ok(role.estimate);
			assert.deepEqual(
				role.components.map(component => ({
					ssoc2024: component.ssoc2024,
					weight: component.weight,
					rationale: component.rationale
				})),
				disposition.components
			);
			assert.equal(
				new Set(role.components.map(component => component.ssoc2024)).size,
				role.components.length
			);
			assert.ok(
				Math.abs(role.components.reduce((sum, component) => sum + component.weight, 0) - 1) < 1e-9
			);
			assert.ok(
				role.components.every(
					component => currentByCode.get(component.ssoc2024)?.score_status === 'scored'
				)
			);
		}

		assert.deepEqual(reviewedSlugs, nonExactSlugs);
	});

	test('locks the highest-consequence reviewed corrections', () => {
		const bySlug = new Map(roles.roles.map(role => [role.slug, role]));
		assert.equal(bySlug.get('ride-hail-driver')?.official_occupation?.ssoc2024, '83226');
		assert.equal(bySlug.get('data-analyst')?.official_occupation?.ssoc2024, '21231');
		assert.equal(bySlug.get('ml-engineer')?.official_occupation?.ssoc2024, '25143');
		assert.equal(bySlug.get('ai-engineer')?.official_occupation?.ssoc2024, '25143');
		assert.equal(bySlug.get('sustainability-manager')?.official_occupation?.ssoc2024, '24214');
		assert.equal(bySlug.get('customer-support-specialist')?.official_occupation?.ssoc2024, '35123');
		assert.equal(bySlug.get('executive-assistant')?.official_occupation?.ssoc2024, '33494');
		assert.equal(bySlug.get('freelance-designer')?.official_occupation?.ssoc2024, '21661');

		const deliveryCodes = bySlug
			.get('delivery-rider')
			?.components.map(component => component.ssoc2024);
		assert.deepEqual(deliveryCodes, ['83211', '83212', '93310']);
		assert.equal(deliveryCodes?.includes('33461'), false);

		assert.equal(bySlug.get('founder-associate')?.official_occupation?.ssoc2024, '33491');
		assert.equal(bySlug.get('founder-associate')?.official_occupation?.pressure_rank, null);
		assert.deepEqual(
			roles.roles
				.filter(role => role.estimate_status === 'mapping_withheld')
				.map(role => role.slug)
				.sort(),
			['compliance-officer', 'project-manager', 'prompt-engineer']
		);
	});

	test('publishes transparent estimates and sensitivity without outcome formulas', () => {
		const estimated = roles.roles.filter(role => role.estimate_status === 'estimated');
		for (const role of estimated) {
			assert.ok(role.estimate);
			assert.ok(role.estimate.mapping_range.min <= role.estimate.mean_score_2025);
			assert.ok(role.estimate.mapping_range.max >= role.estimate.mean_score_2025);
			assert.ok(role.estimate.estimated_comparison_percentile >= 0);
			assert.ok(role.estimate.estimated_comparison_percentile <= 100);
			assert.ok(
				role.estimate.weighting_sensitivity.leave_one_component_out_min <=
					role.estimate.weighting_sensitivity.leave_one_component_out_max
			);
		}
		const officialRankByMean = new Map<number, number>();
		for (const occupation of release.occupations) {
			if (!occupation.genai_task_exposure) continue;
			officialRankByMean.set(
				occupation.genai_task_exposure.mean_score_2025.median,
				occupation.genai_task_exposure.pressure_rank.percentile
			);
		}
		for (const role of estimated) {
			assert.ok(role.estimate);
			const exactOfficialRank = officialRankByMean.get(role.estimate.mean_score_2025);
			if (exactOfficialRank !== undefined) {
				assert.equal(role.estimate.estimated_comparison_percentile, exactOfficialRank);
			}
		}
		const serialized = JSON.stringify(roles);
		for (const forbidden of [
			'net_risk',
			'jobs_affected',
			'wage_pool',
			'augmentation_score',
			'likely_pathway'
		]) {
			assert.equal(serialized.includes(forbidden), false);
		}
	});

	test('keeps all 88 title journeys and family guidance separate from scoring', () => {
		const kinds = roles.roles.map(role => getRoleJourneyKind(role));
		assert.equal(kinds.filter(kind => kind === 'exact_official_title').length, 11);
		assert.equal(kinds.filter(kind => kind === 'reviewed_official_match').length, 56);
		assert.equal(kinds.filter(kind => kind === 'composite_estimate').length, 18);
		assert.equal(kinds.filter(kind => kind === 'mapping_withheld').length, 3);

		for (const role of roles.roles) {
			const presentation = getRoleFamilyPresentation(role.slug);
			assert(presentation.label.length > 0, role.slug);
			assert.equal(presentation.workProfile.length, 6, role.slug);
			assert.equal(presentation.actions.tryWithAi.length, 2, role.slug);
			assert.equal(presentation.actions.keepHumanLed.length, 2, role.slug);
			assert.equal(
				getRoleHref(role),
				role.resolution_basis === 'normalized_exact_title'
					? `/occupation/${role.official_occupation?.ssoc2024}`
					: `/role/${role.slug}`
			);
		}

		assert.match(ROLE_GUIDANCE_DISCLOSURE, /pressure calculation stays separate/);
		assert.equal(JSON.stringify(roles).includes('workProfile'), false);
		assert.equal(JSON.stringify(roles).includes('tryWithAi'), false);
	});
});
