#!/usr/bin/env bun
/**
 * build-ai-in-singapore.ts — Publish an official Singapore national AI context
 * artifact from IMDA and MOM releases. This data is used for reports and
 * national context, not as an occupation-level score input.
 *
 * Run: bun run scripts/build-ai-in-singapore.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OUT_FILE = path.join(DATA_DIR, 'ai-in-singapore.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'ai-in-singapore.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-ai-in-singapore-2025.json');
const MOM_AI_ADOPTION_FILE = path.join(RAW_DIR, 'mom-ai-adoption-2026.json');

interface MomAiAdoptionRaw {
	source_key: string;
	agency: string;
	title: string;
	published_at: string;
	url: string;
	scope: string;
	metrics: {
		firms_not_adopted_ai_pct: number;
		firms_started_ai_adoption_pct: number;
		firms_integrating_ai_core_processes_pct: number;
		firms_planning_ai_pct: number;
		firms_piloting_ai_pct: number;
		small_firms_adoption_pct: number;
		large_firms_adoption_pct: number;
		information_and_communications_adoption_pct: number;
		professional_services_adoption_pct: number;
		financial_and_insurance_services_adoption_pct: number;
		ai_adopting_firms_reduced_headcount_pct: number;
		ai_adopting_firms_redesigning_roles_pct: number;
		ai_adopting_firms_creating_new_ai_jobs_pct: number;
		ai_adopting_firms_productivity_improvement_pct: number;
		high_implementation_cost_constraint_pct: number;
		lack_in_house_expertise_constraint_pct: number;
	};
}

function readMomAiAdoption(): MomAiAdoptionRaw {
	if (!fs.existsSync(MOM_AI_ADOPTION_FILE)) {
		throw new Error(`Missing MOM AI adoption raw source: ${MOM_AI_ADOPTION_FILE}`);
	}
	return JSON.parse(fs.readFileSync(MOM_AI_ADOPTION_FILE, 'utf-8')) as MomAiAdoptionRaw;
}

const momAiAdoption = readMomAiAdoption();

const aiInSingapore = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	context_type: 'national_ai_context',
	description:
		'Official Singapore national AI adoption, workforce, and programme context from IMDA and MOM releases. This artifact supports reports and public context around the structural score.',
	usage_guidance: {
		use_for: [
			'homepage and report context',
			'quarterly report framing',
			'sector-level AI adoption context',
			'methodology and data-page source transparency'
		],
		do_not_use_for: [
			'occupation-level score multipliers',
			'occupation-level employment estimates',
			'labour monitor replacement',
			'synthetic-role scoring'
		]
	},
	metrics: {
		digital_economy: {
			value_added_billion_sgd: 128.1,
			gdp_share_pct: 18.6,
			year: 2024,
			source_key: 'imda_sgde_2025'
		},
		enterprises: {
			sme_ai_adoption_pct: 14.5,
			non_sme_ai_adoption_pct: 62.5,
			ai_using_firms_expect_job_redesign_pct: 63,
			off_the_shelf_genai_usage_pct: 84,
			domain_specific_ai_solution_usage_pct: 52,
			custom_or_proprietary_ai_usage_pct: 44,
			year: 2024,
			source_key: 'imda_sgde_2025'
		},
		workforce: {
			workers_using_ai_at_work_pct: 73.8,
			tech_workforce_count: 214000,
			tech_role_median_monthly_wage_sgd: 7950,
			non_tech_role_median_monthly_wage_sgd: 4860,
			year: 2024,
			source_key: 'imda_sgde_2025'
		},
		mom_firm_ai_adoption_2026: {
			firms_not_adopted_ai_pct: momAiAdoption.metrics.firms_not_adopted_ai_pct,
			firms_started_ai_adoption_pct: momAiAdoption.metrics.firms_started_ai_adoption_pct,
			firms_integrating_ai_core_processes_pct:
				momAiAdoption.metrics.firms_integrating_ai_core_processes_pct,
			firms_planning_ai_pct: momAiAdoption.metrics.firms_planning_ai_pct,
			firms_piloting_ai_pct: momAiAdoption.metrics.firms_piloting_ai_pct,
			small_firms_adoption_pct: momAiAdoption.metrics.small_firms_adoption_pct,
			large_firms_adoption_pct: momAiAdoption.metrics.large_firms_adoption_pct,
			information_and_communications_adoption_pct:
				momAiAdoption.metrics.information_and_communications_adoption_pct,
			professional_services_adoption_pct: momAiAdoption.metrics.professional_services_adoption_pct,
			financial_and_insurance_services_adoption_pct:
				momAiAdoption.metrics.financial_and_insurance_services_adoption_pct,
			ai_adopting_firms_reduced_headcount_pct:
				momAiAdoption.metrics.ai_adopting_firms_reduced_headcount_pct,
			ai_adopting_firms_redesigning_roles_pct:
				momAiAdoption.metrics.ai_adopting_firms_redesigning_roles_pct,
			ai_adopting_firms_creating_new_ai_jobs_pct:
				momAiAdoption.metrics.ai_adopting_firms_creating_new_ai_jobs_pct,
			ai_adopting_firms_productivity_improvement_pct:
				momAiAdoption.metrics.ai_adopting_firms_productivity_improvement_pct,
			high_implementation_cost_constraint_pct:
				momAiAdoption.metrics.high_implementation_cost_constraint_pct,
			lack_in_house_expertise_constraint_pct:
				momAiAdoption.metrics.lack_in_house_expertise_constraint_pct,
			year: 2026,
			source_key: momAiAdoption.source_key,
			scope: momAiAdoption.scope,
			notes:
				'Official firm-adoption context only. This is not mapped into occupation-level score multipliers.'
		},
		national_programmes: {
			naiip_enterprises_target_3y: 10000,
			naiip_workers_target: 100000,
			announcement_date: '2026-03-02',
			source_key: 'imda_naiip_2026'
		},
		employer_quality_context: {
			soi_companies_covered_label: 'almost 1,500',
			soi_residents_covered_label: 'close to 1 million',
			launch_date: '2025-10-14',
			source_key: 'mom_soi_2025'
		}
	},
	sources: [
		{
			key: 'imda_sgde_2025',
			agency: 'IMDA',
			title: 'Annual Report & Singapore Digital Economy Report 2025',
			date_published: '2025-10-06',
			url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2025/singapore-digital-economy',
			metrics_used: [
				'digital economy value added (S$128.1B)',
				'digital economy share of GDP (18.6%)',
				'SME AI adoption (14.5%)',
				'non-SME AI adoption (62.5%)',
				'workers using AI at work (73.8%)',
				'AI-using firms expecting job redesign (63%)',
				'AI tool mix (84% off-the-shelf, 52% domain-specific, 44% customised/proprietary)',
				'tech workforce count (214,000)',
				'tech median monthly wage (S$7,950)',
				'non-tech median monthly wage (S$4,860)'
			]
		},
		{
			key: momAiAdoption.source_key,
			agency: momAiAdoption.agency,
			title: momAiAdoption.title,
			date_published: momAiAdoption.published_at,
			url: momAiAdoption.url,
			metrics_used: [
				'firms not yet adopting AI (71.5%)',
				'firms that have started AI adoption (28.5%)',
				'firms integrating AI into core processes (3.8%)',
				'information and communications adoption (74.1%)',
				'professional services adoption (57.5%)',
				'financial and insurance services adoption (56.4%)',
				'AI-adopting firms reporting reduced headcount (6.2%)',
				'AI-adopting firms redesigning roles (18.9%)',
				'AI-adopting firms creating new AI-related jobs (13.9%)',
				'AI-adopting firms reporting worker productivity improvement (70.7%)'
			],
			notes:
				'Used as near-term adoption context and forecast-readiness evidence, not as an occupation-level score input.'
		},
		{
			key: 'imda_naiip_2026',
			agency: 'IMDA / MDDI',
			title: 'National AI Impact Programme',
			date_published: '2026-03-02',
			url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2026/national-ai-impact-programme',
			metrics_used: [
				'NAIIP support target for enterprises (10,000 over 3 years)',
				'NAIIP target for AI bilingual workers (100,000)'
			]
		},
		{
			key: 'mom_soi_2025',
			agency: 'MOM',
			title: 'Launch of Singapore Opportunity Index',
			date_published: '2025-10-14',
			url: 'https://www.mom.gov.sg/newsroom/press-releases/2025/1014-launch-of-soi',
			metrics_used: [
				'coverage of almost 1,500 companies',
				'coverage of close to 1 million residents'
			],
			notes:
				'SOI is not an AI-adoption dataset. It is included as official employer-quality and career-mobility context around workforce opportunity.'
		}
	]
};

for (const dir of [DATA_DIR, SRC_DATA_DIR, STATIC_DATA_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const payload = JSON.stringify(aiInSingapore, null, 2);
fs.writeFileSync(OUT_FILE, payload, 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, payload, 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, payload, 'utf-8');

console.log(`Built AI in Singapore artifact at ${OUT_FILE}`);
console.log(`Published AI in Singapore artifact at ${STATIC_OUT_FILE}`);
