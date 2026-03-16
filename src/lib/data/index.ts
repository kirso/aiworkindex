import occupationsData from './occupations.json';
import majorGroupsData from './major-groups.json';

export interface OccupationScores {
	aioe: number;
	theta: number;
	c_aioe: number;
	category: 'high_exposure_high_complementarity' | 'high_exposure_low_complementarity' | 'low_exposure';
	match_quality: string;
}

export interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	major_group_code: number;
	gross_wage_median: number;
	gross_wage_25th: number;
	gross_wage_75th: number;
	employment_thousands: number;
	group_employment_thousands: number;
	scores: OccupationScores;
}

export interface MajorGroup {
	code: number;
	key: string;
	label: string;
	color: string;
}

export const occupations: Occupation[] = occupationsData as Occupation[];
export const majorGroups: MajorGroup[] = majorGroupsData as MajorGroup[];

export const occupationsBySSoc = new Map<string, Occupation>(
	occupations.map((o) => [o.ssoc, o])
);

export const occupationsByGroup = new Map<string, Occupation[]>();
for (const o of occupations) {
	const list = occupationsByGroup.get(o.major_group) ?? [];
	list.push(o);
	occupationsByGroup.set(o.major_group, list);
}

export const majorGroupByKey = new Map<string, MajorGroup>(
	majorGroups.map((g) => [g.key, g])
);

export const categoryLabels: Record<string, string> = {
	high_exposure_high_complementarity: 'AI Augmented',
	high_exposure_low_complementarity: 'At Risk',
	low_exposure: 'Low Impact'
};

export const categoryColors: Record<string, string> = {
	high_exposure_high_complementarity: '#f28e2b',
	high_exposure_low_complementarity: '#e15759',
	low_exposure: '#59a14f'
};
