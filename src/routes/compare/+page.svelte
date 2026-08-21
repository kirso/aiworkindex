<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { trackProductEvent } from '$lib/analytics';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import SaveJobButton from '$lib/components/product/SaveJobButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		card,
		capabilityColorScale,
		formInput,
		pageLayout,
		pressureColorScale,
		sectionLabel,
		title
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data: _data } = $props();
	type Entity = (typeof _data.entities)[number];
	let entities = $state<Entity[]>([]);
	let indexLoading = $state(true);
	let indexFailed = $state(false);
	let query = $state('');
	let searchOpen = $state(false);
	let selectedIndex = $state(-1);
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
		trackProductEvent('comparison_created', {
			entity_kind: entity.kind,
			selected_count: selected.length + 1,
			context: 'compare'
		});
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
		trackProductEvent('comparison_link_copied', {
			selected_count: selected.length,
			context: 'compare'
		});
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function pct(value: number | null, digits = 1): string {
		return value == null ? 'Not available' : value.toFixed(digits);
	}

	function mappingLabel(value: string): string {
		const labels: Record<string, string> = {
			exact: 'Direct official match',
			partial: 'Official partial correspondence',
			one_to_one: 'Direct official match',
			one_to_many: 'Several official matches',
			editorial_component_mix: 'Reviewed occupation mix'
		};
		return labels[value] ?? value.replaceAll('_', ' ');
	}

	function pressureWidth(value: number | null): string {
		return `${Math.max(0, Math.min(100, value ?? 0))}%`;
	}

	function capabilityText(value: number | null): string {
		return value == null ? 'No conservative profile' : `${(value * 100).toFixed(1)}/100`;
	}

	function researchText(value: number | null): string {
		return value == null ? 'Not available' : `${(value * 100).toFixed(1)}/100`;
	}

	function wageText(entity: Entity): string {
		if (entity.wage != null) return `SGD ${entity.wage.toLocaleString()}`;
		return entity.kind === 'role' ? 'No role-level figure' : 'Not published';
	}

	let rankedSelected = $derived(selected.filter(entity => entity.position != null));
	let wageSelected = $derived(selected.filter(entity => entity.wage != null));
	let positionSpread = $derived.by(() => {
		if (rankedSelected.length < 2) return null;
		const positions = rankedSelected.map(entity => entity.position as number);
		return Math.max(...positions) - Math.min(...positions);
	});
	let wageSpread = $derived.by(() => {
		if (wageSelected.length < 2) return null;
		const wages = wageSelected.map(entity => entity.wage as number);
		return Math.max(...wages) - Math.min(...wages);
	});

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
	title="Compare Singapore Jobs: AI Pressure, Use, Pay, Demand and Skills"
	description="Compare up to four Singapore jobs across AI task pressure, OECD capabilities, theoretical LLM scope, observed Claude use, MOM pay, demand and official skills."
	path="/compare"
