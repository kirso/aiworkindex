<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, caption, formInput, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let query = $state('');
	let activeCategory = $state<string | null>(null);
	let visibleLimit = $state(24);

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

	let visibleCategories = $derived.by(() => {
		let remaining = query.trim() || activeCategory ? Number.POSITIVE_INFINITY : visibleLimit;
		return filteredCategories
			.map(category => {
				const roles = category.roles.slice(0, remaining);
				remaining -= roles.length;
				return { ...category, roles, matchedRoleCount: category.roles.length };
			})
			.filter(category => category.roles.length > 0);
	});

	let visibleCount = $derived(
		visibleCategories.reduce((sum, category) => sum + category.roles.length, 0)
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
				url: `https://aiworkindex.com${role.href}`
			}))
		})}<\/script>`
	);
</script>

<Seo
	title="AI Work Pressure by Modern Role in Singapore"
	description={`Find ${data.counts.roles} familiar Singapore job titles. ${data.counts.reviewed_alias_matches} reviewed title guides reuse official SSOC 2024 scores, ${data.counts.composite_roles} use disclosed estimates and ${data.counts.mapping_withheld} need more context.`}
	path="/roles"
/>

<svelte:head>{@html itemListJsonLd}</svelte:head>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Modern roles' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>88 familiar titles · SSOC 2024</p>
		<h1 class={title({ size: 'page' })}>Find your job title</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			Search the title you use at work. A reviewed familiar-title guide reuses the record and score
			from its official SSOC occupation. Titles that genuinely span several occupations show a
			disclosed estimate. Ambiguous titles stay unscored until you choose a work context.
		</p>
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
			<p><strong>{data.counts.exact_title_matches}</strong> exact official titles</p>
			<p><strong>{data.counts.reviewed_alias_matches}</strong> reviewed familiar-title guides</p>
			<p><strong>{data.counts.composite_roles}</strong> non-official composite estimates</p>
			<p>
				<strong>{data.counts.mapping_withheld}</strong> need a clearer work context
			</p>
			<a class="font-medium text-primary hover:underline" href="/explore">
				Browse {data.officialOccupationCount.toLocaleString()} official occupations
			</a>
		</div>
	</header>

	<section class="mt-6" aria-label="Find a modern role">
		<label class={sectionLabel()} for="role-search">Search all {data.counts.roles} titles</label>
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
				onclick={() => {
					activeCategory = null;
					visibleLimit = 24;
				}}>All roles</button
			>
			{#each data.categories as category (category.key)}
				<button
					type="button"
					class="border px-2.5 py-1.5 text-xs font-medium {activeCategory === category.key
						? 'border-foreground bg-foreground text-background'
						: 'border-border bg-card text-muted-foreground hover:border-foreground'}"
					style:background={activeCategory === category.key
						? undefined
						: category.presentation.surface}
					style:border-bottom-color={category.presentation.accent}
					style:border-bottom-width="2px"
					onclick={() => {
						activeCategory = activeCategory === category.key ? null : category.key;
						visibleLimit = 24;
					}}>{category.label}</button
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
			{#each visibleCategories as category (category.key)}
				<section>
					<div
						class="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-2 pb-2"
						style:border-color={category.presentation.accent}
					>
						<div>
							<h2 class={title({ size: 'section' })}>{category.label}</h2>
							<p class={caption()}>{category.description}</p>
						</div>
						<p class="font-mono text-xs text-muted-foreground">
							{category.roles.length === category.matchedRoleCount
								? `${category.roles.length} roles`
								: `${category.roles.length} of ${category.matchedRoleCount}`}
						</p>
					</div>
					<div class="grid min-w-0 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
						{#each category.roles as role (role.slug)}
							<a
								href={role.href}
								class="group min-w-0 border-l-4 bg-card p-4 transition-colors hover:bg-accent"
								style:border-color={role.presentation.accent}
								style:background={role.presentation.surface}
							>
								<div class="flex min-w-0 items-start justify-between gap-3">
									<h3
										class="min-w-0 font-sans text-base font-bold leading-tight group-hover:text-primary"
									>
										{role.title}
									</h3>
									{#if role.official_occupation}
										<span class="shrink-0 font-mono text-lg font-semibold tabular-nums">
											{role.official_occupation.pressure_rank == null
												? '—'
												: `${role.official_occupation.pressure_rank.toFixed(0)}%`}
										</span>
									{:else if role.estimate}
										<span class="shrink-0 font-mono text-lg font-semibold tabular-nums">
											{role.estimate.estimated_comparison_percentile.toFixed(0)}%
										</span>
									{:else}
										<span class="shrink-0 font-mono text-xs text-muted-foreground"
											>Needs context</span
										>
									{/if}
								</div>
								<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
									{role.description}
								</p>
								<div
									class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2"
								>
									<span class="text-xs font-semibold" style:color={role.presentation.accent}>
										{role.statusLabel}
									</span>
									<span class="font-mono text-[11px] text-muted-foreground">
										{role.official_occupation
											? `SSOC ${role.official_occupation.ssoc2024}`
											: role.estimate
												? `${role.components.length} official jobs`
												: 'Choose a sector'}
									</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/each}
		</div>
		{#if visibleCount < resultCount}
			<div class="mt-8 border-t border-border pt-5 text-center">
				<p class={caption()}>{visibleCount} of {resultCount} matching roles shown</p>
				<button
					type="button"
					class="mt-3 min-h-11 border border-foreground bg-card px-5 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
					onclick={() => (visibleLimit = resultCount)}
				>
					Show all {resultCount} roles
				</button>
			</div>
		{/if}
	{/if}

	<aside class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-10')}>
		<p class="text-sm font-bold">How to read these pages</p>
		<p class="mt-1 text-sm leading-relaxed text-text-secondary">
			The score answers one question: how exposed are the mapped occupation's tasks relative to
			other scored occupations? Pay, named demand and practical guidance answer different questions
			and stay outside the calculation. Personal outcomes also depend on actual use, demand,
			regulation, organisational choices and human responsibility.
		</p>
		<a
			class="mt-2 inline-block text-sm font-medium text-primary hover:underline"
			href="/methodology#synthetic-roles"
		>
			Read the role-estimate method
		</a>
	</aside>
</main>
