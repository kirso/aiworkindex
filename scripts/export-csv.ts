#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';

import { buildV9PublicRelease, ROOT } from './v9-public-export';

const output = path.join(ROOT, 'static', 'data', 'sg-ai-occupations-v9.csv');

const columns = [
	'schema_version',
	'ssoc_2024',
	'title',
	'major_group_code',
	'major_group',
	'sub_major_group_code',
	'minor_group_code',
	'unit_group_code',
	'score_status',
	'ilo_mean_score_2025_median',
	'ilo_mean_score_2025_min',
	'ilo_mean_score_2025_max',
	'ai_work_pressure_percentile',
	'ai_work_pressure_midrank_position',
	'ai_work_pressure_population_size',
	'ilo_potential25_categories',
	'ilo_potential25_least_exposed',
	'ilo_potential25_most_exposed',
	'ilo_task_score_sd_2025_median',
	'ilo_task_score_sd_2025_min',
	'ilo_task_score_sd_2025_max',
	'official_isco08_codes',
	'scored_isco08_codes',
	'unscored_official_isco08_codes',
	'mapping_quality',
	'evidence_support',
	'basic_monthly_p25_sgd',
	'basic_monthly_median_sgd',
	'basic_monthly_p75_sgd',
	'gross_monthly_p25_sgd',
	'gross_monthly_median_sgd',
	'gross_monthly_p75_sgd',
	'wage_reference_period',
	'wage_source_id',
	'direct_demand_signal_count',
	'demand_source_keys',
	'demand_source_occupations',
	'labour_context_grain',
	'labour_context_cluster',
	'labour_context_data_as_of',
	'evidence_data_as_of',
	'limitations'
] as const;

function escapeCsv(value: string | number | boolean | null | undefined): string {
	const text = value == null ? '' : String(value);
	return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const release = buildV9PublicRelease();
const rows = release.occupations.map(occupation => {
	const exposure = occupation.genai_task_exposure;
	const wage = occupation.singapore_market.wages;
	const demand = occupation.market_evidence.demand_signals;
	const majorGroupCode = occupation.taxonomy.hierarchy.major_group.code;
	const labour = release.market_context.labour_by_major_group[majorGroupCode] ?? null;
	return [
		occupation.schema_version,
		occupation.taxonomy.code,
		occupation.taxonomy.title,
		majorGroupCode,
		occupation.taxonomy.hierarchy.major_group.title,
		occupation.taxonomy.hierarchy.sub_major_group?.code ?? null,
		occupation.taxonomy.hierarchy.minor_group?.code ?? null,
		occupation.taxonomy.hierarchy.unit_group?.code ?? null,
		occupation.score_status,
		exposure?.mean_score_2025.median ?? null,
		exposure?.mean_score_2025.min ?? null,
		exposure?.mean_score_2025.max ?? null,
		exposure?.pressure_rank.percentile ?? null,
		exposure?.pressure_rank.midrank_position ?? null,
		exposure?.pressure_rank.population_size ?? null,
		exposure?.potential25.categories.join('|') ?? null,
		exposure?.potential25.least_exposed ?? null,
		exposure?.potential25.most_exposed ?? null,
		exposure?.task_score_sd_2025.median ?? null,
		exposure?.task_score_sd_2025.min ?? null,
		exposure?.task_score_sd_2025.max ?? null,
		occupation.evidence.official_isco08_codes.join('|'),
		exposure?.scored_isco08_matches.map(match => match.isco08_code).join('|') ?? null,
		exposure?.unscored_official_isco08_codes.join('|') ?? null,
		occupation.evidence.mapping_quality,
		occupation.evidence.support,
		wage?.value.basic_monthly_sgd.p25 ?? null,
		wage?.value.basic_monthly_sgd.median ?? null,
		wage?.value.basic_monthly_sgd.p75 ?? null,
		wage?.value.gross_monthly_sgd.p25 ?? null,
		wage?.value.gross_monthly_sgd.median ?? null,
		wage?.value.gross_monthly_sgd.p75 ?? null,
		wage?.reference_period ?? null,
		wage?.source.id ?? null,
		demand.length,
		[...new Set(demand.map(signal => signal.source_key))].join('|'),
		demand.map(signal => signal.source_occupation).join('|'),
		labour ? 'published_broad_occupation_group' : null,
		labour?.cluster_key ?? null,
		labour?.data_as_of ?? null,
		occupation.evidence.data_as_of,
		occupation.evidence.limitations.join('|')
	];
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
	output,
	`${[columns, ...rows].map(row => row.map(value => escapeCsv(value)).join(',')).join('\n')}\n`,
	'utf8'
);

console.log(`Exported ${release.occupations.length} V9 occupations to ${output}`);
