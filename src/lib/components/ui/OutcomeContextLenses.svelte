<script lang="ts">
	import { cn } from '$lib/utils';

	export interface OutcomeLens {
		label: string;
		value: string;
		detail: string;
		tone?: 'neutral' | 'positive' | 'warning' | 'caution';
	}

	let {
		lenses,
		sourceNote
	}: {
		lenses: OutcomeLens[];
		sourceNote: string;
	} = $props();

	function toneClass(tone: OutcomeLens['tone']) {
		if (tone === 'positive') return 'text-risk-very-low';
		if (tone === 'warning') return 'text-risk-moderate';
		if (tone === 'caution') return 'text-risk-high';
		return 'text-foreground';
	}
</script>

<div class="border-y border-border">
	<div class="grid md:grid-cols-2 md:divide-x md:divide-border">
		{#each lenses as lens, index (lens.label)}
			<div
				class={cn(
					'grid grid-cols-[2rem_1fr] gap-3 border-b border-border py-4 last:border-b-0',
					index % 2 === 0 ? 'md:pr-5' : 'md:pl-5',
					index >= lenses.length - 2 && 'md:border-b-0'
				)}
			>
				<span class="font-mono text-[11px] text-text-ghost"
					>{String(index + 1).padStart(2, '0')}</span
				>
				<div>
					<p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						{lens.label}
					</p>
					<p class={cn('mt-1 text-sm font-semibold', toneClass(lens.tone))}>{lens.value}</p>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{lens.detail}</p>
				</div>
			</div>
		{/each}
	</div>
	<p class="py-3 text-xs leading-relaxed text-muted-foreground">{sourceNote}</p>
</div>
