#!/usr/bin/env bun
/**
 * export-context-pack.ts — Publish the Singapore context bundle used around the
 * structural score. This keeps current labour signals and worker context
 * separate from the core occupation score dataset.
 *
 * Run: bun run scripts/export-context-pack.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OUT_DIR = path.join(import.meta.dir, '..', 'static', 'data');

const WORKER_PROFILE_FILE = path.join(DATA_DIR, 'worker-profile.json');
const INDUSTRY_CONTEXT_FILE = path.join(DATA_DIR, 'industry-context.json');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');
const OCCUPATION_INDUSTRY_WAGES_FILE = path.join(DATA_DIR, 'occupation-industry-wages.json');

const CONTEXT_PACK_FILE = path.join(OUT_DIR, 'sg-context-pack-2025.json');
const LABOUR_MONITOR_EXPORT_FILE = path.join(OUT_DIR, 'sg-labour-monitor-2025.json');

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

const workerProfile = readJson<Record<string, unknown>>(WORKER_PROFILE_FILE);
const industryContext = readJson<Record<string, unknown>>(INDUSTRY_CONTEXT_FILE);
const labourMonitor = readJson<Array<Record<string, unknown>>>(LABOUR_MONITOR_FILE);
const sectorWageAnchors = readJson<Record<string, unknown>>(OCCUPATION_INDUSTRY_WAGES_FILE);

const contextPack = {
	version: DATA_VINTAGE.model_version,
	generated_at: DATA_VINTAGE.last_updated,
	description:
		'Singapore context bundle for AI Work Index. Context data is published separately from the structural score dataset.',
	score_dataset: {
		json: 'sg-ai-occupations-v4.json',
		csv: 'sg-ai-occupations-v4.csv'
	},
	coverage: {
		labour_monitor_clusters: labourMonitor.length,
		industry_context_groups: Array.isArray((industryContext as { groups?: unknown[] }).groups)
			? ((industryContext as { groups: unknown[] }).groups?.length ?? 0)
			: 0,
		worker_profile_groups: Array.isArray(
			(workerProfile as { broad_groups?: unknown[] }).broad_groups
		)
			? ((workerProfile as { broad_groups: unknown[] }).broad_groups?.length ?? 0)
			: 0,
		sector_wage_anchor_occupations: Object.keys(sectorWageAnchors).length
	},
	vintage: {
		worker_profile: '2024',
		industry_context: '2024',
		sector_wage_anchors: '2024',
		labour_monitor: DATA_VINTAGE.labour_monitor
	},
	components: {
		labour_monitor: {
			file: 'sg-labour-monitor-2025.json',
			description:
				'Published cluster-level vacancy, hiring, retrenchment, and re-entry signals from official Singapore labour-market releases.'
		},
		worker_profile: {
			file: 'sg-worker-profile-2024.json',
			description:
				'Broad occupation-group worker composition and detailed gender anchors from Labour Force 2024 Section D and wages-by-sex tables.'
		},
		industry_context: {
			description:
				'Industry footprint and momentum context derived from official industry × occupation releases.',
			data: industryContext
		},
		sector_wage_anchors: {
			description:
				'Common-occupation industry wage tables from MOM, used as contextual sector wage anchors rather than score inputs.',
			data: sectorWageAnchors
		}
	}
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(CONTEXT_PACK_FILE, JSON.stringify(contextPack, null, 2), 'utf-8');
fs.writeFileSync(LABOUR_MONITOR_EXPORT_FILE, JSON.stringify(labourMonitor, null, 2), 'utf-8');

console.log(`Exported Singapore context pack to ${CONTEXT_PACK_FILE}`);
console.log(`Exported labour monitor to ${LABOUR_MONITOR_EXPORT_FILE}`);
