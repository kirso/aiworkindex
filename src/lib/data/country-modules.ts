import type { CountryCapabilities, CountryConfig } from './country-config';

export type CountryModuleKey =
	| 'structuralProfile'
	| 'wageContext'
	| 'employmentContext'
	| 'demandSignals'
	| 'transitionCapacity'
	| 'workerProfile'
	| 'skillsContext'
	| 'narrativeContext'
	| 'adoptionContext'
	| 'regulatoryOverlay';

export interface CountryModuleStatus {
	key: CountryModuleKey;
	title: string;
	available: boolean;
	publishedDescription: string;
	unavailableDescription: string;
}

const moduleDescriptors: Record<CountryModuleKey, Omit<CountryModuleStatus, 'available'>> = {
	structuralProfile: {
		key: 'structuralProfile',
		title: 'Structural baseline',
		publishedDescription:
			'Comparable exposure, bottleneck, and structural pressure on the shared ISCO-08 spine.',
		unavailableDescription: 'Not published for this market yet.'
	},
	wageContext: {
		key: 'wageContext',
		title: 'Wage context',
		publishedDescription:
			'Local wage levels and percentiles published where an official local wage source exists.',
		unavailableDescription: 'No wage layer published yet.'
	},
	employmentContext: {
		key: 'employmentContext',
		title: 'Employment context',
		publishedDescription:
			'Local employment, openings, or projected employment context published with the country layer.',
		unavailableDescription: 'No employment context published yet.'
	},
	demandSignals: {
		key: 'demandSignals',
		title: 'Demand signals',
		publishedDescription:
			'Official shortage, vacancy, or outlook signals used to shape local demand resilience.',
		unavailableDescription: 'No official local demand layer published yet.'
	},
	transitionCapacity: {
		key: 'transitionCapacity',
		title: 'Transition / reinstatement capacity',
		publishedDescription:
			'Training, support, and redeployment pathways that cushion the structural pressure.',
		unavailableDescription: 'No transition-capacity layer published yet.'
	},
	workerProfile: {
		key: 'workerProfile',
		title: 'Worker profile',
		publishedDescription:
			'Gender, age, qualification, and employment-composition context around the occupation.',
		unavailableDescription: 'No worker-profile layer published yet.'
	},
	skillsContext: {
		key: 'skillsContext',
		title: 'Skills / task context',
		publishedDescription:
			'Task, skill, or work-context evidence used to explain why the score looks the way it does.',
		unavailableDescription: 'No skills or task-context layer published yet.'
	},
	narrativeContext: {
		key: 'narrativeContext',
		title: 'Narrative context',
		publishedDescription:
			'Occupation descriptions, work environment, and route-to-job guidance for the country layer.',
		unavailableDescription: 'No narrative layer published yet.'
	},
	adoptionContext: {
		key: 'adoptionContext',
		title: 'Observed AI adoption',
		publishedDescription:
			'Observed AI usage and cross-country research used to calibrate the structural baseline.',
		unavailableDescription: 'No observed-adoption layer published yet.'
	},
	regulatoryOverlay: {
		key: 'regulatoryOverlay',
		title: 'Regulatory overlay',
		publishedDescription:
			'Licensing, compliance, and public-sector constraints are shown as a separate overlay.',
		unavailableDescription: 'No regulatory overlay published yet.'
	}
};

function capabilityValue(
	capabilities: CountryCapabilities,
	key: CountryModuleKey
): boolean {
	if (key === 'transitionCapacity') return capabilities.transitionCapacity || capabilities.offsetSupport;
	return capabilities[key];
}

export function buildCountryModuleStatuses(country: CountryConfig): CountryModuleStatus[] {
	return (Object.keys(moduleDescriptors) as CountryModuleKey[]).map((key) => {
		const descriptor = moduleDescriptors[key];
		const available = capabilityValue(country.capabilities, key);

		return {
			...descriptor,
			available
		};
	});
}

