<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import SignalProfileGrid, {
		type SignalProfileItem
	} from '$lib/components/viz/SignalProfileGrid.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { riskBandLabels } from '$lib/data';
	import { buildUnitedStatesOccupationAlternates } from '$lib/data/occupation-alternates';
	import { getUnitedStatesRolesForCanonicalCode } from '$lib/data/countries/us/roles';
	import {
		pageLayout,
		card,
		section,
		sectionLabel,
		title as titleStyle,
		body,
		caption,
		mono,
		microLabel,
		pill
	} from '$lib/design-system';
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
				: `${value.toFixed(value >= 10 ? 0 : 1)}K`;

	const formatWageShort = (value: number | null) =>
		value == null ? '—' : `$${Math.round(value / 1000)}K`;

	function filterRequirements(items: NonNullable<typeof support>['requirementProfile']) {
		return items
			.filter(item => {
				const numVal = parseFloat(item.value.replace(/[<>%]/g, ''));
				return !isNaN(numVal) && numVal >= 5; // hide near-zero
			})
			.map(item => {
				const numVal = parseFloat(item.value.replace(/[<>%]/g, ''));
				// For complementary pairs, keep only the meaningful side
				if (numVal > 95) return null; // skip the ">99.5%" side
				// Differentiate credential types using detail field
				let label = item.label;
				if (item.label === 'Credentials' && item.detail) {
					if (
						item.detail.toLowerCase().includes('license') ||
						item.detail.toLowerCase().includes('certification')
					)
						label = 'License required';
					else if (item.detail.toLowerCase().includes('apprentice')) label = 'Apprenticeship';
					else if (
						item.detail.toLowerCase().includes('educational') ||
						item.detail.toLowerCase().includes('certificate')
					)
						label = 'Certificate';
				}
				// Fix tone: high credentialing is protective
				const tone = numVal > 50 ? 'protective' : item.tone;
				return { ...item, label, tone };
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);
	}

	const supportSignals = $derived<SignalProfileItem[]>(
		support
			? [
					{
						label: 'Tasks',
						value: formatPct(support.taskPrimitives.matched_task_weight_share),
						barValue: clamp01(support.taskPrimitives.matched_task_weight_share ?? 0),
						barClass: signalBarClass(
							clamp01(support.taskPrimitives.matched_task_weight_share ?? 0)
						),
						note: 'Share of job tasks that overlap with current AI capabilities'
					},
					{
						label: 'Wage',
						value: formatWageShort(support.wageProfile.medianAnnual),
						barValue:
							support.wageProfile.medianAnnual != null
								? clamp01(support.wageProfile.medianAnnual / 200000)
								: 0,
						barClass: signalBarClass(
							support.wageProfile.medianAnnual != null
								? clamp01(support.wageProfile.medianAnnual / 200000)
								: 0
						),
						note: 'Median annual wage'
					},
					{
						label: 'Demand',
						value:
							support.demandProfile.projectedChangePct != null
								? `${support.demandProfile.projectedChangePct.toFixed(0)}%`
								: '—',
						barValue:
							support.demandProfile.projectedChangePct == null
								? 0
								: clamp01((support.demandProfile.projectedChangePct + 20) / 40),
						barClass: signalBarClass(
							support.demandProfile.projectedChangePct == null
								? 0
								: clamp01((support.demandProfile.projectedChangePct + 20) / 40)
						),
						note: 'Projected employment change over 10 years'
					},
					{
						label: 'Preparation',
						value: support.jobZone != null ? `Zone ${support.jobZone}` : '—',
						barValue: support.jobZone != null ? clamp01(support.jobZone / 5) : 0,
						barClass: signalBarClass(support.jobZone != null ? clamp01(support.jobZone / 5) : 0),
						note: 'Typical preparation needed for this occupation'
					}
				]
			: []
	);

	const supportSourceFamilies = $derived(
		support
			? [
					{
						key: 'onet-desc',
						label: 'Occupation Data',
						active: Boolean(support.occupationDescription)
					},
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
					{
						key: 'skills',
						label: 'BLS Skills',
						active: support.skillsProfile.topSkills.length > 0
					},
					{ key: 'cps-age', label: 'CPS Age Table', active: support.ageProfile.medianAge != null }
				]
			: []
	);
	const supportSourceCount = $derived(supportSourceFamilies.filter(source => source.active).length);

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
	{alternates}
/>

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: data.country.displayName, href: data.country.routePrefix },
			{ label: data.occupation.localTitle }
		]}
	/>

	<!-- ===== BLOCK 1: THE VERDICT ===== -->
	<div class={cn(card({ padding: 'lg' }), section({ spacing: 'loose' }))}>
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
			summary={`${data.country.displayName} tracks this occupation on the shared structural baseline and then layers on local demand resilience, wages, and confidence.`}
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

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-primary"></span>
			Why This Score
		</h2>
		<div class={card({ padding: 'md' })}>
			{#if support}
				<SignalProfileGrid items={supportSignals} columns={4} />
				<div class="mt-4 pt-4 border-t border-border grid gap-4 md:grid-cols-5">
					<div class="md:col-span-3">
						<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>
							Occupation profile
						</p>
						<p class={body({ tone: 'muted' })}>
							{support.occupationDescription ?? 'No O*NET description published.'}
						</p>
					</div>
					<div class="md:col-span-2 space-y-3">
						<div>
							<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>
								Task evidence
							</p>
							<p class={body({ tone: 'muted' })}>
								{#if support.taskPrimitives.matched_task_weight_share != null}
									{(support.taskPrimitives.matched_task_weight_share * 100).toFixed(0)}% weighted
									task match · {(
										(support.taskPrimitives.task_effective_coverage ?? 0) * 100
									).toFixed(0)}% effective coverage
								{:else}
									Task primitive coverage is not published for this occupation.
								{/if}
							</p>
						</div>
						<div>
							<p class={caption()}>
								Scores combine AI task overlap, human advantages, and local demand. <a
									href="/methodology"
									class="text-primary hover:underline">How it works</a
								>
							</p>
						</div>
					</div>
				</div>
			{:else}
				<p class={body({ tone: 'muted' })}>
					No published US support bundle is available for this occupation yet.
				</p>
			{/if}
		</div>
	</section>

	<!-- ===== BLOCK 3: UNITED STATES NOW ===== -->
	{#if support}
		<section class={section({ spacing: 'loose' })}>
			<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
				<span class="h-4 w-1 rounded-full bg-impact-leveraged"></span>
				United States Now
			</h2>
			<div class={card({ padding: 'md' })}>
				<div class="grid gap-3 sm:grid-cols-4 mb-4">
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Median Wage</p>
						<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
							{formatCurrency(support.wageProfile.medianAnnual, 'USD')}
						</p>
					</div>
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Employment 2024</p>
						<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
							{support.demandProfile.employment2024 != null
								? `${support.demandProfile.employment2024.toFixed(1)}K`
								: '—'}
						</p>
					</div>
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Projected Change (2024–34)</p>
						<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
							{support.demandProfile.projectedChangePct != null
								? `${support.demandProfile.projectedChangePct.toFixed(1)}%`
								: '—'}
						</p>
					</div>
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Openings (2024–34)</p>
						<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
							{support.demandProfile.openings2024_2034 != null
								? `${support.demandProfile.openings2024_2034.toFixed(1)}K`
								: '—'}
						</p>
					</div>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
							Wage distribution
						</p>
						<div class="flex flex-wrap gap-x-4 gap-y-1">
							{#each [{ label: 'Bottom 10%', value: support.wageProfile.p10Annual }, { label: '25th pctl', value: support.wageProfile.p25Annual }, { label: 'Median', value: support.wageProfile.medianAnnual }, { label: '75th pctl', value: support.wageProfile.p75Annual }, { label: 'Top 10%', value: support.wageProfile.p90Annual }] as item}
								<span class={caption()}>
									{item.label}: {formatCurrency(item.value, 'USD')}
								</span>
							{/each}
						</div>
						{#if support.wageProfile.medianAnnual != null}
							<div class="mt-3 h-1.5 w-full rounded-full bg-muted">
								<div
									class="h-1.5 rounded-full bg-primary/80"
									style={`width: ${clamp01(support.wageProfile.medianAnnual / 200000) * 100}%`}
								></div>
							</div>
						{/if}
					</div>
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
							Demand outlook
						</p>
						<p class={body({ tone: 'muted' })}>
							{support.demandProfile.outlook ??
								'Projections published, but no prose outlook available.'}
						</p>
						<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
							<span class={caption()}>Education: {support.demandProfile.education ?? '—'}</span>
							<span class={caption()}
								>Experience: {support.demandProfile.workExperience ?? '—'}</span
							>
						</div>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== BLOCK 4: ROLE PROFILE ===== -->
	{#if support}
		<section class={section({ spacing: 'loose' })}>
			<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
				<span class="h-4 w-1 rounded-full bg-risk-very-low"></span>
				Role Profile
			</h2>
			<div class={card({ padding: 'md' })}>
				{#if support.skillsProfile.topSkills.length > 0}
					<div class="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-border">
						{#each support.skillsProfile.topSkills as skill, index (`skill-${index}`)}
							<span class={pill({ tone: 'primary' })}>{skill}</span>
						{/each}
					</div>
				{/if}

				<div class="grid gap-6 md:grid-cols-5">
					<div class="md:col-span-3 space-y-4">
						{#if support.topTasks.length > 0}
							<div>
								<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>Tasks</p>
								<ul class="space-y-2">
									{#each support.topTasks.slice(0, 6) as task, index (`task-${index}`)}
										<li class="flex items-start justify-between gap-4 text-sm">
											<span class="min-w-0 flex-1 text-muted-foreground">
												<span class="font-medium text-foreground">{index + 1}.</span>
												{task.task}
											</span>
											{#if task.penetration != null}
												<span class={cn(caption(), 'shrink-0')}>
													AI use: {(task.penetration * 100).toFixed(0)}%
												</span>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if support.topTechnologies.length > 0}
							<div class="pt-3 border-t border-border">
								<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
									Technologies
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each support.topTechnologies.slice(0, 8) as technology, index (`tech-${index}`)}
										<span
											class={pill({
												tone: technology.hot
													? 'positive'
													: technology.inDemand
														? 'warning'
														: 'muted'
											})}
										>
											{technology.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						{#if support.requirementProfile.length > 0}
							<div class="pt-3 border-t border-border">
								<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
									Requirements
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each filterRequirements(support.requirementProfile) as item (item.label + item.value)}
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
						{/if}
					</div>

					<div class="md:col-span-2 space-y-4">
						{#if support.topWorkContext.length > 0}
							<div>
								<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
									Work context
								</p>
								<div class="space-y-1.5">
									{#each support.topWorkContext.slice(0, 6) as contextItem, index (`ctx-${index}`)}
										<div class="flex items-center justify-between gap-3 text-sm">
											<span class="text-muted-foreground">{contextItem.label}</span>
											<span class={cn(mono({ size: 'sm' }), 'text-foreground')}
												>{contextItem.value.toFixed(1)}/5</span
											>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if support.ageProfile.medianAge != null}
							<div class="pt-3 border-t border-border">
								<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
									Worker profile
								</p>
								<p class={body({ tone: 'muted' })}>
									Median age {support.ageProfile.medianAge.toFixed(1)}
									{#if support.ageProfile.totalEmployment != null}
										· {formatEmploymentCount(support.ageProfile.totalEmployment)} employed
									{/if}
								</p>
								{#if support.ageProfile.under25Share != null}
									<p class={cn(caption(), 'mt-1')}>
										Under 25: {((support.ageProfile.under25Share ?? 0) * 100).toFixed(0)}% · 25–54: {(
											(support.ageProfile.primeAgeShare ?? 0) * 100
										).toFixed(0)}% · 55+: {((support.ageProfile.olderShare ?? 0) * 100).toFixed(0)}%
									</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== BLOCK 5: RELATED ===== -->
	{#if data.country.code === 'us'}
		<section class={section({ spacing: 'loose' })}>
			<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
				<span class="h-4 w-1 rounded-full bg-risk-moderate"></span>
				Related
			</h2>
			{#if relatedRoles.length > 0}
				<div class={card({ padding: 'md' })}>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each relatedRoles as role (role.slug)}
							<a
								href={`/us/role/${role.slug}`}
								class={cn(
									card({ padding: 'sm', variant: 'inset' }),
									'block hover:bg-accent hover:shadow-sm transition-all group'
								)}
							>
								<p class={cn(body(), 'font-medium text-foreground')}>
									{role.title}
									<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
										>→</span
									>
								</p>
								<p class={cn(caption(), 'mt-1')}>Estimated modern role scored with US data</p>
							</a>
						{/each}
					</div>
				</div>
			{:else}
				<div class={card({ padding: 'md' })}>
					<p class={body({ tone: 'muted' })}>
						No direct US role match is available yet for this occupation.
					</p>
					<div class="mt-3">
						<a href="/roles" class={pill({ tone: 'outline', interactive: true })}>Browse roles</a>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	<!-- ===== TECHNICAL DETAILS (collapsible) ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), section({ spacing: 'loose' }))}>
		<Collapsible.Trigger
			class={cn(
				sectionLabel(),
				'flex w-full items-center justify-between px-5 py-3 hover:text-foreground transition-colors'
			)}
		>
			Technical Details · {data.occupation.localCode}
			<svg
				class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
			>
		</Collapsible.Trigger>
		<Collapsible.Content
			class="border-t border-border px-5 py-4 text-xs text-muted-foreground space-y-3"
		>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Source coverage</p>
					<div class="flex flex-wrap items-center gap-1.5 mt-1">
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
					<p class="mt-1">
						{supportSourceCount}/{supportSourceFamilies.length} source families ·
						{support?.sourceVintage ?? 'published US source bundle'}
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Mapping quality</p>
					<p>
						{data.occupation.mappingMethod ?? 'country layer'}
						{data.occupation.employment?.current != null ? ' · employment series present' : ''}
					</p>
				</div>
			</div>

			{#if support}
				<details class="pt-3 border-t border-border">
					<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary">
						Narrative & sources
					</summary>
					<div class="mt-3 grid gap-3 sm:grid-cols-2">
						<div class="space-y-2">
							{#if support.narrativeProfile.whatTheyDo}
								<p>{support.narrativeProfile.whatTheyDo}</p>
							{/if}
							{#if support.narrativeProfile.workEnvironment}
								<p>{support.narrativeProfile.workEnvironment}</p>
							{/if}
							{#if support.narrativeProfile.howToBecomeOne}
								<p>{support.narrativeProfile.howToBecomeOne}</p>
							{/if}
						</div>
						<div class="space-y-2">
							{#if support.narrativeProfile.pay}
								<p>{support.narrativeProfile.pay}</p>
							{/if}
							{#if support.narrativeProfile.outlook}
								<p>{support.narrativeProfile.outlook}</p>
							{/if}
							{#if support.narrativeProfile.similarOccupations.length > 0}
								<p>Similar: {support.narrativeProfile.similarOccupations.join(' · ')}</p>
							{/if}
						</div>
					</div>
				</details>
			{/if}

			<div class="pt-3 border-t border-border">
				<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>
					Published limitations
				</p>
				<p>
					This page shows the local country layer, not realised individual job outcomes. The global
					structural baseline is shared across countries; only the local demand and wage layer
					changes here.
				</p>
				{#if support?.note}
					<p class="mt-1">{support.note}</p>
				{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>
