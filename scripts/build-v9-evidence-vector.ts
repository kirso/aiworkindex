#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_AT = '2026-08-22';
const SNAPSHOT_ID = 'v9-evidence-2026-08-22';

const FILES = {
	occupations: path.join(ROOT, 'data', 'occupations-v9.json'),
	capabilities: path.join(ROOT, 'data', 'v9-capability-profiles.json'),
	research: path.join(ROOT, 'data', 'v9-research-signals.json'),
	market: path.join(ROOT, 'data', 'v9-market-context.json'),
	economics: path.join(ROOT, 'data', 'v9-economic-observatory.json'),
	skills: path.join(ROOT, 'data', 'v9-skills-pilot.json')
};

const VECTOR_OUTPUTS = [
	path.join(ROOT, 'data', 'v9-evidence-vector.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-evidence-vector.json'),
	path.join(ROOT, 'static', 'data', 'v9-evidence-vector.json')
];
const CHANGE_OUTPUTS = [
	path.join(ROOT, 'data', 'v9-signal-change.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-signal-change.json'),
	path.join(ROOT, 'static', 'data', 'v9-signal-change.json')
];
const SNAPSHOT_FILE = path.join(ROOT, 'data', 'snapshots', `${SNAPSHOT_ID}.json`);

interface OccupationRelease {
	counts: {
		occupations: number;
		scored: number;
		insufficient_evidence: number;
		direct_wages: number;
	};
	occupations: Array<{
		taxonomy: {
			code: string;
			title: string;
			hierarchy: { major_group: { code: string; title: string } };
		};
		genai_task_exposure: null | {
			mean_score_2025: { median: number; min: number; max: number };
			potential25: { least_exposed: string; most_exposed: string };
			pressure_rank: { percentile: number; population_size: number };
		};
		singapore_market: {
			wages: null | {
				geography: string;
				reference_period: string;
				source: { publisher: string; title: string; url: string };
				mapping: { quality: string };
				value: { gross_monthly_sgd: { p25: number; median: number; p75: number } };
			};
		};
		evidence: { mapping_quality: string };
	}>;
}

interface CapabilityArtifact {
	profiles: Record<
		string,
		{
			overall: { ai_capability_proximity_0_1: { median: number; min: number; max: number } };
			mapping: {
				ssoc_isco_quality: string;
				oecd_candidates: Array<{
					onet_soc_code: string;
					title: string;
					relation: string;
					identity_basis: string;
				}>;
			};
		}
	>;
	source: {
		publisher: string;
		publication_title: string;
		publication_date: string;
		publication_url: string;
	};
}

interface ResearchArtifact {
	profiles: Record<
		string,
		{
			eloundou_theoretical_exposure: {
				value_0_1: number;
				source_occupation: { code: string; title: string };
				source_grain: string;
			};
			anthropic_observed_exposure: null | {
				value_0_1: number;
				source_occupation: { code: string; title: string };
				source_grain: string;
			};
			derived_theory_use_gap: null | { value_0_1: number };
		}
	>;
	sources: {
		eloundou: {
			publisher: string;
			publication_title: string;
			publication_date: string;
			publication_url: string;
		};
		anthropic_observed_exposure: {
			publisher: string;
			publication_title: string;
			publication_date: string;
			publication_url: string;
			observation_periods: string[];
		};
	};
}

interface MarketArtifact {
	demand_by_code: Record<
		string,
		Array<{
			source_key: string;
			label: string;
			published_at: string;
			url: string;
			source_occupation: string;
		}>
	>;
	national: {
		job_vacancies_august_2026_update: {
			title: string;
			url: string;
			job_vacancies_thousands: Record<string, number>;
			entry_level_pmet_vacancies_thousands: Record<string, number>;
		};
	};
}

interface EconomicArtifact {
	group_profiles: Record<
		string,
		{
			major_group: { code: string; title: string };
			measurement_status: string;
			employment?: {
				grain: string;
				geography: string;
				unit: string;
				latest: { period: string; value: number } | null;
				derived_change: { year_over_year_pct: number; since_2019_pct: number } | null;
			};
		}
	>;
	sources: Record<string, { title?: string; publisher?: string; url?: string }>;
}

interface SkillsArtifact {
	reviewed_at: string;
	profiles: Record<
		string,
		{
			sector_profiles: Array<{
				sector: string;
				source_job_role: string;
				mapping: { quality: string };
				technical_skills: Array<{ name: string; proficiency: string }>;
				core_skills: Array<{ name: string; proficiency: string }>;
				source: { publisher: string; title: string; url: string };
			}>;
		}
	>;
}

