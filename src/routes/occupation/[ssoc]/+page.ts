import { occupations, occupationsBySSoc, occupationsByGroup } from '$lib/data';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const occupation = occupationsBySSoc.get(params.ssoc);
	if (!occupation) {
		error(404, 'Occupation not found');
	}

	// Compute group average scores
	const groupOccs = occupationsByGroup.get(occupation.major_group) ?? [];
	const groupAverage = {
		aioe: groupOccs.reduce((s, o) => s + o.scores.aioe, 0) / groupOccs.length,
		theta: groupOccs.reduce((s, o) => s + o.scores.theta, 0) / groupOccs.length,
		c_aioe: groupOccs.reduce((s, o) => s + o.scores.c_aioe, 0) / groupOccs.length
	};

	// Find 5 similar occupations by SSOC proximity
	const ssocNum = parseInt(occupation.ssoc);
	const similar = occupations
		.filter((o) => o.ssoc !== occupation.ssoc)
		.map((o) => ({ occ: o, dist: Math.abs(parseInt(o.ssoc) - ssocNum) }))
		.sort((a, b) => a.dist - b.dist)
		.slice(0, 5)
		.map((s) => s.occ);

	return {
		occupation,
		groupAverage,
		similar
	};
};

export function entries() {
	return occupations.map((o) => ({ ssoc: o.ssoc }));
}
