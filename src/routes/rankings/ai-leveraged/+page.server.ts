import { officialGradient4 } from '../ranking-data.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ ranked: officialGradient4 });
