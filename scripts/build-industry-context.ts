#!/usr/bin/env bun
/**
 * build-industry-context.ts — Build a Singapore industry-context layer from
 * official industry × occupation employment and industry vacancy series.
 *
 * Inputs:
 *   - data/raw/industry_x_occupation.csv
 *   - data/raw/job_vacancies_by_industry_and_occupation_quarterly.csv
 *
 * Output:
 *   - data/industry-context.json
 *   - src/lib/data/industry-context.json
 *
 * The output is keyed by major occupation group and describes where that job
 * family sits in Singapore's economy. Vacancy series are industry-level, not
 * occupation-level, and are stored as contextual overlays rather than score inputs.
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const OUT_FILE = path.join(DATA_DIR, 'industry-context.json');
const SRC_OUT_FILE = path.join(
	import.meta.dir,
	'..',
	'src',
	'lib',
	'data',
	'industry-context.json'
);

type VacancySignal = 'rising' | 'stable' | 'cooling';

interface IndustryContextItem {
	key: string;
	label: string;
	employment_2025: number;
	share_2025: number;
	cagr_5y: number | null;
	change_2y: number | null;
	vacancy_latest: number | null;
	vacancy_quarter: string | null;
	vacancy_trend_4q_pct: number | null;
	vacancy_signal: VacancySignal | null;
}

interface GroupIndustryContext {
	major_group: string;
	total_employment_2025: number;
	top_industries: IndustryContextItem[];
	fastest_growing_industries: IndustryContextItem[];
}

interface IndustryContextMetadata {
	employment_vintage: string;
	vacancy_overlay_vintage: string;
	vacancy_overlay_source_note: string;
}

interface IndustryContextOutput {
	metadata: IndustryContextMetadata;
	groups: Record<string, GroupIndustryContext>;
}

type OutputGroups = Record<string, GroupIndustryContext>;

const GROUP_LABELS: Record<string, string> = {
	'Managers & Administrators (Including Working Proprietors)': 'MANAGERS',
	Professionals: 'PROFESSIONALS',
	'Associate Professionals & Technicians': 'ASSOCIATE PROFESSIONALS AND TECHNICIANS',
	'Clerical Support Workers': 'CLERICAL SUPPORT WORKERS',
	'Service & Sales Workers': 'SERVICE AND SALES WORKERS',
	'Craftsmen & Related Trades Workers': 'CRAFTSMEN AND RELATED TRADES WORKERS',
	'Plant & Machine Operators & Assemblers': 'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
	'Cleaners, Labourers & Related Workers': 'CLEANERS, LABOURERS AND RELATED WORKERS'
};

const INDUSTRY_LABELS: Record<string, { key: string; label: string }> = {
	Manufacturing: { key: 'manufacturing', label: 'Manufacturing' },
	Construction: { key: 'construction', label: 'Construction' },
	'Wholesale & Retail Trade': {
		key: 'wholesale_retail_trade',
		label: 'Wholesale & Retail Trade'
	},
	'Transportation & Storage': {
		key: 'transportation_storage',
		label: 'Transportation & Storage'
	},
	'Accommodation & Food Services': {
		key: 'accommodation_food_services',
		label: 'Accommodation & Food Services'
	},
	'Information & Communications': {
		key: 'information_communications',
		label: 'Information & Communications'
	},
	'Financial & Insurance Services': {
		key: 'financial_insurance_services',
		label: 'Financial & Insurance Services'
	},
	'Real Estate Services': { key: 'real_estate_services', label: 'Real Estate Services' },
	'Professional Services': { key: 'professional_services', label: 'Professional Services' },
	'Administrative & Support Services': {
		key: 'administrative_support_services',
		label: 'Administrative & Support Services'
	},
	'Public Administration & Education Services': {
		key: 'public_admin_education',
		label: 'Public Administration & Education Services'
	},
	'Health & Social Services': {
		key: 'health_social_services',
		label: 'Health & Social Services'
	},
	'Arts, Entertainment & Recreation': {
		key: 'arts_entertainment_recreation',
		label: 'Arts, Entertainment & Recreation'
	},
	'Other Community, Social & Personal Services': {
		key: 'other_community_social_personal',
		label: 'Other Community, Social & Personal Services'
	},
	'Other Industries Nes': { key: 'other_industries', label: 'Other Industries NES' }
};

const VACANCY_LABELS: Record<string, string> = {
	Manufacturing: 'manufacturing',
	Construction: 'construction',
	'Wholesale And Retail Trade': 'wholesale_retail_trade',
	'Transportation And Storage': 'transportation_storage',
	'Accommodation And Food Services': 'accommodation_food_services',
	'Information And Communications': 'information_communications',
	'Financial And Insurance Services': 'financial_insurance_services',
	'Real Estate Services': 'real_estate_services',
	'Professional Services': 'professional_services',
	'Administrative And Support Services': 'administrative_support_services',
	'Public Administration & Education': 'public_admin_education',
	'Health & Social Services': 'health_social_services',
	'Arts, Entertainment & Recreation': 'arts_entertainment_recreation',
	'Other Community, Social & Personal Services': 'other_community_social_personal'
};

function parseCSVRow(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') inQuotes = !inQuotes;
		else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else current += ch;
	}
	result.push(current);
	return result;
}

function cleanLabel(raw: string): string {
	return raw.replace(/^"+|"+$/g, '').trim();
}

function indentLevel(rawLabel: string): number {
	let count = 0;
	for (const char of rawLabel) {
		if (char === ' ') count++;
		else break;
	}
	return count;
}

function parseNumber(value: string | undefined): number | null {
	if (!value) return null;
	const cleaned = value.trim().toLowerCase();
	if (!cleaned || cleaned === 'na' || cleaned === '-' || cleaned === 'n.a.') return null;
	const parsed = parseFloat(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
}

function cagr(startValue: number, endValue: number, years: number): number | null {
	if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
	return Math.pow(endValue / startValue, 1 / years) - 1;
}

function change(startValue: number, endValue: number): number | null {
	if (startValue <= 0) return null;
	return (endValue - startValue) / startValue;
}

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function vacancySignalFromTrend(trend: number | null): VacancySignal | null {
	if (trend === null) return null;
	if (trend > 0.05) return 'rising';
	if (trend < -0.05) return 'cooling';
	return 'stable';
}

function parseEmploymentByIndustry(): OutputGroups {
	const lines = fs
		.readFileSync(path.join(RAW_DIR, 'industry_x_occupation.csv'), 'utf-8')
		.split('\n')
		.filter(Boolean);
	const header = parseCSVRow(lines[0]);
	const idx2025 = header.indexOf('2025');
	const idx2023 = header.indexOf('2023');
	const idx2020 = header.indexOf('2020');
	if (idx2025 < 0 || idx2023 < 0 || idx2020 < 0) {
		throw new Error('Missing required year columns in industry_x_occupation.csv');
	}

	const output: OutputGroups = {};
	let currentGroup: string | null = null;

	for (const line of lines.slice(1)) {
		const fields = parseCSVRow(line);
		const rawLabel = fields[0];
		const label = cleanLabel(rawLabel);
		const indent = indentLevel(rawLabel);

		if (indent === 0 && GROUP_LABELS[label]) {
			currentGroup = GROUP_LABELS[label];
			output[currentGroup] = {
				major_group: currentGroup,
				total_employment_2025: parseNumber(fields[idx2025]) ?? 0,
				top_industries: [],
				fastest_growing_industries: []
			};
			continue;
		}

		if (!currentGroup || indent !== 8) continue;
		const industry = INDUSTRY_LABELS[label];
		if (!industry) continue;

		const employment2025 = parseNumber(fields[idx2025]);
		const employment2023 = parseNumber(fields[idx2023]);
		const employment2020 = parseNumber(fields[idx2020]);
		if (employment2025 === null) continue;

		const total = output[currentGroup].total_employment_2025 || 1;
		const item: IndustryContextItem = {
			key: industry.key,
			label: industry.label,
			employment_2025: round(employment2025, 1),
			share_2025: round(employment2025 / total, 4),
			cagr_5y:
				employment2020 !== null && employment2025 !== null
					? round(cagr(employment2020, employment2025, 5) ?? 0, 6)
					: null,
			change_2y:
				employment2023 !== null && employment2025 !== null
					? round(change(employment2023, employment2025) ?? 0, 6)
					: null,
			vacancy_latest: null,
			vacancy_quarter: null,
			vacancy_trend_4q_pct: null,
			vacancy_signal: null
		};
		output[currentGroup].top_industries.push(item);
	}

	for (const group of Object.values(output)) {
		group.top_industries.sort((a, b) => b.share_2025 - a.share_2025);
		group.fastest_growing_industries = [...group.top_industries]
			.filter(item => item.share_2025 >= 0.03 && item.cagr_5y !== null)
			.sort((a, b) => (b.cagr_5y ?? -999) - (a.cagr_5y ?? -999))
			.slice(0, 3);
		group.top_industries = group.top_industries.slice(0, 5);
	}

	return output;
}

function parseVacancyByIndustry(): Map<
	string,
	Omit<IndustryContextItem, 'employment_2025' | 'share_2025' | 'cagr_5y' | 'change_2y'>
> {
	const lines = fs
		.readFileSync(
			path.join(RAW_DIR, 'job_vacancies_by_industry_and_occupation_quarterly.csv'),
			'utf-8'
		)
		.split('\n')
		.filter(Boolean);
	const header = parseCSVRow(lines[0]);
	const latestIdx = header.indexOf('20253Q');
	const yoyIdx = header.indexOf('20243Q');
	if (latestIdx < 0 || yoyIdx < 0) {
		throw new Error('Missing vacancy columns 20253Q / 20243Q');
	}

	const vacancyByIndustry = new Map<
		string,
		Omit<IndustryContextItem, 'employment_2025' | 'share_2025' | 'cagr_5y' | 'change_2y'>
	>();
	let inCommunitySection = false;

	for (const line of lines.slice(1)) {
		const fields = parseCSVRow(line);
		const rawLabel = fields[0];
		const label = cleanLabel(rawLabel);
		const indent = indentLevel(rawLabel);
		if (label === 'Community, Social And Personal Services') {
			inCommunitySection = true;
			continue;
		}
		if (indent === 0 && label !== 'Community, Social And Personal Services') {
			inCommunitySection = false;
		}

		if (indent !== 8) continue;

		const normalizedKey =
			(inCommunitySection ? VACANCY_LABELS[label] : VACANCY_LABELS[label]) ?? null;
		if (!normalizedKey) continue;

		const latest = parseNumber(fields[latestIdx]);
		const yoy = parseNumber(fields[yoyIdx]);
		const trend = latest !== null && yoy !== null && yoy > 0 ? (latest - yoy) / yoy : null;
		vacancyByIndustry.set(normalizedKey, {
			key: normalizedKey,
			label: label.replace(/ And /g, ' & '),
			vacancy_latest: latest !== null ? round(latest, 0) : null,
			vacancy_quarter: '2025 Q3',
			vacancy_trend_4q_pct: trend !== null ? round(trend, 4) : null,
			vacancy_signal: vacancySignalFromTrend(trend)
		});
	}

	return vacancyByIndustry;
}

function main() {
	console.log('=== Building Industry Context ===\n');

	const groups = parseEmploymentByIndustry();
	const vacancies = parseVacancyByIndustry();

	for (const group of Object.values(groups)) {
		for (const item of [...group.top_industries, ...group.fastest_growing_industries]) {
			const vacancy = vacancies.get(item.key);
			if (!vacancy) continue;
			item.vacancy_latest = vacancy.vacancy_latest;
			item.vacancy_quarter = vacancy.vacancy_quarter;
			item.vacancy_trend_4q_pct = vacancy.vacancy_trend_4q_pct;
			item.vacancy_signal = vacancy.vacancy_signal;
		}
	}

	const output: IndustryContextOutput = {
		metadata: {
			employment_vintage: '2025',
			vacancy_overlay_vintage: '2025 Q3',
			vacancy_overlay_source_note:
				'Industry-level vacancy overlays use the latest published detailed industry-by-occupation cross-tab, which currently lags the main cluster labour monitor.'
		},
		groups
	};

	const json = JSON.stringify(output, null, 2);
	fs.writeFileSync(OUT_FILE, json);
	fs.mkdirSync(path.dirname(SRC_OUT_FILE), { recursive: true });
	fs.writeFileSync(SRC_OUT_FILE, json);

	console.log(`Wrote ${OUT_FILE}`);
	console.log(`Copied to ${SRC_OUT_FILE}`);
	console.log(`Groups: ${Object.keys(groups).length}`);
}

main();
