<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { card, pageLayout, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="Higher-overlap Singapore jobs with a published pay row"
	description="Direct June 2025 MOM gross wage medians for SSOC 2024 occupations whose mapped overlap is moderate or higher."
	path="/rankings/rich-and-risky"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Direct wages + pressure' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Higher-overlap jobs with a pay row</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			These occupations have an exact June 2025 MOM wage row and mapped overlap at moderate or
			higher. The list is ordered by gross monthly median, not by a combined wage-risk formula.
		</p>
	</header>

	<div class="mb-6 {card({ padding: 'md', variant: 'notice', accent: 'moderate' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			The older URL says “rich and risky.” V9 does not describe high pay as protection or exposure
			as a probability of job loss. The current list reports the two supported dimensions
			separately.
		</p>
	</div>

	<OccupationResultList items={data.ranked} detail="wage" showRank={false} />

	<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
		Wage coverage is limited to full-time resident employees in establishments with at least 25
		employees. Occupations without a direct detailed wage row are excluded rather than assigned
		zero.
	</p>

	<RankingNav current="/rankings/rich-and-risky" />
</main>
