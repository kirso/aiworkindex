<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { pageContainer } from '$lib/design-system';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CommandMenu from '$lib/components/ui/CommandMenu.svelte';

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Explore' },
		{ href: '/rankings', label: 'Rankings' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/methodology', label: 'Methodology' },
		{ href: '/about', label: 'About' }
	];

	const secondaryLinks = [
		{ href: '/reports', label: 'Reports' },
		{ href: '/data', label: 'Data' },
		{ href: '/watchlist', label: 'Watchlist' }
	];

	let currentPath = $derived($page.url.pathname);
	let duration = $derived(prefersReducedMotion.current ? 0 : 150);
	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		return $page.url.pathname === href || (href !== '/' && $page.url.pathname.startsWith(href));
	}

	$effect(() => {
		currentPath;
		mobileMenuOpen = false;
	});

	const layoutJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE.name,
		url: SITE.url,
		description:
			'How will AI affect jobs in Singapore? 562 occupations scored for structural AI pressure using official data and published research.',
		publisher: {
			'@type': 'Organization',
			name: SITE.name,
			url: SITE.url,
			areaServed: { '@type': 'Country', name: 'Singapore' },
			description: 'Open-source AI job impact scoring for Singapore occupations'
		},
		potentialAction: {
			'@type': 'SearchAction',
			target: `${SITE.url}/?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		},
		inLanguage: 'en',
		dateModified: DATA_VINTAGE.last_updated
	})}<\/script>`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href="{SITE.url}{currentPath}" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="robots" content="index, follow" />
	<meta name="author" content="Kirill So" />
	<meta name="geo.region" content="SG" />
	<meta name="geo.placename" content="Singapore" />
	{@html layoutJsonLd}
</svelte:head>

<div class="flex min-h-screen flex-col bg-background">
	<!-- Header: Signal — clean white bar, minimal chrome -->
	<header class="sticky top-0 z-50 border-b border-border bg-header-bg/80 backdrop-blur-sm">
		<div class="{pageContainer()} flex items-center justify-between h-12">
			<a
				href="/"
				class="flex items-center gap-2 text-header-text transition-colors hover:text-primary"
			>
				<svg
					class="h-4.5 w-4.5 text-primary"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
				<span class="text-sm font-bold tracking-tight">{SITE.name}</span>
			</a>

			<!-- Desktop nav -->
			<div class="hidden items-center gap-1 sm:flex">
				<nav class="flex items-center">
					{#each navLinks as link (link.href)}
						<a
							href={link.href}
							class="rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors duration-100
								{isActive(link.href)
								? 'bg-header-active-bg text-foreground'
								: 'text-header-muted hover:text-foreground'}"
						>
							{link.label}
						</a>
					{/each}
				</nav>
				<CommandMenu />
			</div>

			<!-- Mobile menu -->
			<div class="flex items-center gap-1 sm:hidden">
				<Sheet.Root bind:open={mobileMenuOpen}>
					<Sheet.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-header-muted hover:text-foreground"
							>
								<svg
									class="h-4.5 w-4.5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line
										x1="3"
										y1="18"
										x2="21"
										y2="18"
									/>
								</svg>
								<span class="sr-only">Open menu</span>
							</Button>
						{/snippet}
					</Sheet.Trigger>
					<Sheet.Content side="right" class="w-64 bg-card border-border">
						<Sheet.Header class="text-left">
							<Sheet.Title class="text-sm font-bold text-foreground">Navigation</Sheet.Title>
						</Sheet.Header>
						<nav class="mt-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
							{#each navLinks as link (link.href)}
								<a
									href={link.href}
									class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100
										{isActive(link.href)
										? 'bg-accent text-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
								>
									{link.label}
								</a>
							{/each}
						</nav>
						<Separator class="my-2" />
						<nav class="flex flex-col gap-0.5">
							{#each secondaryLinks as link (link.href)}
								<a
									href={link.href}
									class="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-100"
								>
									{link.label}
								</a>
							{/each}
						</nav>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</div>
	</header>

	<div class="flex-1">
		{#key currentPath}
			<div in:fade={{ duration }}>
				{@render children()}
			</div>
		{/key}
	</div>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="{pageContainer()} py-5">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p class="text-xs text-muted-foreground">
						Structural AI exposure scores, not employment predictions.
						<a href="/methodology" class="text-primary hover:underline">Methodology</a>
					</p>
					<p class="mt-1 text-xs text-muted-foreground/60">
						{DATA_VINTAGE.model_version} · {DATA_VINTAGE.wages} wages · {DATA_VINTAGE.labour_monitor}
						labour data · {DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count} roles
					</p>
					<div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground/50">
						<span
							>Made by
							<a
								href="https://www.kirillso.com"
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-muted-foreground hover:text-foreground">Kirill So</a
							>
						</span>
						<a
							href="https://www.linkedin.com/in/kirso/"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-muted-foreground hover:text-foreground"
							aria-label="Kirill So on LinkedIn"
						>
							<svg class="inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"
								><path
									d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"
								/></svg
							>
						</a>
						<a
							href="https://x.com/kirso_"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-muted-foreground hover:text-foreground"
							aria-label="Kirill So on X"
						>
							<svg class="inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"
								><path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
								/></svg
							>
						</a>
						<span class="text-muted-foreground/30">·</span>
						<span
							>Built with
							<a
								href="https://www.anthropic.com"
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-muted-foreground hover:text-foreground">Claude</a
							>
							&
							<a
								href="https://openai.com"
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-muted-foreground hover:text-foreground">GPT</a
							>
						</span>
					</div>
				</div>
				<div class="flex flex-col items-end gap-1.5">
					<div class="flex items-center gap-3 text-xs text-muted-foreground">
						<a href="/calculator" class="hover:text-foreground">Calculator</a>
						<a href="/data" class="hover:text-foreground">Data</a>
						<a href="/reports" class="hover:text-foreground">Reports</a>
						<a href="/about" class="hover:text-foreground">About</a>
						<a
							href={SITE.github}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-foreground">GitHub</a
						>
					</div>
					<span class="text-[10px] text-muted-foreground/30"
						>MIT Licensed · Open Source · Updated {DATA_VINTAGE.last_updated}</span
					>
				</div>
			</div>
		</div>
	</footer>
</div>
