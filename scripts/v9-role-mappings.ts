/**
 * Reviewed SSOC 2024 dispositions for modern-title queries that are not exact
 * normalized matches to an official occupation title.
 *
 * This is the sole owner of V9 role-to-occupation mapping assumptions. The
 * legacy synthetic-role component list is retained only for query metadata
 * (title, description and tags) and must not supply V9 components.
 */

export interface V9ReviewedRoleComponent {
	ssoc2024: string;
	weight: number;
	rationale: string;
}

export type V9ReviewedRoleDisposition =
	| {
			kind: 'official_alias';
			ssoc2024: string;
			expectedTitle: string;
			basis: 'official_synonym' | 'definition_equivalent';
			rationale: string;
	  }
	| {
			kind: 'composite';
			rationale: string;
			components: readonly V9ReviewedRoleComponent[];
	  }
	| {
			kind: 'withheld';
			reason: string;
	  };

export const reviewedV9OfficialTitles = {
	'11201': 'Managing director/Chief executive officer',
	'12111': 'Budgeting/Financial accounting manager',
	'12121': 'Personnel/Human resource manager',
	'12212': 'Business development manager',
	'12222': 'Marketing manager',
	'13242': 'Procurement/Purchasing manager',
	'13301': 'Chief information officer/Chief technology officer/Chief information security officer',
	'13302': 'Software and applications manager',
	'21212': 'Operations research analyst',
	'21231': 'Statistical officer/Data analyst',
	'21661': 'Graphic designer',
	'24111': 'Accountant (excluding tax accountant)',
	'24112': 'Auditor (accounting)',
	'24121': 'Financial/Investment adviser',
	'24133': 'Fund/Portfolio manager',
	'24134': 'Treasury manager',
	'24214': 'Sustainability project development/management professional',
	'24221': 'Policy administration professional',
	'24231': 'Human resource consultant (excluding executive search consultant)',
	'24213': 'Business/Financial project management professional',
	'24313': 'Marketing strategy/planning professional',
	'24314': 'Digital marketing professional',
	'24331': 'Technical sales professional',
	'24333': 'ICT sales and services professional',
	'25111': 'Systems designer/analyst',
	'25112': 'ICT business process consultant/business analyst',
	'25114': 'ICT product manager',
	'25121': 'Software developer',
	'25122': 'Web/Mobile applications developer',
	'25123': 'Multimedia-games developer/designer',
	'25124': 'Interaction designer',
	'25143': 'Artificial intelligence/Machine learning engineer',
	'25151': 'ICT quality assurance specialist',
	'25211': 'Data/Database administrator',
	'25212': 'Data/Database architect',
	'25232': 'IT infrastructure specialist',
	'25239': 'Computer network/infrastructure/platform professional n.e.c.',
	'25245': 'Cybersecurity architect',
	'26112': 'In-house legal counsel (excluding judiciary, ministries and statutory boards)',
	'33221': 'Business development executive',
	'33461': 'Logistics/Production planner',
	'33491': 'Management executive',
	'33494': 'Executive secretary',
	'35123': 'IT support technician',
	'83226': 'Private-hire car driver'
} as const;

const alias = (
	ssoc2024: keyof typeof reviewedV9OfficialTitles,
	basis: 'official_synonym' | 'definition_equivalent',
	rationale: string
): V9ReviewedRoleDisposition => ({
	kind: 'official_alias',
	ssoc2024,
	expectedTitle: reviewedV9OfficialTitles[ssoc2024],
	basis,
	rationale
});

const composite = (
	rationale: string,
	components: readonly V9ReviewedRoleComponent[]
): V9ReviewedRoleDisposition => ({ kind: 'composite', rationale, components });

/**
 * Exact official-title matches are deliberately absent: the builder resolves
 * those first. Every other public query must appear exactly once below.
 */
