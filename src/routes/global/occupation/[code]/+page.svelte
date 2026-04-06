<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ScoreMetricGrid from '$lib/components/ui/ScoreMetricGrid.svelte';
	import EvidenceModuleGrid from '$lib/components/ui/EvidenceModuleGrid.svelte';
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { countryConfigs } from '$lib/data/country-config';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildGlobalOccupationAlternates } from '$lib/data/occupation-alternates';

	let { data } = $props();
	const alternates = $derived(buildGlobalOccupationAlternates(data.occupation.canonicalCode));
</script>

<Seo
	title={`${data.occupation.canonicalTitle} — Global structural baseline`}
	description={`${data.occupation.canonicalTitle}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(1)}%, exposure ${(data.occupation.exposure * 100).toFixed(1)}%, bottleneck ${(data.occupation.bottleneck * 100).toFixed(1)}%, confidence ${data.occupation.confidenceLevel}.`}
	path={`/global/occupation/${data.occupation.canonicalCode}`.replace('//', '/')}
	alternates={alternates}
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

	<ScoreMetricGrid
		class="mt-6"
		metrics={[
			{
				label: 'Structural pressure',
				value: `${(data.occupation.structuralPressure * 100).toFixed(1)}%`
			},
			{ label: 'Exposure', value: `${(data.occupation.exposure * 100).toFixed(1)}%` },
			{ label: 'Bottleneck', value: `${(data.occupation.bottleneck * 100).toFixed(1)}%` },
			{ label: 'Confidence', value: data.occupation.confidenceLevel }
		]}
	/>

	<section class="mt-8">
		<p class={sectionLabel()}>Why this score</p>
		<div class={card({ padding: 'sm' })}>
			<p class="text-sm text-muted-foreground">
				{globalMethodology.structuralFormula}. The global page stops at the shared structural
				baseline so it stays comparable across countries and does not imply local wages, demand
				offsets, or policy effects.
			</p>
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
		<EvidenceModuleGrid class="mt-3" country={countryConfigs.global} />
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
