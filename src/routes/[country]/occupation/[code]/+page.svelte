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

	<div class={cn(card({ padding: 'lg' }), 'mt-6 overflow-hidden')}>
		<div class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
			<div
				class={cn('rounded-2xl border p-5', scoreTileClasses(data.occupation.riskBand))}
				role="figure"
				aria-label={`Headline risk ${(data.occupation.headlineRisk * 100).toFixed(0)}%, rated ${riskBandLabels[data.occupation.riskBand]}`}
			>
				<p class="text-xs uppercase tracking-wide text-muted-foreground">Headline risk</p>
				<p class={cn(display({ size: 'xl' }), 'mt-2')}>
					{(data.occupation.headlineRisk * 100).toFixed(0)}%
				</p>
				<span class={cn(riskBadge({ band: data.occupation.riskBand }), 'mt-2 inline-flex')}>
					{riskBandLabels[data.occupation.riskBand]} Risk
				</span>
			</div>

			<div class="min-w-0">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div class="min-w-0">
						<h1 class={titleStyle({ size: 'page' })}>{data.occupation.localTitle}</h1>
						<div class="mt-1.5 flex flex-wrap items-center gap-2">
							<span class={pill({ tone: 'muted' })}>{data.country.displayName}</span>
							{#if data.occupation.canonicalCode}
								<span class={pill({ tone: 'muted' })}>ISCO {data.occupation.canonicalCode}</span>
							{/if}
							{#if data.occupation.mappingMethod}
								<span class={pill({ tone: 'muted' })}>{data.occupation.mappingMethod}</span>
							{/if}
						</div>
						<p class="mt-3 max-w-3xl text-[15px] leading-relaxed text-text-secondary">
							{data.country.displayName} tracks this occupation on the shared structural baseline and
							then layers on local demand resilience, wages, and confidence. The comparison spine
							stays fixed across countries.
						</p>
						<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
							<span class={cn(mono({ size: 'md' }), 'text-muted-foreground')}>
								Median wage:
								{#if data.occupation.wage != null}
									{data.occupation.currency} {data.occupation.wage.toLocaleString()}
								{:else}
									not published
								{/if}
							</span>
							{#if data.occupation.employment}
								<span class={caption()}>
									{#if data.occupation.employment.current != null}
										{data.occupation.employment.current.toLocaleString()} current
									{/if}
									{#if data.occupation.employment.projected != null}
										{data.occupation.employment.current != null ? ' · ' : ''}
										{data.occupation.employment.projected.toLocaleString()} projected
									{/if}
								</span>
							{/if}
							<span class={caption()}>Confidence {data.occupation.confidenceLevel}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

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
