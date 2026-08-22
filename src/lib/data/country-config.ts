export type CountryCode = 'global' | 'sg' | 'us' | 'uk' | 'ca';

export interface CountryCapabilities {
	occupationDetail: boolean;
	structuralProfile: boolean;
	wageContext: boolean;
	employmentContext: boolean;
	demandSignals: boolean;
	transitionCapacity: boolean;
	workerProfile: boolean;
	skillsContext: boolean;
	narrativeContext: boolean;
	adoptionContext: boolean;
	offsetSupport: boolean;
	policyContext: boolean;
	regulatoryOverlay: boolean;
}

export interface CountryConfig {
	code: CountryCode;
	name: string;
	displayName: string;
	routePrefix: string;
	locale: string;
	currency: string | null;
	wagePeriod: 'monthly' | 'annual' | null;
	classificationSystem: string;
	canonicalSystem: string;
	methodologyLabel: string;
	seoTitle: string;
	seoDescription: string;
	status: 'live' | 'preview' | 'ready' | 'planned' | 'research';
	capabilities: CountryCapabilities;
}

export const countryConfigs: Record<CountryCode, CountryConfig> = {
	global: {
		code: 'global',
		name: 'Global',
		displayName: 'Global',
		routePrefix: '/global',
		locale: 'en',
		currency: null,
		wagePeriod: null,
		classificationSystem: 'ISCO-08',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'Global research context',
		seoTitle: 'Global AI and Jobs Economics Context',
		seoDescription:
			'Global research context on AI exposure, adoption, productivity and employment. No global occupation scores are currently published.',
		status: 'research',
		capabilities: {
			occupationDetail: false,
			structuralProfile: false,
			wageContext: false,
			employmentContext: true,
			demandSignals: false,
			transitionCapacity: false,
			workerProfile: false,
			skillsContext: true,
			narrativeContext: false,
			adoptionContext: true,
			offsetSupport: false,
			policyContext: false,
			regulatoryOverlay: false
		}
	},
	sg: {
		code: 'sg',
		name: 'Singapore',
		displayName: 'Singapore AI Work Index',
		routePrefix: '/sg',
		locale: 'en-SG',
		currency: 'SGD',
		wagePeriod: 'monthly',
		classificationSystem: 'SSOC 2024',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'Singapore AI Work Pressure V9',
		seoTitle: 'Singapore AI Work Pressure and Job-Risk Evidence',
		seoDescription:
			'Compare AI work pressure across Singapore SSOC 2024 occupations with separate wage and demand evidence, explicit missingness, and source limitations.',
		status: 'live',
		capabilities: {
			occupationDetail: true,
			structuralProfile: true,
			wageContext: true,
			employmentContext: true,
			demandSignals: true,
			transitionCapacity: false,
			workerProfile: false,
			skillsContext: true,
			narrativeContext: false,
			adoptionContext: true,
			offsetSupport: false,
			policyContext: true,
			regulatoryOverlay: false
		}
	},
	us: {
		code: 'us',
		name: 'United States',
		displayName: 'United States AI Work Index',
		routePrefix: '/us',
		locale: 'en-US',
		currency: 'USD',
		wagePeriod: 'annual',
		classificationSystem: 'SOC',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'United States country layer',
		seoTitle: 'United States AI Work Index Preview',
		seoDescription:
			'Preview of United States occupation evidence. Methods and data are not part of the Singapore V9 release.',
		status: 'preview',
		capabilities: {
			occupationDetail: false,
			structuralProfile: false,
			wageContext: true,
			employmentContext: true,
			demandSignals: true,
			transitionCapacity: true,
			workerProfile: true,
			skillsContext: true,
			narrativeContext: true,
			adoptionContext: true,
			offsetSupport: false,
			policyContext: false,
			regulatoryOverlay: false
		}
	},
	uk: {
		code: 'uk',
		name: 'United Kingdom',
		displayName: 'United Kingdom AI Work Index',
		routePrefix: '/uk',
		locale: 'en-GB',
		currency: 'GBP',
		wagePeriod: 'annual',
		classificationSystem: 'SOC 2020',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'United Kingdom country layer',
		seoTitle: 'United Kingdom AI and Jobs Research Status',
		seoDescription:
			'Research status for a possible United Kingdom occupation layer. No occupation scores or risk rankings are currently published.',
		status: 'research',
		capabilities: {
			occupationDetail: false,
			structuralProfile: false,
			wageContext: false,
			employmentContext: false,
			demandSignals: false,
			transitionCapacity: false,
			workerProfile: false,
			skillsContext: false,
			narrativeContext: false,
			adoptionContext: false,
			offsetSupport: false,
			policyContext: false,
			regulatoryOverlay: false
		}
	},
	ca: {
		code: 'ca',
		name: 'Canada',
		displayName: 'Canada AI Work Index',
		routePrefix: '/ca',
		locale: 'en-CA',
		currency: 'CAD',
		wagePeriod: 'annual',
		classificationSystem: 'NOC 2021',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'Canada country layer',
		seoTitle: 'Canada AI and Jobs Research Status',
		seoDescription:
			'Research status for a possible Canada occupation layer. No occupation scores or risk rankings are currently published.',
		status: 'research',
		capabilities: {
			occupationDetail: false,
			structuralProfile: false,
			wageContext: false,
			employmentContext: false,
			demandSignals: false,
			transitionCapacity: false,
			workerProfile: false,
			skillsContext: false,
			narrativeContext: false,
			adoptionContext: false,
			offsetSupport: false,
			policyContext: false,
			regulatoryOverlay: false
		}
	}
};

export const supportedCountryCodes: CountryCode[] = ['global', 'sg', 'us', 'uk', 'ca'];

export function getCountryConfig(code: CountryCode): CountryConfig {
	return countryConfigs[code];
}
