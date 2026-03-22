import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const employmentProxy = (o: (typeof occupations)[number]) =>
		o.bls_proxy_employment ?? o.employment_thousands;

	// Key stats
	const highRiskCount = occupations.filter(
		o => o.risk_band === 'high' || o.risk_band === 'very_high'
	).length;
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
		stats: {
			highRiskPct,
			demandCount,
			wagePoolUnderPressureBillions
		}
	};
};
