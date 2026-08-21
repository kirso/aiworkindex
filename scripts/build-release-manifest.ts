#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadV9Release } from './v9-public-export';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = path.join(ROOT, 'static');
const STATIC_DATA = path.join(STATIC, 'data');

const definitions = [
	{
		file: 'sg-ai-occupations-v9.json',
		path: path.join(STATIC_DATA, 'sg-ai-occupations-v9.json'),
		public_path: '/data/sg-ai-occupations-v9.json',
		label: 'V9 public JSON',
		category: 'structural_pressure',
		description: 'SSOC 2024 AI Work Pressure ranks, uncertainty, wages, and evidence links.'
	},
	{
		file: 'sg-ai-occupations-v9.csv',
		path: path.join(STATIC_DATA, 'sg-ai-occupations-v9.csv'),
		public_path: '/data/sg-ai-occupations-v9.csv',
		label: 'V9 public CSV',
		category: 'structural_pressure',
		description: 'Flattened V9 occupation evidence with nullable fields.'
	},
	{
		file: 'v9-market-context.json',
		path: path.join(STATIC_DATA, 'v9-market-context.json'),
		public_path: '/data/v9-market-context.json',
		label: 'V9 Singapore market context',
		category: 'market_context',
		description: 'Reviewed demand signals and labour evidence kept separate from pressure ranks.'
	},
	{
		file: 'v9-economic-observatory.json',
		path: path.join(STATIC_DATA, 'v9-economic-observatory.json'),
		public_path: '/data/v9-economic-observatory.json',
		label: 'V9 Singapore AI labour observatory',
		category: 'economic_outcomes',
		description:
			'Broad official labour observations, six causal mechanisms, detailed evidence availability and explicit publication gates; no headline effect.'
	},
	{
		file: 'v9-capability-profiles.json',
		path: path.join(STATIC_DATA, 'v9-capability-profiles.json'),
		public_path: '/data/v9-capability-profiles.json',
		label: 'V9 OECD AI capability profiles',
		category: 'capability_evidence',
		description:
			'Nine-domain OECD capability profiles for the reviewed detailed-identity subset; automated and manual identity decisions are explicit, missingness is preserved, and the headline effect is none.'
	},
	{
		file: 'v9-research-signals.json',
		path: path.join(STATIC_DATA, 'v9-research-signals.json'),
		public_path: '/data/v9-research-signals.json',
		label: 'V9 theoretical and observed-use research signals',
		category: 'external_evidence',
		description:
			'Identity-gated Eloundou theoretical exposure and Anthropic observed Claude-use measures, published separately with explicit missingness and no headline effect.'
	},
	{
		file: 'v9-skills-pilot.json',
		path: path.join(STATIC_DATA, 'v9-skills-pilot.json'),
		public_path: '/data/v9-skills-pilot.json',
		label: 'V9 official Skills Framework pilot',
		category: 'skills_evidence',
		description:
			'Selected official skill names for seven reviewed sector-role profiles across ICT, financial services and healthcare; no headline effect.'
	},
	{
		file: 'v9-evidence-vector.json',
		path: path.join(STATIC_DATA, 'v9-evidence-vector.json'),
		public_path: '/data/v9-evidence-vector.json',
		label: 'V9 multi-signal occupation evidence vector',
		category: 'evidence_synthesis',
		description:
			'Eight evidence dimensions aligned by SSOC 2024 occupation without averaging them into a composite score.'
	},
	{
		file: 'v9-signal-change.json',
		path: path.join(STATIC_DATA, 'v9-signal-change.json'),
		public_path: '/data/v9-signal-change.json',
		label: 'V9 signal-specific change ledger',
		category: 'longitudinal_evidence',
		description:
			'Comparable changes in public Singapore labour signals plus explicit gates for pressure and other unavailable movers.'
	},
	{
		file: 'ilo-isco-task-evidence-v9.json',
		path: path.join(STATIC_DATA, 'ilo-isco-task-evidence-v9.json'),
		public_path: '/data/ilo-isco-task-evidence-v9.json',
		label: 'ILO task evidence by ISCO-08 group',
		category: 'task_evidence',
		description:
			'Attributed ILO task text and 2025 scores at four-digit ISCO grain; mapped examples never change occupation pressure ranks.'
	},
	{
		file: 'v9-external-crosswalk-audit.json',
		path: path.join(STATIC_DATA, 'v9-external-crosswalk-audit.json'),
		public_path: '/data/v9-external-crosswalk-audit.json',
		label: 'V9 external crosswalk audit',
		category: 'external_evidence',
		description:
			'Checksum-pinned ESCO-O*NET candidate mapping audit and explicit publication gates; no external values enter the headline.'
	},
	{
		file: 'synthetic-roles-v9.json',
		path: path.join(STATIC_DATA, 'synthetic-roles-v9.json'),
		public_path: '/data/synthetic-roles-v9.json',
		label: 'V9 modern-title query layer',
		category: 'synthetic_roles',
		description:
			'Exact and explicitly reviewed official-occupation resolutions plus non-official composites, withheld mappings, editorial weights and sensitivity checks.'
	},
	{
		file: 'v9-search-index.json',
		path: path.join(STATIC_DATA, 'v9-search-index.json'),
		public_path: '/data/v9-search-index.json',
		label: 'V9 search index',
		category: 'discovery',
		description:
			'Lightweight occupation and non-official role-query search records plus canonical aliases for exact and explicitly reviewed official-occupation matches.'
	},
	{
		file: 'v9-ui-index.json',
		path: path.join(STATIC_DATA, 'v9-ui-index.json'),
		public_path: '/data/v9-ui-index.json',
		label: 'V9 on-demand interface index',
		category: 'discovery',
		description:
			'Route-specific evidence projections loaded on demand by the calculator and comparison tools.'
	},
	{
		file: 'research-library.json',
		path: path.join(STATIC_DATA, 'research-library.json'),
		public_path: '/data/research-library.json',
		label: 'Research register',
		category: 'research',
		description: 'Versioned research claims, roles, sources, and limitations.'
	},
	{
		file: 'site-status.json',
		path: path.join(STATIC_DATA, 'site-status.json'),
		public_path: '/data/site-status.json',
		label: 'Current release status',
		category: 'governance',
		description: 'Bounded current V9 facts, evidence vintages, withheld inputs, and archive links.'
	},
	{
		file: 'releases.json',
		path: path.join(STATIC_DATA, 'releases.json'),
		public_path: '/data/releases.json',
		label: 'Dated release history',
		category: 'governance',
		description: 'Current V9 release notes and explicitly dated archives of superseded methods.'
	},
	{
		file: 'llms.txt',
		path: path.join(STATIC, 'llms.txt'),
		public_path: '/llms.txt',
		label: 'Concise machine-readable guide',
		category: 'discovery',
		description: 'Concise V9 scope, interpretation, and canonical links.'
	},
	{
		file: 'llms-full.txt',
		path: path.join(STATIC, 'llms-full.txt'),
		public_path: '/llms-full.txt',
		label: 'Full machine-readable guide',
		category: 'discovery',
		description:
			'Full V9 method, limitations, official occupations, reviewed modern-title resolutions and non-official role-query links.'
	},
	{
		file: 'sitemap.xml',
		path: path.join(STATIC, 'sitemap.xml'),
		public_path: '/sitemap.xml',
		label: 'Canonical sitemap',
		category: 'discovery',
		description: 'Indexable V9 pages on the canonical host.'
	}
] as const;

const release = loadV9Release();
const artifacts = definitions.map(definition => {
	if (!fs.existsSync(definition.path)) throw new Error(`Missing V9 artifact: ${definition.path}`);
	const bytes = fs.readFileSync(definition.path);
	const stat = fs.statSync(definition.path);
	return {
		file: definition.file,
		public_path: definition.public_path,
		label: definition.label,
		category: definition.category,
		description: definition.description,
		bytes: stat.size,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		generated_at: release.generated_at
	};
});

const manifest = {
	version: 'V9',
	schema_version: '9.0',
	generated_at: release.generated_at,
	score_dataset_generated_at: release.generated_at,
	taxonomy: 'SSOC 2024',
	headline: 'AI Work Pressure Rank',
	counts: release.counts,
	artifacts
};
const payload = `${JSON.stringify(manifest, null, 2)}\n`;
for (const file of [
	path.join(STATIC_DATA, 'release-manifest-v9.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'release-manifest.json')
]) {
	fs.writeFileSync(file, payload, 'utf8');
}
console.log(`Built V9 release manifest with ${artifacts.length} artifacts`);
