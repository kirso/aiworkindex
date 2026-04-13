<script lang="ts">
	import { card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import ContextItemGrid, {
		type ContextItemGridItem
	} from '$lib/components/ui/ContextItemGrid.svelte';
	import type {
		UnitedStatesOccupationSupport
	} from '$lib/data/countries/us/support';

	let { support } = $props<{ support: UnitedStatesOccupationSupport }>();

	/** Deduplicate requirement items: keep only the first occurrence of each label */
	let dedupedRequirements = $derived.by(() => {
		const seen = new Set<string>();
		return support.requirementProfile.filter((item: UnitedStatesOccupationSupport['requirementProfile'][number]) => {
			if (seen.has(item.label)) return false;
			seen.add(item.label);
			return true;
		});
	});

	type SupportSignalItem = {
		label: string;
		value: string;
		barValue: number;
		barClass: string;
		note?: string;
	};

	const currencyFormatter = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0
	});

	const signalBarClass = (value: number) =>
		value >= 0.66 ? 'bg-impact-leveraged' : value >= 0.33 ? 'bg-risk-moderate' : 'bg-risk-high';

	const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

	const formatPct = (value: number | null, digits = 0) =>
		value == null ? '—' : `${(value * 100).toFixed(digits)}%`;

	const formatValue = (value: number | null, digits = 0) =>
		value == null ? '—' : value.toFixed(digits);

	const formatK = (value: number | null, digits = 1) =>
		value == null ? '—' : `${value.toFixed(digits)}K`;

	const formatCurrency = (value: number | null, currency = 'USD') =>
		value == null ? '—' : `${currency} ${currencyFormatter.format(value)}`;

	const formatWorkerCount = (value: number | null) =>
		value == null ? '—' : `${currencyFormatter.format(value)} workers`;

	const formatEmploymentCount = (value: number | null) =>
		value == null
			? '—'
			: value >= 1000
				? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}M`
				: `${currencyFormatter.format(value)}K`;


	const demandChangeValue = $derived(
		support.demandProfile.projectedChangePct == null
			? 0
			: clamp01((support.demandProfile.projectedChangePct + 20) / 40)
	);

	let supportSignals = $derived<SupportSignalItem[]>([
		{
			label: 'AI task overlap',
			value: formatPct(support.taskPrimitives.matched_task_weight_share),
			barValue: support.taskPrimitives.matched_task_weight_share ?? 0,
			barClass: signalBarClass(support.taskPrimitives.matched_task_weight_share ?? 0),
			note: 'Share of job tasks AI can currently perform'
		},
		{
			label: 'Median wage',
			value: formatCurrency(support.wageProfile.medianAnnual, 'USD'),
			barValue:
				support.wageProfile.medianAnnual != null
					? clamp01(support.wageProfile.medianAnnual / 200000)
					: 0,
			barClass: signalBarClass(
				support.wageProfile.medianAnnual != null
					? clamp01(support.wageProfile.medianAnnual / 200000)
					: 0
			),
			note: 'Annual median wage'
		},
		{
			label: 'Demand outlook',
			value:
				support.demandProfile.projectedChangePct != null
					? `${support.demandProfile.projectedChangePct.toFixed(0)}%`
					: (support.demandProfile.outlook ?? '—'),
			barValue: demandChangeValue,
			barClass: signalBarClass(demandChangeValue),
			note: 'Projected employment change 2024–2034'
		},
		{
			label: 'Preparation',
			value:
				support.jobZone != null
					? `Zone ${support.jobZone}/5`
					: (support.demandProfile.education ?? '—'),
			barValue: support.jobZone != null ? support.jobZone / 5 : 0,
			barClass: signalBarClass(support.jobZone != null ? support.jobZone / 5 : 0),
			note: 'Education and training typically needed'
		}
	]);

	let supportSnapshot = $derived<ContextItemGridItem[]>([
		{
			key: 'job-zone',
			label: 'Job zone',
			value: support.jobZone != null ? `${support.jobZone}` : 'n/a',
			description: support.jobZoneSummary ?? 'No preparation summary published.',
			tone: support.jobZone != null && support.jobZone >= 4 ? 'pressure' : 'neutral'
		},
		{
			key: 'wage-median',
			label: 'Median wage',
			value: formatCurrency(support.wageProfile.medianAnnual, 'USD'),
			description:
				support.wageProfile.p25Annual != null && support.wageProfile.p75Annual != null
					? `${formatCurrency(support.wageProfile.p25Annual, 'USD')} to ${formatCurrency(support.wageProfile.p75Annual, 'USD')}`
					: 'OEWS wage context published.',
			tone: support.wageProfile.medianAnnual != null ? 'support' : 'neutral'
		},
		{
			key: 'outlook',
			label: 'Openings',
			value:
				support.demandProfile.openings2024_2034 != null
					? `${support.demandProfile.openings2024_2034.toFixed(1)}K`
					: 'n/a',
			description:
				support.demandProfile.projectedChangePct != null
					? `${support.demandProfile.projectedChangePct.toFixed(1)}% projected change`
					: (support.demandProfile.outlook ?? 'No projection summary published.'),
			tone: support.demandProfile.openings2024_2034 != null ? 'support' : 'neutral'
		},
		{
			key: 'median-age',
			label: 'Median age',
			value: support.ageProfile.medianAge != null ? support.ageProfile.medianAge.toFixed(1) : 'n/a',
			description:
				support.ageProfile.totalEmployment != null
					? `${formatEmploymentCount(support.ageProfile.totalEmployment)} employed`
					: 'No CPS age profile published.',
			tone: support.ageProfile.medianAge != null ? 'protective' : 'neutral'
		}
	]);

	let supportSourceFamilies = $derived([
		{ key: 'onet-desc', label: 'Occupation Data', active: Boolean(support.occupationDescription) },
		{ key: 'onet-job-zone', label: 'Job Zones', active: support.jobZone != null },
		{
			key: 'onet-tasks',
			label: 'Task Ratings',
			active: support.taskPrimitives.matched_task_weight_share != null
		},
		{ key: 'onet-tech', label: 'Tech Skills', active: support.topTechnologies.length > 0 },
		{ key: 'onet-context', label: 'Work Context', active: support.topWorkContext.length > 0 },
		{ key: 'oews', label: 'OEWS Wages', active: support.wageProfile.medianAnnual != null },
		{
			key: 'projection',
			label: 'Projections',
			active: support.demandProfile.employment2024 != null
		},
		{ key: 'ors', label: 'ORS Requirements', active: support.requirementProfile.length > 0 },
		{
			key: 'ooh',
			label: 'OOH Narrative',
			active: Boolean(
				support.narrativeProfile.description ||
				support.narrativeProfile.whatTheyDo ||
				support.narrativeProfile.workEnvironment
			)
		},
		{ key: 'skills', label: 'BLS Skills', active: support.skillsProfile.topSkills.length > 0 },
		{ key: 'cps-age', label: 'CPS Age Table', active: support.ageProfile.medianAge != null }
	] as const);

	let supportSourceCount = $derived(supportSourceFamilies.filter(source => source.active).length);
</script>

<section class="mt-8">
	<p class={sectionLabel()}>Employment overview</p>
	<div class="mt-3 space-y-4">
		<SignalProfileGrid items={supportSignals} columns={4} />

		<div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
			<span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				Data coverage
			</span>
			<div
				class="flex items-center gap-1.5"
				title={`${supportSourceCount} of ${supportSourceFamilies.length} data sources available`}
			>
				{#each supportSourceFamilies as source}
					<div
						class={cn(
							'h-2.5 w-2.5 rounded-full transition-colors',
							source.active ? 'bg-primary' : 'bg-muted-foreground/20'
						)}
						title={source.label + (source.active ? ' ✓' : ' —')}
					></div>
				{/each}
			</div>
			<span class="text-xs text-muted-foreground">
				{supportSourceCount}/{supportSourceFamilies.length} sources available
			</span>
			<span class="text-xs text-muted-foreground">Last updated: {support.sourceVintage}</span>
		</div>

		<ContextItemGrid title="Support snapshot" items={supportSnapshot} />

		<div class={card({ padding: 'sm' })}>
			<p class="text-sm font-semibold text-foreground">What this job involves</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{support.occupationDescription ?? 'No description available.'}
			</p>
			{#if support.jobZoneLabel}
				<p class="mt-2 text-sm text-muted-foreground">
					Entry requirements: {support.jobZoneLabel}
				</p>
			{/if}
			{#if support.jobZoneSummary}
				<p class="mt-1 text-sm text-muted-foreground">{support.jobZoneSummary}</p>
			{/if}
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Wage context</p>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Median annual</p>
						<p class="mt-1 text-2xl font-semibold text-foreground">
							{formatCurrency(support.wageProfile.medianAnnual, 'USD')}
						</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mean annual</p>
						<p class="mt-1 text-2xl font-semibold text-foreground">
							{formatCurrency(support.wageProfile.meanAnnual, 'USD')}
						</p>
					</div>
				</div>
				<div class="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
					<p>Hourly median: {formatCurrency(support.wageProfile.medianHourly, 'USD')}</p>
					<p>Employment: {formatWorkerCount(support.wageProfile.employment)}</p>
					<p>10th percentile: {formatCurrency(support.wageProfile.p10Annual, 'USD')}</p>
					<p>90th percentile: {formatCurrency(support.wageProfile.p90Annual, 'USD')}</p>
				</div>
				<div class="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-primary/80"
						style={`width: ${clamp01((support.wageProfile.medianAnnual ?? 0) / 200000) * 100}%`}
					></div>
				</div>
			</div>

			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Demand outlook</p>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">2024 employment</p>
						<p class="mt-1 text-2xl font-semibold text-foreground">
							{formatK(support.demandProfile.employment2024)}
						</p>
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">2034 employment</p>
						<p class="mt-1 text-2xl font-semibold text-foreground">
							{formatK(support.demandProfile.employment2034)}
						</p>
					</div>
				</div>
				<div class="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
					<p>Openings: {formatK(support.demandProfile.openings2024_2034)}</p>
					<p>Projected change: {formatValue(support.demandProfile.projectedChangePct, 1)}%</p>
					<p>Education: {support.demandProfile.education ?? '—'}</p>
					<p>Work experience: {support.demandProfile.workExperience ?? '—'}</p>
					<p>On-the-job training: {support.demandProfile.onTheJobTraining ?? '—'}</p>
					<p>
						Median wage in projections: {formatCurrency(
							support.demandProfile.medianWage2024,
							'USD'
						)}
					</p>
				</div>
				{#if support.demandProfile.outlook}
					<p class="mt-4 text-sm text-muted-foreground">{support.demandProfile.outlook}</p>
				{/if}
				{#if support.demandProfile.relatedOOHContent}
					<p class="mt-2 text-xs text-muted-foreground">
						{support.demandProfile.relatedOOHContent}
					</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Entry requirements</p>
				{#if dedupedRequirements.length > 0}
					<ul class="mt-3 space-y-1.5 text-sm text-muted-foreground">
						{#each dedupedRequirements as item, index (`${item.label}:${item.value}:${index}`)}
							<li class="flex items-center gap-2">
								<span
									class={cn(
										'inline-block h-2 w-2 shrink-0 rounded-full',
										item.tone === 'pressure'
											? 'bg-risk-moderate'
											: item.tone === 'protective'
												? 'bg-risk-very-low'
												: item.tone === 'support'
													? 'bg-primary'
													: 'bg-muted-foreground/30'
									)}
								></span>
								<span><span class="font-medium text-foreground">{item.label}</span>: {item.value}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-muted-foreground">No requirement data available.</p>
				{/if}
			</div>

			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Day-to-day work</p>
				{#if support.skillsProfile.topSkills.length > 0}
					<div class="mt-3 flex flex-wrap gap-2">
						{#each support.skillsProfile.topSkills as skill, index (`skill-${index}`)}
							<span class="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{skill}</span>
						{/each}
					</div>
				{/if}
				<div class="mt-4 space-y-3 text-sm text-muted-foreground">
					{#if support.narrativeProfile.whatTheyDo}
						<p>{support.narrativeProfile.whatTheyDo}</p>
					{:else if support.narrativeProfile.description}
						<p>{support.narrativeProfile.description}</p>
					{/if}
					{#if support.narrativeProfile.workEnvironment}
						<p>{support.narrativeProfile.workEnvironment}</p>
					{/if}
					{#if support.narrativeProfile.howToBecomeOne}
						<p>{support.narrativeProfile.howToBecomeOne}</p>
					{/if}
				</div>
				{#if support.narrativeProfile.similarOccupations.length > 0}
					<p class="mt-3 text-xs text-muted-foreground">
						Similar occupations: {support.narrativeProfile.similarOccupations
							.slice(0, 4)
							.join(' · ')}
					</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Key tasks</p>
				{#if support.topTasks.length > 0}
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each support.topTasks as task, index (`task-list-${index}`)}
							<li>
								<span class="font-medium text-foreground">{index + 1}.</span>
								{task.task}
								{#if task.penetration != null}
									<span class="text-xs text-muted-foreground">
										· AI can do {(task.penetration * 100).toFixed(0)}%</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-muted-foreground">No task data available.</p>
				{/if}
				{#if support.topTechnologies.length > 0}
					<p class="mt-4 text-xs font-semibold text-foreground">Tools commonly used</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each support.topTechnologies as technology, index (`tech-list-${index}`)}
							<span class={cn('rounded-full bg-muted px-2.5 py-1 text-xs text-foreground')}>
								{technology.name}
								{#if technology.hot && technology.inDemand}
									· trending
								{:else if technology.inDemand}
									· in demand
								{/if}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Work environment</p>
				{#if support.topWorkContext.length > 0}
					<ul class="mt-2 space-y-1.5 text-sm text-muted-foreground">
						{#each support.topWorkContext as item, index (`work-context-${index}`)}
							<li class="flex items-center justify-between">
								<span>{item.label}</span>
								<span class="font-mono text-xs">{item.value.toFixed(1)}/5</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-muted-foreground">No work environment data available.</p>
				{/if}
				{#if support.ageProfile.medianAge != null || support.ageProfile.totalEmployment != null}
					<p class="mt-4 text-sm font-semibold text-foreground">Who does this work</p>
					{#if support.ageProfile.medianAge != null}
						<p class="mt-1 text-sm text-muted-foreground">
							Median age: {support.ageProfile.medianAge.toFixed(1)}
						</p>
					{/if}
					{#if support.ageProfile.totalEmployment != null}
						<p class="mt-1 text-sm text-muted-foreground">
							{formatEmploymentCount(support.ageProfile.totalEmployment)} employed
							· Under 25: {(support.ageProfile.under25Share! * 100).toFixed(0)}%
							· 25–54: {(support.ageProfile.primeAgeShare! * 100).toFixed(0)}%
							· 55+: {(support.ageProfile.olderShare! * 100).toFixed(0)}%
						</p>
					{/if}
				{/if}
			</div>
		</div>

		<div class={card({ padding: 'sm' })}>
			<p class="text-xs text-muted-foreground">
				Data sources: {support.sourceVintage}
			</p>
		</div>
	</div>
</section>
