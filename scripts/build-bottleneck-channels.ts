#!/usr/bin/env bun
/**
 * build-bottleneck-channels.ts — Named insulation channels per occupation.
 *
 * Decomposes the Pizzinelli theta bottleneck into its six named dimensions so
 * occupation pages can say WHY a role is insulated ("relational work +
 * high-stakes decisions") instead of showing one opaque number. Uses the exact
 * same O*NET Work Context elements, scales, and Job Zone input as the theta
 * computation in scripts/score.ts — this is a decomposition of existing math,
 * not new scoring, and it never feeds any score.
 *
 * Outputs:
 *   data/bottleneck-channels.json
 *   src/lib/data/bottleneck-channels.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { ssocToSocCodes } from './crosswalk';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const EXT_DIR = path.join(DATA_DIR, 'raw', 'external');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'bottleneck-channels.json');
const SRC_OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'bottleneck-channels.json');

/** Same dimension definitions as computeTheta in scripts/score.ts. */
const CHANNELS = [
	{ key: 'relational', label: 'Relational work', elements: ['4.C.1.a.2.l', '4.C.1.a.2.c'] },
	{
		key: 'accountability',
		label: 'Accountability for others',
		elements: ['4.C.1.c.2', '4.C.1.c.1']
	},
	{ key: 'physical', label: 'Physical presence', elements: ['4.C.2.a.1.c', '4.C.2.a.3'] },
	{
		key: 'high_stakes',
		label: 'High-stakes decisions',
		elements: ['4.C.3.a.1', '4.C.3.a.4', '4.C.3.a.2.b']
	}
] as const;

interface OccupationRecord {
	ssoc: string;
	bottleneck: number;
}

function loadWorkContext(): Map<string, Map<string, number>> {
	const content = fs.readFileSync(path.join(EXT_DIR, 'Work_Context.txt'), 'utf-8');
	const lines = content.split('\n');
	const wcMap = new Map<string, Map<string, number>>();
	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split('\t');
		if (parts.length < 6) continue;
		const [socFull, elementId, , scaleId, , dataValueStr] = parts;
		if (scaleId !== 'CX') continue;
		const dataValue = parseFloat(dataValueStr);
		if (isNaN(dataValue)) continue;
		const soc = socFull.split('.')[0];
		if (!wcMap.has(soc)) wcMap.set(soc, new Map());
		const existing = wcMap.get(soc)!;
		if (!existing.has(elementId)) {
			existing.set(elementId, dataValue);
		} else {
			const current = existing.get(elementId)!;
			const count = (existing.get(`${elementId}_count`) || 1) + 1;
			existing.set(elementId, (current * (count - 1) + dataValue) / count);
			existing.set(`${elementId}_count`, count);
		}
	}
	return wcMap;
}

function loadJobZones(): Map<string, number> {
	const content = fs.readFileSync(path.join(EXT_DIR, 'Job_Zones.txt'), 'utf-8');
	const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
	const headers = lines[0].split('\t').map(header => header.trim());
	const jzMap = new Map<string, number>();
	for (const line of lines.slice(1)) {
		const values = line.split('\t');
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			row[header] = (values[index] ?? '').trim();
		});
		const socFull = row['O*NET-SOC Code'] ?? '';
		const jz = Number(row['Job Zone']);
		if (!socFull || !Number.isFinite(jz)) continue;
		const soc = socFull.split('.')[0];
		jzMap.set(soc, jzMap.has(soc) ? (jzMap.get(soc)! + jz) / 2 : jz);
	}
	return jzMap;
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

function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

function main() {
	console.log('=== Bottleneck Channels (theta decomposition) ===');
	const occupations: OccupationRecord[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const wcMap = loadWorkContext();
	const jzMap = loadJobZones();

	const entries: Record<
		string,
		{ channels: Record<string, number>; top_channels: Array<{ key: string; label: string }> }
	> = {};

	for (const occ of occupations) {
		const socCodes = ssocToSocCodes(occ.ssoc).filter(soc => wcMap.has(soc) || jzMap.has(soc));
		if (socCodes.length === 0) continue;

		const channelValues: Record<string, number> = {};
		for (const channel of CHANNELS) {
			const values = socCodes
				.map(soc => getElementMean(wcMap.get(soc), [...channel.elements], 5))
				.filter((value): value is number => value !== null);
			if (values.length > 0) {
				channelValues[channel.key] = round4(values.reduce((a, b) => a + b, 0) / values.length);
			}
		}

		// Non-routine: same inversion logic as score.ts (automation inverted, structured not)
		const nonroutineValues = socCodes
			.map(soc => {
				const wc = wcMap.get(soc);
				const automation = wc?.get('4.C.3.b.2');
				const structured = wc?.get('4.C.3.b.8');
				if (automation !== undefined && structured !== undefined) {
					return ((5 + 1 - automation) / 5 + structured / 5) / 2;
				}
				if (automation !== undefined) return (5 + 1 - automation) / 5;
				if (structured !== undefined) return structured / 5;
				return null;
			})
			.filter((value): value is number => value !== null);
		if (nonroutineValues.length > 0) {
			channelValues.nonroutine = round4(
				nonroutineValues.reduce((a, b) => a + b, 0) / nonroutineValues.length
			);
		}

		// Skill depth: Job Zone scaled to 0-1
		const jzValues = socCodes
			.map(soc => jzMap.get(soc))
			.filter((value): value is number => value !== undefined);
		if (jzValues.length > 0) {
			channelValues.skill_depth = round4(jzValues.reduce((a, b) => a + b, 0) / jzValues.length / 5);
		}

		if (Object.keys(channelValues).length < 3) continue;

		const labels: Record<string, string> = {
			relational: 'Relational work',
			accountability: 'Accountability for others',
			physical: 'Physical presence',
			high_stakes: 'High-stakes decisions',
			nonroutine: 'Non-routine work',
			skill_depth: 'Deep preparation'
		};
		const topChannels = Object.entries(channelValues)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 2)
			.map(([key]) => ({ key, label: labels[key] ?? key }));

		entries[occ.ssoc] = { channels: channelValues, top_channels: topChannels };
	}

	const payload = {
		method: 'theta_dimension_decomposition_v1',
		note: 'Decomposition of the Pizzinelli theta bottleneck into its named O*NET work-context dimensions (same elements and scales as scripts/score.ts). Explanatory only — never a score input. Direct SOC matches only; occupations resolved via fallback mappings have no entry.',
		entries
	};
	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
	fs.mkdirSync(path.dirname(SRC_OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(SRC_OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
	console.log(
		`Channels emitted for ${Object.keys(entries).length}/${occupations.length} occupations`
	);
	console.log(`Built bottleneck channels at ${OUTPUT_FILE}`);
}

main();
