import { occupations as singaporeOccupations } from '$lib/data';
import { getGlobalOccupationRow } from '../../global-occupations';
import {
	syntheticRoles,
	computeRoleScores,
	type ScoredRole,
	type SyntheticRole
} from '../../synthetic-roles';
import { usOccupations } from './occupations';
import { getUnitedStatesSupport, type UnitedStatesOccupationSupport } from './support';
import type { Occupation } from '../../index';
import type { CountryOccupationRecord } from '../../country-index';

export interface UnitedStatesRoleComponent {
	sourceCode: string;
	weight: number;
	rationale: string;
	localCode: string | null;
	localTitle: string;
	canonicalCode: string | null;
	canonicalTitle: string | null;
	occupation: Occupation | null;
	support: UnitedStatesOccupationSupport | null;
}

export interface UnitedStatesRoleView {
	role: SyntheticRole;
	scored: ScoredRole;
	components: UnitedStatesRoleComponent[];
	primaryOccupation: CountryOccupationRecord | null;
	primarySupport: UnitedStatesOccupationSupport | null;
}

function buildCountryOccupation(
	sourceCode: string,
	localCode: string,
	localTitle: string,
	canonicalCode: string | null,
	canonicalTitle: string | null,
	wageMedian: number | null,
	wageP25: number | null,
	wageP75: number | null,
	employmentCurrent: number | null,
	demandResilience: number,
	headlineRisk: number,
	headlineBand: CountryOccupationRecord['headlineBand'],
	confidence: CountryOccupationRecord['confidence']
): Occupation {
	const globalRow = canonicalCode ? getGlobalOccupationRow(canonicalCode) : null;
	return {
		ssoc: localCode,
		title: localTitle,
		major_group: canonicalTitle ?? 'United States',
		major_group_code: Number(localCode.slice(0, 2)) || 0,
		gross_wage_median: wageMedian ?? 0,
		gross_wage_25th: wageP25 ?? wageMedian ?? 0,
		gross_wage_75th: wageP75 ?? wageMedian ?? 0,
		employment_thousands: employmentCurrent ?? 0,
		group_employment_thousands: employmentCurrent ?? 0,
		exposure: globalRow?.exposure ?? 0.5,
		bottleneck: globalRow?.bottleneck ?? 0.5,
		market: {
			market_momentum: 0,
			occupation_scarcity: 0,
			market_resilience: demandResilience,
			market_modifier: 1 - demandResilience
		},
		net_risk: headlineRisk,
		risk_band: headlineBand,
		augmentation: globalRow ? globalRow.exposure * globalRow.bottleneck * demandResilience : 0,
		augmentation_band: 'moderate',
		impact_type: headlineRisk >= 0.3 ? 'at_risk' : headlineRisk >= 0.15 ? 'mixed' : 'stable',
		structural_model_version: 'V6',
		scoring_basis: 'posterior_ensemble_fallback_v5',
		confidence: {
			score: confidence.score,
			level: confidence.level,
			crosswalk_quality: confidence.crosswalk_quality,
			market_data_granularity: confidence.market_data_granularity,
			source_freshness: confidence.source_freshness,
			source_coverage: confidence.source_coverage,
			signal_agreement: confidence.signal_agreement,
			sensitivity: confidence.sensitivity,
			exposure_source_count: confidence.exposure_source_count
		},
		// The role shell does not consume these directly, but the shared score helpers expect
		// a complete occupation-like shape.
		evidence: {
			anthropic_calibrated: true,
			anthropic_gap: null,
			anthropic_observed_pctile: null,
			sol_match: false,
			jobs_in_demand_match: false,
			exposure_agreement: null,
			exposure_source_count: confidence.exposure_source_count,
			exposure_source_keys: [],
			exposure_source_pctiles: {},
			exposure_source_weights: {}
		},
		market_resilience: demandResilience,
		labour_monitor_key: null,
		data_basis: 'us_role',
		single_family_employment_thousands: null,
		multi_family_employment_thousands: null,
		transition_adjusted_risk: headlineRisk,
		transition_adjusted_band: headlineBand,
		transition_adjusted_impact_type: headlineRisk >= 0.3 ? 'at_risk' : headlineRisk >= 0.15 ? 'mixed' : 'stable',
		realized_risk_proxy: headlineRisk,
		adaptation_capacity: 1 - headlineRisk,
		adaptation_buffer: demandResilience,
		best_transition: null,
	workflow_overlay: null
	} as unknown as Occupation;
}

