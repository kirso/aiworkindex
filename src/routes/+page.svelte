<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import { card, riskBadge, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { riskBandLabels } from '$lib/data';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';

	let { data } = $props();

	let innerWidth = $state(1024);

	$effect(() => {
		if (!browser) return;
		innerWidth = window.innerWidth;
		function onResize() {
			innerWidth = window.innerWidth;
		}
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Will AI replace my job in Singapore?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'It depends on your occupation. Of 562 Singapore occupations scored, 48 face very high AI displacement risk while 111 face very low risk. The outcome depends on three factors: AI task overlap, human advantage (judgment, creativity, physical presence), and Singapore labour market demand.'
				}
			},
			{
				'@type': 'Question',
				name: 'Which jobs in Singapore are most at risk from AI?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Occupations with high AI task overlap and low human bottlenecks face the most risk. Data entry clerks, telemarketers, bookkeepers, and statistical clerks score highest. However, high AI exposure alone does not mean displacement — software developers have high exposure but are augmented because of strong human advantages.'
				}
			},
			{
				'@type': 'Question',
				name: 'How is the Singapore AI job risk score calculated?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Net displacement risk = AI exposure × (1 − human bottleneck) × market modifier. Exposure comes from the Felten AIOE academic index. Human bottleneck uses Pizzinelli theta from O*NET work context data. Market modifier uses Singapore employment trends and MOM demand signals. No LLM is used in the scoring pipeline.'
				}
			}
		]
	})}<\/script>`;
</script>

<svelte:head>
	<title>AI Work Index — How will AI affect your job?</title>
	<meta
		name="description"
		content="Find out if AI will replace, augment, or barely affect your role in Singapore. 562 occupations scored using official data and peer-reviewed research."
	/>
	<meta property="og:title" content="AI Work Index — How will AI affect your job?" />
	<meta
		property="og:description"
		content="562 Singapore occupations scored for AI displacement risk. Official data, academic indices, no LLM in the scoring pipeline."
	/>
	<meta property="og:url" content={SITE.url} />
	<meta name="twitter:title" content="AI Work Index" />
	<meta
		name="twitter:description"
		content="How will AI affect your job in Singapore? 562 occupations scored."
	/>
	{@html faqJsonLd}
</svelte:head>

<!-- ===== HERO: Search ===== -->
<div class="mx-auto max-w-screen-2xl px-4 sm:px-6">
	<div class="mx-auto max-w-2xl py-10 sm:py-14 text-center">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			How will AI affect your job?
		</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			Search any occupation or role to see its AI displacement risk score
		</p>
		<div class="mt-5">
			<HeroSearch occupations={data.occupations} />
		</div>
	</div>
</div>

<!-- ===== STATS STRIP ===== -->
<div class="border-y border-border bg-inset">
	<div class="mx-auto max-w-screen-2xl px-4 sm:px-6">
		<div
			class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2.5 text-xs text-muted-foreground"
		>
			<span
				><strong class="font-mono text-foreground">{data.occupations.length}</strong> occupations</span
			>
			<span
				><strong class="font-mono text-foreground">{DATA_VINTAGE.role_count}</strong> modern roles</span
			>
			<span
				><strong class="font-mono text-foreground">{data.stats.highRiskCount}</strong> high+ risk</span
			>
			<span
				><strong class="font-mono text-foreground"
					>{(data.stats.avgExposure * 100).toFixed(0)}%</strong
				> avg exposure</span
			>
			<span
				><strong class="font-mono text-foreground">{data.stats.demandCount}</strong> in demand</span
			>
			<span
				><strong class="font-mono text-foreground"
					>SGD {(data.stats.nationalMedian / 1000).toFixed(1)}K</strong
				> median</span
			>
		</div>
	</div>
</div>

<!-- ===== TREEMAP ===== -->
<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-5">
	<div class="flex items-center justify-between mb-2">
		<h2 class={sectionLabel()}>Occupation Map</h2>
		<div class="flex items-center gap-3">
			<p class={caption()}>Size = employment · Colour = risk</p>
			<a href="/explore" class="text-xs text-primary hover:underline">Full explorer →</a>
		</div>
	</div>

	{#if innerWidth >= 768}
		<Treemap occupations={data.occupations} />
	{:else}
		<div class="grid gap-2 grid-cols-2">
			{#each data.majorGroups as group}
				<a
					href="/explore"
					class={cn(card({ padding: 'sm', hover: true }), 'flex items-center gap-2')}
				>
					<span class="h-2.5 w-2.5 rounded-sm shrink-0" style="background-color: {group.color};"
					></span>
					<span class="text-xs font-medium text-foreground truncate">{group.label}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- ===== FEATURED: 4 cards ===== -->
<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 py-5">
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Highest Risk -->
		<div class={card({ padding: 'sm' })}>
			<div class="flex items-center justify-between mb-2">
				<h3 class={sectionLabel()}>Highest Risk</h3>
				<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">See all →</a>
			</div>
			{#each data.featured.highestRisk as occ (occ.ssoc)}
				<a
					href="/occupation/{occ.ssoc}"
					class="flex items-center justify-between rounded-sm py-1.5 px-1 -mx-1 hover:bg-accent transition-colors"
				>
					<span class="text-sm text-foreground truncate">{occ.title}</span>
					<span class="ml-2 shrink-0 font-mono text-sm font-semibold text-risk-very-high"
						>{(occ.net_risk * 100).toFixed(0)}%</span
					>
				</a>
			{/each}
		</div>

		<!-- Augmented -->
		<div class={card({ padding: 'sm' })}>
			<div class="flex items-center justify-between mb-2">
				<h3 class={sectionLabel()}>Augmented</h3>
				<a href="/rankings/ai-leveraged" class="text-xs text-primary hover:underline">See all →</a>
			</div>
			{#each data.featured.augmented as occ (occ.ssoc)}
				<a
					href="/occupation/{occ.ssoc}"
					class="flex items-center justify-between rounded-sm py-1.5 px-1 -mx-1 hover:bg-accent transition-colors"
				>
					<span class="text-sm text-foreground truncate">{occ.title}</span>
					<span class={cn(riskBadge({ band: occ.risk_band }), 'ml-2 shrink-0')}
						>{riskBandLabels[occ.risk_band]}</span
					>
				</a>
			{/each}
		</div>

		<!-- Safest + High Pay -->
		<div class={card({ padding: 'sm' })}>
			<div class="flex items-center justify-between mb-2">
				<h3 class={sectionLabel()}>Safest + High Pay</h3>
				<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline"
					>See all →</a
				>
			</div>
			{#each data.featured.safestHighPay as occ (occ.ssoc)}
				<a
					href="/occupation/{occ.ssoc}"
					class="flex items-center justify-between rounded-sm py-1.5 px-1 -mx-1 hover:bg-accent transition-colors"
				>
					<span class="text-sm text-foreground truncate">{occ.title}</span>
					<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
						>SGD {occ.gross_wage_median.toLocaleString()}</span
					>
				</a>
			{/each}
		</div>

		<!-- Most Resilient -->
		<div class={card({ padding: 'sm' })}>
			<div class="flex items-center justify-between mb-2">
				<h3 class={sectionLabel()}>Most Resilient</h3>
				<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline"
					>See all →</a
				>
			</div>
			{#each data.featured.mostResilient as occ (occ.ssoc)}
				<a
					href="/occupation/{occ.ssoc}"
					class="flex items-center justify-between rounded-sm py-1.5 px-1 -mx-1 hover:bg-accent transition-colors"
				>
					<span class="text-sm text-foreground truncate">{occ.title}</span>
					<span class="ml-2 shrink-0 font-mono text-sm font-semibold text-risk-very-low"
						>{(occ.net_risk * 100).toFixed(0)}%</span
					>
				</a>
			{/each}
		</div>
	</div>
</div>

<!-- ===== QUICK BROWSE ===== -->
<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 pb-5">
	<div class="flex flex-wrap items-center gap-2">
		<span class={caption({ weight: 'medium' })}>Browse:</span>
		<a
			href="/rankings/highest-risk"
			class="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
		>
			Highest Risk
		</a>
		<a
			href="/rankings/ai-leveraged"
			class="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
		>
			Augmented
		</a>
		<a
			href="/rankings/safest-high-paying"
			class="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
		>
			Safest High-Paying
		</a>
		<a
			href="/rankings/high-exposure-in-demand"
			class="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
		>
			High Exposure + In Demand
		</a>
		<a
			href="/rankings/theory-vs-practice"
			class="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
		>
			Theory vs Practice
		</a>
		<a
			href="/explore"
			class="rounded-md border border-primary/30 bg-card px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
		>
			Full Explorer →
		</a>
	</div>
</div>

<!-- ===== ABOUT LINE ===== -->
<div class="border-t border-border">
	<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4 text-center">
		<p class="text-xs text-muted-foreground">
			Three-layer scoring model: AI exposure × human bottleneck × Singapore market signals. No LLM
			in the scoring pipeline.
			<a href="/methodology" class="text-primary hover:underline">Methodology</a> ·
			<a href="/about" class="text-primary hover:underline">About</a>
		</p>
	</div>
</div>
