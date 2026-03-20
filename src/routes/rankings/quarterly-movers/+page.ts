import { occupationsBySSoc } from '$lib/data';
import { quarterlyReport } from '$lib/data/quarterly-report';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const risers = quarterlyReport.top_risers
		.map(entry => ({
			...entry,
			occupation: occupationsBySSoc.get(entry.ssoc) ?? null
		}))
		.filter(entry => entry.occupation !== null);

	const fallers = quarterlyReport.top_fallers
		.map(entry => ({
			...entry,
			occupation: occupationsBySSoc.get(entry.ssoc) ?? null
		}))
		.filter(entry => entry.occupation !== null);

	return {
		report: quarterlyReport,
		risers,
		fallers
	};
};
