#!/usr/bin/env bun
/**
 * score.ts — V4.0 scoring pipeline for Singapore AI Job Exposure Map.
 *
 * Computes 4-source exposure ensemble (AIOE + Anthropic + Eloundou + ILO),
 * Pizzinelli theta, market resilience layer, and net displacement risk
 * for each of 562 Singapore SSOC occupations.
 *
 * V4.0: 4-source exposure ensemble motivated by the broader ensemble literature.
 * V3.1 additions:
 *   - Anthropic Economic Index observed AI usage calibration
 *   - MOM Shortage Occupation List (SOL) 2026 demand bonus
 *   - Crosswalk dispersion penalty for confidence
 *   - Variable confidence factors based on data match quality
 *
 * Formula:
 *   exposure     = pctile(aioe)
 *   bottleneck   = pctile(theta)
 *   market_modifier = 1 - 0.35 * market_resilience
 *   net_risk     = exposure_calibrated * (1 - bottleneck) * market_modifier
 *
 * Run: bun run scripts/score.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
	ssocToIsco,
	iscoToSoc,
	iscoSubMajorGroup,
	_socCodesForIscoPrefix,
	ISCO_TO_SOC
} from './crosswalk';
import {
	getRiskBand,
	classifyImpactType,
	RISK_BAND_THRESHOLDS,
	MARKET_CONSTANTS,
	AUGMENTATION_THRESHOLDS,
	CONFIDENCE_THRESHOLDS,
	CONFIDENCE_COMPONENT_WEIGHTS,
	CONFIDENCE_PENALTIES,
	SOURCE_COVERAGE_SCORES,
	EXPOSURE_SOURCE_METADATA,
	SIGNAL_AGREEMENT_SCORES,
	SENSITIVITY_SCORES,
	SIGNAL_CONFLICT_THRESHOLDS,
	classifyExposureAgreement,
	normalizeExposureSourceWeights
} from '../src/lib/data/scoring-constants';
import {
	occupationDataBasisTemplate,
	type OccupationDataBasis
} from '../src/lib/data/data-contract';

// ===== Workflow Overlay (from archetype system) =====
function getOverlayForOccupation(ssoc: string, title: string, _majorGroup: string) {
	// Inline archetype classification matching role-archetypes.ts logic
	const t = title.toLowerCase();
	const prefix2 = ssoc.substring(0, 2);

	let archetype = 'general_professional';
	if (
		t.includes('journalist') ||
		t.includes('editor') ||
		t.includes('writer') ||
		t.includes('reporter')
	)
		archetype = 'writing_editorial';
	else if (
		t.includes('teacher') ||
		t.includes('lecturer') ||
		t.includes('instructor') ||
		t.includes('trainer')
	)
		archetype = 'teaching_learning';
	else if (
		t.includes('software') ||
		t.includes('developer') ||
		t.includes('programmer') ||
		t.includes('web ')
	)
		archetype = 'software_engineering';
	else if (
		(t.includes('data') || t.includes('statistician') || t.includes('analyst')) &&
		!t.includes('financial')
	)
		archetype = 'data_analytics';
	else if (t.includes('product manager') || t.includes('product director'))
		archetype = 'product_strategy';
	else if (t.includes('marketing') || t.includes('sales') || t.includes('business development'))
		archetype = 'sales_gtm';
	else if (
		t.includes('accountant') ||
		t.includes('auditor') ||
		t.includes('financial') ||
		t.includes('fund') ||
		t.includes('investment')
	)
		archetype = 'finance_investing';
	else if (t.includes('human resource') || t.includes('personnel') || t.includes('recruiter'))
		archetype = 'people_recruiting';
	else if (
		t.includes('nurse') ||
		t.includes('doctor') ||
		t.includes('surgeon') ||
		t.includes('physician') ||
		t.includes('therapist') ||
		t.includes('dentist') ||
		t.includes('pharmacist')
	)
		archetype = 'healthcare_clinical';
	else if (
		(t.includes('designer') || t.includes('architect')) &&
		!t.includes('solution') &&
		!t.includes('enterprise')
	)
		archetype = 'design_creative';
	else if (t.includes('lawyer') || t.includes('legal') || t.includes('compliance'))
		archetype = 'legal_compliance';
	else if (
		t.includes('logistics') ||
		t.includes('supply chain') ||
		t.includes('warehouse') ||
		t.includes('procurement')
	)
		archetype = 'operations_logistics';
	else if (
		t.includes('waiter') ||
		t.includes('cook') ||
		t.includes('chef') ||
		t.includes('barista') ||
		t.includes('receptionist')
	)
		archetype = 'service_hospitality';
	else if (prefix2 === '25') archetype = 'software_engineering';
	else if (prefix2 === '22') archetype = 'healthcare_clinical';
	else if (prefix2 === '23') archetype = 'teaching_learning';
	else if (prefix2 === '26') archetype = 'writing_editorial';
	else if (prefix2 === '21') archetype = 'data_analytics';
	else if (prefix2 === '33' || prefix2 === '34' || prefix2 === '35')
		archetype = 'general_technical';
	else if (prefix2 === '41' || prefix2 === '42') archetype = 'general_clerical';
	else if (prefix2 === '51' || prefix2 === '52' || prefix2 === '54')
		archetype = 'service_hospitality';

	// Archetype overlay defaults (matching workflow-overlay.ts)
	const defaults: Record<string, [number, number, number, number, number, number, number, number]> =
		{
			writing_editorial: [0.85, 0.3, 0.75, 0.5, 0.6, 0.25, 0.1, 0.8],
			teaching_learning: [0.55, 0.85, 0.65, 0.6, 0.8, 0.45, 0.75, 0.4],
			software_engineering: [0.7, 0.45, 0.7, 0.55, 0.4, 0.15, 0.05, 0.95],
			data_analytics: [0.5, 0.3, 0.65, 0.5, 0.45, 0.2, 0.05, 0.8],
			product_strategy: [0.65, 0.7, 0.8, 0.65, 0.75, 0.15, 0.1, 0.6],
			sales_gtm: [0.35, 0.75, 0.6, 0.55, 0.9, 0.2, 0.3, 0.55],
			finance_investing: [0.3, 0.4, 0.55, 0.6, 0.65, 0.8, 0.1, 0.5],
			people_recruiting: [0.3, 0.65, 0.6, 0.7, 0.85, 0.4, 0.2, 0.5],
			healthcare_clinical: [0.2, 0.8, 0.7, 0.65, 0.85, 0.9, 0.95, 0.35],
			design_creative: [0.9, 0.4, 0.8, 0.4, 0.55, 0.1, 0.1, 0.85],
			operations_logistics: [0.2, 0.7, 0.4, 0.65, 0.6, 0.55, 0.5, 0.4],
			legal_compliance: [0.4, 0.35, 0.75, 0.8, 0.65, 0.95, 0.15, 0.3],
			field_manual: [0.1, 0.5, 0.3, 0.45, 0.25, 0.4, 0.95, 0.2],
			service_hospitality: [0.15, 0.8, 0.45, 0.4, 0.85, 0.25, 0.9, 0.25],
			general_professional: [0.45, 0.5, 0.55, 0.55, 0.55, 0.35, 0.15, 0.5],
			general_technical: [0.3, 0.45, 0.4, 0.5, 0.35, 0.3, 0.4, 0.45],
			general_clerical: [0.1, 0.35, 0.25, 0.55, 0.4, 0.3, 0.2, 0.4]
		};

	const d = defaults[archetype] ?? defaults['general_professional'];
	return {
		creative_generation: d[0],
		real_time_coordination: d[1],
		ambiguity_tolerance: d[2],
		institutional_knowledge: d[3],
		relationship_intensity: d[4],
		regulatory_weight: d[5],
		physical_presence: d[6],
		tool_velocity: d[7]
	};
}

// ===== Configuration =====
const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const EXT_DIR = path.join(RAW_DIR, 'external');
const INT_DIR = path.join(DATA_DIR, 'intermediate');
const OUT_FILE = path.join(DATA_DIR, 'occupations.json');
const SRC_OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'occupations.json');

// ===== Types =====
interface SgOccupation {
	ssoc: string;
	title: string;
	major_group: string;
	basic_wage_25th: number | null;
	basic_wage_median: number | null;
	basic_wage_75th: number | null;
	gross_wage_25th: number | null;
	gross_wage_median: number | null;
	gross_wage_75th: number | null;
	estimated_employment_thousands: number | null;
	group_employment_thousands: number | null;
	group_median_income: number | null;
}

interface MarketScores {
	market_momentum: number;
	occupation_scarcity: number;
	market_resilience: number;
	market_modifier: number;
}

interface EvidenceSignals {
	anthropic_calibrated: boolean;
	anthropic_gap: number | null;
	anthropic_observed_pctile: number | null;
	sol_match: 'exact' | 'prefix' | false;
	jobs_in_demand_match: 'exact' | 'prefix' | false;
	exposure_blend_strategy: 'reliability_weighted';
	exposure_agreement:
		| 'consensus_high'
		| 'consensus_low'
		| 'aligned_mid'
		| 'divergent'
		| 'insufficient_data';
	exposure_source_count: number;
	exposure_source_keys: string[];
	exposure_source_weights: Partial<Record<'aioe' | 'anthropic' | 'eloundou' | 'ilo', number>>;
	signal_conflict: boolean;
	signal_conflict_reasons: string[];
}

interface ConfidenceScores {
	score: number;
	level: 'high' | 'medium' | 'low';
	crosswalk_quality: number;
	market_data_granularity: number;
	source_freshness: number;
	source_coverage: number;
	signal_agreement: number;
	sensitivity: number;
	exposure_source_count: number;
}

interface StabilityScores {
	optimistic_risk: number;
	optimistic_band: RiskBand;
	pessimistic_risk: number;
	pessimistic_band: RiskBand;
	distance_to_band_edge: number;
	label: 'stable' | 'watch' | 'sensitive';
}

interface LabourClusterMonitor {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; rate: number }>;
	};
	hiring: {
		recruitment_rate: number;
		resignation_rate: number;
		net_pressure: number;
		signal: 1 | 0 | -1;
	} | null;
	retrenchment: {
		latest_count: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; count: number }>;
	} | null;
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	data_as_of: string;
}

interface RawScores {
	aioe: number;
	theta: number;
	c_aioe: number;
	log_wage_spread: number | null;
	wage_position: number | null;
}

type RiskBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

interface ScoredOccupation {
	ssoc: string;
	title: string;
	major_group: string;
	major_group_code: number;
	gross_wage_median: number | null;
	gross_wage_25th: number | null;
	gross_wage_75th: number | null;
	employment_thousands: number | null;
	employment_basis: 'estimated_sg_submajor';
	group_employment_thousands: number | null;
	data_basis: OccupationDataBasis;
	exposure: number;
	bottleneck: number;
	market: MarketScores;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: RiskBand;
	impact_type: 'at_risk' | 'ai_leveraged' | 'stable' | 'mixed';
	evidence: EvidenceSignals;
	confidence: ConfidenceScores;
	stability: StabilityScores;
	labour_monitor_key: LabourClusterMonitor['cluster_key'] | null;
	raw: RawScores;
	isco_codes_matched: string[];
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	// Backward-compat: keep scores object for frontend
	scores: {
		aioe: number;
		theta: number;
		c_aioe: number;
		category: string;
		isco_codes_matched: string[];
		match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	};
}

function cloneOccupationDataBasis(): OccupationDataBasis {
	return {
		employment_estimate: { ...occupationDataBasisTemplate.employment_estimate },
		wage_pool_proxy: { ...occupationDataBasisTemplate.wage_pool_proxy },
		education: { ...occupationDataBasisTemplate.education },
		sg_context: {
			pwm_covered: { ...occupationDataBasisTemplate.sg_context.pwm_covered },
			licensed_profession: { ...occupationDataBasisTemplate.sg_context.licensed_profession },
			foreign_worker_dependency: {
				...occupationDataBasisTemplate.sg_context.foreign_worker_dependency
			},
			skillsfuture_eligible: {
				...occupationDataBasisTemplate.sg_context.skillsfuture_eligible
			}
		}
	};
}

// ===== Major group code mapping =====
const MAJOR_GROUP_CODES: Record<string, number> = {
	MANAGERS: 1,
	PROFESSIONALS: 2,
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': 3,
	'CLERICAL SUPPORT WORKERS': 4,
	'SERVICE AND SALES WORKERS': 5,
	'CRAFTSMEN AND RELATED TRADES WORKERS': 7,
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 8,
	'CLEANERS, LABOURERS AND RELATED WORKERS': 9,
	// Alternative names that might appear
	'SKILLED AGRICULTURAL AND FISHERY WORKERS': 6,
	'AGRICULTURAL AND FISHERY WORKERS': 6
};

// ===== Mapping from major_group to employment CSV row names =====
const MAJOR_GROUP_TO_EMPL_CSV: Record<string, string> = {
	MANAGERS: 'Managers & Administrators (Including Working Proprietors)',
	PROFESSIONALS: 'Professionals',
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': 'Associate Professionals & Technicians',
	'CLERICAL SUPPORT WORKERS': 'Clerical Support Workers',
	'SERVICE AND SALES WORKERS': 'Service & Sales Workers',
	'CRAFTSMEN AND RELATED TRADES WORKERS': 'Craftsmen & Related Trade Workers',
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 'Plant & Machine Operators & Assemblers',
	'CLEANERS, LABOURERS AND RELATED WORKERS': 'Cleaners, Labourers & Related Workers',
	'AGRICULTURAL AND FISHERY WORKERS': 'Others'
};

// ===== Mapping from major_group to income CSV row name prefix =====
const MAJOR_GROUP_TO_INCOME_CSV: Record<string, string> = {
	MANAGERS: 'Managers & Administrators (Including Working Proprietors)',
	PROFESSIONALS: 'Professionals',
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': 'Associate Professionals & Technicians',
	'CLERICAL SUPPORT WORKERS': 'Clerical Support Workers',
	'SERVICE AND SALES WORKERS': 'Service & Sales Workers',
	'CRAFTSMEN AND RELATED TRADES WORKERS': 'Craftsmen & Related Trades Workers',
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 'Plant & Machine Operators & Assemblers',
	'CLEANERS, LABOURERS AND RELATED WORKERS': 'Cleaners, Labourers & Related Workers',
	'AGRICULTURAL AND FISHERY WORKERS': 'Cleaners, Labourers & Related Workers'
};

// ===== Mapping from SSOC major groups to labour-monitor clusters =====
const MAJOR_GROUP_TO_LABOUR_CLUSTER: Record<
	string,
	'pmet' | 'clerical_sales_service' | 'production_transport'
> = {
	MANAGERS: 'pmet',
	PROFESSIONALS: 'pmet',
	'ASSOCIATE PROFESSIONALS AND TECHNICIANS': 'pmet',
	'CLERICAL SUPPORT WORKERS': 'clerical_sales_service',
	'SERVICE AND SALES WORKERS': 'clerical_sales_service',
	'CRAFTSMEN AND RELATED TRADES WORKERS': 'production_transport',
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 'production_transport',
	'CLEANERS, LABOURERS AND RELATED WORKERS': 'production_transport',
	'AGRICULTURAL AND FISHERY WORKERS': 'production_transport'
};

// ===== Pizzinelli Theta Variables =====
// From Pizzinelli et al. (2023), IMF Working Paper
// 6 dimensions, 12 variables total (11 Work Context + 1 Job Zone)
const _THETA_DIMENSIONS = {
	communication: {
		elements: ['4.C.1.a.2.l', '4.C.1.a.2.c'], // Face-to-face, Public Speaking
		scale: 5 // 1-5 context scale
	},
	responsibility: {
		elements: ['4.C.1.c.2', '4.C.1.c.1'], // Outcomes/Results, Health/Safety
		scale: 5
	},
	physical: {
		elements: ['4.C.2.a.1.c', '4.C.2.a.3'], // Outdoors, Physical Proximity
		scale: 5
	},
	criticality: {
		elements: ['4.C.3.a.1', '4.C.3.a.4', '4.C.3.a.2.b'], // Consequence of Error, Freedom, Frequency
		scale: 5
	},
	routine_inverted: {
		elements: ['4.C.3.b.2', '4.C.3.b.8'], // Automation (inverted), Structured (not inverted)
		scale: 5
	},
	skills: {
		elements: ['job_zone'], // Job Zone (1-5), scaled to 20-100 then to 0-1
		scale: 5
	}
};

// ===== Step 1: Load AIOE scores =====
function loadAioe(): Map<string, number> {
	console.log('Loading AIOE scores...');
	const wb = XLSX.readFile(path.join(EXT_DIR, 'AIOE_DataAppendix.xlsx'));
	const ws = wb.Sheets['Appendix A'];
	const data = XLSX.utils.sheet_to_json<{ 'SOC Code': string; AIOE: number }>(ws);

	const aioeMap = new Map<string, number>();
	for (const row of data) {
		const soc = row['SOC Code'];
		const aioe = row['AIOE'];
		if (soc && typeof aioe === 'number') {
			aioeMap.set(soc, aioe);
		}
	}

	console.log(`  Loaded ${aioeMap.size} AIOE scores`);
	return aioeMap;
}

// ===== Step 2: Load O*NET Work Context =====
function loadWorkContext(): Map<string, Map<string, number>> {
	console.log('Loading O*NET Work Context...');
	const filePath = path.join(EXT_DIR, 'Work_Context.txt');
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	// Map: SOC code -> element ID -> value
	const wcMap = new Map<string, Map<string, number>>();

	// Parse tab-delimited, filter to CX scale only (context mean)
	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split('\t');
		if (parts.length < 6) continue;

		const [socFull, elementId, , scaleId, , dataValueStr] = parts;
		if (scaleId !== 'CX') continue;

		const dataValue = parseFloat(dataValueStr);
		if (isNaN(dataValue)) continue;

		// Normalize SOC code: "11-1011.00" -> "11-1011"
		const soc = socFull.split('.')[0];

		if (!wcMap.has(soc)) {
			wcMap.set(soc, new Map());
		}
		// If multiple detailed codes (e.g. 11-1011.00 and 11-1011.03), take the base
		const existing = wcMap.get(soc)!;
		if (!existing.has(elementId)) {
			existing.set(elementId, dataValue);
		} else {
			// Average with existing (handles multiple detailed SOC entries)
			const current = existing.get(elementId)!;
			const count = (existing.get(`${elementId}_count`) || 1) + 1;
			existing.set(elementId, (current * (count - 1) + dataValue) / count);
			existing.set(`${elementId}_count`, count);
		}
	}

	console.log(`  Loaded Work Context for ${wcMap.size} SOC codes`);
	return wcMap;
}

// ===== Step 3: Load Job Zones =====
function loadJobZones(): Map<string, number> {
	console.log('Loading O*NET Job Zones...');
	const wb = XLSX.readFile(path.join(EXT_DIR, 'Job_Zones.xlsx'));
	const ws = wb.Sheets[wb.SheetNames[0]];
	const data = XLSX.utils.sheet_to_json<{
		'O*NET-SOC Code': string;
		'Job Zone': number;
	}>(ws);

	const jzMap = new Map<string, number>();
	for (const row of data) {
		const socFull = row['O*NET-SOC Code'];
		const jz = row['Job Zone'];
		if (!socFull || typeof jz !== 'number') continue;

		const soc = socFull.split('.')[0];
		if (!jzMap.has(soc)) {
			jzMap.set(soc, jz);
		} else {
			// Average for multiple detailed codes
			jzMap.set(soc, (jzMap.get(soc)! + jz) / 2);
		}
	}

	console.log(`  Loaded Job Zones for ${jzMap.size} SOC codes`);
	return jzMap;
}

// ===== Step 3b: Load Eloundou GPTs-are-GPTs exposure (GPT-4 beta rating) =====
function loadEloundouExposure(): Map<string, number> {
	console.log('Loading Eloundou GPTs-are-GPTs exposure...');
	const filePath = path.join(EXT_DIR, 'eloundou_gpts_occ_level.csv');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: eloundou_gpts_occ_level.csv not found, skipping');
		return new Map();
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	const rawMap = new Map<string, number[]>();

	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split(',');
		if (parts.length < 4) continue;
		const soc = parts[0].split('.')[0]; // Remove .00 suffix
		const beta = parseFloat(parts[3]); // dv_rating_beta (GPT-4, middle estimate)
		if (soc && !isNaN(beta)) {
			const arr = rawMap.get(soc) ?? [];
			arr.push(beta);
			rawMap.set(soc, arr);
		}
	}

	// Average multiple detailed codes per SOC
	const result = new Map<string, number>();
	for (const [soc, vals] of rawMap) {
		result.set(soc, vals.reduce((s, v) => s + v, 0) / vals.length);
	}

	console.log(`  Loaded ${result.size} SOC codes`);
	return result;
}

// ===== Step 3c: Load ILO 2025 Refined Index (ISCO-08 direct) =====
function loadIloExposure(): Map<string, number> {
	console.log('Loading ILO 2025 Refined Index...');
	const filePath = path.join(EXT_DIR, 'ilo_genai_scores_isco08_2025.xlsx');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: ilo_genai_scores_isco08_2025.xlsx not found, skipping');
		return new Map();
	}

	const wb = XLSX.readFile(filePath);
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
	const result = new Map<string, number>();

	for (const row of rows) {
		const isco = String(row['ISCO_08'] ?? '');
		const score = row['mean_score_2025'];
		if (isco && typeof score === 'number' && !result.has(isco)) {
			result.set(isco, score);
		}
	}

	console.log(`  Loaded ${result.size} ISCO-08 codes`);
	return result;
}

// ===== Step 3d: Load Anthropic Economic Index (observed AI usage) =====
function loadAnthropicExposure(): Map<string, number> {
	console.log('Loading Anthropic Economic Index...');
	const filePath = path.join(EXT_DIR, 'anthropic_job_exposure.csv');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: anthropic_job_exposure.csv not found, skipping');
		return new Map();
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	const exposureMap = new Map<string, number>();

	// Parse CSV: occ_code,title,observed_exposure
	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split(',');
		if (parts.length < 3) continue;
		const socCode = parts[0].trim();
		// Handle quoted title field
		const rawExposure = parts[parts.length - 1].trim();
		const exposure = parseFloat(rawExposure);
		if (socCode && !isNaN(exposure)) {
			exposureMap.set(socCode, exposure);
		}
	}

	const nonZero = [...exposureMap.values()].filter(v => v > 0);
	console.log(`  Loaded ${exposureMap.size} SOC codes, ${nonZero.length} with non-zero exposure`);
	console.log(`  Max observed exposure: ${Math.max(...exposureMap.values()).toFixed(4)}`);
	return exposureMap;
}

// ===== Step 3c: Load MOM Shortage Occupation List (SOL) 2026 =====
interface SolEntry {
	sn: number;
	shortage_occupation: string;
	sector: string;
	ssoc_matches: string[];
	match_notes: string;
}

function loadMomSol(): { exactCodes: Set<string>; prefixes: Set<string> } {
	console.log('Loading MOM Shortage Occupation List 2026...');
	const filePath = path.join(EXT_DIR, 'mom_sol_2026.json');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: mom_sol_2026.json not found, skipping');
		return { exactCodes: new Set(), prefixes: new Set() };
	}

	const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	const exactCodes = new Set<string>();
	const prefixes = new Set<string>();

	for (const entry of data.occupations as SolEntry[]) {
		for (const ssoc of entry.ssoc_matches) {
			exactCodes.add(ssoc);
			// Also add 4-digit prefix for broader matching
			prefixes.add(ssoc.substring(0, 4));
		}
	}

	console.log(
		`  Loaded ${data.occupations.length} SOL occupations mapping to ${exactCodes.size} exact SSOC codes (${prefixes.size} 4-digit prefixes)`
	);
	return { exactCodes, prefixes };
}

function isSolMatch(
	ssoc: string,
	sol: { exactCodes: Set<string>; prefixes: Set<string> }
): 'exact' | 'prefix' | false {
	if (sol.exactCodes.has(ssoc)) return 'exact';
	if (sol.prefixes.has(ssoc.substring(0, 4))) return 'prefix';
	return false;
}

// ===== Step 3e: Load MOM Jobs in Demand 2025 =====
function loadJobsInDemand(): { exactCodes: Set<string>; prefixes: Set<string> } {
	console.log('Loading MOM Jobs in Demand 2025...');
	const filePath = path.join(EXT_DIR, 'mom_jobs_in_demand_2025.json');
	if (!fs.existsSync(filePath)) {
		console.log('  WARNING: mom_jobs_in_demand_2025.json not found, skipping');
		return { exactCodes: new Set(), prefixes: new Set() };
	}

	const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	const exactCodes = new Set<string>();
	const prefixes = new Set<string>();

	for (const entry of data.occupations as { title: string; ssoc_matches: string[] }[]) {
		for (const ssoc of entry.ssoc_matches) {
			exactCodes.add(ssoc);
			prefixes.add(ssoc.substring(0, 4));
		}
	}

	console.log(
		`  Loaded ${data.occupations.length} Jobs in Demand occupations mapping to ${exactCodes.size} exact SSOC codes (${prefixes.size} 4-digit prefixes)`
	);
	return { exactCodes, prefixes };
}

function isDemandMatch(
	ssoc: string,
	demand: { exactCodes: Set<string>; prefixes: Set<string> }
): 'exact' | 'prefix' | false {
	if (demand.exactCodes.has(ssoc)) return 'exact';
	if (demand.prefixes.has(ssoc.substring(0, 4))) return 'prefix';
	return false;
}

// ===== Step 3d: Compute crosswalk dispersion for SOC code groups =====
function computeDispersion(values: number[]): number {
	if (values.length <= 1) return 0;
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
	return Math.sqrt(variance);
}

// ===== Step 4: Compute theta for each SOC code =====
function computeTheta(
	wcMap: Map<string, Map<string, number>>,
	jzMap: Map<string, number>
): Map<string, number> {
	console.log('Computing Pizzinelli theta...');
	const thetaMap = new Map<string, number>();

	// Collect all SOC codes that have both WC and JZ data
	const allSocCodes = new Set([...wcMap.keys(), ...jzMap.keys()]);

	for (const soc of allSocCodes) {
		const wc = wcMap.get(soc);
		const jz = jzMap.get(soc);

		if (!wc && !jz) continue;

		const dimensionMeans: number[] = [];

		// Communication: face-to-face + public speaking
		const comm = getElementMean(wc, ['4.C.1.a.2.l', '4.C.1.a.2.c'], 5);
		if (comm !== null) dimensionMeans.push(comm);

		// Responsibility: outcomes + health/safety
		const resp = getElementMean(wc, ['4.C.1.c.2', '4.C.1.c.1'], 5);
		if (resp !== null) dimensionMeans.push(resp);

		// Physical: outdoors + proximity
		const phys = getElementMean(wc, ['4.C.2.a.1.c', '4.C.2.a.3'], 5);
		if (phys !== null) dimensionMeans.push(phys);

		// Criticality: consequence of error + freedom + frequency
		const crit = getElementMean(wc, ['4.C.3.a.1', '4.C.3.a.4', '4.C.3.a.2.b'], 5);
		if (crit !== null) dimensionMeans.push(crit);

		// Routine (inverted): automation is inverted (high = routine = low complementarity)
		// Structured work is NOT inverted (high = unstructured = high complementarity)
		const automation = wc?.get('4.C.3.b.2');
		const structured = wc?.get('4.C.3.b.8');
		if (automation !== undefined && structured !== undefined) {
			// Invert automation: (scale_max + 1 - value) / scale_max
			const automationInv = (5 + 1 - automation) / 5;
			const structuredNorm = structured / 5;
			dimensionMeans.push((automationInv + structuredNorm) / 2);
		} else if (automation !== undefined) {
			dimensionMeans.push((5 + 1 - automation) / 5);
		} else if (structured !== undefined) {
			dimensionMeans.push(structured / 5);
		}

		// Skills: Job Zone (1-5) -> scale to 0-1
		if (jz !== undefined) {
			dimensionMeans.push(jz / 5);
		}

		if (dimensionMeans.length >= 3) {
			// theta = mean of dimension means (already normalized to ~0-1)
			const theta = dimensionMeans.reduce((a, b) => a + b, 0) / dimensionMeans.length;
			thetaMap.set(soc, theta);
		}
	}

	console.log(`  Computed theta for ${thetaMap.size} SOC codes`);
	return thetaMap;
}

function getElementMean(
	wc: Map<string, number> | undefined,
	elementIds: string[],
	scale: number
): number | null {
	if (!wc) return null;
	const values: number[] = [];
	for (const id of elementIds) {
		const v = wc.get(id);
		if (v !== undefined) values.push(v / scale);
	}
	if (values.length === 0) return null;
	return values.reduce((a, b) => a + b, 0) / values.length;
}

// ===== Step 5: Load Singapore occupations =====
function loadSgOccupations(): SgOccupation[] {
	console.log('Loading Singapore occupations...');
	const filePath = path.join(RAW_DIR, 'sg_occupations_complete_2024.json');
	const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SgOccupation[];
	console.log(`  Loaded ${data.length} occupations`);
	return data;
}

// ===== Percentile Rank =====
// For each value in `values`, compute its rank / N (0 = lowest, 1 = highest)
// Uses average rank for ties.
function percentileRanks(values: number[]): number[] {
	const n = values.length;
	if (n === 0) return [];
	if (n === 1) return [0.5]; // single value gets 0.5

	// Create indexed pairs, sort by value
	const indexed = values.map((v, i) => ({ v, i }));
	indexed.sort((a, b) => a.v - b.v);

	const ranks = new Array<number>(n);

	// Assign average ranks for ties
	let i = 0;
	while (i < n) {
		let j = i;
		while (j < n && indexed[j].v === indexed[i].v) j++;
		// Positions i..j-1 are tied; average rank = mean of (i..j-1) / (n-1)
		const avgRank = (i + j - 1) / 2;
		for (let k = i; k < j; k++) {
			ranks[indexed[k].i] = n > 1 ? avgRank / (n - 1) : 0.5;
		}
		i = j;
	}
	return ranks;
}

// ===== Winsorize =====
function winsorize(values: number[], lowerPctile: number, upperPctile: number): number[] {
	const sorted = [...values].sort((a, b) => a - b);
	const n = sorted.length;
	const lowerIdx = Math.floor(n * lowerPctile);
	const upperIdx = Math.min(Math.floor(n * upperPctile), n - 1);
	const lowerBound = sorted[lowerIdx];
	const upperBound = sorted[upperIdx];
	return values.map(v => Math.max(lowerBound, Math.min(upperBound, v)));
}

// ===== Step 6: Load Market Data =====
interface GroupMarketData {
	employment_2015: number;
	employment_2025: number;
	employment_cagr: number;
	wage_2015: number; // average of male+female median
	wage_2023: number;
	wage_cagr: number;
}

// (VacancyClusterSeries removed — replaced by LabourClusterMonitor from labour-monitor.json)

function parseCSVValue(val: string): number | null {
	if (!val) return null;
	const cleaned = val.trim().replace(/"/g, '').replace(/,/g, '');
	if (cleaned === 'na' || cleaned === '-' || cleaned === '') return null;
	const n = parseFloat(cleaned);
	return isNaN(n) ? null : n;
}

function parseCSVRow(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

function _parseQuarterToken(
	token: string
): { year: string; quarter: string; label: string } | null {
	const cleaned = token.replace(/^"+|"+$/g, '').trim();
	let match = cleaned.match(/^(\d{4})([1-4])Q$/);
	if (!match) match = cleaned.match(/^(\d{4})Q([1-4])$/);
	if (!match) match = cleaned.match(/^(\d{4})[-\s]?([1-4])Q$/);
	if (!match) match = cleaned.match(/^(\d{4})[-\s]?Q([1-4])$/);
	if (!match) return null;

	const [, year, quarter] = match;
	return {
		year,
		quarter,
		label: `${year} Q${quarter}`
	};
}

// (computeLinearSlope removed — trend computation moved to build-labour-monitor.ts)

function loadLabourMonitor(): Map<string, LabourClusterMonitor> {
	console.log('Loading labour monitor from labour-monitor.json...');
	const filePath = path.join(DATA_DIR, 'labour-monitor.json');
	if (!fs.existsSync(filePath)) {
		console.log(
			'  WARNING: labour-monitor.json not found — run scripts/build-labour-monitor.ts first'
		);
		return new Map();
	}

	const raw = fs.readFileSync(filePath, 'utf-8');
	const monitors: LabourClusterMonitor[] = JSON.parse(raw);
	const result = new Map<string, LabourClusterMonitor>();
	for (const m of monitors) {
		result.set(m.cluster_key, m);
	}
	console.log(`  Loaded labour monitor for ${result.size} clusters`);
	return result;
}

function loadEmploymentData(): Map<string, { e2015: number; e2025: number }> {
	console.log('Loading employment by occupation data...');
	const filePath = path.join(RAW_DIR, 'employment_by_occupation.csv');
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());

	// Parse header to find year column indices
	const headerFields = parseCSVRow(lines[0]);
	const yearIdx2025 = headerFields.indexOf('2025');
	const yearIdx2015 = headerFields.indexOf('2015');

	if (yearIdx2025 < 0 || yearIdx2015 < 0) {
		throw new Error('Cannot find 2025 or 2015 columns in employment CSV');
	}

	// We only want the top-level rows (Total Employed Residents section, lines 2-10 roughly)
	// These are the indented rows directly under the "All Occupation Groups" row
	const result = new Map<string, { e2015: number; e2025: number }>();

	// The top-level group rows are lines 3-10 (0-indexed: 2-9)
	// They have 4-space indent and are under "All Occupation Groups"
	for (let i = 2; i <= 10 && i < lines.length; i++) {
		const fields = parseCSVRow(lines[i]);
		const name = fields[0].trim();
		if (!name || name.startsWith('All ') || name.startsWith('Employed Residents')) continue;

		const e2025 = parseCSVValue(fields[yearIdx2025]);
		const e2015 = parseCSVValue(fields[yearIdx2015]);

		if (e2025 !== null && e2015 !== null) {
			result.set(name, { e2015, e2025 });
		}
	}

	console.log(`  Loaded employment data for ${result.size} groups`);
	for (const [name, data] of result) {
		console.log(`    ${name}: 2015=${data.e2015}, 2025=${data.e2025}`);
	}
	return result;
}

function loadIncomeData(): Map<string, { w2015: number; w2023: number }> {
	console.log('Loading median income by occupation data...');
	const filePath = path.join(RAW_DIR, 'median_income_by_occupation.csv');
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());

	const headerFields = parseCSVRow(lines[0]);
	const yearIdx2023 = headerFields.indexOf('2023');
	const yearIdx2015 = headerFields.indexOf('2015');

	if (yearIdx2023 < 0 || yearIdx2015 < 0) {
		throw new Error('Cannot find 2023 or 2015 columns in income CSV');
	}

	// Income CSV has Male and Female rows for each group; average them
	const maleData = new Map<string, { w2015: number; w2023: number }>();
	const femaleData = new Map<string, { w2015: number; w2023: number }>();

	for (let i = 1; i < lines.length; i++) {
		const fields = parseCSVRow(lines[i]);
		const rawName = fields[0].trim();

		const w2023 = parseCSVValue(fields[yearIdx2023]);
		const w2015 = parseCSVValue(fields[yearIdx2015]);

		if (w2023 === null || w2015 === null) continue;

		// Parse group name and gender
		const isMale = rawName.endsWith('- Male');
		const isFemale = rawName.endsWith('- Female');
		const groupName = rawName.replace(/ - (Male|Female)$/, '').trim();

		if (isMale) {
			maleData.set(groupName, { w2015, w2023 });
		} else if (isFemale) {
			femaleData.set(groupName, { w2015, w2023 });
		}
	}

	// Average male + female
	const result = new Map<string, { w2015: number; w2023: number }>();
	for (const [group, male] of maleData) {
		const female = femaleData.get(group);
		if (female) {
			result.set(group, {
				w2015: (male.w2015 + female.w2015) / 2,
				w2023: (male.w2023 + female.w2023) / 2
			});
		} else {
			result.set(group, male);
		}
	}

	console.log(`  Loaded income data for ${result.size} groups`);
	for (const [name, data] of result) {
		console.log(`    ${name}: 2015=${data.w2015}, 2023=${data.w2023}`);
	}
	return result;
}

function findBestMatch<T>(needle: string, haystack: Map<string, T>): T | undefined {
	// 1. Exact match
	const exact = haystack.get(needle);
	if (exact) return exact;

	// 2. Case-insensitive exact
	for (const [name, data] of haystack) {
		if (name.toLowerCase() === needle.toLowerCase()) return data;
	}

	// 3. Longest substring match (prefer more specific matches)
	let bestMatch: T | undefined;
	let bestLen = 0;
	for (const [name, data] of haystack) {
		const nl = needle.toLowerCase();
		const hl = name.toLowerCase();
		if (nl.includes(hl) || hl.includes(nl)) {
			const matchLen = Math.min(nl.length, hl.length);
			if (matchLen > bestLen) {
				bestLen = matchLen;
				bestMatch = data;
			}
		}
	}
	return bestMatch;
}

function computeGroupMarketData(
	emplData: Map<string, { e2015: number; e2025: number }>,
	incomeData: Map<string, { w2015: number; w2023: number }>
): Map<string, GroupMarketData> {
	console.log('Computing group-level market data...');

	const result = new Map<string, GroupMarketData>();

	for (const [majorGroup, csvName] of Object.entries(MAJOR_GROUP_TO_EMPL_CSV)) {
		// Find employment data
		const emplEntry = findBestMatch(csvName, emplData);

		// Find income data
		const incomeCsvName = MAJOR_GROUP_TO_INCOME_CSV[majorGroup];
		const incomeEntry = findBestMatch(incomeCsvName, incomeData);

		if (emplEntry && incomeEntry) {
			// 10-year employment CAGR
			const emplCagr = Math.pow(emplEntry.e2025 / emplEntry.e2015, 1 / 10) - 1;
			// 8-year wage CAGR
			const wageCagr = Math.pow(incomeEntry.w2023 / incomeEntry.w2015, 1 / 8) - 1;

			result.set(majorGroup, {
				employment_2015: emplEntry.e2015,
				employment_2025: emplEntry.e2025,
				employment_cagr: emplCagr,
				wage_2015: incomeEntry.w2015,
				wage_2023: incomeEntry.w2023,
				wage_cagr: wageCagr
			});

			console.log(
				`  ${majorGroup}: empl_cagr=${(emplCagr * 100).toFixed(2)}%, wage_cagr=${(wageCagr * 100).toFixed(2)}%`
			);
		} else {
			console.warn(
				`  WARNING: Missing market data for ${majorGroup} (empl=${!!emplEntry}, income=${!!incomeEntry})`
			);
		}
	}

	return result;
}

// ===== Risk Band Classification =====
function augmentationBand(value: number): RiskBand {
	if (value >= AUGMENTATION_THRESHOLDS.very_high) return 'very_high';
	if (value >= AUGMENTATION_THRESHOLDS.high) return 'high';
	if (value >= AUGMENTATION_THRESHOLDS.moderate) return 'moderate';
	if (value >= AUGMENTATION_THRESHOLDS.low) return 'low';
	return 'very_low';
}

function riskBandBounds(band: RiskBand): { lower: number; upper: number } {
	return RISK_BAND_THRESHOLDS[band];
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

// Impact type — delegates to scoring-constants.ts single source of truth

// Map impact_type to legacy category for backward compatibility
function impactTypeToCategory(impact: 'at_risk' | 'ai_leveraged' | 'stable' | 'mixed'): string {
	switch (impact) {
		case 'ai_leveraged':
			return 'high_exposure_high_complementarity';
		case 'at_risk':
			return 'high_exposure_low_complementarity';
		case 'stable':
			return 'low_exposure';
		case 'mixed':
			return 'high_exposure_high_complementarity';
	}
}

function lookupLabourMonitor(
	majorGroup: string,
	labourMonitors: Map<string, LabourClusterMonitor>
): LabourClusterMonitor | null {
	const clusterKey = MAJOR_GROUP_TO_LABOUR_CLUSTER[majorGroup];
	if (!clusterKey) return null;
	return labourMonitors.get(clusterKey) ?? null;
}

/**
 * Monte Carlo stability scoring — 1000 deterministic perturbations.
 * Each run perturbs exposure, bottleneck, and market_resilience by
 * a normally-distributed random amount (σ = 0.04), then recomputes net_risk.
 * Optimistic = 10th percentile, pessimistic = 90th percentile of simulated risks.
 *
 * The RNG is seeded from the input tuple so identical source data produces
 * identical stability bounds across rebuilds.
 */
