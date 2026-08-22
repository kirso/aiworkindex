#!/usr/bin/env bun

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dir, '..');
const REVIEW_CUTOFF = '2026-08-19';

const FILES = {
	occupations: 'data/occupations-v9.json',
	market: 'data/v9-market-context.json',
	employment: 'data/raw/employment_by_occupation.csv',
	workerProfile: 'data/worker-profile.json',
	workerProfileSource: 'data/raw/LFR2025_SectionD.xlsx',
	industryContext: 'data/industry-context.json',
	industryEmploymentSource: 'data/raw/industry_x_occupation.csv',
	industryVacancySource: 'data/raw/job_vacancies_by_industry_and_occupation_quarterly.csv',
	labourMonitor: 'data/labour-monitor-q1-2026.json'
} as const;

const OUTPUTS = [
	'data/v9-economic-observatory.json',
	'src/lib/data/v9-economic-observatory.json',
	'static/data/v9-economic-observatory.json'
];

type JsonRecord = Record<string, unknown>;

interface OccupationRelease {
	counts: {
		occupations: number;
		scored: number;
		insufficient_evidence: number;
		direct_wages: number;
	};
	occupations: Array<{
		taxonomy: {
			code: string;
			title: string;
			hierarchy: { major_group: { code: string; title: string } };
		};
		score_status: 'scored' | 'insufficient_evidence';
		singapore_market: { wages: unknown | null };
	}>;
}

interface WorkerGroup {
	total_employment: number;
	sex_share: { male: number; female: number };
	employment_status_share: { self_employed: number };
	work_arrangement_share: { full_time: number; part_time: number };
	age_share: {
		age_15_29: number;
		age_30_49: number;
		age_50_59: number;
		age_60_plus: number;
	};
}

interface IndustryItem {
	key: string;
	label: string;
	employment_2025: number;
	share_2025: number;
	cagr_5y: number | null;
	change_2y: number | null;
	vacancy_latest: number | null;
	vacancy_quarter: string | null;
	vacancy_trend_4q_pct: number | null;
	vacancy_signal: 'rising' | 'stable' | 'cooling' | null;
}

interface IndustryGroup {
	total_employment_2025: number;
	top_industries: IndustryItem[];
	fastest_growing_industries: IndustryItem[];
}

interface LabourCluster {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	vacancy: JsonRecord;
	hiring: JsonRecord | null;
	retrenchment: JsonRecord | null;
	re_entry?: JsonRecord;
	summary: string;
	data_as_of: string;
	source: string;
}

const MAJOR_GROUPS: Record<
	string,
	{ sourceKey: string | null; sourceLabel: string | null; title: string }
> = {
	'1': {
		sourceKey: 'MANAGERS',
		sourceLabel: 'Managers & Administrators (Including Working Proprietors)',
		title: 'Legislators, senior officials and managers'
	},
	'2': { sourceKey: 'PROFESSIONALS', sourceLabel: 'Professionals', title: 'Professionals' },
	'3': {
		sourceKey: 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
		sourceLabel: 'Associate Professionals & Technicians',
		title: 'Associate professionals and technicians'
	},
	'4': {
		sourceKey: 'CLERICAL SUPPORT WORKERS',
		sourceLabel: 'Clerical Support Workers',
		title: 'Clerical support workers'
	},
	'5': {
		sourceKey: 'SERVICE AND SALES WORKERS',
		sourceLabel: 'Service & Sales Workers',
		title: 'Service and sales workers'
	},
	'6': {
		sourceKey: null,
		sourceLabel: null,
		title: 'Agricultural and fishery workers'
	},
	'7': {
		sourceKey: 'CRAFTSMEN AND RELATED TRADES WORKERS',
		sourceLabel: 'Craftsmen & Related Trade Workers',
		title: 'Craftsmen and related trades workers'
	},
	'8': {
		sourceKey: 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
		sourceLabel: 'Plant & Machine Operators & Assemblers',
		title: 'Plant and machine operators and assemblers'
	},
	'9': {
		sourceKey: 'CLEANERS, LABOURERS AND RELATED WORKERS',
		sourceLabel: 'Cleaners, Labourers & Related Workers',
		title: 'Cleaners, labourers and related workers'
	}
};

