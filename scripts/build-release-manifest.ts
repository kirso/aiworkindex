#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT = path.join(import.meta.dir, '..');
const staticData = path.join(ROOT, 'static', 'data');
const definitions = [
	[
		'sg-ai-occupations-v8.json',
		'V8 clean public JSON',
		'structural_score',
		'Clean V8 Singapore public contract.'
	],
	[
		'sg-ai-occupations-v8.csv',
		'V8 clean public CSV',
		'structural_score',
		'Flattened V8 Singapore public contract.'
	],
	[
		'claims-matrix-v8.json',
		'V8 public claims matrix',
		'governance',
		'Auditable registry of supported and unsupported claims.'
	],
	[
		'public-field-source-map.json',
		'Public field source map',
		'provenance',
		'Field-level provenance for retained source artifacts.'
	],
	[
		'sg-context-pack-2025.json',
		'Singapore context pack',
		'context_bundle',
		'Official labour-market and adoption context reported separately from the score.'
	],
	[
		'adoption-diffusion.json',
		'Singapore adoption context',
		'governance',
		'Non-scoring adoption context.'
	],
	['age-structure.json', 'Singapore age structure', 'governance', 'Non-scoring attrition context.']
] as const;

const artifacts = definitions.map(([file, label, category, description]) => {
	const filePath = path.join(staticData, file);
	if (!fs.existsSync(filePath)) throw new Error(`Missing artifact: ${file}`);
	const bytes = fs.readFileSync(filePath);
	const stat = fs.statSync(filePath);
	return {
		file,
		label,
		category,
		description,
		bytes: stat.size,
		sha256: createHash('sha256').update(bytes).digest('hex'),
		generated_at: stat.mtime.toISOString()
	};
});

const manifest = {
	version: DATA_VINTAGE.public_version,
	generated_at: new Date().toISOString(),
	score_dataset_generated_at: new Date().toISOString().slice(0, 10),
	artifacts
};
const payload = JSON.stringify(manifest, null, 2);
for (const file of [
	path.join(staticData, 'release-manifest-v8.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'release-manifest.json')
]) {
	fs.writeFileSync(file, payload);
}
console.log('Built V8 release manifest');
