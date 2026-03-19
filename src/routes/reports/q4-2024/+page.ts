import { occupations, riskBandLabels, type RiskBand } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// --- Risk distribution: count per band ---
	const riskDistribution: { band: RiskBand; label: string; count: number }[] = (
		['very_low', 'low', 'moderate', 'high', 'very_high'] as RiskBand[]
	).map(band => ({
		band,
		label: riskBandLabels[band],
		count: occupations.filter(o => o.risk_band === band).length
	}));

	// --- Top 5 highest risk ---
	const highestRisk = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5);

	// --- Top 5 most AI-leveraged ---
	const aiLeveraged = occupations
		.filter(o => o.impact_type === 'ai_leveraged')
		.sort((a, b) => b.augmentation - a.augmentation)
		.slice(0, 5);

	// --- Top 5 biggest Anthropic theory-vs-practice gaps ---
	const theoryVsPractice = occupations
		.filter(o => o.evidence.anthropic_calibrated && o.evidence.anthropic_gap !== null)
		.sort((a, b) => Math.abs(b.evidence.anthropic_gap!) - Math.abs(a.evidence.anthropic_gap!))
		.slice(0, 5);

	// --- Labour monitor summary ---
	const clusterMap = new Map<
		string,
		{
			cluster_label: string;
			overall: string;
			vacancy_rate: number;
			vacancy_trend: number;
			vacancy_signal: number;
			vacancy_count: number | null;
			vacancy_count_trend: number | null;
			count: number;
		}
	>();

	for (const occ of occupations) {
		if (!occ.labour_monitor) continue;
		const key = occ.labour_monitor.cluster_key;
		if (!clusterMap.has(key)) {
			clusterMap.set(key, {
				cluster_label: occ.labour_monitor.cluster_label,
				overall: occ.labour_monitor.overall,
				vacancy_rate: occ.labour_monitor.vacancy.latest_rate,
				vacancy_trend: occ.labour_monitor.vacancy.trend_4q_pct,
				vacancy_signal: occ.labour_monitor.vacancy.signal,
				vacancy_count: occ.labour_monitor.vacancy.latest_count ?? null,
				vacancy_count_trend: occ.labour_monitor.vacancy.count_trend_4q_pct ?? null,
				count: 0
			});
		}
		clusterMap.get(key)!.count += 1;
	}

	const labourSummary = Array.from(clusterMap.values());

	// --- Stats ---
	const totalOccupations = occupations.length;
	const avgNetRisk = occupations.reduce((sum, o) => sum + o.net_risk, 0) / totalOccupations;
	const inDemandCount = occupations.filter(
		o => o.evidence.sol_match || o.evidence.jobs_in_demand_match
	).length;
	const anthropicCalibratedCount = occupations.filter(o => o.evidence.anthropic_calibrated).length;

	return {
		riskDistribution,
		highestRisk,
		aiLeveraged,
		theoryVsPractice,
		labourSummary,
		stats: {
			totalOccupations,
			avgNetRisk,
			inDemandCount,
			anthropicCalibratedCount
		}
	};
};
