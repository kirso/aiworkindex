import { occupations, majorGroups } from '$lib/data';
import aiInSingapore from '$lib/data/ai-in-singapore.json';
import macroContext from '$lib/data/macro-context.json';
import postingsMonitor from '$lib/data/postings-monitor.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const employmentProxy = (o: (typeof occupations)[number]) =>
		o.bls_proxy_employment ?? o.employment_thousands;

	const sortedWages = occupations
		.map(o => o.gross_wage_median)
		.filter(w => w > 0)
		.sort((a, b) => a - b);
	const nationalMedian =
		sortedWages.length > 0 ? sortedWages[Math.floor(sortedWages.length / 2)]! : 0;

	// Key stats
	const highRiskCount = occupations.filter(
		o => o.risk_band === 'high' || o.risk_band === 'very_high'
	).length;
	const avgExposure = occupations.reduce((s, o) => s + o.exposure, 0) / occupations.length;
	const demandCount = occupations.filter(
		o => o.evidence.sol_match || o.evidence.jobs_in_demand_match
	).length;

	// Estimated wage pool in high-pressure occupations.
	// Uses the BLS-weighted proxy when available to avoid the older equal-split employment estimate.
	const highRiskOccs = occupations.filter(o => o.net_risk >= 0.3);
	const wagePoolUnderPressureBillions =
		highRiskOccs.reduce((s, o) => s + o.gross_wage_median * 12 * employmentProxy(o) * 1000, 0) /
		1e9;

	// Fraction at high+ risk
	const highRiskPct = Math.round((highRiskCount / occupations.length) * 100);

	return {
		occupations,
		majorGroups,
		stats: {
			highRiskCount,
			highRiskPct,
			avgExposure,
			demandCount,
			nationalMedian,
			wagePoolUnderPressureBillions
		},
		singaporeContext: {
			ai: aiInSingapore.metrics,
			macro: macroContext.latest_snapshot,
			postings: postingsMonitor.summary
		}
	};
};
