#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4174';
const screenshotDir = process.argv[3] ?? '/tmp/ai-work-index-v9-qa';
const executablePath =
	process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cases = [
	{ path: '/', width: 320, height: 900 },
	{ path: '/', width: 1440, height: 1000, screenshot: 'home-desktop.png' },
	{ path: '/explore', width: 375, height: 900 },
	{ path: '/explore', width: 1440, height: 1000, screenshot: 'explore-desktop.png' },
	{ path: '/reports/labour-observatory', width: 320, height: 900 },
	{
		path: '/reports/labour-observatory',
		width: 375,
		height: 900,
		screenshot: 'observatory-mobile.png'
	},
	{ path: '/reports/labour-observatory', width: 768, height: 1024 },
	{ path: '/reports/labour-observatory', width: 1024, height: 900 },
	{
		path: '/reports/labour-observatory',
		width: 1440,
		height: 1000,
		screenshot: 'observatory-desktop.png'
	},
	{ path: '/reports/ai-capabilities', width: 320, height: 900 },
	{ path: '/reports/ai-capabilities', width: 768, height: 1024 },
	{
		path: '/reports/ai-capabilities',
		width: 1440,
		height: 1000,
		screenshot: 'capabilities-desktop.png'
	},
	{
		path: '/reports/research-signals',
		width: 375,
		height: 900,
		screenshot: 'research-signals-mobile.png'
	},
	{
		path: '/reports/evidence-patterns',
		width: 320,
		height: 900,
		screenshot: 'evidence-patterns-mobile.png'
	},
	{
		path: '/reports/evidence-patterns',
		width: 1440,
		height: 1000,
		screenshot: 'evidence-patterns-desktop.png'
	},
	{ path: '/reports/skills-pilot', width: 320, height: 900 },
	{ path: '/reports', width: 320, height: 900 },
	{ path: '/methodology', width: 320, height: 900 },
	{ path: '/methodology/appendix', width: 320, height: 900 },
	{ path: '/data', width: 320, height: 900 },
	{ path: '/roles', width: 320, height: 900 },
	{ path: '/rankings', width: 320, height: 900 },
	{ path: '/rankings/highest-risk', width: 320, height: 900 },
	{
		path: '/reports/research-signals',
		width: 1440,
		height: 1000,
		screenshot: 'research-signals-desktop.png'
	},
	{
		path: '/occupation/12222',
		width: 375,
		height: 900,
		screenshot: 'capability-occupation-mobile.png'
	},
	{
		path: '/occupation/12222',
		width: 1440,
		height: 1000,
		screenshot: 'capability-occupation-desktop.png'
	},
	{ path: '/occupation/25143', width: 375, height: 900, screenshot: 'occupation-mobile.png' },
	{ path: '/occupation/25143', width: 1440, height: 1000, screenshot: 'occupation-desktop.png' },
	{
		path: '/occupation/24314?as=seo-specialist',
		width: 375,
		height: 900,
		expectedH1: 'SEO Specialist'
	},
	{ path: '/occupation/14391', width: 375, height: 900 },
	{ path: '/occupation/61110', width: 375, height: 900 },
	{ path: '/role/ai-engineer', width: 375, height: 900 },
	{ path: '/role/ai-engineer', width: 1440, height: 1000 },
	{ path: '/role/ai-product-manager', width: 320, height: 900 },
	{ path: '/compare?entities=occupation:12222,occupation:21661', width: 375, height: 900 },
	{ path: '/compare?entities=occupation:12222,occupation:21661', width: 1440, height: 1000 },
	{ path: '/will-ai-take-my-job?job=occupation%3A12222', width: 375, height: 900 },
	{ path: '/will-ai-take-my-job?job=occupation%3A12222', width: 1440, height: 1000 }
];

fs.mkdirSync(screenshotDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, executablePath });
const results = [];
const interactionResults = [];

