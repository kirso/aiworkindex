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

function findUnitedStatesEquivalent(canonicalCode: string | null): string | null {
	if (!canonicalCode) return null;
	const occupation = usOccupations.find(row => row.canonicalCode === canonicalCode);
	return occupation?.localCode ?? null;
}

export function buildSingaporeOccupationAlternates(
	localCode: string,
	canonicalCode: string | null
): SeoAlternateLink[] {
	const alternates: SeoAlternateLink[] = [
		{ hreflang: 'en-SG', href: absolute(`/occupation/${localCode}`) }
	];

	if (canonicalCode) {
		alternates.push({
			hreflang: 'x-default',
			href: absolute(`/global/occupation/${canonicalCode}`)
		});
		const usCode = findUnitedStatesEquivalent(canonicalCode);
		if (usCode) {
			alternates.push({ hreflang: 'en-US', href: absolute(`/us/occupation/${usCode}`) });
		}
	}

	return uniqueByHref(alternates);
}

export function buildUnitedStatesOccupationAlternates(
	localCode: string,
	canonicalCode: string | null
): SeoAlternateLink[] {
	const alternates: SeoAlternateLink[] = [
		{ hreflang: 'en-US', href: absolute(`/us/occupation/${localCode}`) }
	];

	if (canonicalCode) {
		alternates.push({
			hreflang: 'x-default',
			href: absolute(`/global/occupation/${canonicalCode}`)
		});
		const sgCode = findSingaporeEquivalent(canonicalCode);
		if (sgCode) {
			alternates.push({ hreflang: 'en-SG', href: absolute(`/occupation/${sgCode}`) });
		}
	}

	return uniqueByHref(alternates);
}

export function buildGlobalOccupationAlternates(canonicalCode: string): SeoAlternateLink[] {
	const alternates: SeoAlternateLink[] = [
		{ hreflang: 'x-default', href: absolute(`/global/occupation/${canonicalCode}`) }
	];

	const sgCode = findSingaporeEquivalent(canonicalCode);
	if (sgCode) {
		alternates.push({ hreflang: 'en-SG', href: absolute(`/occupation/${sgCode}`) });
	}

	const usCode = findUnitedStatesEquivalent(canonicalCode);
	if (usCode) {
		alternates.push({ hreflang: 'en-US', href: absolute(`/us/occupation/${usCode}`) });
	}

	return uniqueByHref(alternates);
}
