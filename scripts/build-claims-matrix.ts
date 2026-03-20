#!/usr/bin/env bun
/**
 * build-claims-matrix.ts — Publish a machine-readable registry of major public
 * claims, their evidence strength, and the source keys or artifacts that back
 * them. This keeps high-level copy auditable across the site.
 *
 * Run: bun run scripts/build-claims-matrix.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const OUT_FILE = path.join(DATA_DIR, 'claims-matrix.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'claims-matrix.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'claims-matrix-v4.json');

type ClaimStrength = 'high' | 'medium' | 'directional' | 'estimated' | 'synthetic';

interface ClaimEntry {
	id: string;
	category:
		| 'scope'
		| 'methodology'
		| 'validation'
		| 'employment'
		| 'monitor'
		| 'synthetic_roles'
		| 'national_context';
	claim: string;
	strength: ClaimStrength;
	source_keys: string[];
	evidence_artifacts?: string[];
	where_used: string[];
	notes: string;
}

const claims: ClaimEntry[] = [
	{
		id: 'scores_562_official_occupations',
		category: 'scope',
		claim: 'The core structural score covers 562 Singapore SSOC occupations.',
		strength: 'high',
		source_keys: ['mom_ows_2024'],
		evidence_artifacts: ['sg-ai-occupations-v4.json'],
		where_used: ['/', '/about', '/data', '/methodology', '/README'],
		notes: 'Backed by the published MOM occupation table and the current frozen score dataset.'
	},
	{
		id: 'deterministic_no_llm_core',
		category: 'methodology',
		claim:
			'The canonical structural score is deterministic and does not use an LLM in the scoring loop.',
		strength: 'high',
		source_keys: ['aioe_2021', 'pizzinelli_theta_2023', 'anthropic_economic_index_2026'],
		evidence_artifacts: ['scripts/score.ts', 'sg-ai-occupations-v4.json'],
		where_used: ['/about', '/methodology', '/README'],
		notes:
			'The scorer is a reproducible Bun pipeline with fixed constants and published source inputs.'
	},
	{
		id: 'reliability_weighted_exposure_ensemble',
		category: 'methodology',
		claim:
			'V4.1 uses a reliability-weighted 4-source exposure ensemble (AIOE, Anthropic, Eloundou, ILO).',
		strength: 'high',
		source_keys: [
			'aioe_2021',
			'anthropic_economic_index_2026',
			'eloundou_gpt_exposure_2023',
			'ilo_genai_2025'
		],
		evidence_artifacts: ['scripts/score.ts', 'sg-ai-occupations-v4.json'],
		where_used: ['/about', '/data', '/methodology', '/README'],
		notes:
			'Weights are deterministic and derived from documented source-reliability dimensions: recency, construct fit, coverage quality, and validation support.'
	},
	{
		id: 'onet_task_and_technology_context',
		category: 'methodology',
		claim:
			'O*NET task and technology-skill profiles are used as supporting explanatory context on detail pages, not as direct score inputs.',
		strength: 'medium',
		source_keys: ['onet_occupation_data', 'onet_task_statements', 'onet_technology_skills'],
		evidence_artifacts: ['onet-enrichment.json', 'scripts/enrich-onet.ts'],
		where_used: ['/occupation/[ssoc]', '/role/[slug]', '/methodology', '/data'],
		notes:
			'The enrichment is based on title matching and is explicitly treated as contextual support for task and tools framing rather than a determinant of the structural score.'
	},
	{
		id: 'structural_pressure_not_prediction',
		category: 'methodology',
		claim: 'The headline score measures structural AI pressure, not a forecast of job losses.',
		strength: 'high',
		source_keys: ['aioe_2021', 'pizzinelli_theta_2023', 'mom_labour_monitor_2025'],
		where_used: ['/', '/about', '/methodology'],
		notes:
			'This is a framing claim about what the model is designed to measure and what it is not designed to predict.'
	},
	{
		id: 'offset_potential_is_separate_support_layer',
		category: 'methodology',
		claim:
			'Offset potential is published separately as a heuristic support layer and should not be read as a direct measure of reinstatement or realised job creation.',
		strength: 'medium',
		source_keys: [
			'mom_labour_monitor_2025',
			'mom_job_vacancy_rates',
			'mom_sol_2026',
			'mom_jobs_in_demand_2025',
			'skillsfuture_transition_mapping',
			'wsg_careersfinder',
			'onet_task_statements'
		],
		evidence_artifacts: ['sg-offset-potential-v4.json', 'scripts/build-offset-potential.ts'],
		where_used: ['/methodology', '/data', '/occupation/[ssoc]', '/role/[slug]'],
		notes:
			'This layer approximates offsetting forces with demand, transition support, and task context. It intentionally sits outside the core structural score because direct occupation-level reinstatement data is not available.'
	},
	{
		id: 'estimated_sg_employment_not_official',
		category: 'employment',
		claim:
			'estimated_sg_employment_thousands is an estimated Singapore occupation headcount, not an official detailed occupation count.',
		strength: 'estimated',
		source_keys: ['mom_lfr2024_table_d8'],
		evidence_artifacts: ['sg-ai-occupations-v4.json', 'sg-ai-occupations-v4.csv'],
		where_used: ['/data', '/reports/wage-exposure'],
		notes:
			'The field is derived from published sub-major totals and should always be read as an estimate until official 4- or 5-digit occupation counts are obtained.'
	},
	{
		id: 'bls_proxy_for_wage_pool',
		category: 'employment',
		claim:
			'The wage-pool headline uses a BLS-weighted proxy employment field rather than official Singapore occupation headcounts.',
		strength: 'estimated',
		source_keys: ['mom_lfr2024_table_d8', 'bls_projections_2024_2034'],
		evidence_artifacts: ['sg-ai-occupations-v4.json'],
		where_used: ['/', '/reports/wage-exposure'],
		notes:
			'This is an external proportional proxy used for wage-pool analysis, not a direct Singapore employment observation.'
	},
	{
		id: 'bls_cross_check_directional_only',
		category: 'validation',
		claim:
			'The BLS occupation comparison is a convergent cross-check and should be interpreted directionally, not as Singapore outcome truth.',
		strength: 'directional',
		source_keys: ['bls_projections_2024_2034'],
		evidence_artifacts: ['data/backtests/bls-crosswalk-validation.json'],
		where_used: ['/', '/about', '/methodology', '/README'],
		notes:
			'Useful for external consistency, but it is still US labour-market evidence rather than Singapore realised outcomes.'
	},
	{
		id: 'temporal_cluster_validation_vacancy',
		category: 'validation',
		claim:
			'Across the available multi-period Singapore cluster data, higher-risk clusters consistently show weaker year-over-year vacancy movement than lower-risk clusters.',
		strength: 'directional',
		source_keys: ['mom_labour_monitor_2025', 'mom_job_vacancy_rates', 'mom_job_vacancy_counts'],
		evidence_artifacts: ['data/backtests/multi-period-validation.json'],
		where_used: ['/methodology', '/about', '/data'],
		notes:
			'This is a temporal rank-order check at cluster level. It strengthens the claim that the score tracks long-run pressure, but it is not an occupation-level predictive test.'
	},
	{
		id: 'confidence_and_mapping_are_calibrated_directionally',
		category: 'validation',
		claim:
			'Direct mappings and the broad high/medium-confidence score population show negative external alignment with BLS employment projections, while low-confidence cases remain intentionally small and noisier.',
		strength: 'directional',
		source_keys: ['bls_projections_2024_2034'],
		evidence_artifacts: ['data/backtests/calibration-diagnostics.json'],
		where_used: ['/methodology', '/about', '/data'],
		notes:
			'This is a calibration diagnostic around mapping quality and confidence tiers. It improves trust framing, but it is still derived from cross-country evidence rather than Singapore occupation-level outcomes.'
	},
	{
		id: 'occupation_family_validation_directional',
		category: 'validation',
		claim:
			'Aggregated 2-digit occupation families also show negative directional alignment between structural risk and BLS projected employment change.',
		strength: 'directional',
		source_keys: ['bls_projections_2024_2034'],
		evidence_artifacts: ['data/backtests/occupation-family-validation.json'],
		where_used: ['/methodology', '/about', '/data'],
		notes:
			'This sits between the 3 broad labour clusters and individual occupations. It is more granular than the cluster backtest, but still a cross-country convergent check rather than Singapore realised outcomes.'
	},
	{
		id: 'cluster_level_labour_monitor',
		category: 'monitor',
		claim:
			'The labour monitor is a separate cluster-level Singapore evidence layer, not an occupation-level structural input.',
		strength: 'high',
		source_keys: [
			'mom_labour_monitor_2025',
			'mom_recruitment_resignation_rates',
			'mom_retrenchment_by_occupation_group'
		],
		evidence_artifacts: ['sg-labour-monitor-2025.json', 'sg-context-pack-2025.json'],
		where_used: ['/data', '/methodology', '/occupation/[ssoc]', '/role/[slug]'],
		notes:
			'It is intentionally published separately so current evidence is not mistaken for part of the core structural score.'
	},
	{
		id: 'synthetic_roles_are_estimates',
		category: 'synthetic_roles',
		claim: 'Modern roles are estimated synthetic constructs rather than official occupations.',
		strength: 'synthetic',
		source_keys: ['mom_ows_2024', 'aioe_2021', 'pizzinelli_theta_2023'],
		evidence_artifacts: ['src/lib/data/synthetic-roles.ts'],
		where_used: ['/about', '/methodology', '/role/[slug]'],
		notes:
			'These pages are modelled from component occupations and workflow context, and should be read more conservatively than official occupation pages.'
	},
	{
		id: 'ai_in_singapore_context_not_score_input',
		category: 'national_context',
		claim:
			'National AI adoption and programme statistics from IMDA and MOM are contextual evidence around the score, not occupation-level multipliers inside it.',
		strength: 'high',
		source_keys: ['imda_digital_economy_2025', 'imda_naiip_2026', 'mom_soi_2025'],
		evidence_artifacts: ['sg-ai-in-singapore-2025.json', 'sg-context-pack-2025.json'],
		where_used: ['/data', '/about', '/methodology'],
		notes:
			'These figures explain the broader Singapore context but are not mapped directly onto occupation scores.'
	}
];

const claimsMatrix = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	strength_labels: {
		high: 'Directly supported by the current pipeline or official published data at the level shown.',
		medium: 'Supported, but with more methodological interpretation or partial coverage.',
		directional: 'Useful for directional consistency, not direct Singapore ground truth.',
		estimated: 'Derived or proxy-based; should not be read as an official measured value.',
		synthetic: 'Applies to estimated role constructs rather than official occupations.'
	},
	claims
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const payload = JSON.stringify(claimsMatrix, null, 2);
fs.writeFileSync(OUT_FILE, payload, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, payload, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, payload, 'utf-8');

console.log(`Built claims matrix at ${STATIC_OUT_FILE}`);
