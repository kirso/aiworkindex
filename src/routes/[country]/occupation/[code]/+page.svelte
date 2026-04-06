<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildCountryModuleStatuses } from '$lib/data/country-modules';
	import { cn } from '$lib/utils';

	let { data } = $props();

	const moduleStates = $derived(buildCountryModuleStatuses(data.country));
</script>

<Seo
	title={`${data.occupation.localTitle} — ${data.country.displayName}`}
	description={`${data.occupation.localTitle} in ${data.country.name}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(1)}%, headline risk ${(data.occupation.headlineRisk * 100).toFixed(1)}%, confidence ${data.occupation.confidenceLevel}.`}
	path={`${data.country.routePrefix}/occupation/${data.occupation.localCode}`.replace('//', '/')}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: data.country.name, href: data.country.routePrefix },
			{ label: data.occupation.localTitle }
		]}
	/>

	<section class="max-w-3xl">
		<p class={sectionLabel()}>Occupation Index</p>
		<h1 class={titleStyle({ size: 'page' })}>{data.occupation.localTitle}</h1>
		<p class="mt-3 text-base text-muted-foreground">
			{data.country.displayName} tracks this occupation on the shared structural baseline and then
			layers on local demand resilience, wages, and confidence. The comparison spine stays fixed
			across countries.
		</p>
		<p class="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
			{data.country.classificationSystem} · code {data.occupation.localCode}
			{#if data.occupation.canonicalCode}
				· canonical {data.occupation.canonicalCode}
			{/if}
		</p>
	</section>

	<section class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Structural pressure</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.occupation.structuralPressure * 100).toFixed(1)}%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Headline risk</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.occupation.headlineRisk * 100).toFixed(1)}%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Demand resilience</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{data.occupation.demandResilience != null
					? `${(data.occupation.demandResilience * 100).toFixed(1)}%`
					: 'n/a'}
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{data.occupation.confidenceLevel}</p>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Country layer</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Wage context</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Median wage:
					{#if data.occupation.wage != null}
						{data.occupation.currency} {data.occupation.wage.toLocaleString()}
					{:else}
						not published
					{/if}
				</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Mapping quality</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.occupation.mappingMethod ?? 'n/a'}
					{#if data.occupation.employment}
						· employment series present
					{/if}
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Evidence layers</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each moduleStates as module}
				<div class={card({ padding: 'sm', variant: module.available ? 'default' : 'notice', accent: module.available ? 'primary' : 'moderate' })}>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">{module.title}</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{module.available ? module.publishedDescription : module.unavailableDescription}
							</p>
						</div>
						<span class="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
							{module.available ? 'Published' : 'Hidden'}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Evidence</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Method contract</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{globalMethodology.structuralFormula} and {globalMethodology.localFormula}
				</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Source vintage</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.country.status === 'live'
						? 'Live reference market'
						: data.country.status === 'ready'
							? 'Ready for launch'
							: 'Research only'}
				</p>
			</div>
		</div>
	</section>

	{#if data.occupation.employment}
		<section class="mt-8">
			<p class={sectionLabel()}>Employment outlook</p>
			<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
				<p class="text-sm text-muted-foreground">
					{#if data.occupation.employment.current != null}
						Current employment: {data.occupation.employment.current.toLocaleString()}
					{/if}
					{#if data.occupation.employment.projected != null}
						{data.occupation.employment.current != null ? ' · ' : ''}
						Projected employment: {data.occupation.employment.projected.toLocaleString()}
					{/if}
					{#if data.occupation.employment.openings != null}
						{data.occupation.employment.current != null ||
						data.occupation.employment.projected != null
							? ' · '
							: ''}
						Openings: {data.occupation.employment.openings.toLocaleString()}
					{/if}
					{#if data.occupation.employment.projectedChangePct != null}
						{data.occupation.employment.current != null ||
						data.occupation.employment.projected != null ||
						data.occupation.employment.openings != null
							? ' · '
							: ''}
						Projected change: {data.occupation.employment.projectedChangePct.toFixed(1)}%
					{/if}
				</p>
			</div>
		</section>
	{/if}

	<section class="mt-8">
		<p class={sectionLabel()}>Published limitations</p>
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
			<p class="text-sm text-muted-foreground">
				This page shows the local country layer, not realised individual job outcomes. The global
				structural baseline is shared across countries; only the local demand and wage layer changes
				here.
			</p>
		</div>
	</section>
</main>
