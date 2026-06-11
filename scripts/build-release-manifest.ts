#!/usr/bin/env bun
/**
 * build-release-manifest.ts — Build a versioned public release manifest with
 * checksums, file sizes, and generation metadata for downloadable artifacts.
 *
 * Run: bun run scripts/build-release-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const VERSION_TAG = DATA_VINTAGE.model_version.toLowerCase().replaceAll('.', '');
const OUT_FILE = path.join(STATIC_DATA_DIR, `release-manifest-${VERSION_TAG}.json`);
const VERSIONED_OUT_FILE = path.join(STATIC_DATA_DIR, `release-manifest-${VERSION_TAG}.json`);
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'release-manifest.json');

interface ReleaseArtifactDefinition {
	file: string;
	label: string;
	category:
		| 'structural_score'
		| 'context_bundle'
		| 'task_skill_enrichment'
		| 'labour_monitor'
		| 'worker_profile'
		| 'lfr_context'
		| 'geography_context'
		| 'macro_context'
		| 'national_ai_context'
		| 'transition_support'
		| 'offset_potential'
		| 'transition_infrastructure'
		| 'governance'
		| 'provenance'
		| 'forecast_readiness'
		| 'research_memory'
		| 'shadow_model'
		| 'v5_sidecar'
		| 'v5_experimental_model'
		| 'roadmap';
	description: string;
}

const ARTIFACTS: ReleaseArtifactDefinition[] = [
	{
		file: `sg-ai-occupations-${VERSION_TAG}.csv`,
		label: `${DATA_VINTAGE.model_version} structural score CSV`,
		category: 'structural_score',
		description: 'Flattened CSV export of the canonical live structural dataset.'
	},
	{
		file: `sg-ai-occupations-${VERSION_TAG}.json`,
		label: `${DATA_VINTAGE.model_version} structural score JSON`,
		category: 'structural_score',
		description: 'Canonical live structural score JSON export matching the app dataset exactly.'
	},
	{
		file: 'sg-ai-occupations-v43.csv',
		label: 'V4.3 structural score CSV snapshot',
		category: 'structural_score',
		description: 'Versioned CSV snapshot for the retained V4.3 structural release.'
	},
	{
		file: 'sg-ai-occupations-v43.json',
		label: 'V4.3 structural score JSON snapshot',
		category: 'structural_score',
		description: 'Versioned JSON snapshot for the retained V4.3 structural release.'
	},
	{
		file: 'sg-ai-occupations-v5.csv',
		label: 'V5 structural score CSV snapshot',
		category: 'structural_score',
		description:
			'Versioned CSV snapshot for the promoted V5 live structural release with transition-adjusted and realized-risk adjunct fields.'
	},
	{
		file: 'sg-ai-occupations-v5.json',
		label: 'V5 structural score JSON snapshot',
		category: 'structural_score',
		description:
			'Versioned JSON snapshot for the promoted V5 live structural release with transition-adjusted and realized-risk adjunct fields.'
	},
	{
		file: 'sg-ai-occupations-v42.csv',
		label: 'V4.2 structural score CSV snapshot',
		category: 'structural_score',
		description: 'Historical CSV snapshot for the retained V4.2 pre-promotion baseline.'
	},
	{
		file: 'sg-ai-occupations-v42.json',
		label: 'V4.2 structural score JSON snapshot',
		category: 'structural_score',
		description: 'Historical JSON snapshot for the retained V4.2 pre-promotion baseline.'
	},
	{
		file: 'onet-enrichment.json',
		label: 'O*NET task and technology enrichment',
		category: 'task_skill_enrichment',
		description:
			'Title-matched O*NET task and technology-skill enrichment used as supporting context for occupation and role pages.'
	},
	{
		file: 'sg-context-pack-2025.json',
		label: 'Singapore context pack',
		category: 'context_bundle',
		description:
			'Published Singapore context bundle around the structural score: labour monitor, worker profile, industry context, sector wage anchors, geography context, macro labour context, and national AI context.'
	},
	{
		file: 'sg-labour-monitor-2025.json',
		label: 'Singapore labour monitor',
		category: 'labour_monitor',
		description: 'Published cluster-level labour monitor used as current evidence around the score.'
	},
	{
		file: 'sg-worker-profile-2025.json',
		label: 'Singapore worker profile',
		category: 'worker_profile',
		description: 'Published Labour Force 2025 worker-profile context and detailed gender anchors.'
	},
	{
		file: 'sg-lfr-deltas-2025.json',
		label: 'Singapore Section D deltas',
		category: 'lfr_context',
		description:
			'Published 2024 to 2025 Labour Force Section D family, cluster, and industry-mix deltas used for validation and contextual reporting.'
	},
	{
		file: 'sg-geography-context-2020.json',
		label: 'Singapore geography context',
		category: 'geography_context',
		description:
			'Published Census 2020 geography context covering planning-area residence concentration and travel-time patterns by broad occupation group.'
	},
	{
		file: 'sg-macro-context-2025.json',
		label: 'Singapore macro labour context',
		category: 'macro_context',
		description:
			'Published macro labour context covering unemployment and labour-tightness series for Singapore.'
	},
	{
		file: 'sg-ai-in-singapore-2025.json',
		label: 'AI in Singapore context',
		category: 'national_ai_context',
		description:
			'Official IMDA and MOM national AI adoption, workforce, and programme context used for reports and contextual framing.'
	},
	{
		file: 'sg-transition-infrastructure-2025.json',
		label: 'Transition infrastructure layer',
		category: 'transition_infrastructure',
		description:
			'Official Singapore transition-infrastructure artifact covering published programmes, WSQ training-system activity, and Jobs Transformation Maps coverage.'
	},
	{
		file: 'sg-transition-support-v4.json',
		label: 'Transition support layer',
		category: 'transition_support',
		description:
			'Published hybrid transition-support artifact combining the deterministic transition-capacity model with official Singapore transition-infrastructure context.'
	},
	{
		file: 'countries/us/support.json',
		label: 'United States evidence support bundle',
		category: 'context_bundle',
		description:
			'Published United States evidence-support bundle combining O*NET occupation descriptions, task primitives, technology skills, work context, Job Zones, BLS OEWS wages, BLS employment projections, BLS ORS requirements, BLS OOH narrative, BLS skills data, Anthropic task penetration, and CPS age profile context.'
	},
	{
		file: 'sg-offset-potential-v4.json',
		label: 'Offset potential layer',
		category: 'offset_potential',
		description:
			'Published heuristic support layer estimating how demand persistence, transition support, task reallocation, and switching friction could cushion structural pressure.'
	},
	{
		file: `claims-matrix-${VERSION_TAG}.json`,
		label: 'Public claims matrix',
		category: 'governance',
		description:
			'Machine-readable registry of major public claims, evidence strength, and source keys for the current release.'
	},
	{
		file: 'public-field-source-map.json',
		label: 'Public field source map',
		category: 'provenance',
		description:
			'Machine-readable field-level provenance map for the main public datasets, including source keys, vintages, and transformation notes.'
	},
	{
		file: `forecast-readiness-${VERSION_TAG}.json`,
		label: 'Forecast readiness matrix',
		category: 'forecast_readiness',
		description:
			'Non-promoted V7 source, duplication, and validation-gate matrix for moving from structural pressure to forecast-grade labour-market claims.'
	},
	{
		file: 'experimental-methodology-v43.json',
		label: 'V4.3 shadow-model readiness',
		category: 'governance',
		description:
			'Governance artifact for the V4.3 shadow model, including readiness, promotion gates, and promoted/live state.'
	},
	{
		file: 'shadow-scores-v43.json',
		label: 'V4.3 shadow scores',
		category: 'shadow_model',
		description:
			'Per-occupation task-adjusted shadow scores retained for comparison against the earlier V4.2 baseline.'
	},
	{
		file: 'shadow-comparison-v43.json',
		label: 'V4.3 shadow comparison summary',
		category: 'shadow_model',
		description:
			'Summary of task-native eligibility, score deltas, band flips, and anchor-review counts from the retained V4.3 shadow-model audit trail.'
	},
	{
		file: 'shadow-validation-v43.json',
		label: 'V4.3 shadow validation comparison',
		category: 'shadow_model',
		description:
			'Comparison of the published shadow scores against the validation benchmarks from the pre-promotion V4.2 live release.'
	},
	{
		file: 'shadow-anchor-review-v43.json',
		label: 'V4.3 shadow anchor review',
		category: 'shadow_model',
		description:
			'Side-by-side anchor occupation screen used to flag large label shifts before any headline promotion decision.'
	},
	{
		file: 'research-library.json',
		label: 'Research library',
		category: 'research_memory',
		description:
			'Machine-readable registry of the academic papers, reports, and datasets cited by the methodology, validation, and V5 roadmap.'
	},
	{
		file: 'v5-roadmap.json',
		label: 'V5 roadmap',
		category: 'roadmap',
		description:
			'Machine-readable post-promotion roadmap for what comes after the live V5 structural release.'
	},
	{
		file: 'v5-sidecars.json',
		label: 'V5 sidecar summary',
		category: 'v5_sidecar',
		description:
			'Summary artifact for the published V5 workstreams: augmentation heterogeneity, empirical mobility, posterior uncertainty, and realized-risk forecasting.'
	},
	{
		file: 'v5-augmentation-heterogeneity.json',
		label: 'V5 augmentation heterogeneity sidecar',
		category: 'v5_sidecar',
		description:
			'Pilot sidecar estimating workflow-sensitive augmentation readiness and heterogeneous augmentation potential without changing the live score.'
	},
	{
		file: 'v5-empirical-mobility.json',
		label: 'V5 empirical mobility sidecar',
		category: 'v5_sidecar',
		description:
			'Observed-mobility-enriched transition sidecar built on top of the published transition-support layer.'
	},
	{
		file: 'v5-posterior-uncertainty.json',
		label: 'V5 posterior uncertainty sidecar',
		category: 'v5_sidecar',
		description:
			'Latent source-measurement sidecar over persisted exposure-source percentiles with task-aware structural alignment.'
	},
	{
		file: 'v5-realized-risk.json',
		label: 'V5 realized-risk sidecar',
		category: 'v5_sidecar',
		description:
			'Offset-buffered realized-risk proxy sidecar derived from the live forecast engine and published offset-potential layer.'
	},
	{
		file: 'v5-experimental-model.json',
		label: 'V5 experimental model',
		category: 'v5_experimental_model',
		description:
			'Promotion-comparison artifact for V5, retaining the integrated model outputs against the retained V4.3 baseline.'
	},
	{
		file: 'v5-experimental-validation.json',
		label: 'V5 experimental validation',
		category: 'v5_experimental_model',
		description:
			'Validation and comparison artifact for the promoted V5 model versus the retained V4.3 baseline.'
	},
	{
		file: 'quarterly-report.json',
		label: 'Quarterly report',
		category: 'governance',
		description:
			'Quarterly snapshot and drift summary for the current structural release versus the retained prior snapshot.'
	},
	{
		file: '../llms.txt',
		label: 'LLMs summary',
		category: 'governance',
		description:
			'Current AI-facing summary file for retrieval, citation, and answer-engine consumption.'
	},
	{
		file: '../llms-full.txt',
		label: 'LLMs full reference',
		category: 'governance',
		description:
			'Expanded AI-facing reference file with current methodology, caveats, and citation guidance.'
	},
	{
		file: 'site-status.json',
		label: 'Public site status',
		category: 'governance',
		description:
			'Canonical public status object covering current structural release, live monitor vintage, and latest official update state.'
	},
	{
		file: 'releases.json',
		label: 'Public release history',
		category: 'governance',
		description:
			'Ordered release and update history spanning structural releases, quarterly briefings, and official monitor updates.'
	},
	{
		file: 'backtests/current-validation.json',
		label: 'Current cluster validation',
		category: 'governance',
		description:
			'Current cluster-level directional validation artifact for the live labour-monitor vintage.'
	},
	{
		file: 'backtests/bls-crosswalk-validation.json',
		label: 'BLS crosswalk validation',
		category: 'governance',
		description:
			'Cross-country convergent validation artifact comparing structural risk against US BLS projected employment change.'
	},
	{
		file: 'backtests/multi-period-validation.json',
		label: 'Multi-period temporal validation',
		category: 'governance',
		description:
			'Temporal validation artifact measuring how cluster risk rankings align with vacancy and hiring patterns across multiple observed periods.'
	},
	{
		file: 'backtests/calibration-diagnostics.json',
		label: 'Calibration diagnostics',
		category: 'governance',
		description:
			'Segment-level calibration diagnostic showing how direct vs fallback mappings and confidence tiers align with external BLS projected employment change.'
	},
	{
		file: 'backtests/occupation-family-validation.json',
		label: 'Occupation-family validation',
		category: 'governance',
		description:
			'Family-level convergent validation aggregating occupations to 2-digit SSOC families before comparing structural risk with BLS projected employment change.'
	},
	{
		file: 'backtests/forecast-horizon-validation.json',
		label: 'Forecast-horizon sidecar',
		category: 'governance',
		description:
			'Non-promoted forecast-horizon harness: frozen May 2026 cluster risk vs official outcomes at t+1Q/t+2Q/t+4Q, with the pre-registered protocol, naive benchmark, and 4-quarter promotion gate published while post-baseline quarters are still zero.'
	},
	{
		file: 'backtests/imf-convergence.json',
		label: 'IMF Singapore convergence',
		category: 'governance',
		description:
			'Convergent-directional Singapore macro benchmark comparing employment-weighted exposure x complementarity bins against the IMF SIP/2024/040 estimates, with the percentile-internal framing caveat leading.'
	},
	{
		file: 'backtests/sensitivity-analysis.json',
		label: 'Sensitivity analysis',
		category: 'governance',
		description:
			'Robustness evidence for the hand-set V7 constants: one-at-a-time and joint Monte-Carlo perturbations with rank-stability, band-flip, and top-list overlap metrics against the baseline ranking.'
	}
];

function sha256(buffer: Buffer): string {
	return createHash('sha256').update(buffer).digest('hex');
}

function buildArtifact(definition: ReleaseArtifactDefinition) {
	const filePath = path.join(STATIC_DATA_DIR, definition.file);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing artifact: ${definition.file}`);
	}

	const bytes = fs.readFileSync(filePath);
	const stats = fs.statSync(filePath);

	return {
		...definition,
		bytes: stats.size,
		sha256: sha256(bytes),
		generated_at: stats.mtime.toISOString()
	};
}

const manifest = {
	version: DATA_VINTAGE.model_version,
	generated_at: new Date().toISOString(),
	score_dataset_generated_at: DATA_VINTAGE.last_updated,
	artifacts: ARTIFACTS.map(buildArtifact)
};

fs.mkdirSync(STATIC_DATA_DIR, { recursive: true });
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
fs.writeFileSync(VERSIONED_OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Built release manifest at ${OUT_FILE}`);
