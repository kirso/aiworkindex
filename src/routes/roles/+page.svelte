<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, caption, formInput, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let query = $state('');
	let activeCategory = $state<string | null>(null);

	let filteredCategories = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return data.categories
			.filter(category => !activeCategory || category.key === activeCategory)
			.map(category => ({
				...category,
				roles: category.roles.filter(role => {
					if (!needle) return true;
					return [role.title, role.description, role.slug, ...role.tags]
						.join(' ')
						.toLowerCase()
						.includes(needle);
				})
			}))
			.filter(category => category.roles.length > 0);
	});

	let resultCount = $derived(
		filteredCategories.reduce((sum, category) => sum + category.roles.length, 0)
	);

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Modern role lookup for Singapore',
			numberOfItems: data.roles.length,
			itemListElement: data.roles.map((role, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: role.title,
				url: role.official_occupation
					? `https://aiworkindex.com/occupation/${role.official_occupation.ssoc2024}`
					: `https://aiworkindex.com/role/${role.slug}`
			}))
		})}<\/script>`
	);
</script>

<Seo
	title="AI Work Pressure by Modern Role in Singapore"
	description={`Explore ${data.counts.roles} modern job-title queries: ${data.counts.official_query_matches} resolve to official SSOC 2024 occupations, ${data.counts.composite_roles} use disclosed composites and ${data.counts.mapping_withheld} are withheld.`}
	path="/roles"
/>

<svelte:head>{@html itemListJsonLd}</svelte:head>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Modern roles' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Official resolutions + reviewed role queries</p>
		<h1 class={title({ size: 'page' })}>AI work pressure for modern job titles</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			This lookup covers {data.counts.roles} familiar job titles. Exact titles and explicit reviewed title,
			synonym or definition matches resolve to one current SSOC 2024 occupation. Genuinely cross-occupation
			roles use public component weights and sensitivity checks. Ambiguous labels are withheld instead
			of forced into a score. Composite values are estimates, not official statistics or job-loss probabilities.
		</p>
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
			<p><strong>{data.counts.official_query_matches}</strong> official occupation resolutions</p>
			<p><strong>{data.counts.composite_roles}</strong> non-official composite estimates</p>
			<p>
				<strong>{data.counts.mapping_withheld}</strong> withheld to avoid false precision
			</p>
			<a class="font-medium text-primary hover:underline" href="/explore">
				Browse {data.officialOccupationCount.toLocaleString()} official occupations
			</a>
		</div>
	</header>

	<section class="mt-6" aria-label="Find a modern role">
		<label class={sectionLabel()} for="role-search">Find a role</label>
		<input
			id="role-search"
			class={cn(formInput(), 'mt-2 w-full max-w-2xl')}
			type="search"
			placeholder="Search product manager, data analyst, designer…"
			bind:value={query}
		/>
		<div class="mt-3 flex max-w-full flex-wrap gap-1.5" aria-label="Filter by role family">
			<button
				type="button"
				class="border px-2.5 py-1 text-xs font-medium {activeCategory === null
					? 'border-foreground bg-foreground text-background'
					: 'border-border bg-card text-muted-foreground hover:border-foreground'}"
				onclick={() => (activeCategory = null)}>All roles</button
			>
			{#each data.categories as category (category.key)}
				<button
					type="button"
					class="border px-2.5 py-1 text-xs font-medium {activeCategory === category.key
						? 'border-foreground bg-foreground text-background'
						: 'border-border bg-card text-muted-foreground hover:border-foreground'}"
					onclick={() => (activeCategory = activeCategory === category.key ? null : category.key)}
					>{category.label}</button
				>
			{/each}
		</div>
		<p class={cn(caption(), 'mt-3')}>{resultCount} {resultCount === 1 ? 'role' : 'roles'} shown</p>
	</section>

	{#if filteredCategories.length === 0}
		<div class={cn(card({ padding: 'lg', variant: 'subtle' }), 'mt-6')}>
			<p class="text-sm">No role matches that search.</p>
			<button
				class="mt-2 text-sm font-medium text-primary hover:underline"
				onclick={() => (query = '')}
			>
				Clear search
			</button>
		</div>
	{:else}
		<div class="mt-8 space-y-10">
			{#each filteredCategories as category (category.key)}
				<section>
					<div
						class="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-foreground pb-2"
					>
						<div>
							<h2 class={title({ size: 'section' })}>{category.label}</h2>
							<p class={caption()}>{category.description}</p>
						</div>
						<p class="font-mono text-xs text-muted-foreground">{category.roles.length} roles</p>
					</div>
					<div class="grid min-w-0 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
						{#each category.roles as role (role.slug)}
							<a
								href={role.official_occupation
									? `/occupation/${role.official_occupation.ssoc2024}`
									: `/role/${role.slug}`}
								class="group min-w-0 bg-card p-4 transition-colors hover:bg-accent"
							>
								<div class="flex min-w-0 items-start justify-between gap-3">
									<h3 class="min-w-0 text-sm font-bold leading-tight group-hover:text-primary">
										{role.title}
									</h3>
									{#if role.official_occupation}
										<span class="shrink-0 font-mono text-sm font-bold tabular-nums">
											{role.official_occupation.pressure_rank == null
												? 'Not ranked'
												: role.official_occupation.pressure_rank.toFixed(1)}
										</span>
									{:else if role.estimate}
										<span class="shrink-0 font-mono text-sm font-bold tabular-nums">
											{role.estimate.estimated_comparison_percentile.toFixed(1)}
										</span>
									{:else}
										<span class="shrink-0 font-mono text-xs text-muted-foreground">Withheld</span>
									{/if}
								</div>
								<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
									{role.description}
								</p>
								<div
									class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2"
								>
									<span
										class="text-[11px] font-semibold uppercase tracking-wide text-risk-moderate"
									>
										{role.official_occupation
											? 'Resolves to official occupation'
											: role.estimate
												? 'Non-official estimate'
												: 'Mapping withheld'}
									</span>
									<span class="font-mono text-[11px] text-muted-foreground">
										{role.official_occupation
											? `SSOC ${role.official_occupation.ssoc2024} · official pressure percentile`
											: role.estimate
												? `Estimated pressure percentile · ${role.components.length} components`
												: 'No fixed SSOC mapping or score published'}
									</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}

	<aside class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-10')}>
		<p class="text-sm font-bold">How to read these pages</p>
		<p class="mt-1 text-sm leading-relaxed text-text-secondary">
			A direct reviewed match uses the official occupation record, so the site never publishes a
			competing composite. Cross-occupation role pages compare a weighted ILO task-exposure score
			with the official distribution. Ambiguous roles publish no score. None estimates layoffs,
			employment or role-level wages; component wages and demand signals stay separate.
		</p>
		<a
			class="mt-2 inline-block text-sm font-medium text-primary hover:underline"
			href="/methodology#synthetic-roles"
		>
			Read the role-estimate method
		</a>
	</aside>
</main>
