<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	const chart = { left: 52, top: 24, width: 660, height: 420 };
	const ticks = [0, 25, 50, 75, 100];
	const coverageMetrics = $derived<Array<[string, number]>>([
		['Pressure', data.coverage.dimensions.task_pressure],
		['Capability', data.coverage.dimensions.capability_proximity],
		['Observed use', data.coverage.dimensions.observed_use],
		['Official skills', data.coverage.dimensions.official_skills]
	]);
	const patternMetrics = $derived<Array<[string, number]>>([
		[
			'Pressure above capability',
			data.coverage.pattern_counts.task_pressure_above_capability_proximity
		],
		[
			'Capability above pressure',
			data.coverage.pattern_counts.capability_proximity_above_task_pressure
		],
		['Theory ahead of use', data.coverage.pattern_counts.technical_scope_ahead_of_observed_use],
		['High pressure + demand', data.coverage.pattern_counts.high_pressure_with_named_demand],
		['High pressure + skills', data.coverage.pattern_counts.high_pressure_with_official_skill_path]
	]);

	function x(value: number): number {
		return chart.left + (value / 100) * chart.width;
	}

	function y(value: number): number {
		return chart.top + ((100 - value) / 100) * chart.height;
	}

	function pointColour(difference: number): string {
		if (difference >= 25) return 'var(--color-risk-very-high)';
		if (difference <= -25) return 'var(--color-risk-very-low)';
		return 'var(--color-risk-moderate)';
	}

	function changeText(value: number | undefined): string {
		if (value == null) return 'Not available';
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}
</script>

