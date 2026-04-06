<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { riskBandLabels } from '$lib/data';
	import {
		pageLayout,
		card,
		sectionLabel,
		title as titleStyle,
		display,
		riskBadge,
		pill,
		caption,
		mono,
		scoreTileClasses
	} from '$lib/design-system';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildGlobalOccupationAlternates } from '$lib/data/occupation-alternates';
	import { cn } from '$lib/utils';

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

	<div class={cn(card({ padding: 'lg' }), 'mt-6 overflow-hidden')}>
		<div class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
			<div
				class={cn('rounded-2xl border p-5', scoreTileClasses(data.occupation.structuralBand))}
				role="figure"
				aria-label={`Structural pressure ${(data.occupation.structuralPressure * 100).toFixed(0)}%, rated ${riskBandLabels[data.occupation.structuralBand]}`}
			>
				<p class="text-xs uppercase tracking-wide text-muted-foreground">Structural pressure</p>
				<p class={cn(display({ size: 'xl' }), 'mt-2')}>
					{(data.occupation.structuralPressure * 100).toFixed(0)}%
				</p>
				<span class={cn(riskBadge({ band: data.occupation.structuralBand }), 'mt-2 inline-flex')}>
					{riskBandLabels[data.occupation.structuralBand]} Risk
				</span>
			</div>

			<div class="min-w-0">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div class="min-w-0">
						<h1 class={titleStyle({ size: 'page' })}>{data.occupation.canonicalTitle}</h1>
						<div class="mt-1.5 flex flex-wrap items-center gap-2">
							<span class={pill({ tone: 'muted' })}>Global structural baseline</span>
							<span class={pill({ tone: 'muted' })}>ISCO {data.occupation.canonicalCode}</span>
							<span class={pill({ tone: 'muted' })}>
								Mapped from {data.occupation.sourceOccupationCount} occupations
							</span>
						</div>
						<p class="mt-3 max-w-3xl text-[15px] leading-relaxed text-text-secondary">
							This page shows the shared structural baseline only. It is comparable across countries
							because it uses the canonical ISCO-08 spine and excludes country-specific wages,
							demand offsets, and policy effects.
						</p>
						<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
							<span class={cn(mono({ size: 'md' }), 'text-muted-foreground')}>
								Exposure: {(data.occupation.exposure * 100).toFixed(1)}%
							</span>
							<span class={caption()}>Bottleneck: {(data.occupation.bottleneck * 100).toFixed(1)}%</span>
							<span class={caption()}>Confidence {data.occupation.confidenceLevel}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

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
