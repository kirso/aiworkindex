<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import { badge, card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';

	let { data } = $props();

	const rankingPages = $derived([
		{
			href: '/rankings/highest-risk',
			title: 'AI work pressure rank',
			description: `All ${data.counts.pressure} scored occupations, ordered by their within-Singapore pressure percentile.`,
			status: 'V9',
			available: true
		},
		{
			href: '/rankings/ai-leveraged',
			title: 'Jobs with the highest AI task overlap',
			description: `${data.counts.officialGradient4} occupations whose mapped evidence reaches the highest overlap band.`,
			status: 'V9',
			available: true
		},
		{
			href: '/rankings/high-exposure-in-demand',
			title: 'Named demand evidence + pressure',
			description: `${data.counts.demand} occupations matched to a selected MOM demand or shortage list, ordered by pressure.`,
			status: 'Direct evidence',
			available: true
		},
		{
			href: '/rankings/rich-and-risky',
			title: 'Higher overlap jobs with a pay row',
			description: `${data.counts.wagePressure} occupations with a direct MOM wage row and mapped overlap at moderate or higher.`,
			status: 'Direct wages',
			available: true
		},
		{
			href: '/rankings/safest-high-paying',
			title: 'Direct wages in lower ILO categories',
			description: `${data.counts.lowerCategoryWages} occupations mapped only to Not Exposed or Minimal Exposure, ordered by direct gross wage median.`,
			status: 'Direct wages',
			available: true
		},
		{
			href: '/rankings/theory-vs-practice',
			title: 'Mapping and task dispersion',
			description: `${data.counts.mappingUncertainty} scored occupations with partial mappings or a non-zero mapped score range, plus the widest ILO task-score dispersion.`,
			status: 'Uncertainty',
			available: true
		},
		{
			href: '/rankings/best-transitions',
			title: 'Career transitions',
			description: 'Retained as an experimental URL; no V9 transition ranking is published.',
			status: 'Unavailable',
			available: false
		},
		{
			href: '/rankings/high-risk-few-exits',
			title: 'Transition constraints',
			description:
				'Retained as an experimental URL; V9 does not infer which occupations have few exits.',
			status: 'Unavailable',
			available: false
		},
		{
			href: '/rankings/quarterly-movers',
			title: 'Quarterly movers',
			description: 'Retained for continuity; V8 and V9 ranks are not a comparable time series.',
			status: 'Unavailable',
			available: false
		}
	]);

	const collectionJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: 'Singapore AI work pressure and job evidence rankings',
			description:
				'V9 rankings based on AI work pressure, official ILO categories, direct MOM wages, named demand evidence and disclosed uncertainty.',
			url: `${SITE.url}/rankings`,
			mainEntity: {
				'@type': 'ItemList',
				itemListElement: rankingPages
					.filter(page => page.available)
					.map((page, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						name: page.title,
						url: `${SITE.url}${page.href}`
					}))
			}
		})}<\/script>`
	);
</script>

<Seo
	title="Singapore AI Work Pressure and Job Rankings"
	description="Compare SSOC 2024 occupations by V9 AI work pressure, official ILO categories, direct MOM wages, named demand evidence and disclosed mapping uncertainty."
	path="/rankings"
	jsonLd={[collectionJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Rankings' }]} />

	<header class="mb-8 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Evidence rankings</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			Each list answers one question with evidence that can support it. AI work pressure, ILO
			category, wages, current demand and uncertainty are not blended into a single “risk” score.
		</p>
	</header>

	<section>
		<h2 class={sectionLabel()}>All ranking views</h2>
		<div class="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each rankingPages as page (page.href)}
				<a
					href={page.href}
					class="block min-w-0 no-underline {card({
						padding: 'md',
						hover: true,
						variant: page.available ? 'default' : 'subtle'
					})}"
				>
					<div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
						<h3 class="min-w-0 break-words text-base font-semibold text-foreground">
							{page.title}
						</h3>
						<span class={badge({ variant: page.available ? 'outline' : 'warning' })}
							>{page.status}</span
						>
					</div>
					<p class="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
						{page.description}
					</p>
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-10 grid min-w-0 gap-7 xl:grid-cols-2">
		<div class="min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 class={sectionLabel()}>Highest AI work pressure</h2>
					<p class="mt-1 text-xs text-muted-foreground">Top five within 987 scored occupations</p>
				</div>
				<a href="/rankings/highest-risk" class="text-xs font-medium text-primary underline"
					>Full list</a
				>
			</div>
			<OccupationResultList items={data.previews.pressure} detail="category" />
		</div>

		<div class="min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 class={sectionLabel()}>Named MOM demand evidence</h2>
					<p class="mt-1 text-xs text-muted-foreground">Direct list matches, ordered by pressure</p>
				</div>
				<a
					href="/rankings/high-exposure-in-demand"
					class="text-xs font-medium text-primary underline"
				>
					Full list
				</a>
			</div>
			<OccupationResultList items={data.previews.demand} detail="demand" />
		</div>
	</section>

	<section class="mt-10 border-t border-border pt-6">
		<h2 class={sectionLabel()}>How to read these lists</h2>
		<p class="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
			A rank orders occupations within the V9 release. It does not estimate an absolute probability,
			employment count or timing. Wage lists use only direct June 2025 MOM rows. Demand lists use
			only reviewed named matches; occupations absent from those lists have unknown demand, not zero
			demand.
		</p>
	</section>
</main>
