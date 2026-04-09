<script lang="ts">
	import { pageLayout, card, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { buildCountryModuleStatuses } from '$lib/data/country-modules';

	let { data } = $props();

	const moduleStates = $derived(buildCountryModuleStatuses(data.country));
</script>

<Seo
	title={data.country.seoTitle}
	description={data.country.seoDescription}
	path={data.country.routePrefix}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: data.country.displayName }]} />

	<section class="max-w-3xl">
		<p class={sectionLabel()}>Country Index</p>
		<h1 class={titleStyle({ size: 'page' })}>{data.country.displayName}</h1>
		<p class="mt-4 text-base text-muted-foreground">
			{#if data.country.status === 'live'}
				Singapore is the first fully published country, with local demand signals, wages, and policy
				context.
			{:else if data.country.code === 'us'}
				The United States layer is generated from the shared ISCO-08 baseline plus BLS wages,
				projections, requirements, skills, demographics, and occupation narrative sources.
			{:else}
				This country is registered in the global methodology, but its local dataset is still
				research-only and not yet published as a full country index.
			{/if}
		</p>
	</section>

	<section class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Occupations</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{data.stats.count.toLocaleString()}</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">High risk</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{data.stats.highRisk.toLocaleString()}
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Median risk</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.stats.medianRisk * 100).toFixed(1)}%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{data.country.status}</p>
		</div>
	</section>

	{#if data.stats.count > 0}
		<section class="mt-4">
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }))}>
				<p class="text-sm font-semibold text-foreground">Mapping quality</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Crosswalk exact: {data.stats.crosswalkExact} · Title match: {data.stats.titleMatch} · Fallback:
					{data.stats.fallback}
				</p>
			</div>
		</section>
	{/if}

	{#if data.stats.medianWage != null}
		<section class="mt-6">
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }))}>
				<p class="text-sm font-semibold text-foreground">Median wage context</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Median wage in this country layer sits at {data.country.currency}
					{data.stats.medianWage.toLocaleString()} on the generated dataset.
				</p>
			</div>
		</section>
	{/if}

	<section class="mt-8">
		<p class={sectionLabel()}>Evidence layers</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each moduleStates as module}
				<div
					class={card({
						padding: 'sm',
						variant: module.available ? 'default' : 'notice',
						accent: module.available ? 'primary' : 'moderate'
					})}
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">{module.title}</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{module.available ? module.publishedDescription : module.unavailableDescription}
							</p>
						</div>
						<span
							class="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
						>
							{module.available ? 'Published' : 'Hidden'}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Methodology</p>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<article class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Structural baseline</p>
				<p class="mt-1 text-sm text-muted-foreground">{data.methodology.structuralFormula}</p>
			</article>
			<article class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Country layer</p>
				<p class="mt-1 text-sm text-muted-foreground">{data.methodology.localFormula}</p>
			</article>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Top risk occupations</p>
		{#if data.rows.length > 0}
			<div class="mt-3 space-y-2">
				{#each data.rows as row}
					<a href={`${data.country.routePrefix}/occupation/${row.code}`} class="block">
						<div class={card({ padding: 'sm' })}>
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-sm font-semibold text-foreground">{row.title}</p>
									<p class="mt-1 text-xs text-muted-foreground">{row.code}</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-semibold text-foreground">
										{(row.risk * 100).toFixed(1)}%
									</p>
									<p class="text-xs text-muted-foreground">
										{row.wage != null
											? `${data.country.currency} ${row.wage.toLocaleString()}`
											: 'No wage field'}
									</p>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
				<p class="text-sm font-semibold text-foreground">No published local dataset yet.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					This country is registered in the methodology and can be expanded once the local data
					layer is ready. The structural baseline remains visible across the global contract.
				</p>
			</div>
		{/if}
	</section>
</main>
