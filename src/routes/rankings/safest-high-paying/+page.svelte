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
		{ key: 'wage', label: 'Median Wage', format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`, align: 'right' as const },
		{ key: 'net_risk', label: 'Net Risk', format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`, align: 'right' as const },
		{ key: 'exposure', label: 'Exposure', format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`, align: 'right' as const },
		{ key: 'bottleneck', label: 'Bottleneck', format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}%`, align: 'right' as const }
	];

	let itemListJsonLd = $derived(buildItemListJsonLd(
		'Safest High-Paying Jobs',
		'Top 25 occupations with low AI displacement risk and above-median wages in Singapore',
		data.ranked
	));

	const faqJsonLd = buildFaqJsonLd([
		{ question: 'What are the safest high-paying jobs from AI?', answer: 'Occupations with low AI displacement risk and above-median wages combine structural safety with strong earnings. These typically involve high coordination, physical presence, or regulatory complexity.' },
		{ question: 'Can you earn well in jobs with low AI risk?', answer: 'Yes. Many occupations in healthcare, engineering, and senior management have both low displacement pressure and wages well above the national median.' }
	]);
</script>

<Seo
	title="Safest High-Paying Jobs — Low AI Risk"
	description="Low AI displacement risk + above-median wages. The 25 safest well-paying occupations in Singapore."
	path="/rankings/safest-high-paying"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Rankings', href: '/rankings' }, { label: 'Safest High-Paying' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Safest High-Paying Jobs</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Low displacement risk (&lt;15%) with above-median wages in Singapore.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered: net_risk &lt; 0.15 and gross_wage_median above the market median.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<RankingNavPills />
</main>
