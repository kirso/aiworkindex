#!/usr/bin/env bun
/**
 * normalize-postings.ts — Normalize raw postings into common schema
 * and derive trend signals.
 *
 * Input:  data/postings/raw/*.json
 * Output: data/postings/trends.json
 *
 * Status: STUB — runs but produces empty output until fetch-postings.ts is active.
 * Run: bun run scripts/pipelines/normalize-postings.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const RAW_DIR = path.join(import.meta.dir, '..', '..', 'data', 'postings', 'raw');
const OUT_FILE = path.join(import.meta.dir, '..', '..', 'data', 'postings', 'trends.json');

interface NormalizedPosting {
	title: string;
	ssoc_inferred: string | null;
	salary_min: number | null;
	salary_max: number | null;
	skills: string[];
	ai_tools: string[];
	posted_date: string;
	employer: string;
	sector: string;
	source: string;
}

interface TrendSignals {
	generated_at: string;
	total_postings: number;
	volume_4w: number;
	volume_12w: number;
	salary_trend: 'rising' | 'stable' | 'falling' | 'insufficient_data';
	ai_tool_mentions: { tool: string; count: number }[];
	top_skills: { skill: string; count: number }[];
	emerging_roles: { title: string; count: number }[];
	by_ssoc: Record<
		string,
		{
			posting_count: number;
			avg_salary: number | null;
			ai_tool_rate: number;
		}
	>;
}

function main() {
	console.log('=== Postings Normalization ===\n');

	if (!fs.existsSync(RAW_DIR)) {
		console.log('No raw postings directory found.');
		console.log('Run fetch-postings.ts first.\n');

		// Write empty trends file
		const empty: TrendSignals = {
			generated_at: new Date().toISOString(),
			total_postings: 0,
			volume_4w: 0,
			volume_12w: 0,
			salary_trend: 'insufficient_data',
			ai_tool_mentions: [],
			top_skills: [],
			emerging_roles: [],
			by_ssoc: {}
		};

		fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
		fs.writeFileSync(OUT_FILE, JSON.stringify(empty, null, 2));
		console.log(`Wrote empty trends file: ${OUT_FILE}`);
		return;
	}

	const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));

	if (rawFiles.length === 0) {
		console.log('No raw posting files found. Run fetch-postings.ts first.');
		return;
	}

	// Load and normalize all postings
	const all: NormalizedPosting[] = [];
	for (const file of rawFiles) {
		const data = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));
		for (const posting of data) {
			all.push({
				title: posting.title || '',
				ssoc_inferred: posting.ssoc_inferred || null,
				salary_min: posting.salary_min || null,
				salary_max: posting.salary_max || null,
				skills: posting.skills || [],
				ai_tools: posting.ai_tools_mentioned || posting.ai_tools || [],
				posted_date: posting.posted_date || '',
				employer: posting.employer || '',
				sector: posting.sector || '',
				source: posting.source || file.split('-')[0]
			});
		}
	}

	console.log(`Loaded ${all.length} postings from ${rawFiles.length} files`);

	// Compute trends
	const now = Date.now();
	const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;
	const twelveWeeksAgo = now - 84 * 24 * 60 * 60 * 1000;

	const volume4w = all.filter(p => new Date(p.posted_date).getTime() > fourWeeksAgo).length;
	const volume12w = all.filter(p => new Date(p.posted_date).getTime() > twelveWeeksAgo).length;

	// AI tool mentions
	const toolCounts = new Map<string, number>();
	for (const p of all) {
		for (const tool of p.ai_tools) {
			toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
		}
	}
	const aiToolMentions = [...toolCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20)
		.map(([tool, count]) => ({ tool, count }));

	// Top skills
	const skillCounts = new Map<string, number>();
	for (const p of all) {
		for (const skill of p.skills) {
			skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
		}
	}
	const topSkills = [...skillCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 30)
		.map(([skill, count]) => ({ skill, count }));

	const trends: TrendSignals = {
		generated_at: new Date().toISOString(),
		total_postings: all.length,
		volume_4w: volume4w,
		volume_12w: volume12w,
		salary_trend: 'insufficient_data',
		ai_tool_mentions: aiToolMentions,
		top_skills: topSkills,
		emerging_roles: [],
		by_ssoc: {}
	};

	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
	fs.writeFileSync(OUT_FILE, JSON.stringify(trends, null, 2));
	console.log(`\nTrends written: ${OUT_FILE}`);
}

main();
