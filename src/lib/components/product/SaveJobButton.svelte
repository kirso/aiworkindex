<script lang="ts">
	import { browser } from '$app/environment';
	import { trackProductEvent } from '$lib/analytics';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		WATCHLIST_KEY,
		WATCHLIST_TIMESTAMP_KEY,
		hasWatchlistEntry,
		parseStoredWatchlist,
		serializeWatchlist,
		toggleWatchlistEntry,
		type WatchlistEntry
	} from '$lib/watchlist';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let {
		kind,
		id,
		size = 'sm',
		class: className
	}: {
		kind: WatchlistEntry['kind'];
		id: string;
		size?: 'default' | 'sm' | 'lg';
		class?: string;
	} = $props();

	let saved = $state(false);
	let target = $derived({ kind, id } as WatchlistEntry);

	function sync() {
		if (!browser) return;
		saved = hasWatchlistEntry(parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY)), target);
	}

	onMount(() => {
		sync();
		const handleChange = () => sync();
		window.addEventListener('storage', handleChange);
		window.addEventListener('aiworkindex:saved-jobs', handleChange);
		return () => {
			window.removeEventListener('storage', handleChange);
			window.removeEventListener('aiworkindex:saved-jobs', handleChange);
		};
	});

	function toggle() {
		if (!browser) return;
		const next = toggleWatchlistEntry(
			parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY)),
			target
		);

		if (next.length === 0) {
			localStorage.removeItem(WATCHLIST_KEY);
			localStorage.removeItem(WATCHLIST_TIMESTAMP_KEY);
		} else {
			localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(next));
			localStorage.setItem(WATCHLIST_TIMESTAMP_KEY, new Date().toISOString().slice(0, 10));
		}
		saved = hasWatchlistEntry(next, target);
		window.dispatchEvent(new Event('aiworkindex:saved-jobs'));
		trackProductEvent('job_saved', { entity_kind: kind, saved });
		toast(saved ? 'Saved to your jobs' : 'Removed from saved jobs');
	}
</script>

<Button
	variant={saved ? 'default' : 'outline'}
	{size}
	class={className}
	onclick={toggle}
	aria-pressed={saved}
>
	<svg
		class="size-4"
		viewBox="0 0 24 24"
		fill={saved ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
	</svg>
	{saved ? 'Saved' : 'Save job'}
</Button>
