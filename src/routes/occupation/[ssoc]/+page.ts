import { occupations, occupationsBySSoc } from '$lib/data';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const occupation = occupationsBySSoc.get(params.ssoc);
	if (!occupation) {
		error(404, 'Occupation not found');
	}

	// Find 5 similar occupations by net_risk proximity
	const similar = occupations
		.filter((o) => o.ssoc !== occupation.ssoc)
		.map((o) => ({ occ: o, dist: Math.abs(o.net_risk - occupation.net_risk) }))
		.sort((a, b) => a.dist - b.dist)
		.slice(0, 5)
		.map((s) => s.occ);

	return {
		occupation,
		similar
	};
};

export function entries() {
	return occupations.map((o) => ({ ssoc: o.ssoc }));
}
