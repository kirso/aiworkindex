export type EvidenceTier =
	| 'official_local'
	| 'derived_from_official_local'
	| 'cross_country_research'
	| 'official_sg'
	| 'derived_from_official_sg'
	| 'external_proxy'
	| 'synthetic';

export type EmploymentBasis =
	| 'estimated_sg_submajor'
	| 'estimated_sg_submajor_weighted_2025'
	| 'proxy_bls_weighted';

export type SourceRegistryStatus = 'live' | 'available' | 'historical' | 'planned' | 'requested';

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
	research_keys?: string[];
	url?: string;
	notes: string;
}

export const evidenceTierLabels: Record<EvidenceTier, string> = {
	official_local: 'Official local',
	derived_from_official_local: 'Derived from official local',
	cross_country_research: 'Cross-country research',
	official_sg: 'Official local',
	derived_from_official_sg: 'Derived from official local',
	external_proxy: 'External proxy',
	synthetic: 'Synthetic'
};

export const sourceRegistryStatusLabels: Record<SourceRegistryStatus, string> = {
	live: 'Live',
	available: 'Available',
	historical: 'Historical',
	planned: 'Planned',
	requested: 'Requested'
};

export const employmentBasisLabels: Record<EmploymentBasis, string> = {
	estimated_sg_submajor: 'Est. local sub-major allocation',
	estimated_sg_submajor_weighted_2025: 'Est. local sub-major weighted allocation (2025)',
	proxy_bls_weighted: 'BLS-weighted proxy'
};

