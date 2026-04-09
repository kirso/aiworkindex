import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { getHomeSurface, homeSurfaceChoices, resolveHomeSurfaceCode } from '$lib/data/home-surface';

export const load: PageLoad = ({ url }) => {
	const surfaceParam = browser ? url.searchParams.get('surface') : null;
	const selectedSurface = resolveHomeSurfaceCode(surfaceParam);
	const surface = getHomeSurface(selectedSurface);

	return {
		surface,
		occupations: surface.occupations,
		surfaceChoices: homeSurfaceChoices
	};
};