<Seo
	path="/reports/evidence-patterns"
	title="Where AI Job Signals Agree and Disagree in Singapore"
	description="Compare AI task pressure, capability proximity, theoretical scope, observed use, pay, demand, labour context and official skills without blending them into one score."
	type="article"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Evidence patterns' }
		]}
	/>

	<header class="max-w-4xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>V9 evidence vector · baseline 22 August 2026</p>
			<span class={badge({ variant: 'info' })}>No composite score</span>
		</div>
		<h1 class={cn(title({ size: 'page' }), 'mt-2')}>
			Where the job signals agree—and where they do not
		</h1>
		<p class="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
			A single number hides useful disagreement. This view lines up eight evidence dimensions while
			keeping their geography, date and meaning separate. Use the patterns to ask better questions,
			not to predict a layoff.
		</p>
	</header>

	<section
		class="mt-8 grid gap-px border border-border bg-border sm:grid-cols-4"
		aria-label="Evidence coverage"
	>
		{#each coverageMetrics as metric}
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-bold tabular-nums">{metric[1].toLocaleString()}</p>
				<p class="mt-1 text-xs text-muted-foreground">{metric[0]} records</p>
			</div>
		{/each}
	</section>

	<section class="mt-12" aria-labelledby="divergence-heading">
		<p class={sectionLabel()}>Pressure versus capability</p>
		<h2 id="divergence-heading" class="mt-1 text-2xl font-bold text-foreground">
			The same {data.coverage.shared_pressure_capability_subset} occupations, ranked twice
		</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			Points on the diagonal have similar relative positions. Red points rank at least 25 percentile
			points higher on ILO task pressure; green points rank higher on OECD capability proximity.
			Neither axis is a probability or employment forecast.
		</p>

		<div class="mt-5 hidden overflow-hidden border border-border bg-card p-4 md:block">
			<svg
				viewBox="0 0 750 480"
				class="block h-auto w-full"
				role="img"
				aria-labelledby="pattern-chart-title pattern-chart-desc"
			>
				<title id="pattern-chart-title">AI task pressure versus OECD capability proximity</title>
				<desc id="pattern-chart-desc"
					>Seventy-five reviewed Singapore occupation mappings. Each axis is a midrank percentile
					within the same subset.</desc
				>
				{#each ticks as tick}
					<line
						x1={x(tick)}
						x2={x(tick)}
						y1={chart.top}
						y2={chart.top + chart.height}
						stroke="var(--color-border)"
						stroke-width="1"
					/>
					<line
						x1={chart.left}
						x2={chart.left + chart.width}
						y1={y(tick)}
						y2={y(tick)}
						stroke="var(--color-border)"
						stroke-width="1"
					/>
					<text
						x={x(tick)}
						y={chart.top + chart.height + 22}
						text-anchor="middle"
						class="fill-muted-foreground text-[11px]">{tick}</text
					>
					<text
						x={chart.left - 12}
						y={y(tick) + 4}
						text-anchor="end"
						class="fill-muted-foreground text-[11px]">{tick}</text
					>
				{/each}
				<line
					x1={x(0)}
					y1={y(0)}
					x2={x(100)}
					y2={y(100)}
					stroke="var(--color-foreground)"
					stroke-dasharray="5 5"
					stroke-width="1.5"
				/>
				{#each data.shared as point (point.code)}
					<a href="/occupation/{point.code}">
						<circle
							cx={x(point.pressure)}
							cy={y(point.capability)}
							r={point.demandSources > 0 ? 5.5 : 4}
							fill={pointColour(point.difference)}
							opacity="0.84"
						>
							<title
								>{point.title}: pressure {point.pressure.toFixed(1)}, capability {point.capability.toFixed(
									1
								)}, difference {point.difference.toFixed(1)}</title
							>
						</circle>
					</a>
				{/each}
				<text
					x={chart.left + chart.width / 2}
					y="478"
					text-anchor="middle"
					class="fill-foreground text-[12px] font-semibold"
					>Task pressure percentile within shared subset</text
				>
				<text
					transform="translate(14 234) rotate(-90)"
					text-anchor="middle"
					class="fill-foreground text-[12px] font-semibold"
					>Capability proximity percentile within shared subset</text
				>
			</svg>
			<div
				class="mt-2 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground"
			>
				<span><i class="mr-1 inline-block size-2 bg-risk-very-high"></i>Pressure ranks higher</span>
				<span><i class="mr-1 inline-block size-2 bg-risk-moderate"></i>Within 25 points</span>
				<span><i class="mr-1 inline-block size-2 bg-risk-very-low"></i>Capability ranks higher</span
				>
				<span>Large dot = named demand evidence</span>
			</div>
		</div>

		<div class="mt-5 grid gap-3 md:hidden">
			{#each data.mostDivergent.slice(0, 8) as point (point.code)}
				<a href="/occupation/{point.code}" class={card({ padding: 'md', hover: true })}>
					<p class="font-semibold text-foreground">{point.title}</p>
					<p class="mt-1 font-mono text-xs text-muted-foreground">
						Pressure {point.pressure.toFixed(1)} · capability {point.capability.toFixed(1)} · gap {point.difference >
						0
							? '+'
							: ''}{point.difference.toFixed(1)}
					</p>
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-12" aria-labelledby="patterns-heading">
		<p class={sectionLabel()}>Descriptive patterns</p>
		<h2 id="patterns-heading" class="mt-1 text-2xl font-bold text-foreground">
			Signals worth investigating
		</h2>
		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			{#each patternMetrics as pattern}
				<div class={card({ padding: 'md' })}>
					<p class="font-mono text-2xl font-bold tabular-nums">{pattern[1]}</p>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{pattern[0]}</p>
				</div>
			{/each}
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">{data.claimBoundary}</p>
	</section>

	<section class="mt-12" aria-labelledby="change-heading">
		<p class={sectionLabel()}>What actually changed</p>
		<h2 id="change-heading" class="mt-1 text-2xl font-bold text-foreground">
			Compare each signal at its own cadence
		</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			{data.changeClaimBoundary}
		</p>
		<div class="mt-5 grid gap-3 sm:grid-cols-2">
			{#each data.nationalChanges as change (change.key)}
				<div class={card({ padding: 'lg' })}>
					<p class="text-sm font-semibold text-foreground">{change.label}</p>
					<p class="mt-2 font-mono text-3xl font-bold tabular-nums">
						{changeText(change.change_pct)}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{change.from?.value} to {change.to?.value}
						{change.unit} · {change.from?.period} to {change.to?.period}
					</p>
				</div>
			{/each}
		</div>
		<div class="mt-4 hidden border border-border md:block">
			<table class="w-full min-w-[44rem] text-left text-sm">
				<thead class="border-b border-border bg-surface-subtle text-xs text-muted-foreground">
					<tr
						><th class="px-4 py-3">Broad occupation group</th><th class="px-4 py-3"
							>2025 employment</th
						><th class="px-4 py-3">Year over year</th><th class="px-4 py-3">Since 2019</th></tr
					>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.broadGroupChanges as change (change.key)}
						<tr
							><td class="px-4 py-3 font-medium text-foreground"
								>{change.label.replace(' resident employment', '')}</td
							><td class="px-4 py-3 font-mono tabular-nums">{change.latest_value}k</td><td
								class="px-4 py-3 font-mono tabular-nums">{changeText(change.year_over_year_pct)}</td
							><td class="px-4 py-3 font-mono tabular-nums">{changeText(change.since_2019_pct)}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="mt-4 grid gap-px border border-border bg-border md:hidden">
			{#each data.broadGroupChanges as change (change.key)}
				<div class="bg-card p-4">
					<p class="font-medium text-foreground">
						{change.label.replace(' resident employment', '')}
					</p>
					<dl class="mt-3 grid grid-cols-3 gap-3 text-xs">
						<div>
							<dt class="text-muted-foreground">2025 jobs</dt>
							<dd class="mt-1 font-mono font-semibold tabular-nums">{change.latest_value}k</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">1 year</dt>
							<dd class="mt-1 font-mono font-semibold tabular-nums">
								{changeText(change.year_over_year_pct)}
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Since 2019</dt>
							<dd class="mt-1 font-mono font-semibold tabular-nums">
								{changeText(change.since_2019_pct)}
							</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
		<div class={cn(card({ padding: 'md' }), 'mt-4')}>
			<p class="text-sm font-semibold text-foreground">Pressure movers remain gated</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{data.pressureChange.reason}</p>
		</div>
	</section>

	<section class="mt-12 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<p class={sectionLabel()}>Use this view</p>
			<ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
				<li>Open an outlier and inspect its tasks, pay, demand and source mapping.</li>
				<li>Compare jobs on the dimensions that matter to your decision.</li>
				<li>Track the same signal when its next compatible release arrives.</li>
			</ul>
		</div>
		<div class={card({ padding: 'lg' })}>
			<p class={sectionLabel()}>Downloads</p>
			<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
				<a href="/data/v9-evidence-vector.json" class="font-medium text-primary underline"
					>Evidence vector JSON</a
				>
				<a href="/data/v9-signal-change.json" class="font-medium text-primary underline"
					>Change ledger JSON</a
				>
				<a href="/methodology" class="font-medium text-primary underline">Methodology</a>
			</div>
		</div>
	</section>
</main>
