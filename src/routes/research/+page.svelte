<script lang="ts">
	import {
		RESEARCH_REVIEW_CUTOFF,
		researchRegistry,
		type ResearchRole
	} from '$lib/data/research-registry';
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

	function formatPublishedAt(value: string): string {
		if (/^\d{4}$/.test(value)) return value;
		if (/^\d{4}-\d{2}$/.test(value)) {
			return new Intl.DateTimeFormat('en-SG', {
				month: 'long',
				year: 'numeric',
				timeZone: 'UTC'
			}).format(new Date(`${value}-01T00:00:00Z`));
		}
		return new Intl.DateTimeFormat('en-SG', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(`${value}T00:00:00Z`));
	}

	const reviewCutoff = formatPublishedAt(RESEARCH_REVIEW_CUTOFF);
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

	<section class="mt-10 grid gap-px border border-border bg-border lg:grid-cols-2">
		<div class="bg-card p-5 sm:p-6">
			<p class={sectionLabel()}>Published comparison layer</p>
			<h2 class="mt-2 text-xl font-bold text-foreground">Theory and use are visible separately</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				For 68 reviewed occupation identities, V9 publishes Eloundou's theoretical exposure. For 66,
				it also publishes Anthropic's observed-use measure. The difference is an adoption question
				to investigate, not a forecast.
			</p>
		</div>
		<div class="bg-surface-subtle p-5 sm:p-6">
			<p class="text-sm leading-relaxed text-muted-foreground">
				The mapping requires one reviewed detailed-title identity and one exact source occupation.
				Looser transfers stay unavailable, and neither source changes the ILO pressure rank.
			</p>
			<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
				<a href="/reports/research-signals" class="font-semibold text-primary underline"
					>Explore the comparison</a
				>
				<a href="/data/v9-research-signals.json" class="text-primary underline">Download JSON</a>
			</div>
		</div>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-3">
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Capability is multidimensional</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				ILO and OECD measures compare AI capabilities with different parts of work. V9 uses the ILO
				task measure for its rank and keeps the OECD capability-gap work as a separate research
				path.
			</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Use does not settle the job outcome</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Anthropic, OpenAI and Microsoft can observe valuable task patterns, but their users and
				products are not representative samples of Singapore occupations. Adoption, productivity,
				hiring and employment remain distinct measurements.
			</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<h2 class="font-semibold text-foreground">Career ladders need direct evidence</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Recent work raises questions about junior hiring and learning-by-doing. Singapore does not
				yet publish an occupation-level measure that can answer them, so V9 applies no age or
				seniority modifier.
			</p>
		</div>
	</section>

	<p class="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
		A source's publication date, observation period and V9 review date are different. Cards show
		publication and observation separately. “Reviewed through {reviewCutoff}” only tells you when
		this register was last checked.
	</p>

	{#each groupedEntries as group}
		<section class="mt-12" id={group.role}>
			<details open={group.role === 'active_core'} class="border border-border bg-card">
				<summary
					class="flex min-h-12 cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4"
				>
					<span class={sectionLabel()}>{group.meta.label}</span>
					<span class="text-xs text-muted-foreground">{group.entries.length} sources</span>
				</summary>
				<div class="border-t border-border p-4 sm:p-5">
					<p class="max-w-3xl text-sm text-muted-foreground">{group.meta.description}</p>

					<div class="mt-4 grid gap-4 lg:grid-cols-2">
						{#each group.entries as entry (entry.key)}
							<article class={card({ padding: 'md' })}>
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
									>
										{entry.type.replaceAll('_', ' ')}
									</span>
									<span class="text-xs text-muted-foreground">
										Published
										<time datetime={entry.published_at}
											>{formatPublishedAt(entry.published_at)}</time
										>
									</span>
									{#if entry.observation_period}
										<span class="text-xs text-muted-foreground"
											>Observed {entry.observation_period}</span
										>
									{/if}
								</div>
								<h3 class="mt-3 text-base font-semibold leading-snug text-foreground">
									{entry.title}
								</h3>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
									{entry.authors.join(', ')} · {entry.publisher}
								</p>
								<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>

								<div
									class="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground"
								>
									<p>
										<span class="font-semibold text-foreground">Limit:</span>
										{entry.limitations}
									</p>
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
				</div>
			</details>
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
