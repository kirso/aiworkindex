#!/usr/bin/env bun
/**
 * build-offset-potential.ts — Publish a separate heuristic layer for the
 * offsetting forces that can cushion structural AI pressure. This is not a
 * direct measure of reinstatement or realised job creation. It is a support
 * layer built from current demand persistence, transition support, task
 * reallocation room, and switching friction.
 *
 * Run: bun run scripts/build-offset-potential.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { occupations } from '../src/lib/data';
import type { Occupation } from '../src/lib/data';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import type { PostingAggregate } from '../src/lib/data/postings-monitor';
import type { EmployerPressureEntry } from '../src/lib/data/employer-pressure';
import type { OnetEnrichmentEntry } from '../src/lib/data/onet-enrichment';
import { classifyArchetype } from '../src/lib/data/role-archetypes';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const OUT_FILE = path.join(DATA_DIR, 'offset-potential.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'offset-potential.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-offset-potential-v4.json');

const TRANSITION_SUPPORT_FILE = path.join(SRC_DATA_DIR, 'transition-support.json');
const POSTINGS_MONITOR_FILE = path.join(SRC_DATA_DIR, 'postings-monitor.json');
const EMPLOYER_SIGNALS_FILE = path.join(SRC_DATA_DIR, 'employer-signals.json');
const ONET_ENRICHMENT_FILE = path.join(SRC_DATA_DIR, 'onet-enrichment.json');
const INDUSTRY_CONTEXT_FILE = path.join(SRC_DATA_DIR, 'industry-context.json');

type OffsetPotentialBand = 'low' | 'medium' | 'high';

interface TransitionSupportRow {
	from_ssoc: string;
	skillsfuture_eligible: boolean;
	official_programme_support: {
		support_tier: string;
		recommended_programmes: string[];
		jtm_sector_alignment?: string[];
	};
	top_overall: Array<{
		composite: number;
		credential_gap: number;
	}>;
}

interface PostingsMonitorData {
	by_ssoc: Record<string, PostingAggregate>;
}

interface EmployerSignalsData {
	by_archetype: Record<
		string,
		EmployerPressureEntry & {
			label: EmployerPressureEntry['label'];
		}
	>;
}

interface IndustryContextData {
	groups?: Record<
		string,
		{
			top_industries?: Array<{
				share_2025: number;
				vacancy_signal: 'rising' | 'stable' | 'cooling' | null;
				vacancy_share_latest: number | null;
				vacancy_rank_latest: number | null;
			}>;
		}
	>;
}

interface OffsetPotentialEntry {
	ssoc: string;
	title: string;
	score: number;
	band: OffsetPotentialBand;
	summary: string;
	strengths: string[];
	cautions: string[];
	components: {
		demand_persistence: number;
		transition_support: number;
		reallocation_room: number;
		mobility_friction: number;
	};
	basis: string;
}

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

const transitionSupportData = readJson<{ transitions: TransitionSupportRow[] }>(
	TRANSITION_SUPPORT_FILE
);
const postingsMonitor = readJson<PostingsMonitorData>(POSTINGS_MONITOR_FILE);
const employerSignals = readJson<EmployerSignalsData>(EMPLOYER_SIGNALS_FILE);
const onetEnrichment = readJson<OnetEnrichmentEntry[]>(ONET_ENRICHMENT_FILE);
const industryContextData = readJson<IndustryContextData>(INDUSTRY_CONTEXT_FILE);

const transitionSupportBySsoc = new Map(
	transitionSupportData.transitions.map(entry => [entry.from_ssoc, entry])
);
const onetBySsoc = new Map(onetEnrichment.map(entry => [entry.ssoc, entry]));

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function average(values: number[], fallback: number): number {
	return values.length > 0
		? values.reduce((sum, value) => sum + value, 0) / values.length
		: fallback;
}

function getDemandSignalScore(occupation: Occupation): number {
	if (occupation.evidence.sol_match && occupation.evidence.jobs_in_demand_match) return 1;
	if (occupation.evidence.sol_match || occupation.evidence.jobs_in_demand_match) return 0.78;
	return 0.18;
}

function getLabourScore(occupation: Occupation): number {
	switch (occupation.labour_monitor?.overall) {
		case 'strong':
			return 1;
		case 'moderate':
			return 0.68;
		case 'weak':
			return 0.38;
		case 'deteriorating':
			return 0.18;
		default:
			return 0.45;
	}
}

function getPostingsScore(postings: PostingAggregate | null): number {
	switch (postings?.hiring_state) {
		case 'active':
			return 1;
		case 'moderate':
			return 0.75;
		case 'thin':
			return 0.5;
		case 'stale':
			return 0.25;
		case 'no_signal':
			return 0.15;
		default:
			return 0.25;
	}
}

function getEmployerPressurePenalty(entry: EmployerPressureEntry | null): number {
	switch (entry?.label) {
		case 'critical':
			return 0.6;
		case 'high':
			return 0.38;
		case 'moderate':
			return 0.18;
		case 'low':
			return 0.05;
		default:
			return 0.1;
	}
}

function getSupportTierScore(tier: string | undefined): number {
	switch (tier) {
		case 'jtm_aligned_family_support':
			return 0.82;
		case 'broad_family_support':
			return 0.68;
		case 'sector_transition_support':
			return 0.52;
		case 'general_public_support':
			return 0.32;
		default:
			return 0.32;
	}
}

function getDemandPersistenceScore(
	occupation: Occupation,
	postings: PostingAggregate | null,
	employerPressure: EmployerPressureEntry | null
): number {
	const official = getDemandSignalScore(occupation);
	const labour = getLabourScore(occupation);
	const postingsScore = getPostingsScore(postings);
	const industryDemand = getIndustryDemandSupportScore(occupation);
	const employerPenalty = getEmployerPressurePenalty(employerPressure);
	return clamp01(
		0.35 * official +
			0.25 * labour +
			0.2 * postingsScore +
			0.2 * industryDemand -
			0.15 * employerPenalty
	);
}

function getIndustryDemandSupportScore(occupation: Occupation): number {
	const group = industryContextData.groups?.[occupation.major_group];
	const industries = (group?.top_industries ?? []).slice(0, 3);
	if (industries.length === 0) return 0.45;
	const weighted = industries.reduce((sum, industry) => {
		const signalScore =
			industry.vacancy_signal === 'rising'
				? 1
				: industry.vacancy_signal === 'stable'
					? 0.68
					: industry.vacancy_signal === 'cooling'
						? 0.32
						: 0.5;
		const shareScore = clamp01((industry.vacancy_share_latest ?? 0) / 0.12);
		const rankScore =
			industry.vacancy_rank_latest !== null
				? clamp01(1 - (industry.vacancy_rank_latest - 1) / 12)
				: 0.45;
		return sum + industry.share_2025 * (0.45 * signalScore + 0.35 * shareScore + 0.2 * rankScore);
	}, 0);
	const totalWeight = industries.reduce((sum, industry) => sum + industry.share_2025, 0) || 1;
	return clamp01(weighted / totalWeight);
}

function getTransitionSupportScore(row: TransitionSupportRow | null): number {
	if (!row) return 0.28;
	const supportTier = getSupportTierScore(row.official_programme_support.support_tier);
	const transitionCapacity = average(
		row.top_overall.slice(0, 3).map(transition => transition.composite),
		0.35
	);
	const skillsfutureBonus = row.skillsfuture_eligible ? 0.05 : 0;
	return clamp01(0.65 * supportTier + 0.35 * transitionCapacity + skillsfutureBonus);
}

function getReallocationRoomScore(
	occupation: Occupation,
	onetEntry: OnetEnrichmentEntry | null
): number {
	const augmentation = clamp01(occupation.augmentation / 0.25);
	const taskBreadth = clamp01((onetEntry?.tasks.length ?? 0) / 6);
	return clamp01(0.5 * occupation.bottleneck + 0.3 * augmentation + 0.2 * taskBreadth);
}

function getMobilityFrictionScore(
	occupation: Occupation,
	row: TransitionSupportRow | null
): number {
	const licensing =
		occupation.sg_context?.licensed_profession === 'strict'
			? 1
			: occupation.sg_context?.licensed_profession === 'partial'
				? 0.7
				: 0.15;
	const credentialPenalty =
		1 -
		average(
			(row?.top_overall ?? []).slice(0, 3).map(transition => transition.credential_gap),
			0.72
		);
	return clamp01(0.65 * licensing + 0.35 * credentialPenalty);
}

function getOffsetBand(score: number): OffsetPotentialBand {
	if (score >= 0.68) return 'high';
	if (score >= 0.42) return 'medium';
	return 'low';
}

function describeStrengths(demand: number, transition: number, reallocation: number): string[] {
	const strengths: string[] = [];
	if (demand >= 0.62)
		strengths.push('Demand still persists through current labour or hiring signals.');
	if (transition >= 0.62)
		strengths.push('Nearby moves and published transition support look reasonably strong.');
	if (reallocation >= 0.62)
		strengths.push(
			'A meaningful share of the work can likely be reorganized around AI rather than removed outright.'
		);
	return strengths.slice(0, 3);
}

function describeCautions(
	demand: number,
	friction: number,
	employerPressure: EmployerPressureEntry | null
): string[] {
	const cautions: string[] = [];
	if (demand < 0.42)
		cautions.push('Current demand support is thin, so offsets may take longer to show up.');
	if (friction >= 0.5)
		cautions.push(
			'Credential or licensing barriers could make switching harder than the adjacent-role list suggests.'
		);
	if (
		(employerPressure?.label === 'high' || employerPressure?.label === 'critical') &&
		cautions.length < 3
	) {
		cautions.push('Employer-side pressure is still elevated in nearby functions.');
	}
	return cautions.slice(0, 3);
}

function buildSummary(
	title: string,
	band: OffsetPotentialBand,
	demand: number,
	transition: number,
	reallocation: number,
	friction: number
): string {
	if (band === 'high') {
		return `${title} still has credible offset paths. Demand persists, adjacent moves look viable, and enough of the work appears reorganizable around AI.`;
	}
	if (band === 'medium') {
		const strongest =
			demand >= transition && demand >= reallocation
				? 'demand'
				: transition >= reallocation
					? 'transition pathways'
					: 'task redesign';
		return `${title} has some offset potential, but it depends on ${strongest} holding up in practice and on workers clearing the main switching frictions.`;
	}
	if (friction >= 0.5) {
		return `${title} has limited offset support right now. Current demand is softer and switching frictions look material, so structural pressure is less likely to be cushioned quickly.`;
	}
	return `${title} has limited offset support right now. The model still sees fewer clear pathways for demand persistence, role redesign, or quick redeployment.`;
}

function buildEntry(occupation: Occupation): OffsetPotentialEntry {
	const transitionRow = transitionSupportBySsoc.get(occupation.ssoc) ?? null;
	const postings = postingsMonitor.by_ssoc[occupation.ssoc] ?? null;
	const employerPressure =
		employerSignals.by_archetype[
			classifyArchetype(occupation.ssoc, occupation.title, occupation.major_group)
		] ?? null;
	const onetEntry = onetBySsoc.get(occupation.ssoc) ?? null;

	const demandPersistence = getDemandPersistenceScore(occupation, postings, employerPressure);
	const transitionSupport = getTransitionSupportScore(transitionRow);
	const reallocationRoom = getReallocationRoomScore(occupation, onetEntry);
	const mobilityFriction = getMobilityFrictionScore(occupation, transitionRow);
	const score = clamp01(
		0.35 * demandPersistence +
			0.3 * transitionSupport +
			0.25 * reallocationRoom +
			0.1 * (1 - mobilityFriction)
	);
	const band = getOffsetBand(score);

	return {
		ssoc: occupation.ssoc,
		title: occupation.title,
		score: Number(score.toFixed(4)),
		band,
		summary: buildSummary(
			occupation.title,
			band,
			demandPersistence,
			transitionSupport,
			reallocationRoom,
			mobilityFriction
		),
		strengths: describeStrengths(demandPersistence, transitionSupport, reallocationRoom),
		cautions: describeCautions(demandPersistence, mobilityFriction, employerPressure),
		components: {
			demand_persistence: Number(demandPersistence.toFixed(4)),
			transition_support: Number(transitionSupport.toFixed(4)),
			reallocation_room: Number(reallocationRoom.toFixed(4)),
			mobility_friction: Number(mobilityFriction.toFixed(4))
		},
		basis:
			'Heuristic support layer combining demand persistence, published transition support, task reallocation room, and switching friction. Published separately from the structural score because it is not a direct measure of realised reinstatement.'
	};
}

const entries = occupations.map(buildEntry);

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Published heuristic offset-potential layer estimating how much demand persistence, transition support, and task reallocation could cushion structural AI pressure.',
	notes: [
		'This is not a direct measure of reinstatement or new-task creation.',
		'It is intentionally published outside the structural score so users can separate core pressure from possible offsetting forces.',
		'Inputs combine official demand signals, labour monitor context, live postings, transition-support infrastructure, and task-level context.',
		'Switching friction reflects licensing and credential-transfer constraints, not observed worker mobility outcomes.'
	],
	component_weights: {
		demand_persistence: 0.35,
		transition_support: 0.3,
		reallocation_room: 0.25,
		low_switching_friction: 0.1
	},
	entries
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const serialized = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, serialized, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, serialized, 'utf-8');

console.log(`Built offset potential artifact at ${STATIC_OUT_FILE}`);
