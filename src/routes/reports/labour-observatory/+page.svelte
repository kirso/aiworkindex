<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();

	const sourceLinks = [
		{
			label: 'Employment by occupation and age',
			href: 'https://tablebuilder.singstat.gov.sg/table/TS/M182171'
		},
		{
			label: 'Labour Force in Singapore 2025',
			href: 'https://stats.mom.gov.sg/Pages/Labour-Force-In-Singapore-2025.aspx'
		},
		{
			label: 'MOM vacancy statistics',
			href: 'https://stats.mom.gov.sg/Pages/JobVacancyTimeSeries.aspx'
		},
		{
			label: 'MOM firm AI-adoption report',
			href: 'https://www.mom.gov.sg/newsroom/press-releases/2026/0430-adoption-of-ai-among-firms'
		}
	];

	function signedPercent(value: number | null): string {
		if (value == null) return 'Unavailable';
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	function share(value: number | null): string {
		return value == null ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;
	}

	function mechanismLabel(status: string): string {
		if (status === 'partial') return 'Partly measured';
		if (status === 'broad_context') return 'Broad context';
		if (status === 'research_only') return 'Research only';
		return 'Context only';
	}
</script>

<Seo
	title="Singapore AI Labour Observatory — V9"
	description="Singapore employment, vacancies, AI adoption and worker context, separated from technical AI task pressure and published at their official data grain."
	path="/reports/labour-observatory"
	type="article"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Labour observatory' }
		]}
	/>

	<header class="max-w-4xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>Evidence reviewed through {data.reviewCutoff}</p>
			<span class={badge({ variant: 'info' })}>V9 economic layer</span>
		</div>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>
			What determines whether AI changes jobs?
		</h1>
		<p class="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
			AI task pressure measures what technology can overlap with. Employment also depends on whether
			firms adopt it, whether demand expands, whether new work appears and how workers and
			institutions adjust. This observatory keeps those observations separate.
		</p>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			{data.claimBoundary}
		</p>
	</header>

	<section class="mt-10" aria-labelledby="national-heading">
		<h2 id="national-heading" class={sectionLabel()}>What Singapore sources currently show</h2>
		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md', accent: 'primary' })}>
				<p class="font-mono text-2xl font-semibold tabular-nums">
					{data.national.firmsStartedAdoptionPct}%
				</p>
				<p class="mt-1 text-sm font-medium">firms had started adopting AI</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					Private establishments with at least 10 employees · MOM 2026
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="font-mono text-2xl font-semibold tabular-nums">
					{data.national.adoptingFirmsRedesignedRolesPct}%
				</p>
				<p class="mt-1 text-sm font-medium">AI-adopting firms redesigned roles</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					Compared with {data.national.adoptingFirmsReducedHeadcountPct}% reporting reduced
					headcount
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="font-mono text-2xl font-semibold tabular-nums">
					{data.national.vacanciesMarchThousands}K
				</p>
				<p class="mt-1 text-sm font-medium">vacancies in March 2026</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					Including {data.national.entryLevelPmetMarchThousands}K entry-level PMET openings in a
					separate source definition
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="font-mono text-2xl font-semibold tabular-nums">
					+{data.national.q2EmploymentChange.toLocaleString()}
				</p>
				<p class="mt-1 text-sm font-medium">preliminary Q2 employment change</p>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					National change; it does not identify an AI effect
				</p>
			</div>
		</div>
	</section>

	<section class="mt-12" aria-labelledby="mechanisms-heading">
		<div class="max-w-3xl">
			<h2 id="mechanisms-heading" class={sectionLabel()}>
				Six mechanisms, six different questions
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				The working identity is: <span class="font-medium text-foreground"
					>{data.outcomeIdentity}</span
				>. It organises evidence; it is not an estimable occupation formula with the current public
				data.
			</p>
		</div>
		<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each data.mechanisms as mechanism, index (mechanism.id)}
				<article class={card({ padding: 'md', accent: index === 0 ? 'primary' : undefined })}>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<p class="font-mono text-xs text-muted-foreground">0{index + 1}</p>
						<span class={badge({ variant: mechanism.status === 'partial' ? 'info' : 'outline' })}>
							{mechanismLabel(mechanism.status)}
						</span>
					</div>
					<h3 class="mt-3 font-semibold leading-snug text-foreground">{mechanism.question}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{mechanism.v9_evidence}</p>
					<p class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Still needed
					</p>
					<ul class="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
						{#each mechanism.missing_for_outcome as missing (missing)}
							<li>{missing}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-12" aria-labelledby="rebound-heading">
		<div class="grid gap-5 border border-border bg-card p-5 sm:p-7 lg:grid-cols-[0.8fr_1.2fr]">
			<div>
				<p class={sectionLabel()}>Productivity and rebound</p>
				<h2 id="rebound-heading" class="mt-2 text-2xl font-semibold tracking-tight">
					When can cheaper production increase employment?
				</h2>
			</div>
			<div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
				<p>
					AI can reduce labour required per unit while increasing the number of units customers buy.
					The employment result depends on price reductions, demand response, market expansion and
					work created elsewhere in the production chain.
				</p>
				<p>
					V9 has no occupation-specific price, quantity or demand-elasticity series. It therefore
					does not label any occupation as protected by a Jevons effect or threatened by weak
					demand.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-12" aria-labelledby="groups-heading">
		<div class="max-w-3xl">
			<h2 id="groups-heading" class={sectionLabel()}>Broad occupation-group evidence</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				These cards describe groups containing many different occupations. Employment changes are
				measured for residents and are not attributed to AI.
			</p>
		</div>
		<div class="mt-4 grid gap-4 lg:grid-cols-2">
			{#each data.groups as group (group.code)}
				<article class={card({ padding: 'lg' })}>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="font-mono text-xs text-muted-foreground">SSOC major group {group.code}</p>
							<h3 class="mt-1 text-lg font-semibold text-foreground">{group.title}</h3>
						</div>
						<span
							class={badge({
								variant: group.employmentLatestThousands == null ? 'outline' : 'info'
							})}
						>
							{group.employmentLatestThousands == null
								? 'Unavailable separately'
								: 'Observed group'}
						</span>
					</div>

					{#if group.employmentLatestThousands != null}
						<div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div>
								<p class="text-xs text-muted-foreground">Employed · 2025</p>
								<p class="mt-1 font-mono font-semibold tabular-nums">
									{group.employmentLatestThousands.toLocaleString()}K
								</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">From 2024</p>
								<p class="mt-1 font-mono font-semibold tabular-nums">
									{signedPercent(group.employmentYearOverYearPct)}
								</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Aged 15–29</p>
								<p class="mt-1 font-mono font-semibold tabular-nums">
									{share(group.youngWorkerShare)}
								</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Vacancy rate</p>
								<p class="mt-1 font-mono font-semibold tabular-nums">
									{group.vacancyRate == null ? 'Unavailable' : `${group.vacancyRate.toFixed(1)}%`}
								</p>
							</div>
						</div>
						{#if group.topIndustries.length > 0}
							<div class="mt-4 border-t border-border pt-4">
								<p class="text-xs text-muted-foreground">Largest 2025 industries</p>
								<div class="mt-2 flex flex-wrap gap-2">
									{#each group.topIndustries as industry (industry.key)}
										<span class="border border-border px-2 py-1 text-xs">
											{industry.label} · {(industry.share_2025 * 100).toFixed(1)}%
										</span>
									{/each}
								</div>
							</div>
						{/if}
						{#if group.labourSummary}
							<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
								{group.labourSummary}
							</p>
						{/if}
					{:else}
						<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
							The retained source has no separate broad observation for this major group. V9 does
							not fill it from a neighbouring category.
						</p>
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-12" aria-labelledby="coverage-heading">
		<div class="max-w-3xl">
			<h2 id="coverage-heading" class={sectionLabel()}>Where occupation-level evidence stops</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{data.scenarioPolicy}</p>
		</div>
		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each [['AI task pressure', data.coverage.pressure_ranked, '987 scored occupations'], ['Direct pay rows', data.coverage.direct_wage, 'MOM June 2025'], ['Named demand', data.coverage.named_demand, 'Selected reviewed sources'], ['Broad employment context', data.coverage.broad_employment_context, 'Context, not detailed data'], ['Detailed AI adoption', data.coverage.detailed_ai_adoption, 'No suitable public source'], ['Demand elasticity', data.coverage.detailed_output_or_price_elasticity, 'No occupation series'], ['New-task creation', data.coverage.detailed_new_task_creation, 'No comparable series'], ['Causal AI outcomes', data.coverage.causal_ai_labour_outcomes, 'No identified occupation effects']] as item}
				<div class={card({ padding: 'md', variant: 'metric' })}>
					<p class="font-mono text-2xl font-semibold tabular-nums">{item[1]}</p>
					<p class="mt-1 text-sm font-medium">{item[0]}</p>
					<p class="mt-1 text-xs text-muted-foreground">{item[2]}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-12 grid gap-6 lg:grid-cols-2">
		<div>
			<h2 class={sectionLabel()}>Publication gates</h2>
			<div class="mt-3 space-y-3">
				{#each data.publicationGates as gate (gate.key)}
					<div class="border-b border-border pb-3">
						<p class="text-sm font-semibold capitalize text-foreground">
							{gate.key.replaceAll('_', ' ')}
						</p>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{gate.description}</p>
					</div>
				{/each}
			</div>
		</div>
		<div>
			<h2 class={sectionLabel()}>Primary Singapore sources</h2>
			<div class="mt-3 space-y-3">
				{#each sourceLinks as source (source.href)}
					<a
						href={source.href}
						target="_blank"
						rel="noopener noreferrer"
						class="block border-b border-border pb-3 text-sm font-medium text-primary underline"
					>
						{source.label}
					</a>
				{/each}
			</div>
			<div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
				<a href="/data" class="font-medium text-primary underline">Download V9 data</a>
				<a href="/methodology#economic-evidence" class="font-medium text-primary underline">
					Read the economic evidence method
				</a>
			</div>
		</div>
	</section>
</main>
