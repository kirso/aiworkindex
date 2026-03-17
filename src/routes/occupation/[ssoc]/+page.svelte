<script lang="ts">
	import RadarChart from '$lib/components/viz/RadarChart.svelte';
	import {
		riskBandLabels,
		riskBandColors,
		majorGroupByKey,
		impactTypeLabels,
		impactTypeColors,
		augmentationBandLabels,
		occupations as allOccupations
	} from '$lib/data';
	import { title as titleStyle, sectionLabel, card, riskBadge, impactBadge, confidenceBadge, confidenceColor, demandMatchTone, stabilityTone, overallSignalTone, vacancySignalTone } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let group = $derived(majorGroupByKey.get(occ.major_group));

	// Wage bar computations
	let maxWage = $derived(Math.max(occ.gross_wage_75th * 1.15, 15000));
	let wageLeftPct = $derived((occ.gross_wage_25th / maxWage) * 100);
	let wageRightPct = $derived((occ.gross_wage_75th / maxWage) * 100);
	let wageMedianPct = $derived((occ.gross_wage_median / maxWage) * 100);

	// Wage comparison to national median
	let wageVsNational = $derived.by(() => {
		const diff = occ.gross_wage_median - data.nationalMedian;
		const pct = Math.round((Math.abs(diff) / data.nationalMedian) * 100);
		if (pct < 3) return 'near the national median';
		return diff > 0 ? `${pct}% above the national median` : `${pct}% below the national median`;
	});

	// Group employment formatting
	function formatGroupEmployment(groupThousands: number): string {
		if (groupThousands >= 1) return `${groupThousands.toFixed(1)}K workers`;
		return `${Math.round(groupThousands * 1000)} workers`;
	}

	// Helpers for plain-English summary
	function levelLabel(value: number): string {
		if (value > 0.66) return 'high';
		if (value >= 0.33) return 'moderate';
		return 'low';
	}

	function bottleneckInterpretation(bottleneck: number): string {
		if (bottleneck > 0.66) return 'judgment, creativity, and interpersonal skills';
		if (bottleneck >= 0.33) return 'specialized judgment and interpersonal skills';
		return 'routine task patterns with few unique human dependencies';
	}

	function momentumLabel(momentum: number): string {
		if (momentum > 0.6) return 'growing';
		if (momentum >= 0.4) return 'stable';
		return 'declining';
	}

	function momentumVerb(momentum: number): string {
		if (momentum > 0.6) return 'supports';
		if (momentum >= 0.4) return "doesn't significantly change";
		return 'weakens';
	}

	function demandMatchLabel(match: 'exact' | 'prefix' | false): string | null {
		if (match === 'exact') return 'Exact match';
		if (match === 'prefix') return 'Prefix inferred';
		return null;
	}


	function stabilityCopy(label: string): string {
		if (label === 'stable') return 'This band holds under a +/-5 point stress test on the three core layers.';
		if (label === 'watch') return 'A modest change in one layer could move this role by one risk band.';
		return 'This role is sensitive to assumptions. Small shifts can move it across multiple bands.';
	}

	function vacancySignalLabel(signal: number): string {
		if (signal > 0) return 'Heating Up';
		if (signal < 0) return 'Cooling Down';
		return 'Stable';
	}

	function overallSignalLabel(overall: string): string {
		if (overall === 'strong') return 'Strong';
		if (overall === 'moderate') return 'Moderate';
		if (overall === 'weak') return 'Weak';
		return 'Deteriorating';
	}

	function formatPct(value: number | null): string {
		if (value === null) return 'n/a';
		const pct = Math.round(value * 100);
		return `${pct > 0 ? '+' : ''}${pct}%`;
	}

	// Percentile computation
	let netRiskPercentile = $derived.by(() => {
		const sorted = [...allOccupations].sort((a, b) => a.net_risk - b.net_risk);
		const rank = sorted.findIndex((o) => o.ssoc === occ.ssoc);
		return Math.round((rank / (sorted.length - 1)) * 100);
	});

	let wagePercentile = $derived.by(() => {
		const sorted = [...allOccupations].sort((a, b) => a.gross_wage_median - b.gross_wage_median);
		const rank = sorted.findIndex((o) => o.ssoc === occ.ssoc);
		return Math.round((rank / (sorted.length - 1)) * 100);
	});

	// Group context
	let groupOccupations = $derived(
		allOccupations.filter((o) => o.major_group === occ.major_group)
	);
	let groupAvgRisk = $derived(
		Math.round(
			(groupOccupations.reduce((s, o) => s + o.net_risk, 0) / groupOccupations.length) * 100
		)
	);

	// Evidence trail items — source label + plain English explanation
	let evidenceTrail = $derived.by(() => {
		const items: Array<{ icon: string; label: string; sentence: string; tone: string }> = [];

		// AIOE crosswalk
		items.push({
			icon: occ.match_quality === 'direct' ? 'check' : 'approx',
			label: 'AI Exposure Match (AIOE)',
			sentence: occ.match_quality === 'direct'
				? 'Direct occupation match to the academic AI exposure dataset.'
				: `${occ.match_quality.replace('_', ' ')} match — adds some uncertainty to the exposure estimate.`,
			tone: occ.match_quality === 'direct' ? 'text-risk-very-low' : 'text-risk-moderate'
		});

		// SOL
		if (occ.evidence.sol_match) {
			items.push({
				icon: 'check',
				label: 'Shortage Occupation List (SOL 2026)',
				sentence: occ.evidence.sol_match === 'exact'
					? 'Listed as a shortage occupation — strong Singapore demand signal.'
					: 'Partially matches a shortage occupation — moderate demand signal.',
				tone: 'text-risk-very-low'
			});
		}

		// Jobs in Demand
		if (occ.evidence.jobs_in_demand_match) {
			items.push({
				icon: 'check',
				label: 'Jobs in Demand (MOM 2025)',
				sentence: occ.evidence.jobs_in_demand_match === 'exact'
					? 'Appears on Singapore\'s official in-demand occupations list.'
					: 'Partially matches an in-demand occupation.',
				tone: 'text-risk-very-low'
			});
		}

		// Anthropic observed usage — gap is percentile points, not percent change
		if (occ.evidence.anthropic_calibrated) {
			const gap = occ.evidence.anthropic_gap ?? 0;
			const pts = Math.abs(Math.round(gap * 100));
			items.push({
				icon: 'check',
				label: 'Observed AI Usage (Anthropic)',
				sentence: gap >= 0
					? `Observed AI usage is ${pts} percentile points above theoretical exposure.`
					: `Observed AI usage is ${pts} percentile points below theoretical exposure.`,
				tone: gap >= 0 ? 'text-risk-high' : 'text-risk-low'
			});
		}

		// Labour monitor
		if (occ.labour_monitor) {
			const signal = occ.labour_monitor.overall;
			items.push({
				icon: 'cluster',
				label: `Local Hiring Signal (${occ.labour_monitor.cluster_label})`,
				sentence: signal === 'strong' ? 'Active hiring with growing vacancies.'
					: signal === 'moderate' ? 'Steady hiring activity.'
					: signal === 'weak' ? 'Hiring activity is flat or slowing.'
					: 'Vacancy and hiring signals are declining.',
				tone: signal === 'strong' || signal === 'moderate' ? 'text-risk-very-low' : 'text-risk-moderate'
			});
		}

		return items;
	});

	function formatPointDelta(value: number | null): string {
		if (value === null) return 'n/a';
		const points = Math.round(value * 100);
		return `${points > 0 ? '+' : ''}${points} pts`;
	}

	let demandEvidence = $derived.by(() => {
		const items: { label: string; detail: string; tone: string }[] = [];
		if (occ.evidence.sol_match) {
			items.push({
				label: 'SOL 2026',
				detail: demandMatchLabel(occ.evidence.sol_match) ?? 'Matched',
				tone: demandMatchTone(occ.evidence.sol_match)
			});
		}
		if (occ.evidence.jobs_in_demand_match) {
			items.push({
				label: 'Jobs in Demand 2025',
				detail: demandMatchLabel(occ.evidence.jobs_in_demand_match) ?? 'Matched',
				tone: demandMatchTone(occ.evidence.jobs_in_demand_match)
			});
		}
			if (occ.evidence.anthropic_calibrated) {
				const gap = occ.evidence.anthropic_gap ?? 0;
				items.push({
					label: 'Observed AI Usage',
					detail: gap >= 0 ? `Above theory ${formatPointDelta(gap)}` : `Below theory ${formatPointDelta(gap)}`,
					tone: gap >= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
				});
			}
		return items;
	});

	// Count of occupations with same impact_type
	let impactTypeCount = $derived(
		allOccupations.filter((o) => o.impact_type === occ.impact_type).length
	);

	// Summary card color based on impact type (item 3: warm tints)
	let summaryCardStyle = $derived.by(() => {
		switch (occ.impact_type) {
			case 'ai_leveraged':
				return { bg: 'bg-emerald-50/60', border: 'border-emerald-200', accent: '' };
			case 'at_risk':
				return { bg: 'bg-rose-50/60', border: 'border-rose-200', accent: '' };
			case 'stable':
				return { bg: 'bg-secondary', border: 'border-border', accent: '' };
			case 'mixed':
				return { bg: 'bg-amber-50/60', border: 'border-amber-200', accent: '' };
			default:
				return { bg: 'bg-secondary', border: 'border-border', accent: '' };
		}
	});

	// "What This Means For You" heading color based on risk band (item 2)
	let meaningHeadingColor = $derived.by(() => {
		switch (occ.risk_band) {
			case 'very_low':
			case 'low':
				return 'text-emerald-700';
			case 'moderate':
				return 'text-amber-700';
			case 'high':
			case 'very_high':
				return 'text-rose-700';
			default:
				return 'text-foreground';
		}
	});

	// Plain-English summary
	let summaryText = $derived.by(() => {
		const title = occ.title;
		const exposureLevel = levelLabel(occ.exposure);
		const bottleneckLevel = levelLabel(occ.bottleneck);
		const bottleneckDesc = bottleneckInterpretation(occ.bottleneck);

		switch (occ.impact_type) {
			case 'ai_leveraged':
				return `AI is likely to enhance productivity in this role rather than replace it. ${title} has ${exposureLevel} AI exposure, but strong human bottlenecks \u2014 like ${bottleneckDesc} \u2014 mean AI augments rather than substitutes. This is one of ${impactTypeCount} \u2018AI Leveraged\u2019 occupations in Singapore.`;
			case 'at_risk':
				return `This role faces significant AI displacement pressure. ${title} has ${exposureLevel} exposure to AI capabilities with relatively ${bottleneckLevel === 'low' ? 'weak' : 'few'} human bottlenecks to slow adoption. Workers in this field should consider developing skills that AI cannot easily replicate.`;
			case 'stable':
				return `AI is unlikely to significantly disrupt this role in the near term. ${title} has ${exposureLevel} AI exposure, meaning current AI capabilities have limited overlap with the core tasks. The occupation remains relatively stable.`;
			case 'mixed':
				return `This role shows conflicting AI signals \u2014 high exposure but also strong human dependencies. ${title} could see both displacement of some tasks and augmentation of others. The net outcome depends on how organizations choose to adopt AI.`;
			default:
				return '';
		}
	});

	// Market context
	let marketContext = $derived.by(() => {
		const groupLabel = group?.label ?? occ.major_group;
		const momentum = momentumLabel(occ.market.market_momentum);
		const verb = momentumVerb(occ.market.market_momentum);
		return `The ${groupLabel} sector in Singapore has seen ${momentum} employment trends, which ${verb} the outlook. Median wage of SGD ${occ.gross_wage_median.toLocaleString()} places this role ${wageVsNational} of SGD ${data.nationalMedian.toLocaleString()}.`;
	});

	// "What AI Can and Can't Do" — deterministic content
	let aiCanAndCant = $derived.by(() => {
		const highExposure = occ.exposure > 0.6;
		const highBottleneck = occ.bottleneck > 0.6;
		const mg = occ.major_group;

		// Group-specific flavor
		let humanAspect = 'specialized human judgment';
		if (mg.includes('HEALTH') || mg === 'PROFESSIONALS') humanAspect = 'patient care, clinical judgment, and ethical decision-making';
		else if (mg.includes('SERVICE') || mg.includes('SALES')) humanAspect = 'customer interaction, empathy, and situational awareness';
		else if (mg === 'MANAGERS') humanAspect = 'leadership, strategic thinking, and stakeholder management';
		else if (mg.includes('CRAFT') || mg.includes('PLANT') || mg.includes('MACHINE')) humanAspect = 'hands-on expertise, physical coordination, and site-specific knowledge';
		else if (mg.includes('CLERICAL')) humanAspect = 'process coordination, institutional knowledge, and exception handling';
		else if (mg.includes('CLEAN') || mg.includes('LABOUR')) humanAspect = 'physical dexterity, environmental adaptation, and on-site problem solving';
		else if (mg.includes('AGRICULTURAL')) humanAspect = 'environmental judgment, physical labor, and seasonal decision-making';

		let canDo: string;
		let cantDo: string;

		if (highExposure && highBottleneck) {
			canDo = 'AI can handle routine analysis, data processing, and pattern recognition tasks in this role.';
			cantDo = `However, ${humanAspect} remain firmly in human territory. Expect AI to augment your work, not replace it.`;
		} else if (highExposure && !highBottleneck) {
			canDo = 'Most core tasks in this role overlap with current AI capabilities, including analysis, generation, and structured decision-making.';
			cantDo = `The strongest protection comes from market demand, workforce scarcity, or the need for physical presence. Building skills in ${humanAspect} can strengthen your position.`;
		} else {
			canDo = 'Current AI capabilities have limited overlap with the core tasks in this role.';
			cantDo = `${humanAspect.charAt(0).toUpperCase() + humanAspect.slice(1)} keeps this role relatively insulated from AI disruption for now.`;
		}

		return { canDo, cantDo };
	});

	// "Skills to Focus On" — based on bottleneck and major group
	let skillRecommendations = $derived.by(() => {
		const skills: { label: string; description: string }[] = [];
		const bt = occ.bottleneck;
		const mg = occ.major_group;

		// High bottleneck → strong human skills
		if (bt > 0.6) {
			skills.push({ label: 'Complex Problem Solving', description: 'Tackling ambiguous, multi-factor challenges that resist formulaic solutions' });
			skills.push({ label: 'Interpersonal Communication', description: 'Persuading, negotiating, and building trust across diverse stakeholders' });
		}
		if (bt > 0.4) {
			skills.push({ label: 'Critical Thinking', description: 'Evaluating information quality and making sound judgments under uncertainty' });
		}

		// Group-specific skills
		if (mg === 'MANAGERS') {
			skills.push({ label: 'Strategic Leadership', description: 'Setting direction, managing change, and aligning teams with organizational goals' });
			skills.push({ label: 'Stakeholder Management', description: 'Navigating competing priorities across internal and external partners' });
		} else if (mg === 'PROFESSIONALS') {
			skills.push({ label: 'Domain Expertise', description: 'Deep specialized knowledge that requires years of study and practice' });
			skills.push({ label: 'Ethical Judgment', description: 'Navigating professional standards and regulatory frameworks' });
		} else if (mg.includes('ASSOCIATE')) {
			skills.push({ label: 'Technical Proficiency', description: 'Applied technical skills bridging theory and hands-on execution' });
			skills.push({ label: 'Adaptability', description: 'Learning new tools and processes as technology evolves' });
		} else if (mg.includes('SERVICE') || mg.includes('SALES')) {
			skills.push({ label: 'Emotional Intelligence', description: 'Reading customer needs and responding with empathy and care' });
			skills.push({ label: 'Conflict Resolution', description: 'De-escalating situations and finding win-win outcomes' });
		} else if (mg.includes('CRAFT') || mg.includes('PLANT') || mg.includes('MACHINE')) {
			skills.push({ label: 'Hands-On Expertise', description: 'Physical skills and spatial awareness that cannot be automated' });
			skills.push({ label: 'Safety Protocols', description: 'Quality assurance and error prevention in high-stakes environments' });
		} else if (mg.includes('CLERICAL')) {
			skills.push({ label: 'Process Optimization', description: 'Streamlining workflows and identifying efficiency improvements' });
			skills.push({ label: 'AI Tool Proficiency', description: 'Leveraging AI assistants to multiply your output' });
		} else {
			skills.push({ label: 'Physical Adaptability', description: 'On-site problem solving and environmental awareness' });
			skills.push({ label: 'Reliability', description: 'Consistent, dependable performance in variable conditions' });
		}

		// If exposure is high, always suggest AI literacy
		if (occ.exposure > 0.5) {
			skills.push({ label: 'AI Literacy', description: 'Understanding AI capabilities and limitations to work alongside AI tools effectively' });
		}

		// Deduplicate by label and limit to 4
		const seen = new Set<string>();
		return skills.filter((s) => {
			if (seen.has(s.label)) return false;
			seen.add(s.label);
			return true;
		}).slice(0, 4);
	});
