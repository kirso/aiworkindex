<script lang="ts">
	import {
		title as titleStyle,
		sectionLabel,
		card,
		caption,
		body,
		badge,
		riskBadge
	} from '$lib/design-system';
	import { pageLayout } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';

	let { data } = $props();

	const rankingPages = [
		{
			href: '/rankings/highest-risk',
			title: 'Highest Risk',
			description: 'Top 25 occupations by net displacement risk score',
			color: 'text-risk-very-high',
			accent: 'very_high' as const,
			count: 25
		},
		{
			href: '/rankings/ai-leveraged',
			title: 'AI Leveraged',
			description:
				'Roles where AI augments rather than replaces — high exposure + strong human bottlenecks',
			color: 'text-impact-leveraged',
			accent: 'leveraged' as const,
			count: 25
		},
		{
			href: '/rankings/high-exposure-in-demand',
			title: 'High Exposure + In Demand',
			description:
				'Occupations with significant AI overlap that are still on shortage or in-demand lists',
			color: 'text-risk-moderate',
			accent: 'moderate' as const,
			count: null
		},
		{
			href: '/rankings/high-risk-in-demand',
			title: 'High Risk but In-Demand',
			description:
				'Occupations with high displacement risk that still appear on official demand lists',
			color: 'text-risk-high',
			accent: 'high' as const,
			count: null
		},
		{
			href: '/rankings/theory-vs-practice',
			title: 'Theory vs Practice',
			description:
				'Biggest gaps between theoretical AI exposure and observed AI usage from Anthropic data',
			color: 'text-primary',
			accent: 'primary' as const,
			count: 25
		},
		{
			href: '/rankings/safest-high-paying',
			title: 'Safest High-Paying',
			description: 'Low displacement risk with above-median wages — the sweet spot',
			color: 'text-risk-very-low',
			accent: 'very_low' as const,
			count: 25
		},
		{
			href: '/rankings/best-transitions',
			title: 'Best Transitions',
			description:
				'Highest-risk occupations with the best transition paths to lower-risk alternatives',
			color: 'text-impact-leveraged',
			accent: 'leveraged' as const,
			count: 25
		},
		{
			href: '/rankings/quarterly-movers',
			title: 'Quarterly Movers',
			description: 'Occupations that changed risk bands since the last quarterly snapshot',
			color: 'text-chart-5',
			accent: 'mixed' as const,
			count: null
		}
	];
</script>

<svelte:head>
	<title>Rankings — AI Work Index</title>
	<meta
		name="description"
		content="Ranked lists of Singapore occupations by AI displacement risk, augmentation potential, wage safety, and more."
	/>
	<meta property="og:title" content="Rankings — AI Work Index" />
	<meta
		property="og:description"
		content="Ranked lists of Singapore occupations by AI displacement risk, augmentation potential, wage safety, and more."
	/>
</svelte:head>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Rankings' }]} />

	<div class="mb-8">
		<h1 class={titleStyle({ size: 'page' })}>Rankings</h1>
		<p class={cn(body({ tone: 'muted' }), 'mt-2')}>
			Curated views into Singapore's AI occupation landscape. Each list slices the data differently
			to surface distinct insights.
		</p>
		<p class={cn(body({ tone: 'subtle' }), 'mt-3 max-w-2xl')}>
			These rankings emerge from a three-layer scoring system — AI exposure, human bottleneck
			strength, and Singapore market signals — applied to {data.highestRisk.length > 0
				? '562'
				: 'all'} official occupations. Each list tells a different story about how AI is reshaping work.
		</p>
	</div>

	<!-- Ranking cards grid -->
	<div class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>All Rankings</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each rankingPages as page}
				<a href={page.href} class="no-underline">
					<div class={cn(card({ padding: 'md', hover: true, accent: page.accent }), 'h-full')}>
						<div class="flex items-start justify-between gap-2">
							<h3 class={cn('text-base font-semibold', page.color)}>{page.title}</h3>
							{#if page.count}
								<span class={badge({ variant: 'outline' })}>{page.count}</span>
							{/if}
						</div>
						<p class={cn(caption(), 'mt-1')}>{page.description}</p>
						<span class={cn(caption({ weight: 'medium' }), 'mt-3 inline-block text-primary')}
							>View ranking &rarr;</span
						>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- Quick preview: highest risk -->
	<div class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Top 5 Highest Risk</h2>
		<div class={card({ padding: 'md' })}>
			<div class="flex items-center justify-between mb-3">
				<p class={caption()}>Preview of the highest displacement risk scores</p>
				<a href="/rankings/highest-risk" class={cn(caption({ weight: 'medium' }), 'text-primary')}
					>See full list &rarr;</a
				>
			</div>
			<div class="space-y-1.5">
				{#each data.highestRisk as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
					>
						<span class="text-sm">
							<span class="mr-2 font-mono tabular-nums text-muted-foreground">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span class={cn(riskBadge({ band: occ.risk_band }), 'text-xs')}>
							{(occ.net_risk * 100).toFixed(0)}%
						</span>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- Quick preview: AI Leveraged -->
	<div class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Top 5 AI Leveraged</h2>
		<div class={card({ padding: 'md' })}>
			<div class="flex items-center justify-between mb-3">
				<p class={caption()}>Roles where AI augments rather than replaces</p>
				<a href="/rankings/ai-leveraged" class={cn(caption({ weight: 'medium' }), 'text-primary')}
					>See full list &rarr;</a
				>
			</div>
			<div class="space-y-1.5">
				{#each data.aiLeveraged as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
					>
						<span class="text-sm">
							<span class="mr-2 font-mono tabular-nums text-muted-foreground">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span class={cn(caption({ weight: 'medium' }), 'tabular-nums')}>
							{(occ.augmentation * 100).toFixed(0)}% augmentation
						</span>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- Quick preview: Safest High-Paying -->
	<div class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Top 5 Safest High-Paying</h2>
		<div class={card({ padding: 'md' })}>
			<div class="flex items-center justify-between mb-3">
				<p class={caption()}>Low displacement risk with above-median wages</p>
				<a
					href="/rankings/safest-high-paying"
					class={cn(caption({ weight: 'medium' }), 'text-primary')}>See full list &rarr;</a
				>
			</div>
			<div class="space-y-1.5">
				{#each data.safest as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
					>
						<span class="text-sm">
							<span class="mr-2 font-mono tabular-nums text-muted-foreground">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span class={cn(caption({ weight: 'medium' }), 'tabular-nums')}>
							SGD {occ.gross_wage_median.toLocaleString()}
						</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</main>
