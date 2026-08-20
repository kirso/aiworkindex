import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

import { describe, test } from 'node:test';

import { getMappedTaskExamples } from '../src/lib/data/v9-task-evidence.server';

interface TaskDocument {
	schema_version: string;
	headline_effect: string;
	grain: string;
	source: { file: string; size_bytes: number; sha256: string; license: string };
	counts: { isco08_groups: number; tasks: number };
	by_isco08: Record<
		string,
		{
			isco08_code: string;
			title: string;
			tasks: Array<{ task_id: number; text: string; score_2025: number }>;
		}
	>;
}

const taskEvidence = JSON.parse(
	fs.readFileSync('data/ilo-isco-task-evidence-v9.json', 'utf8')
) as TaskDocument;
const release = JSON.parse(fs.readFileSync('data/occupations-v9.json', 'utf8')) as {
	occupations: Array<{
		taxonomy: { code: string };
		genai_task_exposure: {
			pressure_rank: { percentile: number };
			scored_isco08_matches: Array<{ isco08_code: string }>;
		} | null;
	}>;
};

describe('V9 mapped ILO task evidence', () => {
	test('pins all source rows and preserves four-digit ISCO grain', () => {
		assert.equal(taskEvidence.schema_version, '9.0');
		assert.equal(taskEvidence.headline_effect, 'none');
		assert.equal(taskEvidence.grain, 'ISCO-08 four-digit occupation group');
		assert.equal(taskEvidence.counts.isco08_groups, 427);
		assert.equal(taskEvidence.counts.tasks, 3265);
		assert.equal(Object.keys(taskEvidence.by_isco08).length, 427);
		assert.equal(
			Object.values(taskEvidence.by_isco08).reduce((sum, group) => sum + group.tasks.length, 0),
			3265
		);
		for (const [code, group] of Object.entries(taskEvidence.by_isco08)) {
			assert.match(code, /^\d{4}$/);
			assert.equal(group.isco08_code, code);
			assert(group.tasks.every(task => task.text.length > 0));
			assert(group.tasks.every(task => task.score_2025 >= 0 && task.score_2025 <= 1));
		}
	});

	test('matches the frozen checksummed ILO workbook and attribution record', () => {
		const workbook = fs.readFileSync(`data/raw/external/${taskEvidence.source.file}`);
		assert.equal(workbook.length, taskEvidence.source.size_bytes);
		assert.equal(createHash('sha256').update(workbook).digest('hex'), taskEvidence.source.sha256);
		assert.equal(taskEvidence.source.license, 'CC BY 4.0');
	});

	test('covers every scored ISCO match without changing the headline rank', () => {
		const rankSnapshot = new Map(
			release.occupations.map(occupation => [
				occupation.taxonomy.code,
				occupation.genai_task_exposure?.pressure_rank.percentile ?? null
			])
		);
		for (const occupation of release.occupations) {
			for (const match of occupation.genai_task_exposure?.scored_isco08_matches ?? []) {
				assert(taskEvidence.by_isco08[match.isco08_code]);
			}
		}
		assert.deepEqual(
			new Map(
				release.occupations.map(occupation => [
					occupation.taxonomy.code,
					occupation.genai_task_exposure?.pressure_rank.percentile ?? null
				])
			),
			rankSnapshot
		);
	});

	test('selects bounded highest and lowest examples without relabelling their grain', () => {
		const [example] = getMappedTaskExamples(['2512'], 3);
		assert(example);
		assert.equal(example.isco08Code, '2512');
		assert.equal(example.higher.length, 3);
		assert.equal(example.lower.length, 3);
		assert(example.higher[0]!.score_2025 >= example.higher[2]!.score_2025);
		assert(example.lower[0]!.score_2025 <= example.lower[2]!.score_2025);
		assert.equal(new Set([...example.higher, ...example.lower].map(task => task.task_id)).size, 6);
	});
});
