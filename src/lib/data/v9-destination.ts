export type V9RoleJourneyKind =
	| 'exact_official_title'
	| 'reviewed_official_match'
	| 'composite_estimate'
	| 'mapping_withheld';

export interface V9RoleDestinationInput {
	slug: string;
	journey_kind: V9RoleJourneyKind;
	official_ssoc2024: string | null;
}

export function v9OccupationDestination(code: string, familiarTitleSlug?: string | null): string {
	const base = `/occupation/${encodeURIComponent(code)}`;
	return familiarTitleSlug ? `${base}?as=${encodeURIComponent(familiarTitleSlug)}` : base;
}

export function v9RoleDestination(role: V9RoleDestinationInput): string {
	if (
		role.official_ssoc2024 &&
		(role.journey_kind === 'exact_official_title' ||
			role.journey_kind === 'reviewed_official_match')
	) {
		return v9OccupationDestination(role.official_ssoc2024, role.slug);
	}
	return `/role/${encodeURIComponent(role.slug)}`;
}

export function v9DestinationEntityKind(
	role: Pick<V9RoleDestinationInput, 'journey_kind'>
): 'occupation' | 'role' {
	return role.journey_kind === 'exact_official_title' ||
		role.journey_kind === 'reviewed_official_match'
		? 'occupation'
		: 'role';
}
