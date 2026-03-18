#!/usr/bin/env bun
/**
 * enrich-onet.ts — Enrich SG occupations with O*NET tasks and technologies.
 *
 * Approach: Direct title matching between SG occupation titles and O*NET
 * occupation titles. No crosswalk — avoids ISCO→SOC mapping errors that
 * produce nonsensical content (e.g. diet counseling for environmental officers).
 *
 * Matching strategy:
 *   1. Exact substring match on significant title words
 *   2. Score by word overlap (Jaccard-like)
 *   3. Only accept matches above a quality threshold
 *
 * Run: bun run scripts/enrich-onet.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const ONET_DIR = path.join(DATA_DIR, 'raw', 'external', 'onet');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUT_FILE = path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'onet-enrichment.json');

interface SgOccupation {
	ssoc: string;
	title: string;
}

interface OnetOccupation {
	soc: string;
	socFull: string;
	title: string;
	words: Set<string>;
}

interface EnrichedEntry {
	ssoc: string;
	onet_soc: string | null;
	onet_title: string | null;
	match_score: number;
	tasks: string[];
	technologies: Array<{ name: string; category: string; hot: boolean }>;
}

function parseTSV(filepath: string): Record<string, string>[] {
	const content = fs.readFileSync(filepath, 'utf-8');
	const lines = content.split('\n').filter(l => l.trim());
	if (lines.length === 0) return [];
	const headers = lines[0].split('\t');
	return lines.slice(1).map(line => {
		const values = line.split('\t');
		const row: Record<string, string> = {};
		headers.forEach((h, i) => {
			row[h.trim()] = (values[i] || '').trim();
		});
		return row;
	});
}

// Words to exclude from matching — too generic to indicate domain similarity
const STOP_WORDS = new Set([
	'and',
	'or',
	'the',
	'of',
	'in',
	'for',
	'to',
	'a',
	'an',
	'all',
	'other',
	'not',
	'including',
	'excluding',
	'except',
	'general',
	'senior',
	'junior',
	'chief',
	'head',
	'lead',
	'assistant',
	'associate',
	'deputy',
	'acting',
	'officer',
	'specialist',
	'professional',
	'technician',
	'worker',
	'operator',
	'supervisor',
	'adviser',
	'advisor',
	'coordinator',
	'practitioner',
	'assistants'
]);

function extractWords(title: string): Set<string> {
	// Remove parenthetical qualifiers like "(excluding tax accountant)"
	const cleaned = title.replace(/\((?:excluding|including|except|e\.g\.).*?\)/gi, '');
	return new Set(
		cleaned
			.toLowerCase()
			.replace(/[()\/,\-\.]/g, ' ')
			.split(/\s+/)
			.filter(w => w.length > 2 && !STOP_WORDS.has(w))
	);
}

/**
 * Score the match quality between an SG title and an O*NET title.
 * Returns 0-1 where 1 is perfect match.
 */
function matchScore(sgWords: Set<string>, onetWords: Set<string>): number {
	if (sgWords.size === 0 || onetWords.size === 0) return 0;

	let matches = 0;

	for (const w of sgWords) {
		for (const ow of onetWords) {
			// Exact or stem match (one is prefix of the other, min 5 chars)
			if (w === ow) {
				matches++;
				break;
			}
			const shorter = w.length <= ow.length ? w : ow;
			const longer = w.length <= ow.length ? ow : w;
			if (shorter.length >= 5 && longer.startsWith(shorter)) {
				matches++;
				break;
			}
		}
	}

	if (matches === 0) return 0;

	// Score: match count + tiebreaker based on specificity
	// Prefer O*NET titles with more meaningful (non-stopped) words that match,
	// penalize titles reduced to just 1 generic word
	const onetWordCount = onetWords.size;
	const specificity = onetWordCount > 1 ? matches / onetWordCount : 0.3;
	return matches + specificity * 0.5;
}

