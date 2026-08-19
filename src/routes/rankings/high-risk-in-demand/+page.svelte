<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { card, pageLayout, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="Singapore Jobs in Demand with AI Work Pressure"
	description="Reviewed MOM demand and shortage-list matches ordered by V9 AI work pressure. The older risk URL is retained and canonicalized to the current evidence view."
	path="/rankings/high-risk-in-demand"
	canonical="/rankings/high-exposure-in-demand"
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
			This older URL now uses the V9 evidence definition. The {data.ranked.length} occupations below have
			a reviewed match to a selected MOM demand or shortage source and are ordered by pressure.
		</p>
	</header>

	<div class="mb-6 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			V9 does not calculate a combined “high risk and in demand” score. Pressure and direct demand
			evidence stay separate. This page's canonical version is the <a
				href="/rankings/high-exposure-in-demand"
				class="text-primary underline">named-demand ranking</a
			>.
		</p>
	</div>

	<OccupationResultList items={data.ranked} detail="demand" />
	<RankingNav current="/rankings/high-exposure-in-demand" />
</main>
