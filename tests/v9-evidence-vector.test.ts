import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { V9EvidenceVectorRecord } from '../src/lib/data/v9-evidence-vector';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const vectorPath = path.join(ROOT, 'data', 'v9-evidence-vector.json');
const changePath = path.join(ROOT, 'data', 'v9-signal-change.json');
const headlinePath = path.join(ROOT, 'data', 'occupations-v9.json');
const snapshotPath = path.join(ROOT, 'data', 'snapshots', 'v9-evidence-2026-08-22.json');

function read<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

describe('V9 multi-signal evidence vector and change ledger', () => {
	test('aligns separate dimensions without creating a composite score', () => {
		const artifact = read<{
			headline_effect: string;
			claim_boundary: string;
			coverage: {
				ssoc_occupations: number;
				shared_pressure_capability_subset: number;
				dimensions: Record<string, number>;
				pattern_counts: Record<string, number>;
			};
			records: V9EvidenceVectorRecord[];
		}>(vectorPath);
		assert.equal(artifact.headline_effect, 'none_except_existing_task_pressure_owner');
		assert.match(artifact.claim_boundary, /does not average them/);
		assert.equal(artifact.coverage.ssoc_occupations, 1001);
		assert.equal(artifact.coverage.shared_pressure_capability_subset, 75);
		assert.deepEqual(artifact.coverage.dimensions, {
			task_pressure: 987,
			capability_proximity: 75,
			theoretical_exposure: 75,
			observed_use: 73,
			direct_pay: 523,
			named_demand: 37,
			broad_labour_context: 990,
			official_skills: 6
		});
		assert.equal(artifact.records.length, 1001);
		assert.equal(new Set(artifact.records.map(record => record.occupation.ssoc2024)).size, 1001);
		assert(!JSON.stringify(artifact).includes('composite_score'));
	});

	test('publishes descriptive disagreement patterns with explicit bases', () => {
		const artifact = read<{
			coverage: { pattern_counts: Record<string, number> };
			records: V9EvidenceVectorRecord[];
		}>(vectorPath);
		assert.deepEqual(artifact.coverage.pattern_counts, {
			capability_proximity_above_task_pressure: 18,
			high_pressure_with_named_demand: 17,
			high_pressure_with_official_skill_path: 4,
			task_pressure_above_capability_proximity: 19,
			technical_scope_ahead_of_observed_use: 51
		});
		for (const record of artifact.records) {
			assert(record.patterns.every(pattern => pattern.label.length > 10 && pattern.basis.length > 20));
		}
	});

	test('freezes a comparable baseline and limits change to compatible signals', () => {
		const change = read<{
			claim_boundary: string;
			pressure_change: { status: string; previous_comparable_snapshot: null };
			observed_changes: Array<{ key: string; grain: string; change_pct?: number }>;
		}>(changePath);
		const snapshot = read<{ records: Record<string, unknown> }>(snapshotPath);
		assert.match(change.claim_boundary, /same construct, source family and grain/);
		assert.equal(change.pressure_change.status, 'baseline_only');
		assert.equal(change.pressure_change.previous_comparable_snapshot, null);
		assert.equal(change.observed_changes.length, 10);
		assert.equal(change.observed_changes[0]?.key, 'national_job_vacancies');
		assert.equal(change.observed_changes[0]?.change_pct, -5.6628);
		assert.equal(Object.keys(snapshot.records).length, 1001);
	});

	test('rebuilds deterministically and cannot mutate the headline release', () => {
		const before = sha256(headlinePath);
		const result = spawnSync('bun', ['run', 'scripts/build-v9-evidence-vector.ts'], {
			cwd: ROOT,
			encoding: 'utf8'
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(sha256(headlinePath), before);
		for (const [canonical, copies] of [
			[
				vectorPath,
				[
					path.join(ROOT, 'src', 'lib', 'data', 'v9-evidence-vector.json'),
					path.join(ROOT, 'static', 'data', 'v9-evidence-vector.json')
				]
			],
			[
				changePath,
				[
					path.join(ROOT, 'src', 'lib', 'data', 'v9-signal-change.json'),
					path.join(ROOT, 'static', 'data', 'v9-signal-change.json')
				]
			]
		] as const) {
			for (const copy of copies) {
				assert.equal(fs.readFileSync(copy, 'utf8'), fs.readFileSync(canonical, 'utf8'));
			}
		}
	});
});
