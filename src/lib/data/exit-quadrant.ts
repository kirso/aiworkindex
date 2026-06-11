import { occupations, type Occupation } from '$lib/data';
import { IMPACT_TYPE_THRESHOLDS } from './scoring-constants';
import { findBestTransitions, type TransitionScore } from './transition-capacity';

/**
 * The high-risk x few-exits quadrant (del Rio-Chanona et al. 2021; IMF 2024):
 * occupations above the displacement threshold whose BEST transition option
 * falls in the bottom quartile of best-exit scores within the high-risk
 * cohort. The transition composite distribution is tight (every occupation
 * has some same-family neighbour), so the discriminating definition is
 * relative to the cohort, not the module's absolute labels.
 *
 * Computed lazily once per process and shared by the ranking page and
 * occupation pages so both surfaces use the identical definition.
 */

export interface ExitQuadrantEntry {
	from: Occupation;
	targets: TransitionScore[];
	best_composite: number;
	in_quadrant: boolean;
}

interface ExitQuadrantData {
	threshold: number;
	highRiskCount: number;
	entries: Map<string, ExitQuadrantEntry>;
}

let cache: ExitQuadrantData | null = null;

export function getExitQuadrant(): ExitQuadrantData {
	if (cache) return cache;

	const highRisk = occupations.filter(
		occ => occ.net_risk >= IMPACT_TYPE_THRESHOLDS.displacement_threshold
	);
	const scored = highRisk.map(from => {
		const targets = findBestTransitions(from, occupations, 3);
		return { from, targets, best_composite: targets[0]?.composite ?? 0 };
	});

	const sortedBest = scored.map(entry => entry.best_composite).sort((a, b) => a - b);
	const threshold = sortedBest[Math.floor(0.25 * (sortedBest.length - 1))] ?? 0;

	const entries = new Map<string, ExitQuadrantEntry>(
		scored.map(entry => [
			entry.from.ssoc,
			{ ...entry, in_quadrant: entry.best_composite <= threshold }
		])
	);

	cache = { threshold, highRiskCount: highRisk.length, entries };
	return cache;
}

/** Quadrant verdict for one occupation; null when below the displacement threshold. */
export function lookupExitQuadrant(
	ssoc: string
): { in_quadrant: boolean; best_composite: number; threshold: number } | null {
	const data = getExitQuadrant();
	const entry = data.entries.get(ssoc);
	if (!entry) return null;
	return {
		in_quadrant: entry.in_quadrant,
		best_composite: entry.best_composite,
		threshold: data.threshold
	};
}
