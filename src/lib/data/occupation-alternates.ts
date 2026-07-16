import { SITE } from './scoring-constants';
import { occupations } from './index';
import { usOccupations } from './countries/us/occupations';

export interface SeoAlternateLink {
	hreflang: string;
	href: string;
}

function absolute(path: string): string {
	return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

function uniqueByHref(alternates: SeoAlternateLink[]): SeoAlternateLink[] {
	const seen = new Set<string>();
	const unique: SeoAlternateLink[] = [];
	for (const alternate of alternates) {
		const key = `${alternate.hreflang}:${alternate.href}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(alternate);
	}
	return unique;
}

export function findSingaporeEquivalent(canonicalCode: string | null): string | null {
	if (!canonicalCode) return null;
	const occupation = occupations.find(row => row.isco_codes_matched?.includes(canonicalCode));
	return occupation?.ssoc ?? null;
}

export function findUnitedStatesEquivalent(canonicalCode: string | null): string | null {
	if (!canonicalCode) return null;
	const occupation = usOccupations.find(row => row.canonicalCode === canonicalCode);
	return occupation?.localCode ?? null;
}

export function buildSingaporeOccupationAlternates(
	_localCode: string,
	_canonicalCode: string | null
): SeoAlternateLink[] {
	return [];
}

export function buildUnitedStatesOccupationAlternates(
	_localCode: string,
	_canonicalCode: string | null
): SeoAlternateLink[] {
	return [];
}

export function buildGlobalOccupationAlternates(canonicalCode: string): SeoAlternateLink[] {
	return [{ hreflang: 'x-default', href: absolute(`/global/occupation/${canonicalCode}`) }];
}

export function buildRoleAlternates(slug: string): SeoAlternateLink[] {
	void slug;
	return [];
}

export function buildUnitedStatesRoleAlternates(slug: string): SeoAlternateLink[] {
	return uniqueByHref([
		{ hreflang: 'en-US', href: absolute(`/us/role/${slug}`) },
		{ hreflang: 'x-default', href: absolute(`/role/${slug}`) }
	]);
}
