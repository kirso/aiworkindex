export interface MethodologyNote {
	key: string;
	title: string;
	description: string;
}

export interface PublicationRule {
	minimumMappingCoverage: number;
	maximumFallbackShare: number;
	minimumConfidenceLevel: 'low' | 'medium' | 'high';
	requireOfficialLocalDemandSource: boolean;
}

export interface PublicationGate {
	key: string;
	title: string;
	description: string;
}

export interface CountryLaunchProfile {
	code: 'sg' | 'us' | 'uk' | 'ca';
	title: string;
	readiness: 'live' | 'ready' | 'research';
	primary_sources: string[];
	method_notes: string[];
}

export const globalMethodology = {
	title: 'Global structural methodology',
	summary:
		'AI Work Index separates the global structural effect of AI on work from the local labor-market effect of that work in each country. Country headline risk only publishes when local evidence is sufficiently strong; otherwise the page stays on the structural baseline.',
	structuralFormula: 'structural_pressure = exposure × (1 - bottleneck)',
	localFormula: 'headline_risk = structural_pressure × (1 - country_demand_resilience)',
	publicationRules: {
		minimumMappingCoverage: 0.8,
		maximumFallbackShare: 0.2,
		minimumConfidenceLevel: 'medium',
		requireOfficialLocalDemandSource: true
	} satisfies PublicationRule,
	publicationGates: [
		{
			key: 'global_baseline',
			title: 'Global structural baseline',
			description:
				'The ISCO-08 structural layer can publish whenever the exposure and bottleneck inputs are available.'
		},
		{
			key: 'country_headline',
			title: 'Country headline risk',
			description:
				'Publish headline risk only when mapping coverage is at least 80%, fallback share is no more than 20%, and the country layer reaches medium confidence or better.'
		},
		{
			key: 'provisional_surface',
			title: 'Provisional markets',
			description:
				'If the country layer is proxy-heavy or weakly mapped, show structural pressure only and label the surface provisional.'
		},
		{
			key: 'regulatory_overlay',
			title: 'Regulatory overlay',
			description:
				'Licensing, audits, compliance rules, and public-sector constraints stay visible as context, not hidden score inputs.'
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
			title: 'Separate global from local',
			description:
				'Exposure and bottleneck remain global. Demand resilience, wages, and policy context are local.'
		},
		{
			key: 'evidence-hierarchy',
			title: 'Use an evidence hierarchy',
			description:
				'Official local sources drive public country headlines. Proxies and synthetic fields can support calibration, but must be labeled.'
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
				'Licensing, compliance, and public-sector constraints are shown as an overlay, not silently baked into the structural score.'
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
			title: 'Formula invariants',
			description:
				'Prove boundedness, monotonicity, and reproducibility for the shared structural math.'
		},
		{
			key: 'convergence',
			title: 'Convergent validation',
			description:
				'Compare country headlines with official outlook, vacancy, wage, or shortage indicators where they exist.'
		},
		{
			key: 'stability',
			title: 'Temporal stability',
			description:
				'Backtest changes over time and show whether the ranking is stable or sensitive to one source.'
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
			readiness: 'ready',
			primary_sources: ['BLS OEWS', 'BLS employment projections', 'O*NET'],
			method_notes: [
				'Strong structural compatibility and deep public labour data.',
				'The country layer now resolves detailed BLS occupations onto the shared ISCO-08 spine.'
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
				'Current live reference implementation.',
				'Keeps the same structural math while exposing Singapore-specific demand and policy context.'
			]
		}
	] satisfies CountryLaunchProfile[]
} as const;
