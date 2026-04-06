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
const US_RAW_DIR = path.join(DATA_DIR, 'raw', 'external', 'us');

const US_OCCUPATIONS_FILE = path.join(DATA_DIR, 'countries', 'us', 'occupations.json');
const ANTHROPIC_TASKS_FILE = path.join(DATA_DIR, 'raw', 'external', 'anthropic_task_penetration.csv');
const CPS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_cps_employment_2025.xlsx');
const OEWS_FILE = path.join(US_RAW_DIR, 'oesm24nat', 'oesm24nat', 'national_M2024_dl.xlsx');
const ORS_FILE = path.join(US_RAW_DIR, 'ors-complete-dataset.xlsx');
const OOH_FILE = path.join(US_RAW_DIR, 'ooh-xml-compilation.xml');
const SKILLS_FILE = path.join(US_RAW_DIR, 'skills.xlsx');

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

type SupportWageProfile = {
	employment: number | null;
	jobsPer1000: number | null;
	meanAnnual: number | null;
	medianAnnual: number | null;
	medianHourly: number | null;
	p10Annual: number | null;
	p25Annual: number | null;
	p75Annual: number | null;
	p90Annual: number | null;
	p10Hourly: number | null;
	p25Hourly: number | null;
	p75Hourly: number | null;
	p90Hourly: number | null;
};

type SupportDemandProfile = {
	employment2024: number | null;
	employment2034: number | null;
	projectedChange: number | null;
	projectedChangePct: number | null;
	openings2024_2034: number | null;
	medianWage2024: number | null;
	education: string | null;
	workExperience: string | null;
	onTheJobTraining: string | null;
	outlook: string | null;
	relatedOOHContent: string | null;
};

type SupportRequirement = {
	label: string;
	value: string;
	detail: string | null;
	tone: 'support' | 'neutral' | 'pressure' | 'protective';
};

type SupportNarrativeProfile = {
	description: string | null;
	whatTheyDo: string | null;
	workEnvironment: string | null;
	howToBecomeOne: string | null;
	pay: string | null;
	outlook: string | null;
	similarOccupations: string[];
	entryLevelEducation: string | null;
	workExperience: string | null;
	onTheJobTraining: string | null;
	medianPayAnnual: string | null;
	medianPayHourly: string | null;
	numberOfJobs: string | null;
	employmentOutlook: string | null;
	employmentOpenings: string | null;
};

