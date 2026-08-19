<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { badge, card, pageLayout, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="Singapore Occupations in ILO GenAI Gradient 4"
	description="SSOC 2024 occupations whose official mapped ILO category set reaches Exposed: Gradient 4, ordered by V9 AI work pressure."
	path="/rankings/ai-leveraged"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'ILO Gradient 4' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<span class={badge({ variant: 'outline' })}>Official ILO category</span>
		<h1 class="mt-3 {titleStyle({ size: 'page' })}">Occupations reaching ILO Gradient 4</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			These {data.ranked.length} SSOC 2024 occupations map to an ILO category set whose most exposed match
			is <strong>Exposed: Gradient 4</strong>. A range appears when official mappings disagree.
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
		Gradient 4 denotes greater potential task exposure in the ILO framework. It does not specify
		whether employers will automate, augment or redesign the work.
	</p>

	<RankingNav current="/rankings/ai-leveraged" />
</main>
