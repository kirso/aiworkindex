<script lang="ts">
	import type { Snippet } from 'svelte';
	import { body, pill, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { RiskBand } from '$lib/data';

	type HeroPill = {
		label: string;
		tone?: 'muted' | 'primary' | 'positive' | 'warning' | 'danger' | 'neutral' | 'outline';
	};

	interface Props {
		scoreLabel: string;
		scoreValue: string;
		scoreBand: RiskBand;
		scoreBandLabel: string;
		title: string;
		pills?: HeroPill[];
		summary: string;
		meta?: string[];
		actions?: Snippet;
		/** Optional uncertainty range (e.g. "59–81%") shown under the headline number. */
		scoreRange?: string;
		/** Short caveat under the score. Defaults to the structural-pressure framing. */
		scoreCaveat?: string;
		class?: string;
	}

	let {
		scoreLabel,
		scoreValue,
		scoreBand,
		scoreBandLabel,
		title,
		pills = [],
		summary,
		meta = [],
		actions,
		scoreRange,
		scoreCaveat = 'Structural pressure, not a prediction of job loss. Displacement tends to arrive through slower hiring, wage compression and role redesign before layoffs.',
		class: className = ''
	}: Props = $props();

	const bandSteps: Record<RiskBand, number> = {
		very_low: 1,
		low: 2,
		moderate: 3,
		high: 4,
		very_high: 5
	};
	const bandFill: Record<RiskBand, string> = {
		very_low: 'bg-risk-very-low',
		low: 'bg-risk-low',
		moderate: 'bg-risk-moderate',
		high: 'bg-risk-high',
		very_high: 'bg-risk-very-high'
	};
	const bandText: Record<RiskBand, string> = {
		very_low: 'text-risk-very-low',
		low: 'text-risk-low',
		moderate: 'text-risk-moderate',
		high: 'text-risk-high',
		very_high: 'text-risk-very-high'
	};
</script>

<div class={cn('min-w-0', className)}>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
		<h1 class={cn(titleStyle({ size: 'page' }), 'min-w-0')}>{title}</h1>
		{#if actions}
			<div class="flex shrink-0 items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>

	<!-- Verdict panel: score column | verdict column -->
	<div
		class="mt-5 grid border-t border-b border-t-foreground border-b-border md:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)]"
	>
		<div
			class="border-b border-border py-5 pr-6 md:border-r md:border-b-0"
			role="figure"
			aria-label={`${scoreLabel} ${scoreValue}, rated ${scoreBandLabel}${scoreRange ? `, range ${scoreRange}` : ''}. ${scoreCaveat}`}
		>
			<p class="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
				{scoreLabel}
			</p>
			<p class="mt-1 font-sans text-7xl leading-none font-black tracking-display tabular-nums">
				{scoreValue}
			</p>
			<div class="mt-4 flex items-center gap-2.5">
				<div class="flex gap-0.5" aria-hidden="true">
					{#each Array.from({ length: 5 }, (_, i) => i) as step (step)}
						<span
							class={cn('h-2 w-4', step < bandSteps[scoreBand] ? bandFill[scoreBand] : 'bg-muted')}
						></span>
					{/each}
				</div>
				<span class={cn('text-sm font-bold', bandText[scoreBand])}>{scoreBandLabel}</span>
			</div>
			{#if scoreRange}
				<p class="mt-2.5 font-mono text-xs text-muted-foreground tabular-nums">
					Range {scoreRange}
				</p>
			{/if}
		</div>

		<div class="min-w-0 py-5 md:pl-7">
			<p class={cn(body({ size: 'lg', tone: 'subtle' }), 'max-w-3xl text-[17px] leading-snug')}>
				{summary}
			</p>
			{#if pills.length > 0}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					{#each pills as item (item.label)}
						<span class={pill({ tone: item.tone ?? 'muted' })}>{item.label}</span>
					{/each}
				</div>
			{/if}
			{#if meta.length > 0}
				<p class="mt-3.5 font-mono text-xs text-text-secondary tabular-nums">
					{#each meta as line, i (line)}{#if i > 0}<span class="mx-2 text-text-ghost">·</span
							>{/if}{line}{/each}
				</p>
			{/if}
			{#if scoreCaveat}
				<p class="mt-3.5 flex max-w-2xl gap-2 text-[13px] leading-snug text-muted-foreground">
					<span class="text-primary" aria-hidden="true">※</span>
					{scoreCaveat}
				</p>
			{/if}
		</div>
	</div>
</div>
