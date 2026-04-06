<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import SignalProfileGrid, { type SignalProfileItem } from '$lib/components/viz/SignalProfileGrid.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { riskBandLabels } from '$lib/data';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { buildUnitedStatesOccupationAlternates } from '$lib/data/occupation-alternates';
	import { getUnitedStatesRolesForCanonicalCode } from '$lib/data/countries/us/roles';
	import { pageLayout, card, section, title as titleStyle, body, caption, mono, microLabel, pill } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	const support = $derived(data.occupation.support ?? null);
	const alternates = $derived(
		data.country.code === 'us'
			? buildUnitedStatesOccupationAlternates(
					data.occupation.localCode,
					data.occupation.canonicalCode
				)
			: []
	);
	const relatedRoles = $derived.by(() => {
		if (data.country.code !== 'us') return [];
		if (!data.occupation.canonicalCode) return [];
		return getUnitedStatesRolesForCanonicalCode(data.occupation.canonicalCode);
	});

	const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
	const signalBarClass = (value: number) =>
		value >= 0.66 ? 'bg-impact-leveraged' : value >= 0.33 ? 'bg-risk-moderate' : 'bg-risk-high';
	const currencyFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
	const formatPct = (value: number | null, digits = 0) =>
		value == null ? '—' : `${(value * 100).toFixed(digits)}%`;
	const formatCurrency = (value: number | null, currency = 'USD') =>
		value == null ? '—' : `${currency} ${currencyFormatter.format(value)}`;
	const formatEmploymentCount = (value: number | null) =>
		value == null
			? '—'
			: value >= 1000
				? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}M`
				: `${currencyFormatter.format(value)}K`;

	const supportSignals = $derived<SignalProfileItem[]>(
		support
			? [
					{
						label: 'Task coverage',
						value: formatPct(support.taskPrimitives.matched_task_weight_share),
						barValue: support.taskPrimitives.matched_task_weight_share ?? 0,
						barClass: signalBarClass(support.taskPrimitives.matched_task_weight_share ?? 0),
						note: 'Weighted task overlap from O*NET statements and Anthropic penetration'
					},
					{
						label: 'Wage context',
						value: formatCurrency(support.wageProfile.medianAnnual, 'USD'),
						barValue: support.wageProfile.medianAnnual != null ? clamp01(support.wageProfile.medianAnnual / 200000) : 0,
						barClass: signalBarClass(support.wageProfile.medianAnnual != null ? clamp01(support.wageProfile.medianAnnual / 200000) : 0),
						note: 'Median annual wage from BLS OEWS'
					},
					{
						label: 'Demand outlook',
						value:
							support.demandProfile.projectedChangePct != null
								? `${support.demandProfile.projectedChangePct.toFixed(0)}%`
								: support.demandProfile.outlook ?? '—',
						barValue:
							support.demandProfile.projectedChangePct == null
								? 0
								: clamp01((support.demandProfile.projectedChangePct + 20) / 40),
						barClass: signalBarClass(
							support.demandProfile.projectedChangePct == null
								? 0
								: clamp01((support.demandProfile.projectedChangePct + 20) / 40)
						),
						note: 'Employment projections and openings from BLS'
					},
					{
						label: 'Preparation',
						value: support.jobZone != null ? `Job Zone ${support.jobZone}` : support.demandProfile.education ?? '—',
						barValue: support.jobZone != null ? support.jobZone / 5 : 0,
						barClass: signalBarClass(support.jobZone != null ? support.jobZone / 5 : 0),
						note: 'Preparation and entry requirements from O*NET and BLS'
					}
				]
			: []
	);

	const supportSourceFamilies = $derived(
		support
			? [
					{ key: 'onet-desc', label: 'Occupation Data', active: Boolean(support.occupationDescription) },
					{ key: 'onet-job-zone', label: 'Job Zones', active: support.jobZone != null },
					{ key: 'onet-tasks', label: 'Task Ratings', active: support.taskPrimitives.matched_task_weight_share != null },
					{ key: 'onet-tech', label: 'Tech Skills', active: support.topTechnologies.length > 0 },
					{ key: 'onet-context', label: 'Work Context', active: support.topWorkContext.length > 0 },
					{ key: 'oews', label: 'OEWS Wages', active: support.wageProfile.medianAnnual != null },
					{ key: 'projection', label: 'Projections', active: support.demandProfile.employment2024 != null },
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
				]
			: []
	);
	const supportSourceCount = $derived(supportSourceFamilies.filter(source => source.active).length);
	const wageSpreadPct = $derived.by(() => {
		if (!support) return 0.5;
		const min = support.wageProfile.p10Annual ?? support.wageProfile.p25Annual ?? support.wageProfile.medianAnnual;
		const max = support.wageProfile.p90Annual ?? support.wageProfile.p75Annual ?? support.wageProfile.medianAnnual;
		const median = support.wageProfile.medianAnnual;
		if (min == null || max == null || median == null || max <= min) return 0.5;
		return clamp01((median - min) / (max - min));
	});

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${data.occupation.localTitle} — ${data.country.displayName}`,
					text: `${data.occupation.localTitle}: headline risk ${(data.occupation.headlineRisk * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: data.occupation.localTitle });
		} catch {}
	}
</script>

<Seo
	title={`${data.occupation.localTitle} — ${data.country.displayName}`}
	description={`${data.occupation.localTitle} in ${data.country.name}: structural pressure ${(data.occupation.structuralPressure * 100).toFixed(1)}%, headline risk ${(data.occupation.headlineRisk * 100).toFixed(1)}%, confidence ${data.occupation.confidenceLevel}.`}
	path={`${data.country.routePrefix}/occupation/${data.occupation.localCode}`.replace('//', '/')}
	alternates={alternates}
/>

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: data.country.displayName, href: data.country.routePrefix },
			{ label: data.occupation.localTitle }
		]}
	/>

	<div class={cn(card({ padding: 'lg' }), 'mt-6')}>
		<OccupationHero
			scoreLabel="Headline risk"
			scoreValue={`${(data.occupation.headlineRisk * 100).toFixed(0)}%`}
			scoreBand={data.occupation.riskBand}
			scoreBandLabel={riskBandLabels[data.occupation.riskBand]}
			title={data.occupation.localTitle}
			pills={[
				{ label: data.country.displayName, tone: 'muted' },
				{ label: `ISCO ${data.occupation.canonicalCode}`, tone: 'outline' },
				{ label: data.occupation.mappingMethod ?? 'country layer', tone: 'neutral' }
			]}
			summary={`${data.country.displayName} tracks this occupation on the shared structural baseline and then layers on local demand resilience, wages, and confidence. The comparison spine stays fixed across countries.`}
			meta={[
				data.occupation.employment?.current != null
					? `${data.occupation.employment.current.toLocaleString()} current${data.occupation.employment.projected != null ? ` · ${data.occupation.employment.projected.toLocaleString()} projected` : ''}`
					: 'Employment series available',
				`Confidence ${data.occupation.confidenceLevel}`
			]}
		>
			{#snippet actions()}
				<Button variant="outline" size="sm" class="h-8 text-xs" onclick={shareCurrentPage}>
					Share
				</Button>
			{/snippet}
		</OccupationHero>
	</div>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-primary"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>Why This Score</h2>
		</div>
		<div class="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
			<div class={card({ padding: 'sm' })}>
				{#if support}
					<SignalProfileGrid items={supportSignals} columns={4} />
					<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-4')}>
						{support.occupationDescription ?? 'No O*NET description published.'}
					</p>
					<p class={cn(caption(), 'mt-2')}>
						{#if support.taskPrimitives.matched_task_weight_share != null}
							{(support.taskPrimitives.matched_task_weight_share * 100).toFixed(0)}% weighted task
							match · {((support.taskPrimitives.task_effective_coverage ?? 0) * 100).toFixed(0)}% effective coverage
						{:else}
							Task primitive coverage is not published for this occupation.
						{/if}
					</p>
				{:else}
					<p class={cn(body({ size: 'sm', tone: 'subtle' }))}>
						No published US support bundle is available for this occupation yet.
					</p>
				{/if}
			</div>
			<div class="space-y-3">
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Structural note</p>
					<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
						The US page reuses the same shell as Singapore, but only shows the evidence layers that
						are actually available from official US sources.
					</p>
				</div>
				<div class={card({ padding: 'sm' })}>
					<p class={microLabel()}>Method contract</p>
					<p class={cn(caption(), 'mt-1')}>{globalMethodology.structuralFormula}</p>
					<p class={cn(caption(), 'mt-1')}>{globalMethodology.localFormula}</p>
				</div>
			</div>
		</div>
	</section>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-impact-leveraged"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>United States Now</h2>
		</div>
		{#if support}
			<div class="mt-3 grid gap-3 sm:grid-cols-4">
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>Median Wage</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{formatCurrency(support.wageProfile.medianAnnual, 'USD')}
					</p>
				</div>
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>Employment 2024</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{support.demandProfile.employment2024 != null ? `${support.demandProfile.employment2024.toFixed(1)}K` : 'n/a'}
					</p>
				</div>
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>Projected Change</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{support.demandProfile.projectedChangePct != null ? `${support.demandProfile.projectedChangePct.toFixed(1)}%` : 'n/a'}
					</p>
				</div>
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>Openings</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">
						{support.demandProfile.openings2024_2034 != null ? `${support.demandProfile.openings2024_2034.toFixed(1)}K` : 'n/a'}
					</p>
				</div>
			</div>

			<div class="mt-3 grid gap-3 lg:grid-cols-2">
				<div class={card({ padding: 'sm' })}>
					<p class="text-sm font-semibold text-foreground">Wage distribution</p>
					<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
						{#each [
							{ label: 'p10', value: support.wageProfile.p10Annual },
							{ label: 'p25', value: support.wageProfile.p25Annual },
							{ label: 'median', value: support.wageProfile.medianAnnual },
							{ label: 'p75', value: support.wageProfile.p75Annual },
							{ label: 'p90', value: support.wageProfile.p90Annual }
						] as item}
							<div>
								<p class={cn(caption(), 'uppercase tracking-[0.18em]')}>{item.label}</p>
								<p class="mt-1 text-sm font-semibold text-foreground">
									{formatCurrency(item.value, 'USD')}
								</p>
							</div>
						{/each}
					</div>
					<div class="mt-4 h-2 w-full rounded-full bg-muted">
						<div class="h-2 rounded-full bg-primary" style={`width:${Math.max(Math.min(wageSpreadPct * 100, 100), 5)}%`}></div>
					</div>
					<p class={cn(caption(), 'mt-2')}>
						{support.wageProfile.p10Annual != null && support.wageProfile.p90Annual != null
							? `${formatCurrency(support.wageProfile.p10Annual, 'USD')} to ${formatCurrency(support.wageProfile.p90Annual, 'USD')} published band`
							: 'OEWS wage band published where available.'}
					</p>
				</div>

				<div class={card({ padding: 'sm' })}>
					<p class="text-sm font-semibold text-foreground">Demand outlook</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{support.demandProfile.outlook ?? 'Employment projections are published, but no prose outlook is available.'}
					</p>
					<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div>
							<p class={cn(caption(), 'uppercase tracking-[0.18em]')}>2024</p>
							<p class="mt-1 text-lg font-semibold text-foreground">
								{support.demandProfile.employment2024 != null ? `${support.demandProfile.employment2024.toFixed(1)}K` : 'n/a'}
							</p>
						</div>
						<div>
							<p class={cn(caption(), 'uppercase tracking-[0.18em]')}>2034</p>
							<p class="mt-1 text-lg font-semibold text-foreground">
								{support.demandProfile.employment2034 != null ? `${support.demandProfile.employment2034.toFixed(1)}K` : 'n/a'}
							</p>
						</div>
						<div>
							<p class={cn(caption(), 'uppercase tracking-[0.18em]')}>Education</p>
							<p class="mt-1 text-lg font-semibold text-foreground">{support.demandProfile.education ?? 'n/a'}</p>
						</div>
						<div>
							<p class={cn(caption(), 'uppercase tracking-[0.18em]')}>Experience</p>
							<p class="mt-1 text-lg font-semibold text-foreground">{support.demandProfile.workExperience ?? 'n/a'}</p>
						</div>
					</div>
					<p class={cn(caption(), 'mt-3')}>
						{support.demandProfile.projectedChangePct != null
							? `${support.demandProfile.projectedChangePct.toFixed(1)}% projected change · ${support.demandProfile.openings2024_2034 != null ? `${support.demandProfile.openings2024_2034.toFixed(1)}K openings` : 'openings not published'}`
							: 'Projected change not published.'}
					</p>
				</div>
			</div>
		{:else}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
				<p class="text-sm text-muted-foreground">
					No published US support bundle is available for this occupation yet.
				</p>
			</div>
		{/if}
	</section>

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<div class="flex items-center gap-2">
			<span class="h-4 w-1 rounded-full bg-risk-very-low"></span>
			<h2 class={titleStyle({ size: 'subsection' })}>Role Profile</h2>
		</div>
		{#if support}
			<div class="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
				<div class="space-y-3">
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Skills</p>
						<div class="mt-3 flex flex-wrap gap-2">
						{#each support.skillsProfile.topSkills as skill, index (`skill-${index}`)}
								<span class={pill({ tone: 'muted' })}>{skill}</span>
							{/each}
						</div>
					</div>

					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Tasks</p>
						<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
						{#each support.topTasks.slice(0, 6) as task, index (`task-${index}`)}
								<li class="flex items-start justify-between gap-4">
									<span class="min-w-0 flex-1">
										{task.task}
									</span>
									<span class={cn(caption(), 'shrink-0')}>
										AI use {task.penetration != null ? `${(task.penetration * 100).toFixed(0)}%` : 'n/a'}
									</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Technologies</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each support.topTechnologies.slice(0, 8) as technology, index (`technology-${index}`)}
								<span class={pill({ tone: technology.hot ? 'positive' : technology.inDemand ? 'warning' : 'muted' })}>
									{technology.name}
								</span>
							{/each}
						</div>
					</div>

					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Requirements and friction</p>
						<div class="mt-3 flex flex-wrap gap-2">
							{#each support.requirementProfile as item, index (`${item.label}:${item.value}:${index}`)}
								<span
									class={cn(
										'rounded-full border px-2.5 py-1 text-xs font-medium',
										item.tone === 'pressure'
											? 'border-risk-high/30 bg-risk-high/10 text-risk-high'
											: item.tone === 'protective'
												? 'border-risk-very-low/30 bg-risk-very-low/10 text-risk-very-low'
												: item.tone === 'support'
													? 'border-impact-leveraged/30 bg-impact-leveraged/10 text-impact-leveraged'
													: 'border-border bg-muted text-muted-foreground'
									)}
									title={item.detail ?? undefined}
								>
									{item.label}: {item.value}
								</span>
							{/each}
						</div>
					</div>
				</div>

				<div class="space-y-3">
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Work context</p>
						<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
						{#each support.topWorkContext.slice(0, 6) as contextItem, index (`work-context-${index}`)}
								<li class="flex items-start justify-between gap-3">
									<span class="min-w-0 flex-1">{contextItem.label}</span>
									<span class={cn(caption(), 'shrink-0')}>{contextItem.value.toFixed(1)}/5</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Worker profile</p>
						<div class="mt-3 grid gap-3 sm:grid-cols-2">
							<div>
								<p class={microLabel()}>Median age</p>
								<p class="mt-1 text-2xl font-semibold text-foreground">
									{support.ageProfile.medianAge != null ? support.ageProfile.medianAge.toFixed(1) : 'n/a'}
								</p>
							</div>
							<div>
								<p class={microLabel()}>Total employed</p>
								<p class="mt-1 text-2xl font-semibold text-foreground">
									{formatEmploymentCount(support.ageProfile.totalEmployment)}
								</p>
							</div>
						</div>
						<div class="mt-3 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
							<div>
								<p class={microLabel()}>Under 25</p>
								<p>{support.ageProfile.under25Share != null ? `${(support.ageProfile.under25Share * 100).toFixed(0)}%` : 'n/a'}</p>
							</div>
							<div>
								<p class={microLabel()}>25 to 54</p>
								<p>{support.ageProfile.primeAgeShare != null ? `${(support.ageProfile.primeAgeShare * 100).toFixed(0)}%` : 'n/a'}</p>
							</div>
							<div>
								<p class={microLabel()}>55+</p>
								<p>{support.ageProfile.olderShare != null ? `${(support.ageProfile.olderShare * 100).toFixed(0)}%` : 'n/a'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
				<p class="text-sm text-muted-foreground">
					No published US support bundle is available for this occupation yet.
				</p>
			</div>
		{/if}
	</section>

	{#if data.country.code === 'us'}
		<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
			<div class="flex items-center gap-2">
				<span class="h-4 w-1 rounded-full bg-risk-moderate"></span>
				<h2 class={titleStyle({ size: 'subsection' })}>Related</h2>
			</div>
			{#if relatedRoles.length > 0}
				<div class="mt-3 grid gap-3 md:grid-cols-2">
					{#each relatedRoles as role (role.slug)}
						<a href={`/us/role/${role.slug}`} class="block">
							<div class={card({ padding: 'sm' })}>
								<p class="text-sm font-semibold text-foreground">{role.title}</p>
								<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
									Estimated modern role using the same synthetic blend, with the United States layer
									open instead of the Singapore reference market.
								</p>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
					<p class="text-sm text-muted-foreground">
						No direct US role match is available yet for this occupation. Browse the full role index
						for adjacent synthetic roles and their US views.
					</p>
					<div class="mt-3">
						<a href="/roles" class={pill({ tone: 'outline', interactive: true })}>Browse roles</a>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	<section class={cn(section({ spacing: 'loose' }), 'mt-8')}>
		<Collapsible.Root class={cn(card({ padding: 'none' }), section({ spacing: 'loose' }))}>
			<Collapsible.Trigger
				class={cn(
					'flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:text-foreground',
					microLabel()
				)}
			>
				Technical Details · United States
				<svg
					class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="m6 9 6 6 6-6"></path>
				</svg>
			</Collapsible.Trigger>
			<Collapsible.Content class="border-t border-border px-5 py-4 space-y-4">
				<div class="grid gap-3 lg:grid-cols-2">
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Source family coverage</p>
						<div class="mt-3 flex flex-wrap items-center gap-1.5">
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
						<p class={cn(caption(), 'mt-2')}>
							{supportSourceCount}/{supportSourceFamilies.length} source families · Updated from
							{support?.sourceVintage ?? 'published US source bundle'}
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Mapping quality</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
							{data.occupation.mappingMethod ?? 'country layer'}
							{data.occupation.employment?.current != null ? ' · employment series present' : ''}
						</p>
						<p class={cn(caption(), 'mt-2')}>
							The US layer is built from OEWS wages, projections, ORS requirements, OOH narrative,
							BLS skills, O*NET task/context data, and the support bundle in this repo.
						</p>
					</div>
				</div>

				<div class="grid gap-3 lg:grid-cols-2">
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Narrative overflow</p>
						<div class="mt-2 space-y-2 text-sm text-muted-foreground">
							<p>{support?.narrativeProfile.whatTheyDo ?? 'Not published.'}</p>
							<p>{support?.narrativeProfile.workEnvironment ?? 'Not published.'}</p>
							<p>{support?.narrativeProfile.howToBecomeOne ?? 'Not published.'}</p>
							<p>{support?.narrativeProfile.pay ?? 'Not published.'}</p>
							<p>{support?.narrativeProfile.outlook ?? 'Not published.'}</p>
							{#if support?.narrativeProfile.similarOccupations.length}
								<p class={cn(caption(), 'mt-2')}>
									Similar occupations: {support.narrativeProfile.similarOccupations.join(' · ')}
								</p>
							{/if}
						</div>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class={microLabel()}>Published limitations</p>
						<p class={cn(body({ size: 'sm', tone: 'subtle' }), 'mt-1')}>
							This page shows the local country layer, not realised individual job outcomes. The
							global structural baseline is shared across countries; only the local demand and wage
							layer changes here.
						</p>
						{#if support?.note}
							<p class={cn(caption(), 'mt-2')}>{support.note}</p>
						{/if}
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	</section>
</div>
