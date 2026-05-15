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
		alternates?: Array<{ hreflang: string; href: string }>;
		canonical?: string;
	}

	let {
		title,
		description,
		path,
		ogImage,
		type = 'website',
		jsonLd = [],
		noindex = false,
		alternates = [],
		canonical
	}: Props = $props();

	function absoluteUrl(urlOrPath: string): string {
		if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
		return `${SITE.url}${urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`}`;
	}

	let fullTitle = $derived(title.includes(SITE.name) ? title : `${title} | ${SITE.name}`);
	let fullUrl = $derived(absoluteUrl(path));
	let fullOgImage = $derived(absoluteUrl(ogImage ?? '/og/default.png'));
	let canonicalUrl = $derived(canonical ? absoluteUrl(canonical) : fullUrl);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<link rel="canonical" href={canonicalUrl} />
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
	{#each alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	{#if noindex}<meta name="robots" content="noindex, follow" />{/if}
	{#each jsonLd as ld (ld)}
		{@html ld}
	{/each}
</svelte:head>
