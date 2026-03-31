/**
 * Role-Specific Personalization Engine
 *
 * Generates personalized "What AI Can/Can't Do" and "Skills to Focus On"
 * content based on the occupation's actual characteristics (SSOC code + title),
 * NOT just the major group.
 */

import {
	classifyOccupationArchetype,
	type Archetype
} from './occupation-classification';

export type { Archetype } from './occupation-classification';

export interface ArchetypeContent {
	aiCanDo: string;
	humanNeeded: string;
	skills: Array<{ label: string; description: string }>;
	/** Inline research citation for the archetype, if available */
	evidence?: string;
}

export function classifyArchetype(ssoc: string, title: string, majorGroup: string): Archetype {
	return classifyOccupationArchetype(ssoc, title, majorGroup);
}

const archetypeContentMap: Record<Archetype, ArchetypeContent> = {
	writing_editorial: {
		aiCanDo: 'First-draft writing, summarizing documents, headline variations, background research, and social media copy generation.',
		humanNeeded: 'Source development, investigative interviewing, editorial judgment, fact-checking in ambiguous situations, and ethical/legal calls on publication.',
		skills: [
			{ label: 'Investigative Verification', description: 'Confirming facts through primary sources and cross-referencing conflicting accounts' },
			{ label: 'Source-Building', description: 'Cultivating trusted contacts and developing long-term relationships for exclusive insights' },
			{ label: 'Editorial Judgment', description: 'Deciding what to publish, when, and how to frame stories for clarity and fairness' },
			{ label: 'Beat Expertise', description: 'Deep domain knowledge that allows spotting newsworthy patterns others miss' }
		],
		evidence: 'Noy & Zhang (2023) found writing professionals using AI completed tasks 37% faster with no quality loss — but the gap between experienced and novice writers narrowed significantly.'
	},
	teaching_learning: {
		aiCanDo: 'Generating lesson plans, creating quizzes and practice exercises, summarizing curricula, personalizing reading lists, and grading objective assessments.',
		humanNeeded: 'Motivating students, adapting to emotional and social dynamics in the classroom, mentoring, handling behavioral issues, and assessing creative or nuanced work.',
		skills: [
			{ label: 'Classroom Facilitation', description: 'Reading the room, managing group dynamics, and keeping students engaged in real time' },
			{ label: 'Adaptive Mentoring', description: 'Tailoring guidance to individual learning styles, struggles, and aspirations' },
			{ label: 'Curriculum Design', description: 'Crafting holistic learning experiences that integrate AI tools without losing pedagogical depth' },
			{ label: 'Emotional Intelligence', description: 'Supporting student wellbeing, recognizing distress signals, and creating safe learning environments' }
		]
	},
	software_engineering: {
		aiCanDo: 'Code generation, test writing, documentation, code review suggestions, and debugging common patterns.',
		humanNeeded: 'System architecture decisions, complex debugging in production, cross-team coordination, requirements gathering, and security-critical code review.',
		skills: [
			{ label: 'System Design', description: 'Architecting scalable, maintainable systems and understanding trade-offs between approaches' },
			{ label: 'Debugging Complex Systems', description: 'Diagnosing production issues that span multiple services, caches, and data stores' },
			{ label: 'Stakeholder Communication', description: 'Translating technical constraints into business language and negotiating priorities' },
			{ label: 'Security Awareness', description: 'Identifying vulnerabilities, threat modeling, and ensuring code meets security standards' }
		],
		evidence: 'Dell\'Acqua et al. (2023) found consultants using AI improved quality 12-40% depending on task boundary — but performance dropped when AI was used outside its capability frontier ("jagged frontier" effect).'
	},
	data_analytics: {
		aiCanDo: 'Running standard statistical analyses, generating charts, cleaning data, writing SQL queries, and producing summary reports from structured data.',
		humanNeeded: 'Framing the right question, identifying data quality issues, interpreting results in business context, communicating insights to non-technical stakeholders, and making judgment calls on methodology.',
		skills: [
			{ label: 'Problem Framing', description: 'Defining what question the data should answer before touching a single query' },
			{ label: 'Statistical Reasoning', description: 'Knowing when a result is meaningful vs. a statistical artifact or coincidence' },
			{ label: 'Storytelling with Data', description: 'Turning numbers into narratives that drive decisions at the executive level' },
			{ label: 'Domain Contextualization', description: 'Connecting data patterns to industry realities, regulations, and operational constraints' }
		]
	},
	product_strategy: {
		aiCanDo: 'Market research summaries, competitive analysis, user feedback synthesis, roadmap documentation, and metrics dashboard generation.',
		humanNeeded: 'Vision-setting, prioritization under ambiguity, stakeholder alignment, go-to-market judgment, and making trade-offs between competing business objectives.',
		skills: [
			{ label: 'Strategic Prioritization', description: 'Deciding what to build (and what not to) when every stakeholder has a different priority' },
			{ label: 'Cross-Functional Leadership', description: 'Aligning engineering, design, sales, and marketing around a shared product vision' },
			{ label: 'Customer Intuition', description: 'Sensing unmet needs that data alone cannot reveal, through qualitative observation and empathy' },
			{ label: 'Business Model Thinking', description: 'Connecting product decisions to revenue, retention, and long-term competitive positioning' }
		]
	},
	sales_gtm: {
		aiCanDo: 'Lead scoring, email drafting, CRM data entry, competitive intelligence gathering, proposal generation, and follow-up scheduling.',
		humanNeeded: 'Building trust with prospects, navigating complex deal structures, reading buyer intent, handling objections in live conversations, and closing high-stakes negotiations.',
		skills: [
			{ label: 'Relationship Building', description: 'Developing long-term trust and rapport with clients through genuine connection' },
			{ label: 'Consultative Selling', description: 'Understanding customer pain points deeply enough to propose tailored solutions' },
			{ label: 'Negotiation', description: 'Finding creative deal structures that satisfy both buyer and seller under pressure' },
			{ label: 'Market Sensing', description: 'Reading competitive shifts, pricing dynamics, and buyer sentiment before they show up in data' }
		]
	},
	finance_investing: {
		aiCanDo: 'Financial modeling, data extraction from filings, ratio analysis, report generation, transaction categorization, and regulatory document summarization.',
		humanNeeded: 'Judgment on risk vs. return, client advisory relationships, regulatory interpretation in edge cases, fraud detection in novel scenarios, and strategic capital allocation.',
		skills: [
			{ label: 'Risk Judgment', description: 'Evaluating downside scenarios that models underweight and making calls under genuine uncertainty' },
			{ label: 'Regulatory Navigation', description: 'Interpreting evolving financial regulations and applying them to novel situations' },
			{ label: 'Client Advisory', description: 'Building trust-based relationships where clients rely on your judgment for major financial decisions' },
			{ label: 'Forensic Analysis', description: 'Spotting anomalies in financial data that suggest fraud, mismanagement, or hidden risk' }
		]
	},
	people_recruiting: {
		aiCanDo: 'Resume screening, job description writing, interview scheduling, candidate sourcing from databases, and generating offer letter templates.',
		humanNeeded: 'Assessing cultural fit, reading candidate motivations, negotiating offers, managing sensitive employee situations, and making judgment calls on team dynamics.',
		skills: [
			{ label: 'People Assessment', description: 'Reading between the lines of interviews to assess potential, not just credentials' },
			{ label: 'Candidate Experience', description: 'Making every interaction — from first email to offer — feel personal and respectful' },
			{ label: 'Organizational Design', description: 'Understanding how roles connect and what talent gaps actually matter for business outcomes' },
			{ label: 'Confidential Advisory', description: 'Handling sensitive HR matters with discretion, empathy, and sound legal awareness' }
		]
	},
	healthcare_clinical: {
		aiCanDo: 'Diagnostic pattern recognition, medical literature synthesis, appointment scheduling, patient record summarization, and drug interaction checking.',
		humanNeeded: 'Patient examination, clinical judgment under uncertainty, empathetic communication, emergency decision-making, and informed consent processes.',
		skills: [
			{ label: 'Clinical Reasoning', description: 'Integrating symptoms, history, and intuition to diagnose when textbook answers do not fit' },
			{ label: 'Patient Communication', description: 'Explaining complex diagnoses in plain language while being sensitive to emotional states' },
			{ label: 'Emergency Response', description: 'Making rapid, high-stakes decisions with incomplete information in time-critical situations' },
			{ label: 'Ethical Decision-Making', description: 'Navigating care trade-offs, end-of-life conversations, and resource allocation dilemmas' }
		]
	},
	design_creative: {
		aiCanDo: 'Generating visual concepts, creating layout variations, producing mockups from descriptions, and automating repetitive design tasks like resizing.',
		humanNeeded: 'Understanding user needs through research, making aesthetic judgments that reflect brand identity, designing for emotional impact, and iterating based on nuanced feedback.',
		skills: [
			{ label: 'Design Thinking', description: 'Empathizing with users and iterating on solutions through prototyping and qualitative testing' },
			{ label: 'Visual Storytelling', description: 'Crafting designs that communicate meaning, hierarchy, and emotion beyond surface aesthetics' },
			{ label: 'User Research', description: 'Conducting interviews, usability tests, and contextual inquiry to ground design in real behavior' },
			{ label: 'Brand Coherence', description: 'Ensuring every touchpoint feels like the same brand while adapting to different contexts and platforms' }
		]
	},
	operations_logistics: {
		aiCanDo: 'Demand forecasting, route optimization, inventory tracking, order processing automation, and supplier performance dashboards.',
		humanNeeded: 'Managing supplier relationships, handling disruptions in real time, negotiating contracts, quality assurance for non-standard goods, and adapting logistics to local regulations.',
		skills: [
			{ label: 'Supply Chain Resilience', description: 'Building redundancy and flexibility into supply chains to handle disruptions gracefully' },
			{ label: 'Vendor Negotiation', description: 'Securing favorable terms while maintaining long-term supplier partnerships' },
			{ label: 'Process Optimization', description: 'Identifying bottlenecks and waste in operational workflows through direct observation' },
			{ label: 'Regulatory Compliance', description: 'Navigating import/export rules, safety standards, and local regulations across jurisdictions' }
		]
	},
	legal_compliance: {
		aiCanDo: 'Legal research, document review, contract clause extraction, regulatory filing preparation, and case law summarization.',
		humanNeeded: 'Legal strategy, courtroom advocacy, client counseling on risk tolerance, interpreting ambiguous statutes, and ethical judgment in adversarial situations.',
		skills: [
			{ label: 'Legal Strategy', description: 'Crafting case strategies and compliance frameworks that account for precedent, politics, and business reality' },
			{ label: 'Advocacy', description: 'Persuading judges, regulators, and opposing counsel through structured argumentation and credibility' },
			{ label: 'Risk Counseling', description: 'Helping clients understand legal exposure and make informed business decisions under uncertainty' },
			{ label: 'Regulatory Interpretation', description: 'Applying evolving laws to novel business models where clear precedent does not exist' }
		]
	},
	field_manual: {
		aiCanDo: 'Predictive maintenance scheduling, safety checklist automation, inventory management, and remote monitoring via sensors.',
		humanNeeded: 'Physical dexterity on job sites, real-time environmental adaptation, operating heavy equipment safely, and handling unexpected on-site conditions.',
		skills: [
			{ label: 'Hands-On Expertise', description: 'Physical skills, spatial awareness, and motor coordination that no software can replicate' },
			{ label: 'On-Site Problem Solving', description: 'Diagnosing and fixing issues in unpredictable real-world environments' },
			{ label: 'Safety Protocols', description: 'Preventing accidents through situational awareness, training, and strict procedural discipline' },
			{ label: 'Equipment Proficiency', description: 'Operating, maintaining, and troubleshooting specialized tools and machinery' }
		]
	},
	service_hospitality: {
		aiCanDo: 'Reservation management, menu recommendations, order processing, loyalty program tracking, and basic customer query handling via chatbots.',
		humanNeeded: 'Genuine hospitality and warmth, reading customer moods, handling complaints gracefully, creating memorable experiences, and adapting service to cultural expectations.',
		skills: [
			{ label: 'Emotional Intelligence', description: 'Reading customer needs and responding with empathy, patience, and genuine care' },
			{ label: 'Conflict De-escalation', description: 'Turning negative experiences into positive ones through calm, confident communication' },
			{ label: 'Cultural Sensitivity', description: 'Adapting service style to diverse customer backgrounds and expectations' },
			{ label: 'Experience Crafting', description: 'Creating moments that make customers feel valued and eager to return' }
		],
		evidence: 'Brynjolfsson et al. (2023) found customer service agents using AI saw +14% productivity, with the biggest gains among junior workers — AI compressed the experience gap.'
	},
	general_professional: {
		aiCanDo: 'Report drafting, data compilation, meeting summarization, email triaging, and standard analytical tasks.',
		humanNeeded: 'Strategic decision-making, client relationship management, professional judgment in edge cases, cross-functional coordination, and ethical oversight.',
		skills: [
			{ label: 'Professional Judgment', description: 'Making sound decisions in ambiguous situations where rules and guidelines fall short' },
			{ label: 'Stakeholder Management', description: 'Navigating competing priorities across internal and external partners with diplomacy' },
			{ label: 'Domain Expertise', description: 'Deep specialized knowledge that requires years of study, practice, and contextual experience' },
			{ label: 'AI Tool Proficiency', description: 'Leveraging AI assistants to multiply your output while maintaining quality control' }
		]
	},
	general_technical: {
		aiCanDo: 'Technical documentation, standard testing procedures, data logging, routine diagnostics, and equipment monitoring.',
		humanNeeded: 'Hands-on troubleshooting, interpreting non-standard test results, calibrating instruments, and bridging communication between engineers and operators.',
		skills: [
			{ label: 'Technical Proficiency', description: 'Applied technical skills that bridge theory and hands-on execution in real environments' },
			{ label: 'Diagnostic Reasoning', description: 'Interpreting test results and instrument readings that fall outside normal parameters' },
			{ label: 'Adaptability', description: 'Learning new tools, processes, and technologies as the technical landscape evolves' },
			{ label: 'Cross-Team Communication', description: 'Translating between engineers, managers, and frontline workers in plain language' }
		]
	},
	general_clerical: {
		aiCanDo: 'Data entry, invoice processing, appointment scheduling, document filing, and standard correspondence drafting.',
		humanNeeded: 'Exception handling for non-standard requests, institutional knowledge of internal processes, coordinating across departments, and managing sensitive information.',
		skills: [
			{ label: 'Process Optimization', description: 'Streamlining workflows and identifying efficiency improvements in daily operations' },
			{ label: 'AI Tool Proficiency', description: 'Leveraging AI assistants to automate routine tasks and multiply your output' },
			{ label: 'Institutional Knowledge', description: 'Understanding how things actually get done inside the organization beyond formal procedures' },
			{ label: 'Exception Handling', description: 'Resolving non-standard situations that fall outside automated workflows' }
		]
	}
};

