import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { V9Occupation } from '../src/lib/data/v9-contract';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_FILE = path.join(ROOT, 'data', 'occupations-v9.json');
const MARKET_FILE = path.join(ROOT, 'data', 'v9-market-context.json');

export interface V9ReleaseDocument {
	schema_version: '9.0';
	release: string;
	generated_at: string;
	method: Record<string, unknown>;
	sources: Record<string, unknown>;
	counts: {
		occupations: number;
		scored: number;
		insufficient_evidence: number;
		direct_wages: number;
	};
	occupations: V9Occupation[];
}

export interface V9DemandSignal {
	source_key: string;
	label: string;
	published_at: string;
	effective_at: string | null;
	url: string;
	source_occupation: string;
	mapping_basis: string;
	rationale: string;
	interpretation: string;
}

export interface V9LabourContext {
	cluster_key: string;
	vacancy: Record<string, unknown>;
	hiring: Record<string, unknown> | null;
	retrenchment: Record<string, unknown> | null;
	re_entry?: Record<string, unknown>;
	summary: string;
	data_as_of: string;
	source: string;
}

export interface V9MarketDocument {
	schema_version: '9.0';
	generated_at: string;
	taxonomy: 'SSOC 2024';
	rules: Record<string, string>;
	demand_by_code: Record<string, V9DemandSignal[]>;
	withheld_demand_mappings: Array<Record<string, string>>;
	labour_by_major_group: Record<string, V9LabourContext | null>;
	national: Record<string, unknown>;
}

export interface V9PublicOccupation extends V9Occupation {
	market_evidence: {
		demand_signals: V9DemandSignal[];
		labour_context_ref: {
			major_group_code: string;
			cluster_key: string;
			key: string;
			data_as_of: string;
			grain: 'published_broad_occupation_group';
		} | null;
	};
}

export interface V9PublicRelease extends Omit<V9ReleaseDocument, 'occupations'> {
	public_contract: {
		current: true;
		geography: 'Singapore';
		taxonomy: 'SSOC 2024';
		headline: 'AI Work Pressure Rank';
		headline_interpretation: 'relative_task_exposure_not_job_loss_probability';
		methodology_url: 'https://aiworkindex.com/methodology';
		market_evidence_url: 'https://aiworkindex.com/data/v9-market-context.json';
	};
	market_context: Omit<V9MarketDocument, 'demand_by_code' | 'labour_by_major_group'> & {
		labour_by_major_group: V9MarketDocument['labour_by_major_group'];
	};
	occupations: V9PublicOccupation[];
}

function readJson<T>(file: string): T {
	if (!fs.existsSync(file)) throw new Error(`Missing V9 input: ${file}`);
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function loadV9Release(): V9ReleaseDocument {
	const release = readJson<V9ReleaseDocument>(RELEASE_FILE);
	if (
		release.counts.occupations !== 1001 ||
		release.counts.scored !== 987 ||
		release.counts.insufficient_evidence !== 14 ||
		release.counts.direct_wages !== 523 ||
		release.occupations.length !== 1001
	) {
		throw new Error('V9 occupation count contract changed');
	}
	return release;
}

export function loadV9Market(): V9MarketDocument {
	const market = readJson<V9MarketDocument>(MARKET_FILE);
	if (market.schema_version !== '9.0' || market.taxonomy !== 'SSOC 2024') {
		throw new Error('V9 market context contract changed');
	}
	return market;
}

export function buildV9PublicRelease(): V9PublicRelease {
	const release = loadV9Release();
	const market = loadV9Market();
	const occupations = release.occupations.map(occupation => {
		const code = occupation.taxonomy.code;
		const majorGroupCode = occupation.taxonomy.hierarchy.major_group.code;
		const labour = market.labour_by_major_group[majorGroupCode] ?? null;
		return {
			...occupation,
			market_evidence: {
				demand_signals: market.demand_by_code[code] ?? [],
				labour_context_ref: labour
					? {
							major_group_code: majorGroupCode,
							cluster_key: labour.cluster_key,
							key: `labour_by_major_group.${majorGroupCode}`,
							data_as_of: labour.data_as_of,
							grain: 'published_broad_occupation_group' as const
						}
					: null
			}
		} satisfies V9PublicOccupation;
	});

	return {
		...release,
		public_contract: {
			current: true,
			geography: 'Singapore',
			taxonomy: 'SSOC 2024',
			headline: 'AI Work Pressure Rank',
			headline_interpretation: 'relative_task_exposure_not_job_loss_probability',
			methodology_url: 'https://aiworkindex.com/methodology',
			market_evidence_url: 'https://aiworkindex.com/data/v9-market-context.json'
		},
		market_context: {
			schema_version: market.schema_version,
			generated_at: market.generated_at,
			taxonomy: market.taxonomy,
			rules: market.rules,
			withheld_demand_mappings: market.withheld_demand_mappings,
			national: market.national,
			labour_by_major_group: market.labour_by_major_group
		},
		occupations
	};
}

export { ROOT };
