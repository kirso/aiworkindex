import type { CountryCode } from './country-config';
import type { CountryIndexMetadata, CountryOccupationRecord, GlobalOccupationRecord } from './country-index';

export interface LocalOccupationSource {
	code: string;
	title: string;
	weight?: number;
}

export interface CountryAdapter {
	countryCode: Exclude<CountryCode, 'global'>;
	metadata: CountryIndexMetadata;
	loadLocalOccupations(): Promise<LocalOccupationSource[]> | LocalOccupationSource[];
	mapToCanonical(code: string, title?: string): string | null;
	loadWages(): Promise<unknown[]> | unknown[];
	loadDemandSignals(): Promise<unknown[]> | unknown[];
	loadPolicyContext(): Promise<Record<string, unknown>[]> | Record<string, unknown>[];
	buildCountryIndex(globalIndex: GlobalOccupationRecord[]): Promise<CountryOccupationRecord[]> | CountryOccupationRecord[];
}