function main() {
	console.log('=== O*NET Enrichment (Title Matching) ===\n');

	const occFile = path.join(ONET_DIR, 'Occupation_Data.txt');
	const taskFile = path.join(ONET_DIR, 'Task_Statements.txt');
	const techFile = path.join(ONET_DIR, 'Technology_Skills.txt');

	for (const f of [occFile, taskFile]) {
		if (!fs.existsSync(f)) {
			console.error(`Missing: ${f}`);
			process.exit(1);
		}
	}

	// Load SG occupations
	const sgOccs: SgOccupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	console.log(`SG occupations: ${sgOccs.length}`);

	// Load O*NET occupations with titles
	const onetOccs: OnetOccupation[] = [];
	for (const row of parseTSV(occFile)) {
		const socFull = row['O*NET-SOC Code'] || '';
		const soc = socFull.split('.')[0];
		const title = row['Title'] || '';
		if (soc && title) {
			onetOccs.push({ soc, socFull, title, words: extractWords(title) });
		}
	}
	console.log(`O*NET occupations: ${onetOccs.length}`);

	// Load tasks indexed by full SOC code
	console.log('Loading tasks...');
	const tasksBySocFull = new Map<string, string[]>();
	for (const row of parseTSV(taskFile)) {
		const soc = row['O*NET-SOC Code'] || '';
		const task = row['Task'] || '';
		if (soc && task) {
			if (!tasksBySocFull.has(soc)) tasksBySocFull.set(soc, []);
			const list = tasksBySocFull.get(soc)!;
			if (!list.includes(task)) list.push(task);
		}
	}

	// Load technologies indexed by full SOC code
	console.log('Loading technologies...');
	const techBySocFull = new Map<string, Array<{ name: string; category: string; hot: boolean }>>();
	if (fs.existsSync(techFile)) {
		for (const row of parseTSV(techFile)) {
			const soc = row['O*NET-SOC Code'] || '';
			const name = row['Example'] || '';
			const category = row['Commodity Title'] || '';
			const hot = row['Hot Technology'] === 'Y';
			if (soc && name) {
				if (!techBySocFull.has(soc)) techBySocFull.set(soc, []);
				const list = techBySocFull.get(soc)!;
				if (!list.some(t => t.name === name)) list.push({ name, category, hot });
			}
		}
	}

	console.log(`Indexed: ${tasksBySocFull.size} SOC codes with tasks\n`);

	// Match each SG occupation to the best O*NET occupation by title
	// Manual overrides for SG occupations where title matching fails
	// Maps SSOC → O*NET SOC code (without .XX suffix)
	const MANUAL_OVERRIDES: Record<string, string> = {
		'22110': '29-1215', // General practitioner/physician → Family Medicine Physicians
		'22131': '29-1249', // General surgeon → Surgeons, All Other
		'22132': '29-1249', // Cardiothoracic surgeon → Surgeons, All Other
		'22135': '29-1242', // Orthopaedic surgeon → Orthopedic Surgeons
		'22138': '29-1249', // Urologist → Surgeons, All Other
		'22141': '29-1211', // Anaesthesiologist → Anesthesiologists
		'22122': '29-1216', // Dermatologist → General Internal Medicine Physicians
		'22124': '29-1216', // Internal medicine physician → General Internal Medicine Physicians
		'22126': '29-1221', // Paediatrician → Pediatricians, General
		'22128': '29-1223', // Psychiatrist → Psychiatrists
		'22144': '29-1218', // Obstetrician/Gynaecologist → Obstetricians and Gynecologists
		'22145': '29-1241', // Ophthalmologist → Ophthalmologists, Except Pediatric
		'22143': '29-1214', // Emergency physician → Emergency Medicine Physicians
		'12112': '11-3012' // Administration manager → Administrative Services Managers
	};

	const MATCH_THRESHOLD = 1.05; // At least 1 stem match + some Jaccard
	const enriched: EnrichedEntry[] = [];
	let matched = 0;
	let totalTasks = 0;
	let totalTech = 0;

	for (const sg of sgOccs) {
		const sgWords = extractWords(sg.title);

		const allTasks = new Set<string>();
		const allTech = new Map<string, { name: string; category: string; hot: boolean }>();

		// Check manual override first
		const override = MANUAL_OVERRIDES[sg.ssoc];
		if (override) {
			const overrideOcc = onetOccs.find(o => o.soc === override);
			if (overrideOcc) {
				// Collect tasks/tech for override
				for (const [socKey, taskList] of tasksBySocFull) {
					if (socKey.startsWith(override)) {
						for (const t of taskList) allTasks.add(t);
					}
				}
				for (const [socKey, techList] of techBySocFull) {
					if (socKey.startsWith(override)) {
						for (const t of techList) {
							if (!allTech.has(t.name)) allTech.set(t.name, t);
						}
					}
				}

				if (allTasks.size > 0 || allTech.size > 0) matched++;
				totalTasks += allTasks.size;
				totalTech += allTech.size;

				const GENERIC_CATS = new Set([
					'Electronic mail software',
					'Office suite software',
					'Word processing software',
					'Spreadsheet software',
					'Presentation software',
					'Web browser software',
					'File versioning software',
					'Instant messaging software',
					'Video conferencing software',
					'Document management software',
					'Calendar and scheduling software'
				]);
				const isIT = sg.title
					.toLowerCase()
					.match(
						/software|developer|engineer|programmer|data|cloud|devops|IT |ict |web |network|database|cyber|security.*tech/i
					);
				const techFiltered = [...allTech.values()].filter(
					t => isIT || !GENERIC_CATS.has(t.category)
				);
				const techSorted = techFiltered
					.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || a.name.localeCompare(b.name))
					.slice(0, 12);

				enriched.push({
					ssoc: sg.ssoc,
					onet_soc: overrideOcc.socFull,
					onet_title: overrideOcc.title,
					match_score: 1.0,
					tasks: [...allTasks].slice(0, 10),
					technologies: techSorted
				});
				continue;
			}
		}

		// Score all O*NET occupations by title similarity
		let bestMatch: OnetOccupation | null = null;
		let bestScore = 0;

		for (const onet of onetOccs) {
			let score = matchScore(sgWords, onet.words);
			if (score === 0) continue;

			// Tiebreaker: prefer O*NET titles where the main noun is a plural
			// of an SG word (e.g. "physician" → "Physicians" > "Physician Assistants")
			const onetRaw = onet.title.toLowerCase();
			for (const w of sgWords) {
				if (onetRaw.startsWith(w + 's') || onetRaw.startsWith(w + ',')) {
					score += 0.01; // Tiny bonus for leading-word match
				}
			}

			if (score > bestScore) {
				bestScore = score;
				bestMatch = onet;
			}
		}

		const entry: EnrichedEntry = {
			ssoc: sg.ssoc,
			onet_soc: null,
			onet_title: null,
			match_score: 0,
			tasks: [],
			technologies: []
		};

		if (bestMatch && bestScore >= MATCH_THRESHOLD) {
			entry.onet_soc = bestMatch.socFull;
			entry.onet_title = bestMatch.title;
			// Normalize score for storage (extract just the Jaccard part)
			entry.match_score = Math.round((bestScore % 1) * 100) / 100;

			// Collect tasks from this SOC and any sub-specialties (.01, .02, etc)
			const tasks = new Set<string>();
			const techs = new Map<string, { name: string; category: string; hot: boolean }>();

			for (const [socKey, taskList] of tasksBySocFull) {
				if (socKey.startsWith(bestMatch.soc)) {
					for (const t of taskList) tasks.add(t);
				}
			}
			for (const [socKey, techList] of techBySocFull) {
				if (socKey.startsWith(bestMatch.soc)) {
					for (const t of techList) {
						if (!techs.has(t.name)) techs.set(t.name, t);
					}
				}
			}

			entry.tasks = [...tasks].slice(0, 10);
			// Filter out generic office/dev tools that add noise for non-IT occupations
			const GENERIC_CATEGORIES = new Set([
				'Electronic mail software',
				'Office suite software',
				'Word processing software',
				'Spreadsheet software',
				'Presentation software',
				'Web browser software',
				'File versioning software',
				'Instant messaging software',
				'Video conferencing software',
				'Document management software',
				'Calendar and scheduling software'
			]);

			const isITOccupation = sg.title
				.toLowerCase()
				.match(
					/software|developer|engineer|programmer|data|cloud|devops|IT |ict |web |network|database|cyber|security.*tech/i
				);

			const filtered = [...techs.values()].filter(t => {
				// IT occupations keep everything
				if (isITOccupation) return true;
				// Non-IT: filter out generic tools
				if (GENERIC_CATEGORIES.has(t.category)) return false;
				return true;
			});

			entry.technologies = filtered
				.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || a.name.localeCompare(b.name))
				.slice(0, 12);

			if (entry.tasks.length > 0 || entry.technologies.length > 0) {
				matched++;
				totalTasks += entry.tasks.length;
				totalTech += entry.technologies.length;
			}
		}

		enriched.push(entry);
	}

	// Write output
	fs.writeFileSync(OUT_FILE, JSON.stringify(enriched, null, 2));

	console.log(
		`Matched: ${matched}/${sgOccs.length} (${((matched / sgOccs.length) * 100).toFixed(1)}%)`
	);
	console.log(`Tasks: ${totalTasks}, Technologies: ${totalTech}`);
	console.log(`Output: ${OUT_FILE}`);

	// Show some example matches for verification
	console.log('\n--- Sample matches ---');
	const samples = ['25121', '24111', '21331', '22632', '32571', '22132', '41101', '12112'];
	for (const ssoc of samples) {
		const e = enriched.find(x => x.ssoc === ssoc);
		const sg = sgOccs.find(x => x.ssoc === ssoc);
		if (!e || !sg) continue;
		console.log(`${sg.title} → ${e.onet_title || '(no match)'} [${e.match_score}]`);
		if (e.tasks.length > 0) console.log(`  Task: ${e.tasks[0].substring(0, 70)}...`);
	}
}

main();
