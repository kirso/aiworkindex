import registryData from '../../../data/ssoc-2024-registry.json';

export type Ssoc2024EntryKind = 'occupation' | 'residual';
export type Ssoc2024MappingQuality = 'one_to_one' | 'one_to_many' | 'partial' | 'unmatched';

export interface Ssoc2024HierarchyEntry {
	code: string;
	title: string;
}

export interface Ssoc2024IscoCandidate {
	code: string;
	title: string;
	part: string | null;
}

export interface Ssoc2024RegistryEntry {
	code: string;
	title: string;
	entry_kind: Ssoc2024EntryKind;
	hierarchy: {
		major_group: Ssoc2024HierarchyEntry;
		sub_major_group: Ssoc2024HierarchyEntry | null;
		minor_group: Ssoc2024HierarchyEntry | null;
		unit_group: Ssoc2024HierarchyEntry | null;
	};
	groups_classified_under_code: string[];
	detailed_definition: string | null;
	tasks: string[];
	notes: string | null;
	examples_included: string[];
	examples_excluded: string[];
	search_synonyms: string[];
	isco08: {
		quality: Ssoc2024MappingQuality;
		candidates: Ssoc2024IscoCandidate[];
	};
	page_eligible: boolean;
}

const data = registryData as {
	counts: { total: number; occupations: number; residual: number };
	entries: Ssoc2024RegistryEntry[];
};

export const ssoc2024Counts = data.counts;
export const ssoc2024Registry = data.entries;
export const ssoc2024Occupations = ssoc2024Registry.filter(
	entry => entry.entry_kind === 'occupation'
);
export const ssoc2024ByCode = new Map(ssoc2024Registry.map(entry => [entry.code, entry]));
