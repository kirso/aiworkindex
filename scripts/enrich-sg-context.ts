#!/usr/bin/env bun
/**
 * enrich-sg-context.ts — Add education level and Singapore policy context to occupations.
 *
 * Adds:
 * - education_level: 1-5 from O*NET Job Zones via SOC crosswalk
 * - sg_context.pwm_covered: boolean (Progressive Wage Model sectors)
 * - sg_context.licensed_profession: 'strict' | 'partial' | false
 * - sg_context.foreign_worker_dependency: 'very_high' | 'high' | 'moderate' | false
 * - sg_context.skillsfuture_eligible: boolean
 *
 * Run: bun run scripts/enrich-sg-context.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ssocToSocCodes } from './crosswalk';
import { occupationDataBasisTemplate } from '../src/lib/data/data-contract';

// ===== Paths =====
const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw', 'external');
const OUT_FILE = path.join(DATA_DIR, 'occupations.json');
const SRC_OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'occupations.json');

// ===== Education Level Labels =====
const EDUCATION_LABELS: Record<number, string> = {
	1: 'No formal education',
	2: 'GCE O-Level / Secondary',
	3: 'Polytechnic / ITE Diploma',
	4: 'University Degree',
	5: 'Graduate Degree'
};

// ===== PWM Sector SSOC 2-digit prefixes =====
// Progressive Wage Model coverage by sector
const PWM_PREFIXES: Record<string, string> = {
	'91': 'cleaning', // Cleaning sector
	'54': 'security', // Security sector
	'92': 'landscape', // Landscape sector
	'52': 'retail', // Retail sector (partial coverage)
	'51': 'food_services', // Food services sector
	'94': 'food_services' // Food services (labourers)
};

// ===== Licensed Profession SSOC 3-digit prefixes =====
const LICENSED_STRICT_PREFIXES = [
	'221', // Doctors, general practitioners, specialist physicians, surgeons
	'223', // Traditional and complementary medicine practitioners
	'225', // Veterinarians
	'226', // Dentists, pharmacists, audiologists, physiotherapists, etc.
	'261', // Lawyers, judges
	'214' // Architects, engineers (PE-registered)
];

const LICENSED_PARTIAL_PREFIXES = [
	'243', // Financial advisors, marketing professionals (MAS-licensed)
	'332' // Insurance agents, real estate agents (CEA/MAS-licensed)
];

// ===== Foreign Worker Dependency by Major Group =====
const FOREIGN_WORKER_MAP: Record<string, 'very_high' | 'high' | 'moderate'> = {
	'CRAFTSMEN AND RELATED TRADES WORKERS': 'very_high', // >70% foreign
	'CLEANERS, LABOURERS AND RELATED WORKERS': 'very_high', // >70% foreign
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS': 'high', // 40-70%
	'SERVICE AND SALES WORKERS': 'moderate' // 20-40%
};

// ===== SkillsFuture Eligible Major Groups =====
// Groups with career conversion programmes (CCP) and SkillsFuture support
const SKILLSFUTURE_GROUPS = new Set([
	'CLERICAL SUPPORT WORKERS',
	'SERVICE AND SALES WORKERS',
	'PLANT AND MACHINE OPERATORS AND ASSEMBLERS',
	'CRAFTSMEN AND RELATED TRADES WORKERS'
]);

// ===== Load Job Zones from O*NET =====
function loadJobZones(): {
	exact: Map<string, number>;
	broadGroup: Map<string, number>;
	minorGroup: Map<string, number>;
} {
	const filePath = path.join(RAW_DIR, 'Job_Zones.xlsx');
	if (!fs.existsSync(filePath)) {
		console.error(`ERROR: Job_Zones.xlsx not found at ${filePath}`);
		process.exit(1);
	}

	const wb = XLSX.readFile(filePath);
	const ws = wb.Sheets[wb.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json<{ 'O*NET-SOC Code': string; 'Job Zone': number }>(ws);

	// Map 6-digit SOC code (without .XX suffix) to Job Zone
	// When multiple O*NET detail codes share a 6-digit SOC, average the zones
	const socZones = new Map<string, number[]>();

	for (const row of rows) {
		const fullCode = row['O*NET-SOC Code'];
		const zone = row['Job Zone'];
		if (!fullCode || !zone) continue;

		// Strip .XX suffix: "11-1011.00" → "11-1011"
		const soc6 = fullCode.split('.')[0];
		const existing = socZones.get(soc6) ?? [];
		existing.push(zone);
		socZones.set(soc6, existing);
	}

	// Average zones per 6-digit SOC
	const result = new Map<string, number>();
	for (const [soc, zones] of socZones) {
		const avg = zones.reduce((a, b) => a + b, 0) / zones.length;
		result.set(soc, avg);
	}

	// Build broad group averages (first 5 chars of SOC, e.g. "29-12")
	// for fallback when exact SOC codes are from a newer taxonomy
	const broadGroupZones = new Map<string, number[]>();
	// Build minor group averages (first 4 chars of SOC, e.g. "29-1")
	// for second-level fallback (2018 SOC → 2010 SOC minor group)
	const minorGroupZones = new Map<string, number[]>();

	for (const [soc, zone] of result) {
		const broad = soc.substring(0, 5);
		const minor = soc.substring(0, 4);

		const broadExisting = broadGroupZones.get(broad) ?? [];
		broadExisting.push(zone);
		broadGroupZones.set(broad, broadExisting);

		const minorExisting = minorGroupZones.get(minor) ?? [];
		minorExisting.push(zone);
		minorGroupZones.set(minor, minorExisting);
	}

	const broadGroupAvg = new Map<string, number>();
	for (const [prefix, zones] of broadGroupZones) {
		broadGroupAvg.set(prefix, zones.reduce((a, b) => a + b, 0) / zones.length);
	}

	const minorGroupAvg = new Map<string, number>();
	for (const [prefix, zones] of minorGroupZones) {
		minorGroupAvg.set(prefix, zones.reduce((a, b) => a + b, 0) / zones.length);
	}

	console.log(`Loaded ${result.size} unique SOC Job Zone mappings from ${rows.length} O*NET rows`);
	console.log(
		`Built ${broadGroupAvg.size} broad group + ${minorGroupAvg.size} minor group fallback averages`
	);
	return { exact: result, broadGroup: broadGroupAvg, minorGroup: minorGroupAvg };
}

// ===== Compute Education Level for an Occupation =====
function computeEducationLevel(
	ssoc: string,
	jobZoneMap: Map<string, number>,
	socBroadGroupZones: Map<string, number>,
	socMinorGroupZones: Map<string, number>
): { level: number; label: string } | null {
	const socCodes = ssocToSocCodes(ssoc);
	if (socCodes.length === 0) return null;

	// Average Job Zone across all matched SOC codes (exact match)
	const zones: number[] = [];
	for (const soc of socCodes) {
		const zone = jobZoneMap.get(soc);
		if (zone !== undefined) {
			zones.push(zone);
		}
	}

	// Fallback 1: try SOC broad group (first 5 chars, e.g. "29-12")
	// Handles cases where crosswalk uses 2018 SOC codes but Job Zones has 2010 SOC codes
	if (zones.length === 0) {
		const broadPrefixes = new Set(socCodes.map(soc => soc.substring(0, 5)));
		for (const prefix of broadPrefixes) {
			const zone = socBroadGroupZones.get(prefix);
			if (zone !== undefined) {
				zones.push(zone);
			}
		}
	}

	// Fallback 2: try SOC minor group (first 4 chars, e.g. "29-1")
	// Catches remaining 2018→2010 SOC mismatches (e.g. 29-12xx maps to 29-1x minor group)
	if (zones.length === 0) {
		const minorPrefixes = new Set(socCodes.map(soc => soc.substring(0, 4)));
		for (const prefix of minorPrefixes) {
			const zone = socMinorGroupZones.get(prefix);
			if (zone !== undefined) {
				zones.push(zone);
			}
		}
	}

	if (zones.length === 0) return null;

	const avgZone = zones.reduce((a, b) => a + b, 0) / zones.length;
	// Round to nearest integer for the level
	const level = Math.round(avgZone);
	const clampedLevel = Math.max(1, Math.min(5, level));

	return {
		level: clampedLevel,
		label: EDUCATION_LABELS[clampedLevel]
	};
}

// ===== Determine Licensed Profession Status =====
function getLicensedProfession(ssoc: string): 'strict' | 'partial' | false {
	const prefix3 = ssoc.substring(0, 3);

	if (LICENSED_STRICT_PREFIXES.includes(prefix3)) return 'strict';
	if (LICENSED_PARTIAL_PREFIXES.includes(prefix3)) return 'partial';
	return false;
}

// ===== Determine PWM Coverage =====
function getPwmCovered(ssoc: string): boolean {
	const prefix2 = ssoc.substring(0, 2);
	return prefix2 in PWM_PREFIXES;
}

// ===== Determine Foreign Worker Dependency =====
function getForeignWorkerDependency(majorGroup: string): 'very_high' | 'high' | 'moderate' | false {
	return FOREIGN_WORKER_MAP[majorGroup] ?? false;
}

// ===== Determine SkillsFuture Eligibility =====
function getSkillsfutureEligible(majorGroup: string): boolean {
	return SKILLSFUTURE_GROUPS.has(majorGroup);
}

// ===== Main =====
function main() {
	console.log('=== enrich-sg-context.ts ===\n');

	// Load data
	const occupations = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
	console.log(`Loaded ${occupations.length} occupations from ${OUT_FILE}`);

	const {
		exact: jobZoneMap,
		broadGroup: socBroadGroupZones,
		minorGroup: socMinorGroupZones
	} = loadJobZones();

	// Stats counters
	let educationMatched = 0;
	let educationMissed = 0;
	let pwmCount = 0;
	let licensedStrictCount = 0;
	let licensedPartialCount = 0;
	let foreignVeryHighCount = 0;
	let foreignHighCount = 0;
	let foreignModerateCount = 0;
	let skillsfutureCount = 0;

	// Enrich each occupation
	for (const occ of occupations) {
		// --- Education Level ---
		const education = computeEducationLevel(
			occ.ssoc,
			jobZoneMap,
			socBroadGroupZones,
			socMinorGroupZones
		);
		if (education) {
			occ.education_level = education.level;
			occ.education_label = education.label;
			educationMatched++;
		} else {
			educationMissed++;
		}

		// --- Singapore Context ---
		// Don't overwrite if sg_context already exists (preserve existing fields)
		const existing = occ.sg_context ?? {};
		const existingBasis = occ.data_basis ?? {};

		const pwmCovered = getPwmCovered(occ.ssoc);
		const licensedProfession = getLicensedProfession(occ.ssoc);
		const foreignWorkerDep = getForeignWorkerDependency(occ.major_group);
		const skillsfutureEligible = getSkillsfutureEligible(occ.major_group);

		occ.sg_context = {
			...existing,
			pwm_covered: pwmCovered,
			licensed_profession: licensedProfession,
			foreign_worker_dependency: foreignWorkerDep,
			skillsfuture_eligible: skillsfutureEligible
		};
		occ.data_basis = {
			...existingBasis,
			employment_estimate: existingBasis.employment_estimate ?? {
				...occupationDataBasisTemplate.employment_estimate
			},
			wage_pool_proxy: existingBasis.wage_pool_proxy ?? {
				...occupationDataBasisTemplate.wage_pool_proxy
			},
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

		// Count stats
		if (pwmCovered) pwmCount++;
		if (licensedProfession === 'strict') licensedStrictCount++;
		if (licensedProfession === 'partial') licensedPartialCount++;
		if (foreignWorkerDep === 'very_high') foreignVeryHighCount++;
		if (foreignWorkerDep === 'high') foreignHighCount++;
		if (foreignWorkerDep === 'moderate') foreignModerateCount++;
		if (skillsfutureEligible) skillsfutureCount++;
	}

	// Print summary
	console.log('\n=== Enrichment Summary ===');
	console.log(`Education level matched: ${educationMatched}/${occupations.length}`);
	console.log(`Education level missed:  ${educationMissed}/${occupations.length}`);
	console.log('');
	console.log(`PWM covered:                ${pwmCount}`);
	console.log(`Licensed (strict):          ${licensedStrictCount}`);
	console.log(`Licensed (partial):         ${licensedPartialCount}`);
	console.log(`Foreign worker (very_high): ${foreignVeryHighCount}`);
	console.log(`Foreign worker (high):      ${foreignHighCount}`);
	console.log(`Foreign worker (moderate):  ${foreignModerateCount}`);
	console.log(`SkillsFuture eligible:      ${skillsfutureCount}`);

	// Write output
	const output = JSON.stringify(occupations, null, 2);
	fs.writeFileSync(OUT_FILE, output);
	console.log(`\nWrote ${OUT_FILE} (${occupations.length} occupations)`);

	// Copy to src/lib/data/
	fs.mkdirSync(path.dirname(SRC_OUT_FILE), { recursive: true });
	fs.writeFileSync(SRC_OUT_FILE, output);
	console.log(`Copied to ${SRC_OUT_FILE}`);

	console.log('\n=== Done ===');
}

main();
