import type { VacancySignal } from './industry-context';

export function contextToneClass(
	tone: 'neutral' | 'support' | 'protective' | 'pressure'
): string {
	if (tone === 'support') return 'text-impact-leveraged';
	if (tone === 'protective') return 'text-risk-very-low';
	if (tone === 'pressure') return 'text-risk-high';
	return 'text-foreground';
}

export function vacancySignalClass(signal: VacancySignal | null): string {
	if (signal === 'rising') return 'text-impact-leveraged';
	if (signal === 'cooling') return 'text-risk-high';
	return 'text-muted-foreground';
}

export function formatCurrencyShort(
	value: number,
	currency: string = 'SGD',
	locale: string = 'en-SG'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);
}

export function wagePremiumClass(value: number | null | undefined): string {
	if (value === null || value === undefined) return 'text-muted-foreground';
	if (value >= 0.05) return 'text-impact-leveraged';
	if (value <= -0.05) return 'text-risk-high';
	return 'text-muted-foreground';
}
