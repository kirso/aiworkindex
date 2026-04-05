/**
 * Generate LinkedIn carousel PDF with screenshots of the AI Work Index.
 * Requires: bun add -d puppeteer
 * Run: bun run scripts/generate-carousel.ts
 */

import puppeteer from 'puppeteer';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const OUT_DIR = join(import.meta.dir, '..', 'carousel-screenshots');
const BASE_URL = 'http://localhost:5174';
const VIEWPORT = { width: 1280, height: 720, deviceScaleFactor: 2 };

const slides = [
	{ url: '/', name: '01-homepage', waitFor: 1000 },
	{ url: '/occupation/25121', name: '02-software-developer', waitFor: 1000 },
	{ url: '/occupation/25241', name: '03-cyber-risk-specialist', waitFor: 1000 },
	{ url: '/roles', name: '04-modern-roles', waitFor: 1000 },
	{ url: '/compare?entities=occupation:25121,occupation:41320', name: '05-compare', waitFor: 1500 },
	{ url: '/rankings', name: '06-rankings', waitFor: 1000 },
	{ url: '/reports', name: '07-reports', waitFor: 1000 },
	{ url: '/calculator', name: '08-calculator', waitFor: 1000 }
];

async function main() {
	if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

	console.log('Launching browser...');
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.setViewport(VIEWPORT);

	const screenshotPaths: string[] = [];

	for (const slide of slides) {
		const url = `${BASE_URL}${slide.url}`;
		console.log(`Capturing ${slide.name} → ${url}`);
		await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
		await new Promise(r => setTimeout(r, slide.waitFor));

		const path = join(OUT_DIR, `${slide.name}.png`);
		await page.screenshot({ path, fullPage: false });
		screenshotPaths.push(path);
		console.log(`  Saved → ${path}`);
	}

	// Generate PDF from screenshots
	const pdfPath = join(OUT_DIR, 'ai-work-index-carousel.pdf');
	console.log(`\nGenerating PDF → ${pdfPath}`);

	// Create a page that displays each screenshot as a slide
	const htmlSlides = screenshotPaths
		.map(
			p => `
		<div style="page-break-after: always; width: 1280px; height: 720px; display: flex; align-items: center; justify-content: center; background: white;">
			<img src="file://${p}" style="width: 1280px; height: 720px; object-fit: contain;" />
		</div>`
		)
		.join('\n');

	await page.setContent(`<html><body style="margin:0;padding:0;">${htmlSlides}</body></html>`, {
		waitUntil: 'networkidle2'
	});

	await page.pdf({
		path: pdfPath,
		width: '1280px',
		height: '720px',
		printBackground: true,
		margin: { top: 0, right: 0, bottom: 0, left: 0 }
	});

	console.log(`\nDone! PDF saved to: ${pdfPath}`);
	console.log(`Screenshots saved to: ${OUT_DIR}/`);

	await browser.close();
}

main().catch(console.error);
