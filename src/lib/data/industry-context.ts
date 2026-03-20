import industryContextData from './industry-context.json';
import occupationIndustryWagesData from './occupation-industry-wages.json';
import type { Occupation } from './index';

export type VacancySignal = 'rising' | 'stable' | 'cooling';

export interface IndustryContextItem {
	key: string;
	label: string;
	employment_2025: number;
	share_2025: number;
	cagr_5y: number | null;
	change_2y: number | null;
	vacancy_latest: number | null;
	vacancy_quarter: string | null;
	vacancy_trend_4q_pct: number | null;
	vacancy_signal: VacancySignal | null;
	sector_gross_wage_median?: number | null;
	sector_wage_premium_pct?: number | null;
}

export interface GroupIndustryContext {
	major_group: string;
	total_employment_2025: number;
	top_industries: IndustryContextItem[];
	fastest_growing_industries: IndustryContextItem[];
	metadata?: IndustryContextMetadata;
}

export interface IndustryContextMetadata {
	employment_vintage: string;
	vacancy_overlay_vintage: string;
	vacancy_overlay_source_note: string;
}

interface IndustryContextDataset {
	metadata: IndustryContextMetadata;
	groups: Record<string, GroupIndustryContext>;
}

const industryContextDataset = industryContextData as IndustryContextDataset;
const industryContext = industryContextDataset.groups;

export const industryContextMetadata = industryContextDataset.metadata;
const occupationIndustryWages = occupationIndustryWagesData as Record<
	string,
	{
		ssoc: string;
		occupation: string;
		industries: Array<{
			key: string;
			label: string;
			gross_wage_25th: number | null;
			gross_wage_median: number | null;
			gross_wage_75th: number | null;
		}>;
	}
>;

function withOccupationIndustryWages(
	items: IndustryContextItem[],
	occupation: Occupation
): IndustryContextItem[] {
	const wageRecord = occupationIndustryWages[occupation.ssoc];
	if (!wageRecord) return items;
	const wageMap = new Map(wageRecord.industries.map((industry) => [industry.key, industry]));
	return items.map((item) => {
		const wage = wageMap.get(item.key);
		if (!wage || wage.gross_wage_median === null) return item;
		return {
			...item,
			sector_gross_wage_median: wage.gross_wage_median,
			sector_wage_premium_pct:
				occupation.gross_wage_median > 0
					? Number((wage.gross_wage_median / occupation.gross_wage_median - 1).toFixed(4))
					: null
		};
	});
}

export function getIndustryContextForOccupation(
	occupation: Occupation
): GroupIndustryContext | null {
	const context = industryContext[occupation.major_group] ?? null;
	if (!context) return null;
	return {
		...context,
		metadata: industryContextMetadata,
		top_industries: withOccupationIndustryWages(context.top_industries, occupation),
		fastest_growing_industries: withOccupationIndustryWages(
			context.fastest_growing_industries,
			occupation
		)
	};
}

export interface BlendedIndustryContext {
	top_industries: IndustryContextItem[];
	fastest_growing_industries: IndustryContextItem[];
	note: string;
	metadata: IndustryContextMetadata;
}

