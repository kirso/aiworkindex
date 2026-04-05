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
const GEOGRAPHY_CONTEXT_FILE = path.join(DATA_DIR, 'geography-context.json');
const MACRO_CONTEXT_FILE = path.join(DATA_DIR, 'macro-context.json');
const AI_IN_SINGAPORE_FILE = path.join(DATA_DIR, 'ai-in-singapore.json');
const TRANSITION_INFRASTRUCTURE_FILE = path.join(DATA_DIR, 'transition-infrastructure.json');
const LFR_SECTION_D_SIGNALS_FILE = path.join(DATA_DIR, 'lfr-section-d-signals.json');

const CONTEXT_PACK_FILE = path.join(OUT_DIR, 'sg-context-pack-2025.json');
const LABOUR_MONITOR_EXPORT_FILE = path.join(OUT_DIR, 'sg-labour-monitor-2025.json');
const LFR_DELTAS_EXPORT_FILE = path.join(OUT_DIR, 'sg-lfr-deltas-2025.json');

function versionTag(version: string): string {
	return version.toLowerCase().replaceAll('.', '');
}

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

const workerProfile = readJson<Record<string, unknown>>(WORKER_PROFILE_FILE);
const industryContext = readJson<Record<string, unknown>>(INDUSTRY_CONTEXT_FILE);
const labourMonitor = readJson<Array<Record<string, unknown>>>(LABOUR_MONITOR_FILE);
const sectorWageAnchors = readJson<Record<string, unknown>>(OCCUPATION_INDUSTRY_WAGES_FILE);
const geographyContext = readJson<Record<string, unknown>>(GEOGRAPHY_CONTEXT_FILE);
const macroContext = readJson<Record<string, unknown>>(MACRO_CONTEXT_FILE);
const aiInSingapore = readJson<{ sources?: unknown[] } & Record<string, unknown>>(
	AI_IN_SINGAPORE_FILE
);
const transitionInfrastructure = readJson<Record<string, unknown>>(TRANSITION_INFRASTRUCTURE_FILE);
const lfrSectionDSignals = readJson<Record<string, unknown>>(LFR_SECTION_D_SIGNALS_FILE);

