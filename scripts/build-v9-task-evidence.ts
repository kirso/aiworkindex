#!/usr/bin/env bun

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSX from 'xlsx';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'raw', 'external', 'ilo_genai_scores_isco08_2025.xlsx');
const METADATA_FILE = path.join(
	ROOT,
	'data',
	'raw',
	'external',
	'ilo_genai_scores_isco08_2025.metadata.json'
);
const OUTPUTS = [
	path.join(ROOT, 'data', 'ilo-isco-task-evidence-v9.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'ilo-isco-task-evidence-v9.json'),
	path.join(ROOT, 'static', 'data', 'ilo-isco-task-evidence-v9.json')
];

interface SourceMetadata {
	publisher: string;
	title: string;
	published_at: string;
	retrieved_at: string;
	url: string;
	repository_url: string;
	doi: string;
	license: 'CC BY 4.0';
	license_url: string;
	file: string;
	size_bytes: number;
	sha256: string;
	worksheet: 'Sheet1';
	observation_vintage: '2025';
}

interface RawTaskRow {
	ISCO_08?: unknown;
	Title?: unknown;
	taskID?: unknown;
	Task_ISCO?: unknown;
	score_2025?: unknown;
	source?: unknown;
}

interface TaskRecord {
	task_id: number;
	text: string;
	score_2025: number;
	score_source: string;
}

interface IscoTaskGroup {
	isco08_code: string;
	title: string;
	tasks: TaskRecord[];
}

function round(value: number, decimals = 4): number {
	const multiplier = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function sourceMetadata(): SourceMetadata {
	const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) as SourceMetadata;
	const bytes = fs.readFileSync(SOURCE_FILE);
	const digest = createHash('sha256').update(bytes).digest('hex');
	if (metadata.file !== path.basename(SOURCE_FILE)) throw new Error('ILO task filename mismatch');
	if (metadata.size_bytes !== bytes.length) throw new Error('ILO task source size mismatch');
	if (metadata.sha256 !== digest) throw new Error('ILO task source checksum mismatch');
	if (metadata.worksheet !== 'Sheet1') throw new Error('ILO task worksheet mismatch');
	if (metadata.license !== 'CC BY 4.0' || !metadata.license_url) {
		throw new Error('ILO task evidence requires explicit attribution metadata');
	}
	return metadata;
}

function main() {
	const metadata = sourceMetadata();
	const workbook = XLSX.readFile(SOURCE_FILE);
	const sheet = workbook.Sheets[metadata.worksheet];
	if (!sheet) throw new Error(`ILO task worksheet ${metadata.worksheet} is unavailable`);
	const rows = XLSX.utils.sheet_to_json<RawTaskRow>(sheet);
	const byIsco = new Map<string, IscoTaskGroup>();
	const taskIds = new Set<string>();

	for (const row of rows) {
		const isco08Code = String(row.ISCO_08 ?? '').trim();
		const title = String(row.Title ?? '').trim();
		const text = String(row.Task_ISCO ?? '').trim();
		const score = row.score_2025;
		const taskId = row.taskID;
		const scoreSource = String(row.source ?? '').trim();
		if (!/^\d{4}$/.test(isco08Code)) continue;
		if (!title || !text) throw new Error(`${isco08Code}: missing ILO task title or text`);
		if (typeof taskId !== 'number' || !Number.isInteger(taskId)) {
			throw new Error(`${isco08Code}: invalid ILO task ID`);
		}
		if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
			throw new Error(`${isco08Code}:${taskId}: invalid ILO task score`);
		}
		const uniqueId = `${isco08Code}:${taskId}`;
		if (taskIds.has(uniqueId)) throw new Error(`${uniqueId}: duplicate ILO task ID`);
		taskIds.add(uniqueId);

		const group = byIsco.get(isco08Code) ?? { isco08_code: isco08Code, title, tasks: [] };
		if (group.title !== title) throw new Error(`${isco08Code}: inconsistent ILO occupation title`);
		group.tasks.push({
			task_id: taskId,
			text,
			score_2025: round(score),
			score_source: scoreSource || 'not_stated'
		});
		byIsco.set(isco08Code, group);
	}

	const groups = Object.fromEntries(
		[...byIsco]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([code, group]) => [
				code,
				{
					...group,
					tasks: group.tasks.sort((a, b) => b.score_2025 - a.score_2025 || a.task_id - b.task_id)
				}
			])
	);

	if (byIsco.size !== 427) throw new Error(`expected 427 ILO task groups, found ${byIsco.size}`);
	if (taskIds.size !== 3265) throw new Error(`expected 3,265 ILO tasks, found ${taskIds.size}`);

	const payload = `${JSON.stringify(
		{
			schema_version: '9.0',
			release: 'ILO ISCO task evidence for AI Work Index V9',
			generated_at: '2026-08-19',
			construct: 'task_level_potential_to_perform_with_generative_ai',
			headline_effect: 'none',
			grain: 'ISCO-08 four-digit occupation group',
			mapping_rule:
				'Use only through the published official SSOC 2024 to ISCO-08 candidates. Task text remains attributed to its ISCO group and is never represented as an exact five-digit SSOC duty.',
			score_scale:
				'0 to 1 potential automation score in the ILO source; higher means the source assessed more potential to perform the task with current generative AI.',
			selection_rule:
				'All source rows are retained. Interfaces may show bounded highest and lowest examples within each mapped ISCO group; examples do not alter occupation means or ranks.',
			adaptation_notice:
				'Field names, grouping and ordering were adapted by AI Work Index. Task text and task scores are retained from the attributed ILO workbook.',
			source: metadata,
			counts: { isco08_groups: byIsco.size, tasks: taskIds.size },
			by_isco08: groups
		},
		null,
		2
	)}\n`;

	for (const output of OUTPUTS) {
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, payload, 'utf8');
	}
	console.log(`V9 task evidence: ${byIsco.size} ISCO groups, ${taskIds.size} tasks`);
}

main();
