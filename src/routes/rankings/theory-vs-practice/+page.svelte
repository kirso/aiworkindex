<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	const columns = [
		{
			key: 'gap',
			label: 'Gap (pts)',
			format: (occ: Occupation) => {
				const gap = occ.evidence.anthropic_gap ?? 0;
				const pts = Math.round(gap * 100);
				return `${pts > 0 ? '+' : ''}${pts}`;
			},
			align: 'right' as const
		},
		{
			key: 'direction',
			label: 'Direction',
			format: (occ: Occupation) => {
				const gap = occ.evidence.anthropic_gap ?? 0;
				return gap > 0 ? 'Above theory' : 'Below theory';
			}
		},
		{
			key: 'exposure',
			label: 'Exposure',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`,
			align: 'right' as const
		},
		{
			key: 'net_risk',
			label: 'Net Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
			align: 'right' as const
		}
	];

	function highlightRow(occ: Occupation): string | null {
		const gap = occ.evidence.anthropic_gap ?? 0;
		return gap > 0 ? 'bg-risk-very-high-subtle/30' : 'bg-impact-leveraged-subtle/30';
	}
</script>

<svelte:head>
	<title>Theory vs Practice — AI Work Index</title>
	<meta
		name="description"
		content="Where does observed AI usage diverge most from theoretical exposure? The biggest gaps between Anthropic's real-world data and academic AI exposure indices."
	/>
	<meta property="og:title" content="Theory vs Practice — AI Exposure Gaps in Singapore" />
	<meta
		property="og:description"
		content="Biggest gaps between theoretical AI exposure and observed real-world usage from Anthropic data."
	/>
</svelte:head>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Theory vs Practice' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Theory vs Practice</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Where does real-world AI usage diverge most from theoretical exposure? Ranked by the absolute
		gap between Anthropic's observed AI usage percentile and the theoretical AIOE percentile. <span
			class="bg-risk-very-high-subtle px-1 rounded text-risk-very-high">Red rows</span
		>
		= usage exceeds theory.
		<span class="bg-impact-leveraged-subtle px-1 rounded text-impact-leveraged">Blue rows</span> = theory
		exceeds usage.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} highlight={highlightRow} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Gap = Anthropic observed usage percentile minus theoretical AIOE percentile. Positive means more
		AI adoption than theory predicts.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
</main>
