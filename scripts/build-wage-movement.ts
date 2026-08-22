#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(import.meta.dir, '..');
const wageFile = path.join(ROOT, 'data/raw/median_income_by_occupation.csv');
const cpiFile = path.join(ROOT, 'data/raw/cpi-monthly.json');

function parseCsv(line: string): string[] {
	const fields: string[] = [];
	let value = '';
	let quoted = false;
	for (const char of line) {
		if (char === '"') quoted = !quoted;
		else if (char === ',' && !quoted) {
			fields.push(value);
			value = '';
		} else value += char;
	}
	fields.push(value);
	return fields;
}
const lines = fs.readFileSync(wageFile, 'utf8').trim().split('\n');
const header = parseCsv(lines[0]!);
const cpiResponse = JSON.parse(fs.readFileSync(cpiFile, 'utf8'));
const allItems = cpiResponse.result.records.find(
	(row: { DataSeries: string }) => row.DataSeries === 'All Items'
);
if (!allItems) throw new Error('All Items CPI series missing');

function annualCpi(year: number): number {
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	const values = months.map(month => Number(allItems[`${year}${month}`])).filter(Number.isFinite);
	if (values.length !== 12) throw new Error(`CPI ${year} does not contain 12 months`);
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function round(value: number, digits = 2) {
	const p = 10 ** digits;
	return Math.round(value * p) / p;
}

const latestYear = 2023;
const horizons = [1, 3, 5];
const series = lines.slice(1).map(line => {
	const fields = parseCsv(line);
	const match = fields[0]!.match(/^(.*) - (Male|Female)$/);
	if (!match) throw new Error(`Unexpected wage series: ${fields[0]}`);
	const latest = Number(fields[header.indexOf(String(latestYear))]);
	return {
		major_group_label: match[1],
		sex: match[2].toLowerCase(),
		latest_year: latestYear,
		latest_median_monthly_income_sgd: latest,
		movement: Object.fromEntries(
			horizons.map(years => {
				const priorYear = latestYear - years;
				const prior = Number(fields[header.indexOf(String(priorYear))]);
				const nominal = latest / prior - 1;
				const real = latest / prior / (annualCpi(latestYear) / annualCpi(priorYear)) - 1;
				return [
					`${years}y`,
					{
						from_year: priorYear,
						nominal_change_pct: round(nominal * 100),
						real_change_pct: round(real * 100)
					}
				];
			})
		)
	};
});

const output = {
	schema_version: '1.0',
	data_as_of: String(latestYear),
	construct: 'broad_group_wage_movement',
	score_input: false,
	sources: [
		{
			title: 'Median Gross Monthly Income From Employment by Occupation and Sex',
			publisher: 'Singapore Ministry of Manpower',
			file: 'data/raw/median_income_by_occupation.csv'
		},
		{
			title: 'Consumer Price Index, Monthly',
			publisher: 'Singapore Department of Statistics',
			url: 'https://data.gov.sg/collections/1630/view',
			file: 'data/raw/cpi-monthly.json'
		}
	],
	cpi: {
		series: 'All Items',
		annual_average_2018: round(annualCpi(2018), 3),
		annual_average_2023: round(annualCpi(2023), 3)
	},
	series,
	limitations: [
		'Published series are sex-specific medians; male and female medians are not averaged into a combined occupation-group median.',
		'Real movement deflates nominal income with annual-average All Items CPI.',
		'Broad occupation-group movement is context, not a detailed occupation outcome or an AI effect.'
	]
};
for (const file of [
	'data/wage-movement.json',
	'src/lib/data/wage-movement.json',
	'static/data/wage-movement.json'
]) {
	const target = path.join(ROOT, file);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
}
console.log(`Built ${series.length} sex-specific wage movement series.`);
