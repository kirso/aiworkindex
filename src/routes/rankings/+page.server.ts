import {
	directWageGradient2To4,
	directWageNotOrMinimallyExposed,
	mappingUncertaintyRanking,
	namedDemandRanking,
	officialGradient4,
	pressureRanking
} from './ranking-data.server';
import { takePressureWithCutoffTies } from '$lib/data/v9-display';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	previews: {
		pressure: takePressureWithCutoffTies(pressureRanking, 5),
		demand: namedDemandRanking.slice(0, 5),
		wagePressure: directWageGradient2To4.slice(0, 5)
	},
	counts: {
		pressure: pressureRanking.length,
		officialGradient4: officialGradient4.length,
		demand: namedDemandRanking.length,
		wagePressure: directWageGradient2To4.length,
		lowerCategoryWages: directWageNotOrMinimallyExposed.length,
		mappingUncertainty: mappingUncertaintyRanking.length
	}
});
