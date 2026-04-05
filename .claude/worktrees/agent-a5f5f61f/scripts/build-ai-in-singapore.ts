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
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OUT_FILE = path.join(DATA_DIR, 'ai-in-singapore.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'ai-in-singapore.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'sg-ai-in-singapore-2025.json');

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
			url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2024/ar-sgde-2024',
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
