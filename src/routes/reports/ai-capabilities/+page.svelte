<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
</script>

<Seo
	title="What Can AI Do Today? OECD Capability Profiles for Singapore Jobs"
	description={`Explore a reviewed V9 mapping of the OECD 2026 AI Capability Gap Index to ${data.coverage.available_reviewed_identity_profiles} Singapore occupations, kept separate from AI task pressure and employment outcomes.`}
	path="/reports/ai-capabilities"
	type="article"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'AI capability profiles' }
		]}
	/>

	<header class="max-w-4xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>OECD 2026 · V9 supporting evidence</p>
			<span class={badge({ variant: 'info' })}>Headline effect: none</span>
		</div>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>
			Where current AI capabilities are closer to the work
		</h1>
		<p class="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
			The OECD compares present AI capabilities with nine kinds of ability that occupations demand.
			V9 publishes that profile only when the detailed Singapore and O*NET occupations agree under
			the conservative title rule or an explicit title-and-definition review.
		</p>
	</header>

	<section class="mt-10 grid gap-px bg-border sm:grid-cols-3" aria-label="Mapping coverage">
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums">
				{data.coverage.ssoc_occupations.toLocaleString()}
			</p>
			<p class="mt-1 text-sm font-medium">official SSOC occupations checked</p>
		</div>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums">
				{data.coverage.raw_exact_candidate_coverage}
			</p>
			<p class="mt-1 text-sm font-medium">had a raw exact crosswalk candidate</p>
		</div>
		<div class="bg-primary p-5 text-primary-foreground">
			<p class="font-mono text-3xl font-semibold tabular-nums">
				{data.coverage.available_reviewed_identity_profiles}
			</p>
			<p class="mt-1 text-sm font-medium">passed detailed-title identity and are published</p>
		</div>
	</section>

	<section class="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="meaning-heading">
		<div>
			<p class={sectionLabel()}>What the number means</p>
			<h2 id="meaning-heading" class="mt-2 text-2xl font-semibold tracking-tight">
				Capability proximity, not job risk
			</h2>
		</div>
		<div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
			<p>
				A higher proximity value means the OECD rates current AI capabilities as closer to the
				capability demands of the mapped O*NET occupation. It does not say that every task can be
				automated or that Singapore employers have adopted those tools.
			</p>
			<p>
				V9 keeps this evidence separate from the ILO-based AI Work Pressure Rank, Singapore pay,
				hiring evidence and labour outcomes. Agreement is informative; disagreement is also
				informative and remains visible.
			</p>
		</div>
	</section>

	<section class="mt-12" aria-labelledby="domains-heading">
		<p class={sectionLabel()}>Nine separate capabilities</p>
		<h2 id="domains-heading" class="mt-2 text-2xl font-semibold tracking-tight">
			Do not compress the profile into one story
		</h2>
		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.domains as domain (domain.key)}
				<article class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">{domain.label}</h3>
					<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
						Job demand is reported on a 0–5 source scale. Remaining capability gap is reported on a
						0–{domain.gap_scale.max} domain scale, where a smaller gap means AI is closer.
					</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-12" aria-labelledby="examples-heading">
		<div class="max-w-3xl">
			<p class={sectionLabel()}>Published subset</p>
			<h2 id="examples-heading" class="mt-2 text-2xl font-semibold tracking-tight">
				Examples with higher mapped proximity
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				These are examples within the {data.coverage
					.available_reviewed_identity_profiles}-occupation subset, not a ranking of all Singapore
				work. The missing {data.coverage.unavailable_without_published_profile}
				occupations are not lower; their profile is unavailable.
			</p>
		</div>
		<div class="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
			{#each data.examples as example (example.code)}
				<a href="/occupation/{example.code}" class="block bg-card p-4 no-underline hover:bg-accent">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">{example.title}</p>
							<p class="mt-1 text-xs text-muted-foreground">SSOC {example.code}</p>
						</div>
						<p class="font-mono text-lg font-semibold tabular-nums text-primary">
							{(example.proximity * 100).toFixed(1)}
						</p>
					</div>
					<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
						Closest domains: {example.closestDomains.join(' · ')}
					</p>
				</a>
			{/each}
		</div>
	</section>

	<section class="mt-12 grid gap-6 lg:grid-cols-2">
		<div class={card({ padding: 'lg', accent: 'primary' })}>
			<p class={sectionLabel()}>Why coverage is narrow</p>
			<h2 class="mt-2 text-xl font-semibold text-foreground">Exact is not detailed identity</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				The official chain first maps a Singapore occupation to an ISCO group. An exact ESCO–O*NET
				relation can still point to another occupation inside that group. V9 therefore requires a
				contiguous detailed-title match. Seven additional identities were accepted through a
				published title-and-definition review; there is no fuzzy or occupation-group fallback.
			</p>
		</div>
		<div class={card({ padding: 'lg' })}>
			<p class={sectionLabel()}>Source boundary</p>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{data.claimBoundary}</p>
			<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
				The crosswalk identifies O*NET-SOC 2019 while the workbook uses O*NET {data.source.occupation_system.replace(
					'O*NET-SOC ',
					''
				)}. V9 retains identical detailed codes and shows the title on every accepted record.
			</p>
			<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
				<a
					href={data.source.publication_url}
					target="_blank"
					rel="noreferrer"
					class="font-medium text-primary underline">OECD publication</a
				>
				<a href="/data" class="font-medium text-primary underline">Download the V9 artifact</a>
				<a href="/methodology#capability-evidence" class="font-medium text-primary underline"
					>Read the method</a
				>
			</div>
		</div>
	</section>
</main>
