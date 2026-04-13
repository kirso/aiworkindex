<script lang="ts">
	import { card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface WorkContextItem {
		label: string;
		value: number;
	}

	interface Demographics {
		medianAge?: number | null;
		totalEmployment?: number | null;
		under25Share?: number | null;
		primeAgeShare?: number | null;
		olderShare?: number | null;
	}

	interface Props {
		items: WorkContextItem[];
		demographics?: Demographics;
		class?: string;
	}

	let { items, demographics, class: className }: Props = $props();

	const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

	const formatEmploymentCount = (value: number | null) => {
		if (value == null) return '\u2014';
		return value >= 1000
			? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}M`
			: `${fmt.format(value)}K`;
	};

	const formatSharePct = (value: number | null) =>
		value == null ? '\u2014' : `${(value * 100).toFixed(0)}%`;
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Work environment</p>
	{#if items.length > 0}
		<ul class="mt-2 space-y-1.5 text-sm text-muted-foreground">
			{#each items as item, index (`context-${index}`)}
				<li class="flex items-center justify-between">
					<span>{item.label}</span>
					<span class="font-mono text-xs">{item.value.toFixed(1)}/5</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-1 text-sm text-muted-foreground">No work environment data available.</p>
	{/if}

	{#if demographics && (demographics.medianAge != null || demographics.totalEmployment != null)}
		<p class="mt-4 text-sm font-semibold text-foreground">Who does this work</p>
		{#if demographics.medianAge != null}
			<p class="mt-1 text-sm text-muted-foreground">
				Median age: {demographics.medianAge.toFixed(1)}
			</p>
		{/if}
		{#if demographics.totalEmployment != null}
			<p class="mt-1 text-sm text-muted-foreground">
				{formatEmploymentCount(demographics.totalEmployment)} employed
				{#if demographics.under25Share != null}
					&middot; Under 25: {formatSharePct(demographics.under25Share)}
				{/if}
				{#if demographics.primeAgeShare != null}
					&middot; 25&ndash;54: {formatSharePct(demographics.primeAgeShare)}
				{/if}
				{#if demographics.olderShare != null}
					&middot; 55+: {formatSharePct(demographics.olderShare)}
				{/if}
			</p>
		{/if}
	{/if}
</div>
