import workerProfileData from './worker-profile.json';
import type { Occupation } from './index';

type MajorGroupKey =
	| 'MANAGERS'
	| 'PROFESSIONALS'
	| 'ASSOCIATE PROFESSIONALS AND TECHNICIANS'
	| 'CLERICAL SUPPORT WORKERS'
	| 'SERVICE AND SALES WORKERS'
	| 'CRAFTSMEN AND RELATED TRADES WORKERS'
	| 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS'
	| 'CLEANERS, LABOURERS AND RELATED WORKERS';

export interface WorkerProfileItem {
	key: string;
	label: string;
	value: string;
	description: string;
	tone: 'neutral' | 'support' | 'protective' | 'pressure';
}

export interface GroupWorkerProfile {
	major_group: MajorGroupKey;
	total_employment: number;
	sex_share: {
		male: number;
		female: number;
	};
	employment_status_share: {
		employers: number;
		employees: number;
		own_account_workers: number;
		contributing_family_workers: number;
		self_employed: number;
	};
	work_arrangement_share: {
		full_time: number;
		part_time: number;
	};
	age_share: {
		age_15_29: number;
		age_30_49: number;
		age_50_59: number;
		age_60_plus: number;
	};
	qualification_share: {
		below_secondary: number;
		secondary: number;
		post_secondary_non_tertiary: number;
		diploma_professional: number;
		degree: number;
	};
	marital_status_share: {
		single: number;
		married: number;
		widowed_divorced: number;
	};
}

export interface DetailedGenderAnchor {
	prefix2: string;
	label: string;
	total_employment: number;
	male_share: number;
	female_share: number;
}

export interface OccupationWageBySex {
	ssoc: string;
	occupation: string;
	male_gross_wage: number | null;
	female_gross_wage: number | null;
	gap_pct: number | null;
}

interface WorkerProfileData {
	groups: Record<MajorGroupKey, GroupWorkerProfile>;
	detailed_gender: Record<string, DetailedGenderAnchor>;
	occupation_wage_by_sex: Record<string, OccupationWageBySex>;
	metadata: {
		data_as_of: string;
		notes: string[];
	};
}

export interface WorkerProfileSummary {
	items: WorkerProfileItem[];
	note: string;
}

const data = workerProfileData as WorkerProfileData;

function formatPct(value: number): string {
	return `${(value * 100).toFixed(0)}%`;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-SG', {
		style: 'currency',
		currency: 'SGD',
		maximumFractionDigits: 0
	}).format(value);
}

function findTopQualification(
	qualificationShare: GroupWorkerProfile['qualification_share']
): Array<{ label: string; share: number }> {
	return [
		{ label: 'Degree', share: qualificationShare.degree },
		{ label: 'Diploma / professional qualification', share: qualificationShare.diploma_professional },
		{ label: 'Post-secondary', share: qualificationShare.post_secondary_non_tertiary },
		{ label: 'Secondary', share: qualificationShare.secondary },
		{ label: 'Below secondary', share: qualificationShare.below_secondary }
	]
		.sort((a, b) => b.share - a.share)
		.slice(0, 2);
}

function qualificationValue(qualificationShare: GroupWorkerProfile['qualification_share']): string {
	if (qualificationShare.degree >= 0.45) return 'Degree-heavy';
	if (qualificationShare.diploma_professional >= 0.32) return 'Diploma-heavy';
	if (qualificationShare.below_secondary + qualificationShare.secondary >= 0.45) {
		return 'Non-degree heavy';
	}
	return 'Mixed qualifications';
}

function ageValue(ageShare: GroupWorkerProfile['age_share']): string {
	if (ageShare.age_60_plus >= 0.25) return 'Older-skewing';
	if (ageShare.age_15_29 >= 0.24) return 'Younger-skewing';
	return 'Mid-career heavy';
}

function buildGenderItem(
	sexShare: { male: number; female: number },
	sourceLabel: string
): WorkerProfileItem {
	return {
		key: 'gender_mix',
		label: 'Gender mix',
		value: `${formatPct(sexShare.male)} male / ${formatPct(sexShare.female)} female`,
		description: `Published Singapore worker composition for ${sourceLabel}.`,
		tone: 'neutral'
	};
}

