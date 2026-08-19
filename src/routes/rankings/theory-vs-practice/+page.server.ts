import { mappingUncertaintyRanking, taskDispersionRanking } from '../ranking-data.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	mappingUncertainty: mappingUncertaintyRanking.slice(0, 30),
	taskDispersion: taskDispersionRanking.slice(0, 30)
});
