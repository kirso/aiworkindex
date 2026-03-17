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
	},
	{
		slug: 'venture-capitalist',
		title: 'Venture Capitalist',
		description: 'Evaluates startups, manages fund portfolios, and drives investment decisions',
		components: [
			{ ssoc: '24133', weight: 0.4, rationale: 'Fund/Portfolio manager' },
			{ ssoc: '24131', weight: 0.3, rationale: 'Financial analyst' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' }
		],
		tags: ['finance', 'strategy']
	},
	{
		slug: 'solutions-engineer',
		title: 'Solutions Engineer',
		description: 'Bridges technical and commercial teams by designing solutions for customer needs',
		components: [
			{ ssoc: '24331', weight: 0.3, rationale: 'Technical sales professional' },
			{ ssoc: '25113', weight: 0.4, rationale: 'Enterprise/Solution architect' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['tech', 'sales', 'engineering']
	},
	{
		slug: 'operations-analyst',
		title: 'Operations Analyst',
		description: 'Optimizes business processes through data analysis and operational research',
		components: [
			{ ssoc: '21212', weight: 0.4, rationale: 'Operations research analyst' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '12112', weight: 0.3, rationale: 'Administration manager' }
		],
		tags: ['operations', 'data', 'strategy']
	},
	{
		slug: 'brand-manager',
		title: 'Brand Manager',
		description: 'Develops and executes brand strategy, positioning, and marketing campaigns',
		components: [
			{ ssoc: '12222', weight: 0.5, rationale: 'Marketing manager' },
			{ ssoc: '24314', weight: 0.3, rationale: 'Digital marketing professional' },
			{ ssoc: '24313', weight: 0.2, rationale: 'Marketing strategy/planning professional' }
		],
		tags: ['marketing', 'management', 'strategy']
	},
	{
		slug: 'community-manager',
		title: 'Community Manager',
		description: 'Builds and nurtures online and offline communities around a brand or product',
		components: [
			{ ssoc: '24314', weight: 0.4, rationale: 'Digital marketing professional' },
			{ ssoc: '26413', weight: 0.3, rationale: 'Content writer' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' }
		],
		tags: ['marketing', 'customer']
	},
	{
		slug: 'sales-engineer',
		title: 'Sales Engineer',
		description: 'Combines technical expertise with sales skills to sell complex technical products',
		components: [
			{ ssoc: '24331', weight: 0.4, rationale: 'Technical sales professional' },
			{ ssoc: '25113', weight: 0.3, rationale: 'Enterprise/Solution architect' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['tech', 'sales', 'engineering']
	},
	{
		slug: 'developer-advocate',
		title: 'Developer Advocate',
		description: 'Promotes developer tools through content, community engagement, and technical evangelism',
		components: [
			{ ssoc: '25121', weight: 0.4, rationale: 'Software developer' },
			{ ssoc: '26413', weight: 0.3, rationale: 'Content writer' },
			{ ssoc: '24314', weight: 0.3, rationale: 'Digital marketing professional' }
		],
		tags: ['tech', 'marketing', 'engineering']
	},
	{
		slug: 'investment-banker',
		title: 'Investment Banker',
		description: 'Advises on mergers, acquisitions, and capital markets transactions',
		components: [
			{ ssoc: '24133', weight: 0.4, rationale: 'Fund/Portfolio manager' },
			{ ssoc: '24131', weight: 0.4, rationale: 'Financial analyst' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' }
		],
		tags: ['finance', 'strategy']
	},
	{
		slug: 'partnerships-manager',
		title: 'Partnerships Manager',
		description: 'Develops and manages strategic business partnerships and alliance programs',
		components: [
			{ ssoc: '12212', weight: 0.4, rationale: 'Business development manager' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '12213', weight: 0.3, rationale: 'Regional sales manager' }
		],
		tags: ['business-development', 'management', 'strategy']
	},
	{
		slug: 'supply-chain-analyst',
		title: 'Supply Chain Analyst',
		description: 'Analyzes and optimizes supply chain operations, logistics, and inventory management',
		components: [
			{ ssoc: '13241', weight: 0.4, rationale: 'Supply and distribution/Logistics/Warehousing manager' },
			{ ssoc: '21212', weight: 0.3, rationale: 'Operations research analyst' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' }
		],
		tags: ['operations', 'data']
	},
	{
		slug: 'ml-engineer',
		title: 'ML Engineer',
		description: 'Builds, trains, and deploys machine learning models into production systems',
		components: [
			{ ssoc: '25220', weight: 0.4, rationale: 'Network, servers and computer systems administrator' },
			{ ssoc: '25121', weight: 0.4, rationale: 'Software developer' },
			{ ssoc: '25211', weight: 0.2, rationale: 'Database administrator' }
		],
		tags: ['tech', 'data', 'engineering']
	},
	{
		slug: 'technical-product-manager',
		title: 'Technical Product Manager',
		description: 'Manages product development with deep technical understanding and cross-functional coordination',
		components: [
			{ ssoc: '25112', weight: 0.4, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '12222', weight: 0.3, rationale: 'Marketing manager' }
		],
		tags: ['tech', 'management', 'strategy']
	},
	{
		slug: 'people-partner',
		title: 'People Partner',
		description: 'Partners with business leaders to align people strategy with organizational goals',
		components: [
			{ ssoc: '24231', weight: 0.4, rationale: 'Human resource consultant' },
			{ ssoc: '12121', weight: 0.3, rationale: 'Personnel/Human resource manager' },
			{ ssoc: '24233', weight: 0.3, rationale: 'Personnel/Human resource officer' }
		],
		tags: ['hr', 'management', 'strategy']
	},
	{
		slug: 'revops-manager',
		title: 'RevOps Manager',
		description: 'Aligns sales, marketing, and customer success operations to optimize revenue growth',
		components: [
			{ ssoc: '12211', weight: 0.3, rationale: 'Sales manager' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '25112', weight: 0.2, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '24111', weight: 0.2, rationale: 'Accountant' }
		],
		tags: ['operations', 'sales', 'management']
	},
	{
		slug: 'procurement-manager',
		title: 'Procurement Manager',
		description: 'Manages organizational purchasing, vendor relationships, and procurement strategy',
		components: [
			{ ssoc: '13242', weight: 0.6, rationale: 'Procurement/Purchasing manager' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' },
			{ ssoc: '24212', weight: 0.2, rationale: 'Business consultant' }
		],
		tags: ['operations', 'management']
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
