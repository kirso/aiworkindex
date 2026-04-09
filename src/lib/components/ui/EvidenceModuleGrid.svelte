<script lang="ts">
	import { card } from '$lib/design-system';
	import { buildCountryModuleStatuses, type CountryModuleStatus } from '$lib/data/country-modules';
	import type { CountryConfig } from '$lib/data/country-config';
	import { cn } from '$lib/utils';

	interface Props {
		country: CountryConfig;
		class?: string;
		showUnavailable?: boolean;
	}

	let { country, class: className = '', showUnavailable = true }: Props = $props();

	const moduleStates = $derived(buildCountryModuleStatuses(country));

	function badgeLabel(module: CountryModuleStatus) {
		return module.available ? 'Published' : 'Hidden';
	}
</script>

<div class={cn('grid gap-3 md:grid-cols-2', className)}>
	{#each moduleStates as module (module.key)}
		{#if showUnavailable || module.available}
			<div
				class={card({
					padding: 'sm',
					variant: module.available ? 'default' : 'notice',
					accent: module.available ? 'primary' : 'moderate'
				})}
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-foreground">{module.title}</p>
						<p class="mt-1 text-sm text-muted-foreground">
							{module.available ? module.publishedDescription : module.unavailableDescription}
						</p>
					</div>
					<span
						class="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
					>
						{badgeLabel(module)}
					</span>
				</div>
			</div>
		{/if}
	{/each}
</div>
