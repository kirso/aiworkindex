<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { badge, card, pageLayout, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="Singapore jobs with the highest AI task overlap"
	description="SSOC 2024 occupations whose mapped ILO evidence reaches the highest overlap band, ordered by V9 AI work pressure."
	path="/rankings/ai-leveraged"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highest overlap' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<span class={badge({ variant: 'outline' })}>Highest overlap band</span>
		<h1 class="mt-3 {titleStyle({ size: 'page' })}">Jobs with the highest AI task overlap</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			These {data.ranked.length} occupations map to ILO evidence in the highest overlap band. A range
			appears when official mappings disagree. How-calculated records the ILO codebook name.
		</p>
	</header>

	<div class="mb-6 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			This URL was used for an earlier “AI-leveraged” ranking. V9 does not infer augmentation or a
			positive job pathway from exposure alone. It now shows the official category the evidence can
			support.
		</p>
	</div>

	<OccupationResultList items={data.ranked} detail="category" />

	<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
		The ILO codebook calls this band Exposed: Gradient 4. That name is the source label, not a
		job-loss forecast. It does not say whether employers will automate, augment or redesign the
		work.
	</p>

	<RankingNav current="/rankings/ai-leveraged" />
</main>
