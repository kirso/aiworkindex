#!/usr/bin/env bun
/**
 * build-raw-data-audit.ts — Audit expected raw datasets and publish a simple
 * health/status report for data integrity and troubleshooting.
 *
 * Run: bun run scripts/build-raw-data-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const ROOT_DIR = path.join(import.meta.dir, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');
const EXTERNAL_DIR = path.join(RAW_DIR, 'external');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

type AuditStatus = 'valid' | 'placeholder_error' | 'missing' | 'reference_only';

interface AuditEntryDefinition {
	key: string;
	file: string;
	location: 'raw' | 'external';
	label: string;
	expectedType: 'csv' | 'json' | 'xlsx' | 'txt';
	usedBy: string[];
	referenceOnly?: boolean;
}

interface AuditEntryResult {
	key: string;
	file: string;
	label: string;
	status: AuditStatus;
	exists: boolean;
	expected_type: string;
	size_bytes: number | null;
	used_by: string[];
	note: string;
}

const AUDIT_DEFINITIONS: AuditEntryDefinition[] = [
	{
		key: 'employment_by_occupation',
		file: 'employment_by_occupation.csv',
		location: 'raw',
		label: 'Employment by occupation group',
		expectedType: 'csv',
		usedBy: ['score pipeline', 'market momentum']
	},
	{
		key: 'median_income_by_occupation',
		file: 'median_income_by_occupation.csv',
		location: 'raw',
		label: 'Median income by occupation group',
		expectedType: 'csv',
		usedBy: ['score pipeline', 'market momentum']
	},
	{
		key: 'vacancy_rates_by_occupation_group',
		file: 'vacancy_rates_by_occupation_group.csv',
		location: 'raw',
		label: 'Vacancy rates by occupation group',
		expectedType: 'csv',
		usedBy: ['labour monitor']
	},
	{
		key: 'job_vacancies_industry_occupation',
		file: 'job_vacancies_by_industry_and_occupation_quarterly.csv',
		location: 'raw',
		label: 'Job vacancies by industry and occupation',
		expectedType: 'csv',
		usedBy: ['industry context', 'labour monitor']
	},
	{
		key: 'recruitment_resignation_rates',
		file: 'recruitment_resignation_rates.csv',
		location: 'raw',
		label: 'Recruitment and resignation rates',
		expectedType: 'csv',
		usedBy: ['labour monitor hiring signal']
	},
	{
		key: 'recruitment_resignation_rates_cached_json',
		file: 'recruitment_resignation_rates.json',
		location: 'raw',
		label: 'Recruitment and resignation cached JSON',
		expectedType: 'json',
		usedBy: ['labour monitor troubleshooting'],
		referenceOnly: true
	},
	{
		key: 'retrenchment_by_occupation_group',
		file: 'retrenchment_by_occupation_group.csv',
		location: 'raw',
		label: 'Retrenchment by occupation group',
		expectedType: 'csv',
		usedBy: ['labour monitor retrenchment signal']
	},
	{
		key: 'lfr2024_section_d',
		file: 'LFR2024_SectionD.xlsx',
		location: 'raw',
		label: 'Labour Force 2024 Section D',
		expectedType: 'xlsx',
		usedBy: ['worker profile', 'employment basis']
	},
	{
		key: 'industry_x_occupation',
		file: 'industry_x_occupation.csv',
		location: 'raw',
		label: 'Industry x occupation employment',
		expectedType: 'csv',
		usedBy: ['industry context', 'industry momentum']
	},
	{
		key: 'wages_by_industry',
		file: 'wages_by_industry.xlsx',
		location: 'raw',
		label: 'Wages by industry',
		expectedType: 'xlsx',
		usedBy: ['sector wage anchors']
	},
	{
		key: 'wages_by_sex',
		file: 'wages_by_sex.xlsx',
		location: 'raw',
		label: 'Wages by sex',
		expectedType: 'xlsx',
		usedBy: ['worker profile']
	},
	{
		key: 'occupations_list',
		file: 'occupations_list.xlsx',
		location: 'raw',
		label: 'Occupation list workbook',
		expectedType: 'xlsx',
		usedBy: ['reference'],
		referenceOnly: true
	},
	{
		key: 'aioe',
		file: 'AIOE_DataAppendix.xlsx',
		location: 'external',
		label: 'Felten AIOE appendix',
		expectedType: 'xlsx',
		usedBy: ['exposure ensemble']
	},
	{
		key: 'anthropic_job_exposure',
		file: 'anthropic_job_exposure.csv',
		location: 'external',
		label: 'Anthropic job exposure',
		expectedType: 'csv',
		usedBy: ['exposure ensemble']
	},
	{
		key: 'eloundou_exposure',
		file: 'eloundou_gpts_occ_level.csv',
		location: 'external',
		label: 'Eloundou occupation exposure',
		expectedType: 'csv',
		usedBy: ['exposure ensemble']
	},
	{
		key: 'ilo_refined_index',
		file: 'ilo_genai_scores_isco08_2025.xlsx',
		location: 'external',
		label: 'ILO refined exposure index',
		expectedType: 'xlsx',
		usedBy: ['exposure ensemble']
	},
	{
		key: 'bls_projections',
		file: 'bls_projections_2024_2034.xlsx',
		location: 'external',
		label: 'BLS occupation projections',
		expectedType: 'xlsx',
		usedBy: ['proxy employment', 'convergent check']
	},
	{
		key: 'bls_cps_employment',
		file: 'bls_cps_employment_2025.xlsx',
		location: 'external',
		label: 'BLS CPS employment',
		expectedType: 'xlsx',
		usedBy: ['reference'],
		referenceOnly: true
	}
];

function resolveFilePath(def: AuditEntryDefinition): string {
	return path.join(def.location === 'raw' ? RAW_DIR : EXTERNAL_DIR, def.file);
}

function parseCsvPreview(filePath: string): { ok: boolean; note: string } {
	const content = fs.readFileSync(filePath, 'utf-8').trim();
	if (!content) return { ok: false, note: 'File is empty.' };
	const firstLine = content.split('\n')[0] ?? '';
	if (!firstLine.includes(',')) {
		return { ok: false, note: 'File does not appear to have CSV headers.' };
	}
	return { ok: true, note: `Header starts with: ${firstLine.slice(0, 120)}` };
}

function parseJsonPreview(filePath: string): { ok: boolean; note: string; placeholder: boolean } {
	const raw = fs.readFileSync(filePath, 'utf-8');
	if (!raw.trim()) return { ok: false, note: 'File is empty.', placeholder: false };
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if (
			typeof parsed.code === 'number' &&
			typeof parsed.name === 'string' &&
			typeof parsed.errorMsg === 'string'
		) {
			return {
				ok: false,
				note: `File contains API error payload: ${parsed.name}`,
				placeholder: true
			};
		}
		return { ok: true, note: 'Valid JSON payload.', placeholder: false };
	} catch (error) {
		return {
			ok: false,
			note: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
			placeholder: false
		};
	}
}

function parseWorkbookPreview(filePath: string): { ok: boolean; note: string } {
	try {
		const workbook = XLSX.readFile(filePath, { bookSheets: true });
		if (!workbook.SheetNames.length) return { ok: false, note: 'Workbook has no sheets.' };
		return {
			ok: true,
			note: `Workbook sheets: ${workbook.SheetNames.slice(0, 5).join(', ')}`
		};
	} catch (error) {
		return {
			ok: false,
			note: `Workbook could not be read: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

function auditEntry(def: AuditEntryDefinition): AuditEntryResult {
	const filePath = resolveFilePath(def);
	if (!fs.existsSync(filePath)) {
		return {
			key: def.key,
			file: def.file,
			label: def.label,
			status: 'missing',
			exists: false,
			expected_type: def.expectedType,
			size_bytes: null,
			used_by: def.usedBy,
			note: 'Expected raw file is not present locally.'
		};
	}

	const sizeBytes = fs.statSync(filePath).size;
	if (def.referenceOnly) {
		return {
			key: def.key,
			file: def.file,
			label: def.label,
			status: 'reference_only',
			exists: true,
			expected_type: def.expectedType,
			size_bytes: sizeBytes,
			used_by: def.usedBy,
			note: 'Reference/backstop file present locally, not currently used in the live pipeline.'
		};
	}

	if (def.expectedType === 'csv') {
		const preview = parseCsvPreview(filePath);
		return {
			key: def.key,
			file: def.file,
			label: def.label,
			status: preview.ok ? 'valid' : 'placeholder_error',
			exists: true,
			expected_type: def.expectedType,
			size_bytes: sizeBytes,
			used_by: def.usedBy,
			note: preview.note
		};
	}

	if (def.expectedType === 'json') {
		const preview = parseJsonPreview(filePath);
		return {
			key: def.key,
			file: def.file,
			label: def.label,
			status: preview.ok ? 'valid' : preview.placeholder ? 'placeholder_error' : 'missing',
			exists: true,
			expected_type: def.expectedType,
			size_bytes: sizeBytes,
			used_by: def.usedBy,
			note: preview.note
		};
	}

	if (def.expectedType === 'xlsx') {
		const preview = parseWorkbookPreview(filePath);
		return {
			key: def.key,
			file: def.file,
			label: def.label,
			status: preview.ok ? 'valid' : 'placeholder_error',
			exists: true,
			expected_type: def.expectedType,
			size_bytes: sizeBytes,
			used_by: def.usedBy,
			note: preview.note
		};
	}

	return {
		key: def.key,
		file: def.file,
		label: def.label,
		status: 'valid',
		exists: true,
		expected_type: def.expectedType,
		size_bytes: sizeBytes,
		used_by: def.usedBy,
		note: 'Present locally.'
	};
}

const results = AUDIT_DEFINITIONS.map(auditEntry);

const audit = {
	generated_at: new Date().toISOString(),
	summary: {
		valid: results.filter(entry => entry.status === 'valid').length,
		placeholder_error: results.filter(entry => entry.status === 'placeholder_error').length,
		missing: results.filter(entry => entry.status === 'missing').length,
		reference_only: results.filter(entry => entry.status === 'reference_only').length
	},
	entries: results
};

for (const outputPath of [
	path.join(DATA_DIR, 'raw-data-audit.json'),
	path.join(SRC_DATA_DIR, 'raw-data-audit.json'),
	path.join(STATIC_DATA_DIR, 'raw-data-audit.json')
]) {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2), 'utf-8');
}

console.log('Built raw data audit.');
