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
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`,
			align: 'right' as const
		},
		{
			key: 'bottleneck',
			label: 'Bottleneck',
			format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}%`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'Highest-Paid Jobs With Higher AI Exposure',
			`Top 25 high-paying occupations with higher AI Exposure Ranks and median wage ${currency} 5,000+`,
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Which high-paying jobs have the highest AI exposure?',
			answer: `Occupations earning ${currency} 5,000+ per month that clear this page's higher-score filter. The score is relative and does not predict job loss.`
		},
		{
			question: 'Does high pay protect against AI displacement?',
			answer:
				'Not directly. Wage reflects current market value, while AI exposure can lead to augmentation, workflow redesign or hiring substitution. Neither metric guarantees future security.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="Highest-Paid Jobs With Higher AI Exposure"
	description={`Top 25 high-paying occupations (${currency} 5,000+/month) with higher AI exposure ranks.`}
	path="/rankings/rich-and-risky"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highest-Paid and AI-Exposed' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Highest-Paid Jobs With Higher AI Exposure</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		High-paying occupations in the upper two V8 exposure bands, with median wage &ge; {currency}
		5,000/month. Exposure and pay are shown together; neither predicts job loss.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered at AI Exposure Rank 60/100 or higher. Wages are gross monthly medians.
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
