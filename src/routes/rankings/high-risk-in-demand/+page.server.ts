import { namedDemandRanking } from '../ranking-data.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ ranked: namedDemandRanking });
