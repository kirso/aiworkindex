<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import { title as titleStyle, pageLayout } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { buildItemListJsonLd, buildFaqJsonLd } from '$lib/data/ranking-jsonld';

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
			label: 'Net Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
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
			'Highest-Paid Jobs at Risk of AI Displacement',
			`Top 25 high-paying occupations facing high AI displacement risk (net risk 30%+, median wage ${currency} 5,000+)`,
			data.ranked
		)
	);

	const faqJsonLd = buildFaqJsonLd([
		{
			question: 'Which high-paying jobs are most at risk from AI?',
			answer: `Occupations earning ${currency} 5,000+ per month with net displacement risk above 30%. These professionals face significant structural pressure despite high compensation.`
		},
		{
			question: 'Does high pay protect against AI displacement?',
			answer:
				'Not directly. High wages often correlate with knowledge-intensive roles that have significant AI task overlap. Wage level reflects current market value, not future automation resistance.'
		}
	]);
</script>

<Seo
	title="Highest-Paid Jobs at Risk of AI Displacement"
	description={`Top 25 high-paying occupations (${currency} 5,000+/month) facing high AI displacement risk (30%+).`}
	path="/rankings/rich-and-risky"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highest-Paid at Risk' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Highest-Paid Jobs at Risk</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		High-paying occupations with net risk &ge; 30% and median wage &ge; {currency} 5,000/month.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		headline_risk = displacement_pressure &times; (1 &minus; demand_resilience). Wages are gross
		monthly median.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<RankingNavPills />
</main>
