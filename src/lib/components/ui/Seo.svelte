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

	const TITLE_LIMIT = 70;
	const DESCRIPTION_LIMIT = 165;

	function normalizeWhitespace(value: string): string {
		return value.replace(/\s+/g, ' ').trim();
	}

	function truncateAtWord(value: string, maxLength: number): string {
		const normalized = normalizeWhitespace(value);
		if (normalized.length <= maxLength) return normalized;
		const slice = normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd();
		const lastSpace = slice.lastIndexOf(' ');
		const trimmed = lastSpace > maxLength * 0.55 ? slice.slice(0, lastSpace) : slice;
		return `${trimmed.replace(/[,:;|-]+$/g, '').trimEnd()}...`;
	}

	function compactTitleSegment(value: string, maxLength: number): string {
		return truncateAtWord(value, maxLength);
	}

	function buildFullTitle(value: string): string {
		const normalized = normalizeWhitespace(value);
		if (normalized.includes(SITE.name)) return truncateAtWord(normalized, TITLE_LIMIT);
		const suffix = ` | ${SITE.name}`;
		return `${compactTitleSegment(normalized, TITLE_LIMIT - suffix.length)}${suffix}`;
	}

	function jsonLdPayload(value: string): string {
		const match = value.match(
			/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/i
		);
		return (match?.[2] ?? value).trim();
	}

	let fullTitle = $derived(buildFullTitle(title));
	let metaDescription = $derived(truncateAtWord(description, DESCRIPTION_LIMIT));
	let fullUrl = $derived(absoluteUrl(path));
	let fullOgImage = $derived(absoluteUrl(ogImage ?? '/og/default.png'));
	let canonicalUrl = $derived(canonical ? absoluteUrl(canonical) : fullUrl);
	let jsonLdPayloads = $derived(jsonLd.map(jsonLdPayload));
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<link rel="canonical" href={canonicalUrl} />
	<meta name="description" content={metaDescription} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={fullOgImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:type" content={type} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={fullOgImage} />
	{#each alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
	{#if !noindex}
		{#each jsonLdPayloads as ld (ld)}
			<svelte:element this={'script'} type="application/ld+json">
				{ld}
			</svelte:element>
		{/each}
	{/if}
</svelte:head>
