export type EvidenceTier =
	| 'official_sg'
	| 'derived_from_official_sg'
	| 'external_proxy'
	| 'synthetic';

export type EmploymentBasis = 'estimated_sg_submajor' | 'proxy_bls_weighted';

export type SourceRegistryStatus = 'live' | 'available' | 'planned' | 'requested';

export interface EvidenceDescriptor {
	tier: EvidenceTier;
	source_key: string;
	note: string;
}

export interface BasisDescriptor extends EvidenceDescriptor {
	basis: EmploymentBasis;
}

export interface OccupationDataBasis {
	employment_estimate: BasisDescriptor;
	wage_pool_proxy: BasisDescriptor;
	education: EvidenceDescriptor;
	sg_context: {
		pwm_covered: EvidenceDescriptor;
		licensed_profession: EvidenceDescriptor;
		foreign_worker_dependency: EvidenceDescriptor;
		skillsfuture_eligible: EvidenceDescriptor;
	};
}

export interface SourceRegistryEntry {
	key: string;
	label: string;
	tier: EvidenceTier;
	status: SourceRegistryStatus;
	vintage: string;
	used_for: string[];
	url?: string;
	notes: string;
}

export const evidenceTierLabels: Record<EvidenceTier, string> = {
	official_sg: 'Official SG',
	derived_from_official_sg: 'Derived from official SG',
	external_proxy: 'External proxy',
	synthetic: 'Synthetic'
};

export const sourceRegistryStatusLabels: Record<SourceRegistryStatus, string> = {
	live: 'Live',
	available: 'Available',
	planned: 'Planned',
	requested: 'Requested'
};

export const employmentBasisLabels: Record<EmploymentBasis, string> = {
	estimated_sg_submajor: 'Est. SG sub-major allocation',
	proxy_bls_weighted: 'BLS-weighted proxy'
};

export const occupationDataBasisTemplate: OccupationDataBasis = {
	employment_estimate: {
		basis: 'estimated_sg_submajor',
		tier: 'derived_from_official_sg',
		source_key: 'mom_lfr2024_table_d8',
		note:
			'Estimated per-occupation employment derived from published Labour Force 2024 sub-major SSOC totals. Official detailed SSOC occupation counts are not publicly published, so this remains an estimate.'
	},
	wage_pool_proxy: {
		basis: 'proxy_bls_weighted',
		tier: 'external_proxy',
		source_key: 'bls_projections_2024_2034',
		note:
			'Singapore group totals reweighted by matched US BLS detailed occupation shares for wage-pool analysis.'
	},
	education: {
		tier: 'external_proxy',
		source_key: 'onet_job_zones',
		note: 'Education label derived from O*NET Job Zones through the SSOC to SOC crosswalk.'
	},
	sg_context: {
		pwm_covered: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_policy_pwm_mapping',
			note: 'Rule-based SSOC mapping to published Progressive Wage Model sectors.'
		},
		licensed_profession: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_policy_licensing_mapping',
			note: 'Rule-based SSOC mapping to published Singapore professional licensing regimes.'
		},
		foreign_worker_dependency: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_labour_foreign_worker_mapping',
			note:
				'Major-group heuristic anchored to published Singapore labour-force structure and manpower policy.'
		},
		skillsfuture_eligible: {
			tier: 'derived_from_official_sg',
			source_key: 'skillsfuture_transition_mapping',
			note: 'Major-group mapping to published SkillsFuture / career transition programme coverage.'
		}
	}
};

