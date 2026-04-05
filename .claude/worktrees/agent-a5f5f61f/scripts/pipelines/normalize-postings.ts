#!/usr/bin/env bun
/**
 * normalize-postings.ts — Normalize raw postings into a canonical postings monitor artifact.
 *
 * Inputs:
 *   - data/postings/raw/*.json
 *
 * Outputs:
 *   - data/postings/postings-monitor.json
 *   - src/lib/data/postings-monitor.json
 *   - static/data/postings-monitor.json
 *
 * Run:
 *   bun run scripts/pipelines/normalize-postings.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import occupations from '../../data/occupations.json';
import { jobAliases } from '../../src/lib/data/aliases';
import { syntheticRoles } from '../../src/lib/data/synthetic-roles';
import type { RawPosting } from './fetch-postings';

const ROOT_DIR = path.join(import.meta.dir, '..', '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'postings', 'raw');
const OUT_FILE = path.join(ROOT_DIR, 'data', 'postings', 'postings-monitor.json');
const SRC_OUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'postings-monitor.json');
const STATIC_OUT_FILE = path.join(ROOT_DIR, 'static', 'data', 'postings-monitor.json');

type HiringState = 'active' | 'moderate' | 'thin' | 'stale' | 'no_signal';
type PostingTrend = 'rising' | 'steady' | 'cooling' | 'insufficient_data';

interface PostingMetricBucket {
	posting_volume_30d: number;
	posting_volume_90d: number;
	trend_90d: PostingTrend;
	hiring_state: HiringState;
	freshness_days: number | null;
	latest_posted_date: string | null;
	salary_min_hint: number | null;
	salary_max_hint: number | null;
	median_salary_hint: number | null;
	top_skills: Array<{ label: string; count: number }>;
	top_tools: Array<{ label: string; count: number }>;
	source_mix: Array<{ source: string; count: number }>;
}

interface PostingAggregate extends PostingMetricBucket {
	title: string;
}

interface PostingsMonitor {
	generated_at: string;
	sources: Array<{
		source: string;
		label: string;
		source_tier: 'official_sg_job_portal' | 'external_job_board' | 'employer_career_site';
		posting_count: number;
		latest_posted_date: string | null;
		freshness_days: number | null;
	}>;
	summary: PostingMetricBucket & {
		total_postings: number;
		source_count: number;
	};
	by_ssoc: Record<string, PostingAggregate>;
	by_role: Record<string, PostingAggregate>;
}

function sourceLabel(source: RawPosting['source']): string {
	switch (source) {
		case 'mycareersfuture':
			return 'MyCareersFuture';
		case 'greenhouse':
			return 'Greenhouse employer boards';
		case 'lever':
			return 'Lever employer boards';
		case 'ashby':
			return 'Ashby employer boards';
		case 'jobstreet':
			return 'JobStreet';
	}
}

function sourceTier(
	sourceConfidence: RawPosting['source_confidence']
): 'official_sg_job_portal' | 'external_job_board' | 'employer_career_site' {
	switch (sourceConfidence) {
		case 'official_sg_job_portal':
			return 'official_sg_job_portal';
		case 'employer_career_site':
			return 'employer_career_site';
		case 'external_job_board':
		default:
			return 'external_job_board';
	}
}

interface OccupationIndexEntry {
	ssoc: string;
	title: string;
}

const occupationIndex = (occupations as OccupationIndexEntry[]).map(occupation => ({
	ssoc: occupation.ssoc,
	title: occupation.title,
	normalizedTitle: normalizeText(occupation.title)
}));

const roleIndex = syntheticRoles.map(role => ({
	slug: role.slug,
	title: role.title,
	normalizedTitle: normalizeText(role.title),
	tagTokens: role.tags.map(tag => normalizeText(tag))
}));
const aliasIndex = Object.entries(jobAliases).map(([alias, ssocs]) => ({
	alias,
	normalizedAlias: normalizeText(alias),
	ssocs
}));

function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function simplifyTitleForMatching(value: string): string {
	return value
		.replace(/\([^)]*\)/g, ' ')
		.replace(
			/\b(senior|staff|principal|lead|head|director|manager|junior|associate|entry level)\b/gi,
			' '
		)
		.replace(/\brelocate(?: to)? singapore\b/gi, ' ')
		.replace(/\bteam expansion\b/gi, ' ')
		.replace(/\bapac\b|\bsea\b|\bgtpn\b|\bsg\b/gi, ' ')
		.replace(/[/-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function findBestAliasMatch(value: string): { alias: string; ssocs: string[] } | null {
	const normalizedValue = normalizeText(value);
	if (!normalizedValue) return null;

	const matches = aliasIndex.filter(entry => {
		return (
			normalizedValue === entry.normalizedAlias ||
			normalizedValue.includes(entry.normalizedAlias) ||
			entry.normalizedAlias.includes(normalizedValue)
		);
	});

	if (matches.length === 0) return null;
	matches.sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);
	const winner = matches[0];
	return winner ? { alias: winner.alias, ssocs: winner.ssocs } : null;
}

function daysBetween(fromIso: string, to = new Date()): number | null {
	const from = new Date(fromIso);
	if (Number.isNaN(from.getTime())) return null;
	return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
}

function inferSsoc(posting: RawPosting): string | null {
	if (posting.ssoc_inferred) return posting.ssoc_inferred;
	const normalizedTitle = normalizeText(posting.title);
	const simplifiedTitle = normalizeText(simplifyTitleForMatching(posting.title));
	const exact = occupationIndex.find(occupation => occupation.normalizedTitle === normalizedTitle);
	if (exact) return exact.ssoc;
	const simplifiedExact = occupationIndex.find(
		occupation => occupation.normalizedTitle === simplifiedTitle
	);
	if (simplifiedExact) return simplifiedExact.ssoc;

	const aliasMatch = findBestAliasMatch(simplifiedTitle || normalizedTitle);
	if (aliasMatch?.ssocs?.[0]) return aliasMatch.ssocs[0];

	const partial = occupationIndex.find(occupation => {
		const title = occupation.normalizedTitle;
		return (
			normalizedTitle.includes(title) ||
			title.includes(normalizedTitle) ||
			sharedTokenCount(normalizedTitle, title) >= 2 ||
			sharedTokenCount(simplifiedTitle, title) >= 2
		);
	});

	return partial?.ssoc ?? null;
}

function inferRoleSlug(posting: RawPosting): string | null {
	if (posting.role_slug_inferred) return posting.role_slug_inferred;
	const normalizedTitle = normalizeText(posting.title);
	const simplifiedTitle = normalizeText(simplifyTitleForMatching(posting.title));
	const exact = roleIndex.find(role => role.normalizedTitle === normalizedTitle);
	if (exact) return exact.slug;
	const simplifiedExact = roleIndex.find(role => role.normalizedTitle === simplifiedTitle);
	if (simplifiedExact) return simplifiedExact.slug;

	const aliasMatch = findBestAliasMatch(simplifiedTitle || normalizedTitle);
	if (aliasMatch) {
		const aliasNormalized = normalizeText(aliasMatch.alias);
		const aliasRole = roleIndex.find(role => {
			return (
				role.normalizedTitle === aliasNormalized ||
				role.normalizedTitle.includes(aliasNormalized) ||
				aliasNormalized.includes(role.normalizedTitle) ||
				role.tagTokens.some(
					tag =>
						tag === aliasNormalized ||
						aliasNormalized.includes(tag) ||
						tag.includes(aliasNormalized)
				)
			);
		});
		if (aliasRole) return aliasRole.slug;
	}

	const partial = roleIndex.find(role => {
		return (
			normalizedTitle.includes(role.normalizedTitle) ||
			role.normalizedTitle.includes(normalizedTitle) ||
			simplifiedTitle.includes(role.normalizedTitle) ||
			role.normalizedTitle.includes(simplifiedTitle) ||
			role.tagTokens.some(tag => normalizedTitle.includes(tag) || simplifiedTitle.includes(tag))
		);
	});

	return partial?.slug ?? null;
}

function sharedTokenCount(a: string, b: string): number {
	const aTokens = new Set(a.split(' ').filter(Boolean));
	const bTokens = new Set(b.split(' ').filter(Boolean));
	let count = 0;
	for (const token of aTokens) {
		if (bTokens.has(token)) count += 1;
	}
	return count;
}

function aggregateMetrics(postings: RawPosting[]): PostingMetricBucket {
	const now = new Date();
	const within30d = postings.filter(posting => {
		const days = daysBetween(posting.posted_date, now);
		return days !== null && days <= 30;
	});
	const within90d = postings.filter(posting => {
		const days = daysBetween(posting.posted_date, now);
		return days !== null && days <= 90;
	});

	const latestPostedDate =
		postings
			.map(posting => posting.posted_date)
			.filter(Boolean)
			.sort()
			.at(-1) ?? null;
	const freshnessDays = latestPostedDate ? daysBetween(latestPostedDate, now) : null;

	const previousWindow = postings.filter(posting => {
		const days = daysBetween(posting.posted_date, now);
		return days !== null && days > 30 && days <= 90;
	});

	const trend_90d: PostingTrend =
		previousWindow.length === 0
			? within30d.length > 0
				? 'rising'
				: 'insufficient_data'
			: within30d.length > previousWindow.length * 0.75
				? 'rising'
				: within30d.length < previousWindow.length * 0.45
					? 'cooling'
					: 'steady';

	let hiring_state: HiringState = 'no_signal';
	if (freshnessDays === null || postings.length === 0) {
		hiring_state = 'no_signal';
	} else if (freshnessDays > 45) {
		hiring_state = 'stale';
	} else if (within30d.length >= 12) {
		hiring_state = 'active';
	} else if (within30d.length >= 4) {
		hiring_state = 'moderate';
	} else if (within30d.length > 0) {
		hiring_state = 'thin';
	}

	const salaryHints = postings
		.flatMap(posting => [posting.salary_min, posting.salary_max])
		.filter(
			(value): value is number =>
				typeof value === 'number' && Number.isFinite(value) && value >= 1000
		)
		.sort((a, b) => a - b);

	const sourceCounts = countSources(postings.map(posting => posting.source));
	const skillCounts = countStrings(postings.flatMap(posting => posting.skills));
	const toolCounts = countStrings(postings.flatMap(posting => posting.ai_tools_mentioned));

	return {
		posting_volume_30d: within30d.length,
		posting_volume_90d: within90d.length,
		trend_90d,
		hiring_state,
		freshness_days: freshnessDays,
		latest_posted_date: latestPostedDate,
		salary_min_hint: salaryHints[0] ?? null,
		salary_max_hint: salaryHints.at(-1) ?? null,
		median_salary_hint:
			salaryHints.length > 0 ? (salaryHints[Math.floor(salaryHints.length / 2)] ?? null) : null,
		top_skills: skillCounts.slice(0, 5),
		top_tools: toolCounts.slice(0, 5),
		source_mix: sourceCounts
	};
}

function countStrings(values: string[]): Array<{ label: string; count: number }> {
	const counts = new Map<string, number>();
	for (const value of values) {
		const normalized = value.trim();
		if (!normalized) continue;
		counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([label, count]) => ({ label, count }));
}

function countSources(values: string[]): Array<{ source: string; count: number }> {
	return countStrings(values).map(({ label, count }) => ({ source: label, count }));
}

function emptyMonitor(): PostingsMonitor {
	return {
		generated_at: new Date().toISOString(),
		sources: [],
		summary: {
			total_postings: 0,
			source_count: 0,
			posting_volume_30d: 0,
			posting_volume_90d: 0,
			trend_90d: 'insufficient_data',
			hiring_state: 'no_signal',
			freshness_days: null,
			latest_posted_date: null,
			salary_min_hint: null,
			salary_max_hint: null,
			median_salary_hint: null,
			top_skills: [],
			top_tools: [],
			source_mix: []
		},
		by_ssoc: {},
		by_role: {}
	};
}

function writeAllOutputs(payload: PostingsMonitor) {
	const serialized = JSON.stringify(payload, null, 2) + '\n';
	for (const file of [OUT_FILE, SRC_OUT_FILE, STATIC_OUT_FILE]) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, serialized, 'utf-8');
	}
}

function main() {
	console.log('=== Postings Normalization ===\n');

	if (!fs.existsSync(RAW_DIR)) {
		console.log('No raw postings directory found. Writing empty monitor.\n');
		writeAllOutputs(emptyMonitor());
		return;
	}

	const rawFiles = fs.readdirSync(RAW_DIR).filter(file => file.endsWith('.json'));
	if (rawFiles.length === 0) {
		console.log('No raw posting files found. Writing empty monitor.\n');
		writeAllOutputs(emptyMonitor());
		return;
	}

	const postings: RawPosting[] = [];
	for (const file of rawFiles) {
		const loaded = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8')) as RawPosting[];
		postings.push(...loaded);
	}

	const deduped = dedupePostings(postings);
	console.log(`Loaded ${postings.length} raw postings across ${rawFiles.length} file(s).`);
	console.log(`Deduped to ${deduped.length} postings.`);

	const normalized = deduped.map(posting => ({
		...posting,
		ssoc_inferred: inferSsoc(posting),
		role_slug_inferred: inferRoleSlug(posting)
	}));

	const bySsoc = new Map<string, RawPosting[]>();
	const byRole = new Map<string, RawPosting[]>();
	for (const posting of normalized) {
		if (posting.ssoc_inferred) {
			const bucket = bySsoc.get(posting.ssoc_inferred) ?? [];
			bucket.push(posting);
			bySsoc.set(posting.ssoc_inferred, bucket);
		}
		if (posting.role_slug_inferred) {
			const bucket = byRole.get(posting.role_slug_inferred) ?? [];
			bucket.push(posting);
			byRole.set(posting.role_slug_inferred, bucket);
		}
	}

	const sourceMap = new Map<string, RawPosting[]>();
	for (const posting of normalized) {
		const bucket = sourceMap.get(posting.source) ?? [];
		bucket.push(posting);
		sourceMap.set(posting.source, bucket);
	}

	const payload: PostingsMonitor = {
		generated_at: new Date().toISOString(),
		sources: [...sourceMap.entries()].map(([source, sourcePostings]) => ({
			source,
			label: sourceLabel(source),
			source_tier: sourceTier(sourcePostings[0]?.source_confidence ?? 'external_job_board'),
			posting_count: sourcePostings.length,
			latest_posted_date: aggregateMetrics(sourcePostings).latest_posted_date,
			freshness_days: aggregateMetrics(sourcePostings).freshness_days
		})),
		summary: {
			total_postings: normalized.length,
			source_count: sourceMap.size,
			...aggregateMetrics(normalized)
		},
		by_ssoc: Object.fromEntries(
			[...bySsoc.entries()].map(([ssoc, bucket]) => [
				ssoc,
				{
					title:
						occupationIndex.find(occupation => occupation.ssoc === ssoc)?.title ??
						'Unknown occupation',
					...aggregateMetrics(bucket)
				}
			])
		),
		by_role: Object.fromEntries(
			[...byRole.entries()].map(([slug, bucket]) => [
				slug,
				{
					title: syntheticRoles.find(role => role.slug === slug)?.title ?? slug,
					...aggregateMetrics(bucket)
				}
			])
		)
	};

	writeAllOutputs(payload);
	console.log(
		`Wrote postings monitor with ${normalized.length} postings across ${sourceMap.size} sources.`
	);
}

function dedupePostings(postings: RawPosting[]): RawPosting[] {
	const byKey = new Map<string, RawPosting>();
	for (const posting of postings) {
		const key = `${posting.source}:${posting.source_id}:${posting.posted_date}`;
		const existing = byKey.get(key);
		if (!existing) {
			byKey.set(key, posting);
			continue;
		}
		if (new Date(posting.fetched_at).getTime() >= new Date(existing.fetched_at).getTime()) {
			byKey.set(key, posting);
		}
	}
	return [...byKey.values()].sort((a, b) => b.posted_date.localeCompare(a.posted_date));
}

main();