export const occupationDataBasisTemplate: OccupationDataBasis = {
	employment_estimate: {
		basis: 'estimated_sg_submajor_weighted_2025',
		tier: 'derived_from_official_sg',
		source_key: 'mom_lfr2025_table_d8',
		note:
			'Estimated per-occupation employment derived from published Labour Force 2025 2-digit occupation-family totals, weighted within each family by proxy employment and local wage information. Official detailed occupation counts are not publicly published, so this remains an estimate.'
	},
	wage_pool_proxy: {
		basis: 'proxy_bls_weighted',
		tier: 'external_proxy',
		source_key: 'bls_projections_2024_2034',
		note:
			'Group totals reweighted by matched US BLS detailed occupation shares for wage-pool analysis.'
	},
	education: {
		tier: 'external_proxy',
		source_key: 'onet_job_zones',
		note: 'Education label derived from O*NET Job Zones through the country crosswalk to ISCO-08.'
	},
	sg_context: {
		pwm_covered: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_policy_pwm_mapping',
			note: 'Rule-based mapping to published local wage-floor coverage.'
		},
		licensed_profession: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_policy_licensing_mapping',
			note: 'Rule-based mapping to published local professional licensing regimes.'
		},
		foreign_worker_dependency: {
			tier: 'derived_from_official_sg',
			source_key: 'sg_labour_foreign_worker_mapping',
			note:
				'Major-group heuristic anchored to published local labour-force structure and manpower policy.'
		},
		skillsfuture_eligible: {
			tier: 'derived_from_official_sg',
			source_key: 'skillsfuture_transition_mapping',
			note: 'Major-group mapping to published local transition-program coverage.'
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
		key: 'mom_lfr2025_table_d8',
		label: 'MOM Labour Force 2025 Table D8',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: ['sub-major employment totals', 'estimated occupation employment basis', 'family delta validation'],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2025.aspx',
		notes:
			'Published 2-digit occupation-family employment totals used to weight and validate the 2025 occupation employment estimator.'
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
		notes:
			'Used to build occupation-specific industry-footprint signals that now inform the employment side of market momentum where coverage exists, and also power supporting Singapore context views.'
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
		key: 'mom_lfr2025_section_d',
		label: 'MOM Labour Force 2025 Section D',
		tier: 'official_sg',
		status: 'live',
		vintage: '2025',
		used_for: [
			'worker profile context',
			'detailed gender anchors',
			'family delta context',
			'industry workforce context',
			'industry occupation mix context',
			'experimental demand fragility overlay'
		],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2025.aspx',
		notes:
			'Broad occupation-group composition, detailed family totals, cluster cross-tabs, and industry workforce profiles used for context, validation, and experimental overlays rather than direct structural score multipliers.'
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
		key: 'bls_occupational_projections_2024_2034',
		label: 'US BLS Occupational Projections 2024-2034',
		tier: 'official_local',
		status: 'live',
		vintage: '2024-2034',
		used_for: ['US demand resilience', 'US employment outlook', 'US wage context'],
		url: 'https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm',
		notes:
			'Primary US country-layer demand source used to derive the local outlook, openings, and wage context for the US index.'
	},
	{
		key: 'bls_cps_employment_2025',
		label: 'US BLS CPS Employment 2025',
		tier: 'official_local',
		status: 'live',
		vintage: '2025',
		used_for: ['US current employment context', 'US calibration'],
		url: 'https://www.bls.gov/cps/',
		notes:
			'Supplementary US employment context used for calibration and for validating the projections-derived demand layer.'
	},
	{
		key: 'bls_oews_2025',
		label: 'US BLS OEWS',
		tier: 'official_local',
		status: 'available',
		vintage: '2025',
		used_for: ['US wage context', 'US wage distribution', 'occupational pay calibration'],
		url: 'https://www.bls.gov/oes/',
		notes:
			'Occupation-level wage and employment series used for the US country layer when wage context is rendered.'
	},
	{
		key: 'bls_ors_2025',
		label: 'US BLS Occupational Requirements Survey',
		tier: 'official_local',
		status: 'available',
		vintage: '2025',
		used_for: ['US transition capacity', 'US work-context friction', 'US bottleneck calibration'],
		url: 'https://www.bls.gov/ors/about-overview.htm',
		notes:
			'Official requirements survey covering physical demands, cognitive demands, and vocational prep. Best available US analogue for bottleneck and transition-friction context.'
	},
	{
		key: 'bls_cps_demographics_2025',
		label: 'US BLS CPS Demographics by Occupation',
		tier: 'official_local',
		status: 'available',
		vintage: '2025',
		used_for: ['US worker profile', 'US demographic context', 'equity and transition framing'],
		url: 'https://www.bls.gov/cps/cpsoccind.htm',
		notes:
			'Demographic occupation tables from CPS used to explain who is exposed and where transition needs may differ.'
	},
	{
		key: 'bls_skills_data_2025',
		label: 'US BLS Skills Data',
		tier: 'official_local',
		status: 'available',
		vintage: '2025',
		used_for: ['US skills context', 'US task and skill explanation'],
		url: 'https://www.bls.gov/emp/data/skills-data.htm',
		notes:
			'Official 17-skill summary built on O*NET and used as a structured skill overlay for the US country layer.'
	},
	{
		key: 'bls_ooh_2025',
		label: 'US Occupational Outlook Handbook',
		tier: 'official_local',
		status: 'available',
		vintage: '2025',
		used_for: ['US narrative context', 'career guidance', 'work-environment copy'],
		url: 'https://www.bls.gov/ooh/occupation-finder.htm',
		notes:
			'Occupation profiles used for work-environment and route-to-job narrative on the US occupation pages.'
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
		vintage: 'through 2026 Q1',
		used_for: ['labour monitor', 'quarterly context', 'cluster vacancy rates'],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report.aspx',
		notes: 'Cluster-level labour evidence layer, not occupation-level outcomes.'
	},
	{
		key: 'mom_labour_market_report_q1_2026',
		label: 'MOM Labour Market Report Q1 2026',
		tier: 'official_sg',
		status: 'live',
		vintage: '2026 Q1',
		used_for: [
			'current labour monitor enrichment',
			'vacancy and hiring context',
			'retrenchment incidence context',
			're-entry context',
			'macro labour context'
		],
		url: 'https://stats.mom.gov.sg/Pages/Labour-Market-Report-1Q-2026.aspx',
		notes:
			'Latest full official labour-market report used for current cluster and macro context. These broad cluster figures are not detailed SSOC outcomes.'
	},
	{
		key: 'mom_labour_market_report_q4_2025',
		label: 'MOM Labour Market Report Q4 2025',
		tier: 'official_sg',
		status: 'historical',
		vintage: '2025 Q4',
		used_for: [
			'historical labour monitor enrichment',
			'Q4 2025 validation baseline',
			'recruitment and resignation context',
			'retrenchment incidence context',
			'forecast-readiness audit trail'
		],
		url: 'https://www.mom.gov.sg/newsroom/press-releases/2026/0320-labour-market-4q-2025',
		notes:
			'Historical Q4 2025 release retained because the latest completed cluster backtest uses that period. It is no longer presented as the current monitor.'
	},
		{
			key: 'job_vacancies_industry_occupation',
			label: 'Job Vacancies by Industry and Occupation',
			tier: 'official_sg',
			status: 'live',
			vintage: '2025',
			used_for: ['industry context vacancy overlay', 'cluster vacancy counts'],
			url: 'https://data.gov.sg/datasets?resultId=d_86dffa3d28e4c3ee085c3f99abad6e9f&sort=updatedAt',
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
			url: 'https://data.gov.sg/datasets?resultId=d_1e10046c33418c507bb2483c26dca489&sort=updatedAt',
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
			url: 'https://data.gov.sg/datasets?resultId=d_86dffa3d28e4c3ee085c3f99abad6e9f&sort=updatedAt',
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
			key: 'mom_median_income_by_occupation',
			label: 'Median Gross Monthly Income by Occupation and Sex',
			tier: 'official_sg',
			status: 'live',
			vintage: '2023',
			used_for: ['wage movement source candidate', 'raw data audit'],
			url: 'https://data.gov.sg/datasets/d_8f024ddf2553d81ee00ede55b1d9b0ff/view',
			notes:
				'Official annual broad occupation-group, sex-specific income series. Transformed into separate nominal and CPI-adjusted wage movement context; male and female medians are not averaged.'
		},
		{
			key: 'singstat_all_items_cpi_monthly',
			label: 'Singapore All Items Consumer Price Index, Monthly',
			tier: 'official_sg',
			status: 'live',
			vintage: 'through 2026 May',
			used_for: ['real wage movement deflator'],
			url: 'https://data.gov.sg/collections/1630/view',
			notes: 'Annual-average All Items CPI deflates the broad-group income series. It is not a score input.'
		},
		{
			key: 'mom_job_vacancies_2025_report',
			label: 'MOM Job Vacancies 2025',
			tier: 'official_sg',
			status: 'live',
			vintage: 'December 2025',
			used_for: ['entry-level hiring context', 'experience requirements', 'hard-to-fill jobs'],
			url: 'https://stats.mom.gov.sg/Pages/Job-Vacancies-2025.aspx',
			notes: 'Annual vacancy-composition context. Industry and named-job results are not detailed occupation outcomes.'
		},
		{
			key: 'mom_labour_force_2025_job_quality',
			label: 'Labour Force in Singapore 2025',
			tier: 'official_sg',
			status: 'live',
			vintage: '2025',
			used_for: ['underemployment context', 'employment type', 'youth unemployment history'],
			url: 'https://stats.mom.gov.sg/iMAS_PdfLibrary/mrsd-labour-force-in-singapore-advance-release-2025.pdf',
			notes: 'Broad-group and PMET/non-PMET context only; not a detailed occupation outcome or an AI effect.'
		},
		{
			key: 'sg_postings_monitor',
			label: 'Singapore postings monitor',
			tier: 'external_proxy',
			status: 'live',
			vintage: '2026',
			used_for: ['postings volume proxy', 'AI-skill share candidate', 'occupation and role context'],
			url: 'https://www.mycareersfuture.gov.sg/',
			notes:
				'Observed postings proxy built from MyCareersFuture and employer ATS snapshots. Useful for timeliness, but not official labour-market statistics.'
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
			key: 'imda_sgde_2025',
			label: 'IMDA Singapore Digital Economy Report 2025',
			tier: 'official_sg',
			status: 'live',
			vintage: '2025',
			used_for: ['AI in Singapore context', 'reports', 'national AI adoption framing'],
			url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2025/singapore-digital-economy',
			notes:
				'Official Singapore national AI-adoption, worker-usage, and tech-workforce context. Used for reports and context, not occupation-level score multipliers.'
		},
		{
			key: 'mom_ai_adoption_2026',
			label: 'MOM AI Adoption Among Firms',
			tier: 'official_sg',
			status: 'live',
			vintage: '2026',
			used_for: ['AI in Singapore context', 'near-term adoption context', 'forecast-readiness gating'],
			url: 'https://www.mom.gov.sg/newsroom/press-releases/2026/0430-adoption-of-ai-among-firms',
			notes:
				'Official firm-size and sector AI adoption release. Used as adoption context only; not mapped into detailed occupation score multipliers.'
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
		research_keys: ['felten_raj_seamans_2021'],
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
		research_keys: ['pizzinelli_etal_2023'],
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
		research_keys: ['anthropic_economic_index_2026'],
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
		research_keys: ['eloundou_etal_2023', 'openai_gpts_are_gpts_2023'],
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
		research_keys: ['ilo_genai_exposure_2025'],
		url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
		notes: 'ISCO-aligned exposure source.'
	},
	{
		key: 'onet_occupation_data',
		label: 'O*NET Occupation Data',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['task and technology enrichment context'],
		research_keys: ['onet_database_2024'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used only for contextual task and technology enrichment on detail pages, not as a structural score input.'
	},
	{
		key: 'onet_task_statements',
		label: 'O*NET Task Statements',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['task primitive matching', 'task enrichment context'],
		research_keys: ['onet_database_2024'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used to match normalized task portfolios into the V7 task-primitive layer and to support contextual task enrichment.'
	},
	{
		key: 'onet_task_ratings',
		label: 'O*NET Task Ratings',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['task primitive weighting'],
		research_keys: ['onet_database_2024'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used for importance/frequency task weights inside V7 task primitives where task matching coverage is strong enough.'
	},
	{
		key: 'anthropic_task_penetration_2026',
		label: 'Anthropic task penetration',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['task primitive penetration', 'V7 task signal'],
		research_keys: ['anthropic_economic_index_2026'],
		url: 'https://www.anthropic.com/research/anthropic-economic-index-january-2026-report',
		notes:
			'Observed task-level AI penetration source used to compute V7 task effective coverage and exposure concentration.'
	},
	{
		key: 'onet_technology_skills',
		label: 'O*NET Technology Skills',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['task and technology enrichment context'],
		research_keys: ['onet_database_2024'],
		url: 'https://www.onetcenter.org/database.html',
		notes:
			'Used only for contextual technology-skill enrichment on detail pages, not as a structural score input.'
	},
	{
		key: 'onet_job_zones',
		label: 'O*NET Job Zones',
		tier: 'external_proxy',
		status: 'live',
		vintage: '2026',
		used_for: ['education label proxy'],
		research_keys: ['onet_database_2024'],
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
		research_keys: ['bls_occupational_projections_2024_2034'],
		url: 'https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm',
		notes: 'Used as a proportional proxy and convergent check, not as Singapore outcome truth.'
	},
	{
		key: 'sg_policy_pwm_mapping',
		label: 'Local wage-floor mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['local context'],
		url: 'https://www.mom.gov.sg/employment-practices/progressive-wage-model',
		notes: 'Rule-based mapping to published local wage-floor coverage.'
	},
	{
		key: 'sg_policy_licensing_mapping',
		label: 'Local licensing mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['local context'],
		notes: 'Rule-based mapping to major professional licensing regimes.'
	},
	{
		key: 'sg_labour_foreign_worker_mapping',
		label: 'Labour-dependency mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['local context'],
		notes: 'Major-group heuristic based on published local labour-force and manpower structure.'
	},
	{
		key: 'skillsfuture_transition_mapping',
		label: 'Transition-program mapping',
		tier: 'derived_from_official_sg',
		status: 'live',
		vintage: '2026',
		used_for: ['local context'],
		url: 'https://www.skillsfuture.gov.sg/careertransition',
		notes: 'Major-group mapping to published transition-program coverage.'
	}
];
