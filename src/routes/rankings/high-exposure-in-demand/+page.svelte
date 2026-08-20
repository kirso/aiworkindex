<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import NamedDemandPressurePlot from '$lib/components/v9-browser/NamedDemandPressurePlot.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { card, pageLayout, title as titleStyle } from '$lib/design-system';
	import { buildItemListJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();

	const faqItems = [
		{
			question: 'Can a job face AI pressure and still be in demand?',
			answer:
				'Yes. AI task overlap and current hiring demand measure different things. This page includes occupations named in selected MOM demand or shortage sources and orders them by V9 pressure.'
		},
		{
			question: 'Does absence from this list mean demand is weak?',
			answer:
				'No. The selected MOM sources name particular occupations and are not an exhaustive detailed-SSOC demand census. Unlisted demand remains unknown.'
		}
	];

	let rankingJsonLd = $derived(
		buildItemListJsonLd(
			'Singapore occupations with named demand evidence and AI Work Pressure',
			'Reviewed matches to selected MOM demand sources, ordered by V9 pressure percentile.',
			data.ranked.map(occupation => ({ title: occupation.title, ssoc: occupation.code }))
		)
	);
</script>

<Seo
	title="Singapore Jobs in Demand with AI Work Pressure"
	description="SSOC 2024 occupations with reviewed named evidence from selected MOM demand or shortage lists, ordered by V9 AI work pressure."
	path="/rankings/high-exposure-in-demand"
	jsonLd={[rankingJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Named demand + pressure' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Named demand evidence and AI work pressure</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			These {data.ranked.length} occupations have a reviewed title or synonym match to a selected MOM
			demand or shortage source. They are ordered by pressure, not by demand strength; the sources do
			not publish a comparable demand score for every occupation.
		</p>
	</header>

	<div class="mb-6 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			A named signal is positive direct evidence for that occupation. It does not prove vacancy
			volume, future growth or protection from AI-related work redesign.
		</p>
	</div>

	<div class="mb-8">
		<NamedDemandPressurePlot items={data.ranked} />
	</div>

	<OccupationResultList items={data.ranked} detail="demand" />

	<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
		Sources: MOM Jobs in Demand 2025 and the 2026 COMPASS Shortage Occupation List. Matches were
		reviewed against current SSOC 2024 titles and synonyms. Open an occupation to see the exact
		source label, source occupation and mapping rationale.
	</p>

	<FaqList items={faqItems} />
	<RankingNav current="/rankings/high-exposure-in-demand" />
</main>
