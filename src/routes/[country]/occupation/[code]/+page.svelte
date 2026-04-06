<script lang="ts">
	import { browser } from '$app/environment';
import Seo from '$lib/components/ui/Seo.svelte';
import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
import { riskBandLabels } from '$lib/data';
import { pageLayout, card, sectionLabel } from '$lib/design-system';
import { globalMethodology } from '$lib/data/global-methodology';
import { buildUnitedStatesOccupationAlternates } from '$lib/data/occupation-alternates';
import { getUnitedStatesRolesForCanonicalCode } from '$lib/data/countries/us/roles';
import { cn } from '$lib/utils';
import { Button } from '$lib/components/ui/button/index.js';
import { pill } from '$lib/design-system';
import { toast } from 'svelte-sonner';
import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
import OccupationSupportBundle from '$lib/components/ui/OccupationSupportBundle.svelte';

	let { data } = $props();
	const alternates = $derived(
		data.country.code === 'us'
			? buildUnitedStatesOccupationAlternates(
					data.occupation.localCode,
					data.occupation.canonicalCode
				)
			: []
	);
	const relatedRoles = $derived.by(() => {
		if (data.country.code !== 'us') return [];
		if (!data.occupation.canonicalCode) return [];
		return getUnitedStatesRolesForCanonicalCode(data.occupation.canonicalCode);
	});

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${data.occupation.localTitle} — ${data.country.displayName}`,
					text: `${data.occupation.localTitle}: headline risk ${(data.occupation.headlineRisk * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: data.occupation.localTitle });
		} catch {}
	}
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

	<div class={cn(card({ padding: 'lg' }), 'mt-6')}>
		<OccupationHero
			scoreLabel="Headline risk"
			scoreValue={`${(data.occupation.headlineRisk * 100).toFixed(0)}%`}
			scoreBand={data.occupation.riskBand}
			scoreBandLabel={riskBandLabels[data.occupation.riskBand]}
			title={data.occupation.localTitle}
			pills={[
				{ label: data.country.displayName, tone: 'muted' },
				{ label: `ISCO ${data.occupation.canonicalCode}`, tone: 'outline' },
				{ label: data.occupation.mappingMethod ?? 'country layer', tone: 'neutral' }
			]}
			summary={`${data.country.displayName} tracks this occupation on the shared structural baseline and then layers on local demand resilience, wages, and confidence. The comparison spine stays fixed across countries.`}
			meta={[
				`Median wage: ${
					data.occupation.wage != null ? `${data.occupation.currency} ${data.occupation.wage.toLocaleString()}` : 'not published'
				}`,
				data.occupation.employment && data.occupation.employment.current != null
					? `${data.occupation.employment.current.toLocaleString()} current${data.occupation.employment.projected != null ? ` · ${data.occupation.employment.projected.toLocaleString()} projected` : ''}`
					: 'Employment series available',
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

	{#if data.country.code === 'us' && data.occupation.support}
		<OccupationSupportBundle support={data.occupation.support} />
	{/if}

	{#if data.country.code === 'us'}
		<section class="mt-8">
			<p class={sectionLabel()}>Related roles</p>
			{#if relatedRoles.length > 0}
				<div class="mt-3 grid gap-3 md:grid-cols-2">
					{#each relatedRoles as role (role.slug)}
						<a href={`/us/role/${role.slug}`} class="block">
							<div class={card({ padding: 'sm' })}>
								<p class="text-sm font-semibold text-foreground">{role.title}</p>
								<p class="mt-1 text-sm text-muted-foreground">
									Estimated modern role using the same synthetic blend, with the United States layer
									open instead of the Singapore reference market.
								</p>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
					<p class="text-sm text-muted-foreground">
						No direct US role match is available yet for this occupation. Browse the full role index
						for adjacent synthetic roles and their US views.
					</p>
					<div class="mt-3">
						<a href="/roles" class={pill({ tone: 'outline', interactive: true })}>Browse roles</a>
					</div>
				</div>
			{/if}
		</section>
	{/if}

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
