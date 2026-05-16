<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';
	import {
		dataSourceRegistry,
		evidenceTierLabels,
		employmentBasisLabels,
		sourceRegistryStatusLabels
	} from '$lib/data/data-contract';
	import { experimentalStatusLabel } from '$lib/data/experimental-status-display';
	import releaseManifest from '$lib/data/release-manifest.json';
	import researchLibrary from '$lib/data/research-library.json';
	import forecastReadinessData from '$lib/data/forecast-readiness.json';
	import { releases, siteStatus } from '$lib/data/site-status';
	import rawDataAudit from '$lib/data/raw-data-audit.json';
	import Seo from '$lib/components/ui/Seo.svelte';

	const dataSourceCount = dataSourceRegistry.length;
	const structuralReleases = releases.filter(release => release.type === 'structural_release');
	const currentVersionTag = DATA_VINTAGE.model_version.toLowerCase().replaceAll('.', '');
	const datasetIdentifier = `${SITE.url}/data#${currentVersionTag}`;
	const datasetCitation = `${SITE.name}. ${DATA_VINTAGE.model_version} structural AI pressure dataset. ${DATA_VINTAGE.last_updated}. ${SITE.url}/data`;
	const dataDownloads = [
		{
			file: `sg-ai-occupations-${currentVersionTag}.csv`,
			name: 'AI Work Index occupation scores CSV',
			encodingFormat: 'text/csv'
		},
		{
			file: `sg-ai-occupations-${currentVersionTag}.json`,
			name: 'AI Work Index occupation scores JSON',
			encodingFormat: 'application/json'
		},
		{
			file: `claims-matrix-${currentVersionTag}.json`,
			name: 'AI Work Index claims matrix',
			encodingFormat: 'application/json'
		},
		{
			file: 'public-field-source-map.json',
			name: 'AI Work Index field source map',
			encodingFormat: 'application/json'
		}
	] as const;

	const datasetJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'AI Work Index — Structural Scores and Country Bundles',
		description: `${DATA_VINTAGE.occupation_count} occupations scored for structural AI pressure using the live ${DATA_VINTAGE.model_version} release: deterministic 4-source exposure ensemble, human bottleneck, displacement pressure, demand resilience, and country-specific reference-market context.`,
		identifier: datasetIdentifier,
		url: SITE.url + '/data',
		license: 'https://opensource.org/licenses/MIT',
		creator: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		version: DATA_VINTAGE.model_version,
		datePublished: DATA_VINTAGE.last_updated,
		dateModified: DATA_VINTAGE.last_updated,
		isAccessibleForFree: true,
		keywords: [
			'AI job exposure',
			'occupation risk',
			'future of work',
			'Singapore wages',
			'labour market data',
			'programmatic SEO dataset'
		],
		citation: datasetCitation,
		measurementTechnique:
			'Deterministic four-source exposure ensemble with human bottleneck, demand resilience, uncertainty, and country-context overlays.',
		spatialCoverage: { '@type': 'Place', name: 'Singapore (fully scored), United States (ready), global baseline' },
		variableMeasured: [
			'AI exposure ensemble',
			'Human bottleneck (theta)',
			'Net displacement risk',
			'Augmentation potential',
			'Market resilience'
		],
		distribution: dataDownloads.map(download => ({
			'@type': 'DataDownload',
			name: download.name,
			contentUrl: `${SITE.url}/data/${download.file}`,
			encodingFormat: download.encodingFormat
		}))
	})}<\/script>`;

	const evidenceTiers = [
		{
			key: 'official_local',
			description: 'Direct local government or official-statistics data published at the level shown on the site.'
		},
		{
			key: 'derived_from_official_local',
			description: 'Rule-based or aggregated fields anchored to official local data or published policy scope.'
		},
		{
			key: 'cross_country_research',
			description: 'Peer-reviewed or multi-country research inputs used for the structural baseline or calibration.'
		},
		{
			key: 'external_proxy',
			description: 'Non-local research or external data used as an exposure input, proxy, or cross-check.'
		},
		{
			key: 'synthetic',
			description: 'Estimated role constructs or illustrative outputs that do not map one-to-one to official occupations.'
		}
	] as const;

	const fields = [
		{
			name: 'ssoc',
			type: 'string',
			description: '[Singapore] Singapore Standard Occupational Classification code (5-digit detail code).'
		},
		{ name: 'title', type: 'string', description: 'Occupation title from the national classification (MOM for Singapore).' },
		{
			name: 'major_group',
			type: 'string',
			description: 'Major occupational group key (for example professionals or managers).'
		},
		{
			name: 'gross_wage_median',
			type: 'number',
			description: 'Median gross monthly wage in local currency from MOM 2024 (Singapore).'
		},
		{
			name: 'gross_wage_25th',
			type: 'number',
			description: '25th percentile gross monthly wage in local currency.'
		},
		{
			name: 'gross_wage_75th',
			type: 'number',
			description: '75th percentile gross monthly wage in local currency.'
		},
		{
			name: 'employment_thousands',
			type: 'number',
			description:
				'Legacy compatibility alias for estimated_sg_employment_thousands. Derived from published Labour Force 2025 2-digit occupation-family totals and weighted within each family. Not an official occupation headcount.'
		},
		{
			name: 'estimated_sg_employment_thousands',
			type: 'number',
			description:
				'[Singapore only] Est. Singapore employment for this occupation, derived from published Labour Force 2025 2-digit occupation-family totals and weighted within each family using BLS proxy employment plus Singapore wage information. Not an official occupation headcount.'
		},
		{
			name: 'employment_basis',
			type: 'enum',
			description: `Basis label for estimated_sg_employment_thousands. Current live basis: ${employmentBasisLabels.estimated_sg_submajor_weighted_2025}.`
		},
		{
			name: 'employment_family_code',
			type: 'string',
			description: '2-digit Labour Force occupation-family code used as the official anchor for the employment estimate.'
		},
		{
			name: 'employment_family_total_thousands',
			type: 'number',
			description: 'Official Labour Force 2025 total for the 2-digit occupation family that this occupation belongs to.'
		},
		{
			name: 'employment_weight_within_family',
			type: 'number',
			description: 'Normalized weight used to allocate the family total down to this occupation.'
		},
		{
			name: 'employment_estimate_method',
			type: 'enum',
			description: 'Allocation method used within the family: bls_wage_blend, bls_only, wage_only, or equal_fallback.'
		},
		{
			name: 'bls_proxy_employment',
			type: 'number',
			description:
				'BLS-weighted proxy employment used for wage-pool analysis. This is not an official Singapore occupation headcount.'
		},
		{
			name: 'data_basis.employment_estimate',
			type: 'object',
			description: 'Tier/source metadata for the Singapore employment estimate.'
		},
		{
			name: 'data_basis.wage_pool_proxy',
			type: 'object',
			description: 'Tier/source metadata for the wage-pool proxy field.'
		},
		{
			name: 'labour_monitor_key',
			type: 'enum|null',
			description:
				'Cluster key linking this occupation to the separately published Singapore labour monitor dataset.'
		},
		{
			name: 'exposure',
			type: 'number',
			description:
				'Base 4-source exposure ensemble (0-1), before V7 task-concentration amplification.'
		},
		{
			name: 'task_signal',
			type: 'number',
			description:
				'V7 task-concentration signal: task_effective_coverage × task_exposure_concentration. Zero when task primitives are unavailable.'
		},
		{
			name: 'exposure_v7',
			type: 'number',
			description:
				'Live V7 exposure after task-concentration amplification. Formula: min(1, exposure × (1 + 0.20 × task_signal)).'
		},
		{
			name: 'bottleneck',
			type: 'number',
			description:
				'Human bottleneck strength (0-1). Higher means stronger human advantage from judgment, accountability, or interpersonal work.'
		},
		{
			name: 'displacement_pressure',
			type: 'number',
			description:
				'Intermediate structural pressure field (0-1). Formula: exposure_v7 × (1 - bottleneck).'
		},
		{
			name: 'demand_signal_bonus',
			type: 'number',
			description:
				'Additive demand bonus from exact or prefix matches against SOL and Jobs in Demand.'
		},
		{
			name: 'demand_persistence',
			type: 'number',
			description:
				'V7 demand-side counterforce proxy built from market momentum, vacancy rank, scarcity rank, and official demand-signal rank.'
		},
		{
			name: 'demand_resilience',
			type: 'number',
			description:
				'Published V7 demand-resilience field (0-1). Formula: min(1, base_resilience × 0.45 + demand_signal_bonus + 0.10 × demand_persistence).'
		},
		{
			name: 'net_risk',
			type: 'number',
			description:
				'Headline displacement risk (0-1). Formula: headline_risk = displacement_pressure × (1 - demand_resilience), where displacement_pressure = exposure_v7 × (1 - bottleneck).'
		},
		{
			name: 'risk_band',
			type: 'enum',
			description:
				'Categorical risk: very_low (<5%), low (<15%), moderate (<30%), high (<50%), very_high (≥50%).'
		},
		{
			name: 'augmentation',
			type: 'number',
			description:
				'Live V7 augmentation potential (0-1). Formula: exposure_v7 × bottleneck × market.market_resilience.'
		},
		{
			name: 'impact_type',
			type: 'enum',
			description: 'ai_leveraged | at_risk | stable | mixed, based on displacement and augmentation thresholds.'
		},
		{
			name: 'baseline_v6',
			type: 'object',
			description:
				'Retained V6 baseline fields for release-to-release comparison. Contains baseline_v6.net_risk and baseline_v6.exposure.'
		},
		{
			name: 'market.market_momentum',
			type: 'number',
			description: 'Broad labour-market momentum signal (0-1).'
		},
		{
			name: 'market.industry_footprint_momentum',
			type: 'number|null',
			description: 'Industry-footprint employment momentum when occupation-specific industry context is available.'
		},
		{
			name: 'market.market_resolution',
			type: 'enum',
			description: 'How market resilience was resolved for the occupation, for example broad-only or industry-footprint blend.'
		},
		{
			name: 'market.occupation_scarcity',
			type: 'number',
			description: 'Labour shortage signal (0-1), derived from SOL and Jobs in Demand lists.'
		},
		{
			name: 'market.market_resilience',
			type: 'number',
			description: 'Combined market buffer (0-1). Higher means stronger demand protection.'
		},
		{
			name: 'group_employment_thousands',
			type: 'number',
			description: 'Official employment total for the broad Singapore occupation group (in thousands).'
		},
		{
			name: 'evidence.anthropic_calibrated',
			type: 'boolean',
			description: 'Whether Anthropic observed-usage data is available for this occupation.'
		},
		{
			name: 'evidence.anthropic_gap',
			type: 'number|null',
			description: 'Observed-usage percentile minus theoretical exposure percentile.'
		},
		{
			name: 'evidence.anthropic_observed_pctile',
			type: 'number|null',
			description: 'Observed Anthropic usage percentile when a direct Anthropic match exists.'
		},
		{
			name: 'evidence.sol_match',
			type: 'string|false',
			description: 'Shortage Occupation List match: exact, prefix, or false.'
		},
		{
			name: 'evidence.jobs_in_demand_match',
			type: 'string|false',
			description: 'Jobs in Demand match: exact, prefix, or false.'
		},
		{
			name: 'evidence.exposure_blend_strategy',
			type: 'enum',
			description:
				'Current exposure provenance marker for the deterministic audited 4-source stack.'
		},
		{
			name: 'evidence.exposure_agreement',
			type: 'enum',
			description:
				'Agreement across matched exposure sources: consensus_high, consensus_low, aligned_mid, divergent, or insufficient_data.'
		},
		{
			name: 'evidence.exposure_source_weights',
			type: 'object',
			description:
				'Normalized per-source weights used inside the exposure ensemble after conditioning on which sources matched this occupation.'
		},
		{
			name: 'evidence.exposure_source_keys',
			type: 'string[]',
			description: 'List of matched exposure sources used by the audited ensemble.'
		},
		{
			name: 'evidence.exposure_source_pctiles',
			type: 'object',
			description:
				'Persisted per-source exposure percentiles for the matched AIOE, Anthropic, Eloundou, and ILO inputs.'
		},
		{
			name: 'evidence.signal_conflict',
			type: 'boolean',
			description:
				'Whether the occupation has materially conflicting evidence, such as high structural pressure but strong current demand signals.'
		},
		{
			name: 'evidence.signal_conflict_reasons',
			type: 'string[]',
			description: 'Explicit reasons why the occupation is flagged as having conflicting evidence.'
		},
		{
			name: 'confidence.score',
			type: 'number',
			description: 'Overall estimate confidence (0-1), combining crosswalk quality, market data, and source freshness.'
		},
		{
			name: 'confidence.exposure_source_count',
			type: 'number',
			description:
				'How many exposure sources were available in the audited 4-source exposure stack.'
		},
		{
			name: 'confidence.source_coverage',
			type: 'number',
			description: 'Coverage component of confidence (0-1), based on the number of matched exposure sources.'
		},
		{
			name: 'confidence.signal_agreement',
			type: 'number',
			description: 'Agreement component of confidence (0-1), derived from agreement across available exposure sources.'
		},
		{
			name: 'confidence.sensitivity',
			type: 'number',
			description: 'Sensitivity component of confidence (0-1), derived from the stability stress test.'
		},
		{
			name: 'confidence.level',
			type: 'enum',
			description:
				'Final published confidence label. This may be capped below the raw threshold result for fallback, sparse-source, or contested cases.'
		},
		{
			name: 'confidence.threshold_level',
			type: 'enum',
			description:
				'Raw threshold label implied by confidence.score before any publication policy cap is applied.'
		},
		{
			name: 'confidence.policy_cap_reason',
			type: 'enum|null',
			description:
				'If present, explains why the published label is more conservative than the raw threshold: insufficient_source_count, fallback_mapping, major_fallback_mapping, or signal_conflict.'
		},
		{
			name: 'uncertainty.exposure_p10',
			type: 'number',
			description: '10th-percentile interval estimate for exposure.'
		},
		{
			name: 'uncertainty.exposure_p50',
			type: 'number',
			description: 'Median interval estimate for exposure.'
		},
		{
			name: 'uncertainty.exposure_p90',
			type: 'number',
			description: '90th-percentile interval estimate for exposure.'
		},
		{
			name: 'uncertainty.net_risk_p10',
			type: 'number',
			description: '10th-percentile interval estimate for net_risk.'
		},
		{
			name: 'uncertainty.net_risk_p50',
			type: 'number',
			description: 'Median interval estimate for net_risk.'
		},
		{
			name: 'uncertainty.net_risk_p90',
			type: 'number',
			description: '90th-percentile interval estimate for net_risk.'
		},
		{
			name: 'task_primitives.matched_task_weight_share',
			type: 'number|null',
			description:
				'Share of weighted O*NET task importance/frequency that matched the experimental Anthropic task-penetration layer.'
		},
		{
			name: 'task_primitives.task_effective_coverage',
			type: 'number|null',
			description:
				'Experimental task-weighted effective coverage sidecar. Null when weighted task portfolios are not available.'
		},
		{
			name: 'task_primitives.task_exposure_concentration',
			type: 'number|null',
			description:
				'Experimental task-weighted concentration sidecar. Higher means exposure is concentrated into fewer important tasks.'
		},
		{
			name: 'task_primitives.method',
			type: 'enum|null',
			description:
				'Experimental task-primitive method identifier. Null when no weighted task evidence is available for this occupation.'
		},
		{
			name: 'education_label',
			type: 'string',
			description: 'Displayed education proxy. Derived from O*NET Job Zones via the country crosswalk.'
		},
		{
			name: 'sg_context',
			type: 'object',
			description: 'Local context flags (policy coverage, licensing, labour dependency, transition support).'
		},
		{
			name: 'stability.label',
			type: 'enum',
			description: 'stable | watch | sensitive — how much the risk band moves under the Monte Carlo stability check.'
		}
	];

	const fieldCategories = [
		{
			label: 'Identity & classification',
			fields: fields.filter((f) =>
				['ssoc', 'title', 'major_group', 'education_label'].includes(f.name)
			)
		},
		{
			label: 'Wages & employment',
			fields: fields.filter((f) =>
				[
					'gross_wage_median',
					'gross_wage_25th',
					'gross_wage_75th',
					'employment_thousands',
					'estimated_sg_employment_thousands',
					'employment_basis',
					'bls_proxy_employment',
					'group_employment_thousands',
					'data_basis.employment_estimate',
					'data_basis.wage_pool_proxy',
					'labour_monitor_key'
				].includes(f.name)
			)
		},
		{
			label: 'Core scoring',
			fields: fields.filter((f) =>
				[
					'exposure',
					'task_signal',
					'exposure_v7',
					'bottleneck',
					'displacement_pressure',
					'demand_signal_bonus',
					'demand_persistence',
					'demand_resilience',
					'net_risk',
					'risk_band',
					'augmentation',
					'impact_type',
					'baseline_v6'
				].includes(f.name)
			)
		},
		{
			label: 'Market signals',
			fields: fields.filter((f) => f.name.startsWith('market.'))
		},
		{
			label: 'Evidence & provenance',
			fields: fields.filter((f) => f.name.startsWith('evidence.'))
		},
		{
			label: 'Confidence & uncertainty',
			fields: fields.filter(
				(f) => f.name.startsWith('confidence.') || f.name.startsWith('uncertainty.')
			)
		},
		{
			label: 'Task primitives',
			fields: fields.filter((f) => f.name.startsWith('task_primitives.'))
		},
		{
			label: 'Context & stability',
			fields: fields.filter((f) =>
				['sg_context', 'stability.label'].includes(f.name)
			)
		},
		{
			label: 'Workflow overlay',
			fields: [
				{
					name: 'workflow_overlay.*',
					type: 'object',
					description:
						'Heuristic workflow dimensions used by role and scenario tooling. These provide interpretive context rather than direct live-score inputs.'
				}
			]
		}
	];

	const manifest = releaseManifest as {
		version: string;
		generated_at: string;
		score_dataset_generated_at: string;
		artifacts: Array<{
			file: string;
			label: string;
			category: string;
			description: string;
			bytes: number;
			sha256: string;
			generated_at: string;
		}>;
	};

		const rawAudit = rawDataAudit as {
		generated_at: string;
		summary: {
			valid: number;
			placeholder_error: number;
			missing: number;
			reference_only: number;
		};
		entries: Array<{
			key: string;
			file: string;
			label: string;
			status: 'valid' | 'placeholder_error' | 'missing' | 'reference_only';
			exists: boolean;
			expected_type: string;
			size_bytes: number | null;
			used_by: string[];
			note: string;
			}>;
		};

		const forecastReadiness = forecastReadinessData as {
			status: string;
			summary: {
				status_counts: {
					ready_for_directional_validation: number;
					partial_proxy_needs_snapshots: number;
					source_available_not_modeled: number;
					protocol_only: number;
				};
				mom_ai_adopting_firms_pct: number;
				postings_latest_posted_date: string | null;
			};
			inputs: Array<{
				key: string;
				label: string;
				status: string;
				confidence_for_forecast: string;
				next_step: string;
			}>;
		};

		const forecastReadinessCounts = forecastReadiness.summary.status_counts;

	const rawStatusLabels = {
		valid: 'Valid',
		placeholder_error: 'Placeholder / error payload',
		missing: 'Missing',
		reference_only: 'Reference only'
	} as const;

	function rawStatusClass(status: keyof typeof rawStatusLabels): string {
		if (status === 'valid') return 'text-impact-leveraged';
		if (status === 'placeholder_error') return 'text-risk-high';
		if (status === 'missing') return 'text-risk-high';
		return 'text-muted-foreground';
	}

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat('en-SG', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Singapore'
		}).format(new Date(value));
	}

	function formatBytes(value: number): string {
		if (value < 1024) return `${value} B`;
		if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
		return `${(value / (1024 * 1024)).toFixed(2)} MB`;
	}

	function formatPct(value: number | null | undefined): string {
		return typeof value === 'number' ? `${(value * 100).toFixed(0)}%` : 'n/a';
	}

	function formatReleaseDate(release: { display_date?: string | null; published_at?: string | null }): string {
		if (release.display_date) return release.display_date;
		if (release.published_at) return formatDateTime(release.published_at);
		return 'Date not retained';
	}
</script>

<Seo
	title="Download AI Work Index Data"
	description={`Download the current AI Work Index dataset and versioned snapshots, including the live ${DATA_VINTAGE.model_version} structural scores, uncertainty intervals, and metadata. The global baseline stays structural-only; country bundles add local wages, demand, support, and policy context where evidence exists.`}
	path="/data"
	jsonLd={[datasetJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Data Downloads</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		The global structural baseline and the country-specific bundles are published separately so each
		layer can be validated on its own, without conflating structural pressure with local demand,
		wage, transition, or regulatory overlays.
	</p>

	<!-- TL;DR -->
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-4 mb-4')}>
			<p class="text-sm font-semibold text-foreground">
				{DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count} roles · {dataSourceCount}
			data sources · MIT licensed
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Structural scores and local context are separate downloads. Each artifact has an evidence
			tier: official local, derived from official local, cross-country research, external proxy,
				or synthetic.
			</p>
		</div>

	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'none' }), 'mb-4')}>
			<p class="text-sm font-semibold text-foreground">Forecast readiness is published separately</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{forecastReadinessCounts.ready_for_directional_validation} inputs are ready for directional
				validation, {forecastReadinessCounts.partial_proxy_needs_snapshots} need recurring snapshots,
				and {forecastReadinessCounts.source_available_not_modeled} are source-available but not yet
				modelled. The matrix does not change the {DATA_VINTAGE.model_version} headline score.
			</p>
			<a href={'/data/forecast-readiness-' + currentVersionTag + '.json'} download class="mt-2 inline-block text-xs text-primary underline">
				forecast-readiness-{currentVersionTag}.json
			</a>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
		<div class={cn(card({ variant: 'metric', padding: 'sm' }))}>
			<p class={microLabel()}>
				Structural release
			</p>
			<p class="mt-1 text-lg font-bold text-foreground">{siteStatus.structural_release.version}</p>
			<p class="text-xs text-muted-foreground">
				score dataset generated {siteStatus.structural_release.score_dataset_generated_at}
			</p>
		</div>
		<div class={cn(card({ variant: 'metric', padding: 'sm' }))}>
			<p class={microLabel()}>
				Live monitor
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{siteStatus.live_monitor.labour_monitor_artifact_vintage}
			</p>
			<p class="text-xs text-muted-foreground">current labour context used on live pages</p>
		</div>
		<div class={cn(card({ variant: 'metric', padding: 'sm' }))}>
			<p class={microLabel()}>
				Latest official release
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{siteStatus.live_monitor.latest_official_labour_report.period}
			</p>
			<p class="text-xs text-muted-foreground">
				{siteStatus.live_monitor.latest_official_labour_report.label} published {siteStatus.live_monitor.latest_official_labour_report.published_at}
			</p>
		</div>
		<div class={cn(card({ variant: 'metric', padding: 'sm' }))}>
			<p class={microLabel()}>
				Legacy model comparison
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{experimentalStatusLabel(siteStatus.experimental_release?.status)}
			</p>
			<p class="text-xs text-muted-foreground">
				median direct task-share {formatPct(siteStatus.experimental_release?.median_direct_matched_task_weight_share)}
			</p>
		</div>
		<div class={cn(card({ variant: 'metric', padding: 'sm' }))}>
			<p class={microLabel()}>
				Quarterly briefing
			</p>
			<p class="mt-1 text-sm font-semibold text-foreground">2026 Q1</p>
			<p class="text-xs text-muted-foreground">
				{siteStatus.live_monitor.quarterly_current_snapshot ?? 'No current snapshot'}
			</p>
		</div>
	</div>

	<div class={cn(card({ padding: 'md' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">Release history</p>
		<div class="mt-3 space-y-3">
			{#each releases.slice(0, 3) as release (release.id)}
				<div class="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
					<div>
						<p class="text-sm font-medium text-foreground">{release.label}</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Published {formatReleaseDate(release)} · {release.score_version} · monitor {release.monitor_vintage}
						</p>
					</div>
					<a
						href={release.href}
						class="text-xs text-primary hover:underline"
						target={release.href.startsWith('http') ? '_blank' : undefined}
						rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					>
						Open →
					</a>
				</div>
			{/each}
			{#if releases.length > 3}
				<details>
					<summary class="cursor-pointer text-xs font-medium text-primary hover:underline">
						View {releases.length - 3} older releases
					</summary>
					<div class="mt-3 space-y-3">
						{#each releases.slice(3) as release (release.id)}
							<div class="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
								<div>
									<p class="text-sm font-medium text-foreground">{release.label}</p>
									<p class="mt-1 text-xs text-muted-foreground">
										Published {formatReleaseDate(release)} · {release.score_version} · monitor {release.monitor_vintage}
									</p>
								</div>
								<a
									href={release.href}
									class="text-xs text-primary hover:underline"
									target={release.href.startsWith('http') ? '_blank' : undefined}
									rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
								>
									Open →
								</a>
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</div>
	</div>

	<!-- Download Cards -->
	<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Downloads</p>
	<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
		<a href={'/data/sg-ai-occupations-' + currentVersionTag + '.csv'} download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-risk-very-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">CSV</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					{DATA_VINTAGE.occupation_count} occupations, flattened fields + provenance. Best for spreadsheets.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary"
					>{'sg-ai-occupations-' + currentVersionTag + '.csv'}</span
				>
			</div>
		</a>

		<a href={'/data/sg-ai-occupations-' + currentVersionTag + '.json'} download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">JSON</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Full {DATA_VINTAGE.model_version} scores with nested fields, task primitives, uncertainty
					intervals, and retained V6 baseline fields.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary"
					>{'sg-ai-occupations-' + currentVersionTag + '.json'}</span
				>
			</div>
		</a>

		<a href="/data/experimental-methodology-v43.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-risk-moderate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V4.3 Audit Trail</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Shadow-governance status, promotion gates, and the retained audit trail beneath the live
					V7 release.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">experimental-methodology-v43.json</span>
			</div>
		</a>

		<a href="/data/shadow-scores-v43.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-impact-leveraged" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V4.3 Comparison Scores</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Task-adjusted comparison scores retained for archived validation and promotion-gate review.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">shadow-scores-v43.json</span>
			</div>
		</a>

		<a href="/data/research-library.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
						<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
					</svg>
					<span class="text-base font-semibold text-foreground">Research Library</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Canonical citation registry linking the live methodology, validation layer, and archived V5 roadmap to source papers and reports.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">research-library.json</span>
			</div>
		</a>

		<a href="/data/v5-roadmap.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 3h18v18H3z"/>
						<path d="M7 12h10"/>
						<path d="M12 7v10"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V5 Roadmap</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Archived roadmap for the V5 research program that preceded the current V7 two-axis
					structural release.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">v5-roadmap.json</span>
			</div>
		</a>

		<a href="/data/v5-sidecars.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 6h16"/>
						<path d="M4 12h16"/>
						<path d="M4 18h16"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V5 Supplementary Data</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Published V5 workstream summary covering augmentation heterogeneity, empirical mobility,
					posterior uncertainty, and realized-risk forecasting sidecars that fed the later V7
					release.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">v5-sidecars.json</span>
			</div>
		</a>

		<a href="/data/v5-experimental-model.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 3v18"/>
						<path d="M3 12h18"/>
						<path d="m5 5 14 14"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V5 Model Note</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Final promotion-comparison artifact for the former live V5 model, retaining the
					V4.3 comparison snapshot and the published adjunct layers.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">v5-experimental-model.json</span>
			</div>
		</a>

			<a href="/data/v5-experimental-validation.json" download class="no-underline">
				<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
					<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 19h16"/>
						<path d="M7 15V9"/>
						<path d="M12 15V5"/>
						<path d="M17 15v-3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">V5 Validation Comparison</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Comparison and validation summary for the former live V5 model versus the retained V4.3 snapshot
					across structural and realized-risk checks.
				</p>
					<span class="mt-auto pt-2 text-xs text-primary">v5-experimental-validation.json</span>
				</div>
			</a>

			<a href={'/data/forecast-readiness-' + currentVersionTag + '.json'} download class="no-underline">
				<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-risk-moderate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4 19h16"/>
							<path d="M7 15V9"/>
							<path d="M12 15V5"/>
							<path d="M17 15v-3"/>
						</svg>
						<span class="text-base font-semibold text-foreground">Forecast Readiness</span>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Source, duplication, and validation-gate matrix for future forecast-grade labour claims.
						Separate from the live structural score.
					</p>
					<span class="mt-auto pt-2 text-xs text-primary">forecast-readiness-{currentVersionTag}.json</span>
				</div>
			</a>

			<a href={SITE.github} target="_blank" rel="noopener noreferrer" class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-impact-leveraged" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 22v-2a4 4 0 0 0-1-3c3 0 6-2 6-5.5a4.4 4.4 0 0 0-1.2-3 4 4 0 0 0-.1-3s-1-.3-3.3 1.2a11.2 11.2 0 0 0-6 0C8 5.7 7 6 7 6a4 4 0 0 0-.1 3A4.4 4.4 0 0 0 5.6 12C5.6 14.5 8.6 16.5 11.6 16.5a3.5 3.5 0 0 0-1 2.1V22"/>
						<path d="M9 18c-4.5 2-5-2-7-2"/>
					</svg>
					<span class="text-base font-semibold text-foreground">Source Code</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Full scoring pipeline and raw data. Open source, MIT licensed.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">{SITE.github.replace('https://', '')}</span>
			</div>
		</a>
	</div>

	<!-- Live context bundles — separate full-width card -->
	<div class={cn(card({ padding: 'lg' }), 'mt-4')}>
		<div class="flex items-center gap-2 mb-2">
			<svg class="h-5 w-5 text-impact-leveraged" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="7,10 12,15 17,10"/>
				<line x1="12" y1="15" x2="12" y2="3"/>
			</svg>
			<span class="text-base font-semibold text-foreground">Country Context Bundles</span>
		</div>
		<p class="text-sm text-muted-foreground">
			Context-only bundles are published separately from structural scores. Singapore is fully
			scored, while the US layer now carries its own public wage and demand context.
		</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
			{#each [
				{ href: '/data/sg-context-pack-2025.json', label: 'Full context pack', desc: 'All context in one file' },
				{ href: '/data/sg-labour-monitor-2025.json', label: 'Labour monitor', desc: 'Vacancy, hiring, retrenchment' },
				{ href: '/data/sg-worker-profile-2025.json', label: 'Worker profile', desc: 'Age, education, nationality' },
				{ href: '/data/sg-geography-context-2020.json', label: 'Geography', desc: 'Planning area concentration' },
				{ href: '/data/sg-macro-context-2025.json', label: 'Macro context', desc: 'Unemployment, GDP, tightness' },
				{ href: '/data/sg-ai-in-singapore-2025.json', label: 'AI in Singapore', desc: 'Adoption, NAIIP, workforce' },
				{ href: '/data/onet-enrichment.json', label: 'O*NET task + tools', desc: 'Supporting task and technology context' },
					{ href: '/data/sg-transition-support-v4.json', label: 'Transition support', desc: 'Pathways, SkillsFuture, JTM / WSQ anchors' },
					{ href: '/data/sg-offset-potential-v4.json', label: 'Offset potential', desc: 'Demand persistence, redesign room, switching friction' },
					{ href: '/data/forecast-readiness-' + currentVersionTag + '.json', label: 'Forecast readiness', desc: 'Sources, gaps, validation gates' },
					{ href: '/data/public-field-source-map.json', label: 'Field source map', desc: 'Field-level provenance and transformations' }
				] as file}
				<a
					href={file.href}
					download
					class="rounded-md border border-border px-3 py-2 hover:bg-accent hover:border-primary/30 transition-colors block"
				>
					<p class="text-xs font-medium text-primary">{file.label}</p>
					<p class="text-xs text-muted-foreground">{file.desc}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- Versioned Snapshots -->
	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Versioned Snapshots</p>
		<div class={card({ padding: 'lg' })}>
			<p class="text-sm text-muted-foreground mb-3">Historical scoring snapshots for tracking changes over time.</p>
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="text-xs uppercase tracking-wider">Version</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Date</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Occupations</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Download</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each structuralReleases as release}
							<Table.Row class={release.availability === 'history_only' ? 'opacity-70' : ''}>
								<Table.Cell class="font-medium">
									{release.version_label}{release.version_label === DATA_VINTAGE.model_version
										? ' (Current)'
										: ''}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{formatReleaseDate(release)}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{DATA_VINTAGE.occupation_count}</Table.Cell>
								<Table.Cell>
									{#if release.version_label === DATA_VINTAGE.model_version}
										<a
											href={'/data/sg-ai-occupations-' + currentVersionTag + '.json'}
											download
											class="text-xs text-primary underline">JSON</a
										>
										<span class="mx-1 text-muted-foreground">&middot;</span>
										<a
											href={'/data/sg-ai-occupations-' + currentVersionTag + '.csv'}
											download
											class="text-xs text-primary underline">CSV</a
										>
									{:else if release.version_label === 'V4.2'}
										<a href="/data/sg-ai-occupations-v42.json" download class="text-xs text-primary underline">JSON</a>
										<span class="mx-1 text-muted-foreground">&middot;</span>
										<a href="/data/sg-ai-occupations-v42.csv" download class="text-xs text-primary underline">CSV</a>
									{:else if release.version_label === 'V3.0'}
										<a href="/data/sg-ai-occupations-v3.json" download class="text-xs text-primary underline">JSON</a>
									{:else}
										<span class="text-xs text-muted-foreground italic">
											{release.availability === 'history_only' ? 'History only' : 'Archived'}
										</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<p class="mt-3 text-xs text-muted-foreground italic">
				Quarterly snapshots will be archived here as new scoring runs are published. Use snapshots to track band movers and score drift over time.
			</p>
		</div>
	</div>

	<!-- Methodology version -->
	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Methodology Version</p>
		<div class={card({ padding: 'lg' })}>
			<div class="space-y-1 text-sm text-muted-foreground">
				<p><span class="font-medium text-foreground">Version:</span> V7 (headline risk = displacement pressure × (1 − demand resilience), with V7 task-concentration-weighted exposure and demand-persistence proxy)</p>
				<p><span class="font-medium text-foreground">Data vintage:</span> 2024 wages, 2025 labour context, 2025/2026 demand signals</p>
				<p><span class="font-medium text-foreground">Occupations:</span> {DATA_VINTAGE.occupation_count} occupations, currently sourced from Singapore (primary) and United States data</p>
				<p><span class="font-medium text-foreground">Separate context bundle:</span> Labour monitor, worker profile, industry context, sector wage anchors, geography context, macro labour context, national AI context, offset potential, transition support, and US wage / requirements / skills / narrative layers</p>
				<p><span class="font-medium text-foreground">Retained baseline trail:</span> {experimentalStatusLabel(siteStatus.experimental_release.status)}. The full V4.3 shadow and V5 promotion comparison remain published so the live V7 release can still be audited against the retained V4.3 and V4.2 baselines.</p>
				<p><span class="font-medium text-foreground">Research memory:</span> {researchLibrary.entry_count} canonical research entries are published in the research library and linked to claims/source registry records.</p>
					<p><span class="font-medium text-foreground">Sources:</span> Live reference-market official statistics and policy data (wages, labour-force context, industry context, demand signals), MOM AI Adoption Among Firms 2026, BLS OEWS, ORS, CPS demographics, Skills Data, OOH, IMDA Singapore Digital Economy Report 2025, IMDA NAIIP 2026, O*NET, Felten AIOE, Pizzinelli/IMF, Anthropic observed usage, Anthropic labor-market impacts, Eloundou GPT exposure, ILO occupational exposure, SOL 2026, Jobs in Demand 2025</p>
			</div>
			<div class="mt-3 flex flex-wrap gap-4 text-sm">
				<a href="/methodology" class="text-primary underline">Full methodology &rarr;</a>
				<a href="/reports/v7-release" class="text-primary underline">V7 release note &rarr;</a>
				<a href="/research" class="text-primary underline">Research library &rarr;</a>
			</div>
		</div>
	</div>

	<div class="mt-8">
		<details>
			<summary class={cn(sectionLabel(), 'mb-3 cursor-pointer hover:text-primary')}>
				Release Metadata ({manifest.artifacts.length} artifacts)
			</summary>
			<div class={card({ padding: 'lg' })}>
				<div class="space-y-1 text-sm text-muted-foreground">
					<p><span class="font-medium text-foreground">Manifest version:</span> {manifest.version}</p>
					<p>
						<span class="font-medium text-foreground">Manifest generated:</span>
						{formatDateTime(manifest.generated_at)}
					</p>
					<p>
						<span class="font-medium text-foreground">Score dataset vintage:</span>
						{manifest.score_dataset_generated_at}
					</p>
				</div>
				<div class="mt-4 rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="text-xs uppercase tracking-wider">Artifact</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Generated</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Size</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">SHA-256</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each manifest.artifacts as artifact}
								<Table.Row>
									<Table.Cell>
										<div class="space-y-0.5">
											<p class="font-medium text-foreground">{artifact.label}</p>
											<p class="text-xs text-muted-foreground">{artifact.file}</p>
										</div>
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{formatDateTime(artifact.generated_at)}
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{formatBytes(artifact.bytes)}
									</Table.Cell>
									<Table.Cell class="font-mono text-xs text-muted-foreground">
										{artifact.sha256}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
				<p class="mt-3 text-xs text-muted-foreground">
					Checksums are published so downloaded artifacts can be verified against the current release.
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Major public claims are also published in a versioned
					<a href={'/data/claims-matrix-' + currentVersionTag + '.json'} download class="text-primary underline">claims matrix</a>
					with evidence-strength labels, source keys, and research links. The citation layer is also
					published as
					<a href="/data/research-library.json" download class="text-primary underline">research-library.json</a>.
				</p>
			</div>
		</details>
	</div>

	<section class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Dataset Citation</p>
		<div class={card({ padding: 'lg' })}>
			<p class="text-sm font-semibold text-foreground">{DATA_VINTAGE.model_version} public dataset</p>
			<p class="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
				{datasetCitation}
			</p>
			<p class="mt-3 text-xs text-muted-foreground">
				The structured Dataset metadata uses this same citation and links the current CSV, JSON,
				claims matrix, and field source map as machine-readable downloads.
			</p>
		</div>
	</section>

	<div class="mt-8">
		<details>
			<summary class={cn(sectionLabel(), 'mb-3 cursor-pointer hover:text-primary')}>
				Raw Data Health ({rawAudit.summary.valid} valid, {rawAudit.summary.placeholder_error + rawAudit.summary.missing} issues)
			</summary>
			<div class={card({ padding: 'lg' })}>
				<div class="space-y-1 text-sm text-muted-foreground">
					<p>
						<span class="font-medium text-foreground">Audit generated:</span>
						{formatDateTime(rawAudit.generated_at)}
					</p>
					<p>
						<span class="font-medium text-foreground">Summary:</span>
						{rawAudit.summary.valid} valid, {rawAudit.summary.placeholder_error} placeholder/error,
						{rawAudit.summary.missing} missing, {rawAudit.summary.reference_only} reference-only
					</p>
				</div>
				<div class="mt-4 rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="text-xs uppercase tracking-wider">Raw Input</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Status</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Used For</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Notes</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rawAudit.entries as entry}
								<Table.Row>
									<Table.Cell>
										<div class="space-y-0.5">
											<p class="font-medium text-foreground">{entry.label}</p>
											<p class="text-xs text-muted-foreground">{entry.file}</p>
										</div>
									</Table.Cell>
									<Table.Cell class={cn('text-xs font-medium', rawStatusClass(entry.status))}>
										{rawStatusLabels[entry.status]}
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{entry.used_by.join(', ')}
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{entry.note}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
				<p class="mt-3 text-xs text-muted-foreground">
					This audit distinguishes real local raw inputs from missing files and failed download artifacts.
				</p>
			</div>
		</details>
	</div>

	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Evidence Tiers</p>
		<div class={card({ padding: 'lg' })}>
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="text-xs uppercase tracking-wider">Tier</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Meaning</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each evidenceTiers as tier}
							<Table.Row>
								<Table.Cell class="font-medium">{evidenceTierLabels[tier.key]}</Table.Cell>
								<Table.Cell class="text-xs text-muted-foreground">{tier.description}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<p class="mt-3 text-xs text-muted-foreground">
				The employment estimate and wage-pool proxy are intentionally separated. The first is an estimated local allocation from official Labour Force 2025 2-digit occupation-family totals, weighted within each family; the second is a BLS-weighted proxy used only for wage-pool views. Separate live worker-profile context comes from Labour Force 2025 Section D and wages-by-sex tables.
			</p>
			<p class="mt-2 text-xs text-muted-foreground">
				Current labour evidence is also published separately in the reference-market context pack so the
				structural score and the monitor can be audited independently.
			</p>
		</div>
	</div>

	<Alert.Root variant="warning" class="mt-4">
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
		<Alert.Title class="text-foreground">A note on data quality</Alert.Title>
		<Alert.Description class="text-text-secondary">
			All scores are deterministic and reproducible. The scoring pipeline uses no LLM in the loop, and every displayed proxy or estimate now carries an explicit basis and evidence tier in the dataset.
		</Alert.Description>
	</Alert.Root>

	<div class="mt-8">
		<details>
			<summary class={cn(sectionLabel(), 'mb-3 cursor-pointer hover:text-primary')}>
				Source Registry ({dataSourceCount} sources)
			</summary>
			<div class={card({ padding: 'lg' })}>
				<p class="mb-3 text-sm text-muted-foreground">
					Live sources are tracked separately from the structural score. Some sources are already
					active in the live monitor pipeline; others remain reference or backlog sources and are
					not yet part of the published monitor.
				</p>
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="text-xs uppercase tracking-wider">Source</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Tier</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Status</Table.Head>
								<Table.Head class="text-xs uppercase tracking-wider">Used For</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataSourceRegistry as source}
								<Table.Row>
									<Table.Cell>
										<div class="space-y-0.5">
											<p class="font-medium text-foreground">{source.label}</p>
											<p class="text-xs text-muted-foreground">{source.vintage}</p>
										</div>
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{evidenceTierLabels[source.tier]}
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{sourceRegistryStatusLabels[source.status]}
									</Table.Cell>
									<Table.Cell class="text-xs text-muted-foreground">
										{source.used_for.join(', ')}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</details>
	</div>

	<!-- Data Dictionary -->
	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Data Dictionary</p>
		<div class={card({ padding: 'lg' })}>
			<p class="text-sm text-muted-foreground mb-3">
				{fields.length} fields across {fieldCategories.length} categories. See the <a href="/methodology" class="text-primary underline">methodology page</a> for derivation details.
			</p>
			<div class="space-y-2">
				{#each fieldCategories as category}
					{#if category.fields.length > 0}
						<details>
							<summary class="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
								{category.label}
								<span class="ml-1 text-xs text-muted-foreground">({category.fields.length} fields)</span>
							</summary>
							<div class="mt-1 rounded-md border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="text-xs uppercase tracking-wider">Field</Table.Head>
											<Table.Head class="text-xs uppercase tracking-wider">Type</Table.Head>
											<Table.Head class="text-xs uppercase tracking-wider">Description</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each category.fields as field}
											<Table.Row>
												<Table.Cell class="font-mono text-xs">{field.name}</Table.Cell>
												<Table.Cell class="text-xs text-muted-foreground">{field.type}</Table.Cell>
												<Table.Cell class="text-xs text-muted-foreground">{field.description}</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						</details>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- License -->
	<footer class="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
		<p>This data is released under the MIT License. Attribution appreciated but not required.</p>
		<p class="mt-1">
			Questions? See <a href="/methodology" class="text-primary underline">methodology</a> or <a href="/about" class="text-primary underline">about</a>.
		</p>
	</footer>
</main>