function blendIndustryLists(
	components: Array<{ weight: number; occupation: Occupation | null }>,
	pick: (context: GroupIndustryContext) => IndustryContextItem[]
): IndustryContextItem[] {
	const validComponents = components.filter(
		(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
	);
	const totalWeight = validComponents.reduce((sum, component) => sum + component.weight, 0) || 1;
	const blended = new Map<
		string,
		{
			label: string;
			shareWeight: number;
			employment: number;
			cagrWeight: number;
			changeWeight: number;
			vacancyWeight: number;
			sectorWageWeight: number;
			cagrWeightedSum: number;
			changeWeightedSum: number;
			vacancyWeightedSum: number;
			vacancyTrendWeightedSum: number;
			vacancySignalScore: number;
			sectorWageWeightedSum: number;
			sectorPremiumWeightedSum: number;
		}
	>();

	for (const component of validComponents) {
		const context = getIndustryContextForOccupation(component.occupation);
		if (!context) continue;
		const normalizedWeight = component.weight / totalWeight;
		for (const item of pick(context)) {
			const influence = normalizedWeight * item.share_2025;
			const existing =
				blended.get(item.key) ?? {
					label: item.label,
					shareWeight: 0,
					employment: 0,
					cagrWeight: 0,
					changeWeight: 0,
					vacancyWeight: 0,
					sectorWageWeight: 0,
					cagrWeightedSum: 0,
					changeWeightedSum: 0,
					vacancyWeightedSum: 0,
					vacancyTrendWeightedSum: 0,
					vacancySignalScore: 0,
					sectorWageWeightedSum: 0,
					sectorPremiumWeightedSum: 0
				};
			existing.shareWeight += influence;
			existing.employment += item.employment_2025 * normalizedWeight;
			if (item.cagr_5y !== null) {
				existing.cagrWeight += influence;
				existing.cagrWeightedSum += item.cagr_5y * influence;
			}
			if (item.change_2y !== null) {
				existing.changeWeight += influence;
				existing.changeWeightedSum += item.change_2y * influence;
			}
			if (item.vacancy_latest !== null) {
				existing.vacancyWeight += influence;
				existing.vacancyWeightedSum += item.vacancy_latest * influence;
			}
			if (item.vacancy_trend_4q_pct !== null) {
				existing.vacancyTrendWeightedSum += item.vacancy_trend_4q_pct * influence;
			}
			if (item.vacancy_signal === 'rising') existing.vacancySignalScore += influence;
			if (item.vacancy_signal === 'cooling') existing.vacancySignalScore -= influence;
			const wageRecord = occupationIndustryWages[component.occupation.ssoc];
			const wageEntry = wageRecord?.industries.find((industry) => industry.key === item.key);
			if (
				wageEntry?.gross_wage_median !== null &&
				wageEntry?.gross_wage_median !== undefined &&
				component.occupation.gross_wage_median > 0
			) {
				existing.sectorWageWeight += influence;
				existing.sectorWageWeightedSum += wageEntry.gross_wage_median * influence;
				existing.sectorPremiumWeightedSum +=
					(wageEntry.gross_wage_median / component.occupation.gross_wage_median - 1) * influence;
			}
			blended.set(item.key, existing);
		}
	}

	return [...blended.entries()]
		.map(([key, value]) => {
			let vacancySignal: VacancySignal | null = null;
			if (value.vacancySignalScore > 0.05) vacancySignal = 'rising';
			else if (value.vacancySignalScore < -0.05) vacancySignal = 'cooling';
			else if (value.vacancyWeight > 0) vacancySignal = 'stable';

			return {
				key,
				label: value.label,
				employment_2025: Number(value.employment.toFixed(1)),
				share_2025: Number(value.shareWeight.toFixed(4)),
				cagr_5y:
					value.cagrWeight > 0
						? Number((value.cagrWeightedSum / value.cagrWeight).toFixed(6))
						: null,
				change_2y:
					value.changeWeight > 0
						? Number((value.changeWeightedSum / value.changeWeight).toFixed(6))
						: null,
				vacancy_latest:
					value.vacancyWeight > 0
						? Number((value.vacancyWeightedSum / value.vacancyWeight).toFixed(0))
						: null,
				vacancy_quarter:
					value.vacancyWeight > 0 ? industryContextMetadata.vacancy_overlay_vintage : null,
				vacancy_trend_4q_pct:
					value.vacancyWeight > 0
						? Number((value.vacancyTrendWeightedSum / value.vacancyWeight).toFixed(4))
						: null,
				vacancy_signal: vacancySignal,
				sector_gross_wage_median:
					value.sectorWageWeight > 0
						? Number((value.sectorWageWeightedSum / value.sectorWageWeight).toFixed(0))
						: null,
				sector_wage_premium_pct:
					value.sectorWageWeight > 0
						? Number((value.sectorPremiumWeightedSum / value.sectorWageWeight).toFixed(4))
						: null
			};
		})
		.sort((a, b) => b.share_2025 - a.share_2025)
		.slice(0, 3);
}

export function buildRoleIndustryContext(
	components: Array<{ weight: number; occupation: Occupation | null }>
): BlendedIndustryContext {
	return {
		top_industries: blendIndustryLists(components, (context) => context.top_industries),
		fastest_growing_industries: blendIndustryLists(
			components,
			(context) => context.fastest_growing_industries
		),
		note:
			'Industry anchors are blended from the official occupation families used to score this synthetic role.',
		metadata: industryContextMetadata
	};
}
