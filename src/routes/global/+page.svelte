<script lang="ts">
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { countryConfigs } from '$lib/data/country-config';
	import { globalMethodology } from '$lib/data/global-methodology';
</script>

<Seo
	title={countryConfigs.global.seoTitle}
	description={countryConfigs.global.seoDescription}
	path="/global"
/>

<main class={pageLayout({ width: 'content' })}>
	<div class="max-w-3xl">
		<p class={sectionLabel()}>Global</p>
		<h1 class={titleStyle({ size: 'page' })}>Structural baseline</h1>
		<p class="mt-4 text-base text-muted-foreground">
			Comparable AI pressure scores for every occupation, before country-specific wages or demand
			data. Country pages add local evidence on top.
		</p>
	</div>

	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-6')}>
		<p class="text-sm font-semibold text-foreground">Core formula</p>
		<p class="mt-1 font-mono text-sm text-text-secondary">
			{globalMethodology.structuralFormula}
		</p>
		<p class="mt-1 font-mono text-sm text-text-secondary">
			{globalMethodology.localFormula}
		</p>
		<p class="mt-2 text-xs text-muted-foreground">
			<a href="/methodology" class="text-primary hover:underline">Full methodology</a>
		</p>
	</div>

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
				</article>
			{/each}
		</div>
	</section>

	<div class="mt-8 flex flex-wrap gap-3 text-sm">
		<a href="/methodology" class="text-primary hover:underline">Methodology</a>
		<a href="/data" class="text-primary hover:underline">Data</a>
		<a href="/about" class="text-primary hover:underline">About</a>
	</div>
</main>
