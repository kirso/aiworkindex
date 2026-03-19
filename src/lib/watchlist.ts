export const WATCHLIST_KEY = 'aiworkindex-watchlist';
export const WATCHLIST_TIMESTAMP_KEY = 'aiworkindex-watchlist-saved-at';

export type WatchlistEntry = {
	kind: 'occupation' | 'role';
	id: string;
};

function normalizeEntry(value: string | WatchlistEntry): WatchlistEntry | null {
	if (typeof value !== 'string') {
		return value.kind === 'occupation' || value.kind === 'role' ? value : null;
	}

	if (value.includes(':')) {
		const [kind, id] = value.split(':');
		if ((kind === 'occupation' || kind === 'role') && id) {
			return { kind, id };
		}
	}

	if (value.trim()) {
		return { kind: 'occupation', id: value.trim() };
	}

	return null;
}

export function parseStoredWatchlist(raw: string | null): WatchlistEntry[] {
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw) as Array<string | WatchlistEntry>;
		const entries: WatchlistEntry[] = [];
		const seen = new Set<string>();

		for (const item of parsed) {
			const normalized = normalizeEntry(item);
			if (!normalized) continue;
			const key = `${normalized.kind}:${normalized.id}`;
			if (seen.has(key)) continue;
			seen.add(key);
			entries.push(normalized);
		}

		return entries;
	} catch {
		return [];
	}
}

export function serializeWatchlist(entries: WatchlistEntry[]): string {
	return JSON.stringify(entries.map(entry => `${entry.kind}:${entry.id}`));
}

export function hasWatchlistEntry(entries: WatchlistEntry[], target: WatchlistEntry): boolean {
	return entries.some(entry => entry.kind === target.kind && entry.id === target.id);
}

export function toggleWatchlistEntry(
	entries: WatchlistEntry[],
	target: WatchlistEntry
): WatchlistEntry[] {
	if (hasWatchlistEntry(entries, target)) {
		return entries.filter(entry => !(entry.kind === target.kind && entry.id === target.id));
	}

	return [...entries, target];
}
