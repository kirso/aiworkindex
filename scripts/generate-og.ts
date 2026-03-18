#!/usr/bin/env bun
/**
 * generate-og.ts — Generate Open Graph images for all 562 occupations.
 * Run: bun run scripts/generate-og.ts
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(import.meta.dir, '..', 'data', 'occupations.json');
const OUT_DIR = path.join(import.meta.dir, '..', 'static', 'og');
const FONT_FILE = path.join(import.meta.dir, '..', 'static', 'fonts', 'Inter.ttf');

interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	gross_wage_median: number;
	net_risk: number;
	risk_band: string;
	impact_type: string;
	confidence: { level: string };
}

const RISK_COLORS: Record<string, string> = {
	very_low: '#10b981',
	low: '#22c55e',
	moderate: '#f59e0b',
	high: '#f97316',
	very_high: '#f43f5e'
};

const RISK_LABELS: Record<string, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High'
};

const IMPACT_LABELS: Record<string, string> = {
	ai_leveraged: 'AI Leveraged',
	at_risk: 'At Risk',
	stable: 'Stable',
	mixed: 'Mixed'
};

// Satori uses React-like createElement format:
// { type: string, props: { children: ..., style: ... } }
function h(type: string, props: Record<string, any>, ...children: any[]) {
	const flatChildren = children.flat().filter(Boolean);
	return {
		type,
		props: {
			...props,
			children: flatChildren.length === 1 ? flatChildren[0] : flatChildren
		}
	};
}

function buildMarkup(occ: Occupation) {
	const riskColor = RISK_COLORS[occ.risk_band] ?? '#6b7280';
	const riskLabel = RISK_LABELS[occ.risk_band] ?? occ.risk_band;
	const impactLabel = IMPACT_LABELS[occ.impact_type] ?? occ.impact_type;
	const riskPct = Math.round(occ.net_risk * 100);
	const wage = `SGD ${occ.gross_wage_median.toLocaleString()}/mo`;
	const title = occ.title.length > 45 ? occ.title.substring(0, 42) + '...' : occ.title;

	return h(
		'div',
		{
			style: {
				width: '1200px',
				height: '630px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: '60px',
				background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
				color: 'white',
				fontFamily: 'Inter'
			}
		},
		// Top row: branding + confidence
		h(
			'div',
			{
				style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
			},
			h(
				'div',
				{ style: { fontSize: '22px', color: '#94a3b8', letterSpacing: '0.1em' } },
				'SG AI JOBS'
			),
			h(
				'div',
				{ style: { fontSize: '18px', color: '#64748b' } },
				`Confidence: ${occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)}`
			)
		),
		// Middle: title + risk badge
		h(
			'div',
			{ style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
			h(
				'div',
				{
					style: { fontSize: '52px', fontWeight: 700, lineHeight: 1.1, maxWidth: '900px' }
				},
				title
			),
			h(
				'div',
				{ style: { display: 'flex', alignItems: 'center', gap: '20px' } },
				h(
					'div',
					{
						style: {
							background: riskColor,
							borderRadius: '12px',
							padding: '10px 24px',
							fontSize: '24px',
							fontWeight: 700
						}
					},
					`${riskLabel} Risk`
				),
				h(
					'div',
					{
						style: { fontSize: '40px', fontWeight: 700, color: riskColor }
					},
					`${riskPct}%`
				)
			)
		),
		// Bottom: details + URL
		h(
			'div',
			{
				style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }
			},
			h(
				'div',
				{ style: { display: 'flex', gap: '40px', fontSize: '22px', color: '#94a3b8' } },
				h('div', {}, impactLabel),
				h('div', {}, wage)
			),
			h('div', { style: { fontSize: '18px', color: '#475569' } }, 'sg-ai-jobs.vercel.app')
		)
	);
}

// --- Synthetic role OG markup ---
interface SyntheticRoleOG {
	slug: string;
	title: string;
	net_risk: number;
	risk_band: string;
	impact_type: string;
	components: number;
}

function buildRoleMarkup(role: SyntheticRoleOG) {
	const riskColor = RISK_COLORS[role.risk_band] ?? '#6b7280';
	const riskLabel = RISK_LABELS[role.risk_band] ?? role.risk_band;
	const impactLabel = IMPACT_LABELS[role.impact_type] ?? role.impact_type;
	const riskPct = Math.round(role.net_risk * 100);
	const title = role.title.length > 45 ? role.title.substring(0, 42) + '...' : role.title;

	return h(
		'div',
		{
			style: {
				width: '1200px',
				height: '630px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: '60px',
				background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
				color: 'white',
				fontFamily: 'Inter'
			}
		},
		h(
			'div',
			{
				style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
			},
			h(
				'div',
				{ style: { fontSize: '22px', color: '#a5b4fc', letterSpacing: '0.1em' } },
				'SG AI JOBS'
			),
			h(
				'div',
				{
					style: {
						fontSize: '16px',
						color: '#818cf8',
						background: '#312e81',
						borderRadius: '8px',
						padding: '6px 16px'
					}
				},
				'Modern Role Estimate'
			)
		),
		h(
			'div',
			{ style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
			h(
				'div',
				{
					style: { fontSize: '52px', fontWeight: 700, lineHeight: 1.1, maxWidth: '900px' }
				},
				title
			),
			h(
				'div',
				{ style: { display: 'flex', alignItems: 'center', gap: '20px' } },
				h(
					'div',
					{
						style: {
							background: riskColor,
							borderRadius: '12px',
							padding: '10px 24px',
							fontSize: '24px',
							fontWeight: 700
						}
					},
					`${riskLabel} Risk`
				),
				h(
					'div',
					{
						style: { fontSize: '40px', fontWeight: 700, color: riskColor }
					},
					`${riskPct}%`
				)
			)
		),
		h(
			'div',
			{
				style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }
			},
			h(
				'div',
				{ style: { display: 'flex', gap: '40px', fontSize: '22px', color: '#a5b4fc' } },
				h('div', {}, impactLabel),
				h('div', {}, `Based on ${role.components} official occupations`)
			),
			h('div', { style: { fontSize: '18px', color: '#6366f1' } }, 'sg-ai-jobs.vercel.app')
		)
	);
}

async function main() {
	console.log('=== Generating OG Images ===\n');

	const occupations: Occupation[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
	console.log(`Loaded ${occupations.length} occupations`);

	const fontData = fs.readFileSync(FONT_FILE);
	console.log(`Loaded font: Inter (${(fontData.length / 1024).toFixed(0)}KB)`);

	fs.mkdirSync(OUT_DIR, { recursive: true });

	let generated = 0;
	let errors = 0;

	// Generate occupation OG images
	for (const occ of occupations) {
		try {
			const markup = buildMarkup(occ);

			const svg = await satori(markup as any, {
				width: 1200,
				height: 630,
				fonts: [
					{
						name: 'Inter',
						data: fontData,
						weight: 500,
						style: 'normal' as const
					}
				]
			});

			const resvg = new Resvg(svg, {
				fitTo: { mode: 'width' as const, value: 1200 }
			});
			const pngData = resvg.render();
			const pngBuffer = pngData.asPng();

			fs.writeFileSync(path.join(OUT_DIR, `${occ.ssoc}.png`), pngBuffer);
			generated++;

			if (generated % 100 === 0) {
				console.log(`  Generated ${generated}/${occupations.length}...`);
			}
		} catch (err: any) {
			if (errors < 3) console.log(`  Error for ${occ.ssoc} (${occ.title}): ${err.message}`);
			errors++;
		}
	}

	console.log(`\nOccupations: ${generated} images, ${errors} errors`);

	// Generate synthetic role OG images
	try {
		const { syntheticRoles, computeRoleScores } = await import('../src/lib/data/synthetic-roles');
		const { occupationsBySSoc } = await import('../src/lib/data/index');

		let roleGenerated = 0;
		let roleErrors = 0;

		for (const role of syntheticRoles) {
			try {
				const scored = computeRoleScores(role, occupationsBySSoc);
				const roleData: SyntheticRoleOG = {
					slug: scored.slug,
					title: scored.title,
					net_risk: scored.net_risk,
					risk_band: scored.risk_band,
					impact_type: scored.impact_type,
					components: scored.components.length
				};

				const markup = buildRoleMarkup(roleData);
				const svg = await satori(markup as any, {
					width: 1200,
					height: 630,
					fonts: [
						{
							name: 'Inter',
							data: fontData,
							weight: 500,
							style: 'normal' as const
						}
					]
				});

				const resvg = new Resvg(svg, {
					fitTo: { mode: 'width' as const, value: 1200 }
				});
				const pngData = resvg.render();
				const pngBuffer = pngData.asPng();

				fs.writeFileSync(path.join(OUT_DIR, `role-${scored.slug}.png`), pngBuffer);
				roleGenerated++;
			} catch (err: any) {
				if (roleErrors < 3) console.log(`  Error for role ${role.slug}: ${err.message}`);
				roleErrors++;
			}
		}

		console.log(`Roles: ${roleGenerated} images, ${roleErrors} errors`);
		generated += roleGenerated;
		errors += roleErrors;
	} catch (err: any) {
		console.log(`Could not generate role OG images: ${err.message}`);
	}

	const totalSize = fs
		.readdirSync(OUT_DIR)
		.filter(f => f.endsWith('.png'))
		.reduce((sum, f) => sum + fs.statSync(path.join(OUT_DIR, f)).size, 0);

	console.log(`\nDone: ${generated} images generated, ${errors} errors`);
	console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
	console.log(`Output: ${OUT_DIR}`);
}

main().catch(console.error);
