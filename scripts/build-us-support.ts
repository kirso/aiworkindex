#!/usr/bin/env bun
/**
 * build-us-support.ts — Build the United States evidence-support bundle.
 *
 * This artifact supplements the US country layer with source-backed
 * O*NET and CPS context:
 *   - occupation descriptions
 *   - job zone / preparation context
 *   - task primitives from O*NET task statements and Anthropic task penetration
 *   - technology context from O*NET technology skills
 *   - work-context signals from O*NET work context
 *   - age profile from BLS CPS occupation tables
 *
 * It is published separately from the headline score because it is evidence
 * context, not a direct labor-market outcome.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

import { computeTaskPrimitiveScores, minMaxNormalize, normalizeTaskText } from '../src/lib/data/task-primitives-core';
import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const ONET_DIR = path.join(DATA_DIR, 'raw', 'external', 'onet');

const US_OCCUPATIONS_FILE = path.join(DATA_DIR, 'countries', 'us', 'occupations.json');
const ANTHROPIC_TASKS_FILE = path.join(DATA_DIR, 'raw', 'external', 'anthropic_task_penetration.csv');
const CPS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_cps_employment_2025.xlsx');

const OUT_FILE = path.join(DATA_DIR, 'countries', 'us', 'support.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'countries', 'us', 'support.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'countries', 'us', 'support.json');

type UnitedStatesOccupation = {
  localCode: string;
  localTitle: string;
};

type SupportTask = {
  task: string;
  score: number;
  penetration: number | null;
};

type SupportTechnology = {
  name: string;
  category: string;
  hot: boolean;
  inDemand: boolean;
};

type SupportWorkContext = {
  label: string;
  value: number;
};

type SupportAgeProfile = {
  totalEmployment: number | null;
  medianAge: number | null;
  under25Share: number | null;
  primeAgeShare: number | null;
  olderShare: number | null;
  matchScore: number | null;
};

type SupportTaskPrimitives = {
  matched_task_weight_share: number | null;
  task_effective_coverage: number | null;
  task_exposure_concentration: number | null;
  method: 'anthropic_task_penetration_v1' | null;
};

type UnitedStatesSupportEntry = {
  localCode: string;
  localTitle: string;
  occupationDescription: string | null;
  jobZone: number | null;
  jobZoneLabel: string | null;
  jobZoneSummary: string | null;
  taskPrimitives: SupportTaskPrimitives;
  topTasks: SupportTask[];
  topTechnologies: SupportTechnology[];
  topWorkContext: SupportWorkContext[];
  ageProfile: SupportAgeProfile;
  note: string;
  sourceVintage: string;
};

function ensureDir(filepath: string): void {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function normalizeTitle(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\((?:excluding|including|except|e\.g\.).*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSimilarity(leftTitle: string, rightTitle: string): number {
  const left = new Set(
    normalizeTitle(leftTitle)
      .split(' ')
      .filter(word => word.length > 2)
  );
  const right = new Set(
    normalizeTitle(rightTitle)
      .split(' ')
      .filter(word => word.length > 2)
  );

  if (left.size === 0 || right.size === 0) return 0;

  let matches = 0;
  for (const word of left) {
    for (const candidate of right) {
      if (word === candidate) {
        matches += 1;
        break;
      }
      const shorter = word.length <= candidate.length ? word : candidate;
      const longer = word.length <= candidate.length ? candidate : word;
      if (shorter.length >= 5 && longer.startsWith(shorter)) {
        matches += 1;
        break;
      }
    }
  }

  if (matches === 0) return 0;
  return matches + matches / Math.max(right.size, 1) * 0.2;
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
    const penetration = typeof row.penetration === 'number' ? row.penetration : Number(row.penetration);
    if (!row.task || !Number.isFinite(penetration)) continue;
    map.set(normalizeTaskText(row.task), penetration);
  }
  return map;
}

function parseOccupationData(): Map<string, { title: string; description: string }> {
  const rows = parseTsv(path.join(ONET_DIR, 'Occupation_Data.txt'));
  const byBaseSoc = new Map<string, { title: string; description: string }>();

  for (const row of rows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const baseSoc = socFull.split('.')[0] ?? socFull;
    const title = (row['Title'] ?? '').trim();
    const description = (row['Description'] ?? '').trim();
    if (!baseSoc || !title) continue;

    const existing = byBaseSoc.get(baseSoc);
    if (!existing || socFull.endsWith('.00')) {
      byBaseSoc.set(baseSoc, { title, description });
    }
  }

  return byBaseSoc;
}

function parseJobZones(): Map<string, { zone: number; date: string }> {
  const rows = parseTsv(path.join(ONET_DIR, 'Job_Zones.txt'));
  const byBaseSoc = new Map<string, { zone: number; date: string }>();
  for (const row of rows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const baseSoc = socFull.split('.')[0] ?? socFull;
    const zone = Number(row['Job Zone'] ?? '');
    const date = row['Date'] ?? '';
    if (!baseSoc || !Number.isFinite(zone)) continue;
    if (!byBaseSoc.has(baseSoc) || socFull.endsWith('.00')) {
      byBaseSoc.set(baseSoc, { zone, date });
    }
  }
  return byBaseSoc;
}

function parseTaskStatements(): Map<string, Array<{ taskId: string; task: string; type: string }>> {
  const rows = parseTsv(path.join(ONET_DIR, 'Task_Statements.txt'));
  const byBaseSoc = new Map<string, Array<{ taskId: string; task: string; type: string }>>();
  for (const row of rows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const baseSoc = socFull.split('.')[0] ?? socFull;
    const taskId = row['Task ID'] ?? '';
    const task = row['Task'] ?? '';
    const type = row['Task Type'] ?? '';
    if (!baseSoc || !taskId || !task) continue;
    const list = byBaseSoc.get(baseSoc) ?? [];
    list.push({ taskId, task, type });
    byBaseSoc.set(baseSoc, list);
  }
  return byBaseSoc;
}

function isImportanceScale(row: Record<string, string>): boolean {
  const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
  const scaleName = (row['Scale Name'] ?? '').toLowerCase();
  return scaleId === 'im' || scaleName.includes('importance');
}

function isFrequencyScale(row: Record<string, string>): boolean {
  const scaleId = (row['Scale ID'] ?? row['ScaleID'] ?? '').toLowerCase();
  const scaleName = (row['Scale Name'] ?? '').toLowerCase();
  return scaleId === 'ft' || scaleId === 'rt' || scaleId === 'fr' || scaleName.includes('frequency');
}

function parseTaskRatings(): Map<string, { weight: number }> {
  const rawRows = parseTsv(path.join(ONET_DIR, 'Task_Ratings.txt'));
  const ratings = new Map<string, { importance: number | null; frequency: number | null }>();

  for (const row of rawRows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const soc = socFull.split('.')[0] ?? socFull;
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

function parseTechnologySkills(): Map<string, SupportTechnology[]> {
  const rows = parseTsv(path.join(ONET_DIR, 'Technology_Skills.txt'));
  const byBaseSoc = new Map<string, SupportTechnology[]>();
  for (const row of rows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const baseSoc = socFull.split('.')[0] ?? socFull;
    const name = row['Example'] ?? '';
    const category = row['Commodity Title'] ?? '';
    const hot = (row['Hot Technology'] ?? '').toUpperCase() === 'Y';
    const inDemand = (row['In Demand'] ?? '').toUpperCase() === 'Y';
    if (!baseSoc || !name) continue;
    const list = byBaseSoc.get(baseSoc) ?? [];
    if (!list.some(entry => entry.name === name)) {
      list.push({ name, category, hot, inDemand });
      byBaseSoc.set(baseSoc, list);
    }
  }
  return byBaseSoc;
}

function parseWorkContext(): Map<string, SupportWorkContext[]> {
  const rows = parseTsv(path.join(ONET_DIR, 'Work_Context.txt'));
  const byBaseSoc = new Map<string, SupportWorkContext[]>();

  for (const row of rows) {
    const socFull = row['O*NET-SOC Code'] ?? '';
    const baseSoc = socFull.split('.')[0] ?? socFull;
    const elementName = row['Element Name'] ?? '';
    const scaleId = row['Scale ID'] ?? '';
    const value = Number(row['Data Value'] ?? '');
    if (!baseSoc || !elementName || scaleId !== 'CX' || !Number.isFinite(value)) continue;
    const list = byBaseSoc.get(baseSoc) ?? [];
    list.push({ label: elementName, value });
    byBaseSoc.set(baseSoc, list);
  }

  return byBaseSoc;
}

function parseCpsAgeProfiles(): Array<{
  title: string;
  total: number;
  medianAge: number;
  under25Share: number;
  primeAgeShare: number;
  olderShare: number;
}> {
  const workbook = XLSX.readFile(CPS_FILE, { raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  const result: Array<{
    title: string;
    total: number;
    medianAge: number;
    under25Share: number;
    primeAgeShare: number;
    olderShare: number;
  }> = [];

  for (const row of rows.slice(6)) {
    const title = String(row?.[0] ?? '').trim();
    const total = Number(row?.[1] ?? NaN);
    const medianAge = Number(row?.[9] ?? NaN);
    if (!title || !Number.isFinite(total) || total <= 0 || !Number.isFinite(medianAge)) continue;

    const ages = [
      Number(row?.[2] ?? NaN),
      Number(row?.[3] ?? NaN),
      Number(row?.[4] ?? NaN),
      Number(row?.[5] ?? NaN),
      Number(row?.[6] ?? NaN),
      Number(row?.[7] ?? NaN),
      Number(row?.[8] ?? NaN)
    ];
    if (ages.some(value => !Number.isFinite(value))) continue;

    const under25 = (ages[0] ?? 0) + (ages[1] ?? 0);
    const primeAge = (ages[2] ?? 0) + (ages[3] ?? 0) + (ages[4] ?? 0);
    const older = (ages[5] ?? 0) + (ages[6] ?? 0);

    result.push({
      title,
      total,
      medianAge,
      under25Share: under25 / total,
      primeAgeShare: primeAge / total,
      olderShare: older / total
    });
  }

  return result;
}

function jobZoneLabel(zone: number | null): string | null {
  if (zone === 1) return 'Little or no preparation';
  if (zone === 2) return 'Some preparation';
  if (zone === 3) return 'Medium preparation';
  if (zone === 4) return 'Moderate preparation';
  if (zone === 5) return 'Extensive preparation';
  return null;
}

function jobZoneSummary(zone: number | null): string | null {
  if (zone === 1) return 'The occupation is typically open to entry with short preparation.';
  if (zone === 2) return 'The occupation usually needs some preparation before entry.';
  if (zone === 3) return 'The occupation usually needs moderate preparation and experience.';
  if (zone === 4) return 'The occupation usually needs substantial preparation and experience.';
  if (zone === 5) return 'The occupation usually needs extensive preparation, training, and experience.';
  return null;
}

function buildSupportEntries(): UnitedStatesSupportEntry[] {
  const occupations = readJson<UnitedStatesOccupation[]>(US_OCCUPATIONS_FILE);
  const occupationDataBySoc = parseOccupationData();
  const jobZones = parseJobZones();
  const taskStatements = parseTaskStatements();
  const taskRatings = parseTaskRatings();
  const penetrationByTask = parseAnthropicTaskPenetration(ANTHROPIC_TASKS_FILE);
  const technologiesBySoc = parseTechnologySkills();
  const workContextBySoc = parseWorkContext();
  const cpsProfiles = parseCpsAgeProfiles();

  return occupations.map(occupation => {
    const soc = occupation.localCode;
    const occupationData = occupationDataBySoc.get(soc) ?? null;
    const jobZone = jobZones.get(soc)?.zone ?? null;
    const taskRows = taskStatements.get(soc) ?? [];
    const weightedTasks = taskRows
      .map(taskRow => {
        const rating = taskRatings.get(`${soc}::${taskRow.taskId}`);
        if (!rating) return null;
        return {
          weight: rating.weight,
          penetration: penetrationByTask.get(normalizeTaskText(taskRow.task)) ?? null,
          task: taskRow.task,
          taskId: taskRow.taskId,
          type: taskRow.type
        };
      })
      .filter(
        (task): task is {
          weight: number;
          penetration: number | null;
          task: string;
          taskId: string;
          type: string;
        } => task !== null
      );

    const totalTaskWeight = weightedTasks.reduce((sum, task) => sum + task.weight, 0);
    const taskPrimitives =
      totalTaskWeight > 0
        ? computeTaskPrimitiveScores(
            weightedTasks.map(task => ({
              weight: task.weight / totalTaskWeight,
              penetration: task.penetration
            }))
          )
        : null;

    const topTasks = weightedTasks
      .map(task => ({
        task: task.task,
        score: Number((task.weight / Math.max(totalTaskWeight, 1)).toFixed(4)),
        penetration: task.penetration
      }))
      .sort((a, b) => b.score - a.score || a.task.localeCompare(b.task))
      .slice(0, 6);

    const topTechnologies = [...(technologiesBySoc.get(soc) ?? [])]
      .map(technology => ({
        ...technology,
        score: Number((technology.hot ? 2 : 0) + (technology.inDemand ? 1 : 0))
      }))
      .sort(
        (a, b) =>
          b.score - a.score || Number(b.hot) - Number(a.hot) || Number(b.inDemand) - Number(a.inDemand) ||
          a.name.localeCompare(b.name)
      )
      .slice(0, 6)
      .map(({ score: _score, ...technology }) => technology);

    const topWorkContext = [...(workContextBySoc.get(soc) ?? [])]
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 6);

    const cpsMatch = cpsProfiles
      .map(profile => ({
        profile,
        score: titleSimilarity(occupation.localTitle, profile.title)
      }))
      .sort((a, b) => b.score - a.score || b.profile.total - a.profile.total)[0];

    const ageProfile = cpsMatch && cpsMatch.score >= 1
      ? {
          totalEmployment: Number(cpsMatch.profile.total.toFixed(1)),
          medianAge: Number(cpsMatch.profile.medianAge.toFixed(1)),
          under25Share: Number(cpsMatch.profile.under25Share.toFixed(4)),
          primeAgeShare: Number(cpsMatch.profile.primeAgeShare.toFixed(4)),
          olderShare: Number(cpsMatch.profile.olderShare.toFixed(4)),
          matchScore: Number(cpsMatch.score.toFixed(4))
        }
      : {
          totalEmployment: null,
          medianAge: null,
          under25Share: null,
          primeAgeShare: null,
          olderShare: null,
          matchScore: null
        };

    return {
      localCode: occupation.localCode,
      localTitle: occupation.localTitle,
      occupationDescription: occupationData?.description ?? null,
      jobZone,
      jobZoneLabel: jobZoneLabel(jobZone),
      jobZoneSummary: jobZoneSummary(jobZone),
      taskPrimitives: taskPrimitives ?? {
        matched_task_weight_share: null,
        task_effective_coverage: null,
        task_exposure_concentration: null,
        method: null
      },
      topTasks,
      topTechnologies,
      topWorkContext,
      ageProfile,
      note: `Built from O*NET occupation descriptions, task statements, technology skills, work context, Job Zones, Anthropic task penetration, and BLS CPS occupation age tables.`,
      sourceVintage: 'O*NET 30.2 / CPS 2025 / Anthropic task penetration'
    };
  });
}

function main() {
  const entries = buildSupportEntries();
  const payload = {
    generated_at: new Date().toISOString(),
    version: DATA_VINTAGE.model_version,
    source_vintage: 'O*NET 30.2 / CPS 2025 / Anthropic task penetration',
    note:
      'US evidence-support bundle built from the checked-in public raw corpus. This is context, not a direct labor-market outcome.',
    entries
  };

  writeJson(OUT_FILE, payload);
  writeJson(SRC_OUT_FILE, payload);
  writeJson(STATIC_OUT_FILE, payload);

  console.log(`Built US support artifact at ${STATIC_OUT_FILE}`);
}

main();
