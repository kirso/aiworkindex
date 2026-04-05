import type { Occupation, SgContext } from './index';

export interface SingaporeContextItem {
	key: string;
	label: string;
	value: string;
	description: string;
	tone: 'neutral' | 'support' | 'protective' | 'pressure';
}

export interface SingaporeContextSummary {
	items: SingaporeContextItem[];
	note: string;
}

const EDUCATION_LABELS: Record<number, string> = {
	1: 'No formal education',
	2: 'GCE O-Level / Secondary',
	3: 'Polytechnic / ITE Diploma',
	4: 'University Degree',
	5: 'Graduate Degree'
};

const FOREIGN_WORKER_SCORE: Record<Exclude<SgContext['foreign_worker_dependency'], false>, number> = {
	moderate: 0.5,
	high: 0.75,
	very_high: 1
};

function formatForeignWorkerDependency(value: Exclude<SgContext['foreign_worker_dependency'], false>): string {
	if (value === 'very_high') return 'Very high';
	if (value === 'high') return 'High';
	return 'Moderate';
}

function buildEducationItem(label?: string): SingaporeContextItem | null {
	if (!label) return null;
	return {
		key: 'education',
		label: 'Typical education',
		value: label,
		description: 'Education is a proxy derived from O*NET Job Zones through the SSOC to SOC crosswalk.',
		tone: 'neutral'
	};
}

function buildPwmItem(): SingaporeContextItem {
	return {
		key: 'pwm_covered',
		label: 'Progressive Wage Model',
		value: 'Covered',
		description: 'Published wage floors can raise labour-cost pressure and accelerate redesign or automation.',
		tone: 'pressure'
	};
}

function buildLicensedItem(value: Exclude<SgContext['licensed_profession'], false>): SingaporeContextItem {
	return {
		key: 'licensed_profession',
		label: 'Licensed profession',
		value: value === 'strict' ? 'Strict' : 'Partial',
		description:
			value === 'strict'
				? 'Practice is gated by professional licensing, which creates a strong regulatory moat.'
				: 'Some activities are licensed, which creates a moderate regulatory moat.',
		tone: 'protective'
	};
}

function buildForeignWorkerItem(
	value: Exclude<SgContext['foreign_worker_dependency'], false>
): SingaporeContextItem {
	return {
		key: 'foreign_worker_dependency',
		label: 'Foreign-worker dependency',
		value: formatForeignWorkerDependency(value),
		description:
			'Roles in labour-scarce or manpower-dependent job families can face stronger automation incentives as costs rise.',
		tone: 'pressure'
	};
}

function buildSkillsfutureItem(): SingaporeContextItem {
	return {
		key: 'skillsfuture_eligible',
		label: 'Transition support',
		value: 'SkillsFuture-aligned',
		description:
			'This job family maps to published SkillsFuture / career-transition support, which can soften worker downside.',
		tone: 'support'
	};
}

export function buildOccupationSingaporeContext(occupation: Occupation): SingaporeContextSummary {
	const items: SingaporeContextItem[] = [];
	const sgContext = occupation.sg_context;

	const educationItem = buildEducationItem(occupation.education_label);
	if (educationItem) items.push(educationItem);
	if (sgContext?.pwm_covered) items.push(buildPwmItem());
	if (sgContext?.licensed_profession) items.push(buildLicensedItem(sgContext.licensed_profession));
	if (sgContext?.foreign_worker_dependency) {
		items.push(buildForeignWorkerItem(sgContext.foreign_worker_dependency));
	}
	if (sgContext?.skillsfuture_eligible) items.push(buildSkillsfutureItem());

	return {
		items,
		note:
			'Singapore context mixes published policy/programme coverage with rule-based SSOC or major-group mappings. Education is an O*NET-derived proxy, not a Singapore survey value.'
	};
}

export function buildRoleSingaporeContext(
	components: Array<{ weight: number; occupation: Occupation | null }>
): SingaporeContextSummary {
	const validComponents = components.filter(
		(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
	);
	if (validComponents.length === 0) {
		return {
			items: [],
			note:
				'Synthetic-role Singapore context is anchored on component occupations when those components can be matched.'
		};
	}

	const totalWeight = validComponents.reduce((sum, component) => sum + component.weight, 0) || 1;
	const items: SingaporeContextItem[] = [];

	let educationWeight = 0;
	let weightedEducationLevel = 0;
	let pwmWeight = 0;
	let strictLicenseWeight = 0;
	let partialLicenseWeight = 0;
	let foreignWorkerScore = 0;
	let skillsfutureWeight = 0;

	for (const component of validComponents) {
		const normalizedWeight = component.weight / totalWeight;
		const occupation = component.occupation;
		if (occupation.education_level) {
			weightedEducationLevel += occupation.education_level * normalizedWeight;
			educationWeight += normalizedWeight;
		}
		if (occupation.sg_context?.pwm_covered) pwmWeight += normalizedWeight;
		if (occupation.sg_context?.licensed_profession === 'strict') strictLicenseWeight += normalizedWeight;
		if (occupation.sg_context?.licensed_profession === 'partial') partialLicenseWeight += normalizedWeight;
		if (occupation.sg_context?.foreign_worker_dependency) {
			foreignWorkerScore +=
				FOREIGN_WORKER_SCORE[occupation.sg_context.foreign_worker_dependency] * normalizedWeight;
		}
		if (occupation.sg_context?.skillsfuture_eligible) skillsfutureWeight += normalizedWeight;
	}

	if (educationWeight > 0) {
		const roundedLevel = Math.max(1, Math.min(5, Math.round(weightedEducationLevel / educationWeight)));
		const label = EDUCATION_LABELS[roundedLevel];
		const educationItem = buildEducationItem(label);
		if (educationItem) items.push(educationItem);
	}

	if (pwmWeight >= 0.25) {
		items.push({
			...buildPwmItem(),
			value: pwmWeight >= 0.5 ? 'Core component' : 'Touches PWM families',
			description:
				'Synthetic-role PWM context is blended from component occupations rather than measured directly.'
		});
	}

	if (strictLicenseWeight >= 0.25) {
		items.push({
			...buildLicensedItem('strict'),
			value: 'Includes licensed work',
			description:
				'At least one material component occupation sits behind a strict professional licensing gate.'
		});
	} else if (strictLicenseWeight + partialLicenseWeight >= 0.35) {
		items.push({
			...buildLicensedItem('partial'),
			value: 'Some licensed activities',
			description:
				'Component occupations include partially licensed work, which adds regulatory friction to displacement.'
		});
	}

	if (foreignWorkerScore >= 0.35) {
		const foreignWorkerLabel =
			foreignWorkerScore >= 0.8 ? 'Very high' : foreignWorkerScore >= 0.6 ? 'High' : 'Moderate';
		items.push({
			key: 'foreign_worker_dependency',
			label: 'Foreign-worker dependency',
			value: foreignWorkerLabel,
			description:
				'This is a weighted anchor from component occupations, not a separately measured synthetic-role statistic.',
			tone: 'pressure'
		});
	}

	if (skillsfutureWeight >= 0.5) {
		items.push({
			...buildSkillsfutureItem(),
			value: 'Broadly aligned',
			description:
				'Most component occupations sit inside job families with published SkillsFuture transition support.'
		});
	}

	return {
		items,
		note:
			'Synthetic-role Singapore context is blended from underlying official occupations. Read it as an anchor, not a role-native measurement.'
	};
}
