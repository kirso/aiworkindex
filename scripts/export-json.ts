#!/usr/bin/env bun
/**
 * export-json.ts — Copy the current live score dataset and retained historical
 * snapshots to versioned public JSON artifacts.
 *
 * Run: bun run scripts/export-json.ts
 * Output:
 *   static/data/sg-ai-occupations-v6.json
 *   static/data/sg-ai-occupations-v43.json (when live model is V4.3)
 *   static/data/sg-ai-occupations-v42.json (when historical snapshot exists)
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OUT_DIR = path.join(import.meta.dir, '..', 'static', 'data');
const V8_FILE = path.join(DATA_DIR, 'occupations-v8.json');

fs.mkdirSync(OUT_DIR, { recursive: true });
const liveJson = fs.readFileSync(V8_FILE);
const liveOutFile = path.join(OUT_DIR, 'sg-ai-occupations-v8.json');
fs.writeFileSync(liveOutFile, liveJson);

for (const entry of fs.readdirSync(DATA_DIR)) {
	const match = entry.match(/^occupations-(v\d+(?:\.\d+)?)\.json$/i);
	if (!match) continue;
	fs.writeFileSync(
		path.join(OUT_DIR, `sg-ai-occupations-${match[1]!.toLowerCase().replaceAll('.', '')}.json`),
		fs.readFileSync(path.join(DATA_DIR, entry))
	);
}

console.log(`Exported live JSON dataset to ${liveOutFile}`);
