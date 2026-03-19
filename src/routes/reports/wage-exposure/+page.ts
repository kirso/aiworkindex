import { occupations, majorGroups } from '$lib/data';
import type { Occupation } from '$lib/data';
import { RANKING_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

function employmentProxy(o: Occupation): number {
	return o.bls_proxy_employment ?? o.employment_thousands;
}

/** Annual wage bill for an occupation: monthly median x 12 months x headcount */
function annualWageBill(o: Occupation): number {
	return o.gross_wage_median * 12 * employmentProxy(o) * 1000;
}

export const load: PageLoad = () => {
	const highRisk = occupations.filter(o => o.net_risk >= RANKING_THRESHOLDS.high_risk_floor);
	const allOccs = occupations;

	// Total employment and wages
	const totalEmployment = allOccs.reduce((s, o) => s + employmentProxy(o), 0);
	const totalAnnualWages = allOccs.reduce((s, o) => s + annualWageBill(o), 0);

	// High risk employment and wages
	const highRiskEmployment = highRisk.reduce((s, o) => s + employmentProxy(o), 0);
	const highRiskAnnualWages = highRisk.reduce((s, o) => s + annualWageBill(o), 0);

	// By major group
	const byGroup = new Map<
		string,
		{ employment: number; wages: number; count: number; avgRisk: number }
	>();
	for (const occ of highRisk) {
		const g = byGroup.get(occ.major_group) ?? { employment: 0, wages: 0, count: 0, avgRisk: 0 };
		g.employment += employmentProxy(occ);
		g.wages += annualWageBill(occ);
		g.count++;
		g.avgRisk += occ.net_risk;
		byGroup.set(occ.major_group, g);
	}

	const groupBreakdown = [...byGroup.entries()]
		.map(([key, g]) => ({
			key,
			label: majorGroups.find(mg => mg.key === key)?.label ?? key,
			employment: g.employment,
			wages: g.wages,
			count: g.count,
			avgRisk: g.avgRisk / g.count
		}))
		.sort((a, b) => b.wages - a.wages);

	// Top 15 by individual wage exposure (wage x risk)
	const topIndividual = [...highRisk]
		.sort((a, b) => b.gross_wage_median * b.net_risk - a.gross_wage_median * a.net_risk)
		.slice(0, 15);

	return {
		totalEmployment,
		totalAnnualWages,
		highRiskEmployment,
		highRiskAnnualWages,
		highRiskCount: highRisk.length,
		totalCount: allOccs.length,
		groupBreakdown,
		topIndividual
	};
};
