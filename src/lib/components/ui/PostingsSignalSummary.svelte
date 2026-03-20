<script lang="ts">
	import type {
		PostingAggregate,
		PostingHiringState,
		PostingTrend
	} from '$lib/data/postings-monitor';
	import { cn } from '$lib/utils';
	import { pill } from '$lib/design-system';

	let {
		postings,
		label = 'Hiring now',
		contextLabel = null
	}: {
		postings: PostingAggregate;
		label?: string;
		contextLabel?: string | null;
	} = $props();

	function hiringTone(state: PostingHiringState): 'positive' | 'warning' | 'danger' | 'neutral' {
		if (state === 'active') return 'positive';
		if (state === 'moderate') return 'warning';
		if (state === 'thin' || state === 'stale') return 'danger';
		return 'neutral';
	}

	function hiringLabel(state: PostingHiringState): string {
		switch (state) {
			case 'active':
				return 'Active';
			case 'moderate':
				return 'Moderate';
			case 'thin':
				return 'Thin';
			case 'stale':
				return 'Stale';
			default:
				return 'No signal';
		}
	}

	function trendLabel(trend: PostingTrend): string {
		switch (trend) {
			case 'rising':
				return '↑ rising';
			case 'cooling':
				return '↓ cooling';
			case 'steady':
				return '→ steady';
			default:
				return 'Not enough history';
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-start justify-between gap-3">
		<div>
			<p class="text-xs font-semibold text-foreground">{label}</p>
			<p class="text-[11px] text-muted-foreground">
				{contextLabel ?? 'Live postings monitor'}{#if postings.latest_posted_date}
					· latest {new Date(postings.latest_posted_date).toLocaleDateString('en-SG', {
						day: 'numeric',
						month: 'short',
						year: 'numeric'
					})}
				{/if}
			</p>
		</div>
		<span class={pill({ size: 'sm', tone: hiringTone(postings.hiring_state) })}>
			{hiringLabel(postings.hiring_state)}
		</span>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
				Volume
			</p>
			<p class="mt-1.5 font-mono text-base text-foreground">{postings.posting_volume_30d}</p>
			<p class="mt-0.5 text-[11px] text-muted-foreground">last 30 days</p>
		</div>
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
				Trend
			</p>
			<p
				class={cn(
					'mt-1.5 text-sm font-medium',
					postings.trend_90d === 'rising'
						? 'text-risk-very-low'
						: postings.trend_90d === 'cooling'
							? 'text-risk-high'
							: 'text-foreground'
				)}
			>
				{trendLabel(postings.trend_90d)}
			</p>
			<p class="mt-0.5 text-[11px] text-muted-foreground">vs prior 60 days</p>
		</div>
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
				Salary
			</p>
			{#if postings.median_salary_hint}
				<p class="mt-1.5 font-mono text-base text-foreground">
					SGD {Math.round(postings.median_salary_hint).toLocaleString()}
				</p>
				<p class="mt-0.5 text-[11px] text-muted-foreground">median visible salary</p>
			{:else}
				<p class="mt-1.5 text-sm text-muted-foreground">Sparse</p>
				<p class="mt-0.5 text-[11px] text-muted-foreground">salary rarely disclosed</p>
			{/if}
		</div>
	</div>

	{#if postings.top_skills.length > 0 || postings.top_tools.length > 0}
		<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
			{#if postings.top_skills.length > 0}
				<span class="font-medium text-text-secondary">Top skills:</span>
				{#each postings.top_skills.slice(0, 3) as skill}
					<span>{skill.label}</span>
				{/each}
			{/if}
			{#if postings.top_tools.length > 0}
				<span class="font-medium text-text-secondary">AI/tools:</span>
				{#each postings.top_tools.slice(0, 3) as tool}
					<span>{tool.label}</span>
				{/each}
			{/if}
		</div>
	{/if}
</div>
