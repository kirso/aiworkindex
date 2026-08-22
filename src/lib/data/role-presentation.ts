import { getRoleCategory } from './role-taxonomy';

export const EXACT_TITLE_RESOLUTION = 'normalized_exact_title';

export type RoleJourneyKind =
	| 'exact_official_title'
	| 'reviewed_official_match'
	| 'composite_estimate'
	| 'mapping_withheld';

export type WorkProfileLevel = 'Less central' | 'Mixed' | 'Central';

export interface RoleFamilyPresentation {
	key: string;
	label: string;
	description: string;
	accent: string;
	surface: string;
	workProfile: Array<{
		label: string;
		level: WorkProfileLevel;
	}>;
	actions: {
		tryWithAi: string[];
		keepHumanLed: string[];
		strengthen: string[];
		askAtWork: string[];
	};
}

type RoleJourneyLike = {
	slug: string;
	resolution_basis: string;
	official_occupation: { ssoc2024: string } | null;
};

const profileDimensions = [
	'Creating and explaining',
	'Analysis and digital tools',
	'Coordination',
	'Relationships',
	'Accountable judgement',
	'Physical context'
] as const;

function profile(levels: WorkProfileLevel[]): RoleFamilyPresentation['workProfile'] {
	return profileDimensions.map((label, index) => ({ label, level: levels[index] ?? 'Mixed' }));
}

export const ROLE_GUIDANCE_DISCLOSURE =
	'Reviewed family-level guidance based on common work patterns associated with these titles. The official pressure calculation stays separate. Individual jobs vary by tasks, work setting, adoption and human responsibility.';

