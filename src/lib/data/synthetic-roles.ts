import type { Occupation, RiskBand, ImpactType, AugmentationBand } from './index';
import {
	getRiskBand,
	classifyImpactType,
	AUGMENTATION_THRESHOLDS
} from './scoring-constants';
import {
	computeDemandResilience,
	computeHeadlineRisk,
	computeV6StructuralScores
} from './methodology-core';
import type { DerivedOverlayScores, WorkflowOverlay } from './workflow-overlay';
import {
	archetypeOverlayDefaults,
	computeContextAdjustment,
	computeDerivedScores,
	generateWorkflowNarrative
} from './workflow-overlay';
import { classifyArchetype } from './role-archetypes';
import { getVariantParent } from './role-taxonomy';

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

export type SyntheticEstimateType = 'modern_role' | 'gig' | 'founder' | 'independent';

export interface ScoredRole {
	slug: string;
	title: string;
	description: string;
	tags: string[];
	exposure: number;
	bottleneck: number;
	base_resilience: number;
	demand_signal_bonus: number;
	demand_resilience: number;
	displacement_pressure: number;
	market_resilience: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	confidence: 'high' | 'medium' | 'low';
	confidence_score: number;
	/** Standard deviation of component net_risk scores — measures estimate spread */
	dispersion: number;
	/** Risk range: [optimistic, pessimistic] based on component spread */
	risk_range: { optimistic: number; pessimistic: number };
	base_net_risk: number;
	context_adjustment: number;
	estimate_type: SyntheticEstimateType;
	variant_of: string | null;
	workflow_overlay: WorkflowOverlay | null;
	workflow_scores: DerivedOverlayScores | null;
	workflow_narrative: string | null;
	components: Array<{
		ssoc: string;
		weight: number;
		rationale: string;
		occupation: Occupation | null;
	}>;
}

