<script lang="ts">
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { countryConfigs } from '$lib/data/country-config';
	import { globalMethodology } from '$lib/data/global-methodology';

	const globalCountry = countryConfigs.global;
</script>

<Seo
	title={globalCountry.seoTitle}
	description={globalCountry.seoDescription}
	path="/global"
/>

<main class={pageLayout({ width: 'content' })}>
	<div class="max-w-3xl">
		<p class={sectionLabel()}>Global Methodology</p>
		<h1 class={titleStyle({ size: 'page' })}>One structural baseline, many country layers</h1>
		<p class="mt-4 text-base text-muted-foreground">
			This page defines the scientific contract for making AI Work Index global. The global
			structural layer is the primary product spine; Singapore is the current live reference
			market, the United States layer is ready, and the same math transfers across countries
			without changing. Global occupation detail pages now live under this contract.
		</p>
	</div>

	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-6')}>
		<p class="text-sm font-semibold text-foreground">Core contract</p>
		<p class="mt-1 font-mono text-sm text-text-secondary">
			{globalMethodology.structuralFormula}
		</p>
		<p class="mt-2 font-mono text-sm text-text-secondary">
			{globalMethodology.localFormula}
		</p>
		<p class="mt-3 text-sm text-muted-foreground">{globalMethodology.summary}</p>
	</div>

	<section class="mt-8">
		<p class={sectionLabel()}>What stays global</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each globalMethodology.principles as item}
				<article class={card({ padding: 'sm' })}>
					<p class="text-sm font-semibold text-foreground">{item.title}</p>
					<p class="mt-1 text-sm text-muted-foreground">{item.description}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>What becomes local</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<article class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Demand resilience</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Each country needs its own demand signals, wage structure, and labour-market context.
				</p>
			</article>
			<article class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Policy context</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Local regulation, workforce programs, and shortage signals should be visible and labeled
					separately from the structural score.
				</p>
			</article>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Validation ladder</p>
		<div class="mt-3 space-y-3">
			{#each globalMethodology.validationLadder as item}
				<div class={card({ padding: 'sm' })}>
					<p class="text-sm font-semibold text-foreground">{item.title}</p>
					<p class="mt-1 text-sm text-muted-foreground">{item.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Country rollout</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			{#each globalMethodology.countryReadiness as country}
				<article class={card({ padding: 'sm' })}>
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold text-foreground">{country.title}</p>
						<span class="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
							{country.readiness}
						</span>
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						{country.primary_sources.join(' · ')}
					</p>
					<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
						{#each country.method_notes as note}
							<li>- {note}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Current status</p>
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
			<p class="text-sm font-semibold text-foreground">
				{countryConfigs.sg.displayName} is the current live reference implementation.
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Singapore remains the published production market while the global layer and new country
				adapters are brought up under the same contract. The United States layer is ready, global
				occupation detail pages are published, and United Kingdom and Canada remain in research
				until their local datasets are published.
			</p>
			<div class="mt-3 flex flex-wrap gap-2 text-sm">
				<a href="/methodology" class="text-primary hover:underline">Full methodology</a>
				<a href="/data" class="text-primary hover:underline">Data dictionary</a>
				<a href="/about" class="text-primary hover:underline">About</a>
			</div>
		</div>
	</section>

	<p class="mt-8 text-xs text-muted-foreground">
		Legitimate global expansion means publishing the structural baseline only once, then proving
		each country layer with local evidence, explicit confidence, and a public limitation section.
	</p>
</main>
