<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import { title as titleStyle, pageLayout } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildItemListJsonLd, buildFaqJsonLd } from '$lib/data/ranking-jsonld';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';

	let { data } = $props();
	const currency = countryConfigs.sg.currency ?? 'SGD';

	const columns = [
		{
			key: 'wage',
			label: 'Median Wage',
			format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		},
		{
			key: 'net_risk',
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(0)}/100`,
			align: 'right' as const
		},
		{
			key: 'exposure',
			label: 'Exposure',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}/100`,
			align: 'right' as const
		},
		{
			key: 'bottleneck',
			label: 'Human Advantage',
			format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}/100`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'High-Paying Jobs With Lower AI Exposure',
			'Top 25 occupations with lower AI Exposure Ranks and above-median wages',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Which high-paying jobs currently have lower AI exposure?',
			answer:
				'These occupations combine lower relative AI exposure ranks with above-median wages. Lower exposure does not guarantee job security or future demand.'
		},
		{
			question: 'Which well-paid jobs currently have lower AI Exposure Ranks?',
			answer:
				'Many occupations combine below-median AI exposure with wages above the occupation-set median. This page does not claim that those jobs are immune to technology or labour-market change.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="25 High-Paying Jobs With Lower AI Exposure"
	description="Which high-paying occupations have lower relative AI exposure? Explore 25 roles with lower exposure ranks and above-median wages."
	path="/rankings/safest-high-paying"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'High-Paying, Lower Exposure' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>High-Paying Jobs With Lower AI Exposure</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Below-median AI Exposure Ranks, under 40/100, combined with wages at or above the occupation-set
		median. This is not a job-security guarantee.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered: AI Exposure Rank below 40/100 and median wage at or above the occupation-set median.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<FaqList items={faqItems} />
	<RankingNavPills />
	<PageFooterNav
		links={[
			{ href: '/rankings', label: 'All rankings' },
			{ href: '/explore', label: 'Browse occupations' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