const roleWorkflowOverrides: Partial<Record<string, WorkflowOverlay>> = {
	'product-manager': {
		creative_generation: 0.62,
		real_time_coordination: 0.82,
		ambiguity_tolerance: 0.86,
		institutional_knowledge: 0.72,
		relationship_intensity: 0.8,
		regulatory_weight: 0.15,
		physical_presence: 0.08,
		tool_velocity: 0.68
	},
	'technical-product-manager': {
		creative_generation: 0.58,
		real_time_coordination: 0.74,
		ambiguity_tolerance: 0.8,
		institutional_knowledge: 0.74,
		relationship_intensity: 0.66,
		regulatory_weight: 0.15,
		physical_presence: 0.06,
		tool_velocity: 0.82
	},
	'recruiter': {
		creative_generation: 0.28,
		real_time_coordination: 0.7,
		ambiguity_tolerance: 0.6,
		institutional_knowledge: 0.72,
		relationship_intensity: 0.9,
		regulatory_weight: 0.38,
		physical_presence: 0.18,
		tool_velocity: 0.48
	},
	'account-executive': {
		creative_generation: 0.26,
		real_time_coordination: 0.76,
		ambiguity_tolerance: 0.58,
		institutional_knowledge: 0.62,
		relationship_intensity: 0.95,
		regulatory_weight: 0.18,
		physical_presence: 0.2,
		tool_velocity: 0.52
	},
	'solutions-engineer': {
		creative_generation: 0.48,
		real_time_coordination: 0.72,
		ambiguity_tolerance: 0.7,
		institutional_knowledge: 0.66,
		relationship_intensity: 0.78,
		regulatory_weight: 0.22,
		physical_presence: 0.12,
		tool_velocity: 0.78
	},
	'growth-marketer': {
		creative_generation: 0.5,
		real_time_coordination: 0.46,
		ambiguity_tolerance: 0.62,
		institutional_knowledge: 0.46,
		relationship_intensity: 0.55,
		regulatory_weight: 0.12,
		physical_presence: 0.08,
		tool_velocity: 0.86
	},
	'people-partner': {
		creative_generation: 0.32,
		real_time_coordination: 0.7,
		ambiguity_tolerance: 0.62,
		institutional_knowledge: 0.76,
		relationship_intensity: 0.88,
		regulatory_weight: 0.45,
		physical_presence: 0.18,
		tool_velocity: 0.44
	},
	'revops-manager': {
		creative_generation: 0.34,
		real_time_coordination: 0.68,
		ambiguity_tolerance: 0.6,
		institutional_knowledge: 0.68,
		relationship_intensity: 0.58,
		regulatory_weight: 0.28,
		physical_presence: 0.08,
		tool_velocity: 0.72
	},
	'startup-founder': {
		creative_generation: 0.72,
		real_time_coordination: 0.88,
		ambiguity_tolerance: 0.92,
		institutional_knowledge: 0.8,
		relationship_intensity: 0.9,
		regulatory_weight: 0.22,
		physical_presence: 0.15,
		tool_velocity: 0.78
	},
	'delivery-rider': {
		creative_generation: 0.04,
		real_time_coordination: 0.52,
		ambiguity_tolerance: 0.22,
		institutional_knowledge: 0.26,
		relationship_intensity: 0.18,
		regulatory_weight: 0.3,
		physical_presence: 0.96,
		tool_velocity: 0.28
	},
	'ride-hail-driver': {
		creative_generation: 0.05,
		real_time_coordination: 0.56,
		ambiguity_tolerance: 0.24,
		institutional_knowledge: 0.3,
		relationship_intensity: 0.42,
		regulatory_weight: 0.34,
		physical_presence: 0.95,
		tool_velocity: 0.3
	},
	'freelance-designer': {
		creative_generation: 0.92,
		real_time_coordination: 0.38,
		ambiguity_tolerance: 0.82,
		institutional_knowledge: 0.44,
		relationship_intensity: 0.58,
		regulatory_weight: 0.08,
		physical_presence: 0.1,
		tool_velocity: 0.88
	},
	'content-creator': {
		creative_generation: 0.94,
		real_time_coordination: 0.36,
		ambiguity_tolerance: 0.84,
		institutional_knowledge: 0.34,
		relationship_intensity: 0.64,
		regulatory_weight: 0.06,
		physical_presence: 0.08,
		tool_velocity: 0.9
	},
	'e-commerce-seller': {
		creative_generation: 0.4,
		real_time_coordination: 0.54,
		ambiguity_tolerance: 0.56,
		institutional_knowledge: 0.52,
		relationship_intensity: 0.52,
		regulatory_weight: 0.24,
		physical_presence: 0.16,
		tool_velocity: 0.74
	},
	'virtual-assistant': {
		creative_generation: 0.14,
		real_time_coordination: 0.46,
		ambiguity_tolerance: 0.32,
		institutional_knowledge: 0.6,
		relationship_intensity: 0.5,
		regulatory_weight: 0.24,
		physical_presence: 0.08,
		tool_velocity: 0.58
	}
};

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
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' }
		],
		tags: ['sales', 'customer', 'management']
	},
	{
		slug: 'account-executive',
		title: 'Account Executive',
		description: 'Manages the full sales cycle from prospecting to closing deals',
		components: [
			{ ssoc: '24331', weight: 0.5, rationale: 'Technical sales professional' },
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
			{ ssoc: '21212', weight: 0.4, rationale: 'Operations research analyst' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '33461', weight: 0.3, rationale: 'Logistics planner' }
		],
		tags: ['operations', 'data']
	},
	{
		slug: 'ml-engineer',
		title: 'ML Engineer',
		description: 'Builds, trains, and deploys machine learning models into production systems',
		components: [
			{ ssoc: '21222', weight: 0.4, rationale: 'Data scientist' },
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
	},
	// --- Expansion batch ---
	{
		slug: 'frontend-engineer',
		title: 'Frontend Engineer',
		description: 'Builds user interfaces and client-side applications using web technologies',
		components: [
			{ ssoc: '25122', weight: 0.5, rationale: 'Web and mobile applications developer' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '21664', weight: 0.2, rationale: 'Interaction designer' }
		],
		tags: ['tech', 'engineering']
	},
	{
		slug: 'backend-engineer',
		title: 'Backend Engineer',
		description: 'Designs and builds server-side systems, APIs, and data infrastructure',
		components: [
			{ ssoc: '25121', weight: 0.5, rationale: 'Software developer' },
			{ ssoc: '25212', weight: 0.3, rationale: 'Database architect' },
			{ ssoc: '25220', weight: 0.2, rationale: 'Network, servers and computer systems administrator' }
		],
		tags: ['tech', 'engineering']
	},
	{
		slug: 'full-stack-developer',
		title: 'Full-Stack Developer',
		description: 'Works across frontend and backend to deliver complete web applications',
		components: [
			{ ssoc: '25121', weight: 0.4, rationale: 'Software developer' },
			{ ssoc: '25122', weight: 0.4, rationale: 'Web and mobile applications developer' },
			{ ssoc: '25211', weight: 0.2, rationale: 'Database administrator' }
		],
		tags: ['tech', 'engineering']
	},
	{
		slug: 'mobile-engineer',
		title: 'Mobile Engineer',
		description: 'Develops native and cross-platform mobile applications for iOS and Android',
		components: [
			{ ssoc: '25122', weight: 0.5, rationale: 'Web and mobile applications developer' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '25123', weight: 0.2, rationale: 'Multimedia (including games) developer' }
		],
		tags: ['tech', 'engineering']
	},
	{
		slug: 'security-engineer',
		title: 'Security Engineer',
		description: 'Protects systems and data through security architecture, testing, and incident response',
		components: [
			{ ssoc: '25152', weight: 0.4, rationale: 'ICT auditor' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '25232', weight: 0.3, rationale: 'IT infrastructure specialist' }
		],
		tags: ['tech', 'engineering', 'security']
	},
	{
		slug: 'site-reliability-engineer',
		title: 'Site Reliability Engineer',
		description: 'Ensures system reliability, performance, and scalability through automation and monitoring',
		components: [
			{ ssoc: '25232', weight: 0.4, rationale: 'IT infrastructure specialist' },
			{ ssoc: '25231', weight: 0.3, rationale: 'Cloud specialist' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['tech', 'engineering', 'infrastructure']
	},
	{
		slug: 'engineering-manager',
		title: 'Engineering Manager',
		description: 'Leads engineering teams, manages delivery, and drives technical strategy',
		components: [
			{ ssoc: '13302', weight: 0.4, rationale: 'Software and applications manager' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '24213', weight: 0.3, rationale: 'Business and financial project management professional' }
		],
		tags: ['tech', 'management', 'engineering']
	},
	{
		slug: 'startup-cto',
		title: 'Startup CTO',
		description: 'Sets technical vision, builds engineering team, and makes architecture decisions at an early-stage company',
		components: [
			{ ssoc: '13302', weight: 0.4, rationale: 'Software and applications manager' },
			{ ssoc: '25113', weight: 0.3, rationale: 'Enterprise/Solution architect' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['tech', 'management', 'strategy']
	},
	{
		slug: 'growth-marketer',
		title: 'Growth Marketer',
		description: 'Drives user acquisition and retention through data-driven experimentation and channel optimization',
		components: [
			{ ssoc: '24314', weight: 0.4, rationale: 'Digital marketing professional' },
			{ ssoc: '24313', weight: 0.3, rationale: 'Marketing strategy/planning professional' },
			{ ssoc: '24312', weight: 0.3, rationale: 'Market research analyst' }
		],
		tags: ['marketing', 'data']
	},
	{
		slug: 'content-strategist',
		title: 'Content Strategist',
		description: 'Plans, creates, and governs content across channels to achieve business objectives',
		components: [
			{ ssoc: '26413', weight: 0.4, rationale: 'Content writer' },
			{ ssoc: '24314', weight: 0.3, rationale: 'Digital marketing professional' },
			{ ssoc: '24313', weight: 0.3, rationale: 'Marketing strategy/planning professional' }
		],
		tags: ['marketing', 'content']
	},
	{
		slug: 'policy-analyst',
		title: 'Policy Analyst',
		description: 'Researches, evaluates, and recommends public or organizational policy',
		components: [
			{ ssoc: '24212', weight: 0.4, rationale: 'Business consultant' },
			{ ssoc: '21212', weight: 0.3, rationale: 'Operations research analyst' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' }
		],
		tags: ['government', 'strategy']
	},
	{
		slug: 'chief-of-staff',
		title: 'Chief of Staff',
		description: 'Supports executive leadership with strategic initiatives, cross-functional coordination, and operations',
		components: [
			{ ssoc: '12112', weight: 0.4, rationale: 'Administration manager' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '24213', weight: 0.3, rationale: 'Business and financial project management professional' }
		],
		tags: ['management', 'strategy', 'operations']
	},
	{
		slug: 'founder-associate',
		title: 'Founder Associate',
		description: 'Supports startup founders across strategy, operations, fundraising, and product',
		components: [
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '12212', weight: 0.3, rationale: 'Business development manager' },
			{ ssoc: '24212', weight: 0.2, rationale: 'Business consultant' },
			{ ssoc: '24131', weight: 0.2, rationale: 'Financial analyst' }
		],
		tags: ['strategy', 'operations', 'startup']
	},
	{
		slug: 'quant-researcher',
		title: 'Quant Researcher',
		description: 'Develops quantitative models and strategies for trading, risk, or pricing',
		components: [
			{ ssoc: '21212', weight: 0.4, rationale: 'Operations research analyst' },
			{ ssoc: '24131', weight: 0.3, rationale: 'Financial analyst' },
			{ ssoc: '24133', weight: 0.3, rationale: 'Fund/Portfolio manager' }
		],
		tags: ['finance', 'data', 'engineering']
	},
	{
		slug: 'private-equity-associate',
		title: 'Private Equity Associate',
		description: 'Evaluates deals, builds financial models, and supports portfolio companies',
		components: [
			{ ssoc: '24131', weight: 0.4, rationale: 'Financial analyst' },
			{ ssoc: '24133', weight: 0.3, rationale: 'Fund/Portfolio manager' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' }
		],
		tags: ['finance', 'strategy']
	},
	{
		slug: 'fpa-analyst',
		title: 'FP&A Analyst',
		description: 'Drives financial planning, budgeting, forecasting, and business performance analysis',
		components: [
			{ ssoc: '24131', weight: 0.4, rationale: 'Financial analyst' },
			{ ssoc: '24111', weight: 0.4, rationale: 'Accountant' },
			{ ssoc: '24212', weight: 0.2, rationale: 'Business consultant' }
		],
		tags: ['finance', 'data']
	},
	{
		slug: 'treasury-analyst',
		title: 'Treasury Analyst',
		description: 'Manages cash flow, liquidity, and financial risk for organizations',
		components: [
			{ ssoc: '24134', weight: 0.5, rationale: 'Treasury manager' },
			{ ssoc: '24131', weight: 0.3, rationale: 'Financial analyst' },
			{ ssoc: '24111', weight: 0.2, rationale: 'Accountant' }
		],
		tags: ['finance']
	},
	{
		slug: 'compliance-officer',
		title: 'Compliance Officer',
		description: 'Ensures organizational adherence to laws, regulations, and internal policies',
		components: [
			{ ssoc: '24132', weight: 0.6, rationale: 'Compliance officer/Risk analyst' },
			{ ssoc: '26112', weight: 0.25, rationale: 'In-house legal counsel' },
			{ ssoc: '24211', weight: 0.15, rationale: 'Management consultant' }
		],
		tags: ['legal', 'finance']
	},
	{
		slug: 'game-developer',
		title: 'Game Developer',
		description: 'Creates interactive games across platforms using game engines and programming',
		components: [
			{ ssoc: '25123', weight: 0.5, rationale: 'Multimedia (including games) developer' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '21664', weight: 0.2, rationale: 'Interaction designer' }
		],
		tags: ['tech', 'creative', 'engineering']
	},
	{
		slug: 'qa-engineer',
		title: 'QA Engineer',
		description: 'Tests software quality through manual and automated testing strategies',
		components: [
			{ ssoc: '25151', weight: 0.5, rationale: 'ICT quality assurance specialist' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' },
			{ ssoc: '25112', weight: 0.2, rationale: 'ICT business process consultant/Business analyst' }
		],
		tags: ['tech', 'engineering']
	},
	{
		slug: 'systems-analyst',
		title: 'Systems Analyst',
		description: 'Analyzes business requirements and designs IT system solutions',
		components: [
			{ ssoc: '25111', weight: 0.5, rationale: 'Systems designer/analyst' },
			{ ssoc: '25112', weight: 0.3, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '25113', weight: 0.2, rationale: 'Enterprise/Solution architect' }
		],
		tags: ['tech', 'strategy']
	},
	{
		slug: 'financial-adviser',
		title: 'Financial Adviser',
		description: 'Provides personalized financial planning and investment advice to clients',
		components: [
			{ ssoc: '24121', weight: 0.5, rationale: 'Financial/Investment adviser' },
			{ ssoc: '24131', weight: 0.3, rationale: 'Financial analyst' },
			{ ssoc: '24133', weight: 0.2, rationale: 'Fund/Portfolio manager' }
		],
		tags: ['finance', 'customer']
	},
	{
		slug: 'insurance-underwriter',
		title: 'Insurance Underwriter',
		description: 'Evaluates risk and determines insurance policy terms and premiums',
		components: [
			{ ssoc: '24160', weight: 0.6, rationale: 'Insurance underwriter' },
			{ ssoc: '24132', weight: 0.2, rationale: 'Compliance officer/Risk analyst' },
			{ ssoc: '24131', weight: 0.2, rationale: 'Financial analyst' }
		],
		tags: ['finance', 'insurance']
	},
	{
		slug: 'auditor',
		title: 'Auditor',
		description: 'Examines financial records and processes for accuracy and regulatory compliance',
		components: [
			{ ssoc: '24112', weight: 0.6, rationale: 'Auditor (accounting)' },
			{ ssoc: '24111', weight: 0.2, rationale: 'Accountant' },
			{ ssoc: '24132', weight: 0.2, rationale: 'Compliance officer/Risk analyst' }
		],
		tags: ['finance', 'legal']
	},
	// --- Expansion batch 2: reach 75+ roles ---
	{
		slug: 'data-analyst',
		title: 'Data Analyst',
		description: 'Analyzes data to extract insights and inform business decisions',
		components: [
			{ ssoc: '21212', weight: 0.4, rationale: 'Operations research analyst' },
			{ ssoc: '24312', weight: 0.3, rationale: 'Market research analyst' },
			{ ssoc: '25112', weight: 0.3, rationale: 'ICT business process consultant/Business analyst' }
		],
		tags: ['data', 'strategy']
	},
	{
		slug: 'data-scientist',
		title: 'Data Scientist',
		description: 'Applies statistical methods and machine learning to solve complex analytical problems',
		components: [
			{ ssoc: '21212', weight: 0.4, rationale: 'Operations research analyst' },
			{ ssoc: '21213', weight: 0.3, rationale: 'Statistician' },
			{ ssoc: '25121', weight: 0.3, rationale: 'Software developer' }
		],
		tags: ['data', 'engineering']
	},
	{
		slug: 'business-analyst',
		title: 'Business Analyst',
		description: 'Bridges business needs and technology solutions through requirements analysis',
		components: [
			{ ssoc: '25112', weight: 0.5, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' }
		],
		tags: ['strategy', 'tech']
	},
	{
		slug: 'management-consultant',
		title: 'Management Consultant',
		description: 'Advises organizations on strategy, operations, and organizational improvement',
		components: [
			{ ssoc: '24211', weight: 0.5, rationale: 'Management consultant' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' },
			{ ssoc: '24213', weight: 0.2, rationale: 'Business and financial project management professional' }
		],
		tags: ['strategy', 'management']
	},
	{
		slug: 'scrum-master',
		title: 'Scrum Master',
		description: 'Facilitates agile development processes and removes team impediments',
		components: [
			{ ssoc: '24213', weight: 0.5, rationale: 'Business and financial project management professional' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '12112', weight: 0.2, rationale: 'Administration manager' }
		],
		tags: ['management', 'tech']
	},
	{
		slug: 'technical-writer',
		title: 'Technical Writer',
		description: 'Creates documentation, guides, and knowledge base articles for technical products',
		components: [
			{ ssoc: '26413', weight: 0.5, rationale: 'Content writer' },
			{ ssoc: '25112', weight: 0.3, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '25121', weight: 0.2, rationale: 'Software developer' }
		],
		tags: ['content', 'tech']
	},
	{
		slug: 'seo-specialist',
		title: 'SEO Specialist',
		description: 'Optimizes web content and technical infrastructure for search engine visibility',
		components: [
			{ ssoc: '24314', weight: 0.5, rationale: 'Digital marketing professional' },
			{ ssoc: '24312', weight: 0.3, rationale: 'Market research analyst' },
			{ ssoc: '26413', weight: 0.2, rationale: 'Content writer' }
		],
		tags: ['marketing', 'data']
	},
	{
		slug: 'social-media-manager',
		title: 'Social Media Manager',
		description: 'Manages brand presence across social platforms through content and engagement',
		components: [
			{ ssoc: '24314', weight: 0.5, rationale: 'Digital marketing professional' },
			{ ssoc: '26413', weight: 0.3, rationale: 'Content writer' },
			{ ssoc: '12222', weight: 0.2, rationale: 'Marketing manager' }
		],
		tags: ['marketing', 'content']
	},
	{
		slug: 'product-designer',
		title: 'Product Designer',
		description: 'Designs end-to-end product experiences combining UX research, visual design, and prototyping',
		components: [
			{ ssoc: '21664', weight: 0.4, rationale: 'Interaction designer' },
			{ ssoc: '21632', weight: 0.3, rationale: 'Product and industrial designer' },
			{ ssoc: '21670', weight: 0.3, rationale: 'Service designer' }
		],
		tags: ['design', 'product']
	},
	{
		slug: 'graphic-designer',
		title: 'Graphic Designer',
		description: 'Creates visual content for branding, marketing, and digital products',
		components: [
			{ ssoc: '21632', weight: 0.6, rationale: 'Product and industrial designer' },
			{ ssoc: '21664', weight: 0.4, rationale: 'Interaction designer' }
		],
		tags: ['design', 'creative']
	},
	{
		slug: 'cloud-architect',
		title: 'Cloud Architect',
		description: 'Designs and oversees cloud infrastructure, migration strategies, and platform architecture',
		components: [
			{ ssoc: '25231', weight: 0.4, rationale: 'Cloud specialist' },
			{ ssoc: '25113', weight: 0.4, rationale: 'Enterprise/Solution architect' },
			{ ssoc: '25232', weight: 0.2, rationale: 'IT infrastructure specialist' }
		],
		tags: ['tech', 'infrastructure']
	},
	{
		slug: 'it-manager',
		title: 'IT Manager',
		description: 'Manages IT operations, infrastructure, and technical teams',
		components: [
			{ ssoc: '13210', weight: 0.5, rationale: 'ICT/Technology manager' },
			{ ssoc: '25232', weight: 0.3, rationale: 'IT infrastructure specialist' },
			{ ssoc: '12112', weight: 0.2, rationale: 'Administration manager' }
		],
		tags: ['tech', 'management']
	},
	{
		slug: 'database-administrator',
		title: 'Database Administrator',
		description: 'Manages, maintains, and optimizes database systems for performance and security',
		components: [
			{ ssoc: '25211', weight: 0.5, rationale: 'Database administrator' },
			{ ssoc: '25212', weight: 0.3, rationale: 'Database architect' },
			{ ssoc: '25220', weight: 0.2, rationale: 'Network, servers and computer systems administrator' }
		],
		tags: ['tech', 'data']
	},
	{
		slug: 'network-engineer',
		title: 'Network Engineer',
		description: 'Designs, implements, and maintains computer network infrastructure',
		components: [
			{ ssoc: '25220', weight: 0.5, rationale: 'Network, servers and computer systems administrator' },
			{ ssoc: '25232', weight: 0.3, rationale: 'IT infrastructure specialist' },
			{ ssoc: '25231', weight: 0.2, rationale: 'Cloud specialist' }
		],
		tags: ['tech', 'infrastructure']
	},
	{
		slug: 'business-development-manager',
		title: 'Business Development Manager',
		description: 'Identifies growth opportunities and builds strategic relationships to drive revenue',
		components: [
			{ ssoc: '12212', weight: 0.5, rationale: 'Business development manager' },
			{ ssoc: '12211', weight: 0.3, rationale: 'Sales manager' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' }
		],
		tags: ['sales', 'strategy']
	},
	{
		slug: 'marketing-manager',
		title: 'Marketing Manager',
		description: 'Leads marketing strategy, campaigns, and team execution',
		components: [
			{ ssoc: '12222', weight: 0.5, rationale: 'Marketing manager' },
			{ ssoc: '24313', weight: 0.3, rationale: 'Marketing strategy/planning professional' },
			{ ssoc: '24314', weight: 0.2, rationale: 'Digital marketing professional' }
		],
		tags: ['marketing', 'management']
	},
	{
		slug: 'sales-manager',
		title: 'Sales Manager',
		description: 'Leads sales teams, sets targets, and drives revenue performance',
		components: [
			{ ssoc: '12211', weight: 0.5, rationale: 'Sales manager' },
			{ ssoc: '12213', weight: 0.3, rationale: 'Regional sales manager' },
			{ ssoc: '12212', weight: 0.2, rationale: 'Business development manager' }
		],
		tags: ['sales', 'management']
	},
	{
		slug: 'customer-support-specialist',
		title: 'Customer Support Specialist',
		description: 'Resolves customer issues through technical troubleshooting and service excellence',
		components: [
			{ ssoc: '12241', weight: 0.4, rationale: 'Customer service manager' },
			{ ssoc: '33491', weight: 0.3, rationale: 'Management executive' },
			{ ssoc: '24212', weight: 0.3, rationale: 'Business consultant' }
		],
		tags: ['customer', 'operations']
	},
	{
		slug: 'hr-manager',
		title: 'HR Manager',
		description: 'Oversees HR operations, policies, and employee relations',
		components: [
			{ ssoc: '12121', weight: 0.5, rationale: 'Personnel/Human resource manager' },
			{ ssoc: '24231', weight: 0.3, rationale: 'Human resource consultant' },
			{ ssoc: '24233', weight: 0.2, rationale: 'Personnel/Human resource officer' }
		],
		tags: ['people', 'management']
	},
	{
		slug: 'talent-acquisition-lead',
		title: 'Talent Acquisition Lead',
		description: 'Leads recruitment strategy and hiring processes across the organization',
		components: [
			{ ssoc: '24232', weight: 0.4, rationale: 'Executive search consultant' },
			{ ssoc: '12121', weight: 0.3, rationale: 'Personnel/Human resource manager' },
			{ ssoc: '24233', weight: 0.3, rationale: 'Personnel/Human resource officer' }
		],
		tags: ['people', 'management']
	},
	{
		slug: 'legal-counsel',
		title: 'Legal Counsel',
		description: 'Provides in-house legal advice on contracts, compliance, and corporate matters',
		components: [
			{ ssoc: '26112', weight: 0.7, rationale: 'In-house legal counsel' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' },
			{ ssoc: '24132', weight: 0.1, rationale: 'Compliance officer/Risk analyst' }
		],
		tags: ['legal', 'strategy']
	},
	{
		slug: 'finance-manager',
		title: 'Finance Manager',
		description: 'Oversees financial operations, reporting, and strategic financial planning',
		components: [
			{ ssoc: '12111', weight: 0.4, rationale: 'Budgeting and financial accounting manager' },
			{ ssoc: '24111', weight: 0.3, rationale: 'Accountant' },
			{ ssoc: '24131', weight: 0.3, rationale: 'Financial analyst' }
		],
		tags: ['finance', 'management']
	},
	{
		slug: 'accountant',
		title: 'Accountant',
		description: 'Manages financial records, tax compliance, and financial reporting',
		components: [
			{ ssoc: '24111', weight: 0.6, rationale: 'Accountant' },
			{ ssoc: '24112', weight: 0.2, rationale: 'Auditor (accounting)' },
			{ ssoc: '24113', weight: 0.2, rationale: 'Tax accountant' }
		],
		tags: ['finance']
	},
	{
		slug: 'executive-assistant',
		title: 'Executive Assistant',
		description: 'Provides high-level administrative support to senior leadership',
		components: [
			{ ssoc: '33491', weight: 0.4, rationale: 'Management executive' },
			{ ssoc: '41201', weight: 0.3, rationale: 'Secretary/PA' },
			{ ssoc: '12112', weight: 0.3, rationale: 'Administration manager' }
		],
		tags: ['operations', 'management']
	},
	{
		slug: 'office-manager',
		title: 'Office Manager',
		description: 'Manages office operations, facilities, and administrative staff',
		components: [
			{ ssoc: '12112', weight: 0.5, rationale: 'Administration manager' },
			{ ssoc: '33491', weight: 0.3, rationale: 'Management executive' },
			{ ssoc: '41201', weight: 0.2, rationale: 'Secretary/PA' }
		],
		tags: ['operations', 'management']
	},
	{
		slug: 'event-manager',
		title: 'Event Manager',
		description: 'Plans and executes corporate events, conferences, and experiential marketing',
		components: [
			{ ssoc: '12222', weight: 0.4, rationale: 'Marketing manager' },
			{ ssoc: '24213', weight: 0.3, rationale: 'Business and financial project management professional' },
			{ ssoc: '12112', weight: 0.3, rationale: 'Administration manager' }
		],
		tags: ['marketing', 'operations']
	},
	// --- Expansion batch 3: AI & security roles ---
	{
		slug: 'ai-engineer',
		title: 'AI Engineer',
		description:
			'Builds and deploys AI/ML systems in production — model training, inference pipelines, and MLOps',
		components: [
			{ ssoc: '21222', weight: 0.4, rationale: 'Data scientist' },
			{ ssoc: '25121', weight: 0.4, rationale: 'Software developer' },
			{ ssoc: '25113', weight: 0.2, rationale: 'Enterprise/Solution architect' }
		],
		tags: ['tech', 'data', 'engineering']
	},
	{
		slug: 'prompt-engineer',
		title: 'Prompt Engineer',
		description:
			'Designs, tests, and optimizes prompts and AI system interactions for production applications',
		components: [
			{ ssoc: '25121', weight: 0.4, rationale: 'Software developer' },
			{ ssoc: '21222', weight: 0.3, rationale: 'Data scientist' },
			{ ssoc: '26413', weight: 0.3, rationale: 'Content writer' }
		],
		tags: ['tech', 'data', 'content']
	},
	{
		slug: 'ai-product-manager',
		title: 'AI Product Manager',
		description:
			'Manages AI-powered product features — bridges ML capabilities with user needs and business goals',
		components: [
			{ ssoc: '25112', weight: 0.3, rationale: 'ICT business process consultant/Business analyst' },
			{ ssoc: '12222', weight: 0.3, rationale: 'Marketing manager' },
			{ ssoc: '21222', weight: 0.2, rationale: 'Data scientist' },
			{ ssoc: '24211', weight: 0.2, rationale: 'Management consultant' }
		],
		tags: ['tech', 'management', 'strategy']
	},
	{
		slug: 'data-architect',
		title: 'Data Architect',
		description: 'Designs data infrastructure, schemas, and pipelines for enterprise data systems',
		components: [
			{ ssoc: '25212', weight: 0.4, rationale: 'Database architect' },
			{ ssoc: '25211', weight: 0.3, rationale: 'Database administrator' },
			{ ssoc: '25113', weight: 0.3, rationale: 'Enterprise/Solution architect' }
		],
		tags: ['tech', 'data', 'engineering']
	},
	{
		slug: 'it-security-manager',
		title: 'IT Security Manager',
		description:
			'Manages cybersecurity strategy, incident response, and security infrastructure',
		components: [
			{ ssoc: '25152', weight: 0.4, rationale: 'ICT auditor' },
			{ ssoc: '25232', weight: 0.3, rationale: 'IT infrastructure specialist' },
			{ ssoc: '13301', weight: 0.3, rationale: 'CIO/CTO/CSO' }
		],
		tags: ['tech', 'management', 'security']
	},
	// --- Gig Economy & Platform Workers ---
	{
		slug: 'delivery-rider',
		title: 'Delivery Rider',
		description:
			'Platform delivery worker (Grab, Foodpanda) — transports food and parcels via motorcycle or bicycle',
		components: [
			{ ssoc: '83211', weight: 0.5, rationale: 'Motorcycle delivery man' },
			{ ssoc: '83212', weight: 0.3, rationale: 'Delivery man using motorised PMDs' },
			{ ssoc: '33461', weight: 0.2, rationale: 'Logistics/Production planner' }
		],
		tags: ['gig', 'logistics', 'platform']
	},
	{
		slug: 'ride-hail-driver',
		title: 'Ride-Hail Driver',
		description:
			'Platform driver (Grab, Gojek, Tada) — provides passenger transport via private hire vehicle',
		components: [
			{ ssoc: '83223', weight: 0.6, rationale: 'Van driver (closest to private hire)' },
			{ ssoc: '83311', weight: 0.2, rationale: 'Bus driver' },
			{ ssoc: '83211', weight: 0.2, rationale: 'Motorcycle delivery man' }
		],
		tags: ['gig', 'transport', 'platform']
	},
	{
		slug: 'freelance-designer',
		title: 'Freelance Designer',
		description: 'Independent visual/graphic designer working on contract or platform basis',
		components: [
			{ ssoc: '21661', weight: 0.5, rationale: 'Graphic designer' },
			{ ssoc: '21662', weight: 0.3, rationale: 'Multimedia (including games) designer' },
			{ ssoc: '21663', weight: 0.2, rationale: 'Multimedia artist and animator' }
		],
		tags: ['gig', 'creative', 'design']
	},
	// --- Entrepreneurial Roles ---
	{
		slug: 'startup-founder',
		title: 'Startup Founder / CEO',
		description:
			'Founder of an early-stage company — wears multiple hats across product, sales, fundraising, and operations',
		components: [
			{ ssoc: '11201', weight: 0.3, rationale: 'Managing director/CEO' },
			{ ssoc: '12222', weight: 0.2, rationale: 'Marketing manager' },
			{ ssoc: '25112', weight: 0.2, rationale: 'ICT business process consultant' },
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' }
		],
		tags: ['startup', 'management', 'strategy']
	},
	{
		slug: 'e-commerce-seller',
		title: 'E-Commerce Seller',
		description:
			'Independent online retailer (Shopee, Lazada, own site) — manages products, marketing, fulfilment',
		components: [
			{ ssoc: '33224', weight: 0.4, rationale: 'Online sales channel executive' },
			{ ssoc: '24314', weight: 0.3, rationale: 'Digital marketing professional' },
			{ ssoc: '13241', weight: 0.3, rationale: 'Supply and distribution/Logistics manager' }
		],
		tags: ['startup', 'sales', 'marketing']
	},
	// --- Emerging / Green Economy ---
	{
		slug: 'sustainability-manager',
		title: 'Sustainability Manager',
		description:
			'Leads ESG strategy, carbon reporting, and sustainability initiatives for organizations',
		components: [
			{ ssoc: '24211', weight: 0.3, rationale: 'Management consultant' },
			{ ssoc: '21311', weight: 0.3, rationale: 'Environmental engineer' },
			{ ssoc: '12191', weight: 0.2, rationale: 'Research and development manager' },
			{ ssoc: '12212', weight: 0.2, rationale: 'Business development manager' }
		],
		tags: ['management', 'strategy', 'sustainability']
	},
	// --- Creator Economy ---
	{
		slug: 'content-creator',
		title: 'Content Creator',
		description:
			'Creates video, written, or multimedia content for social platforms (YouTube, TikTok, Instagram)',
		components: [
			{ ssoc: '26421', weight: 0.3, rationale: 'Journalist' },
			{ ssoc: '21662', weight: 0.3, rationale: 'Multimedia designer' },
			{ ssoc: '24314', weight: 0.2, rationale: 'Digital marketing professional' },
			{ ssoc: '34310', weight: 0.2, rationale: 'Photographer' }
		],
		tags: ['creative', 'content', 'marketing']
	},
	{
		slug: 'virtual-assistant',
		title: 'Virtual Assistant',
		description:
			'Remote administrative and coordination support — scheduling, email, research, data entry',
		components: [
			{ ssoc: '41201', weight: 0.4, rationale: 'Secretary' },
			{ ssoc: '41101', weight: 0.3, rationale: 'General office clerk' },
			{ ssoc: '33491', weight: 0.3, rationale: 'Management executive' }
		],
		tags: ['gig', 'operations', 'admin']
	}
];


function weightedMeanWithCoverage(
	values: number[],
	weights: number[],
	totalConfiguredWeight: number,
	fallbackValue: number = 0.5
): number {
	const observedWeight = weights.reduce((sum, weight) => sum + weight, 0);
	const missingWeight = Math.max(0, totalConfiguredWeight - observedWeight);
	const numerator = values.reduce((sum, value, index) => sum + value * weights[index]!, 0);
	const denominator = observedWeight + missingWeight;
	return denominator > 0 ? (numerator + fallbackValue * missingWeight) / denominator : fallbackValue;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function inferEstimateType(role: SyntheticRole): SyntheticEstimateType {
	if (role.slug.includes('founder')) return 'founder';
	if (role.tags.some(tag => tag === 'gig' || tag === 'platform')) return 'gig';
	if (
		role.slug.includes('freelance') ||
		role.slug.includes('creator') ||
		role.slug.includes('seller') ||
		role.slug.includes('assistant')
	) {
		return 'independent';
	}
	return 'modern_role';
}

function resolveComponentOverlay(occupation: Occupation): WorkflowOverlay | null {
	if (occupation.workflow_overlay) return occupation.workflow_overlay;
	const archetype = classifyArchetype(occupation.ssoc, occupation.title, occupation.major_group);
	return archetypeOverlayDefaults[archetype] ?? null;
}

function blendWorkflowOverlays(
	overlays: Array<{ overlay: WorkflowOverlay; weight: number }>
): WorkflowOverlay | null {
	if (overlays.length === 0) return null;
	const totalWeight = overlays.reduce((sum, item) => sum + item.weight, 0);
	if (totalWeight <= 0) return null;

	const valueFor = (dimension: keyof WorkflowOverlay) =>
		overlays.reduce(
			(sum, item) => sum + item.overlay[dimension] * (item.weight / totalWeight),
			0
		);

	return {
		creative_generation: valueFor('creative_generation'),
		real_time_coordination: valueFor('real_time_coordination'),
		ambiguity_tolerance: valueFor('ambiguity_tolerance'),
		institutional_knowledge: valueFor('institutional_knowledge'),
		relationship_intensity: valueFor('relationship_intensity'),
		regulatory_weight: valueFor('regulatory_weight'),
		physical_presence: valueFor('physical_presence'),
		tool_velocity: valueFor('tool_velocity')
	};
}

function blendWorkflowOverride(
	base: WorkflowOverlay,
	override: WorkflowOverlay,
	overrideWeight: number = 0.65
): WorkflowOverlay {
	const valueFor = (dimension: keyof WorkflowOverlay) =>
		base[dimension] * (1 - overrideWeight) + override[dimension] * overrideWeight;

	return {
		creative_generation: valueFor('creative_generation'),
		real_time_coordination: valueFor('real_time_coordination'),
		ambiguity_tolerance: valueFor('ambiguity_tolerance'),
		institutional_knowledge: valueFor('institutional_knowledge'),
		relationship_intensity: valueFor('relationship_intensity'),
		regulatory_weight: valueFor('regulatory_weight'),
		physical_presence: valueFor('physical_presence'),
		tool_velocity: valueFor('tool_velocity')
	};
}

function buildRoleWorkflowMeta(
	role: SyntheticRole,
	validComponents: Array<{
		ssoc: string;
		weight: number;
		rationale: string;
		occupation: Occupation;
	}>
) {
	const componentOverlay = blendWorkflowOverlays(
		validComponents
			.map(component => {
				const overlay = resolveComponentOverlay(component.occupation);
				return overlay ? { overlay, weight: component.weight } : null;
			})
			.filter(
				(item): item is { overlay: WorkflowOverlay; weight: number } => item !== null
			)
	);

	const titleArchetype = classifyArchetype('00000', role.title, '');
	const titleOverlay = archetypeOverlayDefaults[titleArchetype] ?? null;
	let overlay = componentOverlay ?? titleOverlay;

	const slugOverride = roleWorkflowOverrides[role.slug];
	if (overlay && slugOverride) overlay = blendWorkflowOverride(overlay, slugOverride);
	else if (slugOverride) overlay = slugOverride;

	const derived = overlay ? computeDerivedScores(overlay) : null;

	return {
		estimateType: inferEstimateType(role),
		variantOf: getVariantParent(role.slug),
		overlay,
		derived,
		contextAdjustment: derived ? computeContextAdjustment(derived) : 1,
		narrative: overlay ? generateWorkflowNarrative(overlay) : null
	};
}

function computeRoleConfidenceScore(
	validComponents: Array<{
		ssoc: string;
		weight: number;
		rationale: string;
		occupation: Occupation;
	}>,
	dispersion: number,
	variantSensitivity: number,
	primaryRiskDiff: number,
	estimateType: SyntheticEstimateType
): number {
	const componentCoverage =
		validComponents.length >= 4 ? 1 : validComponents.length === 3 ? 0.82 : validComponents.length === 2 ? 0.58 : 0.28;
	const dispersionScore =
		dispersion < 0.04
			? 1
			: dispersion < 0.08
				? 0.78
				: dispersion < 0.12
					? 0.52
					: 0.24;
	const proximityScore =
		primaryRiskDiff < 0.03 ? 0.92 : primaryRiskDiff < 0.07 ? 0.68 : primaryRiskDiff < 0.12 ? 0.48 : 0.28;

	let score =
		0.4 * componentCoverage +
		0.35 * dispersionScore +
		0.15 * (1 - variantSensitivity) +
		0.1 * proximityScore;

	if (estimateType !== 'modern_role') {
		score = Math.min(score, 0.68);
	}

	return clamp01(score);
}

function getRoleConfidenceLabel(score: number): 'high' | 'medium' | 'low' {
	if (score >= 0.78) return 'high';
	if (score >= 0.45) return 'medium';
	return 'low';
}


function computeAugmentationBand(augmentation: number): AugmentationBand {
	if (augmentation >= AUGMENTATION_THRESHOLDS.very_high) return 'very_high';
	if (augmentation >= AUGMENTATION_THRESHOLDS.high) return 'high';
	if (augmentation >= AUGMENTATION_THRESHOLDS.moderate) return 'moderate';
	if (augmentation >= AUGMENTATION_THRESHOLDS.low) return 'low';
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

	const validComponents = resolvedComponents.filter(
		(c): c is typeof c & { occupation: Occupation } => c.occupation !== null
	);

	if (validComponents.length === 0) {
		// Fallback: return neutral scores
		return {
			slug: role.slug,
			title: role.title,
			description: role.description,
			tags: role.tags,
			exposure: 0.5,
			bottleneck: 0.5,
			base_resilience: 0.5,
			demand_signal_bonus: 0.1,
			demand_resilience: computeDemandResilience({
				base_resilience: 0.5,
				demand_signal_bonus: 0.1
			}),
			displacement_pressure: 0.25,
			market_resilience: 0.5,
			net_risk: computeHeadlineRisk({
				displacement_pressure: 0.25,
				demand_resilience: computeDemandResilience({
					base_resilience: 0.5,
					demand_signal_bonus: 0.1
				})
			}),
			risk_band: 'moderate',
			augmentation: 0.125,
			augmentation_band: 'moderate',
			impact_type: 'mixed',
			confidence: 'medium',
			confidence_score: 0.45,
			dispersion: 0,
			risk_range: { optimistic: 0.1775, pessimistic: 0.1775 },
			base_net_risk: 0.1775,
			context_adjustment: 1,
			estimate_type: inferEstimateType(role),
			variant_of: getVariantParent(role.slug),
			workflow_overlay: null,
			workflow_scores: null,
			workflow_narrative: null,
			components: resolvedComponents
		};
	}

	const exposures = validComponents.map((c) => c.occupation!.exposure);
	const bottlenecks = validComponents.map((c) => c.occupation!.bottleneck);
	const baseResiliencies = validComponents.map((c) => c.occupation!.market.market_resilience);
	const demandSignalBonuses = validComponents.map((c) => c.occupation!.demand_signal_bonus ?? 0);
	const weights = validComponents.map((c) => c.weight);
	const totalConfiguredWeight = role.components.reduce((sum, component) => sum + component.weight, 0);

	const exposure = weightedMeanWithCoverage(exposures, weights, totalConfiguredWeight);
	const bottleneck = weightedMeanWithCoverage(bottlenecks, weights, totalConfiguredWeight);
	const base_resilience = weightedMeanWithCoverage(baseResiliencies, weights, totalConfiguredWeight);
	const demand_signal_bonus = weightedMeanWithCoverage(
		demandSignalBonuses,
		weights,
		totalConfiguredWeight,
		0
	);
	const {
		displacement_pressure,
		headline_risk: base_net_risk,
		augmentation
	} = computeV6StructuralScores({
		exposure,
		bottleneck,
		base_resilience,
		sol_match: false,
		jid_match: false
	});
	const demand_resilience_weighted = computeDemandResilience({
		base_resilience,
		demand_signal_bonus
	});
	const workflowMeta = buildRoleWorkflowMeta(role, validComponents);
	const net_risk = clamp01(
		computeHeadlineRisk({
			displacement_pressure,
			demand_resilience: demand_resilience_weighted
		}) * workflowMeta.contextAdjustment
	);
	const risk_band = getRiskBand(net_risk);
	const augmentation_band = computeAugmentationBand(augmentation);
	const impact_type = classifyImpactType(net_risk, augmentation);

	// Compute dispersion: stddev of component net_risk values
	const componentRisks = validComponents.map(c => c.occupation.net_risk);
	const meanRisk = componentRisks.reduce((s, v) => s + v, 0) / componentRisks.length;
	const variance =
		componentRisks.reduce((s, v) => s + (v - meanRisk) ** 2, 0) / componentRisks.length;
	const dispersion = Math.sqrt(variance);

	const variantSensitivity = workflowMeta.derived?.variant_sensitivity ?? 0.5;
	const rangePadding = Math.min(0.2, dispersion + 0.08 * variantSensitivity);
	const optimistic = Math.max(0, net_risk - rangePadding);
	const pessimistic = Math.min(1, net_risk + rangePadding);

	const primaryComponent =
		[...validComponents].sort((a, b) => b.weight - a.weight)[0] ?? null;
	const primaryRiskDiff = primaryComponent
		? Math.abs(primaryComponent.occupation.net_risk - net_risk)
		: 0.1;
	const confidence_score = computeRoleConfidenceScore(
		validComponents,
		dispersion,
		variantSensitivity,
		primaryRiskDiff,
		workflowMeta.estimateType
	);
	const confidence = getRoleConfidenceLabel(confidence_score);

	return {
		slug: role.slug,
		title: role.title,
		description: role.description,
		tags: role.tags,
		exposure,
		bottleneck,
		base_resilience,
		demand_signal_bonus,
		demand_resilience: demand_resilience_weighted,
		displacement_pressure,
		market_resilience: base_resilience,
		net_risk,
		risk_band,
		augmentation,
		augmentation_band,
		impact_type,
		confidence,
		confidence_score,
		dispersion,
		risk_range: { optimistic, pessimistic },
		base_net_risk,
		context_adjustment: workflowMeta.contextAdjustment,
		estimate_type: workflowMeta.estimateType,
		variant_of: workflowMeta.variantOf,
		workflow_overlay: workflowMeta.overlay,
		workflow_scores: workflowMeta.derived,
		workflow_narrative: workflowMeta.narrative,
		components: resolvedComponents
	};
}

export const syntheticRolesBySlug = new Map<string, SyntheticRole>(
	syntheticRoles.map((r) => [r.slug, r])
);

/** Reverse index: SSOC → list of synthetic roles that use this occupation as a component */
export const rolesBySsoc = new Map<string, Array<{ slug: string; title: string; weight: number }>>();
for (const role of syntheticRoles) {
	for (const comp of role.components) {
		const list = rolesBySsoc.get(comp.ssoc) ?? [];
		list.push({ slug: role.slug, title: role.title, weight: comp.weight });
		rolesBySsoc.set(comp.ssoc, list);
	}
}
