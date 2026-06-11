#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import {
	computeTaskPrimitiveScores,
	minMaxNormalize,
	normalizeTaskText
} from '../src/lib/data/task-primitives-core';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const ONET_DIR = path.join(DATA_DIR, 'raw', 'external', 'onet');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const SRC_OCCUPATIONS_FILE = path.join(SRC_DATA_DIR, 'occupations.json');
const ENRICHMENT_FILE = path.join(DATA_DIR, 'onet-enrichment.json');
const ANTHROPIC_TASKS_FILE = path.join(
	DATA_DIR,
	'raw',
	'external',
	'anthropic_task_penetration.csv'
);
const TASK_STATEMENTS_FILE = path.join(ONET_DIR, 'Task_Statements.txt');
const TASK_RATINGS_FILE = path.join(ONET_DIR, 'Task_Ratings.txt');

interface OccupationRecord {
	ssoc: string;
	task_primitives?: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: 'anthropic_task_penetration_v1' | null;
	};
	[key: string]: unknown;
}

interface OnetEnrichmentEntry {
	ssoc: string;
	onet_soc: string | null;
}

interface TaskStatementRow {
	soc: string;
	taskId: string;
	task: string;
}

interface TaskRatingRow {
	importance: number | null;
	frequency: number | null;
}

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function roundOrNull(value: number | null): number | null {
	return value === null ? null : Math.round(value * 10000) / 10000;
}

function parseTsv(filePath: string): Record<string, string>[] {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
	if (lines.length === 0) return [];
	const headers = lines[0]!.split('\t').map(header => header.trim());
	return lines.slice(1).map(line => {
		const values = line.split('\t');
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			row[header] = (values[index] ?? '').trim();
		});
		return row;
	});
}

function parseAnthropicTaskPenetration(filePath: string): Map<string, number> {
	const workbook = XLSX.readFile(filePath, { raw: true });
	const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
	const rows = XLSX.utils.sheet_to_json<{ task?: string; penetration?: number | string }>(sheet);
	const map = new Map<string, number>();
	for (const row of rows) {
		const penetration =
			typeof row.penetration === 'number' ? row.penetration : Number(row.penetration);
		if (!row.task || !Number.isFinite(penetration)) continue;
		map.set(normalizeTaskText(row.task), penetration);
	}
	return map;
}

function parseTaskStatements(filePath: string): Map<string, TaskStatementRow[]> {
	const rows = parseTsv(filePath);
	const tasksByBaseSoc = new Map<string, TaskStatementRow[]>();
	for (const row of rows) {
		const soc = row['O*NET-SOC Code'] ?? '';
		const taskId = row['Task ID'] ?? '';
		const task = row['Task'] ?? '';
		if (!soc || !taskId || !task) continue;
		const baseSoc = soc.split('.')[0] ?? soc;
		const list = tasksByBaseSoc.get(baseSoc) ?? [];
		list.push({ soc, taskId, task });
		tasksByBaseSoc.set(baseSoc, list);
	}
	return tasksByBaseSoc;
}

function isImportanceScale(row: Record<string, string>): boolean {
	const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
	const scaleName = (row['Scale Name'] ?? '').toLowerCase();
	return scaleId === 'im' || scaleName.includes('importance');
}

function isFrequencyScale(row: Record<string, string>): boolean {
	const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
	const scaleName = (row['Scale Name'] ?? '').toLowerCase();
	return (
		scaleId === 'ft' || scaleId === 'rt' || scaleId === 'fr' || scaleName.includes('frequency')
	);
}