export const dataSourceRegistry: SourceRegistryEntry[] = [
	{
		key: 'mom_ows_2024',
		label: 'MOM Occupational Wage Survey 2024',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['median wages', 'wage quartiles'],
		url: 'https://stats.mom.gov.sg/Pages/Occupational-Wages-Tables2024.aspx',
		notes: 'Primary Singapore wage input at detailed occupation level.'
	},
	{
		key: 'mom_detailed_ssoc_employment_request',
		label: 'MOM / SingStat Detailed SSOC Employment Counts',
		tier: 'official_sg',
		status: 'requested',
		vintage: 'not publicly released',
		used_for: ['official detailed occupation employment'],
		notes:
			'Requested from Singapore agencies because detailed 4-digit / 5-digit SSOC employment counts are not publicly released. Until granted, the live model uses published sub-major totals plus proxy logic.'
	},
	{
		key: 'mom_lfr2024_table_d8',
		label: 'MOM Labour Force 2024 Table D8',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['sub-major employment totals', 'estimated occupation employment basis'],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2024.aspx',
		notes: 'Published sub-major SSOC employment totals used to form occupation-level estimates.'
	},
	{
		key: 'mom_employment_by_occupation_group',
		label: 'MOM Employment by Occupation Group',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['major-group market momentum'],
		url: 'https://data.gov.sg/datasets/d_1d7ab908d16d7b9ddf6f2c2985894119/view',
		notes: 'Published broad occupation employment series.'
	},
	{
		key: 'mom_industry_x_occupation',
		label: 'MOM Industry × Occupation',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['industry momentum spread', 'Singapore context support', 'industry footprint'],
		url: 'https://data.gov.sg/datasets/d_a39781396723959b5bb0db7814bdb139/view',
		notes: 'Currently used for industry momentum context, not a direct occupation-level score input.'
	},
	{
		key: 'mom_lfr2024_section_d',
		label: 'MOM Labour Force 2024 Section D',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['worker profile context', 'detailed gender anchors', 'estimated employment basis'],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2024.aspx',
		notes:
			'Broad occupation-group worker composition and 2-digit occupation-family gender anchors used as Singapore context, not as score multipliers.'
	},
	{
		key: 'singstat_planning_area_residence_by_occupation',
		label: 'SingStat Planning Area of Residence by Occupation',
		tier: 'official_sg',
		status: 'live',
		vintage: '2020',
		used_for: ['geography context', 'planning-area concentration'],
		url: 'https://data.gov.sg/datasets/d_63449f74c83eb941f87c2172f08d299c/view',
		notes:
			'Official Census 2020 geography table used for broad occupation-group residence concentration. Context only; not a score input.'
	},
	{
		key: 'singstat_travel_time_by_occupation',
		label: 'SingStat Travel Time to Work by Occupation',
		tier: 'official_sg',
		status: 'live',
		vintage: '2020',
		used_for: ['geography context', 'commute burden context'],
		url: 'https://data.gov.sg/datasets/d_0888806f369c8527e969a5f6f8528d1c/view',
		notes:
			'Official Census 2020 travel-time table used to summarize commute burden by broad occupation group. Context only; not a score input.'
	},
	{
		key: 'mom_jobs_in_demand_2025',
		label: 'MOM Jobs in Demand 2025',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['demand signal', 'market resilience bonus'],
		notes: 'Official Singapore demand signal list.'
	},
	{
		key: 'mom_sol_2026',
		label: 'MOM Shortage Occupation List 2026',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['demand signal', 'market resilience bonus'],
		notes: 'Official Singapore shortage signal.'
	},
	{
		key: 'mom_labour_monitor_2025',
		label: 'MOM Labour Market Reports / monitor series',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['labour monitor', 'quarterly context', 'cluster vacancy rates'],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report.aspx',
		notes: 'Cluster-level labour evidence layer, not occupation-level outcomes.'
	},
	{
		key: 'job_vacancies_industry_occupation',
		label: 'Job Vacancies by Industry and Occupation',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['industry context vacancy overlay', 'cluster vacancy counts'],
		notes:
			'Used as an industry-level context overlay and to attach published cluster vacancy counts; not treated as occupation-level vacancy truth.'
	},
	{
		key: 'mom_job_vacancy_rates',
		label: 'MOM Job Vacancy Rates by Occupation Group',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['labour monitor', 'vacancy validation'],
		notes:
			'Official vacancy-rate series used in the live labour monitor and temporal validation.'
	},
	{
		key: 'mom_job_vacancy_counts',
		label: 'MOM Job Vacancy Counts',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['labour monitor', 'vacancy validation'],
		notes:
			'Official vacancy-count series used in the live labour monitor and temporal validation.'
	},
	{
		key: 'mom_recruitment_resignation_rates',
		label: 'MOM Recruitment and Resignation Rates',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['labour monitor hiring signal'],
		url: 'https://data.gov.sg/collections/682/datasets/d_236436f8bdb9bbac677c4e5637c6430e/view',
		notes:
			'Official annual average monthly recruitment and resignation rates by industry and occupational group. The raw API payload is downloaded into the repo; the published labour monitor still prefers current-quarter MOM enrichment snapshots when available.'
	},
	{
		key: 'mom_retrenchment_by_occupation_group',
		label: 'MOM / SingStat Retrenchment by Occupation Group',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['labour monitor retrenchment signal'],
		url: 'https://data.gov.sg/datasets?resultId=d_3eaf52cdcc405a80b602d031d0bd092b&sort=updatedAt',
		notes:
			'Official quarterly retrenched-employees counts by broad occupational group. The raw API payload is downloaded into the repo and merged with published incidence context from the MOM labour-market snapshot.'
	},
	{
		key: 'singstat_unemployment_rate_quarterly',
		label: 'SingStat Unemployment Rate, Quarterly, Seasonally Adjusted',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['macro context', 'unemployment context'],
		url: 'https://data.gov.sg/datasets/d_b816a930bca0eb19fdf20fcbfcdd4c39/view',
		notes:
			'Official quarterly unemployment series used for macro labour context. Published separately from the structural score.'
	},
	{
		key: 'mom_job_vacancy_to_unemployed_ratio',
		label: 'MOM Job Vacancy to Unemployed Person Ratio',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['macro context', 'labour tightness context'],
		url: 'https://data.gov.sg/datasets/d_6530db8211d9538872eb7b1f5dd366d0/view',
		notes:
			'Official annual labour-tightness ratio used as macro context around the score. It is not treated as an occupation-level input.'
	},
	{
		key: 'wsg_jobs_transformation_maps',
		label: 'Workforce Singapore Jobs Transformation Maps',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['transition infrastructure', 'transition-support context'],
		url: 'https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps',
		notes:
			'Official sector job-redesign and skills-transition overview. Used as published transition-infrastructure context, not as an occupation-level score input.'
	},
	{
		key: 'skillsfuture_wsq_trainees',
		label: 'SkillsFuture WSQ Trainees by Statement Attainment',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['transition infrastructure'],
		url: 'https://data.gov.sg/datasets?resultId=d_711ea9c032baf00470246b09499b65c9&sort=updatedAt',
		notes:
			'Official annual training-system activity used to anchor the scale of Singapore transition infrastructure. Not treated as occupation-level transition evidence.'
	},
	{
		key: 'skillsfuture_career_transition_programme',
		label: 'SkillsFuture Career Transition Programme',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['transition infrastructure', 'transition-support context'],
		url: 'https://www.skillsfuture.gov.sg/careertransition',
		notes:
			'Official programme directory used as public transition-infrastructure context. Mappings to occupations remain broad-family anchors.'
	},
	{
		key: 'wsg_career_conversion_programmes',
		label: 'Workforce Singapore Career Conversion Programmes',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['transition infrastructure', 'transition-support context'],
		url: 'https://www.wsg.gov.sg/home/individuals/attachment-placement-programmes/career-conversion-programmes-for-individuals',
		notes:
			'Official reskilling programme directory used as transition-infrastructure context, not as observed worker-mobility data.'
	},
	{
		key: 'wsg_careersfinder',
		label: 'Workforce Singapore CareersFinder',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['transition infrastructure', 'transition-support context'],
		url: 'https://www.wsg.gov.sg/home/media-room/media-releases-speeches/factsheet-on-careersfinder',
		notes:
			'Official career-navigation tool reference used as transition-support context.'
	},
	{
		key: 'wages_by_industry',
		label: 'Wages by Industry',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['sector wage anchors', 'industry context support'],
		notes:
			'Published common-occupation wage tables by industry, used as contextual sector wage anchors rather than score inputs.'
	},
	{
		key: 'wages_by_sex',
		label: 'Wages by Sex',
		tier: 'official_sg',
		status: 'live',
		vintage: '2024',
		used_for: ['worker-profile wage context'],
		notes: 'Published male/female wage medians for common occupations, shown as contextual evidence only.'
	},
	{
		key: 'imda_digital_economy_2025',
		label: 'IMDA Singapore Digital Economy Report 2025',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['AI in Singapore context', 'reports', 'national AI adoption framing'],
		url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2024/ar-sgde-2024',
		notes:
			'Official Singapore national AI-adoption, worker-usage, and tech-workforce context. Used for reports and context, not occupation-level score multipliers.'
	},
	{
		key: 'imda_sgde_2025',
		label: 'IMDA Singapore Digital Economy Report 2025',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['AI in Singapore context', 'reports', 'national AI adoption framing'],
		url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2024/ar-sgde-2024',
		notes:
			'Official Singapore national AI-adoption, worker-usage, and tech-workforce context. Used for reports and context, not occupation-level score multipliers.'
	},
	{
		key: 'imda_naiip_2026',
		label: 'IMDA National AI Impact Programme',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['AI in Singapore context', 'national programme framing'],
		url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/factsheets/2026/national-ai-impact-programme',
		notes:
			'Official Singapore programme targets for enterprise AI adoption and AI-bilingual workers.'
	},
	{
		key: 'mom_soi_2025',
		label: 'MOM Singapore Opportunity Index',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['AI in Singapore context', 'employer-quality context', 'career mobility framing'],
		url: 'https://www.mom.gov.sg/newsroom/press-releases/2025/1014-launch-of-soi',
		notes:
			'Official employer-quality and career-opportunity context from MOM. Used as labour-market context, not as a structural score input.'
	},
	{
		key: 'aioe_2021',
		label: 'Felten AIOE',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2021',
		used_for: ['exposure ensemble'],
		url: 'https://www.researchgate.net/publication/352489489_Occupational_industry_and_geographic_exposure_to_artificial_intelligence_A_novel_dataset_and_its_potential_uses',
		notes: 'Published research baseline for AI exposure.'
	},
	{
		key: 'pizzinelli_theta_2023',
		label: 'Pizzinelli et al. theta',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2023',
		used_for: ['human bottleneck'],
		url: 'https://www.imf.org/en/Publications/WP/Issues/2023/01/13/Robotizing-Tasks-The-Impact-of-Technologies-on-Labor-Demand-527513',
		notes: 'IMF working-paper complementarity / bottleneck measure.'
	},
	{
		key: 'anthropic_economic_index_2026',
		label: 'Anthropic Economic Index',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026-01',
		used_for: ['exposure ensemble', 'observed usage gap'],
		url: 'https://www.anthropic.com/research/anthropic-economic-index-january-2026-report',
		notes: 'Observed Claude usage mapped into the exposure ensemble.'
	},
	{
		key: 'eloundou_gpt_exposure_2023',
		label: 'Eloundou GPT Exposure',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2023',
		used_for: ['exposure ensemble'],
		url: 'https://arxiv.org/abs/2303.10130',
		notes: 'LLM-oriented exposure source.'
	},
	{
		key: 'ilo_genai_2025',
		label: 'ILO Generative AI Exposure Index',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2025',
		used_for: ['exposure ensemble'],
		url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
		notes: 'ISCO-aligned exposure source.'
	},
	{
		key: 'onet_occupation_data',
		label: 'O*NET Occupation Data',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2024',
		used_for: ['task and technology enrichment context'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used only for contextual task and technology enrichment on detail pages, not as a structural score input.'
	},
	{
		key: 'onet_task_statements',
		label: 'O*NET Task Statements',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2024',
		used_for: ['task and technology enrichment context'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used only for contextual task enrichment on detail pages, not as a structural score input.'
	},
	{
		key: 'onet_technology_skills',
		label: 'O*NET Technology Skills',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2024',
		used_for: ['task and technology enrichment context'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used only for contextual technology-skill enrichment on detail pages, not as a structural score input.'
	},
	{
		key: 'onet_job_zones',
		label: 'O*NET Job Zones',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2024',
		used_for: ['education label proxy'],
		url: 'https://www.onetcenter.org/database.html',
		notes: 'Used only for the displayed education proxy, not the structural score.'
	},
	{
		key: 'bls_projections_2024_2034',
		label: 'US BLS Occupational Projections 2024-2034',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2024-2034',
		used_for: ['employment proxy', 'convergent cross-check'],
		url: 'https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm',
		notes: 'Used as a proportional proxy and convergent check, not as Singapore outcome truth.'
	},
	{
		key: 'sg_policy_pwm_mapping',
		label: 'Progressive Wage Model mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['Singapore context'],
		url: 'https://www.mom.gov.sg/employment-practices/progressive-wage-model',
		notes: 'Rule-based SSOC mapping to published PWM-covered sectors.'
	},
	{
		key: 'sg_policy_licensing_mapping',
		label: 'Singapore licensing mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['Singapore context'],
		notes: 'Rule-based SSOC mapping to major professional licensing regimes.'
	},
	{
		key: 'sg_labour_foreign_worker_mapping',
		label: 'Foreign-worker dependency mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['Singapore context'],
		notes: 'Major-group heuristic based on published Singapore labour-force and manpower structure.'
	},
	{
		key: 'skillsfuture_transition_mapping',
		label: 'SkillsFuture transition mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['Singapore context'],
		url: 'https://www.skillsfuture.gov.sg/careertransition',
		notes: 'Major-group mapping to published transition-program coverage.'
	}
];
