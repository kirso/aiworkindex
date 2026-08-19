<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { card, pageLayout, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="High-Paying Singapore Jobs in Lower ILO Exposure Categories"
	description="Direct June 2025 MOM wage rows for SSOC 2024 occupations mapped only to ILO Not Exposed or Minimal Exposure categories."
	path="/rankings/safest-high-paying"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Lower categories + wages' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Direct wages in lower ILO exposure categories</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			These occupations have a direct June 2025 MOM wage row and map only to the official ILO
			categories <strong>Not Exposed</strong> or <strong>Minimal Exposure</strong>. They are ordered
			by gross monthly median.
		</p>
	</header>

	<div class="mb-6 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			Lower measured task exposure does not make a job “safe” or future-proof. Employment can change
			through demand, technology other than generative AI, business conditions, policy and work
			redesign.
		</p>
	</div>

	<OccupationResultList items={data.ranked} detail="wage" showRank={false} />

	<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
		Wage coverage is limited to full-time resident employees in establishments with at least 25
		employees. Missing direct wage rows are excluded, not inferred.
	</p>

	<RankingNav current="/rankings/safest-high-paying" />
</main>
