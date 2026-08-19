<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		card,
		caption,
		display,
		formInput,
		pageLayout,
		sectionLabel,
		title
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data } = $props();
	type Entry = (typeof data.entries)[number];
	let entries = $state<Entry[]>([]);
	let indexLoading = $state(true);
	let indexFailed = $state(false);
	let query = $state('');
	let selected = $state<Entry | null>(null);
	let searchOpen = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/data/v9-ui-index.json?v=2026-08-19-v9');
			if (!response.ok) throw new Error(`UI index returned ${response.status}`);
			const index = (await response.json()) as { checker_entries: typeof data.entries };
			entries = index.checker_entries;
		} catch {
			indexFailed = true;
		} finally {
			indexLoading = false;
		}
	});

	let results = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [] as Entry[];
		return entries
			.filter(entry => entry.searchText.includes(needle))
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 10);
	});

	function choose(entry: Entry) {
		selected = entry;
		query = entry.title;
		searchOpen = false;
	}

	function positionText(entry: Entry): string {
		if (entry.position == null) {
			return entry.kind === 'role'
				? 'This non-official query is withheld because no fixed SSOC 2024 mapping is defensible.'
				: 'The official mapping does not provide enough usable ILO evidence for a pressure rank. This is unknown, not zero.';
		}
		const measure =
			entry.kind === 'role' ? 'an estimated comparison percentile' : 'a midrank percentile';
		return `Its task exposure has ${measure} of ${entry.position.toFixed(1)} among ${entry.comparisonPopulation} scored official Singapore occupations.`;
	}

	function matchingAlias(entry: Entry): string | null {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return null;
		return (entry.queryAliases ?? []).find(alias => alias.toLowerCase().includes(needle)) ?? null;
	}
</script>

