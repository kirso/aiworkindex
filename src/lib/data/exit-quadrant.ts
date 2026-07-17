import { occupations, type Occupation } from '$lib/data';
import { findBestTransitions, type TransitionScore } from './transition-capacity';

/**
 * The higher-exposure x fewer-exits quadrant: occupations in the upper two
 * V8 exposure bands whose BEST transition option falls in the bottom quartile
 * of best-exit scores within the higher-exposure
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

	const highRisk = occupations.filter(occ => occ.v8.ai_exposure_rank.points >= 60);
	const scored = highRisk.map(from => {
		// An "exit" must actually reduce risk: lateral or higher-risk moves can
		// score a high composite on similarity/wage/demand alone, but they are
		// not escape routes from displacement pressure.
		const targets = findBestTransitions(from, occupations, occupations.length)
			.filter(target => target.risk_improvement > 0)
			.slice(0, 3);
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
export function lookupExitQuadrant(ssoc: string): {
	in_quadrant: boolean;
	best_composite: number;
	threshold: number;
	/** Top risk-reducing transitions — the exits the verdict copy refers to. */
	targets: TransitionScore[];
} | null {
	const data = getExitQuadrant();
	const entry = data.entries.get(ssoc);
	if (!entry) return null;
	return {
		in_quadrant: entry.in_quadrant,
		best_composite: entry.best_composite,
		threshold: data.threshold,
		targets: entry.targets
	};
}
