#!/usr/bin/env bun
/**
 * fetch-employer-signals.ts — Build employer pressure monitor from curated official signals.
 *
 * Inputs:
 *   - data/raw/employer-signals-seed.json
 *
 * Outputs:
 *   - data/employer-signals.json
 *   - src/lib/data/employer-signals.json
 *   - static/data/employer-signals.json
 *
 * Run: bun run scripts/pipelines/fetch-employer-signals.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Archetype } from '../../src/lib/data/role-archetypes';

const ROOT_DIR = path.join(import.meta.dir, '..', '..');
const SEED_FILE = path.join(ROOT_DIR, 'data', 'raw', 'employer-signals-seed.json');
const OUT_FILE = path.join(ROOT_DIR, 'data', 'employer-signals.json');
const SRC_OUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'employer-signals.json');
const STATIC_OUT_FILE = path.join(ROOT_DIR, 'static', 'data', 'employer-signals.json');

type EmployerSignalType =
	| 'ai_layoff'
	| 'hiring_freeze'
	| 'efficiency_language'
	| 'rehire_narrowing'
	| 'restructuring'
	| 'cost_discipline';

interface EmployerSignal {
	company: string;
	sector: string;
	date: string;
	signal_type: EmployerSignalType;
	description: string;
	source_url: string;
	affected_archetypes: Archetype[];
}

interface EmployerPressureEntry {
	pressure_score: number;
	label: 'low' | 'moderate' | 'high' | 'critical';
	signal_count: number;
	sectors: string[];
	recent_signals: string[];
	latest_date: string | null;
}

interface EmployerPressureIndex {
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

const signalWeights: Record<EmployerSignalType, number> = {
	ai_layoff: 0.35,
	hiring_freeze: 0.25,
	efficiency_language: 0.2,
	rehire_narrowing: 0.2,
	restructuring: 0.18,
	cost_discipline: 0.14
};

function daysOld(date: string): number {
	const then = new Date(date);
	if (Number.isNaN(then.getTime())) return 999;
	return Math.max(0, Math.floor((Date.now() - then.getTime()) / (24 * 60 * 60 * 1000)));
}

function recencyWeight(date: string): number {
	const age = daysOld(date);
	if (age <= 60) return 1;
	if (age <= 120) return 0.75;
	if (age <= 240) return 0.5;
	return 0.3;
}

function pressureLabel(score: number): EmployerPressureEntry['label'] {
	if (score < 0.2) return 'low';
	if (score < 0.45) return 'moderate';
	if (score < 0.72) return 'high';
	return 'critical';
}

function unique<T>(values: T[]): T[] {
	return [...new Set(values)];
}

function buildEntry(signals: EmployerSignal[]): EmployerPressureEntry {
	const score = Math.min(
		1,
		signals.reduce(
			(sum, signal) => sum + signalWeights[signal.signal_type] * recencyWeight(signal.date),
			0
		)
	);

	return {
		pressure_score: Number(score.toFixed(3)),
		label: pressureLabel(score),
		signal_count: signals.length,
		sectors: unique(signals.map(signal => signal.sector)).sort(),
		recent_signals: signals
			.slice()
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 3)
			.map(signal => `${signal.company}: ${signal.description}`),
		latest_date:
			signals
				.map(signal => signal.date)
				.sort()
				.at(-1) ?? null
	};
}

function writeAll(payload: EmployerPressureIndex) {
	const serialized = JSON.stringify(payload, null, 2) + '\n';
	for (const file of [OUT_FILE, SRC_OUT_FILE, STATIC_OUT_FILE]) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, serialized, 'utf-8');
	}
}

function main() {
	console.log('=== Employer Pressure Builder ===\n');

	const signals: EmployerSignal[] = fs.existsSync(SEED_FILE)
		? (JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8')) as EmployerSignal[])
		: [];
	const normalizedSignals = dedupeSignals(signals);

	const byArchetype = new Map<string, EmployerSignal[]>();
	const bySector = new Map<string, EmployerSignal[]>();

	for (const signal of normalizedSignals) {
		for (const archetype of signal.affected_archetypes) {
			const bucket = byArchetype.get(archetype) ?? [];
			bucket.push(signal);
			byArchetype.set(archetype, bucket);
		}

		const sectorBucket = bySector.get(signal.sector) ?? [];
		sectorBucket.push(signal);
		bySector.set(signal.sector, sectorBucket);
	}

	const by_archetype = Object.fromEntries(
		[...byArchetype.entries()].map(([archetype, entries]) => [archetype, buildEntry(entries)])
	);
	const by_sector = Object.fromEntries(
		[...bySector.entries()].map(([sector, entries]) => [sector, buildEntry(entries)])
	);

	const rankedArchetypes = Object.entries(by_archetype).sort(
		(a, b) => b[1].pressure_score - a[1].pressure_score
	);

	const payload: EmployerPressureIndex = {
		generated_at: new Date().toISOString(),
		summary: {
			total_signals: normalizedSignals.length,
			latest_signal_date:
				normalizedSignals
					.map(signal => signal.date)
					.sort()
					.at(-1) ?? null,
			highest_pressure_label: rankedArchetypes[0]?.[1].label ?? null,
			highest_pressure_archetypes: rankedArchetypes.slice(0, 3).map(([archetype]) => archetype)
		},
		signals: normalizedSignals.sort((a, b) => b.date.localeCompare(a.date)),
		by_archetype,
		by_sector
	};

	writeAll(payload);
	console.log(
		`Wrote employer pressure index with ${normalizedSignals.length} curated signals (${signals.length - normalizedSignals.length} duplicates removed).`
	);
}

function dedupeSignals(signals: EmployerSignal[]): EmployerSignal[] {
	const byKey = new Map<string, EmployerSignal>();
	for (const signal of signals) {
		const key = [
			signal.company.trim().toLowerCase(),
			signal.date,
			signal.signal_type,
			signal.description.trim().toLowerCase()
		].join('::');
		if (!byKey.has(key)) byKey.set(key, signal);
	}
	return [...byKey.values()];
}

main();
