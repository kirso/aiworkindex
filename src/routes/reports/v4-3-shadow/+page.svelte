<script lang="ts">
	import { experimentalStatusLabel } from '$lib/data/experimental-status-display';
	import experimentalMethodology from '$lib/data/experimental-methodology-v43.json';
	import { siteStatus } from '$lib/data/site-status';
	import {
		title as titleStyle,
		pageLayout,
		card,
		sectionLabel,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const inputRows = Object.entries(experimentalMethodology.required_inputs).map(([key, value]) => ({
		key,
		...value
	}));
	const presentInputCount = inputRows.filter(row => row.present).length;
	const coverage = experimentalMethodology.coverage;
	const promotionGates = experimentalMethodology.promotion_gates;
	const blockers = experimentalMethodology.blockers ?? [];
	const headlineHoldItems = [
		...(!experimentalMethodology.shadow_score_published
			? ['A task-adjusted shadow score artifact is not published yet.']
			: []),
		...promotionGates
			.filter((gate: { state: string }) => gate.state !== 'pass')
			.map(
				(gate: { label: string; note: string; state: string }) =>
					`${gate.label}: ${gate.state === 'pending' ? 'still pending review' : gate.note}`
			),
		...(blockers.length === 0 && !experimentalMethodology.shadow_score_published
			? [
					'Input readiness is no longer the blocker; promotion now depends on publishing the shadow score and clearing validation review.'
				]
			: [])
	];
	const shippedNow = [
		'Bootstrap uncertainty intervals are published on occupations today.',
		'Structural risk and near-term risk are separated in the forecast layer.',
		'Task-primitives fields now publish weighted evidence where normalized O*NET task matches exist; sparse occupations remain explicit null.',
		'The release and governance surfaces now expose shadow-model readiness instead of hiding it.'
	];
	const remainingInputGaps =
		blockers.length > 0
			? blockers.map((blocker: { note: string }) => blocker.note)
			: ['All required local shadow-model inputs are now present.'];
	const experimentalStatusBadgeClass =
		siteStatus.experimental_release?.status === 'ready_for_shadow_scoring'
			? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
			: siteStatus.experimental_release?.status === 'blocked'
				? 'bg-risk-high-subtle text-risk-high border-risk-high-border'
				: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';

	function formatPct(value: number | null | undefined, digits = 0): string {
		return typeof value === 'number' ? `${(value * 100).toFixed(digits)}%` : 'n/a';
	}

	function formatState(state: string): string {
		return state.replaceAll('_', ' ');
	}

	function stateClass(state: string): string {
		if (state === 'pass' || state === 'passed' || state === 'ready_for_shadow_scoring') {
			return 'text-impact-leveraged';
		}
		if (state === 'blocked') return 'text-risk-high';
		return 'text-risk-moderate';
	}
</script>

<Seo
	title="V4.3 Shadow Model Note"
	description="What the V4.3 task-weighted shadow model would change, what is ready now, and what still gates promotion beyond the published V4.2 release."
	path="/reports/v4-3-shadow"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V4.3 Shadow Model' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V4.3 Shadow Model Note</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
		<div class="flex flex-wrap items-center gap-2">
			<p class="text-sm font-semibold text-foreground">
				Status: {siteStatus.experimental_release.label}
			</p>
			<Badge variant="outline" class={experimentalStatusBadgeClass}>
				{experimentalStatusLabel(siteStatus.experimental_release.status)}
			</Badge>
		</div>
		<p class="mt-1 text-sm text-muted-foreground">
			This page explains release impact and readiness. It does not replace the formula spec on
			<a href="/methodology" class="text-primary hover:underline">Methodology</a>, the threshold
			detail on <a href="/methodology/appendix" class="text-primary hover:underline">Appendix</a>,
			or the schema/download contract on
			<a href="/data" class="text-primary hover:underline">Data</a>.
		</p>
	</div>

	<div class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Published baseline</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{experimentalMethodology.published_baseline_version}
			</p>
			<p class="text-xs text-muted-foreground">current live structural score</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Required inputs ready</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{presentInputCount}/{inputRows.length}
			</p>
			<p class="text-xs text-muted-foreground">present locally for shadow scoring</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Direct task-weighted occupations</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{coverage.direct_task_weighted_occupation_count}
			</p>
			<p class="text-xs text-muted-foreground">currently eligible for shadow-score coverage</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Bootstrap coverage</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{formatPct(coverage.bootstrap_uncertainty_coverage_share)}
			</p>
			<p class="text-xs text-muted-foreground">already live in the published dataset</p>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>What Changes Already Affect Users</p>
	<div class="grid gap-3 md:grid-cols-2">
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">Already live in V4.2</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				{#each shippedNow as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">
				What still does not affect the headline score
			</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				{#each headlineHoldItems as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Remaining Input Gaps</p>
	<div class={card({ padding: 'md' })}>
		<ul class="space-y-2 text-sm text-muted-foreground">
			{#each remainingInputGaps as item}
				<li>{item}</li>
			{/each}
		</ul>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Input Readiness</p>
	<div class="grid gap-3 md:grid-cols-2">
		{#each inputRows as row (row.key)}
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-foreground">{row.key.replaceAll('_', ' ')}</p>
						<p class="mt-1 text-xs text-muted-foreground">{row.file}</p>
					</div>
					<Badge
						variant="outline"
						class={row.present
							? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
							: 'bg-risk-high-subtle text-risk-high border-risk-high-border'}
					>
						{row.present ? 'present' : 'missing'}
					</Badge>
				</div>
				<div class="mt-3 h-2 rounded-full bg-muted">
					<div
						class={row.present
							? 'h-2 rounded-full bg-impact-leveraged'
							: 'h-2 rounded-full bg-risk-high'}
						style={`width: ${row.present ? 100 : 18}%`}
					></div>
				</div>
			</div>
		{/each}
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Coverage Snapshot</p>
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Occupations</p>
			<p class="mt-1 text-lg font-bold text-foreground">{coverage.occupation_count}</p>
			<p class="text-xs text-muted-foreground">current published universe</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Direct mapped</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{coverage.direct_mapped_occupation_count}
			</p>
			<p class="text-xs text-muted-foreground">eligible for the direct coverage gate</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Median direct matched task share</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{formatPct(coverage.median_direct_matched_task_weight_share)}
			</p>
			<p class="text-xs text-muted-foreground">current direct-coverage gate basis</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Task-weighted share</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{formatPct(coverage.task_weighted_share)}
			</p>
			<p class="text-xs text-muted-foreground">headline score still untouched</p>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Promotion Gates</p>
	<div class={card({ padding: 'none' })}>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Gate</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Threshold</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Actual</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">State</th>
					</tr>
				</thead>
				<tbody>
					{#each promotionGates as gate (gate.key)}
						<tr class="border-b border-border/50 last:border-b-0">
							<td class="px-3 py-3">
								<p class="font-medium text-foreground">{gate.label}</p>
								<p class="mt-1 text-xs text-muted-foreground">{gate.note}</p>
							</td>
							<td class="px-3 py-3 text-xs text-muted-foreground">
								{gate.comparator}
								{String(gate.threshold)}
							</td>
							<td class="px-3 py-3 text-xs text-muted-foreground">
								{gate.actual === null ? 'n/a' : String(gate.actual)}
							</td>
							<td class={cn('px-3 py-3 text-xs font-semibold', stateClass(gate.state))}>
								{formatState(gate.state)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="mt-8 grid gap-3 md:grid-cols-2">
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">If V4.3 is eventually promoted</p>
			<p class="mt-2 text-sm text-muted-foreground">
				The intended direction is a task-weighted shadow model with effective coverage,
				automation-pressure, augmentation-upside, and concentration-aware net risk. Those candidate
				formulas are published as governance scaffolding, not live scoring rules.
			</p>
			<div class="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/70 px-3 py-3">
				<p class="font-mono text-xs text-muted-foreground">
					effective_coverage = {experimentalMethodology.candidate_formulas.effective_coverage}
				</p>
				<p class="font-mono text-xs text-muted-foreground">
					net_risk = {experimentalMethodology.candidate_formulas.net_risk}
				</p>
			</div>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">What Must Happen Next</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				<li>Publish the task-adjusted shadow score artifact and rerun validation diagnostics.</li>
				<li>Review anchor occupations and document any surprising label flips before promotion.</li>
				<li>
					Keep the current score published until the shadow model matches or improves current
					validation.
				</li>
				<li>
					Treat the empirical mobility prior as supporting evidence until a higher-granularity
					Singapore transition dataset exists.
				</li>
			</ul>
		</div>
	</div>
</main>