function buildStabilityScores(
	exposure: number,
	bottleneck: number,
	marketResilience: number,
	currentRisk: number,
	marketSpread: number = 0
): StabilityScores {
	const N = 1000;
	// Base sigma 0.04 + market spread contribution (high industry variance = wider intervals)
	const sigma = 0.04 + Math.min(marketSpread * 0.5, 0.03);
	const simulatedRisks: number[] = [];

	function seedFromInputs(values: number[]): number {
		let seed = 2166136261;
		for (const value of values) {
			const scaled = Math.round(value * 10000);
			seed ^= scaled;
			seed = Math.imul(seed, 16777619);
		}
		return seed >>> 0;
	}

	function mulberry32(seed: number): () => number {
		let state = seed >>> 0;
		return () => {
			state += 0x6d2b79f5;
			let t = state;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const random = mulberry32(
		seedFromInputs([exposure, bottleneck, marketResilience, currentRisk, marketSpread])
	);

	// Box-Muller transform for normal random numbers
	function randn(): number {
		const u1 = Math.max(random(), 1e-12);
		const u2 = random();
		return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	for (let i = 0; i < N; i++) {
		const e = clamp01(exposure + sigma * randn());
		const b = clamp01(bottleneck + sigma * randn());
		const m = clamp01(marketResilience + sigma * randn());
		simulatedRisks.push(e * (1 - b) * (1 - MARKET_CONSTANTS.max_modifier_effect * m));
	}

	simulatedRisks.sort((a, b) => a - b);
	const optimisticRisk = simulatedRisks[Math.floor(N * 0.1)]!;
	const pessimisticRisk = simulatedRisks[Math.floor(N * 0.9)]!;

	const currentBand = getRiskBand(currentRisk);
	const optimisticBand = getRiskBand(optimisticRisk);
	const pessimisticBand = getRiskBand(pessimisticRisk);
	const bounds = riskBandBounds(currentBand);
	const distanceToBandEdge = Math.min(currentRisk - bounds.lower, bounds.upper - currentRisk);

	let label: StabilityScores['label'] = 'stable';
	if (optimisticBand !== currentBand || pessimisticBand !== currentBand) {
		label =
			optimisticBand !== pessimisticBand &&
			optimisticBand !== currentBand &&
			pessimisticBand !== currentBand
				? 'sensitive'
				: 'watch';
	}

	return {
		optimistic_risk: round(optimisticRisk, 4),
		optimistic_band: optimisticBand,
		pessimistic_risk: round(pessimisticRisk, 4),
		pessimistic_band: pessimisticBand,
		distance_to_band_edge: round(Math.max(distanceToBandEdge, 0), 4),
		label
	};
}

// ===== Step 7: Score all occupations (V4.0) =====
function scoreOccupations(
	sgOccs: SgOccupation[],
	aioeMap: Map<string, number>,
	thetaMap: Map<string, number>,
	groupMarket: Map<string, GroupMarketData>,
	anthropicExposure: Map<string, number>,
	eloundouExposure: Map<string, number>,
	iloExposure: Map<string, number>,
	solData: { exactCodes: Set<string>; prefixes: Set<string> },
	demandData: { exactCodes: Set<string>; prefixes: Set<string> },
	labourMonitors: Map<string, LabourClusterMonitor>
): ScoredOccupation[] {
	console.log('\nScoring occupations (V4.0 — 4-source exposure ensemble)...');

	// Pre-compute theta_MIN for C-AIOE formula
	const allTheta = [...thetaMap.values()];
	const thetaMin = Math.min(...allTheta);
	console.log(
		`  Theta range: min=${thetaMin.toFixed(4)}, max=${Math.max(...allTheta).toFixed(
			4
		)}, median=${medianFn(allTheta).toFixed(4)}`
	);

	// Pre-compute AIOE stats
	const allAioe = [...aioeMap.values()];
	console.log(
		`  AIOE range: min=${Math.min(...allAioe).toFixed(4)}, max=${Math.max(...allAioe).toFixed(
			4
		)}, median=${medianFn(allAioe).toFixed(4)}`
	);

	// Pre-compute sub-major group averages for fallback
	const subMajorAioe = new Map<string, number[]>();
	const subMajorTheta = new Map<string, number[]>();

	for (const [isco, socCodes] of Object.entries(ISCO_TO_SOC)) {
		const prefix = iscoSubMajorGroup(isco);
		const { avgAioe, avgTheta } = averageScoresForSocCodes(socCodes, aioeMap, thetaMap);
		if (avgAioe !== null) {
			if (!subMajorAioe.has(prefix)) subMajorAioe.set(prefix, []);
			subMajorAioe.get(prefix)!.push(avgAioe);
		}
		if (avgTheta !== null) {
			if (!subMajorTheta.has(prefix)) subMajorTheta.set(prefix, []);
			subMajorTheta.get(prefix)!.push(avgTheta);
		}
	}

	// Also pre-compute major group (1-digit) averages for last-resort fallback
	const majorAioe = new Map<string, number[]>();
	const majorTheta = new Map<string, number[]>();
	for (const [prefix, values] of subMajorAioe) {
		const major = prefix[0];
		if (!majorAioe.has(major)) majorAioe.set(major, []);
		majorAioe.get(major)!.push(...values);
	}
	for (const [prefix, values] of subMajorTheta) {
		const major = prefix[0];
		if (!majorTheta.has(major)) majorTheta.set(major, []);
		majorTheta.get(major)!.push(...values);
	}

	let directMatches = 0;
	let subMajorFallbacks = 0;
	let majorFallbacks = 0;

	// First pass: compute raw aioe/theta per occupation (same crosswalk logic as before)
	interface IntermediateResult {
		occ: SgOccupation;
		avgAioe: number;
		avgTheta: number;
		matchQuality: 'direct' | 'submajor_fallback' | 'major_fallback';
		iscoMatched: string[];
		majorGroupCode: number;
		anthropicMatch: boolean;
		anthropicObservedExposure: number | null;
		eloundouExposure: number | null;
		iloExposure: number | null;
		solMatch: 'exact' | 'prefix' | false;
		demandMatch: 'exact' | 'prefix' | false;
		aioeDispersion: number;
		thetaDispersion: number;
	}

	const intermediates: IntermediateResult[] = [];

	for (const occ of sgOccs) {
		const isco = ssocToIsco(occ.ssoc);
		const socCodes = iscoToSoc(isco);

		let avgAioe: number | null = null;
		let avgTheta: number | null = null;
		let matchQuality: 'direct' | 'submajor_fallback' | 'major_fallback' = 'direct';
		let iscoMatched: string[] = [isco];

		if (socCodes.length > 0) {
			const scores = averageScoresForSocCodes(socCodes, aioeMap, thetaMap);
			avgAioe = scores.avgAioe;
			avgTheta = scores.avgTheta;
		}

		// Fallback 1: sub-major group average
		if (avgAioe === null || avgTheta === null) {
			const prefix = iscoSubMajorGroup(isco);
			if (avgAioe === null && subMajorAioe.has(prefix)) {
				const vals = subMajorAioe.get(prefix)!;
				avgAioe = vals.reduce((a, b) => a + b, 0) / vals.length;
				matchQuality = 'submajor_fallback';
			}
			if (avgTheta === null && subMajorTheta.has(prefix)) {
				const vals = subMajorTheta.get(prefix)!;
				avgTheta = vals.reduce((a, b) => a + b, 0) / vals.length;
				matchQuality = 'submajor_fallback';
			}
		}

		// Fallback 2: major group average
		if (avgAioe === null || avgTheta === null) {
			const major = isco[0];
			if (avgAioe === null && majorAioe.has(major)) {
				const vals = majorAioe.get(major)!;
				avgAioe = vals.reduce((a, b) => a + b, 0) / vals.length;
				matchQuality = 'major_fallback';
			}
			if (avgTheta === null && majorTheta.has(major)) {
				const vals = majorTheta.get(major)!;
				avgTheta = vals.reduce((a, b) => a + b, 0) / vals.length;
				matchQuality = 'major_fallback';
			}
		}

		// Final fallback: use global median
		if (avgAioe === null) avgAioe = medianFn(allAioe);
		if (avgTheta === null) avgTheta = medianFn(allTheta);

		if (matchQuality === 'direct' && socCodes.length > 0) {
			directMatches++;
		} else if (matchQuality === 'submajor_fallback') {
			subMajorFallbacks++;
		} else {
			majorFallbacks++;
		}

		const majorGroupCode = MAJOR_GROUP_CODES[occ.major_group] || parseInt(occ.ssoc[0]) || 0;

		// === Anthropic observed exposure for matched SOC codes ===
		let anthropicMatch = false;
		let anthropicObservedExposure: number | null = null;
		if (socCodes.length > 0 && anthropicExposure.size > 0) {
			const anthropicValues: number[] = [];
			for (const soc of socCodes) {
				const val = anthropicExposure.get(soc);
				if (val !== undefined) {
					anthropicValues.push(val);
				}
			}
			if (anthropicValues.length > 0) {
				anthropicMatch = true;
				anthropicObservedExposure =
					anthropicValues.reduce((a, b) => a + b, 0) / anthropicValues.length;
			}
		}

		// === Eloundou GPTs-are-GPTs exposure for matched SOC codes ===
		let eloundouExp: number | null = null;
		if (socCodes.length > 0 && eloundouExposure.size > 0) {
			const vals: number[] = [];
			for (const soc of socCodes) {
				const val = eloundouExposure.get(soc);
				if (val !== undefined) vals.push(val);
			}
			if (vals.length > 0) eloundouExp = vals.reduce((a, b) => a + b, 0) / vals.length;
		}

		// === ILO 2025 exposure (direct ISCO-08 match) ===
		let iloExp: number | null = null;
		if (isco && iloExposure.size > 0) {
			const val = iloExposure.get(isco);
			if (val !== undefined) iloExp = val;
		}

		// === MOM SOL match ===
		const solMatch = isSolMatch(occ.ssoc, solData);

		// === MOM Jobs in Demand 2025 match ===
		const demandMatch = isDemandMatch(occ.ssoc, demandData);

		// === Crosswalk dispersion (std dev of AIOE/theta across matched SOC codes) ===
		let aioeDispersion = 0;
		let thetaDispersion = 0;
		if (socCodes.length > 1) {
			const aioeVals: number[] = [];
			const thetaVals: number[] = [];
			for (const soc of socCodes) {
				const a = aioeMap.get(soc);
				if (a !== undefined) aioeVals.push(a);
				const t = thetaMap.get(soc);
				if (t !== undefined) thetaVals.push(t);
			}
			aioeDispersion = computeDispersion(aioeVals);
			thetaDispersion = computeDispersion(thetaVals);
		}

		intermediates.push({
			occ,
			avgAioe,
			avgTheta,
			matchQuality,
			iscoMatched,
			majorGroupCode,
			anthropicMatch,
			anthropicObservedExposure,
			eloundouExposure: eloundouExp,
			iloExposure: iloExp,
			solMatch,
			demandMatch,
			aioeDispersion,
			thetaDispersion
		});
	}

	const coverage = (directMatches / sgOccs.length) * 100;
	console.log(
		`  Direct crosswalk matches: ${directMatches}/${sgOccs.length} (${coverage.toFixed(1)}%)`
	);
	console.log(`  Sub-major group fallbacks: ${subMajorFallbacks}`);
	console.log(`  Major group fallbacks: ${majorFallbacks}`);

	// ===== Second pass: compute percentile ranks across all matched occupations =====
	console.log('\n  Computing percentile ranks...');
	const rawAioeValues = intermediates.map(r => r.avgAioe);
	const rawThetaValues = intermediates.map(r => r.avgTheta);
	const aioeRanks = percentileRanks(rawAioeValues);
	const thetaRanks = percentileRanks(rawThetaValues);

	// ===== Market Momentum: group-level =====
	console.log('  Computing market momentum...');
	const allGroups = [...new Set(intermediates.map(r => r.occ.major_group))];
	const groupCagrEmpl: number[] = [];
	const groupCagrWage: number[] = [];
	const groupToIdx = new Map<string, number>();

	for (const g of allGroups) {
		const mkt = groupMarket.get(g);
		groupToIdx.set(g, groupCagrEmpl.length);
		groupCagrEmpl.push(mkt ? mkt.employment_cagr : 0);
		groupCagrWage.push(mkt ? mkt.wage_cagr : 0);
	}

	const emplCagrRanks = percentileRanks(groupCagrEmpl);
	const wageCagrRanks = percentileRanks(groupCagrWage);

	// Market momentum per group
	const groupMomentum = new Map<string, number>();
	for (const g of allGroups) {
		const idx = groupToIdx.get(g)!;
		const mm = (emplCagrRanks[idx] + wageCagrRanks[idx]) / 2;
		groupMomentum.set(g, mm);
	}

	// ===== Industry momentum spread (V4.0) =====
	// Load industry × occupation data to measure intra-group momentum variance.
	// High variance = group-level momentum is a poor proxy for individual occupations.
	const industryMomentumSpread = new Map<string, number>();
	try {
		const indMom = JSON.parse(
			fs.readFileSync(path.join(DATA_DIR, 'industry-momentum.json'), 'utf-8')
		);
		for (const [groupKey, industries] of Object.entries(indMom)) {
			const cagrs: number[] = [];
			for (const [indKey, vals] of Object.entries(industries as Record<string, any>)) {
				if (indKey === 'total' || vals.cagr_5y == null) continue;
				cagrs.push(vals.cagr_5y);
			}
			if (cagrs.length >= 3) {
				const mean = cagrs.reduce((s, v) => s + v, 0) / cagrs.length;
				const variance = cagrs.reduce((s, v) => s + (v - mean) ** 2, 0) / cagrs.length;
				industryMomentumSpread.set(groupKey, Math.sqrt(variance));
			}
		}
		console.log(`  Industry momentum spread loaded for ${industryMomentumSpread.size} groups`);
	} catch {
		console.log('  Industry momentum data not available, skipping spread computation');
	}

	// ===== Occupation Scarcity =====
	console.log('  Computing occupation scarcity...');

	// Compute log(q75/q25) for each occupation
	const logWageSpreads: number[] = [];
	const logWageSpreadMap: (number | null)[] = [];
	for (const r of intermediates) {
		const q25 = r.occ.gross_wage_25th;
		const q75 = r.occ.gross_wage_75th;
		if (q25 !== null && q75 !== null && q25 > 0 && q75 > 0) {
			logWageSpreads.push(Math.log(q75 / q25));
			logWageSpreadMap.push(Math.log(q75 / q25));
		} else {
			logWageSpreadMap.push(null);
		}
	}

	// Winsorize log wage spreads at 1st/99th percentile
	const winsorizedSpreads = winsorize(logWageSpreads, 0.01, 0.99);
	// Map winsorized values back
	let wIdx = 0;
	const finalLogSpreads: (number | null)[] = logWageSpreadMap.map(v => {
		if (v !== null) return winsorizedSpreads[wIdx++];
		return null;
	});

	// Compute within-group median ratio: occupation gross_wage_median / group median
	// Group median = median of gross_wage_median values within the group
	const groupWageMedians = new Map<string, number[]>();
	for (const r of intermediates) {
		if (r.occ.gross_wage_median !== null) {
			if (!groupWageMedians.has(r.occ.major_group)) {
				groupWageMedians.set(r.occ.major_group, []);
			}
			groupWageMedians.get(r.occ.major_group)!.push(r.occ.gross_wage_median);
		}
	}
	// Use official group_median_income from MOM source data (not recomputed)
	// Fall back to computed median only if source field is missing
	const groupMedianWage = new Map<string, number>();
	for (const r of intermediates) {
		if (r.occ.group_median_income !== null && r.occ.group_median_income > 0) {
			groupMedianWage.set(r.occ.major_group, r.occ.group_median_income);
		}
	}
	// Fill any missing groups with computed median
	for (const [g, wages] of groupWageMedians) {
		if (!groupMedianWage.has(g)) {
			groupMedianWage.set(g, medianFn(wages));
		}
	}

	const withinGroupRatios: (number | null)[] = intermediates.map(r => {
		if (r.occ.gross_wage_median !== null) {
			const gm = groupMedianWage.get(r.occ.major_group);
			if (gm && gm > 0) return r.occ.gross_wage_median / gm;
		}
		return null;
	});

	// Percentile-rank both components, using only non-null values
	// For null values, assign the median rank (0.5)
	const validLogSpreads = finalLogSpreads.filter(v => v !== null) as number[];
	const validRatios = withinGroupRatios.filter(v => v !== null) as number[];
	const logSpreadRanksValid = percentileRanks(validLogSpreads);
	const ratioRanksValid = percentileRanks(validRatios);

	// Map back to full arrays
	let lsIdx = 0;
	let rrIdx = 0;
	const logSpreadRanks = finalLogSpreads.map(v =>
		v !== null ? logSpreadRanksValid[lsIdx++] : 0.5
	);
	const ratioRanks = withinGroupRatios.map(v => (v !== null ? ratioRanksValid[rrIdx++] : 0.5));

	// Occupation scarcity = mean of two percentile ranks
	const occScarcity = intermediates.map((_, i) => (logSpreadRanks[i] + ratioRanks[i]) / 2);

	// ===== V4.0: Multi-input ensemble — percentile ranks for each source =====
	console.log('  Computing ensemble exposure percentile ranks...');

	function computePctileRanks(values: (number | null)[]): number[] {
		const valid = values.filter(v => v !== null) as number[];
		if (valid.length === 0) return values.map(() => -1);
		const ranks = percentileRanks(valid);
		let idx = 0;
		return values.map(v => (v !== null ? ranks[idx++] : -1));
	}

	const anthropicPctiles = computePctileRanks(intermediates.map(r => r.anthropicObservedExposure));
	const eloundouPctiles = computePctileRanks(intermediates.map(r => r.eloundouExposure));
	const iloPctiles = computePctileRanks(intermediates.map(r => r.iloExposure));

	const anthropicCount = anthropicPctiles.filter(v => v >= 0).length;
	const eloundouCount = eloundouPctiles.filter(v => v >= 0).length;
	const iloCount = iloPctiles.filter(v => v >= 0).length;
	console.log(`  Anthropic: ${anthropicCount}, Eloundou: ${eloundouCount}, ILO: ${iloCount}`);

	let ensembleInputCounts = { one: 0, two: 0, three: 0, four: 0 };
	let solMatchCount = 0;
	let demandMatchCount = 0;

	// ===== Assemble final results =====
	console.log('  Assembling final results...');
	const results: ScoredOccupation[] = [];

	for (let i = 0; i < intermediates.length; i++) {
		const r = intermediates[i];
		let exposure = aioeRanks[i];
		const bottleneck = thetaRanks[i];
		const theoreticalExposure = exposure;

		// === 4a: Multi-input ensemble exposure ===
		// V4.0: reliability-weighted blend of all available exposure inputs.
		// Source weights are deterministic and based on recency, construct fit,
		// coverage quality, and validation support.
		const availableExposureInputs: Array<{
			key: 'aioe' | 'anthropic' | 'eloundou' | 'ilo';
			value: number;
		}> = [{ key: 'aioe', value: exposure }];
		if (anthropicPctiles[i] >= 0) {
			availableExposureInputs.push({ key: 'anthropic', value: anthropicPctiles[i] });
		}
		if (eloundouPctiles[i] >= 0) {
			availableExposureInputs.push({ key: 'eloundou', value: eloundouPctiles[i] });
		}
		if (iloPctiles[i] >= 0) {
			availableExposureInputs.push({ key: 'ilo', value: iloPctiles[i] });
		}
		const exposureSourceWeights = normalizeExposureSourceWeights(
			availableExposureInputs.map(input => input.key)
		);

		exposure = Math.max(
			0,
			Math.min(
				1,
				availableExposureInputs.reduce(
					(sum, input) => sum + input.value * (exposureSourceWeights[input.key] ?? 0),
					0
				)
			)
		);

		if (availableExposureInputs.length === 1) ensembleInputCounts.one++;
		else if (availableExposureInputs.length === 2) ensembleInputCounts.two++;
		else if (availableExposureInputs.length === 3) ensembleInputCounts.three++;
		else ensembleInputCounts.four++;

		const mm = groupMomentum.get(r.occ.major_group) ?? 0.5;
		const os = occScarcity[i];
		let marketResilience =
			MARKET_CONSTANTS.momentum_weight * mm + MARKET_CONSTANTS.scarcity_weight * os;

		// === 4b: MOM demand signals ===
		let marketResilienceAdjusted = marketResilience;
		if (r.solMatch === 'exact') {
			marketResilienceAdjusted = Math.min(
				1.0,
				marketResilienceAdjusted + MARKET_CONSTANTS.sol_exact_bonus
			);
			solMatchCount++;
		} else if (r.solMatch === 'prefix') {
			marketResilienceAdjusted = Math.min(
				1.0,
				marketResilienceAdjusted + MARKET_CONSTANTS.sol_prefix_bonus
			);
			solMatchCount++;
		}
		if (r.demandMatch === 'exact') {
			marketResilienceAdjusted = Math.min(
				1.0,
				marketResilienceAdjusted + MARKET_CONSTANTS.jid_exact_bonus
			);
			demandMatchCount++;
		} else if (r.demandMatch === 'prefix') {
			marketResilienceAdjusted = Math.min(
				1.0,
				marketResilienceAdjusted + MARKET_CONSTANTS.jid_prefix_bonus
			);
			demandMatchCount++;
		}
		const marketModifier = 1 - MARKET_CONSTANTS.max_modifier_effect * marketResilienceAdjusted;

		const netRisk = exposure * (1 - bottleneck) * marketModifier;
		const netRiskRounded = round(netRisk, 4);
		const band = getRiskBand(netRiskRounded);
		const augmentation = exposure * bottleneck * marketResilienceAdjusted;
		// Map major_group to industry momentum key format
		const indKey = r.occ.major_group.replace(/ /g, '_').replace(/,/g, '');
		const mktSpread = industryMomentumSpread.get(indKey) ?? 0;
		const stability = buildStabilityScores(
			exposure,
			bottleneck,
			marketResilienceAdjusted,
			netRiskRounded,
			mktSpread
		);
		const labourMonitor = lookupLabourMonitor(r.occ.major_group, labourMonitors);
		const exposureAgreement = classifyExposureAgreement(
			availableExposureInputs.map(input => input.value)
		);
		const anthropicGap =
			anthropicPctiles[i] >= 0 ? round(anthropicPctiles[i] - theoreticalExposure, 4) : null;
		const signalConflictReasons: string[] = [];
		const hasExactDemand = r.solMatch === 'exact' || r.demandMatch === 'exact';
		const hasPrefixDemand = r.solMatch === 'prefix' || r.demandMatch === 'prefix';
		if (netRiskRounded >= SIGNAL_CONFLICT_THRESHOLDS.high_risk_floor && hasExactDemand) {
			signalConflictReasons.push('high_risk_but_exact_demand');
		}
		if (
			netRiskRounded >= SIGNAL_CONFLICT_THRESHOLDS.high_risk_floor &&
			labourMonitor &&
			(labourMonitor.overall === 'strong' ||
				labourMonitor.vacancy.signal === 1 ||
				labourMonitor.hiring?.signal === 1)
		) {
			signalConflictReasons.push('high_risk_but_positive_labour_market');
		}
		if (exposureAgreement === 'divergent') {
			signalConflictReasons.push('divergent_exposure_sources');
		}
		if (
			netRiskRounded <= SIGNAL_CONFLICT_THRESHOLDS.low_risk_ceiling &&
			anthropicGap !== null &&
			anthropicGap >= SIGNAL_CONFLICT_THRESHOLDS.large_positive_anthropic_gap
		) {
			signalConflictReasons.push('low_risk_but_high_observed_usage');
		}
		const signalConflict =
			signalConflictReasons.includes('high_risk_but_exact_demand') ||
			signalConflictReasons.includes('low_risk_but_high_observed_usage') ||
			(signalConflictReasons.includes('divergent_exposure_sources') &&
				signalConflictReasons.length >= 2) ||
			signalConflictReasons.filter(reason => reason !== 'divergent_exposure_sources').length >= 2;
		const evidence: EvidenceSignals = {
			anthropic_calibrated: r.anthropicMatch,
			anthropic_gap: anthropicGap,
			anthropic_observed_pctile: anthropicPctiles[i] >= 0 ? round(anthropicPctiles[i], 4) : null,
			sol_match: r.solMatch,
			jobs_in_demand_match: r.demandMatch,
			exposure_blend_strategy: 'reliability_weighted',
			exposure_agreement: exposureAgreement,
			exposure_source_count: availableExposureInputs.length,
			exposure_source_keys: availableExposureInputs.map(input => input.key),
			exposure_source_weights: Object.fromEntries(
				Object.entries(exposureSourceWeights).map(([key, value]) => [key, round(value ?? 0, 4)])
			),
			signal_conflict: signalConflict,
			signal_conflict_reasons: signalConflictReasons
		};

		// C-AIOE for backward compat
		const cAioe = r.avgAioe * (1 - (r.avgTheta - thetaMin));

		// === 4c: Crosswalk dispersion penalty for confidence ===
		let crosswalkQuality =
			r.matchQuality === 'direct' ? 1.0 : r.matchQuality === 'submajor_fallback' ? 0.6 : 0.3;

		if (r.aioeDispersion > 0 || r.thetaDispersion > 0) {
			const dispersionPenalty = Math.max(0, 1 - (r.aioeDispersion + r.thetaDispersion) * 2);
			crosswalkQuality = crosswalkQuality * dispersionPenalty;
		}

		// === 4d: Variable confidence factors ===
		// Confidence should reflect uncertainty, not outcome direction.
		// All occupations have occupation-level wage structure + group market trends,
		// while exact official demand evidence adds more occupation-specific market granularity.
		const marketDataGranularity = hasExactDemand ? 0.85 : hasPrefixDemand ? 0.75 : 0.65;
		const sourceFreshness = round(
			availableExposureInputs.reduce(
				(sum, input) =>
					sum +
					(EXPOSURE_SOURCE_METADATA[input.key].recency ?? 0) *
						(exposureSourceWeights[input.key] ?? 0),
				0
			),
			4
		);
		const sourceCoverage =
			SOURCE_COVERAGE_SCORES[availableExposureInputs.length as keyof typeof SOURCE_COVERAGE_SCORES];
		const signalAgreement =
			SIGNAL_AGREEMENT_SCORES[exposureAgreement as keyof typeof SIGNAL_AGREEMENT_SCORES];
		const sensitivity = SENSITIVITY_SCORES[stability.label as keyof typeof SENSITIVITY_SCORES];
		const sparseSourcePenalty =
			availableExposureInputs.length === 1
				? r.matchQuality === 'direct'
					? CONFIDENCE_PENALTIES.single_source_direct
					: r.matchQuality === 'submajor_fallback'
						? CONFIDENCE_PENALTIES.single_source_submajor_fallback
						: CONFIDENCE_PENALTIES.single_source_major_fallback
				: 0;
		const contestedSignalPenalty = signalConflict ? CONFIDENCE_PENALTIES.contested_signal : 0;

		const confidenceScore = clamp01(
			crosswalkQuality * CONFIDENCE_COMPONENT_WEIGHTS.crosswalk_quality +
				marketDataGranularity * CONFIDENCE_COMPONENT_WEIGHTS.market_data_granularity +
				sourceFreshness * CONFIDENCE_COMPONENT_WEIGHTS.source_freshness +
				sourceCoverage * CONFIDENCE_COMPONENT_WEIGHTS.source_coverage +
				signalAgreement * CONFIDENCE_COMPONENT_WEIGHTS.signal_agreement +
				sensitivity * CONFIDENCE_COMPONENT_WEIGHTS.sensitivity -
				sparseSourcePenalty -
				contestedSignalPenalty
		);
		const baseConfidenceLevel: 'high' | 'medium' | 'low' =
			confidenceScore >= CONFIDENCE_THRESHOLDS.high
				? 'high'
				: confidenceScore >= CONFIDENCE_THRESHOLDS.medium
					? 'medium'
					: 'low';

		// Policy cap: reserve "high" confidence for the cleanest cases only.
		// Calibration diagnostics show the broad high+medium population validates directionally,
		// but contested or fallback cases should not read as fully high-confidence to users.
		const canBeHighConfidence =
			r.matchQuality === 'direct' && availableExposureInputs.length >= 3 && !signalConflict;

		let confidenceLevel: 'high' | 'medium' | 'low' = baseConfidenceLevel;
		if (!canBeHighConfidence && confidenceLevel === 'high') {
			confidenceLevel = 'medium';
		}
		if (r.matchQuality === 'major_fallback') {
			confidenceLevel = 'low';
		}

		results.push({
			ssoc: r.occ.ssoc,
			title: r.occ.title,
			major_group: r.occ.major_group,
			major_group_code: r.majorGroupCode,
			gross_wage_median: r.occ.gross_wage_median,
			gross_wage_25th: r.occ.gross_wage_25th,
			gross_wage_75th: r.occ.gross_wage_75th,
			estimated_sg_employment_thousands: r.occ.estimated_employment_thousands,
			employment_thousands: r.occ.estimated_employment_thousands,
			employment_basis: 'estimated_sg_submajor',
			group_employment_thousands: r.occ.group_employment_thousands,
			data_basis: cloneOccupationDataBasis(),
			exposure: round(exposure, 4),
			bottleneck: round(bottleneck, 4),
			market: {
				market_momentum: round(mm, 4),
				occupation_scarcity: round(os, 4),
				market_resilience: round(marketResilienceAdjusted, 4),
				market_modifier: round(marketModifier, 4)
			},
			net_risk: netRiskRounded,
			risk_band: band,
			augmentation: round(augmentation, 4),
			augmentation_band: augmentationBand(augmentation),
			impact_type: classifyImpactType(
				netRiskRounded,
				round(augmentation, 4),
				!!(r.solMatch || r.demandMatch)
			),
			evidence,
			confidence: {
				score: round(confidenceScore, 4),
				level: confidenceLevel,
				crosswalk_quality: round(crosswalkQuality, 4),
				market_data_granularity: marketDataGranularity,
				source_freshness: sourceFreshness,
				source_coverage: sourceCoverage,
				signal_agreement: signalAgreement,
				sensitivity,
				exposure_source_count: availableExposureInputs.length
			},
			stability,
			labour_monitor_key: labourMonitor?.cluster_key ?? null,
			raw: {
				aioe: round(r.avgAioe, 4),
				theta: round(r.avgTheta, 4),
				c_aioe: round(cAioe, 4),
				log_wage_spread: finalLogSpreads[i] !== null ? round(finalLogSpreads[i]!, 4) : null,
				wage_position: withinGroupRatios[i] !== null ? round(withinGroupRatios[i]!, 4) : null
			},
			isco_codes_matched: r.iscoMatched,
			match_quality: r.matchQuality,
			// Backward-compat scores object for frontend
			scores: {
				aioe: round(r.avgAioe, 4),
				theta: round(r.avgTheta, 4),
				c_aioe: round(cAioe, 4),
				category: impactTypeToCategory(
					classifyImpactType(
						netRiskRounded,
						round(augmentation, 4),
						!!(r.solMatch || r.demandMatch)
					)
				),
				isco_codes_matched: r.iscoMatched,
				match_quality: r.matchQuality
			},
			// Workflow overlay computed from archetype defaults at build time
			workflow_overlay: getOverlayForOccupation(r.occ.ssoc, r.occ.title, r.occ.major_group)
		});
	}

	console.log(
		`  Ensemble inputs: 1=${ensembleInputCounts.one} 2=${ensembleInputCounts.two} 3=${ensembleInputCounts.three} 4=${ensembleInputCounts.four}`
	);
	console.log(`  MOM SOL match bonus applied to ${solMatchCount} occupations`);
	console.log(`  MOM Jobs in Demand bonus applied to ${demandMatchCount} occupations`);

	return results;
}

function averageScoresForSocCodes(
	socCodes: string[],
	aioeMap: Map<string, number>,
	thetaMap: Map<string, number>
): { avgAioe: number | null; avgTheta: number | null } {
	const aioeValues: number[] = [];
	const thetaValues: number[] = [];

	for (const soc of socCodes) {
		const aioe = aioeMap.get(soc);
		if (aioe !== undefined) aioeValues.push(aioe);
		const theta = thetaMap.get(soc);
		if (theta !== undefined) thetaValues.push(theta);
	}

	return {
		avgAioe:
			aioeValues.length > 0 ? aioeValues.reduce((a, b) => a + b, 0) / aioeValues.length : null,
		avgTheta:
			thetaValues.length > 0 ? thetaValues.reduce((a, b) => a + b, 0) / thetaValues.length : null
	};
}

// ===== Helpers =====
function medianFn(arr: number[]): number {
	const sorted = [...arr].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(n: number, decimals: number): number {
	const factor = Math.pow(10, decimals);
	return Math.round(n * factor) / factor;
}

// ===== Distribution Analysis =====
function printDistributionAnalysis(results: ScoredOccupation[]) {
	console.log('\n=== V3 Risk Band Distribution ===');
	const bands: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];
	const bandLabels: Record<RiskBand, string> = {
		very_low: 'Very Low  (0.00-0.05)',
		low: 'Low       (0.05-0.15)',
		moderate: 'Moderate  (0.15-0.30)',
		high: 'High      (0.30-0.50)',
		very_high: 'Very High (0.50+)    '
	};

	const bandCounts = new Map<RiskBand, number>();
	for (const b of bands) bandCounts.set(b, 0);
	for (const r of results) {
		bandCounts.set(r.risk_band, (bandCounts.get(r.risk_band) ?? 0) + 1);
	}

	for (const b of bands) {
		const count = bandCounts.get(b) ?? 0;
		const pct = ((count / results.length) * 100).toFixed(1);
		const bar = '#'.repeat(Math.round(count / 5));
		console.log(`  ${bandLabels[b]}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
	}

	// Impact type distribution
	console.log('\n=== Impact Type Distribution ===');
	const impactTypes = { at_risk: 0, ai_leveraged: 0, stable: 0, mixed: 0 };
	for (const r of results) impactTypes[r.impact_type]++;
	console.log(
		`  At Risk:      ${String(impactTypes.at_risk).padStart(4)} (${((impactTypes.at_risk / results.length) * 100).toFixed(1)}%)`
	);
	console.log(
		`  Augmented:    ${String(impactTypes.ai_leveraged).padStart(4)} (${((impactTypes.ai_leveraged / results.length) * 100).toFixed(1)}%)`
	);
	console.log(
		`  Stable:       ${String(impactTypes.stable).padStart(4)} (${((impactTypes.stable / results.length) * 100).toFixed(1)}%)`
	);
	console.log(
		`  Mixed:        ${String(impactTypes.mixed).padStart(4)} (${((impactTypes.mixed / results.length) * 100).toFixed(1)}%)`
	);

	// Anchor check
	console.log('\n=== Anchor Check ===');
	const anchors = [
		{ pattern: /software developer/i, label: 'Software Developer' },
		{ pattern: /data entry/i, label: 'Data Entry Clerk' },
		{ pattern: /surgeon/i, label: 'Surgeon' },
		{ pattern: /cashier/i, label: 'Cashier' },
		{ pattern: /teacher/i, label: 'Teacher (first match)' },
		{ pattern: /accountant/i, label: 'Accountant' },
		{ pattern: /data scientist/i, label: 'Data Scientist (SOL)' },
		{ pattern: /cyber.*architect/i, label: 'Cybersec Architect (SOL)' },
		{ pattern: /registered nurse/i, label: 'Registered Nurse (SOL)' },
		{ pattern: /physiotherapist/i, label: 'Physiotherapist (SOL)' },
		{ pattern: /cloud specialist/i, label: 'Cloud Specialist (SOL)' },
		{ pattern: /waiter/i, label: 'Waiter (JiD)' },
		{ pattern: /private security officer/i, label: 'Security Officer (JiD)' },
		{ pattern: /shop sales/i, label: 'Shop Sales Asst (JiD)' }
	];

	for (const anchor of anchors) {
		const match = results.find(r => anchor.pattern.test(r.title));
		if (match) {
			console.log(
				`  ${anchor.label.padEnd(25)} | ${match.title.substring(0, 40).padEnd(40)} | ` +
					`exp=${match.exposure.toFixed(3)} bot=${match.bottleneck.toFixed(3)} ` +
					`mkt=${match.market.market_modifier.toFixed(3)} net=${match.net_risk.toFixed(3)} ` +
					`aug=${match.augmentation.toFixed(3)} [${match.risk_band}] [${match.impact_type}]`
			);
		} else {
			console.log(`  ${anchor.label.padEnd(25)} | NOT FOUND`);
		}
	}

	// Histogram of net_risk in 0.05 bins
	console.log('\n=== Net Risk Histogram (0.05 bins) ===');
	const binSize = 0.05;
	const bins = new Map<string, number>();
	for (let b = 0; b < 1.0; b += binSize) {
		const label = `${b.toFixed(2)}-${(b + binSize).toFixed(2)}`;
		bins.set(label, 0);
	}

	for (const r of results) {
		const binIdx = Math.min(Math.floor(r.net_risk / binSize), 19);
		const b = binIdx * binSize;
		const label = `${b.toFixed(2)}-${(b + binSize).toFixed(2)}`;
		bins.set(label, (bins.get(label) ?? 0) + 1);
	}

	for (const [label, count] of bins) {
		if (count === 0) continue;
		const bar = '#'.repeat(Math.round(count / 3));
		console.log(`  ${label}: ${String(count).padStart(4)} ${bar}`);
	}
}

// ===== Main =====
async function main() {
	console.log('=== Singapore AI Job Exposure Scoring Pipeline (V4.0) ===\n');

	// Load all data sources
	const aioeMap = loadAioe();
	const wcMap = loadWorkContext();
	const jzMap = loadJobZones();
	const thetaMap = computeTheta(wcMap, jzMap);
	const sgOccs = loadSgOccupations();

	// Load market data
	const emplData = loadEmploymentData();
	const incomeData = loadIncomeData();
	const groupMarket = computeGroupMarketData(emplData, incomeData);
	const labourMonitors = loadLabourMonitor();

	// Load ensemble exposure sources
	const anthropicExposure = loadAnthropicExposure();
	const eloundouExposure = loadEloundouExposure();
	const iloExposure = loadIloExposure();
	const solData = loadMomSol();
	const demandData = loadJobsInDemand();

	// Score all occupations
	const results = scoreOccupations(
		sgOccs,
		aioeMap,
		thetaMap,
		groupMarket,
		anthropicExposure,
		eloundouExposure,
		iloExposure,
		solData,
		demandData,
		labourMonitors
	);

	// Apply sub-major group employment data (2-digit SSOC, from Labour Force 2024 Table D8)
	// This replaces the uniform major-group allocation with real sub-major employment
	const subMajorEmployment: Record<string, number> = {
		'11': 50.3,
		'12': 187.6,
		'13': 122.1,
		'14': 44.8,
		'21': 157.1,
		'22': 58.3,
		'23': 62.3,
		'24': 221.4,
		'25': 76.4,
		'26': 44.6,
		'31': 104.9,
		'32': 17.7,
		'33': 248.9,
		'34': 38.4,
		'35': 26.2,
		'36': 45.8,
		'39': 1.2,
		'40': 3.9,
		'41': 99.9,
		'42': 50.1,
		'43': 50.9,
		'44': 4.8,
		'51': 74.9,
		'52': 106.6,
		'53': 19.6,
		'54': 40.4,
		'59': 0.2,
		'61': 2.7,
		'62': 2.7,
		'71': 18.4,
		'72': 13.5,
		'73': 2.5,
		'74': 10.9,
		'75': 9.5,
		'81': 9.7,
		'82': 6.3,
		'83': 112.4,
		'91': 73.5,
		'92': 1.1,
		'93': 29.9,
		'94': 38.5,
		'96': 22.7
	};

	// Count occupations per sub-major group
	const subMajorCounts: Record<string, number> = {};
	for (const r of results) {
		const prefix2 = r.ssoc.substring(0, 2);
		subMajorCounts[prefix2] = (subMajorCounts[prefix2] || 0) + 1;
	}

	// Allocate employment proportionally within each sub-major group
	let updated = 0;
	for (const r of results) {
		const prefix2 = r.ssoc.substring(0, 2);
		const groupEmp = subMajorEmployment[prefix2];
		const groupCount = subMajorCounts[prefix2];
		if (groupEmp !== undefined && groupCount) {
			const estimatedEmploymentThousands = round(groupEmp / groupCount, 1);
			(r as any).estimated_sg_employment_thousands = estimatedEmploymentThousands;
			(r as any).employment_thousands = estimatedEmploymentThousands;
			updated++;
		}
	}
	console.log(
		`\nUpdated estimated_sg_employment_thousands / employment_thousands for ${updated}/${results.length} occupations using sub-major group data (Labour Force 2024 Table D8)`
	);

	// Distribution analysis
	printDistributionAnalysis(results);

	// Save intermediate theta data
	const thetaData: Record<string, number> = {};
	for (const [soc, theta] of thetaMap) {
		thetaData[soc] = round(theta, 4);
	}
	fs.writeFileSync(path.join(INT_DIR, 'theta_by_soc.json'), JSON.stringify(thetaData, null, 2));

	// Save output
	const output = JSON.stringify(results, null, 2);
	fs.writeFileSync(OUT_FILE, output);
	console.log(`\nWrote ${OUT_FILE} (${results.length} occupations)`);

	// Copy to src/lib/data/
	fs.mkdirSync(path.dirname(SRC_OUT_FILE), { recursive: true });
	fs.writeFileSync(SRC_OUT_FILE, output);
	console.log(`Copied to ${SRC_OUT_FILE}`);

	console.log('\n=== Done ===');
}

main().catch(err => {
	console.error('Pipeline failed:', err);
	process.exit(1);
});
