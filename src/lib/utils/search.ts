import type { Occupation } from '$lib/data';
import type { SyntheticRole } from '$lib/data/synthetic-roles';
import { syntheticRoles } from '$lib/data/synthetic-roles';
import { findAliasMatches } from '$lib/data/aliases';

/**
 * Word-boundary matching for short queries, substring for longer ones.
 * Short queries (< 4 chars) match word starts to avoid e.g. "cto" matching "director".
 */
export function titleMatches(title: string, query: string): boolean {
	const t = title.toLowerCase();
	if (query.length >= 4) return t.includes(query);
	const words = t.split(/[\s/(),]+/);
	return words.some(w => w.startsWith(query));
}

export interface SearchResults {
	roles: SyntheticRole[];
	occupations: Occupation[];
}

/**
 * Search occupations and synthetic roles by query string.
 * Returns grouped results: matching roles (max 5) and occupations (max 8).
 * Alias matches rank above direct title matches for occupations.
 */
export function searchOccupationsAndRoles(
	query: string,
	occupations: Occupation[],
	maxRoles = 5,
	maxOccupations = 8
): SearchResults {
	const q = query.trim().toLowerCase();
	if (!q || q.length < 2) return { roles: [], occupations: [] };

	// Synthetic role matches
	const roles = syntheticRoles.filter(r => titleMatches(r.title, q)).slice(0, maxRoles);

	// Alias matches first (highest relevance)
	const aliasHits = findAliasMatches(q);
	const aliasSsocs = new Set(aliasHits.flatMap(m => m.ssocs));
	const aliasOccs = aliasSsocs.size > 0 ? occupations.filter(o => aliasSsocs.has(o.ssoc)) : [];

	// Direct title matches (excluding already-found alias matches)
	const aliasSet = new Set(aliasOccs.map(o => o.ssoc));
	const titleOccs = occupations.filter(o => !aliasSet.has(o.ssoc) && titleMatches(o.title, q));

	// Alias results first, then title matches
	const occMatches = [...aliasOccs, ...titleOccs].slice(0, maxOccupations);

	return { roles, occupations: occMatches };
}
