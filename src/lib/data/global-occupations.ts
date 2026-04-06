import globalOccupationsData from './global-occupations.json';
import type { GlobalOccupationRecord } from './country-index';

export const globalOccupations = globalOccupationsData as GlobalOccupationRecord[];

export function getGlobalOccupationRow(code: string): GlobalOccupationRecord | null {
	return globalOccupations.find(row => row.canonicalCode === code) ?? null;
}

export function getGlobalOccupationEntries(): Array<{ code: string }> {
	return globalOccupations.map(row => ({ code: row.canonicalCode }));
}