function parseTaskRatings(filePath: string): Map<string, { weight: number }> {
	const rawRows = parseTsv(filePath);
	const ratings = new Map<string, TaskRatingRow>();

	for (const row of rawRows) {
		const soc = row['O*NET-SOC Code'] ?? '';
		const taskId = row['Task ID'] ?? '';
		const value = Number(row['Data Value'] ?? row['DataValue'] ?? row['Value'] ?? '');
		if (!soc || !taskId || !Number.isFinite(value)) continue;
		const key = `${soc}::${taskId}`;
		const current = ratings.get(key) ?? { importance: null, frequency: null };

		if (isImportanceScale(row)) current.importance = value;
		if (isFrequencyScale(row)) current.frequency = value;

		ratings.set(key, current);
	}

	const importanceValues = [...ratings.values()]
		.map(rating => rating.importance)
		.filter((value): value is number => value !== null);
	const frequencyValues = [...ratings.values()]
		.map(rating => rating.frequency)
		.filter((value): value is number => value !== null);

	const minImportance = Math.min(...importanceValues);
	const maxImportance = Math.max(...importanceValues);
	const minFrequency = Math.min(...frequencyValues);
	const maxFrequency = Math.max(...frequencyValues);

	const normalized = new Map<string, { weight: number }>();
	for (const [key, rating] of ratings) {
		if (rating.importance === null || rating.frequency === null) continue;
		const importance = minMaxNormalize(rating.importance, minImportance, maxImportance);
		const frequency = minMaxNormalize(rating.frequency, minFrequency, maxFrequency);
		const weight = importance * frequency;
		if (weight > 0) normalized.set(key, { weight });
	}

	return normalized;
}

function nullTaskPrimitives() {
	return {
		matched_task_weight_share: null,
		task_effective_coverage: null,
		task_exposure_concentration: null,
		method: null
	} as const;
}

