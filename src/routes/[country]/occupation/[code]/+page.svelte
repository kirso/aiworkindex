<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ScoreMetricGrid from '$lib/components/ui/ScoreMetricGrid.svelte';
	import EvidenceModuleGrid from '$lib/components/ui/EvidenceModuleGrid.svelte';
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildUnitedStatesOccupationAlternates } from '$lib/data/occupation-alternates';
	import { cn } from '$lib/utils';

	let { data } = $props();
	const alternates = $derived(
		data.country.code === 'us'
			? buildUnitedStatesOccupationAlternates(
					data.occupation.localCode,
					data.occupation.canonicalCode
				)
			: []
	);
</script>

<Seo
	title={`${data.occupation.localTitle} — ${data.country.displayName}`}
	description={`${data.occupation.localTitle} in ${data.country.name}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(1)}%, headline risk ${(data.occupation.headlineRisk * 100).toFixed(1)}%, confidence ${data.occupation.confidenceLevel}.`}
	path={`${data.country.routePrefix}/occupation/${data.occupation.localCode}`.replace('//', '/')}
	alternates={alternates}
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

	<ScoreMetricGrid
		class="mt-6"
		metrics={[
			{
				label: 'Structural pressure',
				value: `${(data.occupation.structuralPressure * 100).toFixed(1)}%`
			},
			{
				label: 'Headline risk',
				value: `${(data.occupation.headlineRisk * 100).toFixed(1)}%`
			},
			{
				label: 'Demand resilience',
				value:
					data.occupation.demandResilience != null
						? `${(data.occupation.demandResilience * 100).toFixed(1)}%`
						: 'n/a'
			},
			{ label: 'Confidence', value: data.occupation.confidenceLevel }
		]}
	/>

	<section class="mt-8">
		<p class={sectionLabel()}>Why this score</p>
		<div class={card({ padding: 'sm' })}>
			<p class="text-sm text-muted-foreground">
				{globalMethodology.structuralFormula}. Country headline risk adds the local demand layer
				only when that market has official local evidence; otherwise the page stays on the
				structural baseline.
			</p>
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
		<EvidenceModuleGrid class="mt-3" country={data.country} />
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