export function getPersonalizedContent(ssoc: string, title: string, majorGroup: string): ArchetypeContent {
	const archetype = classifyArchetype(ssoc, title, majorGroup);
	return archetypeContentMap[archetype];
}

/**
 * Blend archetype content from multiple components.
 * Uses the role title to determine the primary archetype, then enriches
 * skills from component archetypes (deduplicated).
 */
export function blendArchetypes(
	roleTitle: string,
	components: Array<{ ssoc: string; title: string; majorGroup: string; weight: number }>
): ArchetypeContent {
	// Primary archetype: use the highest-weight component's SSOC for prefix fallback,
	// not a dummy '00000' that defeats all prefix-based classification
	const primarySsoc =
		components.length > 0
			? components.reduce((a, b) => (a.weight > b.weight ? a : b)).ssoc
			: '00000';
	const primaryArchetype = classifyArchetype(primarySsoc, roleTitle, '');
	const primaryContent = archetypeContentMap[primaryArchetype];

	if (components.length === 0) return primaryContent;

	// Collect unique skills from component archetypes (weighted by component weight)
	const seenLabels = new Set(primaryContent.skills.map((s) => s.label));
	const extraSkills: Array<{ label: string; description: string; weight: number }> = [];

	for (const comp of components) {
		const arch = classifyArchetype(comp.ssoc, comp.title, comp.majorGroup);
		if (arch === primaryArchetype) continue;

		const content = archetypeContentMap[arch];
		for (const skill of content.skills) {
			if (!seenLabels.has(skill.label)) {
				seenLabels.add(skill.label);
				extraSkills.push({ ...skill, weight: comp.weight });
			}
		}
	}

	// Take top 2 extra skills by weight to add diversity without overwhelming
	const bonusSkills = extraSkills
		.sort((a, b) => b.weight - a.weight)
		.slice(0, 2)
		.map(({ label, description }) => ({ label, description }));

	return {
		aiCanDo: primaryContent.aiCanDo,
		humanNeeded: primaryContent.humanNeeded,
		skills: [...primaryContent.skills, ...bonusSkills]
	};
}
