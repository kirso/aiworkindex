<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CommandMenu from '$lib/components/ui/CommandMenu.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { GA_MEASUREMENT_ID } from '$lib/analytics';
	import { afterNavigate } from '$app/navigation';
	import { countryConfigs } from '$lib/data/country-config';

	let { children } = $props();

	// Close mobile menu + track page view on every client-side navigation
	afterNavigate(() => {
		mobileMenuOpen = false;
		if (!window.gtag) return;
		window.gtag('config', GA_MEASUREMENT_ID, {
			page_path: window.location.pathname,
			page_title: document.title
		});
	});

	const navLinks = [
		{ href: '/', label: 'Find' },
		{ href: '/explore', label: 'Browse' },
		{ href: '/rankings', label: 'Rankings' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/calculator', label: 'Calculator' },
		{ href: '/methodology', label: 'Methodology' }
	];

	const secondaryLinks = [
		{ href: '/roles', label: 'Roles' },
		{ href: '/reports', label: 'Reports' },
		{ href: '/research', label: 'Research' },
		{ href: '/data', label: 'Data' },
		{ href: '/about', label: 'About' },
		{ href: '/changelog', label: 'Changelog' },
		{ href: '/watchlist', label: 'Watchlist' }
	];

	const marketLinks = [
		{ href: '/sg', label: countryConfigs.sg.name },
		{ href: '/us', label: countryConfigs.us.name }
	];

	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		return page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
	}

	const layoutJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${SITE.url}/#website`,
		name: SITE.name,
		alternateName: SITE.shortName,
		url: `${SITE.url}/`,
		description: `${DATA_VINTAGE.occupation_count} occupations scored for AI displacement risk using official data and published research.`,
		publisher: {
			'@type': 'Organization',
			'@id': `${SITE.url}/#organization`,
			name: SITE.name,
			url: `${SITE.url}/`,
			description: 'Open-source AI displacement risk scoring for occupations and modern roles',
			foundingDate: '2024',
			knowsAbout: [
				'AI displacement risk',
				'occupational exposure to artificial intelligence',
				'labor economics',
				'workforce automation',
				'career transition planning'
			],
			areaServed: [
				{ '@type': 'Country', name: 'Singapore' },
				{ '@type': 'Country', name: 'United States' }
			],
			sameAs: [SITE.github, SITE.authorUrl]
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
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="author" content="Kirill So" />
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
				<div
					class="ml-2 hidden items-center gap-1 rounded-full border border-header-active-bg bg-header-active-bg/20 p-0.5 lg:flex"
				>
					{#each marketLinks as market (market.href)}
						<a
							href={market.href}
							class="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-100
								{isActive(market.href)
								? 'bg-header-active-bg text-foreground'
								: 'text-header-muted hover:text-foreground'}"
						>
							{market.label}
						</a>
					{/each}
				</div>
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
						<div class="mt-3 rounded-md border border-border bg-muted/30 p-2">
							<p
								class="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>
								Markets
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each marketLinks as market (market.href)}
									<a
										href={market.href}
										class="rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors duration-100
											{isActive(market.href)
											? 'bg-accent text-foreground'
											: 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'}"
									>
										{market.label}
									</a>
								{/each}
							</div>
						</div>
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
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="mx-auto max-w-screen-2xl px-5 sm:px-6 py-4">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-xs text-muted-foreground">
					AI displacement risk scores, not predictions.
					<a href="/methodology" class="text-primary hover:underline">Methodology</a>
				</p>
				<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
					<a href="/rankings" class="hover:text-foreground">Rankings</a>
					<a href="/" class="hover:text-foreground">Find</a>
					<a href="/reports" class="hover:text-foreground">Reports</a>
					<a href="/research" class="hover:text-foreground">Research</a>
					<a href="/data" class="hover:text-foreground">Data</a>
					<a href="/about" class="hover:text-foreground">About</a>
					<a href="/changelog" class="hover:text-foreground">Changelog</a>
					<a
						href={SITE.github}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground">GitHub</a
					>
				</div>
			</div>
			<p class="mt-2 text-xs text-text-ghost">
				{siteStatus.structural_release.version} · {DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count}
				roles · MIT Licensed ·
				<a
					href={SITE.authorUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-muted-foreground">Kirill So</a
				>
			</p>
		</div>
	</footer>
	<Toaster />
</div>
