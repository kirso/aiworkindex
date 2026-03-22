import onetEnrichmentData from './onet-enrichment.json';
import type { Occupation } from './index';

export interface OnetTechnology {
	name: string;
	category: string;
	hot: boolean;
}

export interface OnetEnrichmentEntry {
	ssoc: string;
	onet_soc: string | null;
	onet_title: string | null;
	match_score: number;
	tasks: string[];
	technologies: OnetTechnology[];
}

const onetEnrichment = onetEnrichmentData as OnetEnrichmentEntry[];
const onetBySsoc = new Map(onetEnrichment.map((entry) => [entry.ssoc, entry]));

export function getOnetEnrichmentForOccupation(ssoc: string): OnetEnrichmentEntry | null {
	const entry = onetBySsoc.get(ssoc) ?? null;
	if (entry && entry.match_score < 0.5) return null;
	return entry;
}

export interface BlendedOnetEnrichment {
	tasks: string[];
	technologies: OnetTechnology[];
	note: string;
}

export function buildRoleOnetEnrichment(
	components: Array<{ weight: number; occupation: Occupation | null }>
): BlendedOnetEnrichment | null {
	const resolved = components
		.filter(
			(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
		)
		.map((component) => ({
			weight: component.weight,
			occupation: component.occupation,
			enrichment: getOnetEnrichmentForOccupation(component.occupation.ssoc)
		}))
		.filter(
			(
				component
			): component is {
				weight: number;
				occupation: Occupation;
				enrichment: OnetEnrichmentEntry;
			} => component.enrichment !== null && component.enrichment.match_score >= 0.5
		);

	if (resolved.length === 0) return null;

	const totalWeight = resolved.reduce((sum, component) => sum + component.weight, 0) || 1;
	const taskWeights = new Map<string, number>();
	const technologyWeights = new Map<string, OnetTechnology & { weight: number }>();

	for (const component of resolved) {
		const normalizedWeight = component.weight / totalWeight;
		for (const task of component.enrichment.tasks) {
			taskWeights.set(task, (taskWeights.get(task) ?? 0) + normalizedWeight);
		}
		for (const technology of component.enrichment.technologies) {
			const existing = technologyWeights.get(technology.name);
			if (existing) {
				existing.weight += normalizedWeight;
				existing.hot = existing.hot || technology.hot;
			} else {
				technologyWeights.set(technology.name, {
					...technology,
					weight: normalizedWeight
				});
			}
		}
	}

	return {
		tasks: [...taskWeights.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6)
			.map(([task]) => task),
		technologies: [...technologyWeights.values()]
			.sort((a, b) => Number(b.hot) - Number(a.hot) || b.weight - a.weight || a.name.localeCompare(b.name))
			.slice(0, 6)
			.map(({ weight: _weight, ...technology }) => technology),
		note: `Blended from O*NET matches across ${resolved.length} component occupations.`
	};
}
