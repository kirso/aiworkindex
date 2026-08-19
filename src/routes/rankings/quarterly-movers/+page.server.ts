import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ status: 'unavailable' as const });
