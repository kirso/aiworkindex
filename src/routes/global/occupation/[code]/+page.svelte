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
	import {
		pageLayout,
		card,
		section,
		sectionLabel,
		title as titleStyle,
		body,
		caption,
		mono
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import {
		buildGlobalOccupationAlternates,
		findSingaporeEquivalent,
		findUnitedStatesEquivalent
	} from '$lib/data/occupation-alternates';

	let { data } = $props();
	const alternates = $derived(buildGlobalOccupationAlternates(data.occupation.canonicalCode));
	const sgEquivalent = $derived(findSingaporeEquivalent(data.occupation.canonicalCode));
	const usEquivalent = $derived(findUnitedStatesEquivalent(data.occupation.canonicalCode));

	const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
	const pressureBarClass = (v: number) =>
		v >= 0.5 ? 'bg-risk-very-high' : v >= 0.3 ? 'bg-risk-high' : v >= 0.15 ? 'bg-risk-moderate' : 'bg-risk-very-low';
	const confidenceBarClass = (v: number) =>
		v >= 0.7 ? 'bg-risk-very-low' : v >= 0.4 ? 'bg-risk-moderate' : 'bg-risk-high';

	const structuralSignals = $derived<SignalProfileItem[]>([
		{
			label: 'Exposure',
			value: `${(data.occupation.exposure * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.exposure),
			barClass: pressureBarClass(data.occupation.exposure),
			note: 'Weighted AI task overlap from the shared ISCO-08 spine'
		},
		{
			label: 'Bottleneck',
			value: `${(data.occupation.bottleneck * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.bottleneck),
			barClass: confidenceBarClass(data.occupation.bottleneck),
			note: 'Human coordination and physical presence protection'
		},
		{
			label: 'Structural pressure',
			value: `${(data.occupation.structuralPressure * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.structuralPressure),
			barClass: pressureBarClass(data.occupation.structuralPressure),
			note: 'exposure × (1 − bottleneck)'
		}
	]);

	const confidenceSignals = $derived<SignalProfileItem[]>([
		{
			label: 'Crosswalk quality',
			value: `${(((data.occupation.confidence.crosswalk_quality ?? 0)) * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.confidence.crosswalk_quality ?? 0),
			barClass: confidenceBarClass(data.occupation.confidence.crosswalk_quality ?? 0)
		},
		{
			label: 'Source coverage',
			value: `${((data.occupation.confidence.source_coverage ?? 0) * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.confidence.source_coverage ?? 0),
			barClass: confidenceBarClass(data.occupation.confidence.source_coverage ?? 0)
		},
		{
			label: 'Signal agreement',
			value: `${((data.occupation.confidence.signal_agreement ?? 0) * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.confidence.signal_agreement ?? 0),
			barClass: confidenceBarClass(data.occupation.confidence.signal_agreement ?? 0)
		},
		{
			label: 'Source freshness',
			value: `${((data.occupation.confidence.source_freshness ?? 0) * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.confidence.source_freshness ?? 0),
			barClass: confidenceBarClass(data.occupation.confidence.source_freshness ?? 0)
		},
		{
			label: 'Sensitivity',
			value: `${((data.occupation.confidence.sensitivity ?? 0) * 100).toFixed(0)}%`,
			barValue: clamp01(data.occupation.confidence.sensitivity ?? 0),
			barClass: confidenceBarClass(data.occupation.confidence.sensitivity ?? 0)
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

	<!-- ===== BLOCK 1: THE VERDICT ===== -->
	<div class={cn(card({ padding: 'lg' }), section({ spacing: 'loose' }))}>
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

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-primary"></span>
			Why This Score
		</h2>
		<div class={card({ padding: 'md' })}>
			<SignalProfileGrid items={structuralSignals} columns={3} />
			<p class={cn(caption(), 'mt-4')}>
				structural_pressure = exposure × (1 − bottleneck).
				Comparable exposure and bottleneck are blended on the canonical spine; local labour-market
				context is intentionally excluded here.
				<a href="/methodology" class="text-primary hover:underline">How this works</a>
			</p>
			<div class="mt-4 pt-4 border-t border-border grid gap-4 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Structural footprint</p>
					<p class={body({ tone: 'muted' })}>
						{data.occupation.structuralFootprint.toLocaleString()} source occupations roll up into this
						canonical occupation.
					</p>
					<p class={cn(mono({ size: 'sm' }), 'mt-2 text-muted-foreground')}>
						{data.occupation.sourceOccupationCodes.join(' · ')}
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Comparable spine</p>
					<p class={body({ tone: 'muted' })}>
						The canonical ISCO-08 occupation keeps the score comparable across countries while the
						local layers remain separate.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 3: EVIDENCE QUALITY ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-impact-leveraged"></span>
			Evidence Quality
		</h2>
		<div class={card({ padding: 'md' })}>
			<SignalProfileGrid items={confidenceSignals} columns={3} />
			<div class="mt-4 pt-4 border-t border-border grid gap-4 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Exposure sources</p>
					<p class={body({ tone: 'muted' })}>
						{data.occupation.confidence.exposure_source_count} source families contribute to the
						exposure estimate for this occupation.
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Confidence level</p>
					<p class={body({ tone: 'muted' })}>
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

	<!-- ===== BLOCK 4: COUNTRY VIEWS ===== -->
	{#if sgEquivalent || usEquivalent}
		<section class={section({ spacing: 'loose' })}>
			<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
				<span class="h-4 w-1 rounded-full bg-risk-very-low"></span>
				Country Views
			</h2>
			<div class={card({ padding: 'md' })}>
				<div class="grid gap-4 sm:grid-cols-2">
					{#if sgEquivalent}
						<a
							href={`/occupation/${sgEquivalent}`}
							class={cn(
								card({ padding: 'sm', variant: 'inset' }),
								'block hover:bg-accent hover:shadow-sm transition-all group'
							)}
						>
							<p class={cn(body(), 'font-medium text-foreground')}>
								Singapore view
								<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
							</p>
							<p class={cn(caption(), 'mt-1')}>
								Open the live reference market view with wages, labour monitor, and transition pathways.
							</p>
							<p class={cn(mono({ size: 'sm' }), 'mt-2 text-muted-foreground')}>SSOC {sgEquivalent}</p>
						</a>
					{/if}
					{#if usEquivalent}
						<a
							href={`/us/occupation/${usEquivalent}`}
							class={cn(
								card({ padding: 'sm', variant: 'inset' }),
								'block hover:bg-accent hover:shadow-sm transition-all group'
							)}
						>
							<p class={cn(body(), 'font-medium text-foreground')}>
								United States view
								<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
							</p>
							<p class={cn(caption(), 'mt-1')}>
								US occupation layer with BLS wages, O*NET tasks, and employment projections.
							</p>
							<p class={cn(mono({ size: 'sm' }), 'mt-2 text-muted-foreground')}>SOC {usEquivalent}</p>
						</a>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== TECHNICAL DETAILS (collapsible) ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), section({ spacing: 'loose' }))}>
		<Collapsible.Trigger
			class={cn(
				sectionLabel(),
				'flex w-full items-center justify-between px-5 py-3 hover:text-foreground transition-colors'
			)}
		>
			Technical Details · ISCO {data.occupation.canonicalCode}
			<svg
				class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
		</Collapsible.Trigger>
		<Collapsible.Content
			class="border-t border-border px-5 py-4 text-xs text-muted-foreground space-y-3"
		>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Method contract</p>
					<p>{globalMethodology.structuralFormula}</p>
					<p class="mt-1">{globalMethodology.localFormula}</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Source vintage</p>
					<p>{data.occupation.dataVintage}</p>
				</div>
			</div>
			<div class="pt-3 border-t border-border">
				<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>What is not shown</p>
				<p>
					This global page does not publish wages, labour monitor context, policy overlays, or local
					demand offsets. Those belong in country pages only.
				</p>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>
