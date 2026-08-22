<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { trackProductEvent } from '$lib/analytics';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import PersonalWorkCheck from '$lib/components/product/PersonalWorkCheck.svelte';
	import SaveJobButton from '$lib/components/product/SaveJobButton.svelte';
	import SharePageButton from '$lib/components/product/SharePageButton.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
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
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';
	import { onMount } from 'svelte';

	let { data } = $props();
	type Entry = (typeof data.entries)[number];
	let entries = $state<Entry[]>([]);
	let indexLoading = $state(true);
	let indexFailed = $state(false);
	let query = $state('');
	let selected = $state<Entry | null>(null);
	let searchOpen = $state(false);

	const faqItems = [
		{
			question: 'Will AI take my job?',
			answer:
				'No occupation score can answer that as a probability. AI Work Index shows current overlap between generative-AI capabilities and mapped occupation tasks, then places scored Singapore occupations on a relative scale. Hiring demand, employer choices, regulation, adoption and your own work still matter.'
		},
		{
			question: 'What does the 0–100 AI task-pressure position mean?',
			answer:
				'It is a relative midrank position among 987 scored SSOC 2024 occupations in V9. It is not the percentage of tasks automated and it is not the chance of job loss. Tied occupation scores share the same position.'
		},
		{
			question: 'Does the personal work check change my occupation score?',
			answer:
				'No. Your selected activities, AI use, error consequences and review responsibility stay in your browser. They produce reviewed guidance for experiments and questions; the published occupation record remains unchanged.'
		}
	];

	onMount(async () => {
		try {
			const response = await fetch('/data/v9-ui-index.json?v=2026-08-19-v9');
			if (!response.ok) throw new Error(`UI index returned ${response.status}`);
			const index = (await response.json()) as { checker_entries: typeof data.entries };
			entries = index.checker_entries;
			const requested = page.url.searchParams.get('job');
			if (requested) {
				const match = entries.find(entry => entry.id === requested);
				if (match) {
					selected = match;
					query = match.title;
				}
			}
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
		trackProductEvent('job_search_selected', { entity_kind: entry.kind, context: 'checker' });
		goto(`/will-ai-take-my-job?job=${encodeURIComponent(entry.id)}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	function positionText(entry: Entry): string {
		if (entry.position == null) {
			return entry.kind === 'role'
				? 'This modern title covers too many different kinds of work for one defensible estimate. Use the full page to choose a closer occupation.'
				: 'This occupation cannot be placed on the relative scale because its official mapping has too little usable task evidence.';
		}
		const population = entry.comparisonPopulation ?? data.counts.scored;
		return entry.kind === 'role'
			? `This reviewed role estimate sits at ${entry.position.toFixed(1)} on the same 0–100 comparison scale used for ${population.toLocaleString()} scored Singapore occupations. The estimate depends on its published occupation mix.`
			: `This official occupation sits at ${entry.position.toFixed(1)} on a 0–100 relative scale across ${population.toLocaleString()} scored Singapore occupations. The position reflects how much the mapped tasks overlap with current generative-AI capabilities.`;
	}

	function matchingAlias(entry: Entry): string | null {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return null;
		return (entry.queryAliases ?? []).find(alias => alias.toLowerCase().includes(needle)) ?? null;
	}
</script>

<Seo
	title="Will AI Take My Job? Check Your Work in Singapore"
	description="Find your Singapore occupation, see its current AI task pressure, and build a personal plan for what to try, verify, keep human-led and monitor."
	path="/will-ai-take-my-job"
	jsonLd={[buildFaqJsonLd(faqItems)]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI job pressure checker' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Find your work</p>
		<h1 class={title({ size: 'page' })}>See where AI may change your work first</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			Start with a Singapore occupation or a familiar modern title. You will see where its tasks sit
			on the national pressure scale, then describe the work you actually do and get a practical
			plan.
		</p>
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
			<p><strong class="text-foreground">Published:</strong> occupation and market evidence</p>
			<p><strong class="text-foreground">Private:</strong> your answers stay in this browser</p>
			<p><strong class="text-foreground">Outcome:</strong> guidance, not a job-loss forecast</p>
		</div>
	</header>

	<section class="relative mt-7" aria-label="Search for your job">
		<label class={sectionLabel()} for="job-search">What work do you do?</label>
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
		<section class="mt-8 border border-foreground bg-card" aria-labelledby="selected-job-title">
			<div class="grid gap-px bg-border md:grid-cols-[minmax(14rem,0.8fr)_minmax(0,2fr)]">
				<div class="bg-surface-metric p-5 sm:p-6">
					<p class={sectionLabel()}>Relative AI task pressure</p>
					<p class={cn(display({ size: 'xl' }), 'mt-2')}>
						{selected.position == null ? '—' : selected.position.toFixed(1)}
					</p>
					<p class={caption()}>
						{selected.position == null ? 'Position unavailable' : 'out of 100'}
					</p>
				</div>
				<div class="bg-card p-5 sm:p-6">
					<p class="font-mono text-xs text-muted-foreground">
						{selected.kind === 'occupation' ? `SSOC ${selected.code}` : 'Modern role'}
					</p>
					<h2 id="selected-job-title" class="mt-1 text-2xl font-black tracking-tight">
						{selected.title}
					</h2>
					<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
						{positionText(selected)}
					</p>
					<p class="mt-2 text-xs text-muted-foreground">{selected.statusLabel}</p>
				</div>
			</div>

			<div class="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<div class="bg-card p-4">
					<p class={caption()}>Mapped AI capability proximity</p>
					<p class="mt-1 font-mono text-lg font-bold tabular-nums">
						{selected.capabilityProximity == null
							? 'No conservative profile'
							: `${(selected.capabilityProximity * 100).toFixed(1)}/100`}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{selected.capabilityProximity == null
							? 'No broader occupation or role fallback is used.'
							: `Closest mapped domains: ${selected.capabilityDomains
									.slice()
									.sort((a, b) => a.gap / a.gapMaximum - b.gap / b.gapMaximum)
									.slice(0, 2)
									.map(item => item.label)
									.join(' · ')}.`}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Pay in Singapore</p>
					<p class="mt-1 font-mono text-lg font-bold tabular-nums">
						{selected.wage == null
							? selected.kind === 'role'
								? 'No role-level figure'
								: 'Not published'
							: `SGD ${selected.wage.toLocaleString()}`}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{selected.wage == null
							? 'Open the full page for any component context.'
							: 'Median gross monthly pay, MOM 2025.'}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Named in current demand sources</p>
					<p class="mt-1 text-sm font-bold">
						{selected.demandSignals.length
							? selected.demandSignals.join(' · ')
							: 'No named match in the reviewed lists'}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						These sources cover selected occupations rather than the whole labour market.
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Title and data status</p>
					<p class="mt-1 text-sm font-bold">{selected.statusLabel}</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{selected.kind === 'occupation'
							? 'Official SSOC 2024 occupation.'
							: `${selected.componentCount ?? 0} official occupation components.`}
					</p>
				</div>
			</div>

			{#if selected.labourContext}
				<div
					class="border-t border-border bg-surface-subtle p-4 text-sm leading-relaxed text-text-secondary"
				>
					<strong class="text-foreground">Current labour-market context:</strong>
					{selected.labourContext}
				</div>
			{/if}

			<div class="flex flex-wrap gap-2 border-t border-border p-4">
				<Button href={selected.href}>Open the full job page</Button>
				<Button variant="outline" href="/compare?entities={selected.id}"
					>Compare with another job</Button
				>
				<SaveJobButton kind={selected.kind} id={selected.code} />
				<SharePageButton title={`${selected.title} — AI Work Index`} />
			</div>

			<details class="border-t border-border p-4">
				<summary class="cursor-pointer text-sm font-bold">Technical result details</summary>
				<div class="mt-3 grid gap-3 text-sm sm:grid-cols-3">
					<p>
						<span class="block text-xs text-muted-foreground">Published position type</span>
						<strong>{selected.positionKind}</strong>
					</p>
					<p>
						<span class="block text-xs text-muted-foreground">ILO task-exposure score</span>
						<strong
							>{selected.rawExposure == null
								? 'Unavailable'
								: `${(selected.rawExposure * 100).toFixed(1)}/100`}</strong
						>
					</p>
					<p>
						<span class="block text-xs text-muted-foreground">ILO category</span>
						<strong>{selected.category}</strong>
					</p>
				</div>
			</details>
		</section>

		{#key selected.id}
			<PersonalWorkCheck entityId={selected.id} entityTitle={selected.title} />
		{/key}
	{:else}
		<section class={cn(card({ padding: 'md', variant: 'subtle' }), 'mt-8')}>
			<h2 class="text-base font-bold">What you will get</h2>
			<div class="mt-3 grid gap-3 text-sm text-text-secondary sm:grid-cols-3">
				<p>
					<strong class="block text-foreground">1. Your job's position</strong>See how its tasks
					compare with other scored Singapore occupations.
				</p>
				<p>
					<strong class="block text-foreground">2. Your work pattern</strong>Choose the activities,
					consequences and review responsibility that shape your day.
				</p>
				<p>
					<strong class="block text-foreground">3. Your next moves</strong>Get experiments, checks,
					human-led work and questions to take to your employer.
				</p>
			</div>
		</section>
	{/if}

	<aside class="mt-8 border-t border-foreground pt-4 text-xs leading-relaxed text-muted-foreground">
		The published occupation position comes from ILO 2025 task evidence mapped through the official
		SSOC 2024 correspondence. Your answers create guidance only. Pay and demand are shown alongside
		the position. <a class="text-primary hover:underline" href="/methodology">How the index works</a
		>.
	</aside>

	<FaqList items={faqItems} />
</main>
