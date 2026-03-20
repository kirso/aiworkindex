import offsetPotentialData from './offset-potential.json';
import type { Occupation } from './index';

export type OffsetPotentialBand = 'low' | 'medium' | 'high';

export interface OffsetPotentialEntry {
	ssoc: string;
	title: string;
	score: number;
	band: OffsetPotentialBand;
	summary: string;
	strengths: string[];
	cautions: string[];
	components: {
		demand_persistence: number;
		transition_support: number;
		reallocation_room: number;
		mobility_friction: number;
	};
	basis: string;
}

interface OffsetPotentialArtifact {
	generated_at: string;
	entries: OffsetPotentialEntry[];
}

export const offsetPotential = offsetPotentialData as OffsetPotentialArtifact;

const offsetPotentialBySsoc = new Map(
	offsetPotential.entries.map((entry) => [entry.ssoc, entry])
);

export function getOffsetPotentialForOccupation(ssoc: string): OffsetPotentialEntry | null {
	return offsetPotentialBySsoc.get(ssoc) ?? null;
}

export function buildRoleOffsetPotential(
	components: Array<{ weight: number; occupation: Occupation | null }>
): OffsetPotentialEntry | null {
	const resolved = components
		.filter(
			(component): component is { weight: number; occupation: Occupation } =>
				component.occupation !== null
		)
		.map((component) => ({
			weight: component.weight,
			occupation: component.occupation,
			entry: getOffsetPotentialForOccupation(component.occupation.ssoc)
		}))
		.filter(
			(
				component
			): component is {
				weight: number;
				occupation: Occupation;
				entry: OffsetPotentialEntry;
			} => component.entry !== null
		);

	if (resolved.length === 0) return null;

	const weighted = (selector: (entry: OffsetPotentialEntry) => number): number => {
		const totalWeight = resolved.reduce((sum, component) => sum + component.weight, 0) || 1;
		return resolved.reduce((sum, component) => sum + selector(component.entry) * component.weight, 0) / totalWeight;
	};

	const score = weighted((entry) => entry.score);
	const band: OffsetPotentialBand = score >= 0.68 ? 'high' : score >= 0.42 ? 'medium' : 'low';
	const strengths = [...new Set(resolved.flatMap((component) => component.entry.strengths))].slice(0, 3);
	const cautions = [...new Set(resolved.flatMap((component) => component.entry.cautions))].slice(0, 3);
	const primary = [...resolved].sort((a, b) => b.weight - a.weight)[0]?.occupation ?? null;

	const summary =
		band === 'high'
			? 'This estimated role still shows credible offset paths across its component occupations.'
			: band === 'medium'
				? 'This estimated role shows some offset potential, but it depends on demand and transition pathways holding up across the blended occupation set.'
				: 'This estimated role shows limited offset support right now, so structural pressure may be cushioned more slowly.';

	return {
		ssoc: primary?.ssoc ?? 'synthetic-role',
		title: primary?.title ?? 'Synthetic role',
		score: Number(score.toFixed(4)),
		band,
		summary,
		strengths,
		cautions,
		components: {
			demand_persistence: Number(weighted((entry) => entry.components.demand_persistence).toFixed(4)),
			transition_support: Number(weighted((entry) => entry.components.transition_support).toFixed(4)),
			reallocation_room: Number(weighted((entry) => entry.components.reallocation_room).toFixed(4)),
			mobility_friction: Number(weighted((entry) => entry.components.mobility_friction).toFixed(4))
		},
		basis: `Blended from ${resolved.length} component occupations. This remains a heuristic support layer rather than a direct measure of realised reinstatement.`
	};
}