function absolute(relativePath: string): string {
	return path.join(ROOT, relativePath);
}

function readJson<T>(relativePath: string): T {
	return JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8')) as T;
}

function sha256(relativePath: string): string {
	return crypto
		.createHash('sha256')
		.update(fs.readFileSync(absolute(relativePath)))
		.digest('hex');
}

function sourceArtifact(relativePath: string) {
	return {
		file: relativePath,
		size_bytes: fs.statSync(absolute(relativePath)).size,
		sha256: sha256(relativePath)
	};
}

function parseCsvRow(line: string): string[] {
	const fields: string[] = [];
	let current = '';
	let quoted = false;
	for (const char of line) {
		if (char === '"') quoted = !quoted;
		else if (char === ',' && !quoted) {
			fields.push(current);
			current = '';
		} else current += char;
	}
	fields.push(current);
	return fields;
}

function numberOrNull(value: string | undefined): number | null {
	if (!value) return null;
	const cleaned = value.trim().toLowerCase();
	if (!cleaned || cleaned === 'na' || cleaned === '-') return null;
	const parsed = Number(cleaned.replaceAll(',', ''));
	return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function percentChange(previous: number | null, latest: number | null): number | null {
	if (previous == null || latest == null || previous === 0) return null;
	return round(((latest - previous) / previous) * 100, 2);
}

function employmentSeriesByGroup(): Record<string, Record<string, number | null>> {
	const lines = fs.readFileSync(absolute(FILES.employment), 'utf8').split(/\r?\n/).filter(Boolean);
	const header = parseCsvRow(lines[0]);
	const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
	const indexes = new Map(years.map(year => [year, header.indexOf(year)]));
	const output: Record<string, Record<string, number | null>> = {};

	for (const line of lines.slice(1)) {
		const row = parseCsvRow(line);
		const rawLabel = row[0] ?? '';
		if (!rawLabel.startsWith('    ') || rawLabel.startsWith('        ')) continue;
		const label = rawLabel.trim();
		const group = Object.entries(MAJOR_GROUPS).find(([, value]) => value.sourceLabel === label);
		if (!group || output[group[0]]) continue;
		output[group[0]] = Object.fromEntries(
			years.map(year => [year, numberOrNull(row[indexes.get(year) ?? -1])])
		);
		if (Object.keys(output).length === 8) break;
	}

	return output;
}

const occupationsRelease = readJson<OccupationRelease>(FILES.occupations);
const market = readJson<{
	national: Record<string, JsonRecord>;
	demand_by_code: Record<string, unknown[]>;
	labour_by_major_group: Record<string, LabourCluster | null>;
}>(FILES.market);
const workerProfile = readJson<{
	metadata: { data_as_of: string; notes: string[] };
	groups: Record<string, WorkerGroup>;
}>(FILES.workerProfile);
const industryContext = readJson<{
	metadata: JsonRecord;
	groups: Record<string, IndustryGroup>;
}>(FILES.industryContext);
const labourMonitor = readJson<LabourCluster[]>(FILES.labourMonitor);
const employmentByGroup = employmentSeriesByGroup();

const groupProfiles = Object.fromEntries(
	Object.entries(MAJOR_GROUPS).map(([code, group]) => {
		const employment = employmentByGroup[code] ?? null;
		const workforce = group.sourceKey ? (workerProfile.groups[group.sourceKey] ?? null) : null;
		const industries = group.sourceKey ? (industryContext.groups[group.sourceKey] ?? null) : null;
		const labour = market.labour_by_major_group[code] ?? null;

		if (!employment || !workforce || !industries) {
			return [
				code,
				{
					major_group: { code, title: group.title },
					measurement_status: 'unavailable_separate_broad_group_row',
					employment: null,
					workforce: null,
					industry_footprint: null,
					labour_context: labour,
					limitations: [
						'The retained official broad occupation source has no separate row for SSOC major group 6.',
						'The wider production-and-transport labour cluster is context only and cannot replace a missing major-group observation.'
					]
				}
			];
		}

		const latest = employment['2025'];
		return [
			code,
			{
				major_group: { code, title: group.title },
				measurement_status: 'observed_broad_occupation_group',
				employment: {
					grain: 'broad_occupation_group',
					geography: 'Singapore residents',
					unit: 'thousand_employed_residents',
					series: employment,
					latest: { period: '2025', value: latest },
					derived_change: {
						year_over_year_pct: percentChange(employment['2024'], latest),
						since_2019_pct: percentChange(employment['2019'], latest)
					}
				},
				workforce: {
					grain: 'broad_occupation_group',
					geography: 'Singapore residents',
					period: workerProfile.metadata.data_as_of,
					age_share: workforce.age_share,
					female_share: workforce.sex_share.female,
					self_employed_share: workforce.employment_status_share.self_employed,
					part_time_share: workforce.work_arrangement_share.part_time
				},
				industry_footprint: {
					grain: 'broad_occupation_group_by_industry',
					geography: 'Singapore residents',
					period: '2025',
					top_industries: industries.top_industries.slice(0, 5),
					fastest_growing_industries: industries.fastest_growing_industries.slice(0, 3),
					vacancy_overlay_period: industryContext.metadata.vacancy_overlay_vintage ?? null
				},
				labour_context: labour,
				limitations: [
					'These observations describe a broad occupation group, not every detailed occupation inside it.',
					'Employment changes are descriptive and do not identify an AI effect.',
					'Industry vacancy overlays can lag the current broad labour monitor and remain industry context.'
				]
			}
		];
	})
);

const occupationCoverage = occupationsRelease.occupations.map(occupation => {
	const code = occupation.taxonomy.code;
	const majorGroupCode = occupation.taxonomy.hierarchy.major_group.code;
	return {
		ssoc: code,
		major_group_code: majorGroupCode,
		pressure: occupation.score_status === 'scored' ? 'ranked' : 'unranked',
		direct_wage: occupation.singapore_market.wages != null,
		named_demand_sources: market.demand_by_code[code]?.length ?? 0,
		broad_employment_context:
			groupProfiles[majorGroupCode]?.measurement_status === 'observed_broad_occupation_group',
		broad_labour_context: market.labour_by_major_group[majorGroupCode] != null,
		detailed_ai_adoption: false,
		detailed_output_or_price_elasticity: false,
		detailed_new_task_creation: false,
		detailed_job_quality_change: false,
		causal_ai_labour_outcome: false,
		economic_scenario: 'withheld_insufficient_compatible_evidence'
	};
});

const coverageCounts = {
	detailed_occupations: occupationCoverage.length,
	pressure_ranked: occupationCoverage.filter(row => row.pressure === 'ranked').length,
	direct_wage: occupationCoverage.filter(row => row.direct_wage).length,
	named_demand: occupationCoverage.filter(row => row.named_demand_sources > 0).length,
	broad_employment_context: occupationCoverage.filter(row => row.broad_employment_context).length,
	broad_labour_context: occupationCoverage.filter(row => row.broad_labour_context).length,
	detailed_ai_adoption: 0,
	detailed_output_or_price_elasticity: 0,
	detailed_new_task_creation: 0,
	detailed_job_quality_change: 0,
	causal_ai_labour_outcomes: 0,
	classified_economic_scenarios: 0
};

const adoption = market.national.ai_adoption_2026 as JsonRecord;
const vacancyUpdate = market.national.job_vacancies_august_2026_update as JsonRecord;
const q2 = market.national.labour_market_q2_2026_advance as JsonRecord;
const earlyCareer = market.national.early_career_2025 as JsonRecord;

const artifact = {
	schema_version: '9.0',
	release: 'V9 Singapore AI Labour Observatory',
	generated_at: REVIEW_CUTOFF,
	review_cutoff: REVIEW_CUTOFF,
	headline_effect: 'none',
	claim_boundary:
		'The observatory describes task pressure, adoption and labour-market evidence at their published grain. It does not estimate occupation-level job loss, employment growth or a Jevons effect.',
	causal_model: {
		outcome_identity:
			'labour outcome = displacement + productivity and scale + new tasks + composition + adjustment',
		mechanisms: [
			{
				id: 'displacement',
				question: 'Can AI substitute for labour in tasks that workers currently perform?',
				v9_evidence: 'Detailed task pressure is available for 987 occupations.',
				status: 'partial',
				missing_for_outcome: [
					'actual deployment',
					'end-to-end substitution',
					'review and liability requirements',
					'causal hours or hiring response'
				]
			},
			{
				id: 'productivity_and_scale',
				question:
					'Do lower costs, lower prices or better quality expand demand enough to offset labour savings?',
				v9_evidence: 'National firm-adoption and self-reported productivity context is available.',
				status: 'context_only',
				missing_for_outcome: [
					'occupation-specific output',
					'price pass-through',
					'demand elasticity',
					'business-stealing adjustment'
				]
			},
			{
				id: 'new_tasks',
				question: 'Does AI create new products or tasks where people retain comparative advantage?',
				v9_evidence:
					'MOM reports aggregate creation of AI-related roles among some adopting firms.',
				status: 'context_only',
				missing_for_outcome: [
					'occupation-level new-task series',
					'new-role employment counts',
					'evidence that new work reaches displaced workers'
				]
			},
			{
				id: 'complementarity_and_human_control',
				question:
					'Does AI raise the value of human judgment, accountability, relationships or physical execution?',
				v9_evidence:
					'Mapped tasks and reviewed guidance are available; a validated occupation measure is not.',
				status: 'research_only',
				missing_for_outcome: [
					'validated Singapore occupation construct',
					'workflow-level responsibility evidence',
					'worker-level productivity and wage effects'
				]
			},
			{
				id: 'adoption_and_organisation',
				question: 'Will firms adopt the technology and redesign production around it?',
				v9_evidence: 'National, firm-size and selected sector adoption evidence is available.',
				status: 'broad_context',
				missing_for_outcome: [
					'detailed occupation adoption',
					'adoption timing linked to workers',
					'workflow and team redesign by occupation'
				]
			},
			{
				id: 'distribution_and_adjustment',
				question: 'Who gains, who bears adjustment costs and how do workers move or retrain?',
				v9_evidence: 'Broad age, sex, work-arrangement, vacancy and re-entry context is available.',
				status: 'broad_context',
				missing_for_outcome: [
					'detailed cohort outcomes',
					'job quality change',
					'occupation transitions',
					'causal training effectiveness'
				]
			}
		],
		scenario_policy:
			'No contraction, expansion, complementarity, slow-diffusion or polarisation scenario is assigned without compatible evidence on adoption, market response and labour outcomes.'
	},
	sources: {
		employment_by_occupation_group: {
			publisher: 'Singapore Ministry of Manpower / SingStat',
			title: 'Employed residents by occupation and age group',
			url: 'https://tablebuilder.singstat.gov.sg/table/TS/M182171',
			geography: 'Singapore residents',
			grain: 'broad occupation group by age and year',
			observation_period: '2000-2025',
			...sourceArtifact(FILES.employment)
		},
		worker_profile: {
			publisher: 'Singapore Ministry of Manpower',
			title: 'Labour Force in Singapore 2025, Section D',
			url: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2025.aspx',
			geography: 'Singapore residents',
			grain: 'broad occupation group and selected two-digit families',
			observation_period: '2025',
			source_artifact: sourceArtifact(FILES.workerProfileSource),
			derived_artifact: sourceArtifact(FILES.workerProfile)
		},
		industry_footprint: {
			publisher: 'Singapore Ministry of Manpower / data.gov.sg',
			title: 'Industry by occupation employment and job vacancies',
			url: 'https://data.gov.sg/datasets/d_a39781396723959b5bb0db7814bdb139/view',
			geography: 'Singapore residents and establishments, according to source table',
			grain: 'broad occupation group by industry',
			observation_period: 'employment through 2025; vacancy overlay through 2025 Q3',
			employment_artifact: sourceArtifact(FILES.industryEmploymentSource),
			vacancy_artifact: sourceArtifact(FILES.industryVacancySource),
			derived_artifact: sourceArtifact(FILES.industryContext)
		},
		current_labour_and_adoption: {
			publisher: 'Singapore Ministry of Manpower',
			title: 'V9 reviewed market context',
			url: 'https://stats.mom.gov.sg/',
			geography: 'Singapore',
			grain: 'national, selected sector, firm size and broad occupation cluster',
			observation_period: '2025 to 2026 Q2, depending on measure',
			market_artifact: sourceArtifact(FILES.market),
			labour_monitor_artifact: sourceArtifact(FILES.labourMonitor)
		}
	},
	national_context: {
		ai_adoption: adoption,
		vacancy_update: vacancyUpdate,
		labour_market_q2_advance: q2,
		early_career: earlyCareer,
		limitations: [
			'National, firm-size and sector observations cannot be assigned to a detailed occupation.',
			'Employer responses are descriptive and may overlap; they do not identify a causal AI effect.',
			'Advance quarterly figures are preliminary and use a different grain from annual detailed sources.'
		]
	},
	coverage: coverageCounts,
	group_profiles: groupProfiles,
	occupation_coverage: occupationCoverage,
	publication_gates: {
		detailed_adoption:
			'Requires occupation-linked adoption observations with a stated sampling frame and period.',
		productivity_scale:
			'Requires compatible price, quantity or revenue evidence and a demand-response design.',
		new_tasks:
			'Requires versioned occupation or task observations showing genuinely new human work.',
		job_quality:
			'Requires hours, intensity, autonomy, monitoring or contract evidence at compatible grain.',
		causal_outcomes:
			'Requires adoption timing, a defensible comparison group and outcome data at compatible grain.',
		transitions:
			'Requires observed Singapore mobility and training outcomes rather than structural similarity alone.',
		longitudinal_pressure:
			'Requires a second methodologically comparable V9 task-pressure snapshot.'
	}
};

if (coverageCounts.detailed_occupations !== occupationsRelease.counts.occupations) {
	throw new Error('Occupation coverage count does not match V9 release');
}
if (coverageCounts.pressure_ranked !== occupationsRelease.counts.scored) {
	throw new Error('Ranked coverage count does not match V9 release');
}
if (coverageCounts.direct_wage !== occupationsRelease.counts.direct_wages) {
	throw new Error('Direct-wage coverage count does not match V9 release');
}
if (
	Object.values(groupProfiles).filter(
		profile => profile.measurement_status === 'observed_broad_occupation_group'
	).length !== 8
) {
	throw new Error('Expected eight observed broad occupation-group profiles');
}
if (labourMonitor.length !== 3) throw new Error('Expected three broad labour clusters');

const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
for (const output of OUTPUTS) {
	fs.mkdirSync(path.dirname(absolute(output)), { recursive: true });
	fs.writeFileSync(absolute(output), serialized);
}

console.log(
	`Built V9 economic observatory: ${coverageCounts.detailed_occupations} occupations, 8 broad group profiles, 0 classified outcomes.`
);
