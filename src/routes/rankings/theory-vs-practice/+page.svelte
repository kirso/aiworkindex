<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';

	let { data } = $props();
</script>

<Seo
	title="Uncertainty in Singapore AI Work Pressure Rankings"
	description="Inspect SSOC-to-ISCO mapping ranges and ILO within-occupation task-score dispersion behind the V9 Singapore AI work pressure rank."
	path="/rankings/theory-vs-practice"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Mapping and task dispersion' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Where the pressure evidence varies</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			V9 preserves two different kinds of variation: disagreement across official SSOC-to-ISCO
			matches, and variation across tasks inside the mapped ILO occupation. Neither is a confidence
			percentage or an observed Singapore outcome.
		</p>
	</header>

	<div class="mb-8 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
		<p class="text-sm leading-relaxed text-muted-foreground">
			This route previously compared external “theory” and platform-usage signals. V9 does not use
			platform samples as Singapore outcome evidence. The page now exposes uncertainty already
			present in the official mapping and ILO task model.
		</p>
	</div>

	<section class="min-w-0">
		<h2 class={sectionLabel()}>Widest official mapping ranges</h2>
		<p class="mb-3 mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
			Ordered by the difference between the lowest and highest mapped ILO mean score. A wider range
			means the occupation's official ISCO matches carry materially different exposure inputs. V9
			uses the median and shows the range.
		</p>
		<OccupationResultList items={data.mappingUncertainty} detail="mapping" showRank={false} />
	</section>

	<section class="mt-10 min-w-0">
		<h2 class={sectionLabel()}>Widest within-occupation task dispersion</h2>
		<p class="mb-3 mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
			Ordered by the ILO task-score standard deviation. A larger value means tasks inside the mapped
			occupation differ more in measured GenAI exposure; it does not by itself make the headline
			rank wrong.
		</p>
		<OccupationResultList items={data.taskDispersion} detail="dispersion" showRank={false} />
	</section>

	<p class="mt-5 text-xs leading-relaxed text-muted-foreground">
		These are diagnostic rankings, not separate pressure scores. Open an occupation to see its
		mapped ISCO codes, category range and evidence limitations.
	</p>

	<RankingNav current="/rankings/theory-vs-practice" />
</main>
