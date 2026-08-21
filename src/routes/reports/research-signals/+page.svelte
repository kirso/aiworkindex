<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let paired = $derived(
		data.profiles.filter(profile => profile.observed != null && profile.gap != null)
	);
	let medianGap = $derived.by(() => {
		const values = paired.map(profile => profile.gap as number).sort((a, b) => a - b);
		const middle = Math.floor(values.length / 2);
		return values.length % 2 === 0
			? ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2
			: (values[middle] ?? 0);
	});

	const chart = { left: 58, top: 28, width: 652, height: 330 };
	const ticks = [0, 0.25, 0.5, 0.75, 1];

	function x(value: number): number {
		return chart.left + value * chart.width;
	}

	function y(value: number): number {
		return chart.top + (1 - value) * chart.height;
	}

	function pct(value: number | null): string {
		return value == null ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;
	}
</script>

<Seo
	path="/reports/research-signals"
	title="Theoretical AI Exposure vs Observed Use by Occupation"
	description="Compare Eloundou theoretical LLM exposure with Anthropic observed Claude use for the conservatively mapped Singapore occupation subset."
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Research signals' }
		]}
	/>

	<div class="max-w-4xl">
		<p class={sectionLabel()}>V9 research comparison · reviewed 21 August 2026</p>
		<h1 class={cn(title({ size: 'page' }), 'mt-2')}>Possible AI scope versus observed use</h1>
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">
			An occupation can look technically exposed before people use AI for much of its work. This
			report keeps those ideas separate: Eloundou estimates theoretical LLM scope; Anthropic
			measures work-related Claude use in its source periods. Neither is a Singapore employment
			forecast.
		</p>
	</div>

	<section class="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.coverage.eloundou_theoretical_exposure_available}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">with theoretical exposure</p>
		</div>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.coverage.anthropic_observed_exposure_available}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">with observed-use evidence</p>
		</div>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{(medianGap * 100).toFixed(1)} pts
			</p>
			<p class="mt-1 text-sm text-muted-foreground">median theory–use gap</p>
		</div>
	</section>

	<section class="mt-10" aria-labelledby="signals-chart-heading">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={sectionLabel()}>Comparison map</p>
				<h2 id="signals-chart-heading" class="mt-1 text-2xl font-bold text-foreground">
					Where use trails or exceeds estimated scope
				</h2>
			</div>
			<span class={badge({ variant: 'info' })}>{paired.length} paired occupations</span>
		</div>

		<div class="mt-4 border border-border bg-card p-3 sm:p-5">
			<div class="min-w-0">
				<svg
					viewBox="0 0 760 410"
					class="block h-auto w-full"
					role="img"
					aria-labelledby="signals-chart-title signals-chart-desc"
				>
					<title id="signals-chart-title">Theoretical LLM exposure versus observed Claude use</title
					>
					<desc id="signals-chart-desc">
						Sixty-six mapped occupations. Points below the diagonal have more theoretical scope than
						observed use in the source periods.
					</desc>
					<rect
						x={chart.left}
						y={chart.top}
						width={chart.width}
						height={chart.height}
						fill="var(--color-surface-subtle)"
					/>
					{#each ticks as tick}
						<line
							x1={x(tick)}
							x2={x(tick)}
							y1={chart.top}
							y2={chart.top + chart.height}
							stroke="var(--color-border)"
						/>
						<line
							x1={chart.left}
							x2={chart.left + chart.width}
							y1={y(tick)}
							y2={y(tick)}
							stroke="var(--color-border)"
						/>
						<text
							x={x(tick)}
							y={chart.top + chart.height + 20}
							text-anchor="middle"
							class="fill-muted-foreground text-[10px]">{tick * 100}%</text
						>
						<text
							x={chart.left - 10}
							y={y(tick) + 3}
							text-anchor="end"
							class="fill-muted-foreground text-[10px]">{tick * 100}%</text
						>
					{/each}
					<line
						x1={x(0)}
						y1={y(0)}
						x2={x(1)}
						y2={y(1)}
						stroke="var(--color-foreground)"
						stroke-dasharray="5 5"
						opacity="0.45"
					/>
					{#each paired as profile (profile.ssoc)}
						<circle
							cx={x(profile.theoretical)}
							cy={y(profile.observed as number)}
							r="5"
							fill={(profile.gap as number) >= 0 ? 'var(--color-chart-3)' : 'var(--color-chart-1)'}
							stroke="var(--color-card)"
							stroke-width="1.5"
						>
							<title
								>{profile.title}: {pct(profile.theoretical)} theoretical, {pct(profile.observed)} observed</title
							>
						</circle>
					{/each}
					<text
						x={chart.left + chart.width / 2}
						y="399"
						text-anchor="middle"
						class="fill-muted-foreground text-[11px]">Theoretical LLM scope →</text
					>
					<text
						x="15"
						y={chart.top + chart.height / 2}
						transform="rotate(-90 15 {chart.top + chart.height / 2})"
						text-anchor="middle"
						class="fill-muted-foreground text-[11px]">Observed Claude use →</text
					>
				</svg>
			</div>
			<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
				<span><i class="mr-1 inline-block h-2.5 w-2.5 bg-chart-3"></i>Theory above use</span>
				<span><i class="mr-1 inline-block h-2.5 w-2.5 bg-chart-1"></i>Use above theory</span>
				<span>Dashed line = equal values</span>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<p class={sectionLabel()}>Largest measured gaps</p>
		<h2 class="mt-1 text-2xl font-bold text-foreground">Where technical scope is ahead of use</h2>
		<p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			These are research comparisons, not predictions. A gap can reflect workflow fit, access,
			regulation, product choice, user mix or how the two studies define exposure.
		</p>
		<div class="mt-4 divide-y divide-border border-y border-border">
			{#each paired.slice(0, 15) as profile, index (profile.ssoc)}
				<a
					href="/occupation/{profile.ssoc}"
					class="grid gap-2 py-3 no-underline hover:bg-surface-subtle sm:grid-cols-[2rem_minmax(0,1fr)_7rem_7rem_6rem] sm:items-center sm:px-2"
				>
					<span class="font-mono text-xs tabular-nums text-muted-foreground">{index + 1}</span>
					<span class="min-w-0">
						<strong class="block truncate text-sm text-foreground">{profile.title}</strong>
						<span class="block truncate text-xs text-muted-foreground">SSOC {profile.ssoc}</span>
					</span>
					<span class="font-mono text-xs tabular-nums text-muted-foreground"
						>Theory {pct(profile.theoretical)}</span
					>
					<span class="font-mono text-xs tabular-nums text-muted-foreground"
						>Use {pct(profile.observed)}</span
					>
					<span class="font-mono text-xs font-semibold tabular-nums text-foreground"
						>+{pct(profile.gap)}</span
					>
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">What the comparison can tell you</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				It shows whether observed platform use is keeping pace with an earlier estimate of technical
				scope for the same reviewed occupation identity. It can identify adoption gaps worth
				investigating.
			</p>
		</div>
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">What it cannot tell you</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				It does not measure Singapore adoption, productivity, hiring, wages, job loss or use of
				every AI product. Anthropic's users and workflows are selected rather than a workforce
				census.
			</p>
		</div>
	</section>

	<div class="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
		<a href="/data/v9-research-signals.json" class="font-medium text-primary underline"
			>Download the signal artifact</a
		>
		<a href="/methodology#research-comparisons" class="font-medium text-primary underline"
			>Read the mapping rule</a
		>
	</div>
</main>
