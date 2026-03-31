import type { WorkflowOverlay } from './workflow-overlay';
import { archetypeOverlayDefaults } from './workflow-overlay';

export type Archetype =
	| 'writing_editorial'
	| 'teaching_learning'
	| 'software_engineering'
	| 'data_analytics'
	| 'product_strategy'
	| 'sales_gtm'
	| 'finance_investing'
	| 'people_recruiting'
	| 'healthcare_clinical'
	| 'design_creative'
	| 'operations_logistics'
	| 'legal_compliance'
	| 'field_manual'
	| 'service_hospitality'
	| 'general_professional'
	| 'general_technical'
	| 'general_clerical';

function normalizeTitle(title: string): string {
	return ` ${title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')} `;
}

function hasTerm(normalizedTitle: string, term: string): boolean {
	return normalizedTitle.includes(` ${term.toLowerCase().trim().replace(/\s+/g, ' ')} `);
}

function hasAnyTerm(normalizedTitle: string, terms: string[]): boolean {
	return terms.some(term => hasTerm(normalizedTitle, term));
}

export function classifyOccupationArchetype(
	ssoc: string,
	title: string,
	_majorGroup: string
): Archetype {
	const normalizedTitle = normalizeTitle(title);
	const prefix2 = ssoc.substring(0, 2);
	const prefix3 = ssoc.substring(0, 3);

	if (hasAnyTerm(normalizedTitle, ['journalist', 'editor', 'writer', 'reporter'])) {
		return 'writing_editorial';
	}
	if (hasAnyTerm(normalizedTitle, ['teacher', 'lecturer', 'instructor', 'trainer', 'tutor'])) {
		return 'teaching_learning';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'cto',
			'cio',
			'chief technology',
			'chief information',
			'engineering manager',
			'software manager',
			'ict manager'
		])
	) {
		return 'software_engineering';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'software',
			'developer',
			'programmer',
			'web',
			'devops',
			'sre',
			'platform engineer',
			'frontend',
			'backend',
			'fullstack',
			'full stack',
			'mobile engineer',
			'qa engineer',
			'ml engineer',
			'ai engineer',
			'security engineer',
			'network engineer',
			'database admin',
			'site reliability'
		])
	) {
		return 'software_engineering';
	}
	if (
		(hasAnyTerm(normalizedTitle, ['data', 'statistician', 'analyst']) ||
			hasAnyTerm(normalizedTitle, ['business intelligence', 'analytics'])) &&
		!hasAnyTerm(normalizedTitle, [
			'financial',
			'finance',
			'risk',
			'compliance',
			'audit',
			'legal'
		])
	) {
		return 'data_analytics';
	}
	if (hasAnyTerm(normalizedTitle, ['product manager', 'product director', 'product lead'])) {
		return 'product_strategy';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'marketing',
			'sales',
			'business development',
			'growth',
			'seo',
			'social media',
			'content strategist',
			'content creator',
			'brand manager',
			'community manager',
			'account executive'
		])
	) {
		return 'sales_gtm';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'accountant',
			'accounting',
			'auditor',
			'audit',
			'assurance',
			'tax',
			'financial',
			'finance manager',
			'fund',
			'investment',
			'quant',
			'private equity',
			'venture capital',
			'insurance',
			'underwriter',
			'risk manager',
			'risk analyst',
			'internal control',
			'internal controls'
		])
	) {
		return 'finance_investing';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'human resource',
			'personnel',
			'recruiter',
			'talent acquisition',
			'people partner',
			'people ops'
		]) ||
		hasTerm(normalizedTitle, 'hr')
	) {
		return 'people_recruiting';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'nurse',
			'doctor',
			'surgeon',
			'physician',
			'therapist',
			'dentist',
			'pharmacist'
		])
	) {
		return 'healthcare_clinical';
	}
	if (
		(hasAnyTerm(normalizedTitle, ['designer', 'architect']) &&
			!hasAnyTerm(normalizedTitle, ['solution architect', 'enterprise architect']))
	) {
		return 'design_creative';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'lawyer',
			'legal',
			'compliance',
			'regulatory',
			'solicitor',
			'counsel',
			'governance'
		])
	) {
		return 'legal_compliance';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'logistics',
			'supply chain',
			'warehouse',
			'procurement',
			'operations manager',
			'office manager',
			'executive assistant',
			'event manager',
			'revops'
		])
	) {
		return 'operations_logistics';
	}
	if (
		hasAnyTerm(normalizedTitle, [
			'founder',
			'ceo',
			'chief of staff',
			'managing director',
			'general manager',
			'partnerships',
			'customer success',
			'scrum master',
			'solutions engineer'
		])
	) {
		return 'product_strategy';
	}
	if (
		hasAnyTerm(normalizedTitle, ['waiter', 'cook', 'chef', 'barista', 'receptionist'])
	) {
		return 'service_hospitality';
	}

	if (prefix3 === '133') return 'software_engineering';
	if (prefix3 === '134') return 'teaching_learning';
	if (prefix3 === '122' || prefix3 === '121') return 'product_strategy';

	if (prefix2 === '25') return 'software_engineering';
	if (prefix2 === '22') return 'healthcare_clinical';
	if (prefix2 === '23') return 'teaching_learning';
	if (prefix2 === '24') return 'general_professional';
	if (prefix2 === '26') return 'writing_editorial';
	if (prefix2 === '21') return 'data_analytics';
	if (prefix2 === '11') return 'product_strategy';
	if (prefix2 === '12') return 'general_professional';
	if (prefix2 === '13') return 'operations_logistics';
	if (prefix2 === '14') return 'service_hospitality';

	if (prefix2 === '31') return 'general_technical';
	if (prefix2 === '32') return 'healthcare_clinical';
	if (prefix2 === '33' || prefix2 === '34' || prefix2 === '35') return 'general_technical';
	if (prefix2 === '36') return 'general_technical';
	if (prefix2 === '39') return 'general_professional';

	if (prefix2 === '40') return 'general_clerical';
	if (prefix2 === '41' || prefix2 === '42') return 'general_clerical';
	if (prefix2 === '43' || prefix2 === '44') return 'general_clerical';
	if (prefix2 === '51' || prefix2 === '52' || prefix2 === '54') return 'service_hospitality';
	if (prefix2 === '53') return 'service_hospitality';

	return 'field_manual';
}

export function getWorkflowOverlayForOccupation(
	ssoc: string,
	title: string,
	majorGroup: string
): WorkflowOverlay {
	const archetype = classifyOccupationArchetype(ssoc, title, majorGroup);
	const overlay =
		archetypeOverlayDefaults[archetype] ?? archetypeOverlayDefaults.general_professional;
	if (!overlay) {
		throw new Error(`Missing workflow overlay defaults for archetype: ${archetype}`);
	}
	return overlay;
}