function buildEmploymentItem(profile: GroupWorkerProfile): WorkerProfileItem {
	return {
		key: 'employment_status',
		label: 'Employment structure',
		value:
			profile.employment_status_share.self_employed >= 0.15 ? 'More self-employed' : 'Employee-heavy',
		description: `${formatPct(profile.employment_status_share.employees)} employees, ${formatPct(profile.employment_status_share.self_employed)} employers or self-employed workers.`,
		tone: 'neutral'
	};
}

function buildWorkArrangementItem(profile: GroupWorkerProfile): WorkerProfileItem {
	return {
		key: 'work_arrangement',
		label: 'Work arrangement',
		value:
			profile.work_arrangement_share.part_time >= 0.2 ? 'Part-time meaningful' : 'Mostly full-time',
		description: `${formatPct(profile.work_arrangement_share.part_time)} part-time and ${formatPct(profile.work_arrangement_share.full_time)} full-time in 2025.`,
		tone: 'neutral'
	};
}

function buildAgeItem(profile: GroupWorkerProfile): WorkerProfileItem {
	return {
		key: 'age_profile',
		label: 'Age profile',
		value: ageValue(profile.age_share),
		description: `${formatPct(profile.age_share.age_15_29)} aged 15 to 29, ${formatPct(profile.age_share.age_30_49)} aged 30 to 49, and ${formatPct(profile.age_share.age_50_59 + profile.age_share.age_60_plus)} aged 50 or older.`,
		tone: 'neutral'
	};
}

function buildQualificationItem(profile: GroupWorkerProfile): WorkerProfileItem {
	const topQualifications = findTopQualification(profile.qualification_share);
	return {
		key: 'qualification_mix',
		label: 'Qualification mix',
		value: qualificationValue(profile.qualification_share),
		description: `${topQualifications
			.map((item) => `${item.label} ${formatPct(item.share)}`)
			.join('; ')}.`,
		tone: 'neutral'
	};
}

function buildWageBySexItem(wage?: OccupationWageBySex): WorkerProfileItem | null {
	if (!wage) return null;
	if (wage.male_gross_wage === null || wage.female_gross_wage === null) return null;
	let gapLabel = 'Near parity';
	if (wage.gap_pct !== null) {
		if (wage.gap_pct <= -0.05) gapLabel = `Female median ${Math.abs(wage.gap_pct * 100).toFixed(0)}% lower`;
		else if (wage.gap_pct >= 0.05) gapLabel = `Female median ${(wage.gap_pct * 100).toFixed(0)}% higher`;
	}
	return {
		key: 'wage_by_sex',
		label: 'Gross wage by sex',
		value: gapLabel,
		description: `Published June 2024 gross wage medians: male ${formatCurrency(wage.male_gross_wage)}, female ${formatCurrency(wage.female_gross_wage)}.`,
		tone: 'neutral'
	};
}

export function getWorkerProfileForOccupation(occupation: Occupation): WorkerProfileSummary {
	const group = data.groups[occupation.major_group as MajorGroupKey];
	if (!group) {
		return {
			items: [],
			note: 'Worker-profile context is only available for published Singapore occupation families.'
		};
	}

	const prefix2 = occupation.ssoc.slice(0, 2);
	const detailedGender = data.detailed_gender[prefix2];
	const wageBySex = data.occupation_wage_by_sex[occupation.ssoc];
	const items: WorkerProfileItem[] = [
		detailedGender
			? buildGenderItem(
					{ male: detailedGender.male_share, female: detailedGender.female_share },
					`the detailed occupation family ${prefix2} ${detailedGender.label}`
				)
			: buildGenderItem(group.sex_share, `the broad occupation group ${occupation.major_group}`),
		buildEmploymentItem(group),
		buildWorkArrangementItem(group),
		buildAgeItem(group),
		buildQualificationItem(group)
	];

	const wageItem = buildWageBySexItem(wageBySex);
	if (wageItem) items.push(wageItem);

	return {
		items,
		note:
			'Worker profile uses official Singapore Labour Force 2025 tables. Gender mix uses the published detailed occupation family when available; other composition fields are broad occupation-group anchors. Wage-by-sex appears only for occupations covered in the common-occupation wage tables.'
	};
}

