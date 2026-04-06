<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { riskBandLabels } from '$lib/data';
	import { pageLayout, card, sectionLabel } from '$lib/design-system';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildGlobalOccupationAlternates } from '$lib/data/occupation-alternates';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';

	let { data } = $props();
	const alternates = $derived(buildGlobalOccupationAlternates(data.occupation.canonicalCode));

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${data.occupation.canonicalTitle} — Global structural baseline`,
					text: `${data.occupation.canonicalTitle}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: data.occupation.canonicalTitle });
		} catch {}
	}
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

	<div class={cn(card({ padding: 'lg' }), 'mt-6')}>
		<OccupationHero
			scoreLabel="Structural pressure"
			scoreValue={`${(data.occupation.structuralPressure * 100).toFixed(0)}%`}
			scoreBand={data.occupation.structuralBand}
			scoreBandLabel={riskBandLabels[data.occupation.structuralBand]}
			title={data.occupation.canonicalTitle}
			pills={[
				{ label: 'Global structural baseline', tone: 'muted' },
				{ label: `ISCO ${data.occupation.canonicalCode}`, tone: 'outline' },
				{ label: `Mapped from ${data.occupation.sourceOccupationCount} occupations`, tone: 'neutral' }
			]}
			summary="This page shows the shared structural baseline only. It is comparable across countries because it uses the canonical ISCO-08 spine and excludes country-specific wages, demand offsets, and policy effects."
			meta={[
				`Exposure: ${(data.occupation.exposure * 100).toFixed(1)}%`,
				`Bottleneck: ${(data.occupation.bottleneck * 100).toFixed(1)}%`,
				`Confidence ${data.occupation.confidenceLevel}`
			]}
		>
			{#snippet actions()}
				<Button variant="outline" size="sm" class="h-8 text-xs" onclick={shareCurrentPage}>
					Share
				</Button>
			{/snippet}
		</OccupationHero>
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
