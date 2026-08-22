<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
</script>

<Seo
	path="/reports/skills-pilot"
	title="Skills to Build for AI-Exposed Work in Singapore"
	description={`Official Singapore Skills Framework evidence for ${data.coverage.unique_occupations} occupations across ICT, financial services and healthcare, kept separate from AI pressure.`}
	type="article"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Official skills pilot' }
		]}
	/>

	<header class="max-w-4xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>Skills Framework pilot · reviewed 22 August 2026</p>
			<span class={badge({ variant: 'info' })}>No score effect</span>
		</div>
		<h1 class={cn(title({ size: 'page' }), 'mt-2')}>
			What to strengthen, from official sector frameworks
		</h1>
		<p class="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
			Pressure shows where work may change. Skills evidence helps with the next question: what
			should you practise? This pilot links six official occupations to seven reviewed sector-role
			profiles from Singapore's Skills Frameworks.
		</p>
	</header>

	<section
		class="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3"
		aria-label="Pilot coverage"
	>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums">{data.coverage.sectors}</p>
			<p class="mt-1 text-sm text-muted-foreground">sectors</p>
		</div>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums">
				{data.coverage.unique_occupations}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">official occupations</p>
		</div>
		<div class="bg-card p-5">
			<p class="font-mono text-3xl font-semibold tabular-nums">
				{data.coverage.sector_role_profiles}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">sector-role profiles</p>
		</div>
	</section>

	<section class="mt-12" aria-labelledby="profiles-heading">
		<p class={sectionLabel()}>Pilot profiles</p>
		<h2 id="profiles-heading" class="mt-1 text-2xl font-bold text-foreground">
			Use the list as a gap check
		</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			Open your occupation, compare the listed skills with your current work, and mark the areas
			where you need practice or stronger evidence. The proficiency label comes from the source
			role; it is not an assessment of you.
		</p>
		<div class="mt-5 grid gap-3 lg:grid-cols-2">
			{#each data.profiles as profile (`${profile.code}-${profile.sector}-${profile.sourceRole}`)}
				<article class={card({ padding: 'lg' })}>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{profile.sector}
							</p>
							<h3 class="mt-1 text-lg font-semibold text-foreground">{profile.title}</h3>
							<p class="mt-1 text-xs text-muted-foreground">Source role: {profile.sourceRole}</p>
						</div>
						<span
							class={badge({
								variant: profile.mappingQuality === 'exact_title' ? 'success' : 'default'
							})}
						>
							{profile.mappingQuality === 'exact_title' ? 'Exact title' : 'Reviewed equivalent'}
						</span>
					</div>
					<p class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Technical
					</p>
					<p class="mt-2 text-sm leading-relaxed text-foreground">
						{profile.technicalSkills.join(' · ')}
					</p>
					<p class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Core
					</p>
					<p class="mt-2 text-sm leading-relaxed text-foreground">
						{profile.coreSkills.join(' · ')}
					</p>
					<div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
						<a href="/occupation/{profile.code}" class="font-medium text-primary underline"
							>Open occupation</a
						>
						<a
							href={profile.source.url}
							target="_blank"
							rel="noreferrer"
							class="text-primary underline"
						>
							Official framework
						</a>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-12 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<p class={sectionLabel()}>What the pilot supports</p>
			<ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
				<li>Identify technical and core skills named for a current sector role.</li>
				<li>Prepare a focused development conversation with an employer or adviser.</li>
				<li>Search for training after you have named the gap you want to close.</li>
			</ul>
			<a
				href={data.trainingUrl}
				target="_blank"
				rel="noreferrer"
				class="mt-4 inline-block font-medium text-primary underline"
			>
				Find training on MySkillsFuture
			</a>
		</div>
		<div class={card({ padding: 'lg' })}>
			<p class={sectionLabel()}>Evidence boundary</p>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{data.claimBoundary}</p>
			<p class="mt-3 text-xs leading-relaxed text-muted-foreground">{data.rightsBoundary}</p>
			<a
				href="/methodology#skills-evidence"
				class="mt-4 inline-block font-medium text-primary underline"
			>
				Read the mapping method
			</a>
		</div>
	</section>
</main>
