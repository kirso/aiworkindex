#!/usr/bin/env bun
/**
 * fetch-employer-signals.ts — Employer pressure signals pipeline.
 *
 * Sources:
 *   - SGX announcements (layoffs, restructuring)
 *   - Company newsrooms (efficiency programs, AI adoption)
 *   - Earnings call transcripts (hiring freezes, automation mentions)
 *
 * Formula: 0.35×ai_layoff + 0.25×hiring_freeze + 0.20×efficiency_language + 0.20×rehire_narrowing
 *
 * Output: data/employer-signals.json
 *
 * Status: STUB — infrastructure ready, needs data source integration.
 * Run: bun run scripts/pipelines/fetch-employer-signals.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUT_FILE = path.join(import.meta.dir, '..', '..', 'data', 'employer-signals.json');

interface EmployerSignal {
	company: string;
	sector: string;
	date: string;
	signal_type: 'ai_layoff' | 'hiring_freeze' | 'efficiency_language' | 'rehire_narrowing';
	description: string;
	source_url: string;
	affected_archetypes: string[];
}

interface EmployerPressureIndex {
	generated_at: string;
	signals: EmployerSignal[];
	by_archetype: Record<
		string,
		{
			pressure_score: number;
			label: 'low' | 'moderate' | 'high' | 'critical';
			signal_count: number;
			recent_signals: string[];
		}
	>;
}

function _computePressure(signals: EmployerSignal[]): number {
	const weights: Record<string, number> = {
		ai_layoff: 0.35,
		hiring_freeze: 0.25,
		efficiency_language: 0.2,
		rehire_narrowing: 0.2
	};

	let score = 0;
	const typeCounts: Record<string, number> = {};
	for (const s of signals) {
		typeCounts[s.signal_type] = (typeCounts[s.signal_type] || 0) + 1;
	}

	for (const [type, weight] of Object.entries(weights)) {
		const count = typeCounts[type] || 0;
		// Diminishing returns: each additional signal adds less
		score += weight * Math.min(count / 3, 1.0);
	}

	return Math.min(1.0, score);
}

function _pressureLabel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
	if (score < 0.2) return 'low';
	if (score < 0.5) return 'moderate';
	if (score < 0.75) return 'high';
	return 'critical';
}

function main() {
	console.log('=== Employer Signals Pipeline ===\n');
	console.log('This script collects employer pressure signals from:');
	console.log('  - SGX announcements');
	console.log('  - Company newsrooms');
	console.log('  - Earnings call transcripts\n');
	console.log('Currently in STUB mode — no data sources configured.\n');

	// Write empty index
	const index: EmployerPressureIndex = {
		generated_at: new Date().toISOString(),
		signals: [],
		by_archetype: {}
	};

	fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2));
	console.log(`Wrote empty employer signals: ${OUT_FILE}`);
	console.log('\nTo activate:');
	console.log('  1. Add signal sources (RSS feeds, API endpoints)');
	console.log('  2. Implement signal extraction logic');
	console.log('  3. Map signals to role archetypes');
	console.log('  4. Run on a weekly schedule');
}

main();
