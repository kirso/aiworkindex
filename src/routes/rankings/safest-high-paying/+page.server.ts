import { directWageNotOrMinimallyExposed } from '../ranking-data.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	ranked: directWageNotOrMinimallyExposed.slice(0, 50)
});
