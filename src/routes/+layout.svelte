<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CommandMenu from '$lib/components/ui/CommandMenu.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { GA_MEASUREMENT_ID } from '$lib/analytics';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';

	let { children } = $props();

	// Track SvelteKit client-side navigations as page views
	afterNavigate(() => {
		if (!browser || !window.gtag) return;
		window.gtag('config', GA_MEASUREMENT_ID, {
			page_path: window.location.pathname,
			page_title: document.title
		});
	});

	const navLinks = [
		{ href: '/', label: 'Find' },
		{ href: '/roles', label: 'Jobs' },
		{ href: '/rankings', label: 'Rankings' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/calculator', label: 'Calculator' },
		{ href: '/reports', label: 'Reports' },
		{ href: '/methodology', label: 'Methodology' }
	];

	const secondaryLinks = [
		{ href: '/data', label: 'Data' },
		{ href: '/changelog', label: 'Changelog' },
		{ href: '/research', label: 'Research' },
		{ href: '/about', label: 'About' },
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
		description: `How will AI affect jobs in Singapore? ${DATA_VINTAGE.occupation_count} occupations scored for structural AI pressure using official data and published research.`,
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
	<!-- Skip navigation for keyboard/screen-reader users -->
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
	>
		Skip to content
	</a>

	<!-- Header: Signal — clean white bar, minimal chrome -->
	<header
		class="sticky top-0 z-50 border-b border-border/40 bg-header-bg/75 backdrop-blur-lg backdrop-saturate-[1.15]"
	>
		<div class="mx-auto max-w-screen-2xl px-5 sm:px-6 flex items-center justify-between h-12">
			<a
				href="/"
				class="flex items-center gap-2 text-header-text transition-colors hover:text-primary"
			>
				<svg class="h-5 w-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
					<rect width="32" height="32" rx="6" class="fill-primary" />
					<rect x="8" y="9" width="14" height="4" rx="2" fill="white" opacity="0.9" />
					<rect
						x="8"
						y="15"
						width="10"
						height="4"
						rx="2"
						class="fill-risk-moderate"
						opacity="0.85"
					/>
					<rect
						x="8"
						y="21"
						width="6"
						height="4"
						rx="2"
						class="fill-risk-very-low"
						opacity="0.85"
					/>
				</svg>
				<span class="text-sm font-bold tracking-tight">{SITE.name}</span>
			</a>

			<!-- Desktop nav -->
			<div class="hidden items-center gap-1 sm:flex">
				<nav class="flex items-center">
					{#each navLinks as link (link.href)}
						<a
							href={link.href}
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-100
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

	<main id="main-content" class="flex-1">
		{#key currentPath}
			<div in:fade={{ duration }}>
				{@render children()}
			</div>
		{/key}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="mx-auto max-w-screen-2xl px-5 sm:px-6 py-5">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p class="text-xs text-muted-foreground">
						Structural AI exposure scores, not employment predictions.
						<a href="/methodology" class="text-primary hover:underline">Methodology</a>
					</p>
					<p class="mt-1 text-xs text-text-tertiary">
						{siteStatus.structural_release.version} structural score · {DATA_VINTAGE.wages} wages · {siteStatus
							.live_monitor.labour_monitor_artifact_vintage}
						live monitor · {DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count} roles
					</p>
					<p class="mt-1 text-xs text-text-tertiary">
						Latest official labour release: {siteStatus.live_monitor.latest_official_labour_report
							.label}
						({siteStatus.live_monitor.latest_official_labour_report.published_at})
					</p>
					<div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
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
						<span class="text-text-ghost">·</span>
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
						<a href="/changelog" class="hover:text-foreground">Changelog</a>
						<a href="/research" class="hover:text-foreground">Research</a>
						<a href="/reports" class="hover:text-foreground">Reports</a>
						<a href="/about" class="hover:text-foreground">About</a>
						<a
							href={SITE.github}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-foreground">GitHub</a
						>
					</div>
					<span class="text-xs text-text-ghost"
						>MIT Licensed · Open Source · Structural release {siteStatus.structural_release.version} ·
						Updated {DATA_VINTAGE.last_updated}</span
					>
				</div>
			</div>
		</div>
	</footer>
	<Toaster />
</div>
