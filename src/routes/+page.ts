import { occupations, majorGroups } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Compute national median wage across all occupations
	const sortedWages = occupations
		.map(o => o.gross_wage_median)
		.filter(w => w > 0)
		.sort((a, b) => a - b);
	const nationalMedian =
		sortedWages.length > 0 ? sortedWages[Math.floor(sortedWages.length / 2)]! : 0;

	// Risk band counts for data snapshot
	const riskCounts = {
		very_high: occupations.filter(o => o.risk_band === 'very_high').length,
		high: occupations.filter(o => o.risk_band === 'high').length,
		moderate: occupations.filter(o => o.risk_band === 'moderate').length,
		low: occupations.filter(o => o.risk_band === 'low').length,
		very_low: occupations.filter(o => o.risk_band === 'very_low').length
	};

	// Featured occupations for the data cards
	const highestRisk = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 3);
	const safestHighPay = occupations
		.filter(o => o.gross_wage_median > nationalMedian && o.risk_band === 'very_low')
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 3);
	const aiLeveraged = occupations
		.filter(o => o.impact_type === 'ai_leveraged' && o.exposure > 0.5)
		.sort((a, b) => b.exposure - a.exposure)
		.slice(0, 3);

	// Labour market clusters: deduplicate full monitor objects
	const clusterMap = new Map<string, (typeof occupations)[0]['labour_monitor']>();
	for (const o of occupations) {
		if (!o.labour_monitor) continue;
		if (!clusterMap.has(o.labour_monitor.cluster_key)) {
			clusterMap.set(o.labour_monitor.cluster_key, o.labour_monitor);
		}
	}
	const labourClusters = Array.from(clusterMap.values()).filter(
		(c): c is NonNullable<typeof c> => c !== null
	);

	return {
		occupations,
		majorGroups,
		labourClusters,
		riskCounts,
		featured: { highestRisk, safestHighPay, aiLeveraged }
	};
};
