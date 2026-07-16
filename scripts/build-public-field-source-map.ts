#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT = path.join(import.meta.dir, '..');
const dataset = 'sg-ai-occupations-v8.json';
const entries = [
	{
		field_path: 'wages.*',
		dataset,
		label: 'Singapore gross monthly wages',
		source_keys: ['mom_ows_2024'],
		source_tier: 'official_local',
		vintage: '2024',
		transformation: 'Direct MOM occupational wage fields.'
	},
	{
		field_path: 'employment.*',
		dataset,
		label: 'Estimated detailed employment',
		source_keys: ['mom_lfr2025_table_d8', 'bls_projections_2024_2034'],
		source_tier: 'derived_from_official_local',
		vintage: '2025',
		transformation:
			'Official family totals allocated to detailed occupations with disclosed proxy weights.',
		caveat: 'Not an official detailed SSOC headcount.'
	},
	{
		field_path: 'ai_task_exposure_index',
		dataset,
		label: 'Multi-source AI exposure signal',
		source_keys: [
			'aioe_2021',
			'anthropic_economic_index_2026',
			'eloundou_gpt_exposure_2023',
			'ilo_genai_2025'
		],
		source_tier: 'cross_country_research',
		vintage: '2021-2026',
		transformation: 'Deterministic reliability-weighted research ensemble.',
		caveat: 'Not an official Singapore measure and not a task share.'
	},
	{
		field_path: 'human_bottleneck_index',
		dataset,
		label: 'Human advantage signal',
		source_keys: ['pizzinelli_theta_2023'],
		source_tier: 'cross_country_research',
		vintage: '2023',
		transformation: 'Matched complementarity input.',
		caveat: 'Cross-country research proxy.'
	},
	{
		field_path: 'v8.ai_exposure_rank',
		dataset,
		label: 'Relative AI exposure rank',
		source_keys: [
			'aioe_2021',
			'anthropic_economic_index_2026',
			'eloundou_gpt_exposure_2023',
			'ilo_genai_2025'
		],
		source_tier: 'cross_country_research',
		vintage: '2021-2026',
		transformation: 'Midrank percentile within 562 Singapore occupations.',
		caveat: 'Not a probability, task share or forecast.'
	},
	{
		field_path: 'v8.substitution_pressure',
		dataset,
		label: 'Relative substitution component',
		source_keys: ['aioe_2021', 'pizzinelli_theta_2023'],
		source_tier: 'cross_country_research',
		vintage: '2021-2026',
		transformation: 'Within-market rank of exposure times complement of human bottleneck.'
	},
	{
		field_path: 'v8.augmentation_potential',
		dataset,
		label: 'Relative augmentation component',
		source_keys: ['aioe_2021', 'pizzinelli_theta_2023'],
		source_tier: 'cross_country_research',
		vintage: '2021-2026',
		transformation: 'Within-market rank of exposure times human bottleneck.'
	},
	{
		field_path: 'v8.market_context.demand',
		dataset,
		label: 'Demand context',
		source_keys: ['mom_sol_2026', 'mom_job_vacancy_rates'],
		source_tier: 'derived_from_official_local',
		vintage: '2025-2026',
		transformation:
			'Categorical rule from official demand lists and derived momentum/scarcity signals.',
		caveat: 'Context and pathway input, not a headline-score weight.'
	},
	{
		field_path: 'v8.market_context.adoption',
		dataset,
		label: 'Sector adoption context',
		source_keys: ['mom_ai_adoption_2026'],
		source_tier: 'official_local',
		vintage: '2026',
		transformation: 'Sector evidence mapped only where occupation-industry coverage supports it.',
		caveat: 'Coverage is explicit; unknown is preserved.'
	},
	{
		field_path: 'v8.evidence_confidence',
		dataset,
		label: 'Evidence confidence',
		source_keys: ['aioe_2021', 'anthropic_economic_index_2026'],
		source_tier: 'synthetic',
		vintage: '2021-2026',
		transformation:
			'Categorical rule using source count, mapping quality, task evidence and policy caps.',
		caveat: 'Not a probability that the score is correct.'
	},
	{
		field_path: 'v8.sensitivity',
		dataset,
		label: 'Specification sensitivity',
		source_keys: [
			'aioe_2021',
			'anthropic_economic_index_2026',
			'eloundou_gpt_exposure_2023',
			'ilo_genai_2025'
		],
		source_tier: 'synthetic',
		vintage: '2021-2026',
		transformation: 'Observed range across equal-weight and leave-one-source-out variants.',
		caveat: 'Not a statistical confidence interval.'
	}
];
const payload = JSON.stringify(
	{
		version: DATA_VINTAGE.public_version,
		generated_at: new Date().toISOString(),
		description: 'Field-level provenance for the clean V8 public contract.',
		entries
	},
	null,
	2
);
for (const file of [
	path.join(ROOT, 'data', 'public-field-source-map.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'public-field-source-map.json'),
	path.join(ROOT, 'static', 'data', 'public-field-source-map.json')
])
	fs.writeFileSync(file, payload);
console.log('Built V8 public field source map');
