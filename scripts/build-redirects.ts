#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REDIRECTS_FILE = path.join(ROOT, 'static', '_redirects');
const ROLE_FILE = path.join(ROOT, 'data', 'synthetic-roles-v9.json');
const START = '# BEGIN GENERATED V9 CANONICAL REDIRECTS';
const END = '# END GENERATED V9 CANONICAL REDIRECTS';

interface RoleRelease {
	roles: Array<{
		slug: string;
		resolution_basis: string;
		official_status: 'official_occupation_match' | 'non_official_role_query';
		official_occupation: { ssoc2024: string } | null;
	}>;
}

function main() {
	const source = fs.readFileSync(REDIRECTS_FILE, 'utf8');
	if (!source.includes(START) || !source.includes(END)) {
		throw new Error('static/_redirects is missing the generated V9 redirect markers');
	}
	const roleRelease = JSON.parse(fs.readFileSync(ROLE_FILE, 'utf8')) as RoleRelease;
	const roleRedirects = roleRelease.roles
		.filter(
			(role): role is typeof role & { official_occupation: { ssoc2024: string } } =>
				role.resolution_basis === 'normalized_exact_title' &&
				role.official_status === 'official_occupation_match' &&
				role.official_occupation !== null
		)
		.map(role => `/role/${role.slug} /occupation/${role.official_occupation.ssoc2024} 308`)
		.sort();
	const lines = ['/calculator /will-ai-take-my-job 308', ...roleRedirects];
	if (new Set(lines.map(line => line.split(' ')[0])).size !== lines.length) {
		throw new Error('Generated V9 redirects contain a duplicate source path');
	}
	const block = `${START}\n${lines.join('\n')}\n${END}`;
	const updated = source.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
	fs.writeFileSync(REDIRECTS_FILE, updated.endsWith('\n') ? updated : `${updated}\n`);
	console.log(`Redirects generated: ${lines.length} V9 canonical redirects`);
}

main();
