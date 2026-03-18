<script lang="ts">
	import { SITE } from '$lib/data/scoring-constants';

	interface Props {
		title: string;
		description: string;
		path: string;
		ogImage?: string;
		type?: 'website' | 'article';
		jsonLd?: string[];
		noindex?: boolean;
	}

	let {
		title,
		description,
		path,
		ogImage,
		type = 'website',
		jsonLd = [],
		noindex = false
	}: Props = $props();

	let fullTitle = $derived(title.includes(SITE.name) ? title : `${title} | ${SITE.name}`);
	let fullUrl = $derived(`${SITE.url}${path}`);
	let fullOgImage = $derived(`${SITE.url}${ogImage ?? '/og/default.png'}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={fullUrl} />
	<meta property="og:image" content={fullOgImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:type" content={type} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={fullOgImage} />
	{#if noindex}<meta name="robots" content="noindex, nofollow" />{/if}
	{#each jsonLd as ld}
		{@html ld}
	{/each}
</svelte:head>
