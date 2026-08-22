<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { SITE } from '$lib/data/scoring-constants';

	interface Crumb {
		label: string;
		href?: string;
	}

	let { items }: { items: Crumb[] } = $props();
	let breadcrumbJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: items.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.label,
				item: `${SITE.url}${item.href ?? page.url.pathname}`
			}))
		})
	);
</script>

<svelte:head>
	<svelte:element this={'script'} type="application/ld+json">
		{breadcrumbJsonLd}
	</svelte:element>
</svelte:head>

<Breadcrumb.Root class="mb-4">
	<Breadcrumb.List>
		{#each items as crumb, i}
			<Breadcrumb.Item>
				{#if crumb.href}
					<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
				{:else}
					<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
				{/if}
			</Breadcrumb.Item>
			{#if i < items.length - 1}
				<Breadcrumb.Separator />
			{/if}
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
