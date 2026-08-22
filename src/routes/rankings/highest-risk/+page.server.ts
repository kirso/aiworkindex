import { pressureRanking } from '../ranking-data.server';
import { takePressureWithCutoffTies } from '$lib/data/v9-display';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	ranked: takePressureWithCutoffTies(pressureRanking, 50)
});