/>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />

	<header
		class="flex flex-col gap-4 border-b-2 border-foreground pb-6 sm:flex-row sm:items-end sm:justify-between"
	>
		<div class="max-w-3xl">
			<p class={sectionLabel()}>Job comparison</p>
			<h1 class={title({ size: 'page' })}>Compare jobs</h1>
			<p class="mt-3 text-base leading-relaxed text-text-secondary">
				Compare AI task pressure, mapped capabilities, possible scope, observed use, published pay,
				named demand and official skills. Each row keeps its own source and meaning.
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
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={searchOpen && query.trim().length >= 2}
				aria-controls="compare-search-results"
				aria-activedescendant={selectedIndex >= 0
					? `compare-search-option-${selectedIndex}`
					: undefined}
				class={cn(formInput(), 'mt-2 w-full')}
				placeholder="Search an official occupation or modern role…"
				bind:value={query}
				onfocus={() => (searchOpen = true)}
				onblur={() => setTimeout(() => (searchOpen = false), 180)}
				onkeydown={event => {
					if (!searchOpen || results.length === 0) return;
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
					} else if (event.key === 'ArrowUp') {
						event.preventDefault();
						selectedIndex = Math.max(selectedIndex - 1, 0);
					} else if (event.key === 'Enter' && selectedIndex >= 0) {
						const picked = results[selectedIndex];
						if (!picked) return;
						event.preventDefault();
						add(picked);
						selectedIndex = -1;
					} else if (event.key === 'Escape') {
						searchOpen = false;
					}
				}}
			/>
			{#if searchOpen && query.trim().length >= 2}
				<div
					id="compare-search-results"
					role="listbox"
					aria-label="Matching jobs"
					class="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-foreground bg-card"
				>
					{#if results.length === 0}
						<p class="p-3 text-sm text-muted-foreground">No match found.</p>
					{:else}
						{#each results as result, index (result.id)}
							<button
								type="button"
								id="compare-search-option-{index}"
								role="option"
								aria-selected={index === selectedIndex}
								class="flex w-full min-w-0 items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 {index ===
								selectedIndex
									? 'bg-accent'
									: 'hover:bg-accent'}"
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
					href="/compare?entities=occupation:12222,occupation:21661"
					>Marketing manager vs graphic designer</a
				>
			</div>
		</section>
	{:else}
		{#if hasMixedKinds}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
				<p class="text-sm leading-relaxed">
					Official occupations and modern-role estimates appear together here. Modern-role values
					depend on a reviewed mix of occupations; open a role page to inspect that mix.
				</p>
			</div>
		{/if}

		<section
			class="mt-6 border border-border bg-card p-4 sm:p-5"
			aria-labelledby="difference-title"
		>
			<p class={sectionLabel()}>What stands out</p>
			<h2 id="difference-title" class="mt-1 text-lg font-bold">Read the gaps before the details</h2>
			<div class="mt-3 grid gap-3 text-sm sm:grid-cols-3">
				<div class="border border-border bg-surface-subtle p-3">
					<p class="text-xs text-muted-foreground">Pressure-position gap</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{positionSpread == null ? 'Need 2 ranked jobs' : `${positionSpread.toFixed(1)} points`}
					</p>
				</div>
				<div class="border border-border bg-surface-subtle p-3">
					<p class="text-xs text-muted-foreground">Published monthly-pay gap</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{wageSpread == null ? 'Need 2 pay rows' : `SGD ${wageSpread.toLocaleString()}`}
					</p>
				</div>
				<div class="border border-border bg-surface-subtle p-3">
					<p class="text-xs text-muted-foreground">Named demand coverage</p>
					<p class="mt-1 text-sm font-bold">
						{selected.filter(entity => !entity.demand.startsWith('No ')).length} of {selected.length}
						jobs have a reviewed named match
					</p>
				</div>
			</div>
		</section>

		<section class="mt-6 hidden xl:block" aria-label="Job comparison matrix">
			<div
				class="comparison-grid border-l border-t border-border"
				style:grid-template-columns={`minmax(10rem, 0.72fr) repeat(${selected.length}, minmax(0, 1fr))`}
			>
				<div class="matrix-label bg-surface-subtle">
					<span class={sectionLabel()}>Question</span>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell bg-surface-subtle">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">{entity.statusLabel}</p>
								<h2 class="mt-1 break-words text-base font-bold leading-tight">
									<a href={entity.href} class="hover:text-primary hover:underline">{entity.title}</a
									>
								</h2>
							</div>
							<button
								type="button"
								class="grid size-8 shrink-0 place-items-center text-lg text-muted-foreground hover:bg-accent hover:text-foreground"
								onclick={() => remove(entity)}
								aria-label="Remove {entity.title}">×</button
							>
						</div>
						<div class="mt-3"><SaveJobButton kind={entity.kind} id={entity.code} /></div>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>How close are current AI capabilities?</strong><span
						>Separate OECD evidence for the conservative mapped subset.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="font-mono text-lg font-bold tabular-nums">
							{capabilityText(entity.capabilityProximity)}
						</p>
						{#if entity.capabilityProximity != null}
							<div class="mt-3 h-2 bg-surface-metric" aria-hidden="true">
								<div
									class="h-full"
									style:width={`${entity.capabilityProximity * 100}%`}
									style:background={capabilityColorScale(entity.capabilityProximity)}
								></div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{entity.capabilityDomains
									.slice()
									.sort((a, b) => a.gap / a.gapMaximum - b.gap / b.gapMaximum)
									.slice(0, 3)
									.map(item => item.label)
									.join(' · ')}
							</p>
						{:else}
							<p class="mt-1 text-xs text-muted-foreground">
								No broader occupation or role-level fallback is used.
							</p>
						{/if}
					</div>
				{/each}

				<div class="matrix-label">
					<strong>How much work is within LLM scope?</strong><span
						>Eloundou theoretical exposure for reviewed occupation identities.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="font-mono text-lg font-bold tabular-nums">
							{researchText(entity.theoreticalExposure)}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Technical scope from US task evidence; not Singapore adoption.
						</p>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>Is AI use showing up in practice?</strong><span
						>Observed work-related Claude activity for the mapped US SOC.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="font-mono text-lg font-bold tabular-nums">
							{researchText(entity.observedUse)}
						</p>
						{#if entity.theoryUseGap != null}
							<p class="mt-1 text-xs text-muted-foreground">
								Possible scope is {(entity.theoryUseGap * 100).toFixed(1)} points higher than observed use.
							</p>
						{:else}
							<p class="mt-1 text-xs text-muted-foreground">No compatible observed-use row.</p>
						{/if}
					</div>
				{/each}

				<div class="matrix-label">
					<strong>How much current AI task overlap?</strong><span
						>Relative position across scored Singapore occupations.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="font-mono text-3xl font-black tabular-nums">{pct(entity.position)}</p>
						<p class="mt-1 text-xs text-muted-foreground">out of 100</p>
						<div class="mt-3 h-2 bg-surface-metric" aria-hidden="true">
							<div
								class="h-full"
								style:width={pressureWidth(entity.position)}
								style:background={entity.position == null
									? 'var(--color-pressure-unranked)'
									: pressureColorScale(entity.position)}
							></div>
						</div>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>Is official skills guidance available?</strong><span
						>Selected Singapore Skills Framework role profiles.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						{#if entity.officialSkillProfileCount > 0}
							<p class="text-sm font-bold">{entity.skillsSectors.join(' · ')}</p>
							<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
								{entity.officialSkills.join(' · ')}
							</p>
						{:else}
							<p class="text-sm font-bold">Outside the three-sector pilot</p>
							<p class="mt-1 text-xs text-muted-foreground">No occupation-level fallback is used.</p>
						{/if}
					</div>
				{/each}

				<div class="matrix-label">
					<strong>What is the published pay?</strong><span
						>Gross monthly pay from a direct MOM 2025 row.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="font-mono text-lg font-bold tabular-nums">{wageText(entity)}</p>
						<p class="mt-1 text-xs text-muted-foreground">{entity.wageLabel}</p>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>Is it named in current demand sources?</strong><span
						>Selected official lists, rather than full-market coverage.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="text-sm font-bold">{entity.demand}</p>
						<p class="mt-1 text-xs text-muted-foreground">{entity.demandDetail}</p>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>How was the title matched?</strong><span
						>Official correspondence or a reviewed role mix.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell">
						<p class="text-sm font-bold capitalize">{mappingLabel(entity.mapping)}</p>
						<p class="mt-1 text-xs text-muted-foreground">{entity.mappingDetail}</p>
					</div>
				{/each}

				<div class="matrix-label">
					<strong>What broader context is available?</strong><span
						>Shown at its published labour-market grain.</span
					>
				</div>
				{#each selected as entity (entity.id)}
					<div class="matrix-cell text-sm leading-relaxed text-text-secondary">
						{entity.labourContext ?? 'No broad context attached to this record'}
					</div>
				{/each}
			</div>
		</section>

		<section class="mt-6 grid gap-4 sm:grid-cols-2 xl:hidden" aria-label="Job comparison cards">
			{#each selected as entity (entity.id)}
				<article class="min-w-0 border border-border bg-card">
				<header class="border-b border-border bg-surface-subtle p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">{entity.statusLabel}</p>
								<h2 class="mt-1 break-words text-lg font-bold">
									<a href={entity.href} class="hover:text-primary hover:underline">{entity.title}</a
									>
								</h2>
							</div>
							<button
								type="button"
								class="grid size-10 shrink-0 place-items-center text-xl text-muted-foreground hover:bg-accent"
								onclick={() => remove(entity)}
								aria-label="Remove {entity.title}">×</button
							>
						</div>
						<div class="mt-3"><SaveJobButton kind={entity.kind} id={entity.code} /></div>
					</header>
					<dl class="divide-y divide-border text-sm">
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Relative AI task pressure</dt>
							<dd class="mt-1 font-mono text-3xl font-black tabular-nums">
								{pct(entity.position)}<span class="ml-1 text-xs font-normal text-muted-foreground"
									>/100</span
								>
							</dd>
							<div class="mt-2 h-2 bg-surface-metric">
								<div
									class="h-full"
									style:width={pressureWidth(entity.position)}
									style:background={entity.position == null
										? 'var(--color-pressure-unranked)'
										: pressureColorScale(entity.position)}
								></div>
							</div>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Mapped AI capability proximity</dt>
							<dd class="mt-1 font-mono font-bold">
								{capabilityText(entity.capabilityProximity)}
							</dd>
							<p class="mt-1 text-xs text-muted-foreground">
								OECD evidence; separate from pressure and Singapore adoption.
							</p>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Possible LLM scope</dt>
							<dd class="mt-1 font-mono font-bold">
								{researchText(entity.theoreticalExposure)}
							</dd>
							<p class="mt-1 text-xs text-muted-foreground">Eloundou technical exposure; US task evidence.</p>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Observed AI use</dt>
							<dd class="mt-1 font-mono font-bold">{researchText(entity.observedUse)}</dd>
							<p class="mt-1 text-xs text-muted-foreground">Work-related Claude activity; not Singapore adoption.</p>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Pay in Singapore</dt>
							<dd class="mt-1 font-mono font-bold">{wageText(entity)}</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.wageLabel}</p>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Named demand sources</dt>
							<dd class="mt-1 font-bold">{entity.demand}</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.demandDetail}</p>
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">Official skills guidance</dt>
							<dd class="mt-1 font-bold">
								{entity.officialSkillProfileCount > 0
									? entity.skillsSectors.join(' · ')
									: 'Outside the three-sector pilot'}
							</dd>
							{#if entity.officialSkills.length > 0}
								<p class="mt-1 text-xs text-muted-foreground">{entity.officialSkills.join(' · ')}</p>
							{/if}
						</div>
						<div class="p-4">
							<dt class="text-xs text-muted-foreground">How the title was matched</dt>
							<dd class="mt-1 font-bold capitalize">{mappingLabel(entity.mapping)}</dd>
							<p class="mt-1 text-xs text-muted-foreground">{entity.mappingDetail}</p>
						</div>
					</dl>
				</article>
			{/each}
		</section>
	{/if}

	<aside class="mt-8 border-t border-foreground pt-4 text-xs leading-relaxed text-muted-foreground">
		A blank or unavailable value stays unavailable. Pay, named demand and broad market context sit
		alongside the pressure position; each keeps its own source and meaning.
		<a class="text-primary hover:underline" href="/methodology">How the comparison works</a>
	</aside>
</main>

<style>
	.comparison-grid {
		display: grid;
	}

	.matrix-label,
	.matrix-cell {
		min-width: 0;
		border-right: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		padding: 1rem;
	}

	.matrix-label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.matrix-label span {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
</style>
