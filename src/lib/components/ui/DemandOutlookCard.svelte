<script lang="ts">
	import { card, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface Props {
		current?: number | null;
		projected?: number | null;
		changePct?: number | null;
		openings?: number | null;
		education?: string | null;
		experience?: string | null;
		training?: string | null;
		medianWage?: number | null;
		currency?: string;
		outlook?: string | null;
		relatedContent?: string | null;
		class?: string;
	}

	let {
		current = null,
		projected = null,
		changePct = null,
		openings = null,
		education = null,
		experience = null,
		training = null,
		medianWage = null,
		currency = 'USD',
		outlook = null,
		relatedContent = null,
		class: className
	}: Props = $props();

	const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

	const formatK = (value: number | null, digits = 1) =>
		value == null ? '\u2014' : `${value.toFixed(digits)}K`;

	const formatCurrency = (value: number | null) =>
		value == null ? '\u2014' : `${currency} ${fmt.format(value)}`;
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Demand outlook</p>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		<div>
			<p class={microLabel()}>Current employment</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{formatK(current)}
			</p>
		</div>
		<div>
			<p class={microLabel()}>Projected employment</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{formatK(projected)}
			</p>
		</div>
	</div>

	<div class="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
		{#if openings != null}
			<p>Openings: {formatK(openings)}</p>
		{/if}
		{#if changePct != null}
			<p>Projected change: {changePct.toFixed(1)}%</p>
		{/if}
		{#if education != null}
			<p>Education: {education}</p>
		{/if}
		{#if experience != null}
			<p>Work experience: {experience}</p>
		{/if}
		{#if training != null}
			<p>On-the-job training: {training}</p>
		{/if}
		{#if medianWage != null}
			<p>Median wage: {formatCurrency(medianWage)}</p>
		{/if}
	</div>

	{#if outlook != null}
		<p class="mt-4 text-sm text-muted-foreground">{outlook}</p>
	{/if}
	{#if relatedContent != null}
		<p class="mt-2 text-xs text-muted-foreground">{relatedContent}</p>
	{/if}
</div>
