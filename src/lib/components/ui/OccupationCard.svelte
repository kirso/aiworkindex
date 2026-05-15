<script lang="ts">
	import { riskBandLabels } from '$lib/data';
	import { riskBadge, card, body, caption, mono } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { formatCompactCount } from '$lib/data/home-surface';

	import type { RiskBand } from '$lib/data';

	/**
	 * Unified occupation card component with three render modes:
	 *
	 * - compact:  Index + title + right-side value. For homepage featured lists, rankings hub previews.
	 * - standard: Title + subtitle (wage/SSOC) + risk badge + risk %. For explore, general listings.
	 * - inset:    Inset card with title + metric line underneath. For related occupations, transitions, role components.
	 */

	type CardRow = {
		title: string;
		ssoc?: string;
		linkHref?: string | null;
		gross_wage_median?: number;
		currency?: string | null;
		wagePeriod?: 'monthly' | 'annual' | null;
		valueKind?: 'wage' | 'count';
		risk_band?: RiskBand;
		net_risk?: number;
		confidence?: { level: 'high' | 'medium' | 'low' };
	};

	type RenderMode = 'compact' | 'standard' | 'inset';

	let {
		occupation,
		mode = 'standard',
		// Compact mode props
		index,
		indexColor,
		rightLabel,
		rightColor,
		// Inset mode props
		metricParts
	}: {
		occupation: CardRow;
		mode?: RenderMode;
		/** 1-based rank number shown in compact mode */
		index?: number;
		/** Tailwind text color class for the index number (e.g. 'text-risk-very-high') */
		indexColor?: string;
		/** Override the right-side label in compact mode (default: risk %) */
		rightLabel?: string;
		/** Tailwind text color class for the right-side label */
		rightColor?: string;
		/** Metric segments shown below title in inset mode. Each item is { label: string; color?: string } joined with · separators */
		metricParts?: Array<{ label: string; color?: string }>;
	} = $props();

	let href = $derived(
		occupation.linkHref ?? (occupation.ssoc ? `/occupation/${occupation.ssoc}` : '#')
	);
</script>

{#if mode === 'compact'}
	<a
		href={occupation.linkHref ?? href}
		class="flex items-center gap-1.5 rounded-sm py-1 text-xs transition-colors hover:bg-accent"
	>
		{#if index != null}
			<span class={cn('w-3 font-mono font-bold', indexColor ?? 'text-muted-foreground')}>
				{index}
			</span>
		{/if}
		<span class="flex-1 truncate text-foreground">{occupation.title}</span>
		<span class={cn('shrink-0 font-mono', rightColor ?? 'text-muted-foreground')}>
			{rightLabel ?? `${((occupation.net_risk ?? 0) * 100).toFixed(0)}%`}
		</span>
	</a>
{:else if mode === 'inset'}
	<a
		href={occupation.linkHref ?? href}
		class={cn(
			card({ padding: 'sm', variant: 'inset' }),
			'block hover:bg-accent hover:shadow-sm transition-all group'
		)}
	>
		<p class={cn(body(), 'font-medium text-foreground truncate')}>
			{occupation.title}
			<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
		</p>
		{#if metricParts && metricParts.length > 0}
			<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
				{#each metricParts as part, i}
					{#if i > 0}<span>·</span>{/if}
					<span class={part.color ?? ''}>{part.label}</span>
				{/each}
			</div>
		{:else}
			<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
				<span>{((occupation.net_risk ?? 0) * 100).toFixed(0)}% risk</span>
				{#if occupation.gross_wage_median}
					<span>·</span>
					<span
						>{occupation.currency ?? 'SGD'} {occupation.gross_wage_median.toLocaleString()}/mo</span
					>
				{/if}
			</div>
		{/if}
	</a>
{:else}
	<!-- standard mode (default) -->
	<a
		href={occupation.linkHref ?? href}
		class={cn(card({ padding: 'sm', hover: true }), 'flex items-center justify-between')}
	>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-foreground">{occupation.title}</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{#if occupation.valueKind === 'count'}
					{formatCompactCount(occupation.gross_wage_median ?? 0)} mapped occupations
				{:else if occupation.gross_wage_median}
					Median: {occupation.currency ?? 'SGD'}
					{occupation.gross_wage_median?.toLocaleString()}{occupation.wagePeriod === 'annual'
						? '/yr'
						: '/mo'}
				{:else if occupation.ssoc}
					{occupation.ssoc}
				{/if}
			</p>
		</div>
		<div class="ml-3 flex flex-col items-end gap-1">
			<span class={riskBadge({ band: occupation.risk_band ?? 'moderate' })}>
				{riskBandLabels[occupation.risk_band ?? 'moderate']}
			</span>
			<span class={cn(mono({ size: 'sm' }), 'text-muted-foreground')}>
				Risk: {((occupation.net_risk ?? 0) * 100).toFixed(0)}%
			</span>
		</div>
	</a>
{/if}
