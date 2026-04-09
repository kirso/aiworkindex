<script lang="ts">
	import {
		pageLayout,
		card,
		sectionLabel,
		title as titleStyle,
		caption,
		mono
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';

	const articleJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'V7 Release Note — Task-Concentration Exposure + Demand Persistence',
		description:
			'V7 adds task-concentration-weighted exposure (Hampole et al. 2025) and a demand-persistence proxy to the structural formula.',
		url: `${SITE.url}/reports/v7-release`,
		datePublished: '2026-04-07',
		dateModified: DATA_VINTAGE.last_updated,
		author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }
	})}<\/script>`;
</script>

<Seo
	title="V7 Release Note — Task-Concentration Exposure + Demand Persistence"
	description="V7 adds task-concentration-weighted exposure (Hampole et al. 2025) and a demand-persistence proxy to the structural formula. Release note with formula, validation, and stability metrics."
	path="/reports/v7-release"
	jsonLd={[articleJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V7 Release Note' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V7 Release Note</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">Current release</p>
		<p class="mt-1 text-sm text-muted-foreground">
			V7 is the live structural release as of {DATA_VINTAGE.last_updated}. It scores
			{DATA_VINTAGE.occupation_count} occupations and {DATA_VINTAGE.role_count} modern roles. V6 baseline
			scores are preserved in every occupation record for comparison.
		</p>
	</div>

	<section class="mt-8 space-y-6">
		<div>
			<h2 class={sectionLabel()}>What V7 changes</h2>
			<div class="mt-3 space-y-3 text-sm text-muted-foreground">
				<p>
					V7 introduces two formula changes to the V6 structural model, both grounded in recent
					research and using data already available in the pipeline:
				</p>

				<div class={cn(card({ padding: 'md' }), 'space-y-3')}>
					<div>
						<p class="font-semibold text-foreground">1. Task-concentration-weighted exposure</p>
						<p class="mt-1">
							Occupations with concentrated AI task exposure face higher displacement risk than
							those with distributed exposure (Hampole et al. 2025). V7 amplifies the base exposure
							score using a task-concentration signal derived from Anthropic task penetration data
							matched to O*NET task statements.
						</p>
						<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'mt-2 font-mono text-xs')}>
							<p>task_signal = task_exposure_concentration x task_effective_coverage</p>
							<p>exposure_v7 = clamp01(exposure x (1 + 0.20 x task_signal))</p>
						</div>
						<p class="mt-2">
							492 of {DATA_VINTAGE.occupation_count} occupations have task data. The remaining 70 receive
							<code class="text-xs">task_signal = 0</code>, preserving V6-equivalent exposure.
						</p>
					</div>

					<div class="border-t border-border pt-3">
						<p class="font-semibold text-foreground">2. Demand-persistence proxy</p>
						<p class="mt-1">
							Addresses the Imas price-elasticity critique: when AI reduces service costs, demand
							may increase enough to offset displacement. Since occupation-level elasticity data
							does not exist, V7 builds a ranked composite proxy from four existing signals.
						</p>
						<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'mt-2 font-mono text-xs')}>
							<p>
								demand_persistence = 0.4 x momentum_rank + 0.3 x vacancy_rank + 0.2 x scarcity_rank
								+ 0.1 x demand_bonus_rank
							</p>
							<p>
								demand_resilience_v7 = clamp01(base_resilience x 0.45 + demand_signal_bonus + 0.10 x
								demand_persistence)
							</p>
						</div>
						<p class="mt-2">
							This is not a measure of price elasticity. It is a demand-side counterforce proxy
							using market momentum, vacancy trends, wage scarcity, and official demand signals.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div>
			<h2 class={sectionLabel()}>Complete V7 formula</h2>
			<div class={cn(card({ padding: 'md' }), 'mt-3 font-mono text-xs space-y-1')}>
				<p>
					exposure = reliability-weighted 4-source ensemble (Felten AIOE, Anthropic, Eloundou, ILO)
				</p>
				<p>task_signal = task_exposure_concentration x task_effective_coverage</p>
				<p>exposure_v7 = clamp01(exposure x (1 + 0.20 x task_signal))</p>
				<p>bottleneck = pctile_rank(Pizzinelli theta)</p>
				<p>displacement_pressure = exposure_v7 x (1 - bottleneck)</p>
				<p>
					demand_persistence = 0.4 x mm_rank + 0.3 x vacancy_rank + 0.2 x scarcity_rank + 0.1 x
					bonus_rank
				</p>
				<p>
					demand_resilience = clamp01(base_resilience x 0.45 + demand_signal_bonus + 0.10 x
					demand_persistence)
				</p>
				<p class="font-bold">headline_risk = displacement_pressure x (1 - demand_resilience)</p>
				<p>augmentation = exposure_v7 x bottleneck x base_resilience</p>
			</div>
		</div>

		<div>
			<h2 class={sectionLabel()}>Stability metrics</h2>
			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				<div class={card({ padding: 'sm' })}>
					<p class={caption({ weight: 'semibold' })}>Median |delta risk|</p>
					<p class={cn(mono({ size: 'sm' }), 'mt-1')}>0.0077</p>
					<p class="mt-1 text-xs text-muted-foreground">Target: &lt; 0.03</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={caption({ weight: 'semibold' })}>Band flips</p>
					<p class={cn(mono({ size: 'sm' }), 'mt-1')}>
						39 / {DATA_VINTAGE.occupation_count} (6.9%)
					</p>
					<p class="mt-1 text-xs text-muted-foreground">Target: &lt; 15%</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={caption({ weight: 'semibold' })}>Spearman rank correlation</p>
					<p class={cn(mono({ size: 'sm' }), 'mt-1')}>0.9995</p>
					<p class="mt-1 text-xs text-muted-foreground">Target: &gt; 0.95</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={caption({ weight: 'semibold' })}>Directional accuracy</p>
					<p class={cn(mono({ size: 'sm' }), 'mt-1')}>100% (2/2 pairwise)</p>
					<p class="mt-1 text-xs text-muted-foreground">Target: &ge; 50%</p>
				</div>
			</div>
		</div>

		<div>
			<h2 class={sectionLabel()}>Validation</h2>
			<p class="mt-3 text-sm text-muted-foreground">
				V7 passes 166 of 169 structural validation checks. All 6 anchor occupations pass (Software
				Developer, Data Entry Clerk, Surgeon, Telemarketer, Registered Nurse, Data Scientist). The 3
				pre-existing failures (crosswalk coverage threshold, software developer crosswalk type,
				experimental release status) are unchanged from V6.
			</p>
		</div>

		<div>
			<h2 class={sectionLabel()}>Research grounding</h2>
			<ul class="mt-3 list-disc pl-5 space-y-2 text-sm text-muted-foreground">
				<li>
					<span class="font-medium text-foreground">Hampole et al. (2025)</span> — Task concentration
					predicts displacement vulnerability. Occupations where AI penetration is concentrated in a few
					high-weight tasks face greater structural pressure than those with distributed exposure.
				</li>
				<li>
					<span class="font-medium text-foreground">Imas / Silicon Canals (2026)</span> — Price elasticity
					of demand is the critical missing variable for predicting actual displacement. V7 addresses
					this with a demand-persistence proxy, not a direct elasticity measure.
				</li>
				<li>
					<span class="font-medium text-foreground">Brookings (2026)</span> — Career pathway erosion when
					gateway occupations are automated. Informs the transition-capacity layer (separate from headline
					score).
				</li>
			</ul>
		</div>

		<div>
			<h2 class={sectionLabel()}>Data and downloads</h2>
			<p class="mt-3 text-sm text-muted-foreground">
				V7 dataset is available at <a href="/data" class="text-primary hover:underline">/data</a>
				in JSON and CSV formats. V6 baseline scores are preserved in the
				<code class="text-xs">baseline_v6</code>
				field of every occupation record. New V7 fields: <code class="text-xs">task_signal</code>,
				<code class="text-xs">demand_persistence</code>, <code class="text-xs">exposure_v7</code>.
			</p>
		</div>
	</section>
</main>
