<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
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
	import releaseManifest from '$lib/data/release-manifest.json';
	import rawDataAudit from '$lib/data/raw-data-audit.json';
	import Seo from '$lib/components/ui/Seo.svelte';

	const dataSourceCount = Object.keys(dataSourceRegistry).length;

	const datasetJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'AI Work Index — Singapore Occupation Scores',
		description: `${DATA_VINTAGE.occupation_count} Singapore occupations scored for structural AI pressure using a 4-source exposure ensemble, human bottleneck, and Singapore labour-market signals.`,
		url: SITE.url + '/data',
		license: 'https://opensource.org/licenses/MIT',
		creator: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		dateModified: DATA_VINTAGE.last_updated,
		spatialCoverage: { '@type': 'Country', name: 'Singapore' },
		variableMeasured: [
			'AI exposure ensemble',
			'Human bottleneck (theta)',
			'Net displacement risk',
			'Augmentation potential',
			'Market resilience'
		]
	})}<\/script>`;

	const evidenceTiers = [
		{
			key: 'official_sg',
			description: 'Direct Singapore government data published at the level shown on the site.'
		},
		{
			key: 'derived_from_official_sg',
			description: 'Rule-based or aggregated fields anchored to official Singapore data or published policy scope.'
		},
		{
			key: 'external_proxy',
			description: 'Non-Singapore research or external data used as an exposure input, proxy, or cross-check.'
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
			description: 'Singapore Standard Occupational Classification code (5-digit detail code).'
		},
		{ name: 'title', type: 'string', description: 'Occupation title from MOM classification.' },
		{
			name: 'major_group',
			type: 'string',
			description: 'Major occupational group key (for example professionals or managers).'
		},
		{
			name: 'gross_wage_median',
			type: 'number',
			description: 'Median gross monthly wage in SGD from MOM 2024.'
		},
		{
			name: 'gross_wage_25th',
			type: 'number',
			description: '25th percentile gross monthly wage in SGD.'
		},
		{
			name: 'gross_wage_75th',
			type: 'number',
			description: '75th percentile gross monthly wage in SGD.'
		},
		{
			name: 'employment_thousands',
			type: 'number',
			description:
				'Legacy compatibility alias for estimated_sg_employment_thousands. Derived from published Labour Force 2024 sub-major totals. Not an official occupation headcount.'
		},
		{
			name: 'estimated_sg_employment_thousands',
			type: 'number',
			description:
				'Est. Singapore employment for this occupation, derived from published Labour Force 2024 sub-major totals. Not an official occupation headcount.'
		},
		{
			name: 'employment_basis',
			type: 'enum',
			description: `Basis label for estimated_sg_employment_thousands. Current live basis: ${employmentBasisLabels.estimated_sg_submajor}.`
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
				'Exposure ensemble score (0-1). Reliability-weighted blend of matched percentile-ranked exposure sources in V4.0.'
		},
		{
			name: 'bottleneck',
			type: 'number',
			description:
				'Human bottleneck strength (0-1). Higher means stronger human advantage from judgment, accountability, or interpersonal work.'
		},
		{
			name: 'net_risk',
			type: 'number',
			description: 'Net displacement risk (0-1). Formula: exposure × (1 - bottleneck) × market_modifier.'
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
			description: 'Augmentation potential (0-1). How much AI can enhance rather than replace this role.'
		},
		{
			name: 'impact_type',
			type: 'enum',
			description: 'ai_leveraged | at_risk | stable | mixed, based on displacement and augmentation thresholds.'
		},
		{
			name: 'market.market_momentum',
			type: 'number',
			description: 'Broad labour-market momentum signal (0-1).'
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
				'Current exposure blend method. V4.0 uses a deterministic reliability-weighted ensemble.'
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
			name: 'evidence.signal_conflict',
			type: 'boolean',
			description:
				'Whether the occupation has materially conflicting evidence, such as high structural pressure but strong current demand signals.'
		},
		{
			name: 'confidence.score',
			type: 'number',
			description: 'Overall estimate confidence (0-1), combining crosswalk quality, market data, and source freshness.'
		},
		{
			name: 'confidence.exposure_source_count',
			type: 'number',
			description: 'How many exposure sources were available for this occupation in the V4.0 ensemble.'
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
			description: 'high | medium | low confidence.'
		},
		{
			name: 'education_label',
			type: 'string',
			description: 'Displayed education proxy. Derived from O*NET Job Zones via the SOC crosswalk.'
		},
		{
			name: 'sg_context',
			type: 'object',
			description: 'Singapore context flags (PWM, licensing, foreign-worker dependency, SkillsFuture support).'
		},
		{
			name: 'stability.label',
			type: 'enum',
			description: 'stable | watch | sensitive — how much the risk band moves under the Monte Carlo stability check.'
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
</script>

<Seo
	title="Download Singapore AI Occupation Risk Data"
	description="Download the current AI Work Index dataset and versioned snapshots, including the latest V4.0 structural scores and metadata."
	path="/data"
	jsonLd={[datasetJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Data Downloads</h1>

	<!-- TL;DR -->
	<div class={cn(card({ padding: 'sm' }), 'mt-4 mb-4 border-primary/20 bg-primary/5')}>
		<p class="text-sm font-semibold text-foreground">
			{DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count} roles · {dataSourceCount}
			data sources · MIT licensed
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Structural scores and Singapore context are separate downloads. Each artifact has an evidence
			tier: official SG, derived from official SG, external proxy, or synthetic.
		</p>
	</div>

	<!-- Download Cards -->
	<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Downloads</p>
	<div class="grid gap-4 sm:grid-cols-3">
		<a href="/data/sg-ai-occupations-v4.csv" download class="no-underline">
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
					562 occupations, flattened fields + provenance. Best for spreadsheets.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">sg-ai-occupations-v4.csv</span>
			</div>
		</a>

		<a href="/data/sg-ai-occupations-v4.json" download class="no-underline">
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
					Full V4.0 scores with nested fields and per-field basis metadata.
				</p>
				<span class="mt-auto pt-2 text-xs text-primary">sg-ai-occupations-v4.json</span>
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

	<!-- Singapore Context Pack — separate full-width card -->
	<div class={cn(card({ padding: 'lg' }), 'mt-4')}>
		<div class="flex items-center gap-2 mb-2">
			<svg class="h-5 w-5 text-impact-leveraged" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="7,10 12,15 17,10"/>
				<line x1="12" y1="15" x2="12" y2="3"/>
			</svg>
			<span class="text-base font-semibold text-foreground">Singapore Context Pack</span>
		</div>
		<p class="text-sm text-muted-foreground">
			Context-only bundle published separately from structural scores.
		</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
			{#each [
				{ href: '/data/sg-context-pack-2025.json', label: 'Full context pack', desc: 'All context in one file' },
				{ href: '/data/sg-labour-monitor-2025.json', label: 'Labour monitor', desc: 'Vacancy, hiring, retrenchment' },
				{ href: '/data/sg-worker-profile-2024.json', label: 'Worker profile', desc: 'Age, education, nationality' },
				{ href: '/data/sg-geography-context-2020.json', label: 'Geography', desc: 'Planning area concentration' },
				{ href: '/data/sg-macro-context-2025.json', label: 'Macro context', desc: 'Unemployment, GDP, tightness' },
				{ href: '/data/sg-ai-in-singapore-2025.json', label: 'AI in Singapore', desc: 'Adoption, NAIIP, workforce' },
				{ href: '/data/sg-transition-support-v4.json', label: 'Transition support', desc: 'SkillsFuture, pathways' }
			] as file}
				<a
					href={file.href}
					download
					class="rounded-md border border-border px-3 py-2 hover:bg-accent hover:border-primary/30 transition-colors block"
				>
					<p class="text-xs font-medium text-primary">{file.label}</p>
					<p class="text-[10px] text-muted-foreground">{file.desc}</p>
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
						<Table.Row>
							<Table.Cell class="font-medium">V4.0 (Current)</Table.Cell>
							<Table.Cell class="text-muted-foreground">March 2026</Table.Cell>
							<Table.Cell class="text-muted-foreground">562</Table.Cell>
							<Table.Cell>
									<a href="/data/sg-ai-occupations-v4.json" download class="text-xs text-primary underline">JSON</a>
									<span class="mx-1 text-muted-foreground">&middot;</span>
									<a href="/data/sg-ai-occupations-v4.csv" download class="text-xs text-primary underline">CSV</a>
								</Table.Cell>
							</Table.Row>
						<Table.Row class="opacity-50">
							<Table.Cell class="font-medium">V2</Table.Cell>
							<Table.Cell class="text-muted-foreground">January 2026</Table.Cell>
							<Table.Cell class="text-muted-foreground">562</Table.Cell>
							<Table.Cell class="text-xs text-muted-foreground italic">Archived</Table.Cell>
						</Table.Row>
						<Table.Row class="opacity-50">
							<Table.Cell class="font-medium">V1</Table.Cell>
							<Table.Cell class="text-muted-foreground">December 2025</Table.Cell>
							<Table.Cell class="text-muted-foreground">562</Table.Cell>
							<Table.Cell class="text-xs text-muted-foreground italic">Archived</Table.Cell>
						</Table.Row>
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
				<p><span class="font-medium text-foreground">Version:</span> V4.0 (4-source exposure ensemble inside a 3-layer structural score)</p>
				<p><span class="font-medium text-foreground">Data vintage:</span> 2024 wages, 2024/2025 demand signals</p>
				<p><span class="font-medium text-foreground">Occupations:</span> 562 SSOC-coded occupations</p>
				<p><span class="font-medium text-foreground">Separate context bundle:</span> Labour monitor, worker profile, industry context, sector wage anchors, geography context, macro labour context, and national AI context</p>
				<p><span class="font-medium text-foreground">Sources:</span> MOM Singapore (wages, Labour Force Section D, industry context, demand signals, SOI), IMDA Singapore Digital Economy Report 2025, IMDA NAIIP 2026, O*NET, Felten AIOE, Pizzinelli/IMF, Anthropic observed usage, Eloundou GPT exposure, ILO occupational exposure, SOL 2026, Jobs in Demand 2025</p>
			</div>
			<a href="/methodology" class="mt-3 inline-block text-sm text-primary underline">Full methodology &rarr;</a>
		</div>
	</div>

	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Release Metadata</p>
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
								<Table.Cell class="font-mono text-[11px] text-muted-foreground">
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
				<a href="/data/claims-matrix-v4.json" download class="text-primary underline">claims matrix</a>
				with evidence-strength labels and source keys.
			</p>
		</div>
	</div>

	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Raw Data Health</p>
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
				The employment estimate and wage-pool proxy are intentionally separated. The first is an Est. Singapore allocation from official sub-major totals; the second is a BLS-weighted proxy used only for wage-pool views. Separate live worker-profile context comes from Labour Force 2024 Section D and wages-by-sex tables.
			</p>
			<p class="mt-2 text-xs text-muted-foreground">
				Current labour evidence is also published separately in the Singapore context pack so the
				structural score and the monitor can be audited independently.
			</p>
		</div>
	</div>

	<Alert.Root class="mt-4 border-risk-moderate-border bg-risk-moderate-subtle text-foreground/80 [&>svg]:text-risk-moderate">
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
		<Alert.Title class="text-foreground">A note on data quality</Alert.Title>
		<Alert.Description class="text-foreground/80">
			All scores are deterministic and reproducible. The scoring pipeline uses no LLM in the loop, and every displayed proxy or estimate now carries an explicit basis and evidence tier in the dataset.
		</Alert.Description>
	</Alert.Root>

	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Source Registry</p>
		<div class={card({ padding: 'lg' })}>
			<p class="mb-3 text-sm text-muted-foreground">
				Live sources are in the current pipeline. Available sources are already in the repo or public backlog but not yet active in the live score.
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
	</div>

	<!-- Data Dictionary -->
	<div class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Data Dictionary</p>
		<div class={card({ padding: 'lg' })}>
			<p class="text-sm text-muted-foreground mb-3">Key fields in the dataset. See the <a href="/methodology" class="text-primary underline">methodology page</a> for derivation details.</p>
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="text-xs uppercase tracking-wider">Field</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Type</Table.Head>
							<Table.Head class="text-xs uppercase tracking-wider">Description</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each fields as field}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{field.name}</Table.Cell>
								<Table.Cell class="text-xs text-muted-foreground">{field.type}</Table.Cell>
								<Table.Cell class="text-xs text-muted-foreground">{field.description}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
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
