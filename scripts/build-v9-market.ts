#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dir, '..');
const OCCUPATIONS_FILE = path.join(ROOT, 'data', 'occupations-v9.json');
const JOBS_IN_DEMAND_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'external',
	'mom_jobs_in_demand_2025.json'
);
const SOL_FILE = path.join(ROOT, 'data', 'raw', 'external', 'mom_sol_2026.json');
const LABOUR_FILE = path.join(ROOT, 'data', 'labour-monitor-q1-2026.json');
const ADOPTION_FILE = path.join(ROOT, 'data', 'raw', 'mom-ai-adoption-2026.json');
const VACANCIES_FILE = path.join(ROOT, 'data', 'raw', 'mom-job-vacancies-2025-extract.json');
const EARLY_CAREER_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'mom-labour-force-2025-job-quality-extract.json'
);
const POSTINGS_FILE = path.join(ROOT, 'data', 'postings', 'postings-monitor.json');

const Q1_2026_DETAILED_CONTEXT = {
	source: 'Singapore Ministry of Manpower',
	title: 'Labour Market Report 1Q 2026',
	published_at: '2026-06-15',
	url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-1Q-2026.aspx',
	status: 'latest_detailed_quarter',
	quarter: '2026-Q1',
	vacancies: { value: 73.3, unit: 'thousand_vacancies' },
	job_vacancy_to_unemployed_ratio: { value: 1.46, unit: 'ratio' },
	total_employment_change: { value: 9.4, unit: 'thousand_workers' },
	resident_employment_change: { value: 5.4, unit: 'thousand_workers' },
	retrenchments: { value: 3830, unit: 'workers' },
	retrenchment_incidence: { value: 1.6, unit: 'workers_per_1000_employees' },
	re_entry_rate_within_six_months: { value: 60.7, unit: 'percent' },
	limitation:
		'National and broad labour-market context only. These values cannot be assigned to detailed occupations or attributed causally to AI.'
} as const;

type SourceKey = 'mom_jobs_in_demand_2025' | 'mom_sol_2026';

interface ReviewedMapping {
	source: SourceKey;
	name: string;
	codes: string[];
	rationale: string;
}

