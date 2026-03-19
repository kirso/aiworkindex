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
		credential_gap: Number(transition.credential_gap.toFixed(4))
	};
}

const transitions = occupations.map(from => {
	const candidateSet = findBestTransitions(from, occupations, 25);
	const categorized = categorizeTransitions(candidateSet);

	return {
		from_ssoc: from.ssoc,
		from_title: from.title,
		from_risk_band: from.risk_band,
		from_net_risk: Number(from.net_risk.toFixed(4)),
		from_wage: from.gross_wage_median,
		skillsfuture_eligible: from.sg_context?.skillsfuture_eligible ?? false,
		top_overall: candidateSet.slice(0, 5).map(compactTransition),
		easier_switch: categorized.easierSwitch.map(compactTransition),
		lower_risk: categorized.lowerRisk.map(compactTransition),
		better_pay: categorized.betterPay.map(compactTransition),
		strong_demand: categorized.strongDemand.map(compactTransition)
	};
});

const payload = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Heuristic transition-support artifact derived from the AI Work Index transition-capacity model. This is decision-support guidance, not observed worker mobility data.',
	notes: [
		'Uses the published structural score plus wage, demand, archetype, and credential-gap heuristics.',
		'Published separately from the structural score because it is a support layer, not a measured labour-market outcome.',
		'SkillsFuture eligibility is a broad Singapore context flag, not proof that a specific transition pathway is available.'
	],
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
