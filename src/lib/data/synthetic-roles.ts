import type { Occupation, RiskBand, ImpactType, AugmentationBand } from './index';

export interface SyntheticRole {
	slug: string;
	title: string;
	description: string;
	components: Array<{
		ssoc: string;
		weight: number;
		rationale: string;
	}>;
	tags: string[];
}

export interface ScoredRole {
	slug: string;
	title: string;
	description: string;
	tags: string[];
	exposure: number;
	bottleneck: number;
	market_resilience: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	confidence: 'medium';
	components: Array<{
		ssoc: string;
		weight: number;
		rationale: string;
		occupation: Occupation | null;
	}>;
}

export const syntheticRoles: SyntheticRole[] = [
	{
		slug: 'product-manager',
		title: 'Product Manager',
		description: 'Leads product strategy, roadmap, and cross-functional execution',
		components: [
			{ ssoc: '25112', weight: 0.3, rationale: 'ICT business process consultant / Business analyst' },
			{ ssoc: '12222', weight: 0.3, rationale: 'Marketing manager' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' },
			{ ssoc: '24313', weight: 0.2, rationale: 'Marketing strategy/planning professional' }
		],
		tags: ['tech', 'management', 'strategy']
	},
	{
		slug: 'project-manager',
		title: 'Project Manager',
		description: 'Plans, executes, and delivers projects on time and within budget',
		components: [
			{ ssoc: '24213', weight: 0.5, rationale: 'Business and financial project management professional' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '33491', weight: 0.2, rationale: 'Management executive' }
		],
		tags: ['management', 'operations']
	},
	{
		slug: 'recruiter',
		title: 'Recruiter',
		description: 'Sources, screens, and hires talent for organizations',
		components: [
			{ ssoc: '24232', weight: 0.5, rationale: 'Executive search consultant' },
			{ ssoc: '24233', weight: 0.3, rationale: 'Personnel/Human resource officer' },
			{ ssoc: '24231', weight: 0.2, rationale: 'Human resource consultant' }
		],
		tags: ['hr', 'talent']
	},
	{
		slug: 'devops-engineer',
		title: 'DevOps Engineer',
		description: 'Builds and maintains CI/CD pipelines, infrastructure, and deployment automation',
		components: [
			{ ssoc: '25231', weight: 0.4, rationale: 'Cloud specialist' },
			{ ssoc: '25232', weight: 0.3, rationale: 'IT infrastructure specialist' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['tech', 'engineering', 'infrastructure']
	},
	{
		slug: 'data-engineer',
		title: 'Data Engineer',
		description: 'Designs and builds data pipelines, warehouses, and analytics infrastructure',
		components: [
			{ ssoc: '25211', weight: 0.3, rationale: 'Database administrator' },
			{ ssoc: '25212', weight: 0.3, rationale: 'Database architect' },
			{ ssoc: '25121', weight: 0.2, rationale: 'Software developer' },
			{ ssoc: '25220', weight: 0.2, rationale: 'Network, servers and computer systems administrator' }
		],
		tags: ['tech', 'data', 'engineering']
	},
	{
		slug: 'hr-business-partner',
		title: 'HR Business Partner',
		description: 'Aligns HR strategy with business objectives and supports organizational development',
		components: [
			{ ssoc: '24231', weight: 0.4, rationale: 'Human resource consultant' },
			{ ssoc: '12121', weight: 0.3, rationale: 'Personnel/Human resource manager' },
			{ ssoc: '24233', weight: 0.3, rationale: 'Personnel/Human resource officer' }
		],
		tags: ['hr', 'management', 'strategy']
	},
	{
		slug: 'customer-success-manager',
		title: 'Customer Success Manager',
		description: 'Drives customer retention, adoption, and expansion through proactive relationship management',
		components: [
			{ ssoc: '12241', weight: 0.4, rationale: 'Customer service manager' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '33211', weight: 0.3, rationale: 'Insurance sales agent/broker (proxy for client relationship role)' }
		],
		tags: ['sales', 'customer', 'management']
	},
	{
		slug: 'account-executive',
		title: 'Account Executive',
		description: 'Manages the full sales cycle from prospecting to closing deals',
		components: [
			{ ssoc: '33211', weight: 0.5, rationale: 'Insurance sales agent/broker (proxy for B2B sales)' },
			{ ssoc: '12211', weight: 0.3, rationale: 'Sales manager' },
			{ ssoc: '12213', weight: 0.2, rationale: 'Regional sales manager' }
		],
		tags: ['sales', 'business-development']
	},
	{
		slug: 'platform-engineer',
		title: 'Platform Engineer',
		description: 'Builds and maintains internal developer platforms and tooling',
		components: [
			{ ssoc: '25232', weight: 0.4, rationale: 'IT infrastructure specialist' },
			{ ssoc: '25231', weight: 0.4, rationale: 'Cloud specialist' },
			{ ssoc: '25121', weight: 0.2, rationale: 'Software developer' }
		],
		tags: ['tech', 'engineering', 'infrastructure']
	},
	{
		slug: 'ux-designer',
		title: 'UX Designer',
		description: 'Designs user experiences through research, prototyping, and interaction design',
		components: [
			{ ssoc: '21664', weight: 0.6, rationale: 'Interaction designer' },
			{ ssoc: '21632', weight: 0.2, rationale: 'Product and industrial designer' },
			{ ssoc: '21670', weight: 0.2, rationale: 'Service designer' }
		],
		tags: ['design', 'tech', 'ux']
	}
];

function weightedMean(values: number[], weights: number[]): number {
	let sum = 0;
	let wSum = 0;
	for (let i = 0; i < values.length; i++) {
		sum += values[i] * weights[i];
		wSum += weights[i];
	}
	return wSum > 0 ? sum / wSum : 0;
}

function computeRiskBand(netRisk: number): RiskBand {
	if (netRisk < 0.05) return 'very_low';
	if (netRisk < 0.15) return 'low';
	if (netRisk < 0.25) return 'moderate';
	if (netRisk < 0.35) return 'high';
	return 'very_high';
}

function computeImpactType(exposure: number, bottleneck: number): ImpactType {
	if (exposure > 0.6 && bottleneck > 0.6) return 'ai_leveraged';
	if (exposure > 0.6 && bottleneck <= 0.6) return 'at_risk';
	if (exposure <= 0.4) return 'stable';
	return 'mixed';
}

function computeAugmentationBand(augmentation: number): AugmentationBand {
	if (augmentation >= 0.8) return 'very_high';
	if (augmentation >= 0.6) return 'high';
	if (augmentation >= 0.4) return 'moderate';
	if (augmentation >= 0.2) return 'low';
	return 'very_low';
}

export function computeRoleScores(
	role: SyntheticRole,
	occupationsBySSoc: Map<string, Occupation>
): ScoredRole {
	const resolvedComponents = role.components.map((c) => ({
		...c,
		occupation: occupationsBySSoc.get(c.ssoc) ?? null
	}));

	const validComponents = resolvedComponents.filter((c) => c.occupation !== null);

	if (validComponents.length === 0) {
		// Fallback: return neutral scores
		return {
			slug: role.slug,
			title: role.title,
			description: role.description,
			tags: role.tags,
			exposure: 0.5,
			bottleneck: 0.5,
			market_resilience: 0.5,
			net_risk: 0.25,
			risk_band: 'moderate',
			augmentation: 0.5,
			augmentation_band: 'moderate',
			impact_type: 'mixed',
			confidence: 'medium',
			components: resolvedComponents
		};
	}

	const exposures = validComponents.map((c) => c.occupation!.exposure);
	const bottlenecks = validComponents.map((c) => c.occupation!.bottleneck);
	const resiliences = validComponents.map((c) => c.occupation!.market.market_resilience);
	const augmentations = validComponents.map((c) => c.occupation!.augmentation);
	const weights = validComponents.map((c) => c.weight);

	const exposure = weightedMean(exposures, weights);
	const bottleneck = weightedMean(bottlenecks, weights);
	const market_resilience = weightedMean(resiliences, weights);
	const augmentation = weightedMean(augmentations, weights);

	// net_risk = exposure * (1 - bottleneck) * (1 - 0.35 * market_resilience)
	const net_risk = exposure * (1 - bottleneck) * (1 - 0.35 * market_resilience);
	const risk_band = computeRiskBand(net_risk);
	const impact_type = computeImpactType(exposure, bottleneck);
	const augmentation_band = computeAugmentationBand(augmentation);

	return {
		slug: role.slug,
		title: role.title,
		description: role.description,
		tags: role.tags,
		exposure,
		bottleneck,
		market_resilience,
		net_risk,
		risk_band,
		augmentation,
		augmentation_band,
		impact_type,
		confidence: 'medium',
		components: resolvedComponents
	};
}

export const syntheticRolesBySlug = new Map<string, SyntheticRole>(
	syntheticRoles.map((r) => [r.slug, r])
);
