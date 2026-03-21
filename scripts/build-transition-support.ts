#!/usr/bin/env bun
/**
 * build-transition-support.ts — Publish the heuristic transition-support layer
 * derived from the existing transition-capacity model. This is kept separate
 * from the structural score because it is a decision-support heuristic, not an
 * official observed transition dataset.
 *
 * Run: bun run scripts/build-transition-support.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { occupations } from '../src/lib/data';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import { categorizeTransitions, findBestTransitions } from '../src/lib/data/transition-capacity';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const OUT_FILE = path.join(DATA_DIR, 'transition-support.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'transition-support.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-transition-support-v4.json');
const TRANSITION_INFRASTRUCTURE_FILE = path.join(DATA_DIR, 'transition-infrastructure.json');
const INDUSTRY_CONTEXT_FILE = path.join(DATA_DIR, 'industry-context.json');
const EMPIRICAL_MOBILITY_FILE = path.join(
	DATA_DIR,
	'raw',
	'external',
	'sg_empirical_mobility.json'
);

function readJson<T>(filePath: string): T | null {
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function compactTransition(transition: ReturnType<typeof findBestTransitions>[number]) {
	return {
		to_ssoc: transition.to_ssoc,
		to_title: transition.to_title,
		composite: Number(transition.composite.toFixed(4)),
		label: transition.label,
		archetype_similarity: Number(transition.archetype_similarity.toFixed(4)),
		skill_overlap: Number(transition.skill_overlap.toFixed(4)),
		wage_preservation: Number(transition.wage_preservation.toFixed(4)),
		demand_strength: Number(transition.demand_strength.toFixed(4)),
		risk_improvement: Number(transition.risk_improvement.toFixed(4)),
		credential_gap: Number(transition.credential_gap.toFixed(4)),
		observed_transition_rate: transition.observed_transition_rate ?? null,
		observed_wage_delta: transition.observed_wage_delta ?? null,
		observed_training_duration_months: transition.observed_training_duration_months ?? null,
		observed_source: transition.observed_source ?? null,
		observed_vintage: transition.observed_vintage ?? null
	};
}

interface EmpiricalMobilityPayload {
	source?: {
		title?: string;
		survey_period?: string;
	};
	granularity?: string;
	observed_transition_rate_basis?: string;
	transitions?: Array<{
		from_major_group: string;
		to_major_group: string;
		covered_share: number | null;
	}>;
}

const transitionInfrastructure = readJson<Record<string, unknown>>(TRANSITION_INFRASTRUCTURE_FILE);
const empiricalMobility = readJson<EmpiricalMobilityPayload>(EMPIRICAL_MOBILITY_FILE);
const industryContextData = readJson<
	| {
			groups?: Record<string, { top_industries?: Array<{ label: string }> }>;
	  }
	| Record<string, { top_industries?: Array<{ label: string }> }>
>(INDUSTRY_CONTEXT_FILE);

const GROUP_LABELS: Record<string, string> = {
	'Managers & Administrators (Including Working Proprietors)': 'MANAGERS',
	Professionals: 'PROFESSIONALS',
	'Associate Professionals & Technicians': 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
	'Clerical Support Workers': 'CLERICAL SUPPORT WORKERS',
	'Service & Sales Workers': 'SERVICE AND SALES WORKERS',
	'Craftsmen & Related Trades Workers': 'CRAFTSMEN AND RELATED TRADES WORKERS',
	'Plant & Machine Operators & Assemblers': 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
	'Cleaners, Labourers & Related Workers': 'CLEANERS, LABOURERS AND RELATED WORKERS'
};

function normalizeLabel(value: string | undefined | null): string {
	return (value ?? '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function empiricalMobilityKey(fromMajorGroup: string, toMajorGroup: string): string {
	return `${normalizeLabel(fromMajorGroup)}::${normalizeLabel(toMajorGroup)}`;
}

const empiricalMobilityByGroup = new Map(
	(empiricalMobility?.transitions ?? []).map(entry => [
		empiricalMobilityKey(entry.from_major_group, entry.to_major_group),
		entry
	])
);

const empiricalSourceLabel = empiricalMobility?.source?.title
	? `${empiricalMobility.source.title}${empiricalMobility?.granularity ? ` (${empiricalMobility.granularity})` : ''}${empiricalMobility?.observed_transition_rate_basis ? ` — ${empiricalMobility.observed_transition_rate_basis}` : ''}`
	: null;

function getObservedMobilityEvidence(fromMajorGroup: string, toMajorGroup: string) {
	const entry = empiricalMobilityByGroup.get(empiricalMobilityKey(fromMajorGroup, toMajorGroup));
	return {
		observed_transition_rate: entry?.covered_share ?? null,
		observed_wage_delta: null,
		observed_training_duration_months: null,
		observed_source: entry ? empiricalSourceLabel : null,
		observed_vintage: entry ? (empiricalMobility?.source?.survey_period ?? null) : null
	};
}

const jtmSectorCoverage = new Set<string>(
	(
		transitionInfrastructure?.jobs_transformation_maps as { sector_coverage?: string[] } | undefined
	)?.sector_coverage?.map(sector => normalizeLabel(sector)) ?? []
);

const occupationsBySsoc = new Map(occupations.map(occupation => [occupation.ssoc, occupation]));

function compactTransitionWithEvidence(
	fromOccupation: (typeof occupations)[number],
	transition: ReturnType<typeof findBestTransitions>[number]
) {
	const toOccupation = occupationsBySsoc.get(transition.to_ssoc);
	const observedEvidence = toOccupation
		? getObservedMobilityEvidence(fromOccupation.major_group, toOccupation.major_group)
		: {
				observed_transition_rate: null,
				observed_wage_delta: null,
				observed_training_duration_months: null,
				observed_source: null,
				observed_vintage: null
			};

	return {
		...compactTransition(transition),
		...observedEvidence
	};
}

function getIndustryLabelsForOccupation(majorGroup: string): string[] {
	const groupKey = GROUP_LABELS[majorGroup] ?? majorGroup;
	const groups =
		industryContextData && 'groups' in industryContextData
			? industryContextData.groups
			: industryContextData;
	const context = groups?.[groupKey];
	return (context?.top_industries ?? []).map(industry => industry.label);
}

function industryHasJtmCoverage(industryLabel: string): boolean {
	const normalized = normalizeLabel(industryLabel);
	const candidates = new Set<string>([normalized]);
	if (normalized === 'financial and insurance services') candidates.add('financial services');
	if (normalized === 'information and communications') candidates.add('information communications');
	if (normalized === 'wholesale and retail trade') {
		candidates.add('wholesale trade');
		candidates.add('retail');
	}
	if (normalized === 'accommodation and food services') {
		candidates.add('food services');
		candidates.add('hotel');
	}
	if (normalized === 'transportation and storage') {
		candidates.add('land transport');
		candidates.add('logistics');
	}
	if (normalized === 'professional services') candidates.add('professional services');
	return [...candidates].some(candidate => jtmSectorCoverage.has(candidate));
}

function buildOfficialProgrammeSupport(skillsfutureEligible: boolean, majorGroup: string) {
	const matchedIndustries =
		getIndustryLabelsForOccupation(majorGroup).filter(industryHasJtmCoverage);
	const wsqSummary = transitionInfrastructure?.wsq_training as
		| {
				latest_year?: string;
				total_trainees_latest?: number;
				statement_attainment_latest_year?: string;
				statement_attainment_shares_latest?: Array<{ label: string; share: number | null }>;
		  }
		| undefined;
	const baseProgrammes = ['CareersFinder'];
	const recommendedProgrammes = [...baseProgrammes];

	if (matchedIndustries.length > 0) {
		recommendedProgrammes.push('Jobs Transformation Maps', 'Skills Framework');
	}
	if (skillsfutureEligible) {
		recommendedProgrammes.unshift(
			'Career Conversion Programmes',
			'SkillsFuture Career Transition Programme'
		);
	}

	const support_tier = skillsfutureEligible
		? matchedIndustries.length > 0
			? 'jtm_aligned_family_support'
			: 'broad_family_support'
		: matchedIndustries.length > 0
			? 'sector_transition_support'
			: 'general_public_support';

	const basisParts = [
		skillsfutureEligible
			? 'Broad occupation-family match to published SkillsFuture / WSG support.'
			: 'General public transition infrastructure is available, but no broad family match is asserted.'
	];
	if (matchedIndustries.length > 0) {
		basisParts.push(
			`Top industry alignment with JTM-covered sectors: ${matchedIndustries.join(', ')}.`
		);
	}
	if (wsqSummary?.latest_year && wsqSummary?.total_trainees_latest) {
		basisParts.push(
			`WSQ system scale reference: ${wsqSummary.total_trainees_latest.toLocaleString()} trainees in ${wsqSummary.latest_year}.`
		);
	}
	const dominantAttainment = (wsqSummary?.statement_attainment_shares_latest ?? [])
		.filter(
			(entry): entry is { label: string; share: number } =>
				typeof entry.share === 'number' && entry.share > 0
		)
		.sort((a, b) => b.share - a.share)[0];
	if (dominantAttainment && wsqSummary?.statement_attainment_latest_year) {
		basisParts.push(
			`Latest published WSQ attainment mix (${wsqSummary.statement_attainment_latest_year}) is led by ${dominantAttainment.label.toLowerCase()} programmes.`
		);
	}

	return {
		support_tier,
		recommended_programmes: [...new Set(recommendedProgrammes)],
		basis: basisParts.join(' '),
		jtm_sector_alignment: matchedIndustries,
		wsq_training_reference: wsqSummary
			? {
					latest_year: wsqSummary.latest_year ?? null,
					total_trainees_latest: wsqSummary.total_trainees_latest ?? null
				}
			: null
	};
}

const transitions = occupations.map(from => {
	const candidateSet = findBestTransitions(from, occupations, 25);
	const categorized = categorizeTransitions(candidateSet);
	const skillsfutureEligible = from.sg_context?.skillsfuture_eligible ?? false;
	const compact = (transition: ReturnType<typeof findBestTransitions>[number]) =>
		compactTransitionWithEvidence(from, transition);

	return {
		from_ssoc: from.ssoc,
		from_title: from.title,
		from_risk_band: from.risk_band,
		from_net_risk: Number(from.net_risk.toFixed(4)),
		from_wage: from.gross_wage_median,
		skillsfuture_eligible: skillsfutureEligible,
		official_programme_support: buildOfficialProgrammeSupport(
			skillsfutureEligible,
			from.major_group
		),
		top_overall: candidateSet.slice(0, 5).map(compact),
		easier_switch: categorized.easierSwitch.map(compact),
		lower_risk: categorized.lowerRisk.map(compact),
		better_pay: categorized.betterPay.map(compact),
		strong_demand: categorized.strongDemand.map(compact)
	};
});

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Hybrid transition-support artifact combining the deterministic AI Work Index transition-capacity model with official Singapore transition-infrastructure anchors.',
	notes: [
		'Uses the published structural score plus wage, demand, archetype, and credential-gap heuristics.',
		'Published separately from the structural score because it is a support layer, not a measured labour-market outcome.',
		'Official Singapore transition infrastructure is attached as programme context; occupation-level transition matching remains a heuristic.',
		'When present, observed_transition_rate is attached as a broad major-group empirical prior from Singapore Census 2000 data. It is published as evidence and does not yet re-rank transition recommendations.',
		'SkillsFuture eligibility is a broad Singapore context flag, not proof that a specific transition pathway is available.'
	],
	official_transition_infrastructure: transitionInfrastructure,
	transitions
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const serialized = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, serialized, 'utf-8');

console.log(`Built transition support artifact at ${STATIC_OUT_FILE}`);
