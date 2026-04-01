<script lang="ts">
	import researchLibrary from '$lib/data/research-library.json';
	import {
		title as titleStyle,
		pageLayout,
		card,
		sectionLabel,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const roleMeta = {
		active_core: {
			label: 'Active core',
			description:
				'Directly informs the live structural score, its context, or its official validation layer.'
		},
		validation: {
			label: 'Validation',
			description: 'Used to cross-check the live score rather than to generate it.'
		},
		candidate_v5: {
			label: 'Next horizon',
			description:
				'Research not yet absorbed into the live model and reserved for future post-V6 calibration work.'
		},
		supporting_context: {
			label: 'Supporting context',
			description:
				'Reference datasets and methodology inputs used for explanation, task matching, or supporting surfaces.'
		}
	} as const;

	const roleOrder = ['active_core', 'validation', 'candidate_v5', 'supporting_context'] as const;

	const groupedEntries = roleOrder
		.map(role => ({
			role,
			meta: roleMeta[role],
			entries: researchLibrary.entries.filter(entry => entry.role === role)
		}))
		.filter(group => group.entries.length > 0);
</script>

<Seo
	title="Research Library"
	description="Canonical in-repo library of the papers, reports, and datasets behind the live methodology, validation layer, and next-horizon roadmap."
	path="/research"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Research' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Research Library</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">What this page is for</p>
		<p class="mt-1 text-sm text-muted-foreground">
			This is the citation layer for the project. It stores the papers, reports, and datasets the
			repo references, plus short repo-specific notes about how each source is used. It does not
			restate formulas from <a href="/methodology" class="text-primary hover:underline"
				>Methodology</a
			>, schema details from <a href="/data" class="text-primary hover:underline">Data</a>, or
			release narratives from <a href="/reports" class="text-primary hover:underline">Reports</a>.
		</p>
	</div>

	<div class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Entries</p>
			<p class="mt-1 text-lg font-bold text-foreground">{researchLibrary.entry_count}</p>
			<p class="text-xs text-muted-foreground">canonical research records</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Active core</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{researchLibrary.role_counts.active_core}
			</p>
			<p class="text-xs text-muted-foreground">used directly by the live model</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Next horizon</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{researchLibrary.role_counts.candidate_v5}
			</p>
			<p class="text-xs text-muted-foreground">not yet absorbed into the live model</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>JSON artifact</p>
			<p class="mt-1 text-lg font-bold text-foreground">1</p>
			<p class="text-xs text-muted-foreground">
				<a href="/data/research-library.json" download class="text-primary hover:underline"
					>research-library.json</a
				>
			</p>
		</div>
	</div>

	{#each groupedEntries as group}
		<section class="mt-8">
			<details open={group.role === 'active_core'}>
				<summary class="cursor-pointer">
					<span class={sectionLabel()}>{group.meta.label}</span>
					<span class="ml-2 text-xs text-muted-foreground">({group.entries.length} entries)</span>
				</summary>
				<p class="mt-2 text-sm text-muted-foreground">{group.meta.description}</p>
				<div class="mt-4 grid gap-4 lg:grid-cols-2">
					{#each group.entries as entry (entry.key)}
						<article class={card({ padding: 'md' })}>
							<div class="flex flex-wrap items-center gap-2">
								<p class="text-sm font-semibold text-foreground">{entry.title}</p>
								<span
									class="rounded-full border border-border/60 bg-muted/70 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
								>
									{entry.type.replaceAll('_', ' ')}
								</span>
								<span
									class="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
								>
									{entry.year}
								</span>
							</div>
							<p class="mt-1 text-xs text-muted-foreground">
								{entry.authors.join(', ')} · {entry.publisher}
							</p>
							<p class="mt-3 text-sm text-muted-foreground">{entry.summary}</p>
							<details class="mt-2">
								<summary
									class="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground"
								>
									Limitations, repo use, and domains
								</summary>
								<div class="mt-1 space-y-1">
									<p class="text-xs text-muted-foreground">
										<span class="font-medium text-foreground">Limitations:</span>
										{entry.limitations}
									</p>
									<p class="text-xs text-muted-foreground">
										<span class="font-medium text-foreground">Repo use:</span>
										{entry.repo_notes}
									</p>
									<div class="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
										{#each entry.domains as domain}
											<span class="rounded-full bg-accent/40 px-2 py-0.5">{domain}</span>
										{/each}
									</div>
								</div>
							</details>
							<div class="mt-3 text-xs text-muted-foreground">
								<span class="font-medium text-foreground">Used for:</span>
								{entry.used_for.join(' · ')}
							</div>
							<div class="mt-3 flex items-center gap-3 text-xs">
								<a
									href={entry.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary hover:underline"
								>
									Open source →
								</a>
								{#if entry.doi}
									<span class="text-muted-foreground">DOI {entry.doi}</span>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			</details>
		</section>
	{/each}
</main>
