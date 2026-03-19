import geographyContextData from './geography-context.json';
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

interface GeographyItem {
	key: string;
	label: string;
	value: string;
	description: string;
	tone: 'neutral' | 'support' | 'protective' | 'pressure';
}

interface ResidenceArea {
	planning_area: string;
	count: number;
	share: number;
}

interface ResidenceGroup {
	group_key: MajorGroupKey;
	label: string;
	total_residents: number;
	top_planning_areas: ResidenceArea[];
	top_3_share: number;
	top_5_share: number;
}

interface CommuteGroup {
	group_key: MajorGroupKey;
	label: string;
	total_commuters: number;
	estimated_average_minutes: number;
	long_commute_share: number;
	commute_share: {
		upto_15_mins: number;
		mins_16_30: number;
		mins_31_45: number;
		mins_46_60: number;
		more_than_60_mins: number;
	};
}

interface GeographyContextData {
	residence: {
		by_group: ResidenceGroup[];
	};
	commute: {
		by_group: CommuteGroup[];
	};
}

export interface GeographyContextSummary {
	items: GeographyItem[];
	note: string;
}

const data = geographyContextData as GeographyContextData;

const residenceByGroup = new Map(data.residence.by_group.map((group) => [group.group_key, group]));
const commuteByGroup = new Map(data.commute.by_group.map((group) => [group.group_key, group]));

function formatPct(value: number): string {
	return `${(value * 100).toFixed(0)}%`;
}

function summarizeResidence(group: ResidenceGroup): GeographyItem[] {
	const topAreas = group.top_planning_areas.slice(0, 3);
	const topAreaLabel = topAreas.map((area) => area.planning_area).join(', ');
	const concentrationValue =
		group.top_3_share >= 0.25 ? 'More concentrated' : group.top_3_share >= 0.21 ? 'Moderately clustered' : 'Broadly distributed';

	return [
		{
			key: 'planning_areas',
			label: 'Top planning areas',
			value: topAreaLabel,
			description: `${formatPct(group.top_3_share)} of workers in this occupation group live in these three planning areas.`,
			tone: 'neutral'
		},
		{
			key: 'residential_concentration',
			label: 'Residential concentration',
			value: concentrationValue,
			description: `${formatPct(group.top_5_share)} live across the top five planning areas in the 2020 Census.`,
			tone: 'neutral'
		}
	];
}

function summarizeCommute(group: CommuteGroup): GeographyItem {
	const longShare = group.long_commute_share;
	const value =
		longShare >= 0.35 || group.estimated_average_minutes >= 39
			? 'Longer commutes'
			: longShare <= 0.25 && group.estimated_average_minutes <= 34
				? 'Shorter commutes'
				: 'Mid-range commutes';

	return {
		key: 'commute_burden',
		label: 'Commute pattern',
		value,
		description: `Estimated average commute ${group.estimated_average_minutes.toFixed(1)} minutes. ${formatPct(longShare)} take 46 minutes or more.`,
		tone: longShare >= 0.35 ? 'pressure' : 'neutral'
	};
}

export function getGeographyContextForOccupation(occupation: Occupation): GeographyContextSummary {
	const residence = residenceByGroup.get(occupation.major_group as MajorGroupKey);
	const commute = commuteByGroup.get(occupation.major_group as MajorGroupKey);

	if (!residence && !commute) {
		return {
			items: [],
			note: 'Geography context is only available for published Singapore occupation groups in Census 2020.'
		};
	}

	const items: GeographyItem[] = [];
	if (residence) items.push(...summarizeResidence(residence));
	if (commute) items.push(summarizeCommute(commute));

	return {
		items,
		note:
			'Geography context uses official Census 2020 planning-area residence and travel-time tables for broad occupation groups. It adds local context around where workers live and how they commute; it does not affect the structural score.'
	};
}

export function buildRoleGeographyContext(
	components: Array<{ weight: number; occupation: Occupation | null }>
): GeographyContextSummary {
	const validComponents = components.filter(
		(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
	);

	if (validComponents.length === 0) {
		return {
			items: [],
			note: 'Synthetic-role geography context is blended from matched official occupations when those components are available.'
		};
	}

	const totalWeight = validComponents.reduce((sum, component) => sum + component.weight, 0) || 1;
	const areaWeights = new Map<string, number>();
	let weightedTop3Share = 0;
	let weightedTop5Share = 0;
	let weightedAverageMinutes = 0;
	let weightedLongCommuteShare = 0;

	for (const component of validComponents) {
		const normalizedWeight = component.weight / totalWeight;
		const residence = residenceByGroup.get(component.occupation.major_group as MajorGroupKey);
		const commute = commuteByGroup.get(component.occupation.major_group as MajorGroupKey);

		if (residence) {
			weightedTop3Share += residence.top_3_share * normalizedWeight;
			weightedTop5Share += residence.top_5_share * normalizedWeight;
			for (const area of residence.top_planning_areas.slice(0, 5)) {
				areaWeights.set(area.planning_area, (areaWeights.get(area.planning_area) ?? 0) + area.share * normalizedWeight);
			}
		}

		if (commute) {
			weightedAverageMinutes += commute.estimated_average_minutes * normalizedWeight;
			weightedLongCommuteShare += commute.long_commute_share * normalizedWeight;
		}
	}

	const topAreas = [...areaWeights.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([planningArea]) => planningArea)
		.join(', ');

	const items: GeographyItem[] = [];

	if (topAreas) {
		items.push({
			key: 'planning_areas',
			label: 'Top planning areas',
			value: topAreas,
			description: `${formatPct(weightedTop3Share)} of the blended underlying occupation families live across these three planning areas.`,
			tone: 'neutral'
		});
		items.push({
			key: 'residential_concentration',
			label: 'Residential concentration',
			value:
				weightedTop3Share >= 0.25
					? 'More concentrated'
					: weightedTop3Share >= 0.21
						? 'Moderately clustered'
						: 'Broadly distributed',
			description: `${formatPct(weightedTop5Share)} live across the top five planning areas in the weighted occupation blend.`,
			tone: 'neutral'
		});
	}

	if (weightedAverageMinutes > 0) {
		items.push({
			key: 'commute_burden',
			label: 'Commute pattern',
			value:
				weightedLongCommuteShare >= 0.35 || weightedAverageMinutes >= 39
					? 'Longer commutes'
					: weightedLongCommuteShare <= 0.25 && weightedAverageMinutes <= 34
						? 'Shorter commutes'
						: 'Mid-range commutes',
			description: `Weighted average commute ${weightedAverageMinutes.toFixed(1)} minutes. ${formatPct(weightedLongCommuteShare)} take 46 minutes or more.`,
			tone: weightedLongCommuteShare >= 0.35 ? 'pressure' : 'neutral'
		});
	}

	return {
		items,
		note:
			'Synthetic-role geography context is blended from component occupations using official Census 2020 planning-area residence and travel-time tables. Read it as a location anchor, not a role-native measurement.'
	};
}