const familyPresentation: Record<string, RoleFamilyPresentation> = {
	engineering: {
		key: 'engineering',
		label: 'Engineering',
		description: 'Software, infrastructure and platform work',
		accent: '#1d4ed8',
		surface: '#eff6ff',
		workProfile: profile(['Central', 'Central', 'Mixed', 'Less central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Draft tests, documentation and migration checklists.', 'Use assistants to inspect code paths and compare implementation options.'],
			keepHumanLed: ['Own architecture, security decisions and production changes.', 'Verify generated code against real system behaviour.'],
			strengthen: ['System design, debugging and reliability judgement.', 'Domain knowledge that makes technical trade-offs visible.'],
			askAtWork: ['Which repetitive engineering tasks are approved for AI tools?', 'Who reviews generated code and owns incidents?']
		}
	},
	data: {
		key: 'data',
		label: 'Data & AI',
		description: 'Data, analytics and machine-learning work',
		accent: '#6d28d9',
		surface: '#f5f3ff',
		workProfile: profile(['Central', 'Central', 'Mixed', 'Less central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Draft queries, analysis plans and model documentation.', 'Generate candidate checks for data quality and edge cases.'],
			keepHumanLed: ['Choose valid measures and interpret results in context.', 'Own data access, model risk and consequential decisions.'],
			strengthen: ['Causal reasoning, evaluation and data-quality practice.', 'The business context behind definitions and exceptions.'],
			askAtWork: ['Which data may be used with approved AI systems?', 'How will AI-assisted analysis be reviewed and reproduced?']
		}
	},
	product: {
		key: 'product',
		label: 'Product & Design',
		description: 'Product management, experience design and discovery',
		accent: '#0f766e',
		surface: '#f0fdfa',
		workProfile: profile(['Central', 'Central', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Summarise research and produce rough first-pass prototypes.', 'Explore scenarios before committing design or engineering time.'],
			keepHumanLed: ['Set priorities and decide which user problem matters.', 'Run research, resolve trade-offs and own product outcomes.'],
			strengthen: ['Customer judgement, facilitation and experiment design.', 'Clear product writing and technical fluency.'],
			askAtWork: ['Where can AI shorten discovery without replacing customer contact?', 'What evidence is required before an AI-generated proposal ships?']
		}
	},
	design: {
		key: 'design',
		label: 'Design & Creative',
		description: 'Visual craft, creative direction and independent design',
		accent: '#be185d',
		surface: '#fdf2f8',
		workProfile: profile(['Central', 'Mixed', 'Mixed', 'Central', 'Central', 'Mixed']),
		actions: {
			tryWithAi: ['Generate references, variants and production starting points.', 'Speed up asset adaptation and routine content preparation.'],
			keepHumanLed: ['Set the concept, taste and ethical boundaries.', 'Validate accessibility, originality and fit with the audience.'],
			strengthen: ['Art direction, critique and a recognisable point of view.', 'Research and collaboration with clients or users.'],
			askAtWork: ['What source and rights checks apply to generated material?', 'Which creative decisions must remain attributable to a person?']
		}
	},
	marketing: {
		key: 'marketing',
		label: 'Marketing & Growth',
		description: 'Marketing, content, communications and audience growth',
		accent: '#c2410c',
		surface: '#fff7ed',
		workProfile: profile(['Central', 'Central', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Draft campaign variants and summarise audience research.', 'Analyse content patterns before a person chooses the message.'],
			keepHumanLed: ['Own positioning, claims and brand judgement.', 'Check facts, permissions and the effect on real audiences.'],
			strengthen: ['Customer insight, editorial judgement and measurement.', 'Distinctive expertise that generic generation cannot supply.'],
			askAtWork: ['Which claims need legal or subject-matter review?', 'How will assisted work be tested against customer response?']
		}
	},
	sales: {
		key: 'sales',
		label: 'Sales & Business Development',
		description: 'Revenue, partnerships and commercial relationships',
		accent: '#a16207',
		surface: '#fefce8',
		workProfile: profile(['Mixed', 'Central', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Prepare account research and meeting briefs.', 'Draft follow-ups and organise pipeline notes.'],
			keepHumanLed: ['Build trust, discover needs and negotiate commitments.', 'Own promises, pricing judgement and sensitive communication.'],
			strengthen: ['Consultative discovery, negotiation and sector expertise.', 'The ability to turn account context into a useful proposal.'],
			askAtWork: ['Which customer data can enter sales assistants?', 'Where should automation stop before a customer conversation?']
		}
	},
	finance: {
		key: 'finance',
		label: 'Finance & Legal',
		description: 'Finance, accounting, compliance and legal work',
		accent: '#166534',
		surface: '#f0fdf4',
		workProfile: profile(['Central', 'Central', 'Mixed', 'Mixed', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Summarise documents and prepare first-pass reconciliations.', 'Draft checklists, scenarios and routine explanations.'],
			keepHumanLed: ['Interpret rules and sign off consequential advice.', 'Investigate exceptions and protect confidential information.'],
			strengthen: ['Professional judgement, controls and regulatory context.', 'Clear communication of uncertainty and downstream consequences.'],
			askAtWork: ['Which outputs require licensed or accountable review?', 'How are sources, calculations and approvals recorded?']
		}
	},
	people: {
		key: 'people',
		label: 'People & HR',
		description: 'Hiring, employee support and organisational work',
		accent: '#9f1239',
		surface: '#fff1f2',
		workProfile: profile(['Mixed', 'Mixed', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Draft routine communications and organise policy material.', 'Prepare structured interview guides and workforce summaries.'],
			keepHumanLed: ['Make fair employment decisions and handle sensitive cases.', 'Build trust and understand circumstances that records miss.'],
			strengthen: ['Employee relations, coaching and evidence-based hiring.', 'Bias detection, privacy practice and employment-law context.'],
			askAtWork: ['Where is AI use prohibited in hiring or performance decisions?', 'How can a person challenge an automated recommendation?']
		}
	},
	operations: {
		key: 'operations',
		label: 'Operations',
		description: 'Delivery, coordination, supply and business operations',
		accent: '#475569',
		surface: '#f8fafc',
		workProfile: profile(['Mixed', 'Central', 'Central', 'Mixed', 'Central', 'Central']),
		actions: {
			tryWithAi: ['Draft schedules, standard procedures and exception summaries.', 'Compare routine options using current operational data.'],
			keepHumanLed: ['Respond to disruptions and own safety-critical choices.', 'Coordinate people when priorities or conditions change.'],
			strengthen: ['Process design, exception handling and frontline knowledge.', 'Vendor, safety and stakeholder coordination.'],
			askAtWork: ['Which decisions can be assisted, and which require approval?', 'What happens when the tool lacks current operational context?']
		}
	},
	strategy: {
		key: 'strategy',
		label: 'Strategy & Advisory',
		description: 'Strategy, consulting, policy and executive support',
		accent: '#3730a3',
		surface: '#eef2ff',
		workProfile: profile(['Central', 'Central', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Map options, summarise evidence and challenge early drafts.', 'Prepare scenarios and questions for stakeholder interviews.'],
			keepHumanLed: ['Frame the decision and judge conflicting evidence.', 'Win alignment and take responsibility for recommendations.'],
			strengthen: ['Problem framing, synthesis and organisational judgement.', 'Primary research and communication with decision-makers.'],
			askAtWork: ['Which evidence must be checked at source?', 'Who owns the recommendation when AI shaped the analysis?']
		}
	},
	leadership: {
		key: 'leadership',
		label: 'Leadership & New Ventures',
		description: 'Company-building, executive and emerging leadership work',
		accent: '#7c2d12',
		surface: '#fff7ed',
		workProfile: profile(['Central', 'Central', 'Central', 'Central', 'Central', 'Mixed']),
		actions: {
			tryWithAi: ['Explore scenarios and prepare first-pass operating material.', 'Summarise market, customer and internal evidence.'],
			keepHumanLed: ['Choose direction, allocate resources and own consequences.', 'Build the team, trust and external relationships.'],
			strengthen: ['Decision quality under uncertainty and capital discipline.', 'Customer contact, hiring and organisational design.'],
			askAtWork: ['Which decisions should never be delegated to a model?', 'What evidence would change the current strategy?']
		}
	},
	customer: {
		key: 'customer',
		label: 'Customer & Service',
		description: 'Customer success, support and community work',
		accent: '#0369a1',
		surface: '#f0f9ff',
		workProfile: profile(['Mixed', 'Mixed', 'Central', 'Central', 'Central', 'Less central']),
		actions: {
			tryWithAi: ['Draft replies and retrieve approved knowledge quickly.', 'Summarise account history and recurring service issues.'],
			keepHumanLed: ['Handle distress, exceptions and relationship repair.', 'Own commitments and recognise needs outside the script.'],
			strengthen: ['Empathy, diagnosis and product knowledge.', 'Escalation judgement and communication across teams.'],
			askAtWork: ['When must a customer reach a person immediately?', 'How are generated answers checked against current policy?']
		}
	}
};

export function getRoleJourneyKind(role: RoleJourneyLike): RoleJourneyKind {
	if (role.resolution_basis === EXACT_TITLE_RESOLUTION) return 'exact_official_title';
	if (role.official_occupation) return 'reviewed_official_match';
	if (role.resolution_basis === 'mapping_withheld') return 'mapping_withheld';
	return 'composite_estimate';
}

export function getRoleHref(role: RoleJourneyLike): string {
	if (getRoleJourneyKind(role) === 'exact_official_title' && role.official_occupation) {
		return `/occupation/${role.official_occupation.ssoc2024}`;
	}
	return `/role/${role.slug}`;
}

export function getRoleFamilyPresentation(slug: string): RoleFamilyPresentation {
	const category = getRoleCategory(slug);
	return familyPresentation[category?.key ?? 'operations'] ?? familyPresentation.operations!;
}

export function getRoleStatusLabel(role: RoleJourneyLike): string {
	switch (getRoleJourneyKind(role)) {
		case 'exact_official_title':
			return 'Official SSOC title';
		case 'reviewed_official_match':
			return 'Reviewed SSOC match';
		case 'composite_estimate':
			return 'Reviewed composite';
		case 'mapping_withheld':
			return 'Choose a work context';
	}
}
