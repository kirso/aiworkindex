export const workActivities = [
	{
		id: 'drafting',
		label: 'Drafting and editing',
		description: 'Writing, summarising, translating or preparing first versions.'
	},
	{
		id: 'research',
		label: 'Research and analysis',
		description: 'Finding information, comparing options, calculations or pattern-finding.'
	},
	{
		id: 'routine',
		label: 'Routine processing',
		description: 'Forms, records, scheduling, classification or repeatable admin work.'
	},
	{
		id: 'coordination',
		label: 'Planning and coordination',
		description: 'Organising people, projects, hand-offs, priorities or resources.'
	},
	{
		id: 'people',
		label: 'People, trust and care',
		description: 'Teaching, persuading, supporting, negotiating or handling sensitive situations.'
	},
	{
		id: 'physical',
		label: 'Physical or on-site work',
		description: 'Using equipment, moving through a site, inspecting or working with your hands.'
	},
	{
		id: 'judgment',
		label: 'Judgment and exceptions',
		description: 'Making consequential calls, resolving ambiguity or taking responsibility.'
	}
] as const;

export type WorkActivity = (typeof workActivities)[number]['id'];
export type AiUse = 'not_yet' | 'sometimes' | 'often';
export type ErrorImpact = 'limited' | 'material' | 'serious';
export type ReviewResponsibility = 'support' | 'shared' | 'final';

export type PersonalWorkAnswers = {
	activities: WorkActivity[];
	aiUse: AiUse;
	errorImpact: ErrorImpact;
	reviewResponsibility: ReviewResponsibility;
};

export type GuidanceBasis = 'From your answers' | 'Reviewed guidance';

export type GuidanceItem = {
	title: string;
	detail: string;
	basis: GuidanceBasis;
};

export type GuidanceGroup = {
	id: 'try' | 'verify' | 'human' | 'strengthen' | 'ask' | 'monitor';
	label: string;
	intro: string;
	items: GuidanceItem[];
};

export const defaultPersonalWorkAnswers: PersonalWorkAnswers = {
	activities: [],
	aiUse: 'not_yet',
	errorImpact: 'material',
	reviewResponsibility: 'shared'
};

const activityIds = new Set<WorkActivity>(workActivities.map(activity => activity.id));

export function parsePersonalWorkAnswers(raw: string | null): PersonalWorkAnswers {
	if (!raw) return structuredClone(defaultPersonalWorkAnswers);

	try {
		const value = JSON.parse(raw) as Partial<PersonalWorkAnswers>;
		return {
			activities: Array.isArray(value.activities)
				? value.activities.filter((activity): activity is WorkActivity =>
						activityIds.has(activity as WorkActivity)
					)
				: [],
			aiUse: ['not_yet', 'sometimes', 'often'].includes(value.aiUse ?? '')
				? (value.aiUse as AiUse)
				: 'not_yet',
			errorImpact: ['limited', 'material', 'serious'].includes(value.errorImpact ?? '')
				? (value.errorImpact as ErrorImpact)
				: 'material',
			reviewResponsibility: ['support', 'shared', 'final'].includes(
				value.reviewResponsibility ?? ''
			)
				? (value.reviewResponsibility as ReviewResponsibility)
				: 'shared'
		};
	} catch {
		return structuredClone(defaultPersonalWorkAnswers);
	}
}

function item(title: string, detail: string, basis: GuidanceBasis): GuidanceItem {
	return { title, detail, basis };
}

