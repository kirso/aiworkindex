#!/usr/bin/env bun
/**
 * enrich-bls-employment.ts — Use BLS employment as proxy for per-occupation splits.
 *
 * Problem: MOM publishes employment at 9 major groups, not per occupation.
 * Our estimated_employment_thousands is group_total / count_in_group (fake even split).
 *
 * Solution: Use US BLS employment distribution within each group as a proportional proxy.
 * If 40% of US "Professionals" employment is in software-related SOC codes,
 * we assign 40% of Singapore's 624K professionals to software-related SSOC codes.
 *
 * Output: Updates data/occupations.json and src/lib/data/occupations.json with
 * bls_proxy_employment field. Does NOT overwrite employment_thousands (keeps MOM group-level).
 *
 * Run: bun run scripts/enrich-bls-employment.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ssocToSocCodes } from './crosswalk';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const EXT_DIR = path.join(DATA_DIR, 'raw', 'external');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUTPUT_FILE = OCCUPATIONS_FILE;
const COPY_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'occupations.json');

interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	employment_thousands: number;
	group_employment_thousands: number;
	[key: string]: unknown;
}

function main() {
	console.log('=== BLS Employment Proxy Enrichment ===\n');

	// Load BLS projections (has SOC codes + base year employment)
	const wb = XLSX.readFile(path.join(EXT_DIR, 'bls_projections_2024_2034.xlsx'));
	const rows = XLSX.utils.sheet_to_json(wb.Sheets['Table 1.2'], { header: 1 }) as unknown[][];
	const blsBySoc = new Map<string, number>();
	for (const row of rows) {
		if ((row as string[])[2] !== 'Line item') continue;
		const soc = String((row as string[])[1]).trim();
		const emp = parseFloat(String((row as number[])[3]));
		if (soc && !isNaN(emp)) blsBySoc.set(soc, emp);
	}
	console.log(`BLS SOC codes loaded: ${blsBySoc.size}`);

	// Load our occupations
	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	console.log(`Occupations loaded: ${occupations.length}`);

	// Step 1: Match each SG occupation to BLS employment
	const blsMatches = new Map<string, number>(); // ssoc → BLS employment (thousands)
	for (const occ of occupations) {
		const socs = ssocToSocCodes(occ.ssoc);
		if (!socs || socs.length === 0) continue;
		const emps = socs.map(s => blsBySoc.get(s)).filter((v): v is number => v !== undefined);
		if (emps.length > 0) {
			blsMatches.set(occ.ssoc, emps.reduce((s, v) => s + v, 0) / emps.length);
		}
	}
	console.log(`BLS-matched occupations: ${blsMatches.size}`);

	// Step 2: For each major group, compute proportional shares
	const groups = new Map<string, { ssocs: string[]; blsEmps: number[]; sgGroupTotal: number }>();
	for (const occ of occupations) {
		const g = groups.get(occ.major_group) ?? {
			ssocs: [],
			blsEmps: [],
			sgGroupTotal: occ.group_employment_thousands
		};
		g.ssocs.push(occ.ssoc);
		g.blsEmps.push(blsMatches.get(occ.ssoc) ?? 0);
		groups.set(occ.major_group, g);
	}

	// Step 3: Distribute SG group employment proportional to BLS shares
	const proxyEmpl = new Map<string, number>(); // ssoc → proxy employment (thousands)
	let enriched = 0;
	let fallback = 0;

	for (const [groupKey, g] of groups) {
		const blsTotal = g.blsEmps.reduce((s, v) => s + v, 0);
		if (blsTotal === 0) {
			// No BLS data for this group — keep equal split
			for (const ssoc of g.ssocs) {
				proxyEmpl.set(ssoc, g.sgGroupTotal / g.ssocs.length);
			}
			fallback += g.ssocs.length;
			continue;
		}

		for (let i = 0; i < g.ssocs.length; i++) {
			const blsEmp = g.blsEmps[i]!;
			if (blsEmp > 0) {
				// Proportional: (this occupation's BLS share) × SG group total
				const share = blsEmp / blsTotal;
				proxyEmpl.set(g.ssocs[i]!, share * g.sgGroupTotal);
				enriched++;
			} else {
				// No BLS match — give minimum share (1/N of remaining after matched)
				const unmatchedCount = g.blsEmps.filter(v => v === 0).length;
				const matchedShare = g.blsEmps.filter(v => v > 0).reduce((s, v) => s + v, 0) / blsTotal;
				const remaining = (1 - matchedShare) * g.sgGroupTotal;
				proxyEmpl.set(g.ssocs[i]!, remaining / unmatchedCount);
				fallback++;
			}
		}
	}

	console.log(`Proportionally enriched: ${enriched}`);
	console.log(`Fallback (equal split): ${fallback}`);

	// Step 4: Write back
	for (const occ of occupations) {
		(occ as Record<string, unknown>).bls_proxy_employment = Number(
			(proxyEmpl.get(occ.ssoc) ?? occ.employment_thousands).toFixed(2)
		);
	}

	// Spot check
	console.log('\nSpot check (top 10 by proxy employment):');
	const sorted = [...occupations].sort(
		(a, b) =>
			((b as Record<string, number>).bls_proxy_employment ?? 0) -
			((a as Record<string, number>).bls_proxy_employment ?? 0)
	);
	for (const occ of sorted.slice(0, 10)) {
		const proxy = (occ as Record<string, number>).bls_proxy_employment;
		console.log(
			`  ${occ.title.substring(0, 40).padEnd(40)} old=${occ.employment_thousands.toFixed(1)}K  proxy=${proxy.toFixed(1)}K`
		);
	}

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(occupations, null, 2));
	fs.copyFileSync(OUTPUT_FILE, COPY_FILE);
	console.log(`\nWrote ${OUTPUT_FILE}`);
	console.log(`Copied to ${COPY_FILE}`);
}

main();
