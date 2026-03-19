#!/usr/bin/env bun
/**
 * export-json.ts — Copy the current raw score dataset to the public static JSON artifact.
 *
 * Run: bun run scripts/export-json.ts
 * Output: static/data/sg-ai-occupations-v4.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OUT_DIR = path.join(import.meta.dir, '..', 'static', 'data');
const IN_FILE = path.join(DATA_DIR, 'occupations.json');
const OUT_FILE = path.join(OUT_DIR, 'sg-ai-occupations-v4.json');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.copyFileSync(IN_FILE, OUT_FILE);

console.log(`Copied ${IN_FILE} to ${OUT_FILE}`);
