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

	// Confidence badge color
	function confidenceColor(level: string): string {
		if (level === 'high') return '#16a34a';
		if (level === 'medium') return '#ca8a04';
		return '#dc2626';
	}

	// Employment formatting
	function formatEmploymentLong(thousands: number): string {
		if (thousands >= 1) return `~${(thousands * 1000).toLocaleString()} jobs in Singapore`;
		return `~${Math.round(thousands * 1000)} jobs in Singapore`;
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

	// Count of occupations with same impact_type
	let impactTypeCount = $derived(
		allOccupations.filter((o) => o.impact_type === occ.impact_type).length
	);

	// Summary card color based on impact type
	let summaryCardStyle = $derived.by(() => {
		switch (occ.impact_type) {
			case 'ai_leveraged':
				return { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-800' };
			case 'at_risk':
				return { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-800' };
			case 'stable':
				return { bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-800' };
			case 'mixed':
				return { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-800' };
			default:
				return { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-800' };
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
	<meta name="twitter:title" content="{occ.title} — AI Displacement Risk" />
	<meta name="twitter:description" content="Net risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]})" />
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
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/" class="hover:text-gray-700">Home</a>
		<span class="mx-1">/</span>
		<span class="text-gray-900">{occ.title}</span>
	</nav>

	<!-- 1. Hero Header -->
	<div class="mb-6">
		<div class="flex items-start gap-3">
			{#if group}
				<span
					class="mt-1.5 inline-block h-4 w-4 rounded-sm"
					style="background-color: {group.color};"
				></span>
			{/if}
			<div>
				<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">{occ.title}</h1>
				<p class="mt-1 text-sm text-gray-500">
					SSOC {occ.ssoc} &middot; {group?.label ?? occ.major_group}
				</p>
				<p class="mt-0.5 text-sm text-gray-500">
					{formatEmploymentLong(occ.employment_thousands)}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-sm font-semibold text-white"
						style="background-color: {riskBandColors[occ.risk_band]};"
					>
						{riskBandLabels[occ.risk_band]} Risk
					</span>
					<span
						class="rounded-full px-3 py-1 text-sm font-semibold text-white"
						style="background-color: {impactTypeColors[occ.impact_type]};"
					>
						{impactTypeLabels[occ.impact_type]}
					</span>
					<span
						class="rounded-full border px-2.5 py-0.5 text-xs font-medium"
						style="color: {confidenceColor(occ.confidence.level)}; border-color: {confidenceColor(occ.confidence.level)};"
					>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Confidence
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- 2. What This Means For You -->
	<section class="mb-6 rounded-xl border-2 {summaryCardStyle.border} {summaryCardStyle.bg} p-6">
		<h2 class="mb-3 text-lg font-bold {summaryCardStyle.accent}">What This Means For You</h2>
		<p class="text-base leading-relaxed text-gray-800">{summaryText}</p>
		<p class="mt-3 text-sm leading-relaxed text-gray-600">{marketContext}</p>
	</section>

	<!-- 3. What AI Can and Can't Do -->
	<section class="mb-6 rounded-lg border border-gray-200 bg-white p-5">
		<h2 class="mb-3 text-base font-bold text-gray-900">What AI Can and Can't Do</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg bg-gray-50 p-4">
				<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">AI can handle</p>
				<p class="text-sm leading-relaxed text-gray-700">{aiCanAndCant.canDo}</p>
			</div>
			<div class="rounded-lg bg-gray-50 p-4">
				<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Humans still needed for</p>
				<p class="text-sm leading-relaxed text-gray-700">{aiCanAndCant.cantDo}</p>
			</div>
		</div>
	</section>

	<!-- 4. Skills to Focus On -->
	<section class="mb-6 rounded-lg border border-gray-200 bg-white p-5">
		<h2 class="mb-3 text-base font-bold text-gray-900">Skills to Focus On</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each skillRecommendations as skill}
				<div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
					<p class="text-sm font-semibold text-gray-900">{skill.label}</p>
					<p class="mt-1 text-xs leading-relaxed text-gray-500">{skill.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- 5. Wage & Market Context -->
	<section class="mb-6 rounded-lg border border-gray-200 bg-white p-5">
		<h2 class="mb-3 text-base font-bold text-gray-900">Wage & Market</h2>

		<!-- Wage Range -->
		<h3 class="mb-2 text-sm font-semibold text-gray-700">Gross Monthly Wage (SGD)</h3>
		<div class="relative pb-2 pt-6">
			<div class="relative h-6">
				<div class="absolute inset-y-0 left-0 right-0 rounded bg-gray-100"></div>
				<div
					class="absolute inset-y-0 rounded bg-blue-200"
					style="left: {wageLeftPct}%; width: {wageRightPct - wageLeftPct}%;"
				></div>
				<div
					class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
					style="left: {wageMedianPct}%;"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-gray-500">
				<span>25th: SGD {occ.gross_wage_25th.toLocaleString()}</span>
				<span class="font-medium text-gray-900">Median: SGD {occ.gross_wage_median.toLocaleString()}</span>
				<span>75th: SGD {occ.gross_wage_75th.toLocaleString()}</span>
			</div>
		</div>
		<p class="mt-2 text-sm text-gray-600">
			This role pays {wageVsNational} of SGD {data.nationalMedian.toLocaleString()}.
		</p>

		<!-- Market Signals -->
		<h3 class="mb-2 mt-5 text-sm font-semibold text-gray-700">Market Signals</h3>
		<div class="space-y-3">
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-gray-600">Market Momentum</span>
					<span class="font-medium tabular-nums text-gray-900">{occ.market.market_momentum.toFixed(2)}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full rounded-full bg-purple-400"
						style="width: {Math.min(occ.market.market_momentum * 100, 100)}%;"
					></div>
				</div>
			</div>
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-gray-600">Occupation Scarcity</span>
					<span class="font-medium tabular-nums text-gray-900">{occ.market.occupation_scarcity.toFixed(2)}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full rounded-full bg-amber-400"
						style="width: {Math.min(occ.market.occupation_scarcity * 100, 100)}%;"
					></div>
				</div>
			</div>
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-gray-600">Market Resilience</span>
					<span class="font-medium tabular-nums text-gray-900">{occ.market.market_resilience.toFixed(2)}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full rounded-full bg-blue-400"
						style="width: {Math.min(occ.market.market_resilience * 100, 100)}%;"
					></div>
				</div>
			</div>
		</div>
	</section>

	<!-- 6. Technical Scores — COLLAPSED -->
	<section class="mb-6">
		<details class="rounded-lg border border-gray-200 bg-white">
			<summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-700">
				Technical Scoring Details
			</summary>
			<div class="border-t border-gray-100 p-5">
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Score Breakdown -->
					<div>
						<h3 class="mb-3 text-sm font-semibold text-gray-700">Score Breakdown</h3>
						<RadarChart occupation={occ} />
					</div>

					<!-- Net Risk Explanation -->
					<div>
						<h3 class="mb-3 text-sm font-semibold text-gray-700">How Net Risk is Computed</h3>
						<div class="space-y-3 text-sm text-gray-600">
							<div class="flex items-center justify-between rounded bg-red-50 px-3 py-2">
								<span class="font-medium text-red-700">Exposure (percentile)</span>
								<span class="font-semibold tabular-nums text-red-700">{(occ.exposure * 100).toFixed(0)}%</span>
							</div>
							<div class="flex items-center justify-center text-gray-400">
								<span class="font-mono text-sm">&times;</span>
							</div>
							<div class="flex items-center justify-between rounded bg-green-50 px-3 py-2">
								<span class="font-medium text-green-700">(1 - Bottleneck)</span>
								<span class="font-semibold tabular-nums text-green-700">{((1 - occ.bottleneck) * 100).toFixed(0)}%</span>
							</div>
							<div class="flex items-center justify-center text-gray-400">
								<span class="font-mono text-sm">&times;</span>
							</div>
							<div class="flex items-center justify-between rounded bg-blue-50 px-3 py-2">
								<span class="font-medium text-blue-700">Market Modifier</span>
								<span class="font-semibold tabular-nums text-blue-700">{occ.market.market_modifier.toFixed(2)}</span>
							</div>
							<div class="flex items-center justify-center text-gray-400">
								<span class="text-lg">=</span>
							</div>
							<div class="flex items-center justify-between rounded px-3 py-2" style="background-color: {riskBandColors[occ.risk_band]}20;">
								<span class="font-semibold text-gray-900">Net Displacement Risk</span>
								<span class="text-lg font-bold tabular-nums text-gray-900">{(occ.net_risk * 100).toFixed(0)}%</span>
							</div>
							<!-- Augmentation Potential -->
							<div class="mt-2 border-t border-gray-100 pt-3">
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="font-medium text-indigo-700">Augmentation Potential</span>
									<span class="text-xs font-medium text-indigo-600">{augmentationBandLabels[occ.augmentation_band]}</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
									<div
										class="h-full rounded-full"
										style="width: {Math.min(occ.augmentation * 100, 100)}%; background: linear-gradient(to right, #818cf8, #6366f1);"
									></div>
								</div>
								<div class="mt-0.5 text-right text-xs tabular-nums text-indigo-600">{(occ.augmentation * 100).toFixed(0)}%</div>
							</div>
						</div>
						<p class="mt-3 text-xs text-gray-400">
							<a href="/methodology" class="underline hover:text-gray-600">About this scoring</a>
						</p>
					</div>
				</div>
			</div>
		</details>
	</section>

	<!-- 7. Related Career Paths -->
	<section class="mb-6 rounded-lg border border-gray-200 bg-white p-5">
		<h2 class="mb-4 text-base font-bold text-gray-900">Related Career Paths</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			{#if data.relatedPaths.lowerRisk.length > 0}
				<div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">Lower Risk Alternatives</h3>
					<div class="space-y-1.5">
						{#each data.relatedPaths.lowerRisk as sim (sim.ssoc)}
							<a
								href="/occupation/{sim.ssoc}"
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
							>
								<span class="truncate text-gray-700">{sim.title}</span>
								<span
									class="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
									style="background-color: {riskBandColors[sim.risk_band]};"
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
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
							>
								<span class="truncate text-gray-700">{sim.title}</span>
								<span class="ml-2 shrink-0 text-xs tabular-nums text-gray-500">
									SGD {sim.gross_wage_median.toLocaleString()}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.relatedPaths.inDemand.length > 0}
				<div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-700">In-Demand Roles</h3>
					<div class="space-y-1.5">
						{#each data.relatedPaths.inDemand as sim (sim.ssoc)}
							<a
								href="/occupation/{sim.ssoc}"
								class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
							>
								<span class="truncate text-gray-700">{sim.title}</span>
								<span
									class="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
									style="background-color: {riskBandColors[sim.risk_band]};"
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
	<footer class="border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
		<p>
			Data: MOM Singapore | Felten AIOE | Pizzinelli/IMF | Anthropic | SOL 2026
		</p>
		<p class="mt-1">
			Confidence: {occ.confidence.level} ({(occ.confidence.score * 100).toFixed(0)}%) &mdash;
			Crosswalk {occ.confidence.crosswalk_quality.toFixed(2)},
			Market data {occ.confidence.market_data_granularity.toFixed(2)},
			Freshness {occ.confidence.source_freshness.toFixed(2)}
		</p>
	</footer>
</main>
