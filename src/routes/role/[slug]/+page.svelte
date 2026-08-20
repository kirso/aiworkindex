<script lang="ts">
	import SaveJobButton from '$lib/components/product/SaveJobButton.svelte';
	import RoleWorkProfile from '$lib/components/product/RoleWorkProfile.svelte';
	import SharePageButton from '$lib/components/product/SharePageButton.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { card, caption, display, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { ROLE_GUIDANCE_DISCLOSURE } from '$lib/data/role-presentation';
	import { SITE } from '$lib/data/scoring-constants';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let role = $derived(data.role);
	let estimate = $derived(role.estimate);
	let officialMatch = $derived(data.journeyKind === 'reviewed_official_match');
	let officialOccupation = $derived(role.official_occupation);
	let mappingWithheld = $derived(role.estimate_status === 'mapping_withheld');
	let presentation = $derived(data.presentation);

	let demandComponents = $derived(
		role.components.filter(component => component.demand_signals.length > 0)
	);
	let wageComponents = $derived(
		role.components.filter(component => component.wage_evidence !== null)
	);
	let compareHref = $derived(
		officialOccupation
			? `/compare?entities=occupation:${officialOccupation.ssoc2024}`
			: `/compare?entities=role:${role.slug}`
	);
	let taskMixHref = $derived(
		`/will-ai-take-my-job?job=${encodeURIComponent(
			officialOccupation ? `occupation:${officialOccupation.ssoc2024}` : `role:${role.slug}`
		)}`
	);
	let pageTitle = $derived(
		officialMatch
			? `${role.title}: Official AI Work Pressure in Singapore`
			: estimate
				? `${role.title}: Estimated AI Work Pressure in Singapore`
				: `${role.title}: Find the Right Singapore Occupation`
	);
	let pageDescription = $derived(
		officialMatch && officialOccupation
			? `${role.title} is a familiar title reviewed against ${officialOccupation.title} (SSOC ${officialOccupation.ssoc2024}). See the official AI Work Pressure Rank, direct pay and named demand evidence, and practical guidance.`
			: estimate
				? `${role.title} has an estimated AI work-pressure comparison percentile of ${estimate.estimated_comparison_percentile.toFixed(1)} against scored Singapore occupations. See its component mapping and assumption sensitivity.`
				: `${role.title} has no published AI Work Pressure score because the title covers materially different work. Choose a sector and task profile before comparing official occupations.`
	);
	let faqs = $derived.by(() => {
		if (officialMatch && officialOccupation) {
			return [
				{
					question: `Which official occupation matches ${role.title}?`,
					answer: `${role.title} is a familiar job title that we reviewed against ${officialOccupation.title}, SSOC ${officialOccupation.ssoc2024}. The pressure rank comes directly from that occupation.`
				},
				{
					question: 'How current are the pay and demand sections?',
					answer:
						'Pay uses the direct MOM 2025 SSOC row where available. Demand uses reviewed matches in current named official sources. Every signal keeps its source and date.'
				},
				{
					question: `What should a ${role.title} do with this information?`,
					answer:
						'Look at the tasks you perform, test approved AI tools on routine work, keep accountable decisions under human review, and ask how your employer will evaluate AI-assisted work.'
				}
			];
		}
		if (estimate) {
			return [
				{
					question: `Why is the ${role.title} result an estimate?`,
					answer:
						'The familiar title spans more than one official SSOC 2024 occupation. The published component weights create a transparent comparison while the official occupations and their scores remain unchanged.'
				},
				{
					question: 'How can I check whether the estimate fits my work?',
					answer:
						'Inspect the component occupations, weights and sensitivity range, then compare them with the tasks you actually perform. The personal task-mix check gives you a structured way to do that.'
				}
			];
		}
		return [
			{ question: `Why is there no score for ${role.title}?`, answer: role.mapping_rationale },
			{
				question: 'How can I get a useful comparison?',
				answer:
					'Choose the sector, responsibilities and work setting that describe the job, then search for the closest official SSOC 2024 occupation. Missing evidence is not a low score.'
			}
		];
	});

	let structuredData = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: pageTitle,
			description: pageDescription,
			url: `${SITE.url}/role/${role.slug}`,
			dateModified: '2026-08-19',
			mainEntity: {
				'@type': 'DefinedTerm',
				name: role.title,
				description: role.description,
				termCode: role.slug,
				inDefinedTermSet: {
					'@type': 'DefinedTermSet',
					name: 'AI Work Index modern-role query layer',
					url: `${SITE.url}/roles`
				},
				additionalProperty:
					officialMatch && officialOccupation
						? [
								{
									'@type': 'PropertyValue',
									name: 'Mapping status',
									value: `Reviewed match to SSOC ${officialOccupation.ssoc2024}`
								},
								...(officialOccupation.pressure_rank == null
									? []
									: [
											{
												'@type': 'PropertyValue',
												name: 'Official AI Work Pressure Rank',
												value: officialOccupation.pressure_rank
											}
										])
							]
						: estimate
							? [
									{
										'@type': 'PropertyValue',
										name: 'Estimate status',
										value: 'Non-official role estimate'
									},
									{
										'@type': 'PropertyValue',
										name: 'Estimated AI work-pressure percentile',
										value: estimate.estimated_comparison_percentile
									}
								]
							: [
									{
										'@type': 'PropertyValue',
										name: 'Estimate status',
										value: 'Mapping withheld to avoid false precision'
									}
								]
			}
		})}<\/script>`
	);
	let faqStructuredData = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: faqs.map(faq => ({
				'@type': 'Question',
				name: faq.question,
				acceptedAnswer: { '@type': 'Answer', text: faq.answer }
			}))
		})}<\/script>`
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/role/{role.slug}"
	type="article"
	jsonLd={[structuredData, faqStructuredData]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Modern roles', href: '/roles' },
			{ label: role.title }
		]}
	/>

	<header class="border-b-2 border-foreground pb-6">
		<div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<p
					class="mb-2 inline-flex border px-2 py-1 font-mono text-xs font-bold uppercase tracking-wide"
					style:background={presentation.surface}
					style:border-color={presentation.accent}
					style:color={presentation.accent}
				>
					{data.statusLabel} · {presentation.label}
				</p>
				<h1 class={cn(title({ size: 'page' }), 'break-words')}>{role.title}</h1>
				<p class="mt-2 max-w-3xl text-base leading-relaxed text-text-secondary">
					{role.description}.
				</p>
				{#if officialMatch && officialOccupation}
					<p class="mt-3 max-w-3xl text-sm leading-relaxed">
						<strong>Reviewed match:</strong>
						{role.title} maps to
						<a
							class="font-medium text-primary hover:underline"
							href="/occupation/{officialOccupation.ssoc2024}">{officialOccupation.title}</a
						>, SSOC {officialOccupation.ssoc2024}. This guide uses that occupation's official score
						unchanged.
					</p>
				{/if}
			</div>
			<div class="flex shrink-0 flex-wrap gap-2">
				<Button variant="outline" size="sm" href={compareHref}>Compare</Button>
				<SaveJobButton kind="role" id={role.slug} />
				<SharePageButton title={`${role.title} | ${SITE.name}`} />
			</div>
		</div>

		{#if officialMatch && officialOccupation}
			<div class="mt-7 grid gap-px bg-border sm:grid-cols-[minmax(13rem,0.8fr)_minmax(0,2fr)]">
				<div class="bg-card p-5">
					<p class={sectionLabel()}>Official AI Work Pressure Rank</p>
					<p class={cn(display({ size: 'xl' }), 'mt-1')}>
						{officialOccupation.pressure_rank == null
							? 'Not ranked'
							: officialOccupation.pressure_rank.toFixed(1)}
					</p>
					<p class={caption()}>SSOC {officialOccupation.ssoc2024} · official occupation record</p>
				</div>
				<div class="bg-card p-5">
					<h2 class="text-lg font-bold">What this tells you</h2>
					{#if officialOccupation.pressure_rank == null}
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
							The official mapping lacks sufficient ILO evidence for a pressure rank, so its status
							is Unranked. Treat missing evidence as unknown.
						</p>
					{:else}
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
							This places {officialOccupation.title} at the {officialOccupation.pressure_rank.toFixed(
								1
							)} midrank percentile for ILO task exposure among scored SSOC 2024 occupations. Employment
							outcomes also depend on actual use, demand, regulation, organisational choices and human
							responsibility.
						</p>
					{/if}
					<a
						class="mt-3 inline-block text-sm font-medium text-primary hover:underline"
						href="/occupation/{officialOccupation.ssoc2024}"
					>
						Open the official occupation evidence
					</a>
				</div>
			</div>
		{:else if estimate}
			<div class="mt-7 grid gap-px bg-border sm:grid-cols-[minmax(13rem,0.8fr)_minmax(0,2fr)]">
				<div class="bg-card p-5">
					<p class={sectionLabel()}>Estimated comparison percentile</p>
					<p class={cn(display({ size: 'xl' }), 'mt-1')}>
						{estimate.estimated_comparison_percentile.toFixed(1)}
					</p>
					<p class={caption()}>Editorial estimate · outside the official ranking</p>
				</div>
				<div class="bg-card p-5">
					<h2 class="text-lg font-bold">What the number says</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
						The published component weights place this role at an estimated comparison percentile of
						{estimate.estimated_comparison_percentile.toFixed(1)} against the {estimate.comparison_population}.
						Read it as relative pressure on tasks. Employment outcomes also depend on actual use,
						demand, organisational choices and human responsibility.
					</p>
					<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
						<p>
							<span class="text-muted-foreground">Weighted ILO score</span>
							<strong>{(estimate.mean_score_2025 * 100).toFixed(1)}/100</strong>
						</p>
						<p>
							<span class="text-muted-foreground">Official categories represented</span>
							<strong
								>{estimate.potential25_component_range.least_exposed ===
								estimate.potential25_component_range.most_exposed
									? estimate.potential25_component_range.least_exposed
									: `${estimate.potential25_component_range.least_exposed} to ${estimate.potential25_component_range.most_exposed}`}</strong
							>
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
				<p class="font-bold">Choose a work context</p>
				<p class="mt-1 text-sm leading-relaxed text-text-secondary">
					{role.mapping_rationale} A sector and task profile will produce a more useful comparison than
					a broad-group or title-similarity substitute.
				</p>
			</div>
		{/if}
	</header>

	<section class="mt-10" aria-labelledby="practical-guidance">
		<div class="border-b border-foreground pb-2">
			<p class={sectionLabel()}>Reviewed family guidance</p>
			<h2 id="practical-guidance" class={title({ size: 'section' })}>
				What you can do with this information
			</h2>
		</div>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
			{#if mappingWithheld}
				Start by choosing the sector and responsibilities that describe your work. The ideas below
				are broad {presentation.label.toLowerCase()} guidance; keep the pieces that match your task mix.
			{:else}
				Use the pressure evidence as a prompt to inspect your tasks. Start with low-consequence
				work, keep accountable decisions under review, and record whether the tool actually improves
				the outcome.
			{/if}
		</p>
		<div class="mt-4">
			<Button variant="outline" size="sm" href={taskMixHref}>Inspect your own task mix</Button>
		</div>

		<div class="mt-5 grid min-w-0 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
			<div class="min-w-0 bg-card p-4">
				<h3 class="text-sm font-bold" style:color={presentation.accent}>Try with approved AI</h3>
				<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
					{#each presentation.actions.tryWithAi as item}
						<li class="border-l-2 pl-3" style:border-color={presentation.accent}>{item}</li>
					{/each}
				</ul>
			</div>
			<div class="min-w-0 bg-card p-4">
				<h3 class="text-sm font-bold" style:color={presentation.accent}>Keep human-led</h3>
				<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
					{#each presentation.actions.keepHumanLed as item}
						<li class="border-l-2 pl-3" style:border-color={presentation.accent}>{item}</li>
					{/each}
				</ul>
			</div>
			<div class="min-w-0 bg-card p-4">
				<h3 class="text-sm font-bold" style:color={presentation.accent}>Skills to strengthen</h3>
				<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
					{#each presentation.actions.strengthen as item}
						<li class="border-l-2 pl-3" style:border-color={presentation.accent}>{item}</li>
					{/each}
				</ul>
			</div>
			<div class="min-w-0 bg-card p-4">
				<h3 class="text-sm font-bold" style:color={presentation.accent}>
					Questions for your employer
				</h3>
				<ul class="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
					{#each presentation.actions.askAtWork as item}
						<li class="border-l-2 pl-3" style:border-color={presentation.accent}>{item}</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="mt-5">
			{#if !mappingWithheld}
				<RoleWorkProfile
					id={role.slug}
					familyLabel={presentation.label}
					items={presentation.workProfile}
					accent={presentation.accent}
					surface={presentation.surface}
					disclosure={ROLE_GUIDANCE_DISCLOSURE}
				/>
			{/if}
		</div>
	</section>

	{#if officialMatch && officialOccupation}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Title mapping</p>
				<h2 class={title({ size: 'section' })}>The official occupation behind this title</h2>
			</div>
			<div class="mt-4 grid gap-px bg-border md:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.8fr)]">
				<div class="min-w-0 bg-card p-5">
					<a
						class="text-lg font-bold hover:text-primary hover:underline"
						href="/occupation/{officialOccupation.ssoc2024}"
					>
						{officialOccupation.title}
					</a>
					<p class="mt-1 font-mono text-xs text-muted-foreground">
						SSOC {officialOccupation.ssoc2024}
					</p>
					<p class="mt-3 text-sm leading-relaxed text-text-secondary">{role.mapping_rationale}</p>
					<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
						The mapping is editorial and reviewed. The classification, task-exposure score, pay row
						and demand signals all come from the linked official occupation record.
					</p>
				</div>
				<div class="bg-card p-5 text-sm">
					<p class={caption()}>ILO task-exposure category</p>
					<p class="mt-1 font-medium">
						{officialOccupation.potential25 == null
							? 'Not available'
							: officialOccupation.potential25.least_exposed ===
								  officialOccupation.potential25.most_exposed
								? officialOccupation.potential25.least_exposed
								: `${officialOccupation.potential25.least_exposed} to ${officialOccupation.potential25.most_exposed}`}
					</p>
					<p class={cn(caption(), 'mt-4')}>Official ILO mean score</p>
					<p class="mt-1 font-mono font-bold tabular-nums">
						{officialOccupation.mean_score_2025 == null
							? 'Not available'
							: (officialOccupation.mean_score_2025.median * 100).toFixed(
									1
								)}{officialOccupation.mean_score_2025 == null ? '' : '/100'}
					</p>
				</div>
			</div>
		</section>
	{:else if role.components.length > 0}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Published assumptions</p>
				<h2 class={title({ size: 'section' })}>Official occupations used in this estimate</h2>
			</div>
			<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
				The role definition is an editorial query layer. Each weight states how much an official
				SSOC 2024 occupation contributes to the composite. The links open the underlying official
				record.
			</p>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each role.components as component (component.ssoc2024)}
					<article class={card({ padding: 'sm' })}>
						<div class="flex min-w-0 items-start justify-between gap-3">
							<div class="min-w-0">
								<a
									class="text-sm font-bold hover:text-primary hover:underline"
									href="/occupation/{component.ssoc2024}"
								>
									{component.title}
								</a>
								<p class="mt-0.5 font-mono text-xs text-muted-foreground">
									SSOC {component.ssoc2024}
								</p>
							</div>
							<p class="shrink-0 font-mono text-lg font-bold tabular-nums">
								{(component.weight * 100).toFixed(0)}%
							</p>
						</div>
						<p class="mt-3 text-xs leading-relaxed text-text-secondary">{component.rationale}</p>
						<div class="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
							<div>
								<p class="text-muted-foreground">Official pressure rank</p>
								<p class="mt-0.5 font-mono font-bold tabular-nums">
									{component.pressure_rank == null
										? 'Not ranked'
										: component.pressure_rank.toFixed(1)}
								</p>
							</div>
							<div>
								<p class="text-muted-foreground">ILO category</p>
								<p class="mt-0.5 font-medium">
									{component.potential25?.categories.join(', ') ?? 'Not available'}
								</p>
							</div>
						</div>
						{#if component.migration_note}
							<p class="mt-3 border-l-2 border-risk-moderate pl-2 text-xs text-muted-foreground">
								{component.migration_note}
							</p>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{:else}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>What is needed</p>
				<h2 class={title({ size: 'section' })}>Choose a task profile before comparing pressure</h2>
			</div>
			<p class="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
				Use the official occupation explorer to choose the sector or task profile that best
				describes the work. Publishing one weighted average for this label would hide materially
				different jobs.
			</p>
			<a class="mt-3 inline-block text-sm font-medium text-primary hover:underline" href="/explore">
				Browse official SSOC 2024 occupations
			</a>
		</section>
	{/if}

	{#if estimate}
		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Assumption sensitivity</p>
				<h2 class={title({ size: 'section' })}>How sensitive is the estimate?</h2>
			</div>
			<div class="mt-4 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<div class="bg-card p-4">
					<p class={caption()}>Editorial weights</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.editorial_weight_point * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Equal weights</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.equal_weight_point * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Leave-one-out low</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.leave_one_component_out_min * 100).toFixed(1)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class={caption()}>Leave-one-out high</p>
					<p class="mt-1 font-mono text-xl font-bold tabular-nums">
						{(estimate.weighting_sensitivity.leave_one_component_out_max * 100).toFixed(1)}
					</p>
				</div>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Values are ILO mean task-exposure scores shown on a 0–100 display scale.
			</p>
		</section>
	{/if}

	{#if officialMatch && officialOccupation}
		<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Observed pay</p>
					<h2 class={title({ size: 'section' })}>Official occupation pay</h2>
				</div>
				{#if officialOccupation.wage_evidence}
					<div class="mt-3 border border-border bg-card p-4">
						<p class="font-mono text-2xl font-bold tabular-nums">
							SGD {officialOccupation.wage_evidence.value.gross_monthly_sgd.median.toLocaleString()}
						</p>
						<p class="mt-1 text-sm text-text-secondary">Median gross monthly wage</p>
						<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
							MOM 2025, direct SSOC row. Coverage is full-time resident employees in establishments
							with at least 25 employees. Use it as pay context for the official occupation.
						</p>
					</div>
				{:else}
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						MOM 2025 has no direct wage row for this official occupation, so current pay remains
						unknown.
					</p>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Current named demand</p>
					<h2 class={title({ size: 'section' })}>Reviewed official-source matches</h2>
				</div>
				{#if officialOccupation.demand_signals.length > 0}
					<div class="mt-3 space-y-3">
						{#each officialOccupation.demand_signals as signal}
							<article class={card({ padding: 'sm' })}>
								<a
									class="text-sm font-bold text-primary hover:underline"
									href={signal.url}
									target="_blank"
									rel="noopener noreferrer">{signal.label}</a
								>
								<p class="mt-2 text-xs leading-relaxed text-text-secondary">
									{signal.interpretation}
								</p>
							</article>
						{/each}
					</div>
				{:else}
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						The current named demand sources contain no reviewed match. Because those lists are
						selective, treat this status as unobserved demand.
					</p>
				{/if}
			</div>
		</section>
	{:else if role.components.length > 0}
		<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Observed wage evidence</p>
					<h2 class={title({ size: 'section' })}>Component wages</h2>
				</div>
				{#if wageComponents.length > 0}
					<div class="mt-3 divide-y divide-border border border-border bg-card">
						{#each wageComponents as component (component.ssoc2024)}
							<div class="flex min-w-0 items-start justify-between gap-3 p-3 text-sm">
								<div class="min-w-0">
									<a
										class="font-medium hover:text-primary hover:underline"
										href="/occupation/{component.ssoc2024}">{component.title}</a
									>
									<p class="text-xs text-muted-foreground">MOM 2025, direct SSOC row</p>
								</div>
								<p class="shrink-0 font-mono font-bold tabular-nums">
									SGD {component.wage_evidence!.value.gross_monthly_sgd.median.toLocaleString()}/mo
								</p>
							</div>
						{/each}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						Use these as context for the component occupations; the composite has no role-level
						wage.
					</p>
				{:else}
					<p class="mt-3 text-sm text-muted-foreground">
						Direct wage observations are unavailable for these components.
					</p>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="border-b border-foreground pb-2">
					<p class={sectionLabel()}>Current demand evidence</p>
					<h2 class={title({ size: 'section' })}>Named component matches</h2>
				</div>
				{#if demandComponents.length > 0}
					<div class="mt-3 space-y-3">
						{#each demandComponents as component (component.ssoc2024)}
							<article class={card({ padding: 'sm' })}>
								<p class="text-sm font-bold">{component.title}</p>
								<ul class="mt-2 space-y-2">
									{#each component.demand_signals as signal}
										<li class="text-xs leading-relaxed text-text-secondary">
											<a
												class="font-medium text-primary hover:underline"
												href={signal.url}
												target="_blank"
												rel="noopener noreferrer">{signal.label}</a
											>
											— {signal.interpretation}
										</li>
									{/each}
								</ul>
							</article>
						{/each}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						Named source matches provide selective component context; they leave the role-level
						demand status unobserved.
					</p>
				{:else}
					<p class="mt-3 text-sm text-muted-foreground">
						The current named demand sources contain no reviewed component match.
					</p>
				{/if}
			</div>
		</section>
	{/if}

	<section class="mt-10 border-t-2 border-foreground pt-5">
		<p class={sectionLabel()}>Reading guide</p>
		<h2 class={title({ size: 'section' })}>What each part means</h2>
		<div class="mt-4 grid gap-px bg-border md:grid-cols-3">
			<div class="bg-card p-4">
				<h3 class="text-sm font-bold">Pressure evidence</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">
					{#if officialMatch}
						The official rank compares ILO task exposure across scored SSOC occupations. Personal
						outcomes depend on the work setting and how AI is adopted.
					{:else if estimate}
						The estimate combines disclosed official occupations. Use the weights and sensitivity
						range to judge how well it fits your work.
					{:else}
						The title needs a sector and task profile before pressure can be compared credibly.
					{/if}
				</p>
			</div>
			<div class="bg-card p-4">
				<h3 class="text-sm font-bold">Pay and demand</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">
					Pay is an observed MOM occupation row where available. Demand records reviewed matches in
					selective named sources. Both keep their own date and coverage.
				</p>
			</div>
			<div class="bg-card p-4">
				<h3 class="text-sm font-bold">Human work profile</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">
					The six axes and suggested actions are reviewed family guidance. Use them to inspect your
					own tasks; they remain outside the pressure calculation.
				</p>
			</div>
		</div>
		<p class="mt-4 text-sm">
			<a class="font-medium text-primary hover:underline" href="/methodology#synthetic-roles"
				>Read the title-mapping and estimate method</a
			>
			<span class="text-muted-foreground"> · </span>
			<a class="font-medium text-primary hover:underline" href="/data"
				>Download the published role data</a
			>
		</p>
	</section>

	<section class="mt-10" aria-labelledby="role-questions">
		<p class={sectionLabel()}>Questions people ask</p>
		<h2 id="role-questions" class={title({ size: 'section' })}>About this title and score</h2>
		<div class="mt-4 divide-y divide-border border-y border-border">
			{#each faqs as faq (faq.question)}
				<details class="group py-4">
					<summary class="cursor-pointer list-none pr-8 text-sm font-bold marker:content-none">
						{faq.question}
					</summary>
					<p class="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</section>

	{#if data.related.length > 0}
		<section class="mt-10">
			<p class={sectionLabel()}>Related modern titles</p>
			<div class="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
				{#each data.related as item (item.role.slug)}
					<a
						class="min-w-0 border-t-2 bg-card p-3 hover:bg-accent"
						style:border-color={item.presentation.accent}
						href={item.href}
					>
						<p class="text-sm font-bold">{item.role.title}</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{item.statusLabel}{item.role.official_occupation?.pressure_rank == null &&
							item.role.estimate == null
								? ''
								: ` · ${
										item.role.official_occupation?.pressure_rank?.toFixed(1) ??
										item.role.estimate?.estimated_comparison_percentile.toFixed(1)
									}`}
						</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</main>
