#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OUT_FILE = path.join(DATA_DIR, 'public-field-source-map.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'public-field-source-map.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'public-field-source-map.json');

type SourceTier = 'official_sg' | 'derived_from_official_sg' | 'external_proxy' | 'synthetic';

interface SourceMapEntry {
	field_path: string;
	dataset: string;
	label: string;
	source_keys: string[];
	source_tier: SourceTier;
	vintage: string;
	transformation: string;
	caveat?: string;
}

const versionTag = DATA_VINTAGE.model_version.toLowerCase().replaceAll('.', '');

const entries: SourceMapEntry[] = [
	{
		field_path: 'gross_wage_median',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Median wage',
		source_keys: ['mom_ows_2024'],
		source_tier: 'official_sg',
		vintage: '2024',
		transformation: 'Directly copied from the published MOM occupational wage table.'
	},
	{
		field_path: 'estimated_sg_employment_thousands',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Estimated Singapore employment',
		source_keys: ['mom_lfr2025_table_d8', 'bls_projections_2024_2034'],
		source_tier: 'derived_from_official_sg',
		vintage: '2025',
		transformation:
			'Official Labour Force 2025 family totals are allocated to detailed occupations using normalized within-family weights derived from BLS employment and Singapore wage information.',
		caveat: 'This is an estimate, not a published detailed SSOC occupation headcount.'
	},
	{
		field_path: 'employment_family_code',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Employment family code',
		source_keys: ['mom_lfr2025_table_d8'],
		source_tier: 'official_sg',
		vintage: '2025',
		transformation: 'Direct 2-digit family anchor from Labour Force 2025 Table D8.'
	},
	{
		field_path: 'employment_weight_within_family',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Within-family employment weight',
		source_keys: ['mom_lfr2025_table_d8', 'bls_projections_2024_2034', 'mom_ows_2024'],
		source_tier: 'derived_from_official_sg',
		vintage: '2025',
		transformation:
			'Normalized allocation weight within each Labour Force occupation family. Uses BLS and wage evidence when available, then fallback rules.'
	},
	{
		field_path: 'exposure',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Structural exposure',
		source_keys: [
			'aioe_2021',
			'anthropic_economic_index_2026',
			'eloundou_gpt_exposure_2023',
			'ilo_genai_2025'
		],
		source_tier: 'external_proxy',
		vintage: '2021-2026',
		transformation:
			'V5 uses a latent posterior over the audited 4-source exposure stack, with task-mode blending where weighted task evidence is strong.',
		caveat: 'Exposure is not an official Singapore government measure.'
	},
	{
		field_path: 'bottleneck',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Human bottleneck',
		source_keys: ['pizzinelli_theta_2023'],
		source_tier: 'external_proxy',
		vintage: '2023',
		transformation: 'Mapped through the SSOC→ISCO→SOC crosswalk and percentile-normalized.'
	},
	{
		field_path: 'market.market_resilience',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Market resilience',
		source_keys: [
			'mom_employment_by_occupation_group',
			'mom_industry_x_occupation',
			'mom_jobs_in_demand_2025',
			'mom_sol_2026',
			'mom_ows_2024'
		],
		source_tier: 'derived_from_official_sg',
		vintage: '2024-2026',
		transformation:
			'Combines group employment momentum, industry-footprint momentum where available, official demand flags, and wage-structure context.'
	},
	{
		field_path: 'evidence.sol_match',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'SOL demand evidence',
		source_keys: ['mom_sol_2026'],
		source_tier: 'official_sg',
		vintage: '2026',
		transformation:
			'Rule-based exact or prefix SSOC match against the MOM Shortage Occupation List.'
	},
	{
		field_path: 'evidence.jobs_in_demand_match',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Jobs in Demand evidence',
		source_keys: ['mom_jobs_in_demand_2025'],
		source_tier: 'official_sg',
		vintage: '2025',
		transformation: 'Rule-based exact or prefix SSOC match against the MOM Jobs in Demand list.'
	},
	{
		field_path: 'task_primitives.*',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Task primitive sidecar fields',
		source_keys: ['anthropic_task_penetration_2026', 'onet_task_ratings'],
		source_tier: 'external_proxy',
		vintage: '2026',
		transformation:
			'Weighted task-penetration summaries over matched task evidence. Null where weighted task evidence is insufficient.'
	},
	{
		field_path: 'transition_adjusted_risk',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Transition-adjusted risk',
		source_keys: [
			'mom_labour_monitor_2025',
			'skillsfuture_transition_mapping',
			'wsg_careersfinder',
			'imf_occupational_mobility_2024'
		],
		source_tier: 'derived_from_official_sg',
		vintage: '2024-2026',
		transformation:
			'Published separately from the structural score. Combines structural pressure with transition-capacity and observed-mobility support layers.'
	},
	{
		field_path: 'realized_risk_proxy',
		dataset: `sg-ai-occupations-${versionTag}.json`,
		label: 'Realized-risk proxy',
		source_keys: ['mom_labour_monitor_2025', 'mom_jobs_in_demand_2025', 'mom_sol_2026'],
		source_tier: 'derived_from_official_sg',
		vintage: '2025-2026',
		transformation:
			'Offset-buffered short-run risk proxy published separately from the structural headline score.'
	},
	{
		field_path: 'labour-monitor.provenance.fields.*',
		dataset: 'sg-labour-monitor-2025.json',
		label: 'Labour monitor field provenance',
		source_keys: ['mom_labour_monitor_2025', 'mom_labour_market_report_q4_2025'],
		source_tier: 'derived_from_official_sg',
		vintage: 'Q4 2025',
		transformation:
			'Each published monitor field carries its direct origin: raw feed, report table, or deterministic derived rule.'
	},
	{
		field_path: 'labour-monitor.vacancy.latest_rate',
		dataset: 'sg-labour-monitor-2025.json',
		label: 'Latest cluster vacancy rate',
		source_keys: ['mom_job_vacancy_rates', 'mom_labour_market_report_q4_2025'],
		source_tier: 'derived_from_official_sg',
		vintage: 'Q4 2025',
		transformation:
			'Uses the latest official raw vacancy-rate feed, with Q4 2025 report enrichment attached where the feed lags.'
	},
	{
		field_path: 'labour-monitor.hiring.net_pressure',
		dataset: 'sg-labour-monitor-2025.json',
		label: 'Net hiring pressure',
		source_keys: ['mom_recruitment_resignation_rates', 'mom_labour_market_report_q4_2025'],
		source_tier: 'derived_from_official_sg',
		vintage: 'Q4 2025',
		transformation: 'Computed as recruitment rate minus resignation rate.'
	},
	{
		field_path: 'labour-monitor.retrenchment.incidence_per_1000',
		dataset: 'sg-labour-monitor-2025.json',
		label: 'Retrenchment incidence',
		source_keys: ['mom_labour_market_report_q4_2025'],
		source_tier: 'official_sg',
		vintage: 'Q4 2025',
		transformation: 'Directly taken from the published MOM Q4 2025 labour-market report.'
	},
	{
		field_path: 'labour-monitor.re_entry.rate_6m',
		dataset: 'sg-labour-monitor-2025.json',
		label: '6-month re-entry rate',
		source_keys: ['mom_labour_market_report_q4_2025'],
		source_tier: 'official_sg',
		vintage: 'Q4 2025',
		transformation: 'Directly taken from the published MOM Q4 2025 labour-market report.'
	}
];

const sourceMap = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	description:
		'Machine-readable field-level source map for the main public AI Work Index artifacts. Use this to inspect where headline fields come from, what vintage they use, and whether they are direct official values, derived Singapore values, or external proxies.',
	entries
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const payload = JSON.stringify(sourceMap, null, 2);
fs.writeFileSync(OUT_FILE, payload, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, payload, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, payload, 'utf-8');

console.log(`Built public field source map at ${STATIC_OUT_FILE}`);
