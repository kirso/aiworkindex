export type CountryCode = 'global' | 'sg' | 'us' | 'uk' | 'ca';

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
	status: 'live' | 'ready' | 'planned' | 'research';
}

export const countryConfigs: Record<CountryCode, CountryConfig> = {
	global: {
		code: 'global',
		name: 'Global',
		displayName: 'Global Structural Index',
		routePrefix: '/global',
		locale: 'en',
		currency: null,
		wagePeriod: null,
		classificationSystem: 'ISCO-08',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'Global structural baseline',
		seoTitle: 'Global AI Work Index Methodology',
		seoDescription:
			'Global structural methodology for AI Work Index: a comparable exposure and bottleneck baseline that country layers can enrich with local demand data.',
		status: 'research'
	},
	sg: {
		code: 'sg',
		name: 'Singapore',
		displayName: 'Singapore AI Work Index',
		routePrefix: '/sg',
		locale: 'en-SG',
		currency: 'SGD',
		wagePeriod: 'monthly',
		classificationSystem: 'SSOC 2020',
		canonicalSystem: 'ISCO-08',
		methodologyLabel: 'Singapore country layer',
		seoTitle: 'Singapore AI Work Index',
		seoDescription:
			'Singapore occupation risk index with official labour-market context, demand signals, wages, and transition infrastructure.',
		status: 'live'
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
		seoTitle: 'United States AI Work Index',
		seoDescription:
			'United States occupation risk index built on the shared structural baseline with local wages, projections, and labour-demand evidence.',
		status: 'ready'
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
		seoTitle: 'United Kingdom AI Work Index',
		seoDescription:
			'United Kingdom occupation risk index built on the shared structural baseline with local labour demand, wages, and policy context.',
		status: 'research'
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
		seoTitle: 'Canada AI Work Index',
		seoDescription:
			'Canada occupation risk index built on the shared structural baseline with local vacancy, wage, and outlook evidence.',
		status: 'research'
	}
};

export const supportedCountryCodes: CountryCode[] = ['global', 'sg', 'us', 'uk', 'ca'];

export function getCountryConfig(code: CountryCode): CountryConfig {
	return countryConfigs[code];
}
