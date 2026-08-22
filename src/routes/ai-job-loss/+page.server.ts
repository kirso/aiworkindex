import { v9Counts } from '$lib/data/v9';
import { takePressureWithCutoffTies } from '$lib/data/v9-display';
import { pressureRanking } from '../rankings/ranking-data.server';
import type { PageServerLoad } from './$types';

export const prerender = true;
export const csr = false;

export const load: PageServerLoad = () => {
	const ranked = takePressureWithCutoffTies(pressureRanking, 50);

	return { ranked, counts: v9Counts };
};
