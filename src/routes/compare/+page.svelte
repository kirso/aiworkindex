<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { card, caption, formInput, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data: _data } = $props();
	type Entity = (typeof _data.entities)[number];
	let entities = $state<Entity[]>([]);
	let indexLoading = $state(true);
	let indexFailed = $state(false);
	let query = $state('');
	let searchOpen = $state(false);
	let copied = $state(false);
	let queryAliases = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			const response = await fetch('/data/v9-ui-index.json?v=2026-08-19-v9');
			if (!response.ok) throw new Error(`UI index returned ${response.status}`);
			const index = (await response.json()) as {
				compare_entities: typeof _data.entities;
				query_aliases?: Record<string, string>;
			};
			entities = index.compare_entities;
			queryAliases = index.query_aliases ?? {};
		} catch {
			indexFailed = true;
		} finally {
			indexLoading = false;
		}
	});

	let entityById = $derived(new Map(entities.map(entity => [entity.id, entity])));
	let selected = $derived.by((): Entity[] => {
		if (!browser) return [];
		const requested = page.url.searchParams.get('entities') ?? '';
		const legacy = page.url.searchParams.get('jobs') ?? '';
		const ids = requested
			? requested.split(',').map(value => value.trim())
			: legacy.split(',').map(value => `occupation:${value.trim()}`);
		return ids
			.filter(Boolean)
			.map(id => entityById.get(queryAliases[id] ?? id))
			.filter((entity): entity is Entity => entity !== undefined)
			.filter(
				(entity, index, all) => all.findIndex(candidate => candidate.id === entity.id) === index
			)
			.slice(0, 4);
	});

	let results = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [] as Entity[];
		const chosen = new Set(selected.map(entity => entity.id));
		return entities
			.filter(entity => !chosen.has(entity.id) && entity.searchText.includes(needle))
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 10);
	});

	function comparisonUrl(entities: Entity[]): string {
		return entities.length
			? `/compare?entities=${entities.map(entity => entity.id).join(',')}`
			: '/compare';
	}

	function add(entity: Entity) {
		if (selected.length >= 4) return;
		query = '';
		searchOpen = false;
		goto(comparisonUrl([...selected, entity]), { keepFocus: true, noScroll: true });
	}

	function remove(entity: Entity) {
		goto(comparisonUrl(selected.filter(candidate => candidate.id !== entity.id)), {
			keepFocus: true,
			noScroll: true
		});
	}

	async function copyComparison() {
		if (!browser) return;
		await navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function pct(value: number | null, digits = 1): string {
		return value == null ? 'Not available' : value.toFixed(digits);
	}

	function scale100(value: number | null): string {
		return value == null ? 'Not available' : `${(value * 100).toFixed(1)}/100`;
	}

	function mappingLabel(value: string): string {
		return value.replaceAll('_', ' ');
	}

	function matchingAlias(entity: Entity): string | null {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return null;
		return (entity.queryAliases ?? []).find(alias => alias.toLowerCase().includes(needle)) ?? null;
	}

	let hasMixedKinds = $derived(
		selected.some(entity => entity.kind === 'role') &&
			selected.some(entity => entity.kind === 'occupation')
	);
</script>

<Seo
	title="Compare AI Work Pressure and Job-Risk Evidence in Singapore"
	description="Compare up to four Singapore occupations or non-official modern-role queries across AI work pressure, task exposure, wages, demand and evidence gaps."
	path="/compare"
/>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />

	<header
		class="flex flex-col gap-4 border-b-2 border-foreground pb-6 sm:flex-row sm:items-end sm:justify-between"
	>
		<div class="max-w-3xl">
			<p class={sectionLabel()}>Evidence explorer</p>
			<h1 class={title({ size: 'page' })}>Compare jobs without collapsing the evidence</h1>
			<p class="mt-3 text-base leading-relaxed text-text-secondary">
				Pressure, wages, current demand, observed AI use and complementarity answer different
				questions. This view keeps them separate and marks missing evidence as unknown.
			</p>
		</div>
		{#if selected.length > 0}
			<Button variant="outline" size="sm" onclick={copyComparison}
				>{copied ? 'Copied' : 'Copy link'}</Button
			>
		{/if}
	</header>

	<section class="relative mt-6 max-w-2xl" aria-label="Add a job to compare">
		<label class={sectionLabel()} for="compare-search">
			{selected.length < 4 ? `Add a job (${selected.length}/4)` : 'Four jobs selected'}
		</label>
		{#if selected.length < 4}
			<input
				id="compare-search"
				type="search"
				class={cn(formInput(), 'mt-2 w-full')}
				placeholder="Search an official occupation or modern role…"
				bind:value={query}
				onfocus={() => (searchOpen = true)}
				onblur={() => setTimeout(() => (searchOpen = false), 180)}
			/>
			{#if searchOpen && query.trim().length >= 2}
				<div
					class="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-foreground bg-card"
				>
					{#if results.length === 0}
						<p class="p-3 text-sm text-muted-foreground">No match found.</p>
					{:else}
						{#each results as result (result.id)}
							<button
								type="button"
								class="flex w-full min-w-0 items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-accent"
								onmousedown={() => add(result)}
							>
								<span class="min-w-0">
									<span class="block truncate text-sm font-medium">{result.title}</span>
									<span class="block text-xs text-muted-foreground">
										{matchingAlias(result)
											? `Modern title “${matchingAlias(result)}” · ${result.statusLabel}`
											: result.statusLabel}
									</span>
								</span>
								<span class="shrink-0 font-mono text-xs font-bold tabular-nums"
									>{pct(result.position)}</span
								>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		{/if}
	</section>
	{#if indexLoading || indexFailed}
		<p class="mt-2 text-xs text-muted-foreground" aria-live="polite">
			{indexFailed
				? 'The comparison index could not load. Open an occupation page to inspect its evidence.'
				: 'Loading the comparison index…'}
		</p>
	{/if}

	{#if selected.length === 0}
		<section class={cn(card({ padding: 'lg', variant: 'subtle' }), 'mt-8')}>
			<h2 class="text-lg font-bold">Start with two jobs</h2>
			<p class="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
				Familiar job titles may resolve to an official SSOC 2024 occupation. The remaining
				non-official queries use a disclosed composite or withhold the estimate when a fixed mapping
				would mislead.
			</p>
			<div class="mt-5 grid gap-2 sm:grid-cols-2">
				<a
					class="border border-border bg-card p-3 text-sm font-medium hover:border-foreground"
					href="/compare?entities=occupation:25143,occupation:41320"
					>AI/ML engineer vs data entry clerk</a
				>
				<a
					class="border border-border bg-card p-3 text-sm font-medium hover:border-foreground"
					href="/compare?entities=occupation:25114,role:ai-product-manager"
					>Product manager vs AI product manager</a
				>
				<a
					class="border border-border bg-card p-3 text-sm font-medium hover:border-foreground"
					href="/compare?entities=occupation:24111,occupation:21231">Accountant vs data analyst</a
				>
				<a
					class="border border-border bg-card p-3 text-sm font-medium hover:border-foreground"
					href="/compare?entities=occupation:25121,occupation:25124"
					>Frontend engineer vs UX designer</a
				>
			</div>
		</section>
	{:else}
		{#if hasMixedKinds}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
				<p class="text-sm leading-relaxed">
					This comparison mixes official ranks with non-official estimates. The values share a
					reference distribution, but the role values also depend on editorial component weights.
				</p>
			</div>
		{/if}

		<section class="mt-6 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each selected as entity (entity.id)}
				<article class="min-w-0 border border-border bg-card">
					<div class="border-b-2 border-foreground p-4">
						<div class="flex min-w-0 items-start justify-between gap-3">
							<div class="min-w-0">
								<p
									class="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
								>
									{entity.statusLabel}
								</p>
								<h2 class="mt-1 break-words text-base font-bold leading-tight">
									<a class="hover:text-primary hover:underline" href={entity.href}>{entity.title}</a
									>
								</h2>
							</div>
							<button
								class="shrink-0 text-lg leading-none text-muted-foreground hover:text-foreground"
								onclick={() => remove(entity)}
								aria-label="Remove {entity.title}">×</button
							>
						</div>
						<p class="mt-5 font-mono text-5xl font-black tabular-nums">{pct(entity.position)}</p>
						<p class={cn(caption(), 'mt-1')}>{entity.positionKind}</p>
					</div>

					<dl class="divide-y divide-border text-sm">
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">ILO mean task-exposure score</dt>
							<dd class="mt-1 font-mono font-bold tabular-nums">{scale100(entity.rawExposure)}</dd>
							{#if entity.exposureRange && entity.exposureRange.min !== entity.exposureRange.max}
								<p class="mt-1 text-xs text-muted-foreground">
									Official mapping range {(entity.exposureRange.min * 100).toFixed(1)}–{(
										entity.exposureRange.max * 100
									).toFixed(1)}
								</p>
							{/if}
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">ILO exposure category</dt>
							<dd class="mt-1 font-medium">{entity.officialCategory}</dd>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Within-occupation task dispersion</dt>
							<dd class="mt-1 font-mono font-bold tabular-nums">
								{scale100(entity.taskDispersion)}
							</dd>
							{#if entity.kind === 'role'}<p class="mt-1 text-xs text-muted-foreground">
									Not aggregated for non-official queries
								</p>{/if}
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Gross monthly wage</dt>
							<dd class="mt-1 font-mono font-bold tabular-nums">
								{entity.wage == null
									? entity.kind === 'role'
										? 'No role-level estimate'
										: 'Not published'
									: `SGD ${entity.wage.toLocaleString()}`}
							</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.wageLabel}</p>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Current named demand evidence</dt>
							<dd class="mt-1 font-medium">{entity.demand}</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.demandDetail}</p>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Broad labour-market context</dt>
							<dd class="mt-1 leading-relaxed">
								{entity.labourContext ?? 'Not applied at this grain'}
							</dd>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Observed AI use</dt>
							<dd class="mt-1">
								{entity.observedUse
									? 'Published evidence block available'
									: 'Not published at this occupation grain'}
							</dd>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Potential complementarity</dt>
							<dd class="mt-1">
								{entity.complementarity
									? 'Published evidence block available'
									: 'Not published at this occupation grain'}
							</dd>
						</div>
						<div class="p-3">
							<dt class="text-xs text-muted-foreground">Mapping evidence</dt>
							<dd class="mt-1 capitalize">{mappingLabel(entity.mapping)}</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.mappingDetail}</p>
						</div>
					</dl>
				</article>
			{/each}
		</section>
	{/if}

	<aside class="mt-8 border-t border-foreground pt-4 text-xs leading-relaxed text-muted-foreground">
		<strong class="text-foreground">Reading rule:</strong> a missing demand match, wage row,
		observed-use measure or complementarity measure stays missing. It is never converted to zero and
		never changes the AI Work Pressure Rank.
		<a class="text-primary hover:underline" href="/methodology">Methodology</a>
	</aside>
</main>
