#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import { researchRegistry } from '../src/lib/data/research-registry';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const EXPERIMENTAL_METHODOLOGY_FILE = path.join(DATA_DIR, 'experimental-methodology-v43.json');
const SHADOW_COMPARISON_FILE = path.join(DATA_DIR, 'shadow-comparison-v43.json');
const V5_SIDECARS_FILE = path.join(DATA_DIR, 'v5-sidecars.json');
const V5_EXPERIMENTAL_MODEL_FILE = path.join(DATA_DIR, 'v5-experimental-model.json');
const V5_EXPERIMENTAL_VALIDATION_FILE = path.join(DATA_DIR, 'v5-experimental-validation.json');

const OUT_FILE = path.join(DATA_DIR, 'v5-roadmap.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'v5-roadmap.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'v5-roadmap.json');

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function pickResearch(keys: string[]) {
	return keys
		.map(key => researchRegistry.find(entry => entry.key === key))
		.filter((entry): entry is NonNullable<typeof entry> => !!entry)
		.map(entry => ({
			key: entry.key,
			title: entry.title,
			url: entry.url,
			year: entry.year
		}));
}

function main() {
	const experimental = readJson<{
		headline_promotion_ready: boolean;
		shadow_readiness: { status: string; summary: string };
	}>(EXPERIMENTAL_METHODOLOGY_FILE);
	const shadowComparison = readJson<{
		task_native_count: number;
		band_flip_count: number;
		impact_flip_count: number;
		validation_pass_count: number;
		validation_total: number;
	}>(SHADOW_COMPARISON_FILE);
	const v5Sidecars = fs.existsSync(V5_SIDECARS_FILE)
		? readJson<{
				status: string;
				sidecars?: Record<string, { status: string; artifact: string }>;
			}>(V5_SIDECARS_FILE)
		: null;
	const v5ExperimentalValidation = fs.existsSync(V5_EXPERIMENTAL_VALIDATION_FILE)
		? readJson<{
				status: string;
				comparison_baseline_version?: string;
				summary?: {
					transition_band_flip_count?: number;
					impact_flip_count?: number;
					realized_pass_count?: number;
					realized_scorable_check_count?: number;
				};
				structural_validation?: {
					bls_spearman_rho?: { pass: boolean };
					occupation_family_spearman_rho?: { pass: boolean };
				};
				realized_validation?: {
					vacancy_trend_rho?: { pass: boolean };
					hiring_net_pressure_rho?: { pass: boolean };
					retrenchment_incidence_rho?: { pass: boolean | null; scorable?: boolean };
					employer_pressure_rho?: { pass: boolean | null; scorable?: boolean };
					postings_support_rho?: { pass: boolean | null; scorable?: boolean };
				};
			}>(V5_EXPERIMENTAL_VALIDATION_FILE)
		: null;
	const v5ExperimentalModelPublished =
		fs.existsSync(V5_EXPERIMENTAL_MODEL_FILE) && !!v5ExperimentalValidation;
	const structuralValidationPassCount = v5ExperimentalValidation
		? [
				v5ExperimentalValidation.structural_validation?.bls_spearman_rho?.pass,
				v5ExperimentalValidation.structural_validation?.occupation_family_spearman_rho?.pass
			].filter(Boolean).length
		: 0;
	const realizedValidationPassCount =
		v5ExperimentalValidation?.summary?.realized_pass_count ??
		(v5ExperimentalValidation
			? [
					v5ExperimentalValidation.realized_validation?.vacancy_trend_rho?.pass,
					v5ExperimentalValidation.realized_validation?.hiring_net_pressure_rho?.pass,
					v5ExperimentalValidation.realized_validation?.retrenchment_incidence_rho?.pass,
					v5ExperimentalValidation.realized_validation?.employer_pressure_rho?.pass,
					v5ExperimentalValidation.realized_validation?.postings_support_rho?.pass
				].filter(Boolean).length
			: 0);
	const realizedValidationTotal =
		v5ExperimentalValidation?.summary?.realized_scorable_check_count ??
		(v5ExperimentalValidation
			? [
					v5ExperimentalValidation.realized_validation?.vacancy_trend_rho?.pass !== undefined,
					v5ExperimentalValidation.realized_validation?.hiring_net_pressure_rho?.pass !== undefined,
					v5ExperimentalValidation.realized_validation?.retrenchment_incidence_rho?.scorable ===
						true,
					v5ExperimentalValidation.realized_validation?.employer_pressure_rho?.scorable !== false,
					v5ExperimentalValidation.realized_validation?.postings_support_rho?.scorable !== false
				].filter(Boolean).length
			: 0);

	const payload = {
		version: 'V5-roadmap',
		generated_at: new Date().toISOString(),
		current_live_version: DATA_VINTAGE.model_version,
		prerequisite_release: 'V4.3',
		status:
			DATA_VINTAGE.model_version === 'V5'
				? 'promoted_live'
				: DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
					? 'archived_live_release'
					: DATA_VINTAGE.model_version === 'V4.3'
						? v5ExperimentalModelPublished
							? 'experimental_model_published'
							: v5Sidecars
								? 'sidecars_published'
								: 'ready_to_start'
						: 'blocked_on_v43',
		summary:
			DATA_VINTAGE.model_version === 'V5'
				? 'V5 is now the live structural release. The retained V4.3 baseline, sidecars, and promotion-comparison artifacts remain published for auditability while the next work shifts to V5.x calibration.'
				: DATA_VINTAGE.model_version === 'V6' || DATA_VINTAGE.model_version === 'V7'
					? 'V5 is archived as a former live research program. Its sidecars and experimental comparison artifacts remain published for auditability beneath the current live release.'
					: DATA_VINTAGE.model_version === 'V4.3'
						? v5ExperimentalModelPublished
							? 'V4.3 is live, V5 sidecars are published, and the first integrated V5 experimental model is now available for audit and iteration.'
							: v5Sidecars
								? 'V4.3 is live and the first V5 sidecars are published, so the next step is validating and iterating on those workstreams.'
								: 'V4.3 is live, so V5 can focus on the next scientific upgrades instead of promotion mechanics.'
						: 'V5 remains staged behind the preceding release-governance path.',
		v43_handoff: {
			experimental_status: experimental.shadow_readiness.status,
			experimental_summary: experimental.shadow_readiness.summary,
			headline_promotion_ready: experimental.headline_promotion_ready,
			task_native_count: shadowComparison.task_native_count,
			band_flip_count: shadowComparison.band_flip_count,
			impact_flip_count: shadowComparison.impact_flip_count,
			validation_result: `${shadowComparison.validation_pass_count}/${shadowComparison.validation_total}`
		},
		release_thesis:
			'V5 should be the first release that upgrades the science beyond exposure alone: augmentation heterogeneity, empirical mobility, richer uncertainty, and a clearer realized-risk forecast.',
		formula_family: {
			effective_coverage: 'Σ_t w_it · exposure_t · success_t',
			automation_pressure: 'Σ_t w_it · exposure_t · success_t · autonomy_t · (1 - bottleneck_t)',
			augmentation_upside: 'Σ_t w_it · exposure_t · success_t · (1 - autonomy_t) · bottleneck_t',
			realized_risk_proxy: 'structural_risk_i · adoption_t · capability_t · κ_short'
		},
		sidecar_status: v5Sidecars
			? Object.fromEntries(
					Object.entries(v5Sidecars.sidecars ?? {}).map(([key, value]) => [
						key,
						{ status: value.status, artifact: value.artifact }
					])
				)
			: null,
		experimental_model_status: v5ExperimentalModelPublished
			? {
					status: v5ExperimentalValidation?.status ?? 'experimental_only',
					model_artifact: 'v5-experimental-model.json',
					validation_artifact: 'v5-experimental-validation.json',
					structural_validation_result: `${structuralValidationPassCount}/2`,
					realized_validation_result: `${realizedValidationPassCount}/${realizedValidationTotal}`,
					comparison_baseline_version:
						v5ExperimentalValidation?.comparison_baseline_version ?? DATA_VINTAGE.model_version,
					transition_band_flip_count:
						v5ExperimentalValidation?.summary?.transition_band_flip_count ?? null,
					impact_flip_count: v5ExperimentalValidation?.summary?.impact_flip_count ?? null
				}
			: null,
		workstreams: [
			{
				key: 'augmentation_heterogeneity',
				label: 'Augmentation heterogeneity',
				goal: 'Replace one universal augmentation rule with workflow-sensitive priors informed by empirical productivity studies.',
				research: pickResearch([
					'brynjolfsson_li_raymond_2023',
					'dellacqua_etal_2025',
					'dillon_etal_2025'
				]),
				deliverables: [
					'Role/archetype-level augmentation priors',
					'Updated task-to-augmentation mapping',
					'Validation note on which occupations move most'
				]
			},
			{
				key: 'empirical_mobility',
				label: 'Empirical mobility transitions',
				goal: 'Move transition support from broad heuristic rankings toward observed occupational pathways and wage/training tradeoffs.',
				research: pickResearch(['imf_occupational_mobility_2024']),
				deliverables: [
					'Occupation-to-occupation transition prior',
					'Observed wage delta and training duration fields',
					'Transition ranking override when empirical evidence exists'
				]
			},
			{
				key: 'posterior_uncertainty',
				label: 'Posterior uncertainty',
				goal: 'Upgrade bootstrap intervals into a latent measurement model across the exposure sources and propagate uncertainty through the final score.',
				research: pickResearch(['coyle_poquiz_2025', 'anthropic_economic_index_2026']),
				deliverables: [
					'Latent exposure posterior',
					'80/95% intervals on exposure and net risk',
					'Separation of statistical uncertainty from provenance confidence'
				]
			},
			{
				key: 'realized_risk_forecast',
				label: 'Realized-risk forecast',
				goal: 'Calibrate short-run realized effects separately from structural overlap using adoption and capability evidence.',
				research: pickResearch([
					'bick_blandin_deming_2025',
					'humlum_vestergaard_2025',
					'metr_time_horizons_2026',
					'anthropic_labor_market_impacts_2026'
				]),
				deliverables: [
					'Adoption and capability scalars grounded in literature',
					'Realized-risk proxy distinct from structural and near-term risk',
					'Validation family for short-run labour signals'
				]
			}
		],
		promotion_gates: [
			DATA_VINTAGE.model_version === 'V5'
				? 'Retain the V4.3 baseline snapshot and the V5 promotion-comparison artifacts so future iterations stay auditable.'
				: 'Each workstream must ship as an auditable sidecar artifact before it touches the headline model.',
			'Validation families must map cleanly to the construct they are testing: structural, transition, augmentation, or realized risk.',
			DATA_VINTAGE.model_version === 'V5'
				? 'Future V5.x changes should promote only after they beat the retained V5 baseline on the relevant validation family.'
				: 'No release should absorb multiple unvalidated constructs into the headline score at once.'
		]
	};

	writeJson(OUT_FILE, payload);
	writeJson(SRC_OUT_FILE, payload);
	writeJson(STATIC_OUT_FILE, payload);

	console.log(`Built V5 roadmap at ${STATIC_OUT_FILE}`);
}

main();
