<script lang="ts">
	import { researchRegistry, type ResearchRole } from '$lib/data/research-registry';
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

	const reviewCutoff = '19 August 2026';
	const roleMeta: Record<ResearchRole, { label: string; description: string }> = {
		active_core: {
			label: 'Headline input',
			description: 'The source allowed to determine the V9 AI Work Pressure Rank.'
		},
		validation: {
			label: 'Outcome and validity checks',
			description:
				'Evidence used to challenge interpretation, compare outcomes or test external validity. It does not receive a score weight.'
		},
		supporting_context: {
			label: 'Supporting and comparison evidence',
			description:
				'Research on observed use, complementarity, tasks, productivity, hiring, demand, mobility and measurement.'
		},
		candidate_v5: {
			label: 'Research agenda',
			description:
				'Useful work that has not met the requirements for a current public evidence field.'
		}
	};

	const roleOrder: ResearchRole[] = [
		'active_core',
		'validation',
		'supporting_context',
		'candidate_v5'
	];
	const groupedEntries = roleOrder
		.map(role => ({
			role,
			meta: roleMeta[role],
			entries: researchRegistry
				.filter(entry => entry.role === role)
				.sort((a, b) => b.published_at.localeCompare(a.published_at))
		}))
		.filter(group => group.entries.length > 0);
	const headlineInputCount = researchRegistry.filter(entry => entry.role === 'active_core').length;
	const validationCount = researchRegistry.filter(entry => entry.role === 'validation').length;
	const currentResearchCount = researchRegistry.filter(entry => entry.year === 2026).length;
</script>

<Seo
	title="AI and Jobs Research Library — V9 Evidence"
	description="The research behind Singapore AI Work Pressure V9, including task exposure, observed AI use, complementarity, employment outcomes and measurement limits."
	path="/research"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Research' }]} />

	<div class="max-w-3xl">
		<p class={sectionLabel()}>Evidence reviewed through {reviewCutoff}</p>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>
			What current research says about AI and jobs
		</h1>
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">
			AI capabilities increasingly overlap with workplace tasks, and observed use is spreading. The
			employment evidence is less settled: studies find task reorganisation, uneven productivity,
			slower hiring in some exposed early-career work, and limited aggregate effects over the
			periods observed so far. V9 therefore measures structural pressure and reports outcome
			evidence separately.
		</p>
	</div>

	<section class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Registered sources</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{researchRegistry.length}</p>
			<p class="text-xs text-muted-foreground">papers, reports and datasets</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Headline input</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{headlineInputCount}</p>
			<p class="text-xs text-muted-foreground">ILO 2025 refined index</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Validity checks</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{validationCount}</p>
			<p class="text-xs text-muted-foreground">kept outside the score</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>2026 sources</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{currentResearchCount}</p>
			<p class="text-xs text-muted-foreground">included by the review cutoff</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What changes the score</h2>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class="font-semibold text-foreground">
				Only the ILO 2025 task-exposure measure sets the V9 rank.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Anthropic, OpenAI, Microsoft, METR, Stanford, NBER, IMF and OECD evidence helps us interpret
				pressure, observed use, complementarity, adoption and possible labour outcomes. Combining
				those unlike constructs into one weighted “risk probability” would add precision without
				adding truth.
			</p>
		</div>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-3">
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Capability is moving faster than outcomes</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				ILO and METR show expanding technical capability. Employment outcomes still depend on
				adoption, reliability, workflow design, prices, demand and organisational decisions.
			</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Usage data describe selected platforms</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Anthropic, OpenAI and Microsoft can observe valuable task patterns, but their users and
				products are not representative samples of Singapore occupations.
			</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Early labour effects are uneven</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Recent US and Danish findings differ by age, task orientation and outcome. V9 does not carry
				their coefficients into Singapore scores.
			</p>
		</div>
	</section>

	{#each groupedEntries as group}
		<section class="mt-12" id={group.role}>
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<h2 class={sectionLabel()}>{group.meta.label}</h2>
				<span class="text-xs text-muted-foreground">{group.entries.length} sources</span>
			</div>
			<p class="mt-2 max-w-3xl text-sm text-muted-foreground">{group.meta.description}</p>

			<div class="mt-4 grid gap-4 lg:grid-cols-2">
				{#each group.entries as entry (entry.key)}
					<article class={card({ padding: 'md' })}>
						<div class="flex flex-wrap items-center gap-2">
							<span
								class="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
							>
								{entry.type.replaceAll('_', ' ')}
							</span>
							<time class="text-xs text-muted-foreground" datetime={entry.published_at}>
								{entry.published_at}
							</time>
						</div>
						<h3 class="mt-3 text-base font-semibold leading-snug text-foreground">{entry.title}</h3>
						<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
							{entry.authors.join(', ')} · {entry.publisher}
						</p>
						<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>

						<div
							class="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground"
						>
							<p><span class="font-semibold text-foreground">Limit:</span> {entry.limitations}</p>
							<p class="mt-2">
								<span class="font-semibold text-foreground">V9 use:</span>
								{entry.repo_notes}
							</p>
						</div>

						<div class="mt-3 flex flex-wrap items-center gap-2">
							{#each entry.domains as domain}
								<span
									class="rounded-full bg-accent/40 px-2 py-0.5 text-[11px] text-muted-foreground"
									>{domain}</span
								>
							{/each}
						</div>

						<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
							<a
								href={entry.url}
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-primary underline"
							>
								Read the source
							</a>
							{#if entry.doi}<span class="break-all text-muted-foreground">DOI {entry.doi}</span
								>{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section class="my-12">
		<h2 class={sectionLabel()}>How sources enter the register</h2>
		<ul
			class="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"
		>
			<li>
				Prefer primary papers, official statistics, lab reports with disclosed methods and public
				datasets.
			</li>
			<li>
				Record what the source measures, its population, geography, date and central limitation.
			</li>
			<li>Separate score inputs, external validity checks and interpretation.</li>
			<li>
				Retain conflicting and null findings rather than selecting only evidence that supports a
				risk narrative.
			</li>
			<li>Re-review the register for each release; the current cutoff is {reviewCutoff}.</li>
		</ul>
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a href="/methodology" class="text-primary underline">How V9 uses the evidence</a>
			<a href="/data" class="text-primary underline">Download the V9 occupation data</a>
			<a href="/reports/v9-release" class="text-primary underline">Read the release report</a>
		</div>
	</section>
</main>
