import releaseData from '../../../data/occupations-v9.json';
import type { V9Occupation } from './v9-contract';

export type V9ScoredOccupation = V9Occupation & {
	genai_task_exposure: NonNullable<V9Occupation['genai_task_exposure']>;
};

const data = releaseData as {
	schema_version: '9.0';
	counts: { occupations: number; scored: number; insufficient_evidence: number; direct_wages: number };
	occupations: V9Occupation[];
};

export const v9Counts = data.counts;
export const v9Occupations = data.occupations;

export function isV9ScoredOccupation(
	occupation: V9Occupation
): occupation is V9ScoredOccupation {
	return occupation.genai_task_exposure !== null;
}

export const v9ScoredOccupations = v9Occupations.filter(
	isV9ScoredOccupation
);
export const v9OccupationsByCode = new Map(
	v9Occupations.map(occupation => [occupation.taxonomy.code, occupation])
);

export function getV9Occupation(code: string): V9Occupation | null {
	return v9OccupationsByCode.get(code) ?? null;
}

export type { V9Occupation } from './v9-contract';
