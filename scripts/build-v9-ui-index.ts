#!/usr/bin/env bun

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildV9CheckerEntries, buildV9CompareEntities } from '../src/lib/data/v9-ui.server';
import { syntheticRolesV9 } from '../src/lib/data/synthetic-roles-v9';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const queryAliases = Object.fromEntries(
	syntheticRolesV9
		.filter(
			role => role.official_status === 'official_occupation_match' && role.official_occupation
		)
		.map(role => [`role:${role.slug}`, `occupation:${role.official_occupation!.ssoc2024}`])
);
const output = {
	schema_version: '9.0',
	generated_at: '2026-08-19',
	query_aliases: queryAliases,
	checker_entries: buildV9CheckerEntries(),
	compare_entities: buildV9CompareEntities()
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;

for (const file of [
	path.join(ROOT, 'data', 'v9-ui-index.json'),
	path.join(ROOT, 'src', 'lib', 'data', 'v9-ui-index.json'),
	path.join(ROOT, 'static', 'data', 'v9-ui-index.json')
]) {
	fs.writeFileSync(file, serialized);
}

console.log(
	`V9 UI index: ${output.checker_entries.length} checker entries, ${output.compare_entities.length} compare entities`
);
