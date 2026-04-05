#!/usr/bin/env bun
/**
 * fetch-postings.ts — Fetch Singapore job postings into raw source snapshots.
 *
 * V1 source strategy:
 *   - MyCareersFuture: active source adapter
 *   - JobStreet: optional external adapter behind env/config
 *   - LinkedIn: intentionally deferred; partner-gated, not part of canonical monitor
 *
 * Outputs: data/postings/raw/{source}-{date}.json
 *
 * Run:
 *   bun run scripts/pipelines/fetch-postings.ts
 *
 * Optional env:
 *   MCF_POSTINGS_API_URL=https://...
 *   MCF_POSTINGS_QUERY=...
 *   MCF_POSTINGS_LIMIT=50
 *   MCF_POSTINGS_MAX_PAGES=10
 *   MCF_POSTINGS_SESSION_ID=...
 *   ENABLE_JOBSTREET_PUBLIC_FETCH=1
 *   JOBSTREET_POSTINGS_API_URL=https://...
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..', '..');
const RAW_OUT_DIR = path.join(ROOT_DIR, 'data', 'postings', 'raw');
const SOURCE_REGISTRY_FILE = path.join(ROOT_DIR, 'data', 'postings', 'source-registry.json');

export interface RawPosting {
	source: 'mycareersfuture' | 'jobstreet' | 'greenhouse' | 'lever' | 'ashby';
	source_id: string;
	source_confidence: 'official_sg_job_portal' | 'external_job_board' | 'employer_career_site';
	url: string | null;
	title: string;
	employer: string;
	sector: string;
	location: string | null;
	employment_type: string | null;
	seniority: string | null;
	work_arrangement: string | null;
	salary_currency: string | null;
	salary_min: number | null;
	salary_max: number | null;
	skills: string[];
	ai_tools_mentioned: string[];
	posted_date: string;
	fetched_at: string;
	ssoc_inferred: string | null;
	role_slug_inferred: string | null;
}

interface SourceAdapter {
	name: RawPosting['source'];
	active: boolean;
	fetch: () => Promise<RawPosting[]>;
}

interface SourceRegistryEntry {
	key: string;
	employer: string;
	source_type: 'greenhouse' | 'lever' | 'ashby';
	board_token: string;
	careers_url: string;
	region: 'singapore';
	active?: boolean;
	location_keywords?: string[];
}

async function fetchFirstSuccessfulJson(candidates: URL[]): Promise<unknown> {
	let lastError: unknown = null;
	for (const url of candidates) {
		try {
			return await fetchJson(url);
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError instanceof Error ? lastError : new Error('All candidate URLs failed');
}

function uniqueTokens(source: SourceRegistryEntry): string[] {
	return [
		...new Set([source.board_token, source.board_token.toLowerCase(), source.key].filter(Boolean))
	];
}

function normalizeWhitespace(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const normalized = value.replace(/\s+/g, ' ').trim();
	return normalized.length > 0 ? normalized : null;
}

function toNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const cleaned = value.replace(/[^0-9.-]/g, '');
		if (!cleaned) return null;
		const parsed = Number(cleaned);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.map(entry => normalizeWhitespace(entry))
		.filter((entry): entry is string => entry !== null);
}

function extractValue<T = unknown>(record: Record<string, unknown>, keys: string[]): T | null {
	for (const key of keys) {
		const value = record[key];
		if (value !== undefined && value !== null && value !== '') {
			return value as T;
		}
	}
	return null;
}

function extractDate(value: unknown): string | null {
	const normalized = normalizeWhitespace(value);
	if (!normalized) return null;
	const parsed = new Date(normalized);
	return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function inferAiTools(title: string, skills: string[]): string[] {
	const haystack = `${title} ${skills.join(' ')}`.toLowerCase();
	const tools = [
		'chatgpt',
		'copilot',
		'claude',
		'gemini',
		'midjourney',
		'cursor',
		'notion ai',
		'power bi',
		'tableau',
		'salesforce'
	];
	return tools.filter(tool => haystack.includes(tool));
}

function extractSkillsFromText(text: string): string[] {
	const catalog: Array<{ label: string; pattern: RegExp }> = [
		{ label: 'SQL', pattern: /\bsql\b/i },
		{ label: 'Python', pattern: /\bpython\b/i },
		{ label: 'Java', pattern: /\bjava\b/i },
		{ label: 'JavaScript', pattern: /\bjavascript\b/i },
		{ label: 'TypeScript', pattern: /\btypescript\b/i },
		{ label: 'React', pattern: /\breact\b/i },
		{ label: 'Node.js', pattern: /\bnode(?:\.js)?\b/i },
		{ label: 'Go', pattern: /\bgolang\b|\bgo\b/i },
		{ label: 'C++', pattern: /\bc\+\+\b/i },
		{ label: 'C#', pattern: /\bc#\b/i },
		{ label: 'AWS', pattern: /\baws\b|amazon web services/i },
		{ label: 'GCP', pattern: /\bgcp\b|google cloud/i },
		{ label: 'Azure', pattern: /\bazure\b/i },
		{ label: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i },
		{ label: 'Docker', pattern: /\bdocker\b/i },
		{ label: 'Terraform', pattern: /\bterraform\b/i },
		{ label: 'Snowflake', pattern: /\bsnowflake\b/i },
		{ label: 'Databricks', pattern: /\bdatabricks\b/i },
		{ label: 'Power BI', pattern: /\bpower bi\b/i },
		{ label: 'Tableau', pattern: /\btableau\b/i },
		{
			label: 'Salesforce',
			pattern:
				/\bsfdc\b|\bsalesforce (?:crm|platform|admin|administrator|developer|service cloud|marketing cloud)\b/i
		},
		{ label: 'Figma', pattern: /\bfigma\b/i },
		{ label: 'Product Management', pattern: /\bproduct management\b/i },
		{ label: 'Stakeholder Management', pattern: /\bstakeholder management\b/i },
		{ label: 'Data Analysis', pattern: /\bdata analysis\b/i },
		{ label: 'Machine Learning', pattern: /\bmachine learning\b/i },
		{ label: 'LLM', pattern: /\bllm\b|large language model/i },
		{ label: 'KYC', pattern: /\bkyc\b/i },
		{ label: 'AML', pattern: /\baml\b/i },
		{ label: 'Risk Management', pattern: /\brisk management\b/i }
	];

	return catalog.filter(entry => entry.pattern.test(text)).map(entry => entry.label);
}

function inferAiToolsFromText(title: string, text: string): string[] {
	const haystack = text.toLowerCase();
	const tools: Array<{ label: string; pattern: RegExp }> = [
		{ label: 'chatgpt', pattern: /\bchatgpt\b/i },
		{ label: 'copilot', pattern: /\bcopilot\b/i },
		{ label: 'claude', pattern: /\bclaude\b/i },
		{ label: 'gemini', pattern: /\bgemini\b/i },
		{ label: 'midjourney', pattern: /\bmidjourney\b/i },
		{ label: 'cursor', pattern: /\bcursor\b/i },
		{ label: 'notion ai', pattern: /\bnotion ai\b/i },
		{ label: 'power bi', pattern: /\bpower bi\b/i },
		{ label: 'tableau', pattern: /\btableau\b/i },
		{
			label: 'salesforce',
			pattern:
				/\bsfdc\b|\bsalesforce (?:crm|platform|admin|administrator|developer|service cloud|marketing cloud)\b/i
		}
	];
	return [
		...new Set([
			...inferAiTools(title, extractSkillsFromText(text)),
			...tools.filter(tool => tool.pattern.test(haystack)).map(tool => tool.label)
		])
	];
}

function inferSeniority(title: string): string | null {
	const lower = title.toLowerCase();
	if (/\b(head|director|vp|vice president|chief|principal|lead)\b/.test(lower)) return 'senior';
	if (/\b(manager|senior)\b/.test(lower)) return 'mid';
	if (/\b(intern|junior|associate|entry)\b/.test(lower)) return 'entry';
	return null;
}

function inferWorkArrangement(description: string): string | null {
	const lower = description.toLowerCase();
	if (/\bremote\b/.test(lower)) return 'remote';
	if (/\bhybrid\b/.test(lower)) return 'hybrid';
	if (/\bonsite\b|\bon-site\b/.test(lower)) return 'onsite';
	return null;
}

function stripHtml(value: string | null): string {
	if (!value) return '';
	return value
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function isSingaporeRelevant(input: {
	title: string;
	location?: string | null;
	description?: string | null;
	extraLocations?: string[];
	keywords?: string[];
}): boolean {
	const locationText = [input.location ?? '', ...(input.extraLocations ?? [])]
		.join(' ')
		.toLowerCase();
	const contentText = [input.title, input.description ?? ''].join(' ').toLowerCase();
	const locationLooksSingapore =
		locationText.includes('singapore') ||
		locationText.includes('sg - singapore') ||
		locationText.includes('sg, singapore');
	const keywordMatch = (input.keywords ?? []).some(keyword =>
		contentText.includes(keyword.toLowerCase())
	);

	if (locationText.trim().length > 0) {
		return locationLooksSingapore;
	}

	return (
		contentText.includes('based in singapore') ||
		contentText.includes('located in singapore') ||
		contentText.includes('singapore office') ||
		contentText.includes('singapore market') ||
		contentText.includes('relocate to singapore') ||
		keywordMatch
	);
}

function isSingaporeLocationText(value: string | null | undefined): boolean {
	const text = (value ?? '').toLowerCase();
	return (
		text.includes('singapore') || text.includes('sg - singapore') || text.includes('sg, singapore')
	);
}

async function fetchJson(
	url: URL,
	options?: { method?: 'GET' | 'POST'; headers?: Record<string, string>; body?: string }
): Promise<unknown> {
	const response = await fetch(url, {
		signal: AbortSignal.timeout(30000),
		method: options?.method ?? 'GET',
		headers: {
			accept: 'application/json',
			...(options?.headers ?? {})
		},
		body: options?.body
	});
	if (!response.ok) {
		throw new Error(`Request failed (${response.status}) for ${url.toString()}`);
	}
	return await response.json();
}

function readSourceRegistry(): SourceRegistryEntry[] {
	if (!fs.existsSync(SOURCE_REGISTRY_FILE)) return [];
	return (
		JSON.parse(fs.readFileSync(SOURCE_REGISTRY_FILE, 'utf-8')) as SourceRegistryEntry[]
	).filter(entry => entry.active !== false);
}

function coerceRecordArray(payload: unknown): Array<Record<string, unknown>> {
	if (Array.isArray(payload)) {
		return payload.filter(
			(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
		);
	}
	if (payload && typeof payload === 'object') {
		const record = payload as Record<string, unknown>;
		const candidates = ['data', 'results', 'items', 'jobs', 'jobPostings'];
		for (const key of candidates) {
			if (Array.isArray(record[key])) {
				return (record[key] as unknown[]).filter(
					(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
				);
			}
		}
	}
	return [];
}

function parseMyCareersFuturePosting(
	entry: Record<string, unknown>,
	fetchedAt: string
): RawPosting | null {
	const title = normalizeWhitespace(extractValue(entry, ['title']));
	if (!title) return null;

	const metadata = (entry.metadata as Record<string, unknown> | undefined) ?? {};
	const postedCompany = (entry.postedCompany as Record<string, unknown> | undefined) ?? {};
	const hiringCompany = (entry.hiringCompany as Record<string, unknown> | undefined) ?? {};
	const address = (entry.address as Record<string, unknown> | undefined) ?? {};
	const districts = Array.isArray(address.districts)
		? (address.districts as Array<Record<string, unknown>>)
		: [];
	const location =
		normalizeWhitespace(
			districts
				.map(district => district.region ?? district.location)
				.filter(Boolean)
				.join(', ') || null
		) ??
		(address.isOverseas ? normalizeWhitespace(extractValue(address, ['foreignAddress1'])) : null);
	const skills = Array.isArray(entry.skills)
		? (entry.skills as Array<Record<string, unknown>>)
				.map(skill => normalizeWhitespace(extractValue(skill, ['skill'])))
				.filter((skill): skill is string => skill !== null)
		: [];
	const employmentTypes = Array.isArray(entry.employmentTypes)
		? (entry.employmentTypes as Array<Record<string, unknown>>)
				.map(type => normalizeWhitespace(extractValue(type, ['employmentType'])))
				.filter((type): type is string => type !== null)
		: [];
	const positionLevels = Array.isArray(entry.positionLevels)
		? (entry.positionLevels as Array<Record<string, unknown>>)
				.map(level => normalizeWhitespace(extractValue(level, ['position'])))
				.filter((level): level is string => level !== null)
		: [];
	const categories = Array.isArray(entry.categories)
		? (entry.categories as Array<Record<string, unknown>>)
				.map(category => normalizeWhitespace(extractValue(category, ['category'])))
				.filter((category): category is string => category !== null)
		: [];
	const flexibleWorkArrangements = Array.isArray(entry.flexibleWorkArrangements)
		? (entry.flexibleWorkArrangements as Array<Record<string, unknown>>)
				.map(arrangement =>
					normalizeWhitespace(extractValue(arrangement, ['arrangement', 'title']))
				)
				.filter((arrangement): arrangement is string => arrangement !== null)
		: [];
	const salary = (entry.salary as Record<string, unknown> | undefined) ?? {};

	return {
		source: 'mycareersfuture',
		source_id:
			normalizeWhitespace(extractValue(metadata, ['jobPostId'])) ??
			normalizeWhitespace(extractValue(entry, ['uuid', 'id', 'jobId'])) ??
			`mcf-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		source_confidence: 'official_sg_job_portal',
		url:
			normalizeWhitespace(extractValue(metadata, ['jobDetailsUrl'])) ??
			normalizeWhitespace(extractValue(entry, ['jobUrl', 'url', 'postingUrl'])),
		title,
		employer:
			normalizeWhitespace(extractValue(postedCompany, ['name'])) ??
			normalizeWhitespace(extractValue(hiringCompany, ['name'])) ??
			'Unknown employer',
		sector: categories.join(', ') || 'Unspecified sector',
		location,
		employment_type: employmentTypes.join(', ') || null,
		seniority: positionLevels.join(', ') || inferSeniority(title),
		work_arrangement: flexibleWorkArrangements.join(', ') || null,
		salary_currency: 'SGD',
		salary_min: toNumber(extractValue(salary, ['minimum'])),
		salary_max: toNumber(extractValue(salary, ['maximum'])),
		skills,
		ai_tools_mentioned: inferAiTools(title, skills),
		posted_date:
			extractDate(extractValue(metadata, ['updatedAt', 'newPostingDate'])) ??
			extractDate(extractValue(entry, ['postedDate', 'datePosted', 'createdAt'])) ??
			fetchedAt,
		fetched_at: fetchedAt,
		ssoc_inferred: null,
		role_slug_inferred: null
	};
}

function parseJobStreetPosting(
	entry: Record<string, unknown>,
	fetchedAt: string
): RawPosting | null {
	const title = normalizeWhitespace(extractValue(entry, ['title', 'jobTitle', 'positionTitle']));
	if (!title) return null;
	const skills = toStringArray(extractValue(entry, ['skills', 'skillTags']) ?? []);
	const description = normalizeWhitespace(extractValue(entry, ['description', 'summary'])) ?? '';

	return {
		source: 'jobstreet',
		source_id:
			normalizeWhitespace(extractValue(entry, ['id', 'jobId', 'listingId'])) ??
			`jobstreet-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		source_confidence: 'external_job_board',
		url: normalizeWhitespace(extractValue(entry, ['url', 'jobUrl', 'listingUrl'])),
		title,
		employer:
			normalizeWhitespace(extractValue(entry, ['company', 'companyName', 'employer'])) ??
			'Unknown employer',
		sector:
			normalizeWhitespace(extractValue(entry, ['industry', 'sector'])) ?? 'Unspecified sector',
		location: normalizeWhitespace(extractValue(entry, ['location', 'suburb', 'area'])),
		employment_type: normalizeWhitespace(extractValue(entry, ['employmentType', 'jobType'])),
		seniority:
			normalizeWhitespace(extractValue(entry, ['seniority', 'experienceLevel'])) ??
			inferSeniority(title),
		work_arrangement:
			normalizeWhitespace(extractValue(entry, ['workArrangement'])) ??
			inferWorkArrangement(description),
		salary_currency:
			normalizeWhitespace(extractValue(entry, ['salaryCurrency', 'currency'])) ?? 'SGD',
		salary_min: toNumber(extractValue(entry, ['salaryMin', 'salary_min', 'minSalary'])),
		salary_max: toNumber(extractValue(entry, ['salaryMax', 'salary_max', 'maxSalary'])),
		skills,
		ai_tools_mentioned: inferAiTools(title, skills),
		posted_date:
			extractDate(extractValue(entry, ['postedDate', 'datePosted', 'createdAt'])) ?? fetchedAt,
		fetched_at: fetchedAt,
		ssoc_inferred: normalizeWhitespace(extractValue(entry, ['ssoc', 'ssocCode'])),
		role_slug_inferred: null
	};
}

function parseGreenhousePosting(
	entry: Record<string, unknown>,
	source: SourceRegistryEntry,
	fetchedAt: string
): RawPosting | null {
	const title = normalizeWhitespace(extractValue(entry, ['title']));
	if (!title) return null;

	const content = stripHtml(normalizeWhitespace(extractValue(entry, ['content'])) ?? '');
	const extractedSkills = extractSkillsFromText(`${title} ${content}`);
	const metadata = Array.isArray(entry.metadata)
		? (entry.metadata as Array<Record<string, unknown>>)
		: [];
	const location =
		normalizeWhitespace(
			(entry.location as Record<string, unknown> | undefined)?.name ??
				extractValue(entry, ['location'])
		) ?? null;
	const salaryField = metadata.find(field =>
		String(field.name ?? field.label ?? '')
			.toLowerCase()
			.includes('salary')
	);
	const salaryText =
		normalizeWhitespace(
			(typeof salaryField?.value === 'object' ? null : salaryField?.value) ??
				(typeof salaryField?.value === 'string' ? salaryField.value : null)
		) ?? null;

	if (
		!isSingaporeRelevant({
			title,
			location,
			description: content,
			keywords: source.location_keywords
		})
	) {
		return null;
	}

	return {
		source: 'greenhouse',
		source_id: String(extractValue(entry, ['id']) ?? `${source.key}-${title}`),
		source_confidence: 'employer_career_site',
		url: normalizeWhitespace(extractValue(entry, ['absolute_url', 'internal_job_id'])),
		title,
		employer: source.employer,
		sector:
			normalizeWhitespace(
				(entry.departments as Array<Record<string, unknown>> | undefined)?.[0]?.name ??
					extractValue(entry, ['department'])
			) ?? 'Unspecified sector',
		location,
		employment_type: normalizeWhitespace(extractValue(entry, ['employment_type'])),
		seniority: inferSeniority(title),
		work_arrangement: inferWorkArrangement(content),
		salary_currency: salaryText ? 'SGD' : null,
		salary_min: salaryText ? toNumber(salaryText.split('-')[0] ?? salaryText) : null,
		salary_max: salaryText ? toNumber(salaryText.split('-')[1] ?? salaryText) : null,
		skills: extractedSkills,
		ai_tools_mentioned: inferAiToolsFromText(title, `${title} ${content}`),
		posted_date: extractDate(extractValue(entry, ['updated_at', 'created_at'])) ?? fetchedAt,
		fetched_at: fetchedAt,
		ssoc_inferred: null,
		role_slug_inferred: null
	};
}

function parseLeverPosting(
	entry: Record<string, unknown>,
	source: SourceRegistryEntry,
	fetchedAt: string
): RawPosting | null {
	const title = normalizeWhitespace(extractValue(entry, ['text']));
	if (!title) return null;
	const categories = (entry.categories as Record<string, unknown> | undefined) ?? {};
	const additionalLocations = toStringArray(extractValue(entry, ['additionalLocations']) ?? []);
	const primaryLocation =
		normalizeWhitespace(categories.location) ??
		normalizeWhitespace(
			Array.isArray(entry.workplaceType) ? (entry.workplaceType as string[]).join(' ') : null
		);
	const location = additionalLocations.find(isSingaporeLocationText) ?? primaryLocation;
	const description = stripHtml(
		normalizeWhitespace(extractValue(entry, ['descriptionPlain', 'description'])) ?? ''
	);
	const extractedSkills = extractSkillsFromText(`${title} ${description}`);
	if (location && !isSingaporeLocationText(location)) {
		return null;
	}

	if (
		!isSingaporeRelevant({
			title,
			location,
			description,
			extraLocations: additionalLocations,
			keywords: source.location_keywords
		})
	) {
		return null;
	}

	return {
		source: 'lever',
		source_id: String(extractValue(entry, ['id']) ?? `${source.key}-${title}`),
		source_confidence: 'employer_career_site',
		url: normalizeWhitespace(extractValue(entry, ['hostedUrl', 'applyUrl'])),
		title,
		employer: source.employer,
		sector:
			normalizeWhitespace(categories.team) ??
			normalizeWhitespace(categories.department) ??
			'Unspecified sector',
		location,
		employment_type: normalizeWhitespace(categories.commitment),
		seniority: inferSeniority(title),
		work_arrangement:
			normalizeWhitespace(extractValue(entry, ['workplaceType'])) ??
			inferWorkArrangement(description),
		salary_currency: 'SGD',
		salary_min: toNumber((entry.salaryRange as Record<string, unknown> | undefined)?.min),
		salary_max: toNumber((entry.salaryRange as Record<string, unknown> | undefined)?.max),
		skills: extractedSkills,
		ai_tools_mentioned: inferAiToolsFromText(title, `${title} ${description}`),
		posted_date:
			extractDate(extractValue(entry, ['createdAt', 'updatedAt'])) ??
			extractDate((entry.categories as Record<string, unknown> | undefined)?.createdAt) ??
			fetchedAt,
		fetched_at: fetchedAt,
		ssoc_inferred: null,
		role_slug_inferred: null
	};
}

function parseAshbyPosting(
	entry: Record<string, unknown>,
	source: SourceRegistryEntry,
	fetchedAt: string
): RawPosting | null {
	const title = normalizeWhitespace(extractValue(entry, ['title', 'jobTitle']));
	if (!title) return null;
	const primaryLocation = normalizeWhitespace(
		typeof entry.location === 'string'
			? entry.location
			: ((entry.location as Record<string, unknown> | undefined)?.name ??
					extractValue(entry, ['locationName']))
	);
	const description = stripHtml(
		normalizeWhitespace(extractValue(entry, ['descriptionPlain', 'descriptionHtml'])) ?? ''
	);
	const extractedSkills = extractSkillsFromText(`${title} ${description}`);
	const compensation =
		(entry.compensation as Record<string, unknown> | undefined) ??
		(entry.salary as Record<string, unknown> | undefined) ??
		{};
	const secondaryLocations = Array.isArray(entry.secondaryLocations)
		? (entry.secondaryLocations as Array<Record<string, unknown>>)
				.map(candidate =>
					normalizeWhitespace(
						typeof candidate.location === 'string'
							? candidate.location
							: ((candidate.location as Record<string, unknown> | undefined)?.name ??
									(candidate.address as Record<string, unknown> | undefined)?.postalAddress)
					)
				)
				.filter((candidate): candidate is string => candidate !== null)
		: [];
	const location = secondaryLocations.find(isSingaporeLocationText) ?? primaryLocation;
	if (location && !isSingaporeLocationText(location)) {
		return null;
	}

	if (
		!isSingaporeRelevant({
			title,
			location,
			description,
			extraLocations: secondaryLocations,
			keywords: source.location_keywords
		})
	) {
		return null;
	}

	return {
		source: 'ashby',
		source_id: String(extractValue(entry, ['id', 'jobId']) ?? `${source.key}-${title}`),
		source_confidence: 'employer_career_site',
		url: normalizeWhitespace(extractValue(entry, ['jobUrl', 'applyUrl'])),
		title,
		employer: source.employer,
		sector:
			normalizeWhitespace(
				(typeof entry.department === 'string'
					? entry.department
					: (entry.department as Record<string, unknown> | undefined)?.name) ??
					extractValue(entry, ['departmentName', 'team'])
			) ?? 'Unspecified sector',
		location,
		employment_type: normalizeWhitespace(extractValue(entry, ['employmentType', 'jobType'])),
		seniority: inferSeniority(title),
		work_arrangement:
			normalizeWhitespace(extractValue(entry, ['workplaceType'])) ??
			inferWorkArrangement(description),
		salary_currency:
			normalizeWhitespace(extractValue(compensation, ['currencyCode', 'currency'])) ?? null,
		salary_min: toNumber(extractValue(compensation, ['minCompensation', 'min'])),
		salary_max: toNumber(extractValue(compensation, ['maxCompensation', 'max'])),
		skills: extractedSkills,
		ai_tools_mentioned: inferAiToolsFromText(title, `${title} ${description}`),
		posted_date:
			extractDate(extractValue(entry, ['publishedAt', 'publishedDate', 'createdAt'])) ?? fetchedAt,
		fetched_at: fetchedAt,
		ssoc_inferred: null,
		role_slug_inferred: null
	};
}

async function fetchMyCareersFuture(): Promise<RawPosting[]> {
	const baseUrl =
		process.env.MCF_POSTINGS_API_URL ?? 'https://api.mycareersfuture.gov.sg/v2/search';
	const query = process.env.MCF_POSTINGS_QUERY ?? 'Singapore';
	const limit = Number(process.env.MCF_POSTINGS_LIMIT ?? '50');
	const maxPages = Number(process.env.MCF_POSTINGS_MAX_PAGES ?? '5');
	const fetchedAt = new Date().toISOString();
	const sessionId =
		process.env.MCF_POSTINGS_SESSION_ID ?? `${Date.now()}.${Math.random().toString().slice(2, 12)}`;

	const all: RawPosting[] = [];
	for (let page = 0; page < maxPages; page += 1) {
		const url = new URL(baseUrl);
		url.searchParams.set('limit', String(limit));
		url.searchParams.set('page', String(page));

		const payload = await fetchJson(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'mcf-client': 'jobseeker',
				referer: 'https://www.mycareersfuture.gov.sg/',
				'user-agent': 'Mozilla/5.0'
			},
			body: JSON.stringify({
				sessionId,
				search: query,
				postingCompany: [],
				sortBy: ['new_posting_date']
			})
		});
		const entries = coerceRecordArray(payload);
		if (entries.length === 0) break;

		const parsed = entries
			.map(entry => parseMyCareersFuturePosting(entry, fetchedAt))
			.filter((posting): posting is RawPosting => posting !== null);

		all.push(...parsed);
		if (entries.length < limit) break;
	}

	return dedupePostings(all);
}

async function fetchJobStreet(): Promise<RawPosting[]> {
	const enabled = process.env.ENABLE_JOBSTREET_PUBLIC_FETCH === '1';
	const endpoint = process.env.JOBSTREET_POSTINGS_API_URL;
	if (!enabled || !endpoint) {
		return [];
	}

	const fetchedAt = new Date().toISOString();
	const payload = await fetchJson(new URL(endpoint));
	return dedupePostings(
		coerceRecordArray(payload)
			.map(entry => parseJobStreetPosting(entry, fetchedAt))
			.filter((posting): posting is RawPosting => posting !== null)
	);
}

async function fetchGreenhouseFromRegistry(entries: SourceRegistryEntry[]): Promise<RawPosting[]> {
	const fetchedAt = new Date().toISOString();
	const all: RawPosting[] = [];
	for (const source of entries.filter(entry => entry.source_type === 'greenhouse')) {
		try {
			const candidates = uniqueTokens(source).map(token => {
				const url = new URL(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`);
				url.searchParams.set('content', 'true');
				return url;
			});
			const payload = await fetchFirstSuccessfulJson(candidates);
			const jobs = coerceRecordArray(payload);
			all.push(
				...jobs
					.map(entry => parseGreenhousePosting(entry, source, fetchedAt))
					.filter((posting): posting is RawPosting => posting !== null)
			);
		} catch (error) {
			console.warn(`Skipping greenhouse source ${source.key}:`, error);
		}
	}
	return dedupePostings(all);
}

async function fetchLeverFromRegistry(entries: SourceRegistryEntry[]): Promise<RawPosting[]> {
	const fetchedAt = new Date().toISOString();
	const all: RawPosting[] = [];
	for (const source of entries.filter(entry => entry.source_type === 'lever')) {
		try {
			const candidates = uniqueTokens(source).map(token => {
				const url = new URL(`https://api.lever.co/v0/postings/${token}`);
				url.searchParams.set('mode', 'json');
				return url;
			});
			const payload = await fetchFirstSuccessfulJson(candidates);
			const jobs = coerceRecordArray(payload);
			all.push(
				...jobs
					.map(entry => parseLeverPosting(entry, source, fetchedAt))
					.filter((posting): posting is RawPosting => posting !== null)
			);
		} catch (error) {
			console.warn(`Skipping lever source ${source.key}:`, error);
		}
	}
	return dedupePostings(all);
}

async function fetchAshbyFromRegistry(entries: SourceRegistryEntry[]): Promise<RawPosting[]> {
	const fetchedAt = new Date().toISOString();
	const all: RawPosting[] = [];
	for (const source of entries.filter(entry => entry.source_type === 'ashby')) {
		try {
			const candidates = uniqueTokens(source).map(
				token => new URL(`https://api.ashbyhq.com/posting-api/job-board/${token}`)
			);
			const payload = await fetchFirstSuccessfulJson(candidates);
			const jobs = coerceRecordArray(payload);
			all.push(
				...jobs
					.map(entry => parseAshbyPosting(entry, source, fetchedAt))
					.filter((posting): posting is RawPosting => posting !== null)
			);
		} catch (error) {
			console.warn(`Skipping ashby source ${source.key}:`, error);
		}
	}
	return dedupePostings(all);
}

function dedupePostings(postings: RawPosting[]): RawPosting[] {
	const seen = new Set<string>();
	return postings.filter(posting => {
		const key = `${posting.source}:${posting.source_id}:${posting.title.toLowerCase()}:${posting.employer.toLowerCase()}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

async function main() {
	console.log('=== Job Postings Pipeline ===\n');

	fs.mkdirSync(RAW_OUT_DIR, { recursive: true });

	const registry = readSourceRegistry();
	const adapters: SourceAdapter[] = [
		{ name: 'mycareersfuture', active: true, fetch: fetchMyCareersFuture },
		{
			name: 'greenhouse',
			active: registry.some(entry => entry.source_type === 'greenhouse'),
			fetch: () => fetchGreenhouseFromRegistry(registry)
		},
		{
			name: 'lever',
			active: registry.some(entry => entry.source_type === 'lever'),
			fetch: () => fetchLeverFromRegistry(registry)
		},
		{
			name: 'ashby',
			active: registry.some(entry => entry.source_type === 'ashby'),
			fetch: () => fetchAshbyFromRegistry(registry)
		},
		{
			name: 'jobstreet',
			active: process.env.ENABLE_JOBSTREET_PUBLIC_FETCH === '1',
			fetch: fetchJobStreet
		}
	];
	const selectedSources = new Set(
		(process.env.POSTINGS_SOURCES ?? '')
			.split(',')
			.map(value => value.trim().toLowerCase())
			.filter(Boolean)
	);

	const date = new Date().toISOString().split('T')[0];

	for (const adapter of adapters) {
		if (selectedSources.size > 0 && !selectedSources.has(adapter.name)) {
			console.log(`Skipping ${adapter.name} (not selected)`);
			continue;
		}
		if (!adapter.active) {
			console.log(`Skipping ${adapter.name} (inactive)`);
			continue;
		}

		try {
			const postings = await adapter.fetch();
			const outFile = path.join(RAW_OUT_DIR, `${adapter.name}-${date}.json`);
			fs.writeFileSync(outFile, JSON.stringify(postings, null, 2) + '\n', 'utf-8');
			console.log(`Saved ${postings.length} ${adapter.name} postings to ${outFile}`);
		} catch (error) {
			console.error(`Failed to fetch ${adapter.name}:`, error);
		}
	}

	console.log(`\nLoaded ${registry.length} employer-source registry entries.`);
	console.log('LinkedIn remains deferred: partner-gated and not part of the canonical monitor.');
	console.log('Next step: bun run scripts/pipelines/normalize-postings.ts');
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
