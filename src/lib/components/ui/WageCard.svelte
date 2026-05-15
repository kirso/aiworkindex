<script lang="ts">
	import { card, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface Props {
		median: number | null;
		mean?: number | null;
		p10?: number | null;
		p25?: number | null;
		p75?: number | null;
		p90?: number | null;
		hourly?: number | null;
		employment?: number | null;
		currency?: string;
		period?: 'monthly' | 'annual';
		class?: string;
	}

	let {
		median,
		mean = null,
		p10 = null,
		p25 = null,
		p75 = null,
		p90 = null,
		hourly = null,
		employment = null,
		currency = 'USD',
		period = 'annual',
		class: className
	}: Props = $props();

	const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

	const formatCurrency = (value: number | null) =>
		value == null ? '\u2014' : `${currency} ${fmt.format(value)}`;

	const formatWorkerCount = (value: number | null) =>
		value == null ? '\u2014' : `${fmt.format(value)} workers`;

	let barWidth = $derived(median != null ? Math.max(0, Math.min(100, (median / 200000) * 100)) : 0);

	let periodLabel = $derived(period === 'monthly' ? 'monthly' : 'annual');
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Wage context</p>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		<div>
			<p class={microLabel()}>Median {periodLabel}</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{formatCurrency(median)}
			</p>
		</div>
		<div>
			<p class={microLabel()}>Mean {periodLabel}</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{formatCurrency(mean)}
			</p>
		</div>
	</div>

	<div class="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
		{#if p10 != null}
			<p>10th percentile: {formatCurrency(p10)}</p>
		{/if}
		{#if p25 != null}
			<p>25th percentile: {formatCurrency(p25)}</p>
		{/if}
		{#if p75 != null}
			<p>75th percentile: {formatCurrency(p75)}</p>
		{/if}
		{#if p90 != null}
			<p>90th percentile: {formatCurrency(p90)}</p>
		{/if}
		{#if hourly != null}
			<p>Hourly median: {formatCurrency(hourly)}</p>
		{/if}
		{#if employment != null}
			<p>Employment: {formatWorkerCount(employment)}</p>
		{/if}
	</div>

	<div class="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
		<div class="h-full rounded-full bg-primary/80" style={`width: ${barWidth.toFixed(1)}%`}></div>
	</div>
</div>
