<script lang="ts">
	import type { Snippet } from 'svelte';
	import { display, title as titleStyle } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { PressureTone } from '$lib/data/v9-display';

	interface Props {
		spokenTitle: string;
		officialTitle?: string;
		code: string;
		codeLabel?: string;
		scoreValue: string;
		ranked: boolean;
		pressureLabel: string;
		pressureTone: PressureTone;
		meaning: string;
		caveat: string;
		payValue: string;
		payDetail: string;
		demandValue: string;
		demandDetail: string;
		definition?: string | null;
		alsoFoundAs?: string;
		statusLabel?: string;
		actions?: Snippet;
		class?: string;
	}

	let {
		spokenTitle,
		officialTitle,
		code,
		codeLabel,
		scoreValue,
		ranked,
		pressureLabel,
		pressureTone,
		meaning,
		caveat,
		payValue,
		payDetail,
		demandValue,
		demandDetail,
		definition = null,
		alsoFoundAs,
		statusLabel,
		actions,
		class: className = ''
	}: Props = $props();

	const toneSteps: Record<PressureTone, number> = {
		very_low: 1,
		low: 2,
		moderate: 3,
		high: 4,
		very_high: 5
	};
	const toneFill: Record<PressureTone, string> = {
		very_low: 'bg-pressure-0',
		low: 'bg-pressure-20',
		moderate: 'bg-pressure-60',
		high: 'bg-pressure-80',
		very_high: 'bg-pressure-100'
	};
	const toneText: Record<PressureTone, string> = {
		very_low: 'text-risk-very-low',
		low: 'text-risk-low',
		moderate: 'text-risk-moderate',
		high: 'text-risk-high',
		very_high: 'text-risk-very-high'
	};
</script>

<header class={cn('min-w-0', className)}>
	<div class="flex min-w-0 flex-wrap items-center gap-2">
		<span
			class="border border-border bg-card px-2 py-1 font-mono text-xs font-medium text-muted-foreground"
		>
			{codeLabel ?? `SSOC ${code}`}
		</span>
		{#if statusLabel}
			<span class="border border-border bg-card px-2 py-1 text-xs font-medium text-foreground">
				{statusLabel}
			</span>
		{/if}
	</div>

	<h1 class={cn(titleStyle({ size: 'page' }), 'mt-4 min-w-0 break-words')}>{spokenTitle}</h1>
	{#if officialTitle && officialTitle !== spokenTitle}
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">Official title: {officialTitle}</p>
	{/if}

	<div
		class="mt-6 grid border-t-2 border-t-foreground border-b border-border md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
		role="figure"
		aria-label="{ranked
			? `${scoreValue} percent AI task overlap, ${pressureLabel}`
			: `Not ranked. ${pressureLabel}`}. {caveat}"
	>
		<div class="border-b border-border py-6 pr-6 md:border-r md:border-b-0">
			<p class="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
				AI task overlap
			</p>
			{#if ranked}
				<p class={cn(display({ size: 'hero' }), 'mt-1 text-foreground')}>
					{scoreValue}<span class="text-[0.42em] font-medium tracking-normal">%</span>
				</p>
			{:else}
				<p
					class="mt-2 font-sans text-5xl leading-none font-bold tracking-display text-foreground sm:text-6xl"
				>
					Not ranked
				</p>
			{/if}

			{#if ranked}
				<div class="mt-4 flex items-center gap-2.5">
					<div class="flex gap-0.5" aria-hidden="true">
						{#each Array.from({ length: 5 }, (_, i) => i) as step (step)}
							<span
								class={cn(
									'h-2 w-4',
									step < toneSteps[pressureTone] ? toneFill[pressureTone] : 'bg-muted'
								)}
							></span>
						{/each}
					</div>
					<span class={cn('text-sm font-bold', toneText[pressureTone])}>{pressureLabel}</span>
				</div>
			{:else}
				<p class="mt-4 text-sm font-semibold text-foreground">{pressureLabel}</p>
			{/if}

			{#if actions}
				<div class="mt-5 flex flex-wrap items-center gap-2">
					{@render actions()}
				</div>
			{/if}
		</div>

		<div class="min-w-0 py-6 md:pl-8">
			<p class="max-w-2xl text-[17px] leading-snug text-text-secondary">{meaning}</p>
			<p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{caveat}</p>

			<dl class="mt-6 grid gap-4 sm:grid-cols-2">
				<div>
					<dt class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
						Pay in Singapore
					</dt>
					<dd
						class="mt-1 font-mono text-2xl font-semibold tracking-display tabular-nums text-foreground"
					>
						{payValue}
					</dd>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{payDetail}</p>
				</div>
				<div>
					<dt class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
						Named demand
					</dt>
					<dd class="mt-1 font-sans text-2xl font-bold tracking-display text-foreground">
						{demandValue}
					</dd>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{demandDetail}</p>
				</div>
			</dl>

			{#if alsoFoundAs}
				<p class="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					<strong class="text-foreground">Also found as:</strong>
					{alsoFoundAs}
				</p>
			{/if}
		</div>
	</div>

	{#if definition}
		<details class="mt-4 border border-border bg-card">
			<summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
				Read the official SSOC definition
			</summary>
			<p class="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
				{definition}
			</p>
		</details>
	{/if}
</header>