async function main() {
	if (!fs.existsSync(OCCUPATIONS_FILE)) {
		throw new Error(`Missing occupations file: ${OCCUPATIONS_FILE}`);
	}
	if (!fs.existsSync(ENRICHMENT_FILE)) {
		throw new Error(`Missing O*NET enrichment file: ${ENRICHMENT_FILE}`);
	}
	if (!fs.existsSync(ANTHROPIC_TASKS_FILE) || !fs.existsSync(TASK_STATEMENTS_FILE)) {
		throw new Error('Missing required task primitive source files.');
	}

	const occupations = readJson<OccupationRecord[]>(OCCUPATIONS_FILE);
	const enrichment = readJson<OnetEnrichmentEntry[]>(ENRICHMENT_FILE);
	const onetSocBySsoc = new Map(enrichment.map(entry => [entry.ssoc, entry.onet_soc]));

	if (!fs.existsSync(TASK_RATINGS_FILE)) {
		const nulled = occupations.map(occupation => ({
			...occupation,
			task_primitives: nullTaskPrimitives()
		}));
		writeJson(OCCUPATIONS_FILE, nulled);
		writeJson(SRC_OCCUPATIONS_FILE, nulled);
		console.log('Task_Ratings.txt not found. Emitted null task_primitives for all occupations.');
		return;
	}

	const penetrationByTask = parseAnthropicTaskPenetration(ANTHROPIC_TASKS_FILE);
	const tasksByBaseSoc = parseTaskStatements(TASK_STATEMENTS_FILE);
	const weightsByTask = parseTaskRatings(TASK_RATINGS_FILE);

	const taskDetail: Record<
		string,
		{
			matched_task_count: number;
			observed_task_count: number;
			most_observed: Array<{ task: string; weight_share: number; penetration: number | null }>;
			most_protected: Array<{ task: string; weight_share: number; penetration: number | null }>;
		}
	> = {};

	const updated = occupations.map(occupation => {
		const onetSoc = onetSocBySsoc.get(occupation.ssoc) ?? null;
		if (!onetSoc) {
			return { ...occupation, task_primitives: nullTaskPrimitives() };
		}

		const baseSoc = onetSoc.split('.')[0] ?? onetSoc;
		const taskRows = tasksByBaseSoc.get(baseSoc) ?? [];
		const weightedTasks = taskRows
			.map(taskRow => {
				const rating = weightsByTask.get(`${taskRow.soc}::${taskRow.taskId}`);
				if (!rating) return null;
				return {
					task: taskRow.task,
					weight: rating.weight,
					penetration: penetrationByTask.get(normalizeTaskText(taskRow.task)) ?? null
				};
			})
			.filter(
				(task): task is { task: string; weight: number; penetration: number | null } =>
					task !== null
			);

		if (weightedTasks.length === 0) {
			return { ...occupation, task_primitives: nullTaskPrimitives() };
		}

		const totalWeight = weightedTasks.reduce((sum, task) => sum + task.weight, 0);
		if (totalWeight <= 0) {
			return { ...occupation, task_primitives: nullTaskPrimitives() };
		}

		const taskPrimitives = computeTaskPrimitiveScores(
			weightedTasks.map(task => ({
				weight: task.weight / totalWeight,
				penetration: task.penetration
			}))
		);

		// Per-task detail for the explanatory occupation-page surfacing.
		const withShare = weightedTasks.map(task => ({
			task: task.task,
			weight_share: Math.round((task.weight / totalWeight) * 10000) / 10000,
			penetration: roundOrNull(task.penetration)
		}));
		taskDetail[occupation.ssoc] = {
			matched_task_count: withShare.length,
			observed_task_count: withShare.filter(task => task.penetration !== null).length,
			most_observed: withShare
				.filter(task => task.penetration !== null)
				.sort((a, b) => (b.penetration ?? 0) - (a.penetration ?? 0))
				.slice(0, 3),
			most_protected: withShare
				.filter(task => task.penetration === null)
				.sort((a, b) => b.weight_share - a.weight_share)
				.slice(0, 3)
		};

		return {
			...occupation,
			task_primitives: {
				matched_task_weight_share: roundOrNull(taskPrimitives.matched_task_weight_share),
				task_effective_coverage: roundOrNull(taskPrimitives.task_effective_coverage),
				task_exposure_concentration: roundOrNull(taskPrimitives.task_exposure_concentration),
				method: taskPrimitives.method
			}
		};
	});

	// Post-processing: compute classification_uncertainty from uncertainty p10/p90
	const { getRiskBand } = await import('../src/lib/data/scoring-constants');

	const final = updated.map(occupation => {
		const unc = occupation.uncertainty as
			| {
					net_risk_p10?: number;
					net_risk_p90?: number;
			  }
			| undefined;
		const crossesBoundary =
			unc?.net_risk_p10 != null &&
			unc?.net_risk_p90 != null &&
			getRiskBand(unc.net_risk_p10) !== getRiskBand(unc.net_risk_p90);

		return {
			...occupation,
			classification_uncertainty: crossesBoundary ? 'crosses_boundary' : null
		};
	});

	writeJson(OCCUPATIONS_FILE, final);
	writeJson(SRC_OCCUPATIONS_FILE, final);

	const detailPayload = {
		method: 'anthropic_task_penetration_v1',
		note: 'Explanatory per-task evidence only — never a score input. "Most observed" ranks O*NET tasks by Anthropic task-penetration; "most protected" lists the highest-importance tasks with no observed AI usage in that data (absence of observed usage, not proof of immunity).',
		entries: taskDetail
	};
	writeJson(path.join(DATA_DIR, 'task-exposure-detail.json'), detailPayload);
	writeJson(path.join(SRC_DATA_DIR, 'task-exposure-detail.json'), detailPayload);
	console.log(`Task exposure detail emitted for ${Object.keys(taskDetail).length} occupations`);

	const covered = final.filter(
		occupation => occupation.task_primitives?.matched_task_weight_share != null
	).length;
	const crossBoundaryCount = final.filter(
		occupation => occupation.classification_uncertainty === 'crosses_boundary'
	).length;
	console.log(
		`Built task_primitives for ${covered}/${final.length} occupations from exact normalized-task matches.`
	);
	console.log(
		`  ${crossBoundaryCount} occupations cross risk-band boundaries (classification uncertain).`
	);
}

main().catch(console.error);
