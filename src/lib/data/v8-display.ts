import type { DemandContext, LikelyPathway, V8Band } from './v8-contract';

export const v8BandOrder: V8Band[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];

export const v8BandLabels: Record<V8Band, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High'
};

export const v8BandRanges: Record<V8Band, string> = {
	very_low: '0–19',
	low: '20–39',
	moderate: '40–59',
	high: '60–79',
	very_high: '80–100'
};

export const likelyPathwayOrder: LikelyPathway[] = [
	'limited_direct_change',
	'workflow_redesign',
	'augmentation_led_growth',
	'demand_buffered_redesign',
	'hiring_or_substitution_pressure'
];

export const likelyPathwayLabels: Record<LikelyPathway, string> = {
	limited_direct_change: 'Limited direct change',
	workflow_redesign: 'Workflow redesign',
	augmentation_led_growth: 'Augmentation-led growth',
	demand_buffered_redesign: 'Demand-buffered redesign',
	hiring_or_substitution_pressure: 'Hiring or substitution pressure'
};

export const likelyPathwayShortLabels: Record<LikelyPathway, string> = {
	limited_direct_change: 'Limited change',
	workflow_redesign: 'Workflow redesign',
	augmentation_led_growth: 'Augmentation-led',
	demand_buffered_redesign: 'Demand-buffered',
	hiring_or_substitution_pressure: 'Hiring pressure'
};

export const likelyPathwayDescriptions: Record<LikelyPathway, string> = {
	limited_direct_change: 'Lower relative AI exposure in the current evidence.',
	workflow_redesign: 'The evidence supports change, but not a narrower employment interpretation.',
	augmentation_led_growth: 'High augmentation potential appears alongside strong current demand.',
	demand_buffered_redesign: 'Elevated substitution pressure appears alongside strong current demand.',
	hiring_or_substitution_pressure:
		'Elevated substitution pressure appears with established or leading adoption and without strong demand.'
};

export const likelyPathwayColors: Record<LikelyPathway, string> = {
	limited_direct_change: 'var(--color-text-tertiary)',
	workflow_redesign: 'var(--color-risk-moderate)',
	augmentation_led_growth: 'var(--color-impact-leveraged)',
	demand_buffered_redesign: 'var(--color-risk-high)',
	hiring_or_substitution_pressure: 'var(--color-risk-very-high)'
};

export const demandContextOrder: DemandContext[] = ['strong', 'mixed', 'weak', 'unknown'];

export const demandContextLabels: Record<DemandContext, string> = {
	strong: 'Strong current demand',
	mixed: 'Mixed current demand',
	weak: 'Weak current demand',
	unknown: 'Demand unknown'
};

export const exposureSourceLabels = {
	aioe: 'AIOE',
	anthropic: 'Anthropic Claude usage',
	eloundou: 'GPT exposure',
	ilo: 'ILO exposure'
} as const;

export function formatRank(points: number): string {
	return `${Math.round(points)}/100`;
}

export function pathwayForDisplay(value: string | null | undefined): LikelyPathway {
	if (value && likelyPathwayOrder.includes(value as LikelyPathway)) return value as LikelyPathway;
	return 'workflow_redesign';
}

export function demandForDisplay(value: string | null | undefined): DemandContext {
	if (value && demandContextOrder.includes(value as DemandContext)) return value as DemandContext;
	return 'unknown';
}