function readJson<T>(file: string): T {
	return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function writeCopies(outputs: string[], payload: unknown): void {
	const serialized = `${JSON.stringify(payload, null, 2)}\n`;
	for (const output of outputs) {
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, serialized, 'utf8');
	}
}

function round(value: number): number {
	return Number(value.toFixed(4));
}

function percentageChange(from: number, to: number): number {
	return round(((to - from) / from) * 100);
}

function midrankPercentiles(values: Map<string, number>): Map<string, number> {
	const rows = [...values.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
	const result = new Map<string, number>();
	let start = 0;
	while (start < rows.length) {
		let end = start;
		while (end + 1 < rows.length && rows[end + 1]![1] === rows[start]![1]) end += 1;
		const percentile =
			rows.length === 1 ? 100 : round(((start + end) / 2 / (rows.length - 1)) * 100);
		for (let index = start; index <= end; index += 1) result.set(rows[index]![0], percentile);
		start = end + 1;
	}
	return result;
}

const occupations = readJson<OccupationRelease>(FILES.occupations);
const capabilities = readJson<CapabilityArtifact>(FILES.capabilities);
const research = readJson<ResearchArtifact>(FILES.research);
const market = readJson<MarketArtifact>(FILES.market);
const economics = readJson<EconomicArtifact>(FILES.economics);
const skills = readJson<SkillsArtifact>(FILES.skills);

if (occupations.occupations.length !== 1001)
	throw new Error('Evidence vector requires 1,001 V9 occupations');

const sharedPressureValues = new Map<string, number>();
const sharedCapabilityValues = new Map<string, number>();
for (const occupation of occupations.occupations) {
	const capability = capabilities.profiles[occupation.taxonomy.code];
	if (capability && occupation.genai_task_exposure) {
		sharedPressureValues.set(
			occupation.taxonomy.code,
			occupation.genai_task_exposure.mean_score_2025.median
		);
		sharedCapabilityValues.set(
			occupation.taxonomy.code,
			capability.overall.ai_capability_proximity_0_1.median
		);
	}
}
const sharedPressurePercentiles = midrankPercentiles(sharedPressureValues);
const sharedCapabilityPercentiles = midrankPercentiles(sharedCapabilityValues);

const patternCounts = new Map<string, number>();
function countPattern(key: string): void {
	patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
}

const records = occupations.occupations.map(occupation => {
	const code = occupation.taxonomy.code;
	const pressure = occupation.genai_task_exposure;
	const capability = capabilities.profiles[code] ?? null;
	const researchProfile = research.profiles[code] ?? null;
	const demand = market.demand_by_code[code] ?? [];
	const group = economics.group_profiles[occupation.taxonomy.hierarchy.major_group.code] ?? null;
	const skillsProfile = skills.profiles[code] ?? null;
	const sharedPressurePercentile = sharedPressurePercentiles.get(code) ?? null;
	const sharedCapabilityPercentile = sharedCapabilityPercentiles.get(code) ?? null;
	const divergence =
		sharedPressurePercentile != null && sharedCapabilityPercentile != null
			? round(sharedPressurePercentile - sharedCapabilityPercentile)
			: null;
	const patterns: Array<{ key: string; label: string; basis: string }> = [];

	if (divergence != null && divergence >= 25) {
		patterns.push({
			key: 'task_pressure_above_capability_proximity',
			label: 'Task pressure ranks higher than capability proximity',
			basis: `${divergence.toFixed(1)} percentile-point gap within the ${sharedPressureValues.size}-occupation shared subset.`
		});
	}
	if (divergence != null && divergence <= -25) {
		patterns.push({
			key: 'capability_proximity_above_task_pressure',
			label: 'Capability proximity ranks higher than task pressure',
			basis: `${Math.abs(divergence).toFixed(1)} percentile-point gap within the ${sharedPressureValues.size}-occupation shared subset.`
		});
	}
	if ((researchProfile?.derived_theory_use_gap?.value_0_1 ?? 0) >= 0.2) {
		patterns.push({
			key: 'technical_scope_ahead_of_observed_use',
			label: 'Theoretical scope is ahead of observed use',
			basis: `Eloundou minus Anthropic is ${researchProfile!.derived_theory_use_gap!.value_0_1.toFixed(2)} on the source 0–1 scale.`
		});
	}
	if ((pressure?.pressure_rank.percentile ?? -1) >= 75 && demand.length > 0) {
		patterns.push({
			key: 'high_pressure_with_named_demand',
			label: 'High pressure with named demand evidence',
			basis: `Pressure is at or above percentile 75 and ${demand.length} selected official demand source${demand.length === 1 ? '' : 's'} name the occupation.`
		});
	}
	if ((pressure?.pressure_rank.percentile ?? -1) >= 75 && skillsProfile) {
		patterns.push({
			key: 'high_pressure_with_official_skill_path',
			label: 'High pressure with an official skills profile',
			basis:
				'Pressure is at or above percentile 75 and the three-sector Skills Framework pilot has a reviewed role profile.'
		});
	}
	for (const pattern of patterns) countPattern(pattern.key);

	return {
		occupation: {
			ssoc2024: code,
			title: occupation.taxonomy.title,
			major_group: occupation.taxonomy.hierarchy.major_group
		},
		dimensions: {
			task_pressure: pressure
				? {
						construct: 'ILO 2025 GenAI task exposure and within-Singapore pressure rank',
						evidence_kind: 'derived',
						geography: 'Singapore occupation comparison using international ILO task evidence',
						period: '2025',
						grain: 'detailed SSOC 2024 occupation mapped from official ISCO-08 candidates',
						source: { title: 'AI Work Index V9 headline release', artifact: 'occupations-v9.json' },
						mapping_quality: occupation.evidence.mapping_quality,
						headline_effect: 'owner',
						value: {
							pressure_midrank_percentile: pressure.pressure_rank.percentile,
							mean_score_2025: pressure.mean_score_2025.median,
							category_range: [
								pressure.potential25.least_exposed,
								pressure.potential25.most_exposed
							]
						}
					}
				: null,
			capability_proximity: capability
				? {
						construct: 'OECD AI capability proximity to occupation demands',
						evidence_kind: 'mapped research comparison',
						geography: 'OECD/O*NET occupation evidence mapped to Singapore',
						period: capabilities.source.publication_date,
						grain: 'reviewed detailed occupation identity',
						source: {
							publisher: capabilities.source.publisher,
							title: capabilities.source.publication_title,
							url: capabilities.source.publication_url
						},
						mapping_quality: capability.mapping.oecd_candidates[0]?.identity_basis ?? 'unknown',
						headline_effect: 'none',
						value: {
							proximity_0_1: capability.overall.ai_capability_proximity_0_1.median,
							within_shared_subset_midrank_percentile: sharedCapabilityPercentile
						}
					}
				: null,
			theoretical_exposure: researchProfile
				? {
						construct: 'Eloundou theoretical LLM exposure',
						evidence_kind: 'research rating',
						geography: 'United States O*NET occupation mapped to Singapore',
						period: research.sources.eloundou.publication_date,
						grain: researchProfile.eloundou_theoretical_exposure.source_grain,
						source: research.sources.eloundou,
						mapping_quality: 'reviewed detailed occupation identity',
						headline_effect: 'none',
						value: researchProfile.eloundou_theoretical_exposure.value_0_1
					}
				: null,
			observed_use: researchProfile?.anthropic_observed_exposure
				? {
						construct: 'Anthropic observed work-related Claude exposure',
						evidence_kind: 'observed platform use',
						geography: 'Claude platform activity mapped from United States SOC',
						period: research.sources.anthropic_observed_exposure.observation_periods.join(', '),
						grain: researchProfile.anthropic_observed_exposure.source_grain,
						source: research.sources.anthropic_observed_exposure,
						mapping_quality: 'reviewed detailed identity then source parent SOC',
						headline_effect: 'none',
						value: researchProfile.anthropic_observed_exposure.value_0_1
					}
				: null,
			direct_pay: occupation.singapore_market.wages
				? {
						construct: 'gross monthly occupation wages',
						evidence_kind: 'observed',
						geography: occupation.singapore_market.wages.geography,
						period: occupation.singapore_market.wages.reference_period,
						grain: 'direct detailed SSOC 2024 wage row',
						source: occupation.singapore_market.wages.source,
						mapping_quality: occupation.singapore_market.wages.mapping.quality,
						headline_effect: 'none',
						value: occupation.singapore_market.wages.value.gross_monthly_sgd
					}
				: null,
			named_demand: demand.length
				? {
						construct: 'named inclusion in selected official demand sources',
						evidence_kind: 'reviewed match',
						geography: 'Singapore',
						period: demand.map(row => row.published_at).join(', '),
						grain: 'named occupation or source list entry',
						source: demand.map(row => ({
							title: row.label,
							url: row.url,
							source_label: row.source_occupation
						})),
						mapping_quality: 'reviewed against SSOC 2024 title and synonyms',
						headline_effect: 'none',
						value: { source_count: demand.length }
					}
				: null,
			broad_labour_context: group?.employment?.latest
				? {
						construct: 'resident employment by broad occupation group',
						evidence_kind: 'observed broad context',
						geography: group.employment.geography,
						period: group.employment.latest.period,
						grain: group.employment.grain,
						source: { artifact: 'v9-economic-observatory.json' },
						mapping_quality: 'major-group context only',
						headline_effect: 'none',
						value: {
							employment_thousands: group.employment.latest.value,
							year_over_year_pct: group.employment.derived_change?.year_over_year_pct ?? null
						}
					}
				: null,
			official_skills: skillsProfile
				? {
						construct: 'selected official sector-role skills',
						evidence_kind: 'official framework with reviewed occupation mapping',
						geography: 'Singapore',
						period: skills.reviewed_at,
						grain: 'sector job role mapped to detailed SSOC occupation',
						source: skillsProfile.sector_profiles.map(row => row.source),
						mapping_quality: skillsProfile.sector_profiles.map(row => row.mapping.quality),
						headline_effect: 'none',
						value: {
							sector_profiles: skillsProfile.sector_profiles.map(row => ({
								sector: row.sector,
								source_job_role: row.source_job_role,
								technical_skill_count: row.technical_skills.length,
								core_skill_count: row.core_skills.length
							}))
						}
					}
				: null
		},
		shared_subset_comparison:
			divergence == null
				? null
				: {
						population: sharedPressureValues.size,
						pressure_midrank_percentile: sharedPressurePercentile,
						capability_midrank_percentile: sharedCapabilityPercentile,
						pressure_minus_capability_percentile_points: divergence,
						interpretation:
							'Ranks are recomputed only within occupations that have both measures. The difference shows cross-construct disagreement; it is not a combined score.'
					},
		patterns
	};
});

const dimensionKeys = [
	'task_pressure',
	'capability_proximity',
	'theoretical_exposure',
	'observed_use',
	'direct_pay',
	'named_demand',
	'broad_labour_context',
	'official_skills'
] as const;
const coverage = Object.fromEntries(
	dimensionKeys.map(key => [key, records.filter(record => record.dimensions[key] !== null).length])
);

const vector = {
	schema_version: '9.0',
	release: 'V9',
	generated_at: GENERATED_AT,
	snapshot_id: SNAPSHOT_ID,
	headline_effect: 'none_except_existing_task_pressure_owner',
	construct: 'multi_signal_occupation_evidence_vector',
	claim_boundary:
		'An aligned view of separate evidence dimensions. It does not average them, estimate job loss or transfer broad context into a detailed occupation outcome.',
	comparison_rule: {
		shared_subset:
			'Pressure and capability percentiles are recomputed among occupations with both measures before their difference is shown.',
		patterns:
			'Descriptive threshold flags for exploration. They are candidates for interpretation, not causal findings or rankings.',
		missingness: 'null_never_zero',
		headline: 'Only the existing ILO task-pressure dimension owns the headline rank.'
	},
	coverage: {
		ssoc_occupations: records.length,
		shared_pressure_capability_subset: sharedPressureValues.size,
		dimensions: coverage,
		pattern_counts: Object.fromEntries([...patternCounts].sort(([a], [b]) => a.localeCompare(b)))
	},
	records
};

const vacancy = market.national.job_vacancies_august_2026_update;
const vacancyPeriods = Object.keys(vacancy.job_vacancies_thousands).sort();
const entryPeriods = Object.keys(vacancy.entry_level_pmet_vacancies_thousands).sort();
const broadGroupChanges = Object.values(economics.group_profiles)
	.filter(profile => profile.employment?.latest && profile.employment.derived_change)
	.map(profile => ({
		key: `resident_employment_major_group_${profile.major_group.code}`,
		label: `${profile.major_group.title} resident employment`,
		geography: profile.employment!.geography,
		grain: profile.employment!.grain,
		period: profile.employment!.latest!.period,
		latest_value: profile.employment!.latest!.value,
		unit: profile.employment!.unit,
		year_over_year_pct: profile.employment!.derived_change!.year_over_year_pct,
		since_2019_pct: profile.employment!.derived_change!.since_2019_pct,
		source: { artifact: 'v9-economic-observatory.json' }
	}));

const changeLedger = {
	schema_version: '9.0',
	release: 'V9',
	generated_at: GENERATED_AT,
	headline_effect: 'none',
	construct: 'signal_specific_change_ledger',
	claim_boundary:
		'Change is reported only when the same construct, source family and grain are comparable. A market update is never relabelled as a change in AI Work Pressure.',
	baseline_snapshot: {
		id: SNAPSHOT_ID,
		artifact: `snapshots/${SNAPSHOT_ID}.json`,
		status: 'first_comparable_v9_evidence_snapshot'
	},
	pressure_change: {
		status: 'baseline_only',
		current_snapshot: SNAPSHOT_ID,
		previous_comparable_snapshot: null,
		reason:
			'V9 has one frozen ILO 2025 pressure snapshot. Earlier model versions use different taxonomies and formulas.'
	},
	observed_changes: [
		{
			key: 'national_job_vacancies',
			label: 'National job vacancies',
			geography: 'Singapore',
			grain: 'national',
			from: {
				period: vacancyPeriods[0],
				value: vacancy.job_vacancies_thousands[vacancyPeriods[0]!]
			},
			to: {
				period: vacancyPeriods.at(-1),
				value: vacancy.job_vacancies_thousands[vacancyPeriods.at(-1)!]
			},
			unit: 'thousand vacancies',
			change_pct: percentageChange(
				vacancy.job_vacancies_thousands[vacancyPeriods[0]!]!,
				vacancy.job_vacancies_thousands[vacancyPeriods.at(-1)!]!
			),
			source: { title: vacancy.title, url: vacancy.url }
		},
		{
			key: 'entry_level_pmet_vacancies',
			label: 'Entry-level PMET vacancies',
			geography: 'Singapore',
			grain: 'national source definition',
			from: {
				period: entryPeriods[0],
				value: vacancy.entry_level_pmet_vacancies_thousands[entryPeriods[0]!]
			},
			to: {
				period: entryPeriods.at(-1),
				value: vacancy.entry_level_pmet_vacancies_thousands[entryPeriods.at(-1)!]
			},
			unit: 'thousand vacancies',
			change_pct: percentageChange(
				vacancy.entry_level_pmet_vacancies_thousands[entryPeriods[0]!]!,
				vacancy.entry_level_pmet_vacancies_thousands[entryPeriods.at(-1)!]!
			),
			source: { title: vacancy.title, url: vacancy.url }
		},
		...broadGroupChanges
	],
	withheld_change_products: {
		quarterly_pressure_movers: 'needs_second_comparable_v9_pressure_snapshot',
		detailed_demand_movers: 'needs_repeated_same-grain occupation demand source',
		direct_wage_movers: 'needs_repeated SSOC 2024 detailed wage table',
		observed_use_movers: 'needs_second comparable source release and stable occupation mapping',
		capability_movers: 'needs_second comparable OECD capability release'
	}
};

writeCopies(VECTOR_OUTPUTS, vector);
writeCopies(CHANGE_OUTPUTS, changeLedger);

const snapshot = {
	schema_version: '9.0',
	snapshot_id: SNAPSHOT_ID,
	generated_at: GENERATED_AT,
	comparison_contract:
		'Only compare a field with a later snapshot when its construct, source family, grain and mapping remain compatible.',
	records: Object.fromEntries(
		records.map(record => [
			record.occupation.ssoc2024,
			{
				pressure_percentile:
					record.dimensions.task_pressure?.value.pressure_midrank_percentile ?? null,
				capability_proximity: record.dimensions.capability_proximity?.value.proximity_0_1 ?? null,
				theoretical_exposure: record.dimensions.theoretical_exposure?.value ?? null,
				observed_use: record.dimensions.observed_use?.value ?? null,
				gross_monthly_median_sgd: record.dimensions.direct_pay?.value.median ?? null,
				named_demand_source_count: record.dimensions.named_demand?.value.source_count ?? null,
				broad_employment_year_over_year_pct:
					record.dimensions.broad_labour_context?.value.year_over_year_pct ?? null,
				official_skill_profile_count:
					record.dimensions.official_skills?.value.sector_profiles.length ?? null
			}
		])
	)
};
const snapshotPayload = `${JSON.stringify(snapshot, null, 2)}\n`;
fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
if (fs.existsSync(SNAPSHOT_FILE)) {
	if (fs.readFileSync(SNAPSHOT_FILE, 'utf8') !== snapshotPayload) {
		throw new Error(`${SNAPSHOT_ID}: frozen snapshot drift; create a new snapshot ID instead`);
	}
} else {
	fs.writeFileSync(SNAPSHOT_FILE, snapshotPayload, 'utf8');
}

console.log(
	`V9 evidence vector: ${records.length} occupations, ${sharedPressureValues.size} shared capability comparisons, ${changeLedger.observed_changes.length} compatible change rows`
);
