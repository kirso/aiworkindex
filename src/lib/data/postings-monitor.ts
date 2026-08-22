import postingsMonitorData from './postings-monitor.json';
import type { Occupation } from './index';

export type PostingHiringState = 'active' | 'moderate' | 'thin' | 'stale' | 'no_signal';
export type PostingTrend = 'rising' | 'steady' | 'cooling' | 'insufficient_data';

export interface PostingCountItem {
	label: string;
	count: number;
}

export interface PostingSourceMixItem {
	source: string;
	count: number;
}

export interface PostingMetricBucket {
	posting_volume_30d: number;
	posting_volume_90d: number;
	trend_90d: PostingTrend;
	hiring_state: PostingHiringState;
	freshness_days: number | null;
	latest_posted_date: string | null;
	salary_min_hint: number | null;
	salary_max_hint: number | null;
	median_salary_hint: number | null;
	top_skills: PostingCountItem[];
	top_tools: PostingCountItem[];
	source_mix: PostingSourceMixItem[];
}

export interface PostingAggregate extends PostingMetricBucket {
	title: string;
}

export interface PostingsMonitorSummary extends PostingMetricBucket {
	total_postings: number;
	source_count: number;
}

export interface PostingSourceSummary {
	source: string;
	label: string;
	source_tier: 'official_sg_job_portal' | 'external_job_board' | 'employer_career_site';
	posting_count: number;
	latest_posted_date: string | null;
	freshness_days: number | null;
}

export interface PostingsMonitor {
	generated_at: string;
	observed_through: string | null;
	coverage: {
		occupations_covered: number;
		occupations_total: number;
		occupation_coverage_pct: number;
		roles_covered: number;
		roles_total: number;
		role_coverage_pct: number;
	};
	sources: PostingSourceSummary[];
	summary: PostingsMonitorSummary;
	by_ssoc: Record<string, PostingAggregate>;
	by_role: Record<string, PostingAggregate>;
}

export const postingsMonitor = postingsMonitorData as PostingsMonitor;

export function getPostingsForOccupation(ssoc: string): PostingAggregate | null {
	return postingsMonitor.by_ssoc[ssoc] ?? null;
}

export function getPostingsForRole(slug: string): PostingAggregate | null {
	return postingsMonitor.by_role[slug] ?? null;
}

function mergeCounts(items: PostingCountItem[][]): PostingCountItem[] {
	const counts = new Map<string, number>();
	for (const list of items) {
		for (const item of list) {
			counts.set(item.label, (counts.get(item.label) ?? 0) + item.count);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([label, count]) => ({ label, count }));
}

function mergeSourceMix(items: PostingSourceMixItem[][]): PostingSourceMixItem[] {
	const counts = new Map<string, number>();
	for (const list of items) {
		for (const item of list) {
			counts.set(item.source, (counts.get(item.source) ?? 0) + item.count);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([source, count]) => ({ source, count }));
}

export function buildRolePostingsFromComponents(
	slug: string,
	components: Array<{ weight: number; occupation: Occupation | null }>
): PostingAggregate | null {
	const direct = getPostingsForRole(slug);
	if (direct) return direct;

	const resolved = components
		.filter(
			(component): component is { weight: number; occupation: Occupation } => component.occupation !== null
		)
		.map((component) => ({
			weight: component.weight,
			occupation: component.occupation,
			postings: getPostingsForOccupation(component.occupation.ssoc)
		}))
		.filter(
			(component): component is {
				weight: number;
				occupation: Occupation;
				postings: PostingAggregate;
			} => component.postings !== null
		);

	if (resolved.length === 0) return null;

	const latestPostedDate = [...resolved]
		.map((component) => component.postings.latest_posted_date)
		.filter((value): value is string => typeof value === 'string')
		.sort()
		.at(-1) ?? null;

	const weightedValue = (key: keyof PostingMetricBucket): number | null => {
		const values = resolved
			.map((component) => {
				const raw = component.postings[key];
				return typeof raw === 'number' ? raw * component.weight : null;
			})
			.filter((value): value is number => value !== null);
		if (values.length === 0) return null;
		return values.reduce((sum, value) => sum + value, 0);
	};

	const posting_volume_30d =
		resolved.reduce((sum, component) => sum + component.postings.posting_volume_30d, 0);
	const posting_volume_90d =
		resolved.reduce((sum, component) => sum + component.postings.posting_volume_90d, 0);

	return {
		title: resolved[0]?.occupation.title ?? slug,
		posting_volume_30d,
		posting_volume_90d,
		trend_90d:
			resolved.some((component) => component.postings.trend_90d === 'rising')
				? 'rising'
				: resolved.some((component) => component.postings.trend_90d === 'cooling')
					? 'cooling'
					: resolved.some((component) => component.postings.trend_90d === 'steady')
						? 'steady'
						: 'insufficient_data',
		hiring_state:
			posting_volume_30d >= 12
				? 'active'
				: posting_volume_30d >= 4
					? 'moderate'
					: posting_volume_30d > 0
						? 'thin'
						: 'no_signal',
		freshness_days: weightedValue('freshness_days'),
		latest_posted_date: latestPostedDate,
		salary_min_hint: weightedValue('salary_min_hint'),
		salary_max_hint: weightedValue('salary_max_hint'),
		median_salary_hint: weightedValue('median_salary_hint'),
		top_skills: mergeCounts(resolved.map((component) => component.postings.top_skills)).slice(0, 5),
		top_tools: mergeCounts(resolved.map((component) => component.postings.top_tools)).slice(0, 5),
		source_mix: mergeSourceMix(resolved.map((component) => component.postings.source_mix))
	};
}
