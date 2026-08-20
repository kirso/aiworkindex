<script lang="ts">
	import type { V9CategorySummary, V9GroupSummary } from '$lib/data/v9-home';

	interface Props {
		groups: V9GroupSummary[];
		categories: V9CategorySummary[];
		rankedTotal: number;
		unrankedTotal: number;
	}

	let { groups, categories, rankedTotal, unrankedTotal }: Props = $props();

	const categoryColors: Record<string, string> = {
		'Not Exposed': 'var(--color-pressure-0)',
		'Minimal Exposure': 'var(--color-pressure-20)',
		'Exposed: Gradient 1': 'var(--color-pressure-40)',
		'Exposed: Gradient 2': 'var(--color-pressure-60)',
		'Exposed: Gradient 3': 'var(--color-pressure-80)',
		'Exposed: Gradient 4': 'var(--color-pressure-100)'
	};

	const categoryShortLabels: Record<string, string> = {
		'Not Exposed': 'Not exposed',
		'Minimal Exposure': 'Minimal',
		'Exposed: Gradient 1': 'Gradient 1',
		'Exposed: Gradient 2': 'Gradient 2',
		'Exposed: Gradient 3': 'Gradient 3',
		'Exposed: Gradient 4': 'Gradient 4'
	};

	function width(count: number, total: number): number {
		return total === 0 ? 0 : (count / total) * 100;
	}
</script>

<figure class="border border-border bg-card" aria-labelledby="occupation-groups-title">
	<div class="border-b border-border px-4 py-5 sm:px-6">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h3 id="occupation-groups-title" class="font-heading text-xl font-bold text-foreground">
					How the official ILO categories appear across Singapore occupations
				</h3>
				<p class="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
					Each scored occupation is counted once using the most exposed official category among its
					mapped ISCO matches. These are occupation records, not worker counts.
				</p>
			</div>
			<p class="font-mono text-xs text-muted-foreground">
				{rankedTotal.toLocaleString()} ranked · {unrankedTotal} unranked
			</p>
		</div>

		<div
			class="mt-4 flex h-4 w-full overflow-hidden border border-border bg-muted"
			aria-label="Overall distribution by official ILO exposure category"
		>
			{#each categories as category (category.category)}
				<span
					style:width="{width(category.count, rankedTotal)}%"
					style:background-color={categoryColors[category.category]}
					title="{categoryShortLabels[category.category]}: {category.count} occupations"
				></span>
			{/each}
		</div>

		<ul class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
			{#each categories as category (category.category)}
				<li class="flex items-center gap-1.5">
					<span
						class="size-2.5 border border-border"
						style:background-color={categoryColors[category.category]}
						aria-hidden="true"
					></span>
					<span>{categoryShortLabels[category.category]}</span>
					<strong class="font-mono font-medium text-foreground">{category.count}</strong>
				</li>
			{/each}
		</ul>
	</div>

	<ul class="grid sm:grid-cols-2 xl:grid-cols-3">
		{#each groups as group (group.code)}
			<li
				class="border-b border-border sm:odd:border-r xl:border-r xl:[&:nth-child(3n)]:border-r-0"
			>
				<a
					href="/explore?group={group.code}"
					class="group block min-h-full px-4 py-5 no-underline transition-colors hover:bg-muted/70 focus-visible:bg-muted sm:px-5"
				>
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="font-mono text-xs text-muted-foreground">SSOC {group.code}</p>
							<h4 class="mt-1 font-heading text-base font-bold leading-snug text-foreground">
								{group.title}
							</h4>
						</div>
						<span class="font-mono text-lg font-semibold tabular-nums text-foreground">
							{group.total}
						</span>
					</div>

					<div class="mt-4 flex h-2.5 overflow-hidden border border-border bg-muted">
						{#each group.categories as category (category.category)}
							<span
								style:width="{width(category.count, group.ranked)}%"
								style:background-color={categoryColors[category.category]}
								title="{categoryShortLabels[category.category]}: {category.count}"
							></span>
						{/each}
					</div>

					<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
						<span>
							Median pressure
							<strong class="font-mono font-medium text-foreground">
								{group.medianPressure == null ? 'Unranked' : group.medianPressure.toFixed(1)}
							</strong>
						</span>
						<span>
							Pay rows <strong class="font-mono font-medium text-foreground"
								>{group.directWages}</strong
							>
						</span>
						<span>
							Named in sources <strong class="font-mono font-medium text-foreground"
								>{group.namedDemand}</strong
							>
						</span>
					</div>
					<p class="mt-3 text-xs font-semibold text-primary group-hover:underline">
						Explore this group →
					</p>
				</a>
			</li>
		{/each}
	</ul>
</figure>
