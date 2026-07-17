import jobQuality from './job-quality.json';
import wageMovement from './wage-movement.json';

const wageGroupLabels: Record<string, string> = {
	MANAGERS: 'Managers & Administrators (Including Working Proprietors)',
	PROFESSIONALS: 'Professionals',
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': 'Associate Professionals & Technicians',
	'CLERICAL SUPPORT WORKERS': 'Clerical Support Workers',
	'SERVICE AND SALES WORKERS': 'Service & Sales Workers',
	'CRAFTSMEN AND RELATED TRADES WORKERS': 'Craftsmen & Related Trades Workers',
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 'Plant & Machine Operators & Assemblers',
	'CLEANERS, LABOURERS AND RELATED WORKERS': 'Cleaners, Labourers & Related Workers'
};

export function broadJobMarketContext(majorGroup: string): string | null {
	const quality = jobQuality.major_groups[majorGroup as keyof typeof jobQuality.major_groups];
	if (!quality) return null;
	return `In 2025, this broad occupation group had ${quality.underemployment_rate_pct.toFixed(1)}% time-related underemployment and ${quality.non_permanent_share_pct.toFixed(1)}% non-permanent employment.`;
}

export function broadRealWageContext(majorGroup: string): string | null {
	const label = wageGroupLabels[majorGroup];
	if (!label) return null;
	const rows = wageMovement.series.filter(row => row.major_group_label === label);
	const values = rows.map(row => row.movement['5y'].real_change_pct);
	if (values.length !== 2) return null;
	const low = Math.min(...values);
	const high = Math.max(...values);
	return `Across the published male and female series, CPI-adjusted median income changed ${low >= 0 ? '+' : ''}${low.toFixed(1)}% to ${high >= 0 ? '+' : ''}${high.toFixed(1)}% from 2018 to 2023.`;
}
