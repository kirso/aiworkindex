import { occupations, occupationsBySSoc } from '$lib/data';
import { buildOccupationDetailStructural } from '$lib/data/detail-structural';
import { buildOccupationDetailContext } from '$lib/data/detail-context';
import { lookupExitQuadrant } from '$lib/data/exit-quadrant';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const occupation = occupationsBySSoc.get(params.ssoc);
	if (!occupation) {
		error(404, 'Occupation not found');
	}

	const structural = buildOccupationDetailStructural(occupation, occupations);
	const context = buildOccupationDetailContext(occupation);

	return {
		occupation,
		structural,
		context,
		exitQuadrant: lookupExitQuadrant(occupation.ssoc)
	};
};

export function entries() {
	return occupations.map(o => ({ ssoc: o.ssoc }));
}
