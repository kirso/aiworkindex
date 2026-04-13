<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import OccupationSupportBundle from '$lib/components/ui/OccupationSupportBundle.svelte';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import WorkflowRadar from '$lib/components/viz/WorkflowRadar.svelte';
	import SignalProfileGrid, {
		type SignalProfileItem
	} from '$lib/components/viz/SignalProfileGrid.svelte';
	import { riskBandLabels } from '$lib/data';
	import { buildUnitedStatesRoleAlternates } from '$lib/data/occupation-alternates';
	import { pageLayout, card, sectionLabel, pill } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const signalBarClass = (value: number) =>
		value >= 0.66 ? 'bg-impact-leveraged' : value >= 0.33 ? 'bg-risk-moderate' : 'bg-risk-high';

	const roleWaterfallSubject = $derived({
		exposure: data.scored.exposure,
		bottleneck: data.scored.bottleneck,
		net_risk: data.scored.net_risk,
		market: {
			market_resilience: data.scored.market_resilience
		},
		evidence: {
			anthropic_calibrated: false,
			anthropic_gap: null,
			sol_match: false,
			jobs_in_demand_match: false
		}
	} as any);

	const supportSignals = $derived<SignalProfileItem[]>([
		{
			label: 'Exposure',
			value: `${(data.scored.exposure * 100).toFixed(0)}%`,
			barValue: data.scored.exposure,
			barClass: signalBarClass(data.scored.exposure),
			note: 'Share of tasks AI can handle today'
		},
		{
			label: 'Bottleneck',
			value: `${(data.scored.bottleneck * 100).toFixed(0)}%`,
			barValue: data.scored.bottleneck,
			barClass: signalBarClass(data.scored.bottleneck),
			note: 'Work that requires human presence or coordination'
		},
		{
			label: 'Demand resilience',
			value: `${(data.scored.demand_resilience * 100).toFixed(0)}%`,
			barValue: data.scored.demand_resilience,
			barClass: signalBarClass(data.scored.demand_resilience),
			note: 'How strong local hiring demand is for this role'
		},
		{
			label: 'Confidence',
			value: `${(data.scored.confidence_score * 100).toFixed(0)}%`,
			barValue: data.scored.confidence_score,
			barClass: signalBarClass(data.scored.confidence_score),
			note: 'How complete the underlying data is'
		}
	]);

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${data.scored.title} — United States AI Work Index`,
					text: `${data.scored.title}: headline risk ${(data.scored.net_risk * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: data.scored.title });
		} catch {}
	}
</script>

<Seo
	title={`${data.scored.title} — United States AI Work Index`}
	description={`${data.scored.title}: headline risk ${(data.scored.net_risk * 100).toFixed(1)}%, structural pressure ${(data.scored.displacement_pressure * 100).toFixed(1)}%, confidence ${data.scored.confidence}.`}
	path={`/us/role/${data.scored.slug}`.replace('//', '/')}
	alternates={buildUnitedStatesRoleAlternates(data.scored.slug)}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'United States', href: '/us' },
			{ label: 'Roles', href: '/roles' },
			{ label: data.scored.title }
		]}
	/>

	<div class={cn(card({ padding: 'lg' }), 'mt-6')}>
		<OccupationHero
			scoreLabel="Headline risk"
			scoreValue={`${(data.scored.net_risk * 100).toFixed(0)}%`}
			scoreBand={data.scored.risk_band}
			scoreBandLabel={riskBandLabels[data.scored.risk_band]}
			title={data.scored.title}
			pills={[
				{ label: 'United States', tone: 'muted' },
				{
					label: `${data.scored.components.length} occupations blended`,
					tone: 'outline'
				}
			]}
			summary="AI displacement pressure score based on US employment data, wages, and demand signals. Built from {data.scored.components.length} related occupations weighted by relevance."
			meta={[
				`Median wage: ${
					data.primaryOccupation?.wage?.median != null
						? `${data.primaryOccupation.wage.currency} ${data.primaryOccupation.wage.median.toLocaleString()}`
						: 'not published'
				}`,
				data.primaryOccupation?.employment?.current != null
					? `${data.primaryOccupation.employment.current.toLocaleString()} current`
					: 'Employment series available',
				`Confidence ${data.scored.confidence}`
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
		<p class={sectionLabel()}>Why this score</p>
		<div class="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
			<div class={card({ padding: 'sm' })}>
				<DriverWaterfall occupation={roleWaterfallSubject} />
			</div>
			<div class="space-y-3">
				<SignalProfileGrid items={supportSignals} columns={2} />
				{#if data.scored.workflow_overlay}
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Workflow profile</p>
						<p class="mt-1 text-xs text-muted-foreground">
							How this role's daily work breaks down across different dimensions.
						</p>
						<div class="mt-3 flex justify-center">
							<WorkflowRadar dimensions={data.scored.workflow_overlay} size={240} />
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>US employment data</p>
		{#if data.primarySupport}
			<OccupationSupportBundle support={data.primarySupport} />
		{:else}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
				<p class="text-sm text-muted-foreground">
					Detailed US employment data is not yet available for the primary occupation in this role.
				</p>
			</div>
		{/if}
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Component occupations</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each data.components as component}
				<div class={card({ padding: 'sm' })}>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">{component.localTitle}</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{component.localCode ?? 'n/a'} · {(component.weight * 100).toFixed(0)}% weight
							</p>
						</div>
						{#if component.localCode}
							<a
								href={`/us/occupation/${component.localCode}`}
								class={pill({ tone: 'outline', interactive: true })}
							>
								Open
							</a>
						{/if}
					</div>
					<p class="mt-2 text-sm text-muted-foreground">{component.rationale}</p>
					{#if component.support}
						<p class="mt-3 text-xs text-muted-foreground">
							Support bundle: {component.support.jobZoneLabel ?? 'published'}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>How this score works</p>
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class="text-sm text-muted-foreground">
				The score measures how much this role's tasks overlap with current AI capabilities,
				adjusted for human-only requirements and local job market demand. This is a structural
				pressure estimate, not a prediction of job losses.
				<a href="/methodology" class="font-medium text-primary hover:underline">
					Learn how scores work →
				</a>
			</p>
		</div>
	</section>
</main>