const contextPack = {
	version: DATA_VINTAGE.model_version,
	generated_at: DATA_VINTAGE.last_updated,
	description:
		'Singapore context bundle for AI Work Index. Context data is published separately from the structural score dataset and includes labour, worker, industry, wage-anchor, geography, macro, and national AI context.',
	score_dataset: {
		json: `sg-ai-occupations-${versionTag(DATA_VINTAGE.model_version)}.json`,
		csv: `sg-ai-occupations-${versionTag(DATA_VINTAGE.model_version)}.csv`
	},
	coverage: {
		labour_monitor_clusters: labourMonitor.length,
		industry_context_groups:
			industryContext &&
			typeof industryContext === 'object' &&
			'groups' in industryContext &&
			industryContext.groups &&
			typeof industryContext.groups === 'object'
				? Object.keys(industryContext.groups as Record<string, unknown>).length
				: 0,
		worker_profile_groups:
			workerProfile && typeof workerProfile === 'object' && 'groups' in workerProfile
				? Object.keys((workerProfile as { groups: Record<string, unknown> }).groups).length
				: 0,
		sector_wage_anchor_occupations: Object.keys(sectorWageAnchors).length,
		geography_groups: Array.isArray(
			(geographyContext as { residence?: { by_group?: unknown[] } }).residence?.by_group
		)
			? ((geographyContext as { residence: { by_group: unknown[] } }).residence.by_group?.length ??
				0)
			: 0,
		macro_quarters: Array.isArray(
			(macroContext as { unemployment?: { history?: unknown[] } }).unemployment?.history
		)
			? ((macroContext as { unemployment: { history: unknown[] } }).unemployment.history?.length ??
				0)
			: 0,
		national_ai_sources: Array.isArray(aiInSingapore.sources) ? aiInSingapore.sources.length : 0,
		transition_programmes: Array.isArray(
			(transitionInfrastructure as { programmes?: unknown[] }).programmes
		)
			? ((transitionInfrastructure as { programmes: unknown[] }).programmes?.length ?? 0)
			: 0,
		lfr_occupation_families:
			lfrSectionDSignals &&
			typeof lfrSectionDSignals === 'object' &&
			'family_employment' in lfrSectionDSignals &&
			lfrSectionDSignals.family_employment &&
			typeof lfrSectionDSignals.family_employment === 'object'
				? Object.keys(lfrSectionDSignals.family_employment as Record<string, unknown>).length
				: 0
	},
	vintage: {
		worker_profile: '2025',
		industry_context:
			industryContext &&
			typeof industryContext === 'object' &&
			'metadata' in industryContext &&
			industryContext.metadata &&
			typeof industryContext.metadata === 'object' &&
			'vacancy_overlay_vintage' in industryContext.metadata
				? String(
						(
							industryContext.metadata as {
								vacancy_overlay_vintage?: string;
								employment_vintage?: string;
							}
						).employment_vintage ?? '2025'
					) +
					' employment, ' +
					String(
						(
							industryContext.metadata as {
								vacancy_overlay_vintage?: string;
							}
						).vacancy_overlay_vintage ?? '2025 Q3'
					) +
					' vacancy overlay'
				: '2025 employment, 2025 Q3 vacancy overlay',
		sector_wage_anchors: '2024',
		geography_context: '2020',
		macro_context: '2024-2025',
		labour_monitor: DATA_VINTAGE.labour_monitor,
		national_ai_context: '2025-2026',
		transition_infrastructure: '2024-2026',
		lfr_section_d: '2024-2025'
	},
	components: {
		labour_monitor: {
			file: 'sg-labour-monitor-2025.json',
			description:
				'Published cluster-level vacancy, hiring, retrenchment, and re-entry signals from official Singapore labour-market releases.'
		},
		worker_profile: {
			file: 'sg-worker-profile-2025.json',
			description:
				'Broad occupation-group worker composition and detailed gender anchors from Labour Force 2025 Section D and wages-by-sex tables.'
		},
		lfr_section_d: {
			file: 'sg-lfr-deltas-2025.json',
			description:
				'Published 2024 to 2025 Labour Force Section D family, cluster, and industry-mix deltas used for validation and contextual reporting.',
			data: {
				family_employment: (lfrSectionDSignals as { family_employment?: unknown }).family_employment ?? {},
				cluster_characteristics:
					(lfrSectionDSignals as { cluster_characteristics?: unknown }).cluster_characteristics ?? {},
				cluster_industry_mix:
					(lfrSectionDSignals as { cluster_industry_mix?: unknown }).cluster_industry_mix ?? {}
			}
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
		},
		geography_context: {
			file: 'sg-geography-context-2020.json',
			description:
				'Official Census 2020 geography context showing planning-area residence concentration and travel-time patterns by broad occupation group.',
			data: geographyContext
		},
		macro_context: {
			file: 'sg-macro-context-2025.json',
			description:
				'Official macro labour context covering unemployment and labour-tightness series for Singapore. Contextual only, not an occupation-level score input.',
			data: macroContext
		},
		national_ai_context: {
			file: 'sg-ai-in-singapore-2025.json',
			description:
				'Official IMDA and MOM national AI adoption, workforce, and programme context for Singapore. This is contextual evidence around the score, not an occupation-level input.',
			data: aiInSingapore
		},
		transition_infrastructure: {
			file: 'sg-transition-infrastructure-2025.json',
			description:
				'Official Singapore transition-infrastructure context covering Jobs Transformation Maps, major public career-transition programmes, and WSQ training-system activity.',
			data: transitionInfrastructure
		}
	}
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(CONTEXT_PACK_FILE, JSON.stringify(contextPack, null, 2), 'utf-8');
fs.writeFileSync(LABOUR_MONITOR_EXPORT_FILE, JSON.stringify(labourMonitor, null, 2), 'utf-8');
fs.writeFileSync(
	LFR_DELTAS_EXPORT_FILE,
	JSON.stringify(
		{
			data_as_of: '2025',
			family_employment: (lfrSectionDSignals as { family_employment?: unknown }).family_employment ?? {},
			cluster_characteristics:
				(lfrSectionDSignals as { cluster_characteristics?: unknown }).cluster_characteristics ?? {},
			cluster_industry_mix:
				(lfrSectionDSignals as { cluster_industry_mix?: unknown }).cluster_industry_mix ?? {}
		},
		null,
		2
	),
	'utf-8'
);

console.log(`Exported Singapore context pack to ${CONTEXT_PACK_FILE}`);
console.log(`Exported labour monitor to ${LABOUR_MONITOR_EXPORT_FILE}`);
console.log(`Exported Section D deltas to ${LFR_DELTAS_EXPORT_FILE}`);