type SupportSkillsProfile = {
	topSkills: string[];
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
	wageProfile: SupportWageProfile;
	demandProfile: SupportDemandProfile;
	requirementProfile: SupportRequirement[];
	narrativeProfile: SupportNarrativeProfile;
	skillsProfile: SupportSkillsProfile;
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

function normalizeSocCode(value: string): string {
	return String(value ?? '')
		.trim()
		.replace(/\.[0-9]+$/, '')
		.replace(/[^0-9]/g, '');
}

function socMajorGroupKey(value: string): string {
	const normalized = normalizeSocCode(value);
	if (normalized.length < 2) return normalized;
	return `${normalized.slice(0, 2)}0000`;
}

function parseNumericValue(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const text = String(value)
		.replace(/[$,%]/g, '')
		.replace(/[,]/g, '')
		.trim();
	if (!text || text === '#' || text === '—') return null;
	if (text.startsWith('<')) {
		const threshold = Number(text.slice(1));
		return Number.isFinite(threshold) ? threshold / 2 : null;
	}
	if (text.startsWith('>')) {
		const threshold = Number(text.slice(1));
		return Number.isFinite(threshold) ? threshold : null;
	}
	const parsed = Number(text);
	return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value: string | null | undefined): string | null {
	const text = String(value ?? '')
		.replace(/\s+/g, ' ')
		.replace(/\u00a0/g, ' ')
		.trim();
	if (!text || text === '—' || text === '-' || /^n\/a$/i.test(text) || /^na$/i.test(text)) {
		return null;
	}
	return text;
}

function stripHtml(value: string | null | undefined): string | null {
	if (!value) return null;
	const text = value
		.replace(/<!\[CDATA\[/g, ' ')
		.replace(/\]\]>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > 0 ? text : null;
}

function extractXmlTag(block: string, tag: string): string | null {
	const match = block.match(new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
	return match ? stripHtml(match[1] ?? null) : null;
}

function extractSummaryText(block: string, tag: string): string | null {
	const match = block.match(new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
	if (!match) return null;
	const inner = match[1] ?? '';
	const paragraph = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? inner;
	return stripHtml(paragraph);
}

function extractXmlTagValue(block: string, tag: string): string | null {
	const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
	const match = block.match(pattern);
	if (!match) return null;
	const inner = match[1] ?? '';
	const valueMatch = inner.match(/<value[^>]*>([\s\S]*?)<\/value>/i);
	return stripHtml(valueMatch ? valueMatch[1] : inner);
}

function parseOewsWageProfiles(): Map<string, SupportWageProfile> {
	const workbook = XLSX.readFile(OEWS_FILE, { raw: true });
	const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
	const profiles = new Map<string, SupportWageProfile>();

	for (const row of rows) {
		if (String(row.AREA_TITLE ?? '') !== 'U.S.') continue;
		if (String(row.O_GROUP ?? '').toLowerCase() !== 'detailed') continue;
		const code = normalizeSocCode(String(row.OCC_CODE ?? ''));
		if (!code) continue;
		profiles.set(code, {
			employment: parseNumericValue(row.TOT_EMP),
			jobsPer1000: parseNumericValue(row.JOBS_1000),
			meanAnnual: parseNumericValue(row.A_MEAN),
			medianAnnual: parseNumericValue(row.A_MEDIAN),
			medianHourly: parseNumericValue(row.H_MEDIAN),
			p10Annual: parseNumericValue(row.A_PCT10),
			p25Annual: parseNumericValue(row.A_PCT25),
			p75Annual: parseNumericValue(row.A_PCT75),
			p90Annual: parseNumericValue(row.A_PCT90),
			p10Hourly: parseNumericValue(row.H_PCT10),
			p25Hourly: parseNumericValue(row.H_PCT25),
			p75Hourly: parseNumericValue(row.H_PCT75),
			p90Hourly: parseNumericValue(row.H_PCT90)
		});
	}

	return profiles;
}

function parseSkillsProfiles(): Map<string, SupportDemandProfile & SupportSkillsProfile> {
	const workbook = XLSX.readFile(SKILLS_FILE, { raw: true });
	const sheet = workbook.Sheets['Table 6.2'];
	const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
	const profiles = new Map<string, SupportDemandProfile & SupportSkillsProfile>();

	for (const row of rows.slice(2)) {
		const title = cleanText(String(row[0] ?? ''));
		const code = normalizeSocCode(String(row[1] ?? ''));
		if (!title || !code) continue;
		const skills = [cleanText(String(row[10] ?? '')), cleanText(String(row[11] ?? '')), cleanText(String(row[12] ?? ''))]
			.filter((entry): entry is string => Boolean(entry) && entry !== '—');
		const relatedOOHContent = cleanText(String(row[13] ?? ''));
		profiles.set(code, {
			employment2024: parseNumericValue(row[2]),
			employment2034: parseNumericValue(row[3]),
			projectedChange: parseNumericValue(row[4]),
			projectedChangePct: parseNumericValue(row[5]),
			openings2024_2034: parseNumericValue(row[7]),
			medianWage2024: parseNumericValue(row[8]),
			education: cleanText(String(row[9] ?? '')),
			workExperience: null,
			onTheJobTraining: null,
			outlook: null,
			relatedOOHContent: relatedOOHContent && relatedOOHContent !== 'OOH Content' ? relatedOOHContent : null,
			topSkills: skills
		});
	}

	return profiles;
}

function parseOohProfiles(): Map<string, SupportNarrativeProfile> {
	const xml = fs.readFileSync(OOH_FILE, 'utf-8');
	const profiles = new Map<string, SupportNarrativeProfile>();

	for (const match of xml.matchAll(/<soc_code type="text">([\s\S]*?)<\/soc_code>/g)) {
		const code = cleanText(match[1] ?? null);
		if (!code) continue;
		if (profiles.has(code)) continue;
		const index = match.index ?? -1;
		if (index < 0) continue;
		const start = xml.lastIndexOf('<occupation>', index);
		const end = xml.indexOf('</occupation>', index);
		if (start < 0 || end < 0) continue;
		const block = xml.slice(start, end + '</occupation>'.length);
		const description = cleanText(extractXmlTag(block, 'description'));
		const whatTheyDo = cleanText(extractSummaryText(block, 'summary_what_they_do'));
		const workEnvironment = cleanText(extractSummaryText(block, 'summary_work_environment'));
		const howToBecomeOne = cleanText(extractSummaryText(block, 'summary_how_to_become_one'));
		const pay = cleanText(extractSummaryText(block, 'summary_pay'));
		const outlook = cleanText(extractSummaryText(block, 'summary_outlook'));
		const entryLevelEducation = cleanText(extractXmlTagValue(block, 'qf_entry_level_education'));
		const workExperience = cleanText(extractXmlTagValue(block, 'qf_work_experience'));
		const onTheJobTraining = cleanText(extractXmlTagValue(block, 'qf_on_the_job_training'));
		const medianPayAnnual = cleanText(extractXmlTagValue(block, 'qf_median_pay_annual'));
		const medianPayHourly = cleanText(extractXmlTagValue(block, 'qf_median_pay_hourly'));
		const numberOfJobs = cleanText(extractXmlTagValue(block, 'qf_number_of_jobs'));
		const employmentOutlook = cleanText(extractXmlTagValue(block, 'qf_employment_outlook'));
		const employmentOpenings = cleanText(extractXmlTagValue(block, 'qf_employment_openings'));
		const similarSection = block.match(/<similar_occupations>([\s\S]*?)<\/similar_occupations>/i)?.[1] ?? '';
		const similarOccupations = [...similarSection.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)]
			.map(match => stripHtml(match[1] ?? null))
			.filter((entry): entry is string => Boolean(entry));

		profiles.set(code, {
			description,
			whatTheyDo,
			workEnvironment,
			howToBecomeOne,
			pay,
			outlook,
			similarOccupations,
			entryLevelEducation,
			workExperience,
			onTheJobTraining,
			medianPayAnnual,
			medianPayHourly,
			numberOfJobs,
			employmentOutlook,
			employmentOpenings
		});
	}

	return profiles;
}

function parseOrsRequirementProfiles(): Map<string, Array<{ occupation: string; items: SupportRequirement[] }>> {
	const workbook = XLSX.readFile(ORS_FILE, { raw: true });
	const sheet = workbook.Sheets[workbook.SheetNames.find(name => name.includes('dataset')) ?? workbook.SheetNames[0] ?? ''];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
	const profiles = new Map<string, Array<{ occupation: string; items: SupportRequirement[] }>>();
	const priority = [
		'telework',
		'education',
		'training',
		'experience',
		'credentials',
		'work schedule variability',
		'work pace',
		'control of workload',
		'people skills',
		'verbal interactions',
		'work review',
		'sitting',
		'standing',
		'lifting or carrying',
		'strength',
		'outdoors',
		'noise intensity',
		'driving',
		'crowds'
	];

	function toneFor(category: string, estimate: string): SupportRequirement['tone'] {
		const text = `${category} ${estimate}`.toLowerCase();
		if (text.includes('telework')) return 'protective';
		if (text.includes('education') || text.includes('training') || text.includes('experience')) return 'pressure';
		if (text.includes('credentials')) return 'pressure';
		if (text.includes('work pace') || text.includes('control of workload') || text.includes('work review')) return 'pressure';
		if (text.includes('people skills') || text.includes('verbal interactions')) return 'support';
		return 'neutral';
	}

	for (const row of rows) {
		const occupation = cleanText(String(row.OCCUPATION ?? '')) ?? '';
		const code = socMajorGroupKey(String(row['2018 SOC CODE'] ?? ''));
		const category = cleanText(String(row.CATEGORY ?? '')) ?? '';
		const requirement = cleanText(String(row.REQUIREMENT ?? '')) ?? '';
		const estimateText = cleanText(String(row['ESTIMATE TEXT'] ?? '')) ?? '';
		const estimateRaw = cleanText(String(row.ESTIMATE ?? '')) ?? '';
		if (!code || !category || !estimateText) continue;
		const normalized = `${category} ${requirement}`.toLowerCase();
		if (!priority.some(token => normalized.includes(token))) continue;
		const buckets = profiles.get(code) ?? [];
		let bucket = buckets.find(entry => entry.occupation === occupation);
		if (!bucket) {
			bucket = { occupation, items: [] };
			buckets.push(bucket);
			profiles.set(code, buckets);
		}
		const label = category;
		if (bucket.items.some(entry => entry.label === label && entry.value === estimateText)) continue;
		bucket.items.push({
			label,
			value: estimateRaw ? `${estimateRaw}${estimateRaw.endsWith('%') ? '' : '%'}` : estimateText,
			detail: occupation ? `${occupation}${requirement ? ` · ${requirement}` : ''} · ${estimateText}` : `${requirement || estimateText}`,
			tone: toneFor(category, estimateText)
		});
	}

	for (const [code, buckets] of profiles) {
		for (const bucket of buckets) {
			bucket.items.sort((left, right) => {
				const leftIndex = priority.findIndex(token => `${left.label} ${left.detail ?? ''}`.toLowerCase().includes(token));
				const rightIndex = priority.findIndex(token => `${right.label} ${right.detail ?? ''}`.toLowerCase().includes(token));
				return (leftIndex === -1 ? priority.length : leftIndex) - (rightIndex === -1 ? priority.length : rightIndex);
			});
			bucket.items = bucket.items.slice(0, 8);
		}
		profiles.set(code, buckets);
	}

	return profiles;
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
	const oewsProfiles = parseOewsWageProfiles();
	const projectionProfiles = parseSkillsProfiles();
	const oohProfiles = parseOohProfiles();
	const orsProfiles = parseOrsRequirementProfiles();
	const cpsProfiles = parseCpsAgeProfiles();

	return occupations.map(occupation => {
		const soc = occupation.localCode;
		const socKey = normalizeSocCode(soc);
		const canonicalSoc = socMajorGroupKey(socKey);
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

		const wageProfile = oewsProfiles.get(socKey) ?? {
			employment: null,
			jobsPer1000: null,
			meanAnnual: null,
			medianAnnual: null,
			medianHourly: null,
			p10Annual: null,
			p25Annual: null,
			p75Annual: null,
			p90Annual: null,
			p10Hourly: null,
			p25Hourly: null,
			p75Hourly: null,
			p90Hourly: null
		};

		const projectionProfile = projectionProfiles.get(socKey) ?? {
			employment2024: null,
			employment2034: null,
			projectedChange: null,
			projectedChangePct: null,
			openings2024_2034: null,
			medianWage2024: null,
			education: null,
			workExperience: null,
			onTheJobTraining: null,
			outlook: null,
			relatedOOHContent: null,
			topSkills: []
		};

		const narrativeProfile = oohProfiles.get(soc) ?? oohProfiles.get(socKey) ?? oohProfiles.get(canonicalSoc) ?? {
			description: occupationData?.description ?? null,
			whatTheyDo: null,
			workEnvironment: null,
			howToBecomeOne: null,
			pay: null,
			outlook: null,
			similarOccupations: [],
			entryLevelEducation: null,
			workExperience: null,
			onTheJobTraining: null,
			medianPayAnnual: null,
			medianPayHourly: null,
			numberOfJobs: null,
			employmentOutlook: null,
			employmentOpenings: null
		};

		const orsBuckets = orsProfiles.get(canonicalSoc) ?? orsProfiles.get(socKey) ?? orsProfiles.get(soc) ?? [];
		const requirementProfile =
			orsBuckets
				.slice()
				.sort((left, right) => titleSimilarity(occupation.localTitle, right.occupation) - titleSimilarity(occupation.localTitle, left.occupation))[0]
				?.items ?? [];

		const skillsProfile = {
			topSkills: projectionProfile.topSkills ?? []
		};

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
			wageProfile,
			demandProfile: {
				employment2024: projectionProfile.employment2024,
				employment2034: projectionProfile.employment2034,
				projectedChange: projectionProfile.projectedChange,
				projectedChangePct: projectionProfile.projectedChangePct,
				openings2024_2034: projectionProfile.openings2024_2034,
				medianWage2024: projectionProfile.medianWage2024,
				education: projectionProfile.education ?? narrativeProfile.entryLevelEducation,
				workExperience: projectionProfile.workExperience ?? narrativeProfile.workExperience,
				onTheJobTraining: projectionProfile.onTheJobTraining ?? narrativeProfile.onTheJobTraining,
				outlook: projectionProfile.outlook ?? narrativeProfile.outlook,
				relatedOOHContent: projectionProfile.relatedOOHContent
			},
			requirementProfile,
			narrativeProfile,
			skillsProfile,
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
			note:
				'Built from O*NET occupation descriptions, task statements, technology skills, work context, Job Zones, Anthropic task penetration, BLS OEWS wages, BLS projection tables, BLS ORS requirements, BLS OOH narrative content, BLS skills data, and BLS CPS occupation age tables.',
			sourceVintage: 'O*NET 30.2 / OEWS 2024 / ORS 2025 / OOH 2025-08-28 / Projections 2024-34 / CPS 2025 / Anthropic task penetration'
		};
	});
}

function main() {
	const entries = buildSupportEntries();
	const payload = {
		generated_at: new Date().toISOString(),
		version: DATA_VINTAGE.model_version,
		source_vintage: 'O*NET 30.2 / OEWS 2024 / ORS 2025 / OOH 2025-08-28 / Projections 2024-34 / CPS 2025 / Anthropic task penetration',
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
