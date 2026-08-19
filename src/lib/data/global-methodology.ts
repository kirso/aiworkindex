export interface MethodologyNote {
	key: string;
	title: string;
	description: string;
}

export interface PublicationRule {
	requireCurrentOfficialTaxonomy: true;
	requireExplicitReferencePopulation: true;
	requirePublishedMappingAudit: true;
	forbidBroadScoreFallback: true;
	requireSeparateLocalEvidence: true;
	requireLocalValidationBeforeForecasts: true;
}

export interface PublicationGate {
	key: string;
	title: string;
	description: string;
}

export interface CountryLaunchProfile {
	code: 'sg' | 'us' | 'uk' | 'ca';
	title: string;
	readiness: 'live' | 'preview' | 'ready' | 'research' | 'withdrawn';
	primary_sources: string[];
	method_notes: string[];
}

export const globalMethodology = {
	title: 'Global research context and country publication gates',
	summary:
		'Cross-country research informs interpretation, but V9 publishes scores only inside the Singapore SSOC 2024 reference market. There is no current global occupation score.',
	structuralFormula: 'research signals ≠ a global scored market',
	localFormula: 'publish only after local denominator, coverage, provenance and outcome-validation gates pass',
	publicationRules: {
		requireCurrentOfficialTaxonomy: true,
		requireExplicitReferencePopulation: true,
		requirePublishedMappingAudit: true,
		forbidBroadScoreFallback: true,
		requireSeparateLocalEvidence: true,
		requireLocalValidationBeforeForecasts: true
	} satisfies PublicationRule,
	publicationGates: [
		{
			key: 'current_taxonomy',
			title: 'Current local taxonomy',
			description:
				'Use the current official occupation classification and state exactly which records enter the public denominator.'
		},
		{
			key: 'mapping_audit',
			title: 'Mapping and missingness audit',
			description:
				'Publish official crosswalk candidates, unmatched records and uncertainty. Do not fill missing occupation scores from broader groups.'
		},
		{
			key: 'construct_and_denominator',
			title: 'One named construct and denominator',
			description:
				'Define what the headline measures, its comparison population and the mathematical owner of the score before publishing ranks.'
		},
		{
			key: 'separate_local_evidence',
			title: 'Separate local evidence',
			description:
				'Wages, demand, adoption, regulation and labour outcomes retain their source grain and never become hidden modifiers of technical exposure.'
		},
		{
			key: 'forecast_validation',
			title: 'Validation before forecasts',
			description:
				'A country exposure rank may publish without an outcome forecast. Any future forecast requires comparable local time-series evidence and prospective validation.'
		}
	] satisfies PublicationGate[],
	principles: [
		{
			key: 'canonical-spine',
			title: 'One canonical spine',
			description:
				'Every country maps its local occupation system to ISCO-08 so the structural layer stays comparable.'
		},
		{
			key: 'global-vs-local',
			title: 'Separate research context from local measurement',
			description:
				'International task-exposure and usage studies can support interpretation, while local wages, demand and institutions remain separate evidence.'
		},
		{
			key: 'evidence-hierarchy',
			title: 'Keep evidence roles explicit',
			description:
				'Observed, derived, modelled and contextual fields are labelled. A proxy can support comparison but cannot quietly become a local outcome.'
		},
		{
			key: 'publish-uncertainty',
			title: 'Publish uncertainty',
			description:
				'Coverage, mapping fidelity, temporal stability, and source agreement are first-class outputs, not hidden implementation details.'
		},
		{
			key: 'regulatory-overlay',
			title: 'Treat regulation as context',
			description:
				'Licensing, compliance and public-sector constraints are shown at their published grain, not silently baked into technical exposure.'
		}
	] satisfies MethodologyNote[],
	validationLadder: [
		{
			key: 'mapping',
			title: 'Mapping validation',
			description:
				'Show local-code coverage, fallback share, and ambiguous mappings before publishing a country page.'
		},
		{
			key: 'formula',
			title: 'Score invariants',
			description:
				'Prove denominator, tie handling, boundedness and reproducibility, and prove that evidence sidecars cannot change the headline.'
		},
		{
			key: 'convergence',
			title: 'Independent comparison',
			description:
				'Compare the headline with external capability, usage and labour evidence without treating agreement as causal validation.'
		},
		{
			key: 'stability',
			title: 'Temporal stability',
			description:
				'Publish movers only between comparable snapshots with the same taxonomy, construct and denominator.'
		},
		{
			key: 'limitations',
			title: 'Limitations',
			description:
				'Publish the failure modes and avoid elevated confidence when a country relies on thin proxies.'
		}
	] satisfies MethodologyNote[],
	countryReadiness: [
		{
			code: 'us',
			title: 'United States',
			readiness: 'preview',
			primary_sources: [
				'BLS OEWS',
				'BLS ORS',
				'BLS CPS demographics',
				'BLS Skills Data',
				'BLS OOH',
				'BLS employment projections',
				'O*NET'
			],
			method_notes: [
				'Strong structural compatibility and deep public labor data across wages, requirements, skills, demographics, and narrative context.',
				'The frozen evidence layer remains available as a preview, but it is not recalculated with Singapore V9 or presented as a cross-country risk ranking.'
			]
		},
		{
			code: 'uk',
			title: 'United Kingdom',
			readiness: 'research',
			primary_sources: ['ONS SOC 2020', 'ONS labour demand volumes', 'vacancy series'],
			method_notes: [
				'Good public occupation structure and useful demand signals.',
				'Still needs a full adapter and country dataset before public scoring.'
			]
		},
		{
			code: 'ca',
			title: 'Canada',
			readiness: 'research',
			primary_sources: ['StatsCan NOC', 'Job Bank outlook methodology', 'vacancy series'],
			method_notes: [
				'Public data is usable but more fragmented than the US.',
				'Launch only after the mapping and outlook layer are explicit enough to defend publicly.'
			]
		},
		{
			code: 'sg',
			title: 'Singapore',
			readiness: 'live',
			primary_sources: ['MOM wages', 'MOM labour force tables', 'SOL / Jobs in Demand'],
			method_notes: [
				'The only live scored market in V9.',
				'Uses the complete SSOC 2024 registry and keeps wages, demand and broad labour context separate from the ILO-based pressure rank.'
			]
		}
	] satisfies CountryLaunchProfile[]
} as const;
