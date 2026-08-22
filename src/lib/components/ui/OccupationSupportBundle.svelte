<script lang="ts">
	import { card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import ContextItemGrid, {
		type ContextItemGridItem
	} from '$lib/components/ui/ContextItemGrid.svelte';
	import WageCard from '$lib/components/ui/WageCard.svelte';
	import DemandOutlookCard from '$lib/components/ui/DemandOutlookCard.svelte';
	import TaskListCard from '$lib/components/ui/TaskListCard.svelte';
	import WorkContextCard from '$lib/components/ui/WorkContextCard.svelte';
	import RequirementsList from '$lib/components/ui/RequirementsList.svelte';
	import type { UnitedStatesOccupationSupport } from '$lib/data/countries/us/support';

	let { support } = $props<{ support: UnitedStatesOccupationSupport }>();

	/** Deduplicate requirement items: keep only the first occurrence of each label */
	let dedupedRequirements = $derived.by(() => {
		const seen = new Set<string>();
		return support.requirementProfile.filter(
			(item: UnitedStatesOccupationSupport['requirementProfile'][number]) => {
				if (seen.has(item.label)) return false;
				seen.add(item.label);
				return true;
			}
		);
	});

	type SupportSignalItem = {
		label: string;
		value: string;
		barValue: number;
		barClass: string;
		note?: string;
	};

	const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

	const formatPct = (value: number | null, digits = 0) =>
		value == null ? '—' : `${(value * 100).toFixed(digits)}%`;

	const formatCurrency = (value: number | null, currency = 'USD') =>
		value == null
			? '—'
			: `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;

	const signalBarClass = (value: number) =>
		value >= 0.66 ? 'bg-impact-leveraged' : value >= 0.33 ? 'bg-risk-moderate' : 'bg-risk-high';

	const demandChangeValue = $derived(
		support.demandProfile.projectedChangePct == null
			? 0
			: clamp01((support.demandProfile.projectedChangePct + 20) / 40)
	);

	let supportSignals = $derived<SupportSignalItem[]>([
		{
			label: 'Matched task evidence',
			value: formatPct(support.taskPrimitives.matched_task_weight_share),
			barValue: support.taskPrimitives.matched_task_weight_share ?? 0,
			barClass: signalBarClass(support.taskPrimitives.matched_task_weight_share ?? 0),
			note: 'Share of weighted task evidence matched to the supporting task dataset; not an automation share'
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
					: 'Wage data published.',
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
					? `${support.ageProfile.totalEmployment >= 1000 ? `${(support.ageProfile.totalEmployment / 1000).toFixed(1)}M` : `${new Intl.NumberFormat('en-US').format(support.ageProfile.totalEmployment)}K`} employed`
					: 'No age profile published.',
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
		{ key: 'oews', label: 'Wages', active: support.wageProfile.medianAnnual != null },
		{
			key: 'projection',
			label: 'Projections',
			active: support.demandProfile.employment2024 != null
		},
		{ key: 'ors', label: 'Requirements', active: support.requirementProfile.length > 0 },
		{
			key: 'ooh',
			label: 'Narrative',
			active: Boolean(
				support.narrativeProfile.description ||
				support.narrativeProfile.whatTheyDo ||
				support.narrativeProfile.workEnvironment
			)
		},
		{ key: 'skills', label: 'Skills', active: support.skillsProfile.topSkills.length > 0 },
		{ key: 'cps-age', label: 'Age Data', active: support.ageProfile.medianAge != null }
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

		<ContextItemGrid title="Key metrics" items={supportSnapshot} />

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

		<!-- Shared data-block components -->
		<div class="grid gap-3 lg:grid-cols-2">
			<WageCard
				median={support.wageProfile.medianAnnual}
				mean={support.wageProfile.meanAnnual}
				p10={support.wageProfile.p10Annual}
				p25={support.wageProfile.p25Annual}
				p75={support.wageProfile.p75Annual}
				p90={support.wageProfile.p90Annual}
				hourly={support.wageProfile.medianHourly}
				employment={support.wageProfile.employment}
				currency="USD"
				period="annual"
			/>
			<DemandOutlookCard
				current={support.demandProfile.employment2024}
				projected={support.demandProfile.employment2034}
				changePct={support.demandProfile.projectedChangePct}
				openings={support.demandProfile.openings2024_2034}
				education={support.demandProfile.education}
				experience={support.demandProfile.workExperience}
				training={support.demandProfile.onTheJobTraining}
				medianWage={support.demandProfile.medianWage2024}
				currency="USD"
				outlook={support.demandProfile.outlook}
				relatedContent={support.demandProfile.relatedOOHContent}
			/>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<RequirementsList items={dedupedRequirements} />

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
			<TaskListCard tasks={support.topTasks} technologies={support.topTechnologies} />
			<WorkContextCard
				items={support.topWorkContext}
				demographics={support.ageProfile.medianAge != null
					? {
							medianAge: support.ageProfile.medianAge,
							totalEmployment: support.ageProfile.totalEmployment,
							under25Share: support.ageProfile.under25Share,
							primeAgeShare: support.ageProfile.primeAgeShare,
							olderShare: support.ageProfile.olderShare
						}
					: undefined}
			/>
		</div>

		<div class={card({ padding: 'sm' })}>
			<p class="text-xs text-muted-foreground">
				Data sources: {support.sourceVintage}
			</p>
		</div>
	</div>
</section>