<Seo
	title="Will AI Take My Job? Check AI Job Risk in Singapore"
	description="Search 1,001 official Singapore occupations and 88 modern job-title queries: 67 official resolutions, 18 disclosed estimates and 3 withheld mappings."
	path="/will-ai-take-my-job"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI job pressure checker' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Evidence explorer</p>
		<h1 class={title({ size: 'page' })}>How much AI pressure is on your job?</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			Search Singapore's SSOC 2024 occupations or familiar modern job titles. A title may resolve to
			an official occupation, use a disclosed composite or be withheld when no fixed mapping is
			defensible. Any published result measures task exposure to generative AI; it does not predict
			whether you will lose your job.
		</p>
	</header>

	<section class="relative mt-7" aria-label="Search for your job">
		<label class={sectionLabel()} for="job-search">Find your occupation or role</label>
		<input
			id="job-search"
			type="search"
			class={cn(formInput({ size: 'lg' }), 'mt-2 w-full')}
			placeholder="Try accountant, AI engineer, driver, product manager…"
			bind:value={query}
			onfocus={() => (searchOpen = true)}
			onblur={() => setTimeout(() => (searchOpen = false), 180)}
		/>
		{#if searchOpen && query.trim().length >= 2}
			<div
				class="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto border border-foreground bg-card"
			>
				{#if results.length === 0}
					<p class="p-4 text-sm text-muted-foreground">No match found. Try a shorter job title.</p>
				{:else}
					{#each results as result (result.id)}
						<button
							type="button"
							class="flex w-full min-w-0 items-start justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent"
							onmousedown={() => choose(result)}
						>
							<span class="min-w-0">
								<span class="block truncate text-sm font-bold">{result.title}</span>
								<span class="block text-xs text-muted-foreground"
									>{matchingAlias(result)
										? `Modern title “${matchingAlias(result)}” · SSOC ${result.code}`
										: `${result.statusLabel}${result.kind === 'occupation' ? ` · SSOC ${result.code}` : ''}`}</span
								>
							</span>
							<span class="shrink-0 font-mono text-sm font-bold tabular-nums"
								>{result.position == null ? 'Withheld' : result.position.toFixed(1)}</span
							>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
		<p class={cn(caption(), 'mt-2')}>
			{data.counts.occupations.toLocaleString()} official occupations · {data.counts.roles} non-official
			role queries ({data.counts.estimatedRoles} estimated, {data.counts.withheldRoles} withheld)
		</p>
		{#if indexLoading || indexFailed}
			<p class="mt-1 text-xs text-muted-foreground" aria-live="polite">
				{indexFailed
					? 'The evidence index could not load. Open the occupation browser to continue.'
					: 'Loading the occupation evidence index…'}
			</p>
		{/if}
	</section>

	{#if selected}
		<section class="mt-8 border border-foreground bg-card">
			<div class="grid gap-px bg-border md:grid-cols-[minmax(14rem,0.8fr)_minmax(0,2fr)]">
				<div class="bg-card p-5 sm:p-6">
					<p class="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
						{selected.positionKind}
					</p>
					<p class={cn(display({ size: 'xl' }), 'mt-2')}>
						{selected.position == null ? '—' : selected.position.toFixed(1)}
					</p>
					<p class={caption()}>{selected.statusLabel}</p>
				</div>
				<div class="bg-card p-5 sm:p-6">
					<p class="font-mono text-xs text-muted-foreground">
						{selected.kind === 'occupation' ? `SSOC ${selected.code}` : 'Modern role'}
					</p>
					<h2 class="mt-1 text-2xl font-black tracking-tight">{selected.title}</h2>
					<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
						{positionText(selected)}
					</p>
					<p class="mt-2 text-sm font-medium">
						This is task pressure, not a probability of job loss.
					</p>
				</div>
			</div>

			<div class="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<div class="bg-card p-4">
					<p class={caption()}>ILO mean task-exposure score</p>
					<p class="mt-1 font-mono text-lg font-bold tabular-nums">
						{selected.rawExposure == null
							? 'Not available'
							: `${(selected.rawExposure * 100).toFixed(1)}/100`}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>ILO category evidence</p>
					<p class="mt-1 text-sm font-bold">{selected.category}</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Direct monthly wage</p>
					<p class="mt-1 font-mono text-lg font-bold tabular-nums">
						{selected.wage == null
							? selected.kind === 'role'
								? 'No role-level estimate'
								: 'Not published'
							: `SGD ${selected.wage.toLocaleString()}`}
					</p>
					{#if selected.kind === 'role'}<p class="mt-1 text-xs text-muted-foreground">
							Component wages stay separate
						</p>{/if}
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Current named demand evidence</p>
					<p class="mt-1 text-sm font-bold">
						{selected.demandSignals.length
							? selected.demandSignals.join(' · ')
							: 'No reviewed named match'}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">No match does not mean weak demand.</p>
				</div>
			</div>

			<div class="grid gap-5 border-t border-foreground p-5 sm:p-6 lg:grid-cols-2">
				<div>
					<p class={sectionLabel()}>What raises concern</p>
					<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
						<li>
							High pressure means the occupation has a higher ILO task-exposure score relative to
							other scored Singapore occupations.
						</li>
						<li>
							Observed employer adoption and product capability can turn technical exposure into
							real workflow change.
						</li>
						<li>Entry-level hiring, wages and task mix may move before total employment does.</li>
					</ul>
				</div>
				<div>
					<p class={sectionLabel()}>What the score cannot settle</p>
					<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
						<li>Demand for the occupation, regulation, firm choices and worker adaptation.</li>
						<li>
							Whether AI complements workers, substitutes for tasks or creates additional work.
						</li>
						<li>Your employer, seniority, skills, income or individual probability of job loss.</li>
					</ul>
				</div>
			</div>

			{#if selected.labourContext}
				<div class="border-t border-border bg-surface-subtle p-4 text-sm leading-relaxed">
					<strong>Broad current labour context:</strong>
					{selected.labourContext}
					<span class="text-muted-foreground">
						This cluster evidence does not change the occupation rank.</span
					>
				</div>
			{/if}

			<div class="flex flex-wrap gap-2 border-t border-border p-4">
				<Button href={selected.href}>Open the full evidence page</Button>
				<Button variant="outline" href="/compare?entities={selected.id}"
					>Compare with another job</Button
				>
			</div>
		</section>
	{:else}
		<section class={cn(card({ padding: 'md', variant: 'subtle' }), 'mt-8')}>
			<p class="text-sm leading-relaxed text-text-secondary">
				The checker uses the same published V9 evidence as the occupation and role pages. It does
				not ask personal questions or turn an exposure rank into a prediction about you.
			</p>
		</section>
	{/if}

	<aside class="mt-8 border-t border-foreground pt-4 text-xs leading-relaxed text-muted-foreground">
		V9 uses the ILO 2025 refined generative-AI task exposure index mapped through the official SSOC
		2024 to ISCO-08 correspondence. Wages and current demand remain separate evidence. <a
			class="text-primary hover:underline"
			href="/methodology">Read the methodology</a
		>.
	</aside>
</main>
