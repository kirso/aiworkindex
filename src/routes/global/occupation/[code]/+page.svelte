<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import SignalProfileGrid, { type SignalProfileItem } from '$lib/components/viz/SignalProfileGrid.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { countryConfigs } from '$lib/data/country-config';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { riskBandLabels } from '$lib/data';
	import { pageLayout, card, section, title as titleStyle, body, caption, mono, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { buildGlobalOccupationAlternates, findSingaporeEquivalent, findUnitedStatesEquivalent } from '$lib/data/occupation-alternates';

	let { data } = $props();
	const alternates = $derived(buildGlobalOccupationAlternates(data.occupation.canonicalCode));
	const sgEquivalent = $derived(findSingaporeEquivalent(data.occupation.canonicalCode));
	const usEquivalent = $derived(findUnitedStatesEquivalent(data.occupation.canonicalCode));

	const structuralSignals = $derived<SignalProfileItem[]>([
		{
			label: 'Exposure',
			value: `${(data.occupation.exposure * 100).toFixed(0)}%`,
			barValue: data.occupation.exposure,
			barClass: 'bg-risk-high',
			note: 'Observed task exposure and research evidence across the shared spine'
		},
		{
			label: 'Bottleneck',
			value: `${(data.occupation.bottleneck * 100).toFixed(0)}%`,
			barValue: 1 - data.occupation.bottleneck,
			barClass: 'bg-impact-leveraged',
			note: 'Higher values mean more human friction protects the occupation'
		},
		{
			label: 'Structural pressure',
			value: `${(data.occupation.structuralPressure * 100).toFixed(0)}%`,
			barValue: data.occupation.structuralPressure,
			barClass: 'bg-impact-leveraged',
			note: 'Shared ISCO-08 structural score'
		}
	]);

	const confidenceSignals = $derived<SignalProfileItem[]>([
		{
			label: 'Crosswalk quality',
			value: `${(data.occupation.confidence.crosswalk_quality * 100).toFixed(0)}%`,
			barValue: data.occupation.confidence.crosswalk_quality,
			barClass: 'bg-impact-leveraged',
			note: 'Mapping fidelity from source occupations into the canonical spine'
		},
		{
			label: 'Source coverage',
			value: `${(data.occupation.confidence.source_coverage * 100).toFixed(0)}%`,
			barValue: data.occupation.confidence.source_coverage,
			barClass: 'bg-impact-leveraged',
			note: 'How many exposure sources are present'
		},
		{
			label: 'Signal agreement',
			value: `${(data.occupation.confidence.signal_agreement * 100).toFixed(0)}%`,
			barValue: data.occupation.confidence.signal_agreement,
			barClass: 'bg-risk-moderate',
			note: 'Cross-source agreement between exposure estimates'
		},
		{
			label: 'Source freshness',
			value: `${(data.occupation.confidence.source_freshness * 100).toFixed(0)}%`,
			barValue: data.occupation.confidence.source_freshness,
			barClass: 'bg-risk-moderate',
			note: 'How recent the exposure sources are'
		},
		{
			label: 'Sensitivity',
			value: `${(data.occupation.confidence.sensitivity * 100).toFixed(0)}%`,
			barValue: data.occupation.confidence.sensitivity,
			barClass: 'bg-risk-moderate',
			note: 'How much the score moves under perturbation'
		}
	]);

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

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: countryConfigs.global.displayName, href: '/global' },
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
				{ label: countryConfigs.global.displayName, tone: 'muted' },
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

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-primary"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>Why This Score</h2>
		</div>
		<div class="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
			<div class={card({ padding: 'sm' })}>
				<SignalProfileGrid items={structuralSignals} columns={3} />
				<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-4')}>
					structural_pressure = exposure × (1 − bottleneck)
				</p>
				<p class={cn(caption(), 'mt-1')}>
					Comparable exposure and bottleneck are blended on the canonical spine; local labour-market
					context is intentionally excluded here.
				</p>
			</div>
			<div class="space-y-3">
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Footprint</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{data.occupation.structuralFootprint.toLocaleString()} mapped occupations
					</p>
					<p class={cn(caption(), 'mt-2')}>
						{data.occupation.sourceOccupationCodes.join(' · ')}
					</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Comparable spine</p>
					<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
						The canonical ISCO-08 occupation keeps the score comparable across countries while the
						local layers remain separate.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-impact-leveraged"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>Evidence Quality</h2>
		</div>
		<div class="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
			<div class={card({ padding: 'sm' })}>
				<SignalProfileGrid items={confidenceSignals} columns={3} />
			</div>
			<div class="space-y-3">
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Exposure sources</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{data.occupation.confidence.exposure_source_count} source families
					</p>
					<p class={cn(caption(), 'mt-2')}>
						Publish the score only when source coverage, crosswalk quality, and signal agreement are
						all sufficiently strong.
					</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Confidence level</p>
					<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
						{data.occupation.confidenceLevel === 'high'
							? 'The global structural record is currently stable and well covered.'
							: data.occupation.confidenceLevel === 'medium'
								? 'The score is usable, but the evidence is still mixed or less complete.'
								: 'The score remains publishable, but should be treated as low-confidence.'}
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-risk-very-low"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>Country Views</h2>
		</div>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#if sgEquivalent}
				<a href={`/occupation/${sgEquivalent}`} class="block">
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Singapore view</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
							Open the live reference market view for this occupation.
						</p>
						<p class={cn(caption(), 'mt-2')}>
							Equivalent code: <span class={mono({ size: 'sm' })}>{sgEquivalent}</span>
						</p>
					</div>
				</a>
			{/if}
			{#if usEquivalent}
				<a href={`/us/occupation/${usEquivalent}`} class="block">
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">United States view</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
							Open the US occupation layer built from BLS, O*NET, and supporting public sources.
						</p>
						<p class={cn(caption(), 'mt-2')}>
							Equivalent code: <span class={mono({ size: 'sm' })}>{usEquivalent}</span>
						</p>
					</div>
				</a>
			{/if}
		</div>
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class={cn(body({ size: 'sm', tone: 'subtle' }))}>
				Source occupation codes: <span class={mono({ size: 'sm' })}>{data.occupation.sourceOccupationCodes.join(' · ')}</span>
			</p>
		</div>
	</section>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<Collapsible.Root class={cn(card({ padding: 'none' }), section({ spacing: 'loose' }))}>
			<Collapsible.Trigger
				class={cn(
					'flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:text-foreground',
					microLabel()
				)}
			>
				Technical Details · Global baseline
				<svg
					class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="m6 9 6 6 6-6"></path>
				</svg>
			</Collapsible.Trigger>
			<Collapsible.Content class="border-t border-border px-5 py-4 space-y-4">
				<div class="grid gap-3 lg:grid-cols-2">
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Method contract</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>{globalMethodology.structuralFormula}</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-2')}>{globalMethodology.localFormula}</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Source vintage</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
							{data.occupation.dataVintage}
						</p>
						<p class={cn(caption(), 'mt-2')}>
							Global structural baseline; local demand and wage layers are intentionally excluded here.
						</p>
					</div>
				</div>

				<div class={card({ padding: 'sm', variant: 'notice', accent: 'moderate' })}>
					<p class="text-sm font-semibold text-foreground">What is not shown</p>
					<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
						This global page does not publish wages, labour monitor context, policy overlays, or local
						demand offsets. Those belong in country pages only.
					</p>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	</section>
</div>
