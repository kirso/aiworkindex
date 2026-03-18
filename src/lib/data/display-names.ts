/**
 * Display name shortening for occupation titles.
 *
 * Official SSOC titles are long: "Financial analyst (e.g. equities analyst, credit analyst)"
 * For UI cards, badges, and compact lists, we shorten to: "Financial Analyst"
 *
 * Rules:
 * 1. Remove parenthetical qualifiers: (e.g. ...), (including ...), (excluding ...)
 * 2. For slash-separated titles, take the first part: "A/B/C" → "A"
 * 3. Cap at maxLength characters
 *
 * The full title is preserved for:
 * - Search matching (HeroSearch, CommandMenu)
 * - Detail page headings
 * - JSON-LD schema
 * - Data exports
 */
export function shortTitle(title: string, maxLength: number = 40): string {
	let short = title
		// Remove parenthetical qualifiers
		.replace(/\s*\(e\.g\..*?\)/gi, '')
		.replace(/\s*\(including.*?\)/gi, '')
		.replace(/\s*\(excluding.*?\)/gi, '')
		.replace(/\s*\(except.*?\)/gi, '')
		// For slash-separated, take the first meaningful part
		// But keep short ones like "Plant & Machine Operators"
		.replace(/\/(?:Chief|General|Technical|Vocational|Commercial|Shipping|Post).*$/i, '')
		.trim();

	// If still too long, truncate at last word boundary
	if (short.length > maxLength) {
		short = short.substring(0, maxLength).replace(/\s+\S*$/, '') + '…';
	}

	return short;
}