export function buildPersonalWorkGuidance(answers: PersonalWorkAnswers): GuidanceGroup[] {
	const has = (activity: WorkActivity) => answers.activities.includes(activity);
	const tryItems: GuidanceItem[] = [];
	const humanItems: GuidanceItem[] = [];
	const strengthenItems: GuidanceItem[] = [];

	if (has('drafting')) {
		tryItems.push(
			item(
				'Test a first draft',
				'Choose a low-consequence document. Give the tool context and a clear audience, then edit the result yourself.',
				'From your answers'
			)
		);
	}
	if (has('research')) {
		tryItems.push(
			item(
				'Build a first-pass research plan',
				'Ask for questions, search terms or a comparison structure. Check every important claim against the original source.',
				'From your answers'
			)
		);
	}
	if (has('routine')) {
		tryItems.push(
			item(
				'Test one repeatable step',
				'Pick a reversible admin task with a known correct result. Record the time saved and the errors you still had to fix.',
				'From your answers'
			)
		);
	}
	if (tryItems.length === 0) {
		tryItems.push(
			item(
				'Find one bounded experiment',
				'Choose a small, reversible task with a result you can check. Compare the AI-assisted and normal versions before changing your workflow.',
				'Reviewed guidance'
			)
		);
	}

	if (has('people')) {
		humanItems.push(
			item(
				'Lead the relationship',
				'Keep trust-building, sensitive conversations, negotiation and care with the person who understands the situation and owns the relationship.',
				'From your answers'
			)
		);
	}
	if (has('physical')) {
		humanItems.push(
			item(
				'Keep the site in the loop',
				'Let people on the ground own physical execution, safety checks and observations that are missing from the digital record.',
				'From your answers'
			)
		);
	}
	if (has('judgment') || answers.reviewResponsibility === 'final') {
		humanItems.push(
			item(
				'Keep final judgment visible',
				'Name the person who handles exceptions and signs off. AI can support the work; responsibility still needs a clear owner.',
				'From your answers'
			)
		);
	}
	if (has('coordination')) {
		humanItems.push(
			item(
				'Protect context at hand-offs',
				'Use AI for preparation where useful, while people resolve priorities, commitments and information that is not written down.',
				'From your answers'
			)
		);
	}
	if (humanItems.length === 0) {
		humanItems.push(
			item(
				'Keep an accountable reviewer',
				'Decide who checks the result, handles exceptions and answers for the final output before expanding an experiment.',
				'Reviewed guidance'
			)
		);
	}

	if (has('drafting') || has('research') || has('routine')) {
		strengthenItems.push(
			item(
				'Problem framing and verification',
				'Practise giving useful context, defining a good result, checking sources and documenting corrections.',
				'From your answers'
			)
		);
	}
	if (has('people') || has('coordination')) {
		strengthenItems.push(
			item(
				'Facilitation and clear decisions',
				'Build the skills that turn competing needs and incomplete information into an agreed next step.',
				'From your answers'
			)
		);
	}
	if (has('physical') || has('judgment')) {
		strengthenItems.push(
			item(
				'Context that is hard to digitise',
				'Deepen practical judgment, exception handling and the ability to explain why the situation differs from the standard case.',
				'From your answers'
			)
		);
	}
	if (strengthenItems.length === 0) {
		strengthenItems.push(
			item(
				'Describe the work clearly',
				'Break a job into tasks, inputs, quality checks and decisions. This makes both training and responsible AI use more concrete.',
				'Reviewed guidance'
			)
		);
	}

	const highStakes = answers.errorImpact === 'serious' || answers.reviewResponsibility === 'final';
	const verifyItems = [
		item(
			'Check against the source of truth',
			'Compare names, figures, dates and important claims with the original record. Keep the source beside the generated output.',
			'Reviewed guidance'
		),
		...(highStakes
			? [
					item(
						'Use a named reviewer and checklist',
						'Your answers point to serious consequences or final responsibility. Require an explicit review before the result reaches a customer, patient, regulator or decision-maker.',
						'From your answers' as const
					)
				]
			: [])
	];

	const askItems = [
		item(
			'Which tools and data are approved?',
			'Ask what may be entered into an AI tool, which records must stay private and who can approve a new use.',
			'Reviewed guidance'
		),
		item(
			'Who owns quality when AI helps?',
			'Agree on review responsibility, acceptable error rates and how mistakes are reported before the workflow becomes routine.',
			'Reviewed guidance'
		),
		...(answers.aiUse === 'not_yet'
			? [
					item(
						'Is there time for a supervised trial?',
						'You said AI is not part of your work today. Ask for an approved, low-consequence experiment and a way to compare results.',
						'From your answers' as const
					)
				]
			: [])
	];

	return [
		{
			id: 'try',
			label: 'Try',
			intro: 'Small experiments with a result you can inspect.',
			items: tryItems
		},
		{
			id: 'verify',
			label: 'Verify carefully',
			intro: 'Checks to run before you trust or share the result.',
			items: verifyItems
		},
		{
			id: 'human',
			label: 'Keep human-led',
			intro: 'Work where context, trust, presence or responsibility matters.',
			items: humanItems
		},
		{
			id: 'strengthen',
			label: 'Strengthen',
			intro: 'Capabilities that make you more useful in an AI-assisted workflow.',
			items: strengthenItems
		},
		{
			id: 'ask',
			label: 'Ask at work',
			intro: 'Questions that turn a vague AI rollout into a responsible process.',
			items: askItems
		},
		{
			id: 'monitor',
			label: 'Monitor',
			intro: 'Signals that show whether technical pressure is becoming real change.',
			items: [
				item(
					'Tasks and expectations',
					'Watch for changes in who does first drafts, checks work, handles customers and carries final responsibility.',
					'Reviewed guidance'
				),
				item(
					'Tools, training and hiring',
					'Notice approved tool rollouts, training time, output targets and changes to junior hiring or team design.',
					'Reviewed guidance'
				),
				item(
					'Singapore pay and demand',
					'Revisit the occupation record when AI Work Index publishes a new comparable release or updated official market source.',
					'Reviewed guidance'
				)
			]
		}
	];
}