const reviewedMappings: ReviewedMapping[] = [
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Waiter',
		codes: ['51312'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Shop sales assistant',
		codes: ['52202'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Construction labourer',
		codes: ['93100'],
		rationale: 'Current detailed construction-labourer occupation.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Security officer',
		codes: ['54143', '54144'],
		rationale: 'Current senior and general private-security officer occupations.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Driver',
		codes: [],
		rationale:
			'Withheld: the published label spans several materially different detailed driver occupations.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Auditor',
		codes: ['24112'],
		rationale: 'Exact current accounting-auditor occupation.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Financial/investment adviser',
		codes: ['24121'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Software developer',
		codes: ['25121'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Data scientist',
		codes: ['21222'],
		rationale: 'Exact current SSOC title; replaces the obsolete network-administrator mapping.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Nurse',
		codes: ['22200', '32200'],
		rationale:
			'Reviewed one-to-many match to current registered and enrolled/assistant nurse occupations.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Strategic planning manager',
		codes: ['12132'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_jobs_in_demand_2025',
		name: 'Business development manager',
		codes: ['12212'],
		rationale: 'Exact current SSOC title; replaces the obsolete advertising-manager mapping.'
	},

	{
		source: 'mom_sol_2026',
		name: 'Alternative protein food application scientist',
		codes: ['21454'],
		rationale: 'Current SSOC synonyms include Food Application Scientist.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Novel food biotechnologist',
		codes: ['21454'],
		rationale: 'Current SSOC synonyms include Food Biotechnologist.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Financial/Investment adviser (ultra-high/high net worth)',
		codes: ['24121'],
		rationale: 'Exact current occupation and relationship-manager synonyms.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Relationship manager (ultra-high/high net worth)',
		codes: ['24121'],
		rationale: 'Current occupation synonyms include financial relationship manager.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Wealth planner (ultra-high/high net worth)',
		codes: ['24121'],
		rationale: 'Current financial/investment adviser occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon programme manager',
		codes: ['24214'],
		rationale: 'Current sustainability project-management occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon project originator',
		codes: ['24214'],
		rationale: 'Current SSOC synonyms include Carbon project originator/developer.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon project manager',
		codes: ['24214'],
		rationale: 'Current SSOC synonyms include Carbon project manager.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon rating analyst',
		codes: ['21333'],
		rationale: 'Current environmental-analyst synonyms include Carbon rating analyst.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon standards & methodology developer',
		codes: ['24214'],
		rationale: 'Current SSOC synonyms include Carbon standard and methodology developer.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon auditor',
		codes: ['21333'],
		rationale: 'Current environmental-analyst synonyms include Carbon Auditor.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon verification & audit specialist',
		codes: ['21333'],
		rationale: 'Current environmental-analyst synonyms include this specialty.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Carbon trader',
		codes: ['24354'],
		rationale: 'Current environmental-commodities-trader synonyms include Carbon trader.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Clinical psychologist',
		codes: ['26611'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Diagnostic radiographer',
		codes: ['22693'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Occupational therapist',
		codes: ['22680'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Physiotherapist',
		codes: ['22640'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Podiatrist',
		codes: ['22692'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Medical social worker',
		codes: ['26622'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Registered nurse',
		codes: ['22200'],
		rationale: 'Exact current registered-nurse occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'AI engineer',
		codes: ['25143'],
		rationale: 'New SSOC 2024 AI/ML engineer occupation; exact synonym.'
	},
	{
		source: 'mom_sol_2026',
		name: 'AI researcher/scientist',
		codes: ['25142'],
		rationale: 'New SSOC 2024 artificial-intelligence applied researcher occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Analyst programmer',
		codes: ['25141'],
		rationale: 'Current SSOC synonyms include Analyst programmer.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Cloud architect/engineer',
		codes: ['25231'],
		rationale: 'Current cloud-specialist occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Cybersecurity architect/engineer',
		codes: ['25245'],
		rationale: 'Current SSOC synonyms include Cybersecurity engineer.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Data scientist',
		codes: ['21222'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Digital forensics specialist',
		codes: ['25244'],
		rationale: 'Exact new SSOC 2024 title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Penetration testing specialist',
		codes: ['25242'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Software developer',
		codes: ['25121'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Software and applications manager',
		codes: ['13302'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Web/mobile applications developer',
		codes: ['25122'],
		rationale: 'Current web and mobile applications developer occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Marine superintendent',
		codes: ['21714'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Marine technical superintendent',
		codes: ['21712'],
		rationale: 'Current technical-superintendent occupation.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Semiconductor engineer',
		codes: ['21521'],
		rationale: 'Current electronics-engineer synonyms include semiconductor engineer.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Instrumentation engineer',
		codes: ['21525'],
		rationale: 'Exact current SSOC title.'
	},
	{
		source: 'mom_sol_2026',
		name: 'Process engineer',
		codes: ['21415'],
		rationale: 'Exact current SSOC title.'
	}
];

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function clusterForMajorGroup(
	code: string
): 'pmet' | 'clerical_sales_service' | 'production_transport' | null {
	if (['1', '2', '3'].includes(code)) return 'pmet';
	if (['4', '5'].includes(code)) return 'clerical_sales_service';
	if (['6', '7', '8', '9'].includes(code)) return 'production_transport';
	return null;
}

function annotateLabourUnits(item: Record<string, unknown> & { cluster_key: string }) {
	const vacancy = item.vacancy as Record<string, unknown>;
	const hiring = item.hiring as Record<string, unknown> | null;
	const retrenchment = item.retrenchment as Record<string, unknown> | null;
	const reEntry = item.re_entry as Record<string, unknown> | null | undefined;

	return {
		...item,
		vacancy: {
			...vacancy,
			units: {
				rate: 'percent',
				rate_change: 'percentage_points',
				count: 'thousand_vacancies',
				count_change: 'thousand_vacancies',
				trend: 'percent'
			}
		},
		hiring: hiring
			? {
					...hiring,
					units: {
						rate: 'percent',
						rate_change: 'percentage_points'
					}
				}
			: null,
		retrenchment: retrenchment
			? {
					...retrenchment,
					units: {
						count: 'workers',
						count_change: 'workers',
						incidence: 'workers_per_1000_employees',
						trend: 'percent'
					}
				}
			: null,
		re_entry: reEntry
			? {
					...reEntry,
					units: {
						rate: 'percent',
						rate_change: 'percentage_points'
					}
				}
			: reEntry
	};
}

function main() {
	const release = readJson<{
		occupations: Array<{
			taxonomy: { code: string; title: string; hierarchy: { major_group: { code: string } } };
		}>;
	}>(OCCUPATIONS_FILE);
	const jobs = readJson<{ released: string; url: string; occupations: Array<{ title: string }> }>(
		JOBS_IN_DEMAND_FILE
	);
	const sol = readJson<{
		released: string;
		effective_date: string;
		url: string;
		occupations: Array<{ shortage_occupation: string }>;
	}>(SOL_FILE);
	const labour = readJson<Array<Record<string, unknown> & { cluster_key: string }>>(LABOUR_FILE);
	const adoption = readJson<Record<string, unknown>>(ADOPTION_FILE);
	const vacancies = readJson<Record<string, unknown>>(VACANCIES_FILE);
	const earlyCareer = readJson<{
		source: {
			title: string;
			publisher: string;
			url: string;
			report_file: string;
			vintage: string;
		};
		years: number[];
		unemployment_rate_pct: {
			pmet_age_15_29: number[];
			non_pmet_age_15_29: number[];
		};
	}>(EARLY_CAREER_FILE);
	const postings = readJson<
		Record<string, unknown> & {
			observed_through?: string | null;
			summary?: {
				total_postings?: number;
				source_count?: number;
				latest_posted_date?: string | null;
			};
		}
	>(POSTINGS_FILE);

	const occupationsByCode = new Map(release.occupations.map(item => [item.taxonomy.code, item]));
	const earlyCareerYear = earlyCareer.years.at(-1);
	const earlyCareerPmet = earlyCareer.unemployment_rate_pct.pmet_age_15_29.at(-1);
	const earlyCareerNonPmet = earlyCareer.unemployment_rate_pct.non_pmet_age_15_29.at(-1);
	if (earlyCareerYear !== 2025 || earlyCareerPmet !== 2.8 || earlyCareerNonPmet !== 4.1) {
		throw new Error('Unexpected latest early-career labour-force values');
	}
	const sourceNames = new Map<SourceKey, Set<string>>([
		['mom_jobs_in_demand_2025', new Set(jobs.occupations.map(item => item.title))],
		['mom_sol_2026', new Set(sol.occupations.map(item => item.shortage_occupation))]
	]);
	for (const mapping of reviewedMappings) {
		if (!sourceNames.get(mapping.source)?.has(mapping.name)) {
			throw new Error(`${mapping.source}: reviewed mapping not found in source: ${mapping.name}`);
		}
		for (const code of mapping.codes) {
			if (!occupationsByCode.has(code))
				throw new Error(`${mapping.name}: unknown SSOC 2024 code ${code}`);
		}
	}
	if (reviewedMappings.length !== jobs.occupations.length + sol.occupations.length) {
		throw new Error(
			`expected ${jobs.occupations.length + sol.occupations.length} reviewed source labels, found ${reviewedMappings.length}`
		);
	}

	const demandByCode: Record<string, unknown[]> = {};
	for (const mapping of reviewedMappings) {
		for (const code of mapping.codes) {
			const source =
				mapping.source === 'mom_jobs_in_demand_2025'
					? {
							label: 'MOM Jobs in Demand 2025',
							published_at: jobs.released,
							effective_at: null,
							url: jobs.url
						}
					: {
							label: 'MOM COMPASS Shortage Occupation List 2026',
							published_at: sol.released,
							effective_at: sol.effective_date,
							url: sol.url
						};
			(demandByCode[code] ??= []).push({
				source_key: mapping.source,
				...source,
				source_occupation: mapping.name,
				mapping_basis: 'reviewed_against_ssoc_2024_title_and_synonyms',
				rationale: mapping.rationale,
				interpretation:
					'Positive named signal from this source; the source is not an exhaustive ranking of all occupations.'
			});
		}
	}

	const labourByCluster = Object.fromEntries(
		labour.map(item => [item.cluster_key, annotateLabourUnits(item)])
	);
	const labourByMajorGroup = Object.fromEntries(
		['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(code => {
			const cluster = clusterForMajorGroup(code);
			return [code, cluster ? (labourByCluster[cluster] ?? null) : null];
		})
	);

	const output = {
		schema_version: '9.0',
		generated_at: '2026-08-19',
		taxonomy: 'SSOC 2024',
		rules: {
			demand: 'Only reviewed named occupation matches. No code-prefix or parent-group inheritance.',
			labour_context:
				'Q1 2026 context is attached only at MOM published broad occupation-group grain.',
			postings:
				'Convenience-sample postings are withheld from current-demand interpretation when stale.',
			headline_separation: 'No market field changes AI Work Pressure Rank.'
		},
		demand_by_code: demandByCode,
		withheld_demand_mappings: reviewedMappings
			.filter(mapping => mapping.codes.length === 0)
			.map(mapping => ({
				source_key: mapping.source,
				source_occupation: mapping.name,
				reason: mapping.rationale
			})),
		labour_by_major_group: labourByMajorGroup,
		national: {
			job_vacancies_2025: vacancies,
			ai_adoption_2026: adoption,
			labour_market_q1_2026_detailed: Q1_2026_DETAILED_CONTEXT,
			early_career_2025: {
				source: earlyCareer.source,
				latest_full_report: {
					title: 'Labour Force in Singapore 2025',
					published_at: '2026-01-29',
					url: 'https://stats.mom.gov.sg/iMAS_Tables1/LabourForce/LabourForce_2025/mrsd_2025LabourForce_survey_findings.pdf'
				},
				observation_period: '2025-06',
				population: 'Singapore residents aged 15 to 29 with previous work experience',
				classification:
					'Unemployed residents are classified by their previous occupation as PMET or non-PMET.',
				seasonal_adjustment: 'not_seasonally_adjusted',
				unit: 'percent',
				pmet_unemployment_rate: earlyCareerPmet,
				non_pmet_unemployment_rate: earlyCareerNonPmet,
				limitations: [
					'Excludes unemployed residents without work experience, including many never-employed fresh entrants.',
					'The denominator is employed residents plus unemployed residents who previously worked in the occupation class.',
					'These are not total youth-unemployment rates and do not identify an AI effect.'
				]
			},
			labour_market_q2_2026_advance: {
				source: 'Singapore Ministry of Manpower',
				title: 'Labour Market Advance Release 2Q 2026',
				published_at: '2026-07-31',
				url: 'https://www.mom.gov.sg/newsroom/press-releases/2026/0731-labour-market-advance-release-2q-2026',
				status: 'preliminary',
				total_employment_change: 10700,
				unemployment_rate_pct: { overall: 2.0, resident: 2.9, citizen: 3.0 },
				retrenchments: 4500,
				limitation:
					'Advance macro figures only. Q1 2026 remains the latest detailed occupation-group release until the full Q2 report.'
			},
			postings_monitor: {
				status: 'withheld_stale_convenience_sample',
				public_demand_input: false,
				observed_through: postings.observed_through ?? postings.summary?.latest_posted_date ?? null,
				sample_postings: postings.summary?.total_postings ?? null,
				source_count: postings.summary?.source_count ?? null,
				limitation:
					'The sample is not representative of Singapore hiring and contains no recent posting volume; it cannot rank current demand.'
			}
		}
	};

	const serialized = `${JSON.stringify(output, null, 2)}\n`;
	for (const file of [
		path.join(ROOT, 'data', 'v9-market-context.json'),
		path.join(ROOT, 'src', 'lib', 'data', 'v9-market-context.json'),
		path.join(ROOT, 'static', 'data', 'v9-market-context.json')
	]) {
		fs.writeFileSync(file, serialized);
	}
	console.log(
		`V9 market: ${Object.keys(demandByCode).length} occupations with direct signals; ${output.withheld_demand_mappings.length} withheld mappings`
	);
}

main();