function blendShares(
	components: Array<{ weight: number; occupation: Occupation | null }>,
	pick: (profile: GroupWorkerProfile, occupation: Occupation) => number
): number {
	const validComponents = components.filter(
		(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
	);
	const totalWeight = validComponents.reduce((sum, component) => sum + component.weight, 0) || 1;
	let weighted = 0;
	for (const component of validComponents) {
		const profile = data.groups[component.occupation.major_group as MajorGroupKey];
		if (!profile) continue;
		weighted += pick(profile, component.occupation) * (component.weight / totalWeight);
	}
	return weighted;
}

export function buildRoleWorkerProfile(
	components: Array<{ weight: number; occupation: Occupation | null }>
): WorkerProfileSummary {
	const validComponents = components.filter(
		(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
	);
	if (validComponents.length === 0) {
		return {
			items: [],
			note:
				'Synthetic-role worker profile is only shown when the role can be anchored to matched official occupations.'
		};
	}

	const primaryComponent = validComponents[0]!;
	const blendedProfile: GroupWorkerProfile = {
		major_group: primaryComponent.occupation.major_group as MajorGroupKey,
		total_employment: 0,
		sex_share: {
			male: blendShares(validComponents, (profile) => profile.sex_share.male),
			female: blendShares(validComponents, (profile) => profile.sex_share.female)
		},
		employment_status_share: {
			employers: blendShares(validComponents, (profile) => profile.employment_status_share.employers),
			employees: blendShares(validComponents, (profile) => profile.employment_status_share.employees),
			own_account_workers: blendShares(
				validComponents,
				(profile) => profile.employment_status_share.own_account_workers
			),
			contributing_family_workers: blendShares(
				validComponents,
				(profile) => profile.employment_status_share.contributing_family_workers
			),
			self_employed: blendShares(
				validComponents,
				(profile) => profile.employment_status_share.self_employed
			)
		},
		work_arrangement_share: {
			full_time: blendShares(validComponents, (profile) => profile.work_arrangement_share.full_time),
			part_time: blendShares(validComponents, (profile) => profile.work_arrangement_share.part_time)
		},
		age_share: {
			age_15_29: blendShares(validComponents, (profile) => profile.age_share.age_15_29),
			age_30_49: blendShares(validComponents, (profile) => profile.age_share.age_30_49),
			age_50_59: blendShares(validComponents, (profile) => profile.age_share.age_50_59),
			age_60_plus: blendShares(validComponents, (profile) => profile.age_share.age_60_plus)
		},
		qualification_share: {
			below_secondary: blendShares(
				validComponents,
				(profile) => profile.qualification_share.below_secondary
			),
			secondary: blendShares(validComponents, (profile) => profile.qualification_share.secondary),
			post_secondary_non_tertiary: blendShares(
				validComponents,
				(profile) => profile.qualification_share.post_secondary_non_tertiary
			),
			diploma_professional: blendShares(
				validComponents,
				(profile) => profile.qualification_share.diploma_professional
			),
			degree: blendShares(validComponents, (profile) => profile.qualification_share.degree)
		},
		marital_status_share: {
			single: blendShares(validComponents, (profile) => profile.marital_status_share.single),
			married: blendShares(validComponents, (profile) => profile.marital_status_share.married),
			widowed_divorced: blendShares(
				validComponents,
				(profile) => profile.marital_status_share.widowed_divorced
			)
		}
	};

	const detailedMaleShare = (() => {
		const totalWeight = validComponents.reduce((sum, component) => sum + component.weight, 0) || 1;
		let weighted = 0;
		let detailWeight = 0;
		for (const component of validComponents) {
			const detailed = data.detailed_gender[component.occupation.ssoc.slice(0, 2)];
			if (!detailed) continue;
			const normalizedWeight = component.weight / totalWeight;
			weighted += detailed.male_share * normalizedWeight;
			detailWeight += normalizedWeight;
		}
		return detailWeight > 0 ? { male: weighted, female: 1 - weighted } : null;
	})();

	const items: WorkerProfileItem[] = [
		detailedMaleShare
			? buildGenderItem(detailedMaleShare, 'blended detailed occupation-family anchors')
			: buildGenderItem(blendedProfile.sex_share, 'blended broad occupation-group anchors'),
		buildEmploymentItem(blendedProfile),
		buildWorkArrangementItem(blendedProfile),
		buildAgeItem(blendedProfile),
		buildQualificationItem(blendedProfile)
	];

	return {
		items,
		note:
			'Synthetic-role worker profile blends official Singapore occupation-family data from the underlying components. Read it as a workforce anchor, not a role-native survey.'
	};
}
