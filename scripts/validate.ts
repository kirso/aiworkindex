#!/usr/bin/env bun
/**
 * validate.ts — Regression and anchor checks for the current scoring model.
 *
 * Run: bun run scripts/validate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getRiskBand } from '../src/lib/data/scoring-constants';
import type { ImpactType, RiskBand } from '../src/lib/data/index';

const DATA_FILE = path.join(import.meta.dir, '..', 'data', 'occupations.json');
const MONITOR_FILE = path.join(import.meta.dir, '..', 'data', 'labour-monitor.json');

interface Occupation {
	ssoc: string;
	title: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	impact_type: ImpactType;
	market: {
		market_momentum: number;
		occupation_scarcity: number;
		market_resilience: number;
		market_modifier: number;
	};
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
	};
	evidence: {
		anthropic_calibrated: boolean;
		anthropic_gap: number | null;
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
	};
	stability: {
		label: 'stable' | 'watch' | 'sensitive';
	};
	labour_monitor_key: string | null;
	workflow_overlay?: {
		creative_generation: number;
		real_time_coordination: number;
		ambiguity_tolerance: number;
		institutional_knowledge: number;
		relationship_intensity: number;
		regulatory_weight: number;
		physical_presence: number;
		tool_velocity: number;
	};
}

interface LabourClusterMonitor {
	cluster_key: string;
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: number;
		recent_quarters: Array<{ quarter: string; rate: number }>;
	};
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	data_as_of: string;
}

async function main() {
	console.log('=== Validation Report ===\n');

	if (!fs.existsSync(DATA_FILE)) {
		console.error(`ERROR: ${DATA_FILE} not found. Run score.ts first.`);
		process.exit(1);
	}

	if (!fs.existsSync(MONITOR_FILE)) {
		console.error(`ERROR: ${MONITOR_FILE} not found. Run scripts/build-labour-monitor.ts first.`);
		process.exit(1);
	}

	const data: Occupation[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
	const labourMonitors: LabourClusterMonitor[] = JSON.parse(fs.readFileSync(MONITOR_FILE, 'utf-8'));
	const labourMonitorByKey = new Map(labourMonitors.map(monitor => [monitor.cluster_key, monitor]));

	let passed = 0;
	let failed = 0;
	let warnings = 0;

	function check(name: string, condition: boolean, detail?: string) {
		if (condition) {
			console.log(`  PASS: ${name}`);
			passed++;
		} else {
			console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
			failed++;
		}
	}

	function warn(name: string, detail: string) {
		console.log(`  WARN: ${name} — ${detail}`);
		warnings++;
	}

	function find(pattern: RegExp): Occupation | undefined {
		return data.find(row => pattern.test(row.title));
	}

	function getLabourMonitor(row: Occupation): LabourClusterMonitor | null {
		if (!row.labour_monitor_key) return null;
		return labourMonitorByKey.get(row.labour_monitor_key) ?? null;
	}

	console.log('--- Record counts ---');
	check('Total occupations = 562', data.length === 562, `got ${data.length}`);

	console.log('\n--- Completeness ---');
	check(
		'All occupations have current core fields',
		data.every(
			row =>
				typeof row.exposure === 'number' &&
				typeof row.bottleneck === 'number' &&
				typeof row.net_risk === 'number' &&
				typeof row.augmentation === 'number' &&
				!!row.market &&
				!!row.confidence &&
				!!row.evidence &&
				!!row.stability
		)
	);
	check(
		'All occupations have labour monitor coverage',
		data.every(row => getLabourMonitor(row))
	);

	console.log('\n--- Coverage ---');
	const direct = data.filter(row => row.match_quality === 'direct').length;
	const submajor = data.filter(row => row.match_quality === 'submajor_fallback').length;
	const major = data.filter(row => row.match_quality === 'major_fallback').length;
	check(
		'Direct crosswalk coverage > 90%',
		direct / data.length > 0.9,
		`${direct}/${data.length} direct`
	);
	console.log(
		`       Direct: ${direct}, Sub-major fallback: ${submajor}, Major fallback: ${major}`
	);

	const anthropicCount = data.filter(row => row.evidence.anthropic_calibrated).length;
	const demandFlagged = data.filter(
		row => row.evidence.sol_match || row.evidence.jobs_in_demand_match
	).length;
	check(
		'Anthropic calibration covers most occupations',
		anthropicCount > 450,
		`${anthropicCount} calibrated`
	);
	check(
		'Official demand signals cover a meaningful subset',
		demandFlagged >= 50,
		`${demandFlagged} flagged`
	);

	console.log('\n--- Distribution sanity ---');
	const bandCounts: Record<RiskBand, number> = {
		very_low: 0,
		low: 0,
		moderate: 0,
		high: 0,
		very_high: 0
	};
	const impactCounts: Record<ImpactType, number> = {
		at_risk: 0,
		ai_leveraged: 0,
		stable: 0,
		mixed: 0
	};
	const confidenceCounts = { high: 0, medium: 0, low: 0 };
	const stabilityCounts = { stable: 0, watch: 0, sensitive: 0 };

	for (const row of data) {
		bandCounts[row.risk_band]++;
		impactCounts[row.impact_type]++;
		confidenceCounts[row.confidence.level]++;
		stabilityCounts[row.stability.label]++;
	}

	check(
		'Every risk band is populated',
		Object.values(bandCounts).every(count => count > 0)
	);
	check(
		'Stored risk bands match stored net_risk thresholds',
		data.every(row => getRiskBand(row.net_risk) === row.risk_band)
	);

	const { classifyImpactType, DATA_VINTAGE, RISK_BAND_THRESHOLDS } =
		await import('../src/lib/data/scoring-constants');

	check(
		'Stored impact types match recomputed classification',
		data.every(row => {
			const hasDemand = !!(row.evidence.sol_match || row.evidence.jobs_in_demand_match);
			return classifyImpactType(row.net_risk, row.augmentation, hasDemand) === row.impact_type;
		})
	);
	check(
		'At Risk and Augmented occupations both exist',
		impactCounts.at_risk > 0 && impactCounts.ai_leveraged > 0
	);
	check(
		'Confidence has at least two populated tiers',
		[confidenceCounts.high, confidenceCounts.medium, confidenceCounts.low].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(confidenceCounts)
	);
	check(
		'Stability has at least two populated tiers',
		[stabilityCounts.stable, stabilityCounts.watch, stabilityCounts.sensitive].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(stabilityCounts)
	);

	console.log(`       Bands: ${JSON.stringify(bandCounts)}`);
	console.log(`       Impact: ${JSON.stringify(impactCounts)}`);
	console.log(`       Confidence: ${JSON.stringify(confidenceCounts)}`);
	console.log(`       Stability: ${JSON.stringify(stabilityCounts)}`);

	console.log('\n--- Anchor occupations ---');
	const software = find(/software developer/i);
	const dataEntry = find(/data entry clerk/i);
	const surgeon = find(/surgeon/i);
	const telemarketer = find(/telemarketer/i);
	const nurse = find(/registered nurse/i);
	const dataScientist = find(/data scientist/i);

	check('Software developer exists', !!software);
	check(
		'Software developer is a direct crosswalk',
		!!software && software.match_quality === 'direct'
	);
	check(
		'Software developer is not classified At Risk',
		!!software && software.impact_type !== 'at_risk'
	);
	check(
		'Software developer has official demand evidence',
		!!software && !!(software.evidence.sol_match || software.evidence.jobs_in_demand_match)
	);
	check(
		'Software developer is not Very High risk',
		!!software && software.risk_band !== 'very_high'
	);

	check('Data entry clerk exists', !!dataEntry);
	check('Data entry clerk is high displacement', !!dataEntry && dataEntry.net_risk >= 0.25);
	check('Data entry clerk is At Risk', !!dataEntry && dataEntry.impact_type === 'at_risk');

	check('Surgeon exists', !!surgeon);
	check('Surgeon is very low risk', !!surgeon && surgeon.net_risk < 0.1);
	check(
		'Surgeon is low risk (Augmented or Stable)',
		!!surgeon && ['ai_leveraged', 'stable'].includes(surgeon.impact_type)
	);

	check('Telemarketer exists', !!telemarketer);
	check('Telemarketer remains highly exposed', !!telemarketer && telemarketer.exposure > 0.7);
	check('Telemarketer is At Risk', !!telemarketer && telemarketer.impact_type === 'at_risk');

	check('Registered nurse exists', !!nurse);
	check('Registered nurse is low risk', !!nurse && nurse.net_risk < 0.15);
	check('Registered nurse is Augmented', !!nurse && nurse.impact_type === 'ai_leveraged');

	check('Data scientist exists', !!dataScientist);
	check(
		'Data scientist has official demand evidence',
		!!dataScientist &&
			!!(dataScientist.evidence.sol_match || dataScientist.evidence.jobs_in_demand_match)
	);
	check(
		'Data scientist is not classified Stable',
		!!dataScientist && dataScientist.impact_type !== 'stable'
	);

	console.log('\n--- Labour monitor sanity ---');
	const staleMonitor = data.find(row => {
		const monitor = getLabourMonitor(row);
		return (monitor?.vacancy.recent_quarters.length ?? 0) < 4;
	});
	check(
		'Labour monitor has recent quarters for all occupations',
		!staleMonitor,
		staleMonitor?.title
	);
	const labourSignals = {
		strong: data.filter(row => getLabourMonitor(row)?.overall === 'strong').length,
		moderate: data.filter(row => getLabourMonitor(row)?.overall === 'moderate').length,
		weak: data.filter(row => getLabourMonitor(row)?.overall === 'weak').length,
		deteriorating: data.filter(row => getLabourMonitor(row)?.overall === 'deteriorating').length
	};
	check(
		'Labour monitor overall signals present',
		Object.values(labourSignals).some(count => count > 0),
		JSON.stringify(labourSignals)
	);

	console.log('\n--- Synthetic role validation ---');
	try {
		const { computeRoleScores, syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		const { occupationsBySSoc } = await import('../src/lib/data');
		check('Synthetic roles defined', syntheticRoles.length > 0);
		const roleScores = syntheticRoles.map(role => computeRoleScores(role, occupationsBySSoc));
		check(
			'All synthetic roles compute without errors',
			roleScores.length === syntheticRoles.length
		);
	} catch (error) {
		check('All synthetic roles compute without errors', false, String(error));
	}

	console.log('\n--- Role taxonomy validation ---');
	try {
		const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		const taxonomy = await import('../src/lib/data/role-taxonomy');
		check(
			'Taxonomy covers all synthetic roles',
			syntheticRoles.every(role => taxonomy.getRoleCategory(role.slug) !== null)
		);
	} catch (error) {
		warn('Taxonomy validation', `Could not import: ${error}`);
	}

	console.log('\n--- Alias SSOC validation ---');
	try {
		const { jobAliases } = await import('../src/lib/data/aliases');
		const aliasEntries = Object.values(jobAliases).flat();
		const validSSOCs = new Set(data.map(row => row.ssoc));
		const invalidAliases = aliasEntries.filter(ssoc => !validSSOCs.has(ssoc));
		check(
			'All alias SSOC codes exist in occupations data',
			invalidAliases.length === 0,
			invalidAliases.length > 0 ? invalidAliases.join(', ') : undefined
		);
	} catch (error) {
		warn('Alias SSOC validation', `Could not import: ${error}`);
	}

	console.log('\n--- Archetype classification validation ---');
	try {
		const { classifyArchetype } = await import('../src/lib/data/role-archetypes');
		const professional = data.filter(
			row =>
				row.major_group === 'PROFESSIONALS' || row.major_group === 'MANAGERS AND ADMINISTRATORS'
		);
		const fieldManualMisclassified = professional.filter(row => {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			return archetype === 'field_manual';
		});
		check(
			'No professional/manager occupation gets field_manual archetype',
			fieldManualMisclassified.length === 0,
			fieldManualMisclassified.length > 0
				? fieldManualMisclassified
						.slice(0, 3)
						.map(row => row.title)
						.join('; ')
				: undefined
		);

		const archetypeCounts = new Map<string, number>();
		for (const row of data) {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			archetypeCounts.set(archetype, (archetypeCounts.get(archetype) ?? 0) + 1);
		}
		check(
			'Every archetype has at least 3 occupations',
			Array.from(archetypeCounts.values()).every(count => count >= 3),
			JSON.stringify(Object.fromEntries(archetypeCounts))
		);
	} catch (error) {
		warn('Archetype validation', `Could not import: ${error}`);
	}

	console.log('\n--- Context modifier validation ---');
	try {
		const contextModule = await import('../src/lib/data/role-context-modifiers');
		const valid = contextModule.validateContextModifiers?.();
		if (valid === undefined) {
			warn('Context modifiers', 'validateContextModifiers() not exported');
		} else {
			check('All context modifiers valid', valid);
		}
	} catch {
		console.log('  INFO: Context modifiers module not shipped; skipping optional validation');
	}

	console.log('\n--- Workflow overlay validation ---');
	try {
		const { archetypeOverlayDefaults } = await import('../src/lib/data/workflow-overlay');
		const { classifyArchetype } = await import('../src/lib/data/role-archetypes');
		const missingOverlay = data.find(row => {
			const archetype = classifyArchetype(row.ssoc, row.title, row.major_group);
			return archetypeOverlayDefaults[archetype] == null;
		});
		check('Workflow overlay defaults cover all archetypes', !missingOverlay, missingOverlay?.title);
		const validOverlay = data.every(row => {
			const overlay = row.workflow_overlay;
			return (
				!overlay ||
				(typeof overlay.creative_generation === 'number' &&
					typeof overlay.real_time_coordination === 'number' &&
					typeof overlay.ambiguity_tolerance === 'number' &&
					typeof overlay.institutional_knowledge === 'number' &&
					typeof overlay.relationship_intensity === 'number' &&
					typeof overlay.regulatory_weight === 'number' &&
					typeof overlay.physical_presence === 'number' &&
					typeof overlay.tool_velocity === 'number')
			);
		});
		check('All workflow overlays valid', validOverlay);
	} catch (error) {
		warn('Workflow overlay validation', `Could not import: ${error}`);
	}

	console.log('\n--- Transition capacity validation ---');
	try {
		const { computeTransitionScore } = await import('../src/lib/data/transition-capacity');
		if (software && dataScientist) {
			const transition = computeTransitionScore(software as never, dataScientist as never);
			check(
				'Transition score computes',
				typeof transition.composite === 'number' &&
					transition.composite >= 0 &&
					transition.composite <= 1
			);
			check(
				'Transition has valid label',
				['easy', 'moderate', 'stretch', 'difficult'].includes(transition.label)
			);
		}
	} catch (error) {
		warn('Transition capacity validation', `Could not import: ${error}`);
	}

	console.log('\n--- Data vintage & consistency ---');
	try {
		const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');
		check(
			'DATA_VINTAGE.occupation_count matches actual data',
			DATA_VINTAGE.occupation_count === data.length,
			`constant=${DATA_VINTAGE.occupation_count}, actual=${data.length}`
		);
		check(
			'DATA_VINTAGE.role_count matches actual synthetic roles',
			DATA_VINTAGE.role_count === syntheticRoles.length,
			`constant=${DATA_VINTAGE.role_count}, actual=${syntheticRoles.length}`
		);
		check(
			'Risk band moderate upper = 0.30',
			RISK_BAND_THRESHOLDS.moderate.upper === 0.3,
			String(RISK_BAND_THRESHOLDS.moderate.upper)
		);
		check(
			'Risk band high upper = 0.50',
			RISK_BAND_THRESHOLDS.high.upper === 0.5,
			String(RISK_BAND_THRESHOLDS.high.upper)
		);
		const lastUpdated = new Date(DATA_VINTAGE.last_updated);
		const today = new Date();
		const daysOld = Math.floor((today.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
		check('Data vintage is fresh (0 days old)', daysOld === 0, `${daysOld} days old`);
		console.log(`  INFO: DATA_VINTAGE expects ${DATA_VINTAGE.validation_checks} checks`);
	} catch (error) {
		warn('Data vintage validation', `Could not import: ${error}`);
	}

	console.log('\n=== Summary ===');
	console.log(`  Passed: ${passed}`);
	console.log(`  Failed: ${failed}`);
	console.log(`  Warnings: ${warnings}`);

	if (failed > 0) {
		console.log('\nValidation FAILED.');
		process.exit(1);
	}

	console.log('\nAll checks passed.');
}

main();
