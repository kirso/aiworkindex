import type { Occupation, RiskBand, ImpactType, AugmentationBand } from './index';
import {
	getRiskBand,
	MARKET_CONSTANTS,
	classifyImpactType,
	AUGMENTATION_THRESHOLDS
} from './scoring-constants';

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
	/** Standard deviation of component net_risk scores — measures estimate spread */
	dispersion: number;
	/** Risk range: [optimistic, pessimistic] based on component spread */
	risk_range: { optimistic: number; pessimistic: number };
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
	}
];

function weightedMean(values: number[], weights: number[]): number {
	let sum = 0;
	let wSum = 0;
	for (let i = 0; i < values.length; i++) {
		sum += values[i]! * weights[i]!;
		wSum += weights[i]!
	}
	return wSum > 0 ? sum / wSum : 0;
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
			dispersion: 0,
			risk_range: { optimistic: 0.25, pessimistic: 0.25 },
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

	const net_risk =
		exposure * (1 - bottleneck) * (1 - MARKET_CONSTANTS.max_modifier_effect * market_resilience);
	const risk_band = getRiskBand(net_risk);
	const augmentation_band = computeAugmentationBand(augmentation);
	const impact_type = classifyImpactType(net_risk, augmentation);

	// Compute dispersion: stddev of component net_risk values
	const componentRisks = validComponents.map((c) => c.occupation!.net_risk);
	const meanRisk = componentRisks.reduce((s, v) => s + v, 0) / componentRisks.length;
	const variance =
		componentRisks.reduce((s, v) => s + (v - meanRisk) ** 2, 0) / componentRisks.length;
	const dispersion = Math.sqrt(variance);

	// Risk range based on dispersion
	const optimistic = Math.max(0, net_risk - dispersion);
	const pessimistic = Math.min(1, net_risk + dispersion);

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
		dispersion,
		risk_range: { optimistic, pessimistic },
		components: resolvedComponents
	};
}

export const syntheticRolesBySlug = new Map<string, SyntheticRole>(
	syntheticRoles.map((r) => [r.slug, r])
);
