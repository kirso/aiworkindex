#!/usr/bin/env bun
/**
 * build-adoption-diffusion.ts — Publish Singapore AI adoption context as a
 * non-scoring sidecar from the MOM 2026 firm-adoption source.
 *
 * Run: bun run scripts/build-adoption-diffusion.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const SOURCE_FILE = path.join(ROOT_DIR, 'data', 'raw', 'mom-ai-adoption-2026.json');
const OUT_PATHS = [
	path.join(ROOT_DIR, 'data', 'adoption-diffusion.json'),
	path.join(ROOT_DIR, 'src', 'lib', 'data', 'adoption-diffusion.json'),
	path.join(ROOT_DIR, 'static', 'data', 'adoption-diffusion.json')
];

interface MomAdoptionSource {
	source_key: string;
	agency: string;
	title: string;
	published_at: string;
	url: string;
	vintage: string;
	scope: string;
	usage_guidance: { use_for: string[]; do_not_use_for: string[] };
	metrics: Record<string, number>;
	notes: string;
}

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8')) as MomAdoptionSource;

const sectorRows = [
	{
		key: 'information_and_communications',
		label: 'Information and communications',
		adoption_pct: source.metrics.information_and_communications_adoption_pct
	},
	{
		key: 'professional_services',
		label: 'Professional services',
		adoption_pct: source.metrics.professional_services_adoption_pct
	},
	{
		key: 'financial_and_insurance_services',
		label: 'Financial and insurance services',
		adoption_pct: source.metrics.financial_and_insurance_services_adoption_pct
	}
].map(row => ({
	...row,
	adoption_tier:
		row.adoption_pct >= 70 ? 'leading' : row.adoption_pct >= 50 ? 'early_majority' : 'emerging'
}));

const artifact = {
	validation_date: new Date().toISOString().slice(0, 10),
	model_version: DATA_VINTAGE.model_version,
	method: 'adoption_diffusion_context_v1',
	source: {
		key: source.source_key,
		agency: source.agency,
		title: source.title,
		published_at: source.published_at,
		url: source.url,
		scope: source.scope
	},
	framing:
		'Adoption/diffusion context describes firm uptake and constraints. It is not an occupation-level multiplier and does not change net_risk or risk_band.',
	overall: {
		firms_started_ai_adoption_pct: source.metrics.firms_started_ai_adoption_pct,
		firms_integrating_ai_core_processes_pct: source.metrics.firms_integrating_ai_core_processes_pct,
		firms_planning_ai_pct: source.metrics.firms_planning_ai_pct,
		firms_piloting_ai_pct: source.metrics.firms_piloting_ai_pct
	},
	firm_size: {
		small_firms_adoption_pct: source.metrics.small_firms_adoption_pct,
		large_firms_adoption_pct: source.metrics.large_firms_adoption_pct
	},
	sector_adoption: sectorRows,
	observed_outcomes_among_adopters: {
		reduced_headcount_pct: source.metrics.ai_adopting_firms_reduced_headcount_pct,
		redesigning_roles_pct: source.metrics.ai_adopting_firms_redesigning_roles_pct,
		creating_new_ai_jobs_pct: source.metrics.ai_adopting_firms_creating_new_ai_jobs_pct,
		productivity_improvement_pct: source.metrics.ai_adopting_firms_productivity_improvement_pct
	},
	constraints: {
		high_implementation_cost_pct: source.metrics.high_implementation_cost_constraint_pct,
		lack_in_house_expertise_pct: source.metrics.lack_in_house_expertise_constraint_pct,
		small_firms_lack_strategy_pct: source.metrics.small_firms_lack_strategy_constraint_pct,
		small_firms_low_trust_pct: source.metrics.small_firms_low_trust_constraint_pct,
		large_firms_integration_complexity_pct:
			source.metrics.large_firms_integration_complexity_constraint_pct,
		large_firms_data_security_pct: source.metrics.large_firms_data_security_constraint_pct
	},
	summary: {
		headline_adoption_pct: source.metrics.firms_started_ai_adoption_pct,
		headcount_reduction_among_adopters_pct: source.metrics.ai_adopting_firms_reduced_headcount_pct,
		role_redesign_among_adopters_pct: source.metrics.ai_adopting_firms_redesigning_roles_pct,
		top_sector: sectorRows[0]
	},
	caveats: [
		'MOM reports establishment-level adoption, not SSOC-level worker exposure.',
		'The source is used as Singapore adoption context and forecast-readiness evidence, not as a realized-displacement label.',
		'Sector adoption is only published for selected sectors in this sidecar; it is not mapped into occupation scores.'
	]
};

for (const outPath of OUT_PATHS) {
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`);
}

console.log(
	`Built adoption-diffusion.json: ${artifact.summary.headline_adoption_pct}% firms adopting AI; ${artifact.summary.headcount_reduction_among_adopters_pct}% of adopters reduced headcount`
);
