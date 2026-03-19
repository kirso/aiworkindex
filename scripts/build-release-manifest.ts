#!/usr/bin/env bun
/**
 * build-release-manifest.ts — Build a versioned public release manifest with
 * checksums, file sizes, and generation metadata for downloadable artifacts.
 *
 * Run: bun run scripts/build-release-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const OUT_FILE = path.join(STATIC_DATA_DIR, 'release-manifest-v4.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'release-manifest.json');

interface ReleaseArtifactDefinition {
	file: string;
	label: string;
	category:
		| 'structural_score'
		| 'context_bundle'
		| 'labour_monitor'
		| 'worker_profile'
		| 'national_ai_context'
		| 'transition_support'
		| 'transition_infrastructure'
		| 'governance';
	description: string;
}

const ARTIFACTS: ReleaseArtifactDefinition[] = [
	{
		file: 'sg-ai-occupations-v4.csv',
		label: 'V4 structural score CSV',
		category: 'structural_score',
		description: 'Flattened structural score dataset with basis and provenance columns.'
	},
	{
		file: 'sg-ai-occupations-v4.json',
		label: 'V4 structural score JSON',
		category: 'structural_score',
		description: 'Nested structural score dataset with basis and provenance metadata.'
	},
	{
		file: 'sg-context-pack-2025.json',
		label: 'Singapore context pack',
		category: 'context_bundle',
		description:
			'Published Singapore context bundle around the structural score: labour monitor, worker profile, industry context, sector wage anchors, and national AI context.'
	},
	{
		file: 'sg-labour-monitor-2025.json',
		label: 'Singapore labour monitor',
		category: 'labour_monitor',
		description: 'Published cluster-level labour monitor used as current evidence around the score.'
	},
	{
		file: 'sg-worker-profile-2024.json',
		label: 'Singapore worker profile',
		category: 'worker_profile',
		description: 'Published Labour Force 2024 worker-profile context and detailed gender anchors.'
	},
	{
		file: 'sg-ai-in-singapore-2025.json',
		label: 'AI in Singapore context',
		category: 'national_ai_context',
		description:
			'Official IMDA and MOM national AI adoption, workforce, and programme context used for reports and contextual framing.'
	},
	{
		file: 'sg-transition-infrastructure-2025.json',
		label: 'Transition infrastructure layer',
		category: 'transition_infrastructure',
		description:
			'Official Singapore transition-infrastructure artifact covering published programmes, WSQ training-system activity, and Jobs Transformation Maps coverage.'
	},
	{
		file: 'sg-transition-support-v4.json',
		label: 'Transition support layer',
		category: 'transition_support',
		description:
			'Published hybrid transition-support artifact combining the deterministic transition-capacity model with official Singapore transition-infrastructure context.'
	},
	{
		file: 'claims-matrix-v4.json',
		label: 'Public claims matrix',
		category: 'governance',
		description:
			'Machine-readable registry of major public claims, evidence strength, and source keys for the current release.'
	}
];

function sha256(buffer: Buffer): string {
	return createHash('sha256').update(buffer).digest('hex');
}

function buildArtifact(definition: ReleaseArtifactDefinition) {
	const filePath = path.join(STATIC_DATA_DIR, definition.file);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing artifact: ${definition.file}`);
	}

	const bytes = fs.readFileSync(filePath);
	const stats = fs.statSync(filePath);

	return {
		...definition,
		bytes: stats.size,
		sha256: sha256(bytes),
		generated_at: stats.mtime.toISOString()
	};
}

const manifest = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	score_dataset_generated_at: DATA_VINTAGE.last_updated,
	artifacts: ARTIFACTS.map(buildArtifact)
};

fs.mkdirSync(STATIC_DATA_DIR, { recursive: true });
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Built release manifest at ${OUT_FILE}`);
