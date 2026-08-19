#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';

import { buildV9PublicRelease, ROOT } from './v9-public-export';

const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'static', 'data');
const CURRENT_FILE = path.join(OUT_DIR, 'sg-ai-occupations-v9.json');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(CURRENT_FILE, `${JSON.stringify(buildV9PublicRelease(), null, 2)}\n`, 'utf8');

// Preserve retained historical releases as versioned artifacts. They are never
// imported into, or substituted for, the current V9 public contract.
for (const entry of fs.readdirSync(DATA_DIR)) {
	const match = entry.match(/^occupations-(v\d+(?:\.\d+)?)\.json$/i);
	if (!match || match[1]?.toLowerCase() === 'v9') continue;
	fs.copyFileSync(
		path.join(DATA_DIR, entry),
		path.join(OUT_DIR, `sg-ai-occupations-${match[1]!.toLowerCase().replaceAll('.', '')}.json`)
	);
}

console.log(`Exported current V9 JSON dataset to ${CURRENT_FILE}`);
