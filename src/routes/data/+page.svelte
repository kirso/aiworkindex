<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE } from '$lib/data/scoring-constants';

	const fields = [
		{ name: 'ssoc', type: 'string', description: 'Singapore Standard Occupational Classification code (4-digit)' },
		{ name: 'title', type: 'string', description: 'Occupation title from MOM classification' },
		{ name: 'major_group', type: 'string', description: 'Major occupational group key (e.g., professionals, managers)' },
		{ name: 'gross_wage_median', type: 'number', description: 'Median gross monthly wage in SGD (MOM 2024)' },
		{ name: 'gross_wage_25th', type: 'number', description: '25th percentile gross monthly wage in SGD' },
		{ name: 'gross_wage_75th', type: 'number', description: '75th percentile gross monthly wage in SGD' },
		{ name: 'exposure', type: 'number', description: 'AI technical exposure score (0-1). Based on AIOE index mapping to SSOC via ISCO crosswalk' },
		{ name: 'bottleneck', type: 'number', description: 'Human bottleneck strength (0-1). Higher = stronger human advantage from judgment, creativity, interpersonal skills' },
		{ name: 'net_risk', type: 'number', description: 'Net displacement risk (0-1). Formula: exposure × (1 - bottleneck) × market_modifier' },
		{ name: 'risk_band', type: 'enum', description: 'Categorical risk: very_low (<5%), low (<15%), moderate (<30%), high (<50%), very_high (≥50%)' },
		{ name: 'augmentation', type: 'number', description: 'Augmentation potential (0-1). How much AI can enhance (not replace) this role' },
		{ name: 'impact_type', type: 'enum', description: 'ai_leveraged | at_risk | stable | mixed — based on exposure and bottleneck thresholds' },
		{ name: 'market.market_momentum', type: 'number', description: 'Employment growth trend (0-1)' },
		{ name: 'market.occupation_scarcity', type: 'number', description: 'Labour shortage signal (0-1). Derived from SOL and Jobs in Demand lists' },
		{ name: 'market.market_resilience', type: 'number', description: 'Combined market buffer (0-1). Higher = stronger demand protection' },
		{ name: 'evidence.anthropic_calibrated', type: 'boolean', description: 'Whether Anthropic observed usage data is available for this occupation' },
		{ name: 'evidence.anthropic_gap', type: 'number|null', description: 'Percentile gap: observed AI usage minus theoretical exposure. Positive = more adoption than theory predicts' },
		{ name: 'evidence.sol_match', type: 'string|false', description: 'Shortage Occupation List match: "exact", "prefix", or false' },
		{ name: 'evidence.jobs_in_demand_match', type: 'string|false', description: 'Jobs in Demand (MOM 2025) match: "exact", "prefix", or false' },
		{ name: 'confidence.score', type: 'number', description: 'Overall estimate confidence (0-1). Combines crosswalk quality, market data, and source freshness' },
		{ name: 'confidence.level', type: 'enum', description: 'high | medium | low — categorical confidence' },
		{ name: 'stability.label', type: 'enum', description: 'stable | watch | sensitive — how much the risk band changes under ±5pt stress test' }
	];
</script>

<svelte:head>
	<title>Data Downloads — SG AI Occupation Index</title>
	<meta name="description" content="Download the complete Singapore AI occupation impact dataset. 562 occupations with exposure, bottleneck, risk, and market scores." />
	<meta property="og:title" content="Data Downloads — SG AI Occupation Index" />
	<meta property="og:description" content="Download the full dataset: 562 Singapore occupations scored for AI displacement risk." />
</svelte:head>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Data Downloads</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		The complete dataset behind this index is open. Download, analyze, and build on it. MIT licensed.
	</p>

	<!-- Download Cards -->
	<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Downloads</p>
	<div class="grid gap-4 sm:grid-cols-3">
		<a href="/data/sg-ai-occupations-2024.csv" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-risk-very-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">CSV Download</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">562 occupations, all fields. Best for spreadsheets and data analysis.</p>
				<span class="mt-2 text-xs text-primary">sg-ai-occupations-2024.csv</span>
			</div>
		</a>

		<a href="/data/sg-ai-occupations-v3.json" download class="no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex h-full flex-col items-start')}>
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7,10 12,15 17,10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span class="text-base font-semibold text-foreground">JSON Download</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">Full structured data with all nested fields. Best for programmatic use.</p>
				<span class="mt-2 text-xs text-primary">sg-ai-occupations-v3.json</span>
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
				<p class="mt-1 text-sm text-muted-foreground">Full source code, scoring pipeline, and raw data. Open source on GitHub.</p>
				<span class="mt-2 text-xs text-primary">{SITE.github.replace('https://', '')}</span>
			</div>
		</a>
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
							<Table.Cell class="font-medium">V3.1 (Current)</Table.Cell>
							<Table.Cell class="text-muted-foreground">March 2026</Table.Cell>
							<Table.Cell class="text-muted-foreground">562</Table.Cell>
							<Table.Cell>
								<a href="/data/sg-ai-occupations-v3.json" download class="text-xs text-primary underline">JSON</a>
								<span class="mx-1 text-muted-foreground">&middot;</span>
								<a href="/data/sg-ai-occupations-2024.csv" download class="text-xs text-primary underline">CSV</a>
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
				<p><span class="font-medium text-foreground">Version:</span> V3.1 (three-layer scoring: exposure, bottleneck, market resilience)</p>
				<p><span class="font-medium text-foreground">Data vintage:</span> 2024 wages, 2024/2025 demand signals</p>
				<p><span class="font-medium text-foreground">Occupations:</span> 562 SSOC-coded occupations</p>
				<p><span class="font-medium text-foreground">Sources:</span> MOM Singapore, Felten et al. AIOE, Pizzinelli/IMF, Anthropic observed usage, SOL 2026, Jobs in Demand 2025</p>
			</div>
			<a href="/methodology" class="mt-3 inline-block text-sm text-primary underline">Full methodology &rarr;</a>
		</div>
	</div>

	<Alert.Root class="mt-4 border-risk-moderate-border bg-risk-moderate-subtle text-foreground/80 [&>svg]:text-risk-moderate">
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
		<Alert.Title class="text-foreground">A note on data quality</Alert.Title>
		<Alert.Description class="text-foreground/80">
			All scores are deterministic and reproducible.
			The scoring pipeline uses no LLM in the loop — avoiding the circularity of using AI to score AI replaceability.
			Every input traces to a published academic index or government dataset.
		</Alert.Description>
	</Alert.Root>

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