try {
	for (const testCase of cases) {
		const page = await browser.newPage();
		const consoleErrors = [];
		const pageErrors = [];
		page.on('console', message => {
			if (message.type() === 'error') consoleErrors.push(message.text());
		});
		page.on('pageerror', error => pageErrors.push(error.message));
		await page.setViewport({ width: testCase.width, height: testCase.height });
		await page.setCacheEnabled(false);
		const response = await page.goto(`${baseUrl}${testCase.path}`, {
			waitUntil: 'networkidle0',
			timeout: 30_000
		});
		const audit = await page.evaluate(() => {
			const overflow = [...document.querySelectorAll('body *')]
				.filter(element => {
					const rect = element.getBoundingClientRect();
					const style = getComputedStyle(element);
					return (
						style.position !== 'fixed' &&
						rect.width > 0 &&
						(rect.right > window.innerWidth + 1 || rect.left < -1)
					);
				})
				.slice(0, 8)
				.map(element => ({
					tag: element.tagName.toLowerCase(),
					className: typeof element.className === 'string' ? element.className.slice(0, 100) : '',
					text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90) ?? '',
					right: Math.round(element.getBoundingClientRect().right)
				}));
			const brokenImages = [...document.images]
				.filter(image => image.complete && image.naturalWidth === 0)
				.map(image => image.currentSrc || image.src);
			const duplicateIds = [...document.querySelectorAll('[id]')]
				.map(element => element.id)
				.filter((id, index, ids) => id && ids.indexOf(id) !== index);
			const unnamedControls = [...document.querySelectorAll('button, input, select, textarea')]
				.filter(element => {
					const labelledBy = element.getAttribute('aria-labelledby');
					const hasLabelledBy = labelledBy
						?.split(/\s+/)
						.some(id => document.getElementById(id)?.textContent?.trim());
					const id = element.getAttribute('id');
					const explicitLabel = id
						? document.querySelector(`label[for="${CSS.escape(id)}"]`)
						: null;
					const wrappingLabel = element.closest('label');
					return !(
						element.getAttribute('aria-label')?.trim() ||
						hasLabelledBy ||
						explicitLabel?.textContent?.trim() ||
						wrappingLabel?.textContent?.trim() ||
						element.textContent?.trim() ||
						element.getAttribute('title')?.trim()
					);
				})
				.slice(0, 8)
				.map(element => ({
					tag: element.tagName.toLowerCase(),
					type: element.getAttribute('type')
				}));
			const scrollingTables = [...document.querySelectorAll('table')]
				.filter(table => {
					const container = table.parentElement;
					return Boolean(container && container.scrollWidth > container.clientWidth + 1);
				})
				.map(
					table =>
						table.getAttribute('aria-label') ||
						table.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80)
				);
			return {
				title: document.title,
				h1: document.querySelector('h1')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
				mainCount: document.querySelectorAll('main').length,
				bodyScrollWidth: document.body.scrollWidth,
				viewportWidth: window.innerWidth,
				overflow,
				brokenImages,
				duplicateIds,
				unnamedControls,
				scrollingTables
			};
		});
		if (testCase.screenshot) {
			await page.screenshot({
				path: path.join(screenshotDir, testCase.screenshot),
				fullPage: true
			});
		}
		results.push({
			path: testCase.path,
			viewport: `${testCase.width}x${testCase.height}`,
			status: response?.status() ?? null,
			expectedH1: testCase.expectedH1 ?? null,
			...audit,
			consoleErrors,
			pageErrors,
			screenshot: testCase.screenshot ?? null
		});
		await page.close();
	}

	{
		const page = await browser.newPage();
		await page.setViewport({ width: 1440, height: 1000 });
		await page.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle0', timeout: 30_000 });
		await page.waitForSelector('[data-occupation-code]', { timeout: 15_000 });
		const code = await page.$eval('[data-occupation-code]', element =>
			element.getAttribute('data-occupation-code')
		);
		await page.click('[data-occupation-code]');
		await page.waitForFunction(
			expected => location.pathname === `/occupation/${expected}`,
			{},
			code
		);
		interactionResults.push({
			name: 'map opens occupation in one action',
			passed: true,
			detail: code
		});
		await page.close();
	}

	{
		const page = await browser.newPage();
		await page.setViewport({ width: 1440, height: 1000 });
		await page.goto(`${baseUrl}/explore`, { waitUntil: 'networkidle0', timeout: 30_000 });
		await page.waitForSelector('[data-occupation-code]', { timeout: 15_000 });
		for (const [label, value] of [
			['Pressure & pay', 'scatter'],
			['Named demand', 'demand'],
			['Distribution', 'distribution'],
			['List', 'list']
		]) {
			await page.evaluate(buttonLabel => {
				const button = [...document.querySelectorAll('button')].find(
					candidate => candidate.textContent?.trim() === buttonLabel
				);
				if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing view ${buttonLabel}`);
				button.click();
			}, label);
			await page.waitForFunction(
				expected => new URL(location.href).searchParams.get('view') === expected,
				{},
				value
			);
		}
		interactionResults.push({
			name: 'explorer views share URL state',
			passed: true,
			detail: new URL(page.url()).search
		});
		await page.close();
	}

	{
		const page = await browser.newPage();
		await page.setViewport({ width: 1440, height: 1000 });
		await page.goto(`${baseUrl}/explore?view=scatter`, {
			waitUntil: 'networkidle0',
			timeout: 30_000
		});
		const chart = 'button[aria-label^="Scatter plot"]';
		await page.waitForSelector(`${chart} [data-occupation-code]`, { timeout: 15_000 });
		await page.focus(chart);
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');
		await page.waitForFunction(() => location.pathname.startsWith('/occupation/'));
		interactionResults.push({
			name: 'scatter supports keyboard open',
			passed: true,
			detail: new URL(page.url()).pathname
		});
		await page.close();
	}
} finally {
	await browser.close();
}

const failures = results.filter(
	result =>
		result.status == null ||
		result.status < 200 ||
		result.status >= 400 ||
		!result.h1 ||
		(result.expectedH1 != null && result.h1 !== result.expectedH1) ||
		result.mainCount !== 1 ||
		result.bodyScrollWidth > result.viewportWidth + 1 ||
		result.overflow.length > 0 ||
		result.brokenImages.length > 0 ||
		result.duplicateIds.length > 0 ||
		result.unnamedControls.length > 0 ||
		result.scrollingTables.length > 0 ||
		result.consoleErrors.length > 0 ||
		result.pageErrors.length > 0
);
const interactionFailures = interactionResults.filter(result => !result.passed);

process.stdout.write(
	`${JSON.stringify({ baseUrl, screenshotDir, results, interactionResults, failureCount: failures.length + interactionFailures.length }, null, 2)}\n`
);
if (failures.length > 0 || interactionFailures.length > 0) process.exitCode = 1;
