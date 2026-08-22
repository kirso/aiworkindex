#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import {
	RESEARCH_LIBRARY_VERSION,
	RESEARCH_REVIEW_CUTOFF,
	V9_HEADLINE_RESEARCH_KEY,
	researchRegistry
} from '../src/lib/data/research-registry';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OUT_FILE = path.join(DATA_DIR, 'research-library.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'research-library.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'research-library.json');

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

const sortedEntries = [...researchRegistry].sort((a, b) => {
	const dateOrder = b.published_at.localeCompare(a.published_at);
	if (dateOrder !== 0) return dateOrder;
	return a.title.localeCompare(b.title);
});

const duplicateKeys = sortedEntries
	.map(entry => entry.key)
	.filter((key, index, all) => all.indexOf(key) !== index);
if (duplicateKeys.length > 0) {
	throw new Error(`Duplicate research keys: ${[...new Set(duplicateKeys)].join(', ')}`);
}

const duplicateWorks = sortedEntries
	.map(entry => `${entry.title.trim().toLowerCase()}\u0000${entry.authors.join('|').toLowerCase()}`)
	.filter((work, index, all) => all.indexOf(work) !== index);
if (duplicateWorks.length > 0) {
	throw new Error('Duplicate research works found under different registry records');
}

for (const entry of sortedEntries) {
	if (entry.published_at.localeCompare(RESEARCH_REVIEW_CUTOFF) > 0) {
		throw new Error(`${entry.key}: publication date is later than the review cutoff`);
	}
}

const entries = sortedEntries.map(entry => ({
	...entry,
	reviewed_at: RESEARCH_REVIEW_CUTOFF
}));

const payload = {
	version: RESEARCH_LIBRARY_VERSION,
	generated_at: RESEARCH_REVIEW_CUTOFF,
	review_cutoff: RESEARCH_REVIEW_CUTOFF,
	reviewed_at: RESEARCH_REVIEW_CUTOFF,
	date_fields: {
		published_at: 'When the source was published or publicly released.',
		observation_period: 'When the underlying observations apply, when the source reports it.',
		reviewed_at: 'When AI Work Index last checked the source for this release.',
		generated_at: 'The deterministic V9 artifact date; it is not an observation date.'
	},
	headline_research_key: V9_HEADLINE_RESEARCH_KEY,
	methodology_note:
		'Only the ILO 2025 refined exposure index supplies the V9 headline structural score. Platform usage, capability, complementarity and labour-outcome research remain separate evidence or interpretation.',
	entry_count: entries.length,
	domain_counts: Object.fromEntries(
		[
			'exposure',
			'tasks',
			'complementarity',
			'validation',
			'mobility',
			'forecast',
			'uncertainty',
			'productivity',
			'augmentation',
			'measurement',
			'context'
		].map(domain => [
			domain,
			entries.filter(entry => entry.domains.includes(domain as never)).length
		])
	),
	role_counts: Object.fromEntries(
		['active_core', 'validation', 'candidate_v5', 'supporting_context'].map(role => [
			role,
			entries.filter(entry => entry.role === role).length
		])
	),
	entries
};

writeJson(OUT_FILE, payload);
writeJson(SRC_OUT_FILE, payload);
writeJson(STATIC_OUT_FILE, payload);

console.log(`Built research library at ${STATIC_OUT_FILE}`);