function buildRoleOccupationMap(role: SyntheticRole): Map<string, Occupation> {
	const roleOccupations = new Map<string, Occupation>();

	for (const component of role.components) {
		const sgSource = singaporeOccupations.find(row => row.ssoc === component.ssoc) ?? null;
		const canonicalCode = sgSource?.isco_codes_matched?.[0] ?? null;
		const canonicalTitle = canonicalCode ? getGlobalOccupationRow(canonicalCode)?.canonicalTitle ?? null : null;
		const usSource = canonicalCode
			? usOccupations.find(row => row.canonicalCode === canonicalCode) ?? null
			: null;

		const occupation = buildCountryOccupation(
			component.ssoc,
			usSource?.localCode ?? component.ssoc,
			usSource?.localTitle ?? sgSource?.title ?? component.ssoc,
			canonicalCode,
			canonicalTitle,
			usSource?.wage.median ?? null,
			usSource?.wage.p25 ?? null,
			usSource?.wage.p75 ?? null,
			usSource?.employment.current ?? null,
			usSource?.demandResilience ?? 0.5,
			usSource?.headlineRisk ?? 0.25,
			usSource?.headlineBand ?? 'moderate',
			usSource?.confidence ?? {
				score: 0.5,
				level: 'medium',
				crosswalk_quality: 0.5,
				market_data_granularity: 0.5,
				source_freshness: 0.5,
				source_coverage: 0.5,
				signal_agreement: 0.5,
				sensitivity: 0.5,
				exposure_source_count: 0
			}
		);

		roleOccupations.set(component.ssoc, occupation);
	}

	return roleOccupations;
}

function buildRenderedComponents(role: SyntheticRole) {
	return role.components.map(component => {
		const sgSource = singaporeOccupations.find(row => row.ssoc === component.ssoc) ?? null;
		const canonicalCode = sgSource?.isco_codes_matched?.[0] ?? null;
		const usSource = canonicalCode
			? usOccupations.find(row => row.canonicalCode === canonicalCode) ?? null
			: null;
		return {
			sourceCode: component.ssoc,
			weight: component.weight,
			rationale: component.rationale,
			localCode: usSource?.localCode ?? null,
			localTitle: usSource?.localTitle ?? sgSource?.title ?? component.ssoc,
			canonicalCode,
			canonicalTitle: canonicalCode ? getGlobalOccupationRow(canonicalCode)?.canonicalTitle ?? null : null,
			occupation: null,
			support: usSource ? getUnitedStatesSupport(usSource.localCode) : null
		};
	});
}

function findPrimaryOccupation(role: SyntheticRole) {
	const rendered = buildRenderedComponents(role);
	const primary = rendered
		.filter(component => component.localCode !== null)
		.sort((a, b) => b.weight - a.weight)[0] ?? null;

	if (!primary?.localCode) return null;
	const usSource = usOccupations.find(row => row.localCode === primary.localCode) ?? null;
	return usSource;
}

export function buildUnitedStatesRoleView(slug: string): UnitedStatesRoleView | null {
	const role = syntheticRoles.find(entry => entry.slug === slug);
	if (!role) return null;

	const occupationMap = buildRoleOccupationMap(role);
	const scored = computeRoleScores(role, occupationMap);
	const renderedComponents = buildRenderedComponents(role);
	const primaryOccupation = findPrimaryOccupation(role);
	const primarySupport = primaryOccupation ? getUnitedStatesSupport(primaryOccupation.localCode) : null;

	return {
		role,
		scored,
		components: renderedComponents,
		primaryOccupation,
		primarySupport
	};
}
