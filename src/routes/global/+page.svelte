<script lang="ts">
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { globalMethodology } from '$lib/data/global-methodology';
</script>

<Seo
	title="Global AI and Jobs Economics Context | AI Work Index"
	description="Global research context on AI exposure, adoption, productivity and employment. No global occupation scores are currently published."
	path="/global"
/>

<main class={pageLayout({ width: 'content' })}>
	<div class="max-w-3xl">
		<p class={sectionLabel()}>Global</p>
		<h1 class={titleStyle({ size: 'page' })}>AI and jobs research context</h1>
		<p class="mt-4 text-base text-muted-foreground">
			Global evidence helps explain mechanisms—task change, adoption, productivity, hiring and
			worker transitions—but it is not a scored labour market. Global occupation scores are
			withdrawn until country-level denominators and local validation are available.
		</p>
	</div>

	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-6')}>
		<p class="text-sm font-semibold text-foreground">Release boundary</p>
		<p class="mt-1 text-sm text-text-secondary">
			Singapore is the only live scored market in V8. Cross-country research can inform
			interpretation, but it cannot substitute for local occupation definitions, wages, demand,
			adoption and institutions.
		</p>
		<p class="mt-2 text-xs text-muted-foreground">
			<a href="/methodology" class="text-primary hover:underline">Full methodology</a>
		</p>
	</div>

	<section class="mt-8">
		<p class={sectionLabel()}>Country evidence inventory</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			{#each globalMethodology.countryReadiness as country}
				<article class={card({ padding: 'sm' })}>
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold text-foreground">{country.title}</p>
						<span
							class="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
						>
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

	<PageFooterNav />
</main>