</script>

<svelte:head>
	<title>{occ.title} — AI Displacement Risk | SG AI Occupation Index</title>
	<meta
		name="description"
		content="{occ.title} (SSOC {occ.ssoc}): Net displacement risk {(occ.net_risk * 100).toFixed(0)}%, rated {riskBandLabels[occ.risk_band]}. Median wage SGD {occ.gross_wage_median.toLocaleString()}."
	/>
	<meta property="og:title" content="{occ.title} — AI Displacement Risk | SG AI Occupation Index" />
	<meta property="og:description" content="Net risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]}). Median wage SGD {occ.gross_wage_median.toLocaleString()}." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/occupation/{occ.ssoc}" />
	<meta property="og:image" content="https://sg-ai-jobs.vercel.app/og/{occ.ssoc}.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:title" content="{occ.title} — AI Displacement Risk" />
	<meta name="twitter:description" content="Net risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]})" />
	<meta name="twitter:image" content="https://sg-ai-jobs.vercel.app/og/{occ.ssoc}.png" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Occupation",
		"name": occ.title,
		"occupationalCategory": occ.major_group,
		"estimatedSalary": {
			"@type": "MonetaryAmountDistribution",
			"name": "Gross Monthly Wage",
			"currency": "SGD",
			"median": occ.gross_wage_median,
			"percentile25": occ.gross_wage_25th,
			"percentile75": occ.gross_wage_75th
		},
		"occupationLocation": {
			"@type": "Country",
			"name": "Singapore"
		},
		"additionalProperty": [
			{
				"@type": "PropertyValue",
				"name": "AI Net Displacement Risk",
				"value": occ.net_risk
			},
			{
				"@type": "PropertyValue",
				"name": "Risk Band",
				"value": riskBandLabels[occ.risk_band]
			}
		]
	})}</script>`}
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
		<a href="/" class="hover:text-foreground/80">Home</a>
		<span class="mx-1">/</span>
		<span class="text-foreground">{occ.title}</span>
	</nav>

	<!-- 1. Hero Header -->
	<div class="mb-4">
		<div class="flex items-start gap-3">
			{#if group}
				<span
					class="mt-1.5 inline-block h-4 w-4 rounded-sm"
					style="background-color: {group.color};"
				></span>
			{/if}
			<div>
				<h1 class={titleStyle({ size: 'page' })}>{occ.title}</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{group?.label ?? occ.major_group}
					&middot; 1 of {groupOccupations.length} {group?.label ?? occ.major_group} occupations &middot; Group avg risk: {groupAvgRisk}%
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class={riskBadge({ band: occ.risk_band })}>
						{riskBandLabels[occ.risk_band]} Risk
					</span>
					<span class={impactBadge({ type: occ.impact_type })}>
						{impactTypeLabels[occ.impact_type]}
					</span>
					<span class={confidenceBadge({ level: occ.confidence.level })}>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Estimate Confidence
					</span>
				</div>
				<div class="mt-2">
					<a
						href="/compare?jobs={occ.ssoc}"
						class="text-xs text-muted-foreground underline decoration-border hover:text-foreground/80"
					>
						Compare with another role &rarr;
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- 2. What This Means For You -->
	<section class="mb-4 rounded-xl border-2 {summaryCardStyle.border} {summaryCardStyle.bg} p-6">
		<h2 class="mb-3 text-base font-bold {meaningHeadingColor}">What This Means For You</h2>
		<p class="text-base leading-relaxed text-foreground/80">{summaryText}</p>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{marketContext}</p>
	</section>

	<!-- 3. What AI Can and Can't Do -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>What AI Can and Can't Do</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg bg-muted p-4">
				<p class={cn(sectionLabel(), 'mb-1')}>AI can handle</p>
				<p class="text-sm leading-relaxed text-foreground/80">{aiCanAndCant.canDo}</p>
			</div>
			<div class="rounded-lg bg-muted p-4">
				<p class={cn(sectionLabel(), 'mb-1')}>Humans still needed for</p>
				<p class="text-sm leading-relaxed text-foreground/80">{aiCanAndCant.cantDo}</p>
			</div>
		</div>
	</section>

	<!-- 4. Skills to Focus On -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Skills to Focus On</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each skillRecommendations as skill}
				<div class="rounded-lg border border-border/50 bg-muted p-4">
					<p class="text-sm font-semibold text-foreground">{skill.label}</p>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{skill.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- 5. Where This Occupation Stands -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Where This Occupation Stands</h2>

		<!-- Percentile Bars -->
		<div class="space-y-3">
			<div>
				<div class="mb-1 flex items-center justify-between text-xs">
					<span class="text-muted-foreground">AI Risk Score</span>
					<span class="font-medium text-foreground">Higher than {netRiskPercentile}% of {allOccupations.length} occupations</span>
				</div>
				<div class="relative h-3 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="absolute inset-y-0 left-0 rounded-full"
						style="width: {netRiskPercentile}%; background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);"
					></div>
					<div
						class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-foreground shadow"
						style="left: {netRiskPercentile}%;"
					></div>
				</div>
			</div>
			<div>
				<div class="mb-1 flex items-center justify-between text-xs">
					<span class="text-muted-foreground">Wage Percentile</span>
					<span class="font-medium text-foreground">Higher than {wagePercentile}% of {allOccupations.length} occupations</span>
				</div>
				<div class="relative h-3 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="absolute inset-y-0 left-0 rounded-full bg-blue-400"
						style="width: {wagePercentile}%;"
					></div>
					<div
						class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-700 shadow"
						style="left: {wagePercentile}%;"
					></div>
				</div>
			</div>
		</div>

		<!-- Wage Range -->
		<h3 class="mb-2 mt-5 text-sm font-semibold text-foreground/80">Gross Monthly Wage (SGD)</h3>
		<div class="relative pb-2 pt-6">
			<div class="relative h-6">
				<div class="absolute inset-y-0 left-0 right-0 rounded bg-muted"></div>
				<div
					class="absolute inset-y-0 rounded bg-blue-200"
					style="left: {wageLeftPct}%; width: {wageRightPct - wageLeftPct}%;"
				></div>
				<div
					class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
					style="left: {wageMedianPct}%;"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-muted-foreground">
				<span>25th: SGD {occ.gross_wage_25th.toLocaleString()}</span>
				<span class="font-medium text-foreground">Median: SGD {occ.gross_wage_median.toLocaleString()}</span>
				<span>75th: SGD {occ.gross_wage_75th.toLocaleString()}</span>
			</div>
		</div>
		<p class="mt-2 text-sm text-muted-foreground">
			This role pays {wageVsNational} of SGD {data.nationalMedian.toLocaleString()}.
		</p>

		<!-- Evidence Trail -->
		<h3 class="mb-2 mt-5 text-sm font-semibold text-foreground/80">Evidence Trail</h3>
		<div class="space-y-2">
			{#each evidenceTrail as item}
				<div class="flex items-start gap-2">
					<span class="{item.tone} mt-0.5 text-sm font-bold shrink-0">
						{#if item.icon === 'check'}&#10003;{:else if item.icon === 'approx'}&#9675;{:else}&#9679;{/if}
					</span>
					<div>
						<span class="text-xs font-semibold text-foreground">{item.label}</span>
						<p class="text-xs text-muted-foreground leading-relaxed">{item.sentence}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 6. Local Market Evidence — COLLAPSED -->
	<section class="mb-4">
		<details class="rounded-lg border border-border bg-card">
			<summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground/80">
				Local Market Evidence
			</summary>
			<div class="border-t border-border/50 p-5">
				<!-- Market Signals -->
				<h3 class="mb-2 text-sm font-semibold text-foreground/80">Market Signals</h3>
				<div class="space-y-3">
					<div>
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Market Momentum</span>
							<span class="font-medium tabular-nums text-foreground">{occ.market.market_momentum.toFixed(2)}</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-blue-400"
								style="width: {Math.min(occ.market.market_momentum * 100, 100)}%;"
							></div>
						</div>
					</div>
					<div>
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Occupation Scarcity</span>
							<span class="font-medium tabular-nums text-foreground">{occ.market.occupation_scarcity.toFixed(2)}</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-amber-400"
								style="width: {Math.min(occ.market.occupation_scarcity * 100, 100)}%;"
							></div>
						</div>
					</div>
					<div>
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Singapore Demand Buffer <span class="text-xs text-muted-foreground/60">(Market Resilience)</span></span>
							<span class="font-medium tabular-nums text-foreground">{occ.market.market_resilience.toFixed(2)}</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-blue-400"
								style="width: {Math.min(occ.market.market_resilience * 100, 100)}%;"
							></div>
						</div>
					</div>
				</div>

				{#if occ.labour_monitor}
					<h3 class="mb-2 mt-5 text-sm font-semibold text-foreground/80">Local Hiring Signal <span class="text-xs font-normal text-muted-foreground">(Labour Monitor)</span></h3>
					<div class="rounded-lg border border-border/50 bg-muted p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class={sectionLabel()}>
									Labour cluster: {occ.labour_monitor.cluster_label}
								</p>
								<p class="mt-1 text-sm text-foreground/80">
									Vacancy rate: <span class="font-semibold text-foreground">{occ.labour_monitor.vacancy.latest_rate}%</span>
									<span class="text-muted-foreground">in {occ.labour_monitor.vacancy.latest_quarter}</span>
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									4Q-over-4Q trend: {occ.labour_monitor.vacancy.trend_4q_pct > 0 ? '+' : ''}{occ.labour_monitor.vacancy.trend_4q_pct.toFixed(1)}%
								</p>
							</div>
							<div class="flex flex-col items-end gap-1.5">
								<span class="rounded-full border px-2.5 py-1 text-xs font-medium {vacancySignalTone(occ.labour_monitor.vacancy.signal)}">
									{vacancySignalLabel(occ.labour_monitor.vacancy.signal)}
								</span>
								<span class="rounded-full border px-2.5 py-1 text-xs font-medium {overallSignalTone(occ.labour_monitor.overall)}">
									Overall: {overallSignalLabel(occ.labour_monitor.overall)}
								</span>
							</div>
						</div>

						{#if occ.labour_monitor.hiring}
							<div class="mt-3 rounded bg-white/60 px-3 py-2">
								<p class="text-xs text-muted-foreground">
									Net Hiring: Recruitment {occ.labour_monitor.hiring.recruitment_rate}% &middot;
									Resignation {occ.labour_monitor.hiring.resignation_rate}% &middot;
									Net: {occ.labour_monitor.hiring.net_pressure > 0 ? '+' : ''}{occ.labour_monitor.hiring.net_pressure}pp
								</p>
							</div>
						{/if}

						{#if occ.labour_monitor.retrenchment}
							<div class="mt-2 rounded bg-white/60 px-3 py-2">
								<p class="text-xs text-muted-foreground">
									Retrenchment: {occ.labour_monitor.retrenchment.latest_count.toLocaleString()} in {occ.labour_monitor.retrenchment.latest_quarter}
									&middot; Trend: {occ.labour_monitor.retrenchment.trend_4q_pct > 0 ? '+' : ''}{occ.labour_monitor.retrenchment.trend_4q_pct.toFixed(1)}%
								</p>
							</div>
						{/if}

						{#if occ.labour_monitor.vacancy.recent_quarters.length > 0}
							<div class="mt-4">
								<div class="flex items-end gap-2">
									{#each occ.labour_monitor.vacancy.recent_quarters as point}
										<div class="flex-1">
											<div class="flex h-16 items-end">
												<div
													class="w-full rounded-t bg-blue-400/80"
													style="height: {Math.max((point.rate / Math.max(...occ.labour_monitor.vacancy.recent_quarters.map((p) => p.rate))) * 100, 8)}%;"
												></div>
											</div>
											<p class="mt-1 text-center text-xs text-muted-foreground">{point.quarter.replace('20', '')}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<p class="mt-3 text-xs text-muted-foreground">
							Source: MOM/SingStat via data.gov.sg. Latest: {occ.labour_monitor.data_as_of}. Cluster-level data.
						</p>
					</div>
				{/if}
			</div>
		</details>
	</section>

	<!-- 7. Technical Scoring Details — COLLAPSED -->
	<section class="mb-4">
		<details class="rounded-lg border border-border bg-card">
			<summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground/80">
				Technical Scoring Details
			</summary>
			<div class="border-t border-border/50 p-5">
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Score Breakdown -->
					<div>
						<h3 class="mb-3 text-sm font-semibold text-foreground/80">Score Breakdown</h3>
						<RadarChart occupation={occ} />
					</div>

					<!-- Net Risk Explanation -->
					<div>
						<h3 class="mb-3 text-sm font-semibold text-foreground/80">How Net Risk is Computed</h3>
						<div class="space-y-3 text-sm text-muted-foreground">
							<div class="flex items-center justify-between rounded bg-red-50 px-3 py-2">
								<span class="font-medium text-red-700">AI Task Overlap <span class="text-xs text-red-500">(Exposure)</span></span>
								<span class="font-semibold tabular-nums text-red-700">{(occ.exposure * 100).toFixed(0)}%</span>
							</div>
							<div class="flex items-center justify-center text-muted-foreground">
								<span class="font-mono text-sm">&times;</span>
							</div>
							<div class="flex items-center justify-between rounded bg-green-50 px-3 py-2">
								<span class="font-medium text-green-700">(1 - Human Advantage) <span class="text-xs text-green-500">(Bottleneck)</span></span>
								<span class="font-semibold tabular-nums text-green-700">{((1 - occ.bottleneck) * 100).toFixed(0)}%</span>
							</div>
							<div class="flex items-center justify-center text-muted-foreground">
								<span class="font-mono text-sm">&times;</span>
							</div>
							<div class="flex items-center justify-between rounded bg-blue-50 px-3 py-2">
								<span class="font-medium text-blue-700">Market Modifier</span>
								<span class="font-semibold tabular-nums text-blue-700">{occ.market.market_modifier.toFixed(2)}</span>
							</div>
							<div class="flex items-center justify-center text-muted-foreground">
								<span class="text-lg">=</span>
							</div>
							<div class="flex items-center justify-between rounded px-3 py-2" style="background-color: {riskBandColors[occ.risk_band]}20;">
								<span class="font-semibold text-foreground">AI Risk Score <span class="text-xs text-muted-foreground">(Net Displacement Risk)</span></span>
								<span class="text-base font-bold tabular-nums text-foreground">{(occ.net_risk * 100).toFixed(0)}%</span>
							</div>
							<div class="rounded border px-3 py-2 {stabilityTone(occ.stability.label)}">
								<div class="flex items-center justify-between gap-3">
									<span class="text-sm font-semibold">Band Stability</span>
									<span class="text-xs font-semibold uppercase tracking-wide">{occ.stability.label}</span>
								</div>
								<p class="mt-1 text-xs leading-relaxed opacity-90">
									{stabilityCopy(occ.stability.label)}
								</p>
								<p class="mt-2 text-xs opacity-80">
									Optimistic: {(occ.stability.optimistic_risk * 100).toFixed(0)}% ({riskBandLabels[occ.stability.optimistic_band]})
									&middot; Pessimistic: {(occ.stability.pessimistic_risk * 100).toFixed(0)}% ({riskBandLabels[occ.stability.pessimistic_band]})
								</p>
							</div>
							<!-- Augmentation Potential -->
							<div class="mt-2 border-t border-border/50 pt-3">
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="font-medium text-primary">Augmentation Potential</span>
									<span class="text-xs font-medium text-primary">{augmentationBandLabels[occ.augmentation_band]}</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary"
										style="width: {Math.min(occ.augmentation * 100, 100)}%;"
									></div>
								</div>
								<div class="mt-0.5 text-right text-xs tabular-nums text-primary">{(occ.augmentation * 100).toFixed(0)}%</div>
							</div>
						</div>
						<p class="mt-3 text-xs text-muted-foreground">
							<a href="/methodology" class="underline hover:text-foreground/80">About this scoring</a>
						</p>
					</div>
				</div>
			</div>
		</details>
	</section>

	<!-- 7. Related Career Paths -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-4')}>Related Career Paths</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			{#if data.relatedPaths.lowerRisk.length > 0}
				<div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Lower Risk Alternatives</h3>
					<div class="space-y-1.5">
						{#each data.relatedPaths.lowerRisk as sim (sim.ssoc)}
							<a
								href="/occupation/{sim.ssoc}"
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
							>
								<span class="truncate text-foreground/80">{sim.title}</span>
								<span
									class={cn(riskBadge({ band: sim.risk_band }), 'ml-2 shrink-0')}
								>
									{(sim.net_risk * 100).toFixed(0)}%
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.relatedPaths.higherPay.length > 0}
				<div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Higher Pay Options</h3>
					<div class="space-y-1.5">
						{#each data.relatedPaths.higherPay as sim (sim.ssoc)}
							<a
								href="/occupation/{sim.ssoc}"
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
							>
								<span class="truncate text-foreground/80">{sim.title}</span>
								<span class="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
									SGD {sim.gross_wage_median.toLocaleString()}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.relatedPaths.inDemand.length > 0}
				<div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">In-Demand Roles</h3>
					<div class="space-y-1.5">
						{#each data.relatedPaths.inDemand as sim (sim.ssoc)}
							<a
								href="/occupation/{sim.ssoc}"
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
							>
								<span class="truncate text-foreground/80">{sim.title}</span>
								<span
									class={cn(riskBadge({ band: sim.risk_band }), 'ml-2 shrink-0')}
								>
									{riskBandLabels[sim.risk_band]}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- 8. Data Sources -->
	<footer class="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
		<p>
			Data: MOM Singapore | Felten AIOE | Pizzinelli/IMF | Anthropic | SOL 2026
		</p>
		<p class="mt-1">
			Estimate Confidence: {occ.confidence.level} ({(occ.confidence.score * 100).toFixed(0)}%) &mdash;
			Crosswalk {occ.confidence.crosswalk_quality.toFixed(2)},
			Market data {occ.confidence.market_data_granularity.toFixed(2)},
			Freshness {occ.confidence.source_freshness.toFixed(2)}
		</p>
	</footer>
</main>
