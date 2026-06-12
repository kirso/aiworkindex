#!/usr/bin/env bun
/**
 * build-age-structure.ts — Publish occupation-level age/attrition context from
 * existing Singapore worker-profile tables.
 *
 * Run: bun run scripts/build-age-structure.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import occupations from '../data/occupations.json';
import workerProfile from '../data/worker-profile.json';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import type { Occupation } from '../src/lib/data';

const ROOT_DIR = path.join(import.meta.dir, '..');
const OUT_PATHS = [
	path.join(ROOT_DIR, 'data', 'age-structure.json'),
	path.join(ROOT_DIR, 'src', 'lib', 'data', 'age-structure.json'),
	path.join(ROOT_DIR, 'static', 'data', 'age-structure.json')
];

type AgeShare = {
	age_15_29: number;
	age_30_49: number;
	age_50_59: number;
	age_60_plus: number;
};

type WorkerProfileData = {
	groups: Record<string, { age_share: AgeShare }>;
	metadata: { data_as_of: string; notes: string[] };
};

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function classifyAttrition(ageShare: AgeShare): 'high' | 'medium' | 'low' {
	const age50Plus = ageShare.age_50_59 + ageShare.age_60_plus;
	if (age50Plus >= 0.45) return 'high';
	if (age50Plus >= 0.3) return 'medium';
	return 'low';
}

const profile = workerProfile as WorkerProfileData;
const entries = (occupations as Occupation[]).map(occupation => {
	const group = profile.groups[occupation.major_group];
	const ageShare = group?.age_share ?? {
		age_15_29: 0,
		age_30_49: 0,
		age_50_59: 0,
		age_60_plus: 0
	};
	const age50Plus = ageShare.age_50_59 + ageShare.age_60_plus;
	const attritionAbsorber = classifyAttrition(ageShare);

	return {
		ssoc: occupation.ssoc,
		title: occupation.title,
		major_group: occupation.major_group,
		net_risk: occupation.net_risk,
		risk_band: occupation.risk_band,
		age_share: {
			age_15_29: round(ageShare.age_15_29),
			age_30_49: round(ageShare.age_30_49),
			age_50_59: round(ageShare.age_50_59),
			age_60_plus: round(ageShare.age_60_plus),
			age_50_plus: round(age50Plus)
		},
		attrition_absorber: attritionAbsorber,
		attrition_absorber_score: round(age50Plus),
		framing:
			attritionAbsorber === 'high'
				? 'Older workforce mix can absorb some adjustment through retirement/non-replacement rather than layoffs.'
				: attritionAbsorber === 'medium'
					? 'Age mix offers some retirement/non-replacement buffer, but it is not large enough to dominate risk.'
					: 'Younger or mid-career-heavy workforce mix leaves less adjustment room through natural attrition.'
	};
});

const counts = entries.reduce<Record<'high' | 'medium' | 'low', number>>(
	(acc, entry) => {
		acc[entry.attrition_absorber] += 1;
		return acc;
	},
	{ high: 0, medium: 0, low: 0 }
);

const artifact = {
	validation_date: new Date().toISOString().slice(0, 10),
	model_version: DATA_VINTAGE.model_version,
	method: 'age_structure_attrition_v1',
	occupation_count: entries.length,
	source: {
		file: 'worker-profile.json',
		data_as_of: profile.metadata.data_as_of,
		note: 'Broad occupation-group age shares from Singapore Labour Force worker-profile tables.'
	},
	framing:
		'Age structure is an attrition-channel context layer. It does not change net_risk or risk_band; it explains one way pressure can resolve without layoffs.',
	summary: {
		counts,
		high_attrition_absorber_count: counts.high,
		avg_age_50_plus_share: round(
			entries.reduce((sum, entry) => sum + entry.age_share.age_50_plus, 0) / entries.length
		)
	},
	entries,
	caveats: [
		'Age shares are broad occupation-group anchors, not exact SSOC-level age distributions.',
		'High attrition absorber does not mean low risk; it means retirements and non-replacement may absorb part of the adjustment.',
		'This sidecar is context only and is not folded into headline risk.'
	]
};

for (const outPath of OUT_PATHS) {
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`);
}

console.log(
	`Built age-structure.json for ${artifact.occupation_count} occupations: ${counts.high} high attrition absorber`
);
