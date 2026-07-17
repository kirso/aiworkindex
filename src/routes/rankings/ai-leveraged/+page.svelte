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
			key: 'augmentation',
			label: 'Augmentation Potential',
			format: (occ: Occupation) => `${occ.v8.augmentation_potential.points}/100`,
			align: 'right' as const
		},
		{
			key: 'exposure',
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${occ.v8.ai_exposure_rank.points}/100`,
			align: 'right' as const
		},
		{
			key: 'demand',
			label: 'Current Demand',
			format: (occ: Occupation) => occ.v8.market_context.demand,
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
			'Occupations With Augmentation-Led Growth Pathways',
			'Top 25 occupations assigned to the V8 augmentation-led-growth pathway, ranked by augmentation potential',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Which jobs benefit most from AI augmentation?',
			answer:
				'These occupations meet the V8 augmentation-led-growth pathway: augmentation potential is in an upper band and current demand is strong. The pathway is a rule-based interpretation, not a productivity or employment forecast.'
		},
		{
			question: 'What is augmentation in the AI Work Index?',
			answer:
				'Augmentation potential is a relative rank of the current augmentation signal. It indicates where AI may support work, but it does not quantify productivity gains or prove that displacement will not occur.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="25 Occupations With Augmentation-Led Growth Pathways"
	description="Occupations assigned to the V8 augmentation-led-growth pathway, ranked by relative augmentation potential."
	path="/rankings/ai-leveraged"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Augmented' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Occupations in the Augmentation-Led Pathway</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Occupations assigned to the V8 augmentation-led-growth pathway, ranked by relative augmentation
		potential. The pathway requires strong current demand and does not guarantee growth.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		V8 pathway rule: augmentation potential at least 60/100 and strong current demand.
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
