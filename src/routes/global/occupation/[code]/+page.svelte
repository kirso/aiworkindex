<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { buildCountryModuleStatuses } from '$lib/data/country-modules';
	import { countryConfigs } from '$lib/data/country-config';

	let { data } = $props();

	const moduleStates = buildCountryModuleStatuses(countryConfigs.global);
</script>

<Seo
	title={`${data.occupation.canonicalTitle} — Global structural baseline`}
	description={`${data.occupation.canonicalTitle}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(1)}%, exposure ${(data.occupation.exposure * 100).toFixed(1)}%, bottleneck ${(data.occupation.bottleneck * 100).toFixed(1)}%, confidence ${data.occupation.confidenceLevel}.`}
	path={`/global/occupation/${data.occupation.canonicalCode}`.replace('//', '/')}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Global', href: '/global' },
			{ label: data.occupation.canonicalTitle }
		]}
	/>

	<section class="max-w-3xl">
		<p class={sectionLabel()}>Global occupation profile</p>
		<h1 class={titleStyle({ size: 'page' })}>{data.occupation.canonicalTitle}</h1>
		<p class="mt-4 text-base text-muted-foreground">
			This page shows the shared structural baseline only. It is comparable across countries
			because it uses the canonical ISCO-08 spine and excludes country-specific wages, demand
			offsets, and policy effects.
		</p>
		<p class="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
			ISCO-08 code {data.occupation.canonicalCode} · mapped from {data.occupation.sourceOccupationCount}
			official occupations
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
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Exposure</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.occupation.exposure * 100).toFixed(1)}%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Bottleneck</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.occupation.bottleneck * 100).toFixed(1)}%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{data.occupation.confidenceLevel}</p>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Structural footprint</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Mapped occupations</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.occupation.structuralFootprint.toLocaleString()} source occupations roll up into this
					canonical occupation.
				</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Source codes</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.occupation.sourceOccupationCodes.join(' · ')}
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Evidence layers</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each moduleStates.filter((module) => module.available) as module}
				<div class={card({ padding: 'sm' })}>
					<p class="text-sm font-semibold text-foreground">{module.title}</p>
					<p class="mt-1 text-sm text-muted-foreground">{module.publishedDescription}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Method contract</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Shared spine</p>
				<p class="mt-1 text-sm text-muted-foreground">{data.methodology.structuralFormula}</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Country layer</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{data.methodology.localFormula}. Country headline risk is not shown here.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>What is not shown</p>
		<div class={card({ padding: 'sm', variant: 'notice', accent: 'moderate' })}>
			<p class="text-sm text-muted-foreground">
				This global page does not publish wages, labour monitor context, policy overlays, or local
				demand offsets. Those belong in country pages only.
			</p>
		</div>
	</section>
</main>
