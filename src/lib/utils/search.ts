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

/** Levenshtein edit distance (Wagner–Fischer), capped early once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
	const la = a.length;
	const lb = b.length;
	if (Math.abs(la - lb) > max) return max + 1;
	let prev = new Array(lb + 1);
	let curr = new Array(lb + 1);
	for (let j = 0; j <= lb; j++) prev[j] = j;
	for (let i = 1; i <= la; i++) {
		curr[0] = i;
		let rowMin = curr[0];
		for (let j = 1; j <= lb; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
			if (curr[j] < rowMin) rowMin = curr[j];
		}
		if (rowMin > max) return max + 1;
		[prev, curr] = [curr, prev];
	}
	return prev[lb];
}

/**
 * Typo-tolerant match used only as a fallback when exact matching finds little.
 * Compares the query against each word in the title (and the whole title for short
 * titles) within an edit-distance budget that scales with query length.
 * e.g. "accuntant" → "Accountant", "devloper" → "Software developer".
 */
export function fuzzyTitleMatches(title: string, query: string): boolean {
	if (query.length < 4) return false;
	const budget = query.length <= 6 ? 1 : 2;
	const words = title.toLowerCase().split(/[\s/(),]+/);
	for (const word of words) {
		if (word.length < 3) continue;
		if (editDistance(word, query, budget) <= budget) return true;
	}
	return false;
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
	let roles = syntheticRoles.filter(r => titleMatches(r.title, q)).slice(0, maxRoles);

	// Alias matches first (highest relevance)
	const aliasHits = findAliasMatches(q);
	const aliasSsocs = new Set(aliasHits.flatMap(m => m.ssocs));
	const aliasOccs = aliasSsocs.size > 0 ? occupations.filter(o => aliasSsocs.has(o.ssoc)) : [];

	// Direct title matches (excluding already-found alias matches)
	const aliasSet = new Set(aliasOccs.map(o => o.ssoc));
	const titleOccs = occupations.filter(o => !aliasSet.has(o.ssoc) && titleMatches(o.title, q));

	// Alias results first, then title matches
	let occMatches = [...aliasOccs, ...titleOccs].slice(0, maxOccupations);

	// Typo-tolerant fallback: only fill remaining slots when exact matching is sparse,
	// so a misspelling like "accuntant" still finds "Accountant" without polluting good matches.
	if (occMatches.length < maxOccupations) {
		const seen = new Set(occMatches.map(o => o.ssoc));
		const fuzzyOccs = occupations.filter(o => !seen.has(o.ssoc) && fuzzyTitleMatches(o.title, q));
		occMatches = [...occMatches, ...fuzzyOccs].slice(0, maxOccupations);
	}
	if (roles.length < maxRoles) {
		const seenRoles = new Set(roles.map(r => r.slug));
		const fuzzyRoles = syntheticRoles.filter(
			r => !seenRoles.has(r.slug) && fuzzyTitleMatches(r.title, q)
		);
		roles = [...roles, ...fuzzyRoles].slice(0, maxRoles);
	}

	return { roles, occupations: occMatches };
}
