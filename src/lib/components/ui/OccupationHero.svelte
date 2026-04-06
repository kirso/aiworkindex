<script lang="ts">
	import type { Snippet } from 'svelte';
	import { body, caption, display, pill, riskBadge, scoreTileClasses, title as titleStyle } from '$lib/design-system';
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
		class: className = ''
	}: Props = $props();
</script>

<div class={cn('overflow-hidden', className)}>
	<div class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
		<div
			class={cn('rounded-2xl border p-5', scoreTileClasses(scoreBand))}
			role="figure"
			aria-label={`${scoreLabel} ${scoreValue}, rated ${scoreBandLabel}`}
		>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">{scoreLabel}</p>
			<p class={cn(display({ size: 'xl' }), 'mt-2')}>{scoreValue}</p>
			<span class={cn(riskBadge({ band: scoreBand }), 'mt-2 inline-flex')}>
				{scoreBandLabel} Risk
			</span>
		</div>

		<div class="min-w-0">
			<div class="flex items-start justify-between gap-4">
				<h1 class={cn(titleStyle({ size: 'page' }), 'min-w-0 xl:whitespace-nowrap xl:leading-[0.95]')}>
					{title}
				</h1>
				{#if actions}
					<div class="flex shrink-0 items-center gap-2">
						{@render actions()}
					</div>
				{/if}
			</div>
			{#if pills.length > 0}
				<div class="mt-1.5 flex flex-wrap items-center gap-2">
					{#each pills as item (item.label)}
						<span class={pill({ tone: item.tone ?? 'muted' })}>{item.label}</span>
					{/each}
				</div>
			{/if}
			<p class={cn(body({ size: 'lg', tone: 'subtle' }), 'mt-3 max-w-3xl')}>{summary}</p>
			{#if meta.length > 0}
				<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
					{#each meta as line (line)}
						<span class={caption()}>{line}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
