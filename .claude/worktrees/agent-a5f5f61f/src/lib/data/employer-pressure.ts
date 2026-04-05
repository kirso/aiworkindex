import employerSignalsData from './employer-signals.json';
import type { Occupation } from './index';
import { classifyArchetype, type Archetype } from './role-archetypes';

export type EmployerSignalType =
	| 'ai_layoff'
	| 'hiring_freeze'
	| 'efficiency_language'
	| 'rehire_narrowing'
	| 'restructuring'
	| 'cost_discipline';

export interface EmployerSignal {
	company: string;
	sector: string;
	date: string;
	signal_type: EmployerSignalType;
	description: string;
	source_url: string;
	affected_archetypes: Archetype[];
}

export interface EmployerPressureEntry {
	pressure_score: number;
	label: 'low' | 'moderate' | 'high' | 'critical';
	signal_count: number;
	sectors: string[];
	recent_signals: string[];
	latest_date: string | null;
}

export interface EmployerPressureIndex {
	generated_at: string;
	summary: {
		total_signals: number;
		latest_signal_date: string | null;
		highest_pressure_label: EmployerPressureEntry['label'] | null;
		highest_pressure_archetypes: string[];
	};
	signals: EmployerSignal[];
	by_archetype: Record<string, EmployerPressureEntry>;
	by_sector: Record<string, EmployerPressureEntry>;
}

export const employerPressure = employerSignalsData as EmployerPressureIndex;

export function getEmployerPressureForOccupation(occupation: Occupation): EmployerPressureEntry | null {
	const archetype = classifyArchetype(occupation.ssoc, occupation.title, occupation.major_group);
	return employerPressure.by_archetype[archetype] ?? null;
}

export function buildRoleEmployerPressure(
	components: Array<{ weight: number; occupation: Occupation | null }>
): EmployerPressureEntry | null {
	const entries = components
		.filter(
			(component): component is { weight: number; occupation: Occupation } =>
				component.occupation !== null
		)
		.map((component) => ({
			weight: component.weight,
			entry: getEmployerPressureForOccupation(component.occupation)
		}))
		.filter((component): component is { weight: number; entry: EmployerPressureEntry } => component.entry !== null);

	if (entries.length === 0) return null;

	const score = entries.reduce((sum, component) => sum + component.entry.pressure_score * component.weight, 0);
	const label =
		score < 0.2 ? 'low' : score < 0.45 ? 'moderate' : score < 0.72 ? 'high' : 'critical';

	return {
		pressure_score: Number(score.toFixed(3)),
		label,
		signal_count: entries.reduce((sum, component) => sum + component.entry.signal_count, 0),
		sectors: [...new Set(entries.flatMap((component) => component.entry.sectors))].sort(),
		recent_signals: [...new Set(entries.flatMap((component) => component.entry.recent_signals))].slice(
			0,
			3
		),
		latest_date:
			entries
				.map((component) => component.entry.latest_date)
				.filter((value): value is string => typeof value === 'string')
				.sort()
				.at(-1) ?? null
	};
}
