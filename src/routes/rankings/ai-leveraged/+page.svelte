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
			key: 'augmentation',
			label: 'Augmentation',
			format: (occ: Occupation) => `${(occ.augmentation * 100).toFixed(1)}%`,
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
		},
		{
			key: 'wage',
			label: 'Median Wage',
			format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'AI-Augmented Occupations',
			'Top 25 occupations where AI augments rather than replaces workers, ranked by augmentation potential',
			data.ranked
		)
	);

	const faqJsonLd = buildFaqJsonLd([
		{
			question: 'Which jobs benefit most from AI augmentation?',
			answer:
				'Occupations with high AI exposure but strong human bottlenecks — judgment, creativity, and interpersonal skills mean AI augments rather than replaces. These roles score net_risk < 0.25 with augmentation >= 0.12.'
		},
		{
			question: 'What is augmentation in the AI Work Index?',
			answer:
				'Augmentation measures the productive overlap between AI capabilities and human strengths. High augmentation means AI tools can boost productivity in the role without displacing the worker.'
		}
	]);
</script>

<Seo
	title="25 AI-Augmented Jobs — High Exposure, Strong Moats"
	description="Occupations where AI augments rather than replaces — high exposure but strong human bottlenecks create augmentation potential."
	path="/rankings/ai-leveraged"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Augmented' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>AI-Augmented Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		High AI exposure but strong human bottlenecks — AI augments rather than replaces. Occupations
		ranked by augmentation potential.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Augmented = net_risk &lt; 0.25 AND augmentation &ge; 0.12.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<RankingNavPills />
</main>