export const reviewedV9RoleMappings = {
	'product-manager': alias(
		'25114',
		'official_synonym',
		'SSOC 25114 lists Product Manager in the official alphabetical index and describes product strategy through launch and growth.'
	),
	'project-manager': {
		kind: 'withheld',
		reason:
			'Project Manager is sector-dependent: business, construction, software, infrastructure and logistics projects map to different official occupations. Choose a domain before comparing exposure.'
	},
	recruiter: composite('Recruiter spans agency search and in-house talent acquisition.', [
		{ ssoc2024: '24232', weight: 0.55, rationale: 'Agency and executive-search recruiting' },
		{ ssoc2024: '24233', weight: 0.45, rationale: 'In-house recruitment operations' }
	]),
	'hr-business-partner': alias(
		'24231',
		'official_synonym',
		'SSOC 24231 explicitly lists Human Resource Business Partner and covers personnel-policy consulting.'
	),
	'customer-success-manager': alias(
		'24333',
		'official_synonym',
		'SSOC 24333 explicitly lists Customer Success Manager in the ICT sales and services occupation.'
	),
	'account-executive': alias(
		'33221',
		'official_synonym',
		'SSOC 33221 includes key-account executives and covers prospecting, sales plans and relationship building.'
	),
	'platform-engineer': alias(
		'25239',
		'definition_equivalent',
		'SSOC 25239 expressly covers computer network, infrastructure and platform professionals not elsewhere classified.'
	),
	'ux-designer': alias(
		'25124',
		'official_synonym',
		'SSOC 25124 explicitly lists user-experience designer and covers research, interface and interaction design.'
	),
	'venture-capitalist': alias(
		'24133',
		'definition_equivalent',
		'SSOC 24133 covers fund and portfolio investment decisions, strategy and timing.'
	),
	'solutions-engineer': alias(
		'24333',
		'official_synonym',
		'SSOC 24333 lists Computer Sales Engineer and Pre-Sales Consultant and covers ICT solution design for customers.'
	),
	'operations-analyst': alias(
		'21212',
		'official_synonym',
		'SSOC 21212 explicitly lists business operations analysts and covers quantitative process analysis.'
	),
	'brand-manager': alias(
		'12222',
		'official_synonym',
		'SSOC 12222 explicitly lists Brand Manager and covers brand strategy and marketing campaigns.'
	),
	'community-manager': composite(
		'Community management spans formal community relations and digital brand engagement.',
		[
			{
				ssoc2024: '24314',
				weight: 0.45,
				rationale: 'Online community and social-channel management'
			},
			{ ssoc2024: '26413', weight: 0.3, rationale: 'Community-facing editorial content' },
			{
				ssoc2024: '13492',
				weight: 0.25,
				rationale: 'Community partnership and relations management'
			}
		]
	),
	'sales-engineer': alias(
		'24331',
		'official_synonym',
		'SSOC 24331 explicitly lists technical sales engineer and covers specialised technical selling.'
	),
	'developer-advocate': composite(
		'Developer advocacy combines software expertise, technical content and digital outreach.',
		[
			{ ssoc2024: '25121', weight: 0.4, rationale: 'Software-development expertise' },
			{ ssoc2024: '26413', weight: 0.3, rationale: 'Technical educational content' },
			{ ssoc2024: '24314', weight: 0.3, rationale: 'Digital outreach and community channels' }
		]
	),
	'investment-banker': composite(
		'Investment banking combines M&A analysis, transaction valuation, financial analysis and institutional-product sales.',
		[
			{ ssoc2024: '24139', weight: 0.35, rationale: 'Mergers and acquisitions analysis' },
			{ ssoc2024: '24122', weight: 0.3, rationale: 'Business valuation and M&A execution' },
			{ ssoc2024: '24131', weight: 0.2, rationale: 'Financial and investment analysis' },
			{ ssoc2024: '24334', weight: 0.15, rationale: 'Institutional financial-product sales' }
		]
	),
	'partnerships-manager': alias(
		'12212',
		'official_synonym',
		'SSOC 12212 includes partnerships and affinity-management managers within business development.'
	),
	'supply-chain-analyst': alias(
		'33461',
		'official_synonym',
		'SSOC 33461 lists logistics operations and solutions analysts and covers logistics and production planning.'
	),
	'ml-engineer': alias(
		'25143',
		'official_synonym',
		'SSOC 25143 explicitly lists Machine Learning Engineer and describes production AI/ML systems.'
	),
	'technical-product-manager': composite(
		'Technical product management anchors on ICT product ownership with requirements and software context.',
		[
			{ ssoc2024: '25114', weight: 0.55, rationale: 'ICT product lifecycle ownership' },
			{ ssoc2024: '25112', weight: 0.25, rationale: 'Business and technical requirements' },
			{ ssoc2024: '25121', weight: 0.2, rationale: 'Software-development context' }
		]
	),
	'people-partner': alias(
		'24231',
		'official_synonym',
		'SSOC 24231 lists Human Resource Business Partner, the reviewed occupational equivalent of People Partner.'
	),
	'revops-manager': composite(
		'Revenue operations combines business systems, sales, marketing operations and customer operations.',
		[
			{ ssoc2024: '25112', weight: 0.35, rationale: 'Revenue-process systems analysis' },
			{ ssoc2024: '12211', weight: 0.3, rationale: 'Sales operations and management' },
			{ ssoc2024: '24313', weight: 0.2, rationale: 'Marketing operations and planning' },
			{ ssoc2024: '12241', weight: 0.15, rationale: 'Customer operations management' }
		]
	),
	'procurement-manager': alias(
		'13242',
		'official_synonym',
		'SSOC 13242 explicitly lists Procurement Manager and covers purchasing and vendor strategy.'
	),
	'frontend-engineer': alias(
		'25121',
		'official_synonym',
		'SSOC 25121 explicitly lists Front End Developer in software product development.'
	),
	'backend-engineer': alias(
		'25121',
		'official_synonym',
		'SSOC 25121 explicitly lists Back End Developer in software product development.'
	),
	'full-stack-developer': alias(
		'25121',
		'official_synonym',
		'SSOC 25121 explicitly lists Full Stack Developer.'
	),
	'mobile-engineer': alias(
		'25122',
		'official_synonym',
		'SSOC 25122 explicitly lists Mobile Applications Developer.'
	),
	'security-engineer': alias(
		'25245',
		'official_synonym',
		'SSOC 25245 explicitly lists ICT Security Engineer and Cybersecurity Engineer.'
	),
	'site-reliability-engineer': alias(
		'25232',
		'official_synonym',
		'SSOC 25232 explicitly lists IT Site Reliability Engineer.'
	),
	'engineering-manager': alias(
		'13302',
		'official_synonym',
		'SSOC 13302 explicitly lists Head of Software Engineering and software-development manager.'
	),
	'startup-cto': alias(
		'13301',
		'official_synonym',
		'SSOC 13301 explicitly covers Chief Technology Officer.'
	),
	'growth-marketer': composite(
		'Growth marketing combines digital channel execution, experimentation and marketing strategy.',
		[
			{ ssoc2024: '24314', weight: 0.45, rationale: 'Digital acquisition and channel execution' },
			{ ssoc2024: '24312', weight: 0.3, rationale: 'Market analysis and experimentation' },
			{ ssoc2024: '24313', weight: 0.25, rationale: 'Growth and positioning strategy' }
		]
	),
	'content-strategist': alias(
		'24313',
		'official_synonym',
		'SSOC 24313 explicitly lists Content Strategist.'
	),
	'policy-analyst': alias(
		'24221',
		'official_synonym',
		'SSOC 24221 explicitly lists Policy Analyst and covers policy design and evaluation.'
	),
	'chief-of-staff': composite(
		'Chief-of-staff work combines strategic planning, general-management support and cross-functional programme delivery.',
		[
			{ ssoc2024: '12132', weight: 0.4, rationale: 'Strategic planning support' },
			{ ssoc2024: '11203', weight: 0.3, rationale: 'General-management and operating support' },
			{ ssoc2024: '24213', weight: 0.3, rationale: 'Cross-functional programme delivery' }
		]
	),
	'founder-associate': alias(
		'33491',
		'definition_equivalent',
		'SSOC 33491 covers non-specialised management duties and implementation support; it is the closest reviewed match, but currently has insufficient ILO evidence.'
	),
	'quant-researcher': alias(
		'21212',
		'official_synonym',
		'SSOC 21212 lists Quantitative Strategist and covers mathematical modelling and analytical decision support.'
	),
	'private-equity-associate': composite(
		'Private-equity work combines deal valuation, investment analysis and portfolio assessment.',
		[
			{ ssoc2024: '24131', weight: 0.4, rationale: 'Investment analysis' },
			{ ssoc2024: '24122', weight: 0.35, rationale: 'Deal and business valuation' },
			{ ssoc2024: '24133', weight: 0.25, rationale: 'Portfolio management' }
		]
	),
	'fpa-analyst': alias(
		'24111',
		'official_synonym',
		'SSOC 24111 explicitly lists Financial Planning and Analysis Analyst.'
	),
	'treasury-analyst': alias(
		'24134',
		'official_synonym',
		'SSOC 24134 explicitly lists Treasury Analyst and covers cash, liquidity and financial risk.'
	),
	'compliance-officer': {
		kind: 'withheld',
		reason:
			'Compliance Officer is sector-dependent: financial, environmental, cyber, data-protection, pharmaceutical and other regimes map to different work. Choose a sector before comparing exposure.'
	},
	'game-developer': alias(
		'25123',
		'definition_equivalent',
		'SSOC 25123 is the current multimedia-games developer/designer occupation.'
	),
	'qa-engineer': alias(
		'25151',
		'official_synonym',
		'SSOC 25151 explicitly lists Quality Assurance Engineer for ICT products.'
	),
	'systems-analyst': alias(
		'25111',
		'official_synonym',
		'SSOC 25111 explicitly lists Systems Analyst.'
	),
	'financial-adviser': alias(
		'24121',
		'official_synonym',
		'SSOC 24121 explicitly lists Financial Adviser.'
	),
	auditor: alias(
		'24112',
		'definition_equivalent',
		'SSOC 24112 is the current accounting-auditor occupation and matches this query definition.'
	),
	'data-analyst': alias(
		'21231',
		'official_synonym',
		'SSOC 21231 explicitly lists Data Analyst and describes data cleaning, modelling and reporting.'
	),
	'business-analyst': alias(
		'25112',
		'definition_equivalent',
		'The query explicitly bridges business needs and technology; SSOC 25112 is the current ICT business-analyst occupation.'
	),
	'scrum-master': alias(
		'24213',
		'official_synonym',
		'SSOC 24213 explicitly lists Project Manager/Scrum Master.'
	),
	'seo-specialist': alias(
		'24314',
		'definition_equivalent',
		'SSOC 24314 covers digital-marketing channel performance; SEO is a reviewed specialism within that occupation.'
	),
	'social-media-manager': alias(
		'24314',
		'official_synonym',
		'SSOC 24314 explicitly lists Social Media Marketing Manager.'
	),
	'product-designer': alias(
		'25124',
		'official_synonym',
		'SSOC 25124 explicitly lists Product Designer and covers user research and interaction design.'
	),
	'cloud-architect': composite(
		'Cloud architecture combines solution architecture, cloud specialism and infrastructure design.',
		[
			{ ssoc2024: '25113', weight: 0.5, rationale: 'Enterprise and solution architecture' },
			{ ssoc2024: '25231', weight: 0.35, rationale: 'Cloud engineering and platform knowledge' },
			{ ssoc2024: '25232', weight: 0.15, rationale: 'Infrastructure implementation' }
		]
	),
	'it-manager': composite(
		'Generic IT management spans infrastructure, services and applications teams.',
		[
			{ ssoc2024: '13303', weight: 0.5, rationale: 'Network and infrastructure management' },
			{ ssoc2024: '13304', weight: 0.3, rationale: 'ICT service and operations management' },
			{ ssoc2024: '13302', weight: 0.2, rationale: 'Software and applications management' }
		]
	),
	'database-administrator': alias(
		'25211',
		'official_synonym',
		'SSOC 25211 explicitly lists Database Administrator.'
	),
	'network-engineer': alias(
		'25232',
		'official_synonym',
		'SSOC 25232 explicitly lists Network Engineer.'
	),
	'customer-support-specialist': alias(
		'35123',
		'definition_equivalent',
		'The query description centres technical troubleshooting; SSOC 35123 covers ICT customer support and IT support technicians.'
	),
	'hr-manager': alias(
		'12121',
		'official_synonym',
		'SSOC 12121 explicitly lists Human Resource Manager.'
	),
	'talent-acquisition-lead': alias(
		'12121',
		'official_synonym',
		'SSOC 12121 lists Head, Talent Attraction and covers organisation-wide recruitment strategy.'
	),
	'legal-counsel': alias(
		'26112',
		'official_synonym',
		'SSOC 26112 explicitly lists in-house Legal Counsel.'
	),
	'finance-manager': alias(
		'12111',
		'official_synonym',
		'SSOC 12111 explicitly lists Finance Manager and covers financial accounting and planning.'
	),
	accountant: alias(
		'24111',
		'definition_equivalent',
		'SSOC 24111 is the general accounting occupation. Specialist tax-accountant and auditor work are separate occupations.'
	),
	'executive-assistant': alias(
		'33494',
		'official_synonym',
		'SSOC 33494 explicitly lists Executive Assistant and describes senior-leadership support.'
	),
	'office-manager': composite(
		'Office management combines clerical supervision, administration and executive-office coordination.',
		[
			{ ssoc2024: '12112', weight: 0.5, rationale: 'Administrative operations management' },
			{ ssoc2024: '33494', weight: 0.3, rationale: 'Day-to-day executive-office coordination' },
			{ ssoc2024: '12191', weight: 0.2, rationale: 'Facilities and premises management' }
		]
	),
	'ai-engineer': alias(
		'25143',
		'official_synonym',
		'SSOC 25143 explicitly lists Artificial Intelligence Engineer.'
	),
	'prompt-engineer': {
		kind: 'withheld',
		reason:
			'Prompt Engineer is not a stable SSOC occupation and current jobs range from AI engineering and application development to evaluation and copy work. A task profile is needed before comparison.'
	},
	'ai-product-manager': composite(
		'AI product management combines ICT product ownership, AI/ML knowledge and technical requirements analysis.',
		[
			{ ssoc2024: '25114', weight: 0.55, rationale: 'ICT product lifecycle management' },
			{ ssoc2024: '25143', weight: 0.25, rationale: 'AI/ML product capabilities' },
			{ ssoc2024: '25112', weight: 0.2, rationale: 'Business and technical requirements analysis' }
		]
	),
	'data-architect': alias(
		'25212',
		'official_synonym',
		'SSOC 25212 explicitly lists Data Architect.'
	),
	'it-security-manager': composite(
		'IT-security management spans cyber risk, security operations and organisation-wide security leadership.',
		[
			{ ssoc2024: '13301', weight: 0.4, rationale: 'Information-security strategy and leadership' },
			{ ssoc2024: '25243', weight: 0.35, rationale: 'Security operations and incident response' },
			{ ssoc2024: '25245', weight: 0.25, rationale: 'Security architecture and infrastructure' }
		]
	),
	'delivery-rider': composite(
		'Delivery riders use motorcycles, motorised personal-mobility devices and non-motorised bicycles.',
		[
			{ ssoc2024: '83211', weight: 0.5, rationale: 'Motorcycle delivery work' },
			{
				ssoc2024: '83212',
				weight: 0.25,
				rationale: 'Motorised personal-mobility and e-bicycle delivery'
			},
			{ ssoc2024: '93310', weight: 0.25, rationale: 'Non-motorised bicycle delivery' }
		]
	),
	'ride-hail-driver': alias(
		'83226',
		'definition_equivalent',
		'SSOC 83226 describes pre-booked private-hire passenger transport, the direct occupation for ride-hail drivers.'
	),
	'freelance-designer': alias(
		'21661',
		'definition_equivalent',
		'The query describes visual and graphic design; freelance status is an employment arrangement, not a separate occupation.'
	),
	'startup-founder': alias(
		'11201',
		'official_synonym',
		'The query explicitly includes CEO; SSOC 11201 is the official managing-director and chief-executive occupation. Startup stage remains context, not a separate occupation.'
	),
	'e-commerce-seller': composite(
		'Independent e-commerce selling combines online channel operations, retail management and digital marketing.',
		[
			{ ssoc2024: '33224', weight: 0.5, rationale: 'Online sales-channel operations' },
			{ ssoc2024: '14201', weight: 0.25, rationale: 'Retail ownership and management' },
			{ ssoc2024: '24314', weight: 0.25, rationale: 'Digital marketing' }
		]
	),
	'sustainability-manager': alias(
		'24214',
		'official_synonym',
		'SSOC 24214 explicitly lists Sustainability Manager and covers project, reporting and standards work.'
	),
	'content-creator': composite(
		'Content creators combine writing, multimedia production, digital distribution and producer work.',
		[
			{ ssoc2024: '26419', weight: 0.3, rationale: 'Written and authored content' },
			{ ssoc2024: '26541', weight: 0.3, rationale: 'Video and media production' },
			{ ssoc2024: '21662', weight: 0.25, rationale: 'Multimedia visual content' },
			{ ssoc2024: '24314', weight: 0.15, rationale: 'Digital channel distribution' }
		]
	),
	'virtual-assistant': composite(
		'Virtual assistance combines secretarial coordination, general office support and data entry.',
		[
			{
				ssoc2024: '41201',
				weight: 0.5,
				rationale: 'Scheduling, correspondence and meeting support'
			},
			{ ssoc2024: '41101', weight: 0.3, rationale: 'General administrative support' },
			{ ssoc2024: '33494', weight: 0.2, rationale: 'Executive and coordination support' }
		]
	)
} as const satisfies Record<string, V9ReviewedRoleDisposition>;
