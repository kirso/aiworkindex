<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { card, caption, display, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import { cn } from '$lib/utils';
	import {
		WATCHLIST_KEY,
		hasWatchlistEntry,
		parseStoredWatchlist,
		serializeWatchlist,
		toggleWatchlistEntry
	} from '$lib/watchlist';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let role = $derived(data.role);
	let estimate = $derived(role.estimate);
	let mappingWithheld = $derived(role.estimate_status === 'mapping_withheld');
	let isWatchlisted = $state(false);

	$effect(() => {
		if (!browser) return;
		isWatchlisted = hasWatchlistEntry(parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY)), {
			kind: 'role',
			id: role.slug
		});
	});

	function toggleWatchlist() {
		if (!browser) return;
		const next = toggleWatchlistEntry(parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY)), {
			kind: 'role',
			id: role.slug
		});
		localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(next));
		isWatchlisted = hasWatchlistEntry(next, { kind: 'role', id: role.slug });
		toast(isWatchlisted ? 'Saved to watchlist' : 'Removed from watchlist');
	}

	async function sharePage() {
		if (!browser) return;
		try {
			if (navigator.share) {
				await navigator.share({ title: `${role.title} | ${SITE.name}`, url: window.location.href });
				return;
			}
			await navigator.clipboard.writeText(window.location.href);
			toast('Link copied');
		} catch {
			// Sharing can be cancelled by the user.
		}
	}

	let demandComponents = $derived(
		role.components.filter(component => component.demand_signals.length > 0)
	);
	let wageComponents = $derived(
		role.components.filter(component => component.wage_evidence !== null)
	);
	let pageTitle = $derived(`${role.title}: AI Work Pressure and Job-Risk Evidence`);
	let pageDescription = $derived(
		estimate
			? `${role.title} has an estimated AI work-pressure comparison percentile of ${estimate.estimated_comparison_percentile.toFixed(1)} against scored Singapore occupations. See its component mapping and assumption sensitivity.`
			: `${role.title} has no published AI work-pressure estimate because a fixed SSOC 2024 mapping would create false precision. See what information is needed.`
	);

	let structuredData = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: pageTitle,
			description: pageDescription,
			url: `${SITE.url}/role/${role.slug}`,
			dateModified: '2026-08-19',
			mainEntity: {
				'@type': 'DefinedTerm',
				name: role.title,
				description: role.description,
				termCode: role.slug,
				inDefinedTermSet: {
					'@type': 'DefinedTermSet',
					name: 'AI Work Index modern-role query layer',
					url: `${SITE.url}/roles`
				},
				additionalProperty: estimate
					? [
							{
								'@type': 'PropertyValue',
								name: 'Estimate status',
								value: 'Non-official role estimate'
							},
							{
								'@type': 'PropertyValue',
								name: 'Estimated AI work-pressure percentile',
								value: estimate.estimated_comparison_percentile
							}
						]
					: [
							{
								'@type': 'PropertyValue',
								name: 'Estimate status',
								value: 'Mapping withheld to avoid false precision'
							}
						]
			}
		})}<\/script>`
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/role/{role.slug}"
	type="article"
	jsonLd={[structuredData]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Modern roles', href: '/roles' },
			{ label: role.title }
		]}
	/>

	<header class="border-b-2 border-foreground pb-6">
		<div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<p
					class="mb-2 inline-flex border border-risk-moderate px-2 py-1 font-mono text-xs font-bold uppercase tracking-wide text-risk-moderate"
				>
					{mappingWithheld ? 'Non-official role query' : 'Non-official role estimate'}
				</p>
				<h1 class={cn(title({ size: 'page' }), 'break-words')}>{role.title}</h1>
				<p class="mt-2 max-w-3xl text-base leading-relaxed text-text-secondary">
					{role.description}.
				</p>
			</div>
			<div class="flex shrink-0 flex-wrap gap-2">
				<Button variant="outline" size="sm" href="/compare?entities=role:{role.slug}"
					>Compare</Button
				>
				<Button variant={isWatchlisted ? 'default' : 'outline'} size="sm" onclick={toggleWatchlist}>
					{isWatchlisted ? 'Saved' : 'Save'}
				</Button>
				<Button variant="outline" size="sm" onclick={sharePage}>Share</Button>
			</div>
		</div>

		{#if estimate}
			<div class="mt-7 grid gap-px bg-border sm:grid-cols-[minmax(13rem,0.8fr)_minmax(0,2fr)]">
				<div class="bg-card p-5">
					<p class={sectionLabel()}>Estimated comparison percentile</p>
					<p class={cn(display({ size: 'xl' }), 'mt-1')}>
						{estimate.estimated_comparison_percentile.toFixed(1)}
					</p>
					<p class={caption()}>Estimated, not an official occupation rank</p>
				</div>
				<div class="bg-card p-5">
					<h2 class="text-lg font-bold">What the number says</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
						Based on the published component weights, this role's ILO task-exposure score has an
						estimated comparison percentile of {estimate.estimated_comparison_percentile.toFixed(1)} against
						the {estimate.comparison_population}. The role is not added to the official ranking
						population. This measures pressure on tasks, not the chance of losing a job.
					</p>
					<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
						<p>
							<span class="text-muted-foreground">Weighted ILO score</span>
							<strong>{(estimate.mean_score_2025 * 100).toFixed(1)}/100</strong>
						</p>
						<p>
							<span class="text-muted-foreground">Official categories represented</span>
							<strong
								>{estimate.potential25_component_range.least_exposed ===
								estimate.potential25_component_range.most_exposed
									? estimate.potential25_component_range.least_exposed
									: `${estimate.potential25_component_range.least_exposed} to ${estimate.potential25_component_range.most_exposed}`}</strong
							>
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
				<p class="font-bold">Mapping and estimate withheld</p>
				<p class="mt-1 text-sm leading-relaxed text-text-secondary">
					{role.mapping_rationale} We do not substitute a broad-group, title-similarity or legacy component
					score.
				</p>
			</div>
		{/if}
	</header>

	{#if role.components.length > 0}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Published assumptions</p>
				<h2 class={title({ size: 'section' })}>Official occupations used in this estimate</h2>
			</div>
			<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
				The role definition is an editorial query layer. Each weight states how much an official
				SSOC 2024 occupation contributes to the composite. The links open the underlying official
				record.
			</p>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each role.components as component (component.ssoc2024)}
					<article class={card({ padding: 'sm' })}>
						<div class="flex min-w-0 items-start justify-between gap-3">
							<div class="min-w-0">
								<a
									class="text-sm font-bold hover:text-primary hover:underline"
									href="/occupation/{component.ssoc2024}"
								>
									{component.title}
								</a>
								<p class="mt-0.5 font-mono text-xs text-muted-foreground">
									SSOC {component.ssoc2024}
								</p>
							</div>
							<p class="shrink-0 font-mono text-lg font-bold tabular-nums">
								{(component.weight * 100).toFixed(0)}%
							</p>
						</div>
						<p class="mt-3 text-xs leading-relaxed text-text-secondary">{component.rationale}</p>
						<div class="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
							<div>
								<p class="text-muted-foreground">Official pressure rank</p>
								<p class="mt-0.5 font-mono font-bold tabular-nums">
									{component.pressure_rank == null
										? 'Not ranked'
										: component.pressure_rank.toFixed(1)}
								</p>
							</div>
							<div>
								<p class="text-muted-foreground">ILO category</p>
								<p class="mt-0.5 font-medium">
									{component.potential25?.categories.join(', ') ?? 'Not available'}
								</p>
							</div>
						</div>
						{#if component.migration_note}
							<p class="mt-3 border-l-2 border-risk-moderate pl-2 text-xs text-muted-foreground">
								{component.migration_note}
							</p>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{:else}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>What is needed</p>
				<h2 class={title({ size: 'section' })}>Choose a task profile before comparing pressure</h2>
			</div>
			<p class="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
				Use the official occupation explorer to choose the sector or task profile that best
				describes the work. Publishing one weighted average for this label would hide materially
				different jobs.
			</p>
			<a class="mt-3 inline-block text-sm font-medium text-primary hover:underline" href="/explore">
				Browse official SSOC 2024 occupations
			</a>
		</section>
	{/if}

	{#if estimate}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Assumption sensitivity</p>
				<h2 class={title({ size: 'section' })}>How sensitive is the estimate?</h2>
			</div>
			<div class="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<div class="bg-card p-4">
					<p class={caption()}>Editorial weights</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.editorial_weight_point * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Equal weights</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.equal_weight_point * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Leave-one-out low</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.leave_one_component_out_min * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Leave-one-out high</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.leave_one_component_out_max * 100).toFixed(1)}
					</p>
				</div>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Values are ILO mean task-exposure scores on a 0–100 display scale. They are not
				probabilities.
			</p>
		</section>
	{/if}

	{#if role.components.length > 0}
		<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Observed wage evidence</p>
					<h2 class={title({ size: 'section' })}>Component wages</h2>
				</div>
				{#if wageComponents.length > 0}
					<div class="mt-3 divide-y divide-border border border-border bg-card">
						{#each wageComponents as component (component.ssoc2024)}
							<div class="flex min-w-0 items-start justify-between gap-3 p-3 text-sm">
								<div class="min-w-0">
									<a
										class="font-medium hover:text-primary hover:underline"
										href="/occupation/{component.ssoc2024}">{component.title}</a
									>
									<p class="text-xs text-muted-foreground">MOM 2025, direct SSOC row</p>
								</div>
								<p class="shrink-0 font-mono font-bold tabular-nums">
									SGD {component.wage_evidence!.value.gross_monthly_sgd.median.toLocaleString()}/mo
								</p>
							</div>
						{/each}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						These are occupation observations, not an estimated wage for {role.title}.
					</p>
				{:else}
					<p class="mt-3 text-sm text-muted-foreground">
						No direct component wage observation is published.
					</p>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Current demand evidence</p>
					<h2 class={title({ size: 'section' })}>Named component matches</h2>
				</div>
				{#if demandComponents.length > 0}
					<div class="mt-3 space-y-3">
						{#each demandComponents as component (component.ssoc2024)}
							<article class={card({ padding: 'sm' })}>
								<p class="text-sm font-bold">{component.title}</p>
								<ul class="mt-2 space-y-2">
									{#each component.demand_signals as signal}
										<li class="text-xs leading-relaxed text-text-secondary">
											<a
												class="font-medium text-primary hover:underline"
												href={signal.url}
												target="_blank"
												rel="noopener noreferrer">{signal.label}</a
											>
											— {signal.interpretation}
										</li>
									{/each}
								</ul>
							</article>
						{/each}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						A named source match is not a complete demand measure for the synthetic role.
					</p>
				{:else}
					<p class="mt-3 text-sm text-muted-foreground">
						No reviewed component match appears in the current named demand sources.
					</p>
				{/if}
			</div>
		</section>
	{/if}

	<section class="mt-10 border-t-2 border-foreground pt-5">
		<p class={sectionLabel()}>Limits</p>
		<h2 class={title({ size: 'section' })}>What this page does not claim</h2>
		<ul class="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
			{#each role.limitations as limitation}
				<li class="border-l-2 border-border pl-3">{limitation}</li>
			{/each}
		</ul>
		<p class="mt-4 text-sm">
			<a class="font-medium text-primary hover:underline" href="/methodology#synthetic-roles"
				>Read the full method</a
			>
			<span class="text-muted-foreground"> · </span>
			<a class="font-medium text-primary hover:underline" href="/data"
				>Download the published role data</a
			>
		</p>
	</section>

	{#if data.related.length > 0}
		<section class="mt-10">
			<p class={sectionLabel()}>Related role queries</p>
			<div class="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
				{#each data.related as related (related.slug)}
					<a class="min-w-0 bg-card p-3 hover:bg-accent" href="/role/{related.slug}">
						<p class="text-sm font-bold">{related.title}</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{related.estimate
								? `Estimated pressure percentile ${related.estimate.estimated_comparison_percentile.toFixed(1)}`
								: 'Mapping and estimate withheld'}
						</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</main>
