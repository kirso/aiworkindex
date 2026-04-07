<script lang="ts">
	import { pageLayout, card, sectionLabel, title as titleStyle, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
</script>

<Seo
	title="V6 Release Note"
	description="Archived release note for the V6 two-axis structural model. V6 introduced the deterministic 4-source exposure ensemble, human bottleneck, and explicit demand resilience separation."
	path="/reports/v6-release"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V6 Release Note' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V6 Release Note</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">Archived</p>
		<p class="mt-1 text-sm text-muted-foreground">
			V6 was the live structural release from 1 Apr 2026 to 7 Apr 2026. It has been superseded by
			<a href="/reports/v7-release" class="text-primary hover:underline">V7</a>, which adds
			task-concentration-weighted exposure and a demand-persistence proxy. V6 baseline scores are
			preserved in every V7 occupation record for auditability.
		</p>
	</div>

	<section class="mt-8 space-y-6">
		<div>
			<h2 class={sectionLabel()}>What V6 introduced</h2>
			<div class="mt-3 space-y-3 text-sm text-muted-foreground">
				<p>
					V6 replaced the single-axis market modifier with a two-axis structural formula separating
					displacement pressure from demand resilience:
				</p>
				<div class={cn(card({ padding: 'sm' }), 'font-mono text-xs')}>
					<p>headline_risk = displacement_pressure x (1 - demand_resilience)</p>
					<p class="mt-1">displacement_pressure = exposure x (1 - bottleneck)</p>
					<p>demand_resilience = min(1, base_resilience x 0.45 + demand_signal_bonus)</p>
				</div>
				<p>Key changes from V5:</p>
				<ul class="list-disc pl-5 space-y-1">
					<li>Deterministic 4-source exposure ensemble (Felten AIOE, Anthropic, Eloundou, ILO) with reliability weighting per Frank et al. (2025)</li>
					<li>Explicit demand resilience as a separate axis rather than collapsed into a market modifier</li>
					<li>Occupation-level industry-footprint momentum where available, falling back to group prior</li>
					<li>Pure confidence scoring with policy caps for fallback mappings and contested signals</li>
					<li>Statistical uncertainty intervals via 5,000-sample Monte Carlo bootstrap</li>
					<li>Task-primitives sidecar (computed but not used in headline score)</li>
				</ul>
			</div>
		</div>

		<div>
			<h2 class={sectionLabel()}>Validation</h2>
			<p class="mt-3 text-sm text-muted-foreground">
				V6 passed 165 of 169 structural validation checks. Cluster-level backtesting achieved 2/4
				directional accuracy with 100% pairwise directional accuracy. The BLS cross-country
				validation showed negative correlation between risk and employment projections, consistent
				with the structural pressure interpretation.
			</p>
		</div>

		<div>
			<h2 class={sectionLabel()}>Superseded by V7</h2>
			<p class="mt-3 text-sm text-muted-foreground">
				V7 builds on V6 by wiring task-concentration data (previously a sidecar) into the headline
				exposure formula and adding a demand-persistence proxy to demand resilience. V6 scores are
				preserved as <code class="text-xs">baseline_v6</code> in every occupation record.
				See the <a href="/reports/v7-release" class="text-primary hover:underline">V7 release note</a>
				and <a href="/data" class="text-primary hover:underline">data downloads</a> for the archived V6 dataset.
			</p>
		</div>
	</section>
</main>
