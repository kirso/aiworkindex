import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(
			o =>
				typeof o.evidence.exposure_source_pctiles?.aioe === 'number' &&
				typeof o.evidence.exposure_source_pctiles?.anthropic === 'number'
		)
		.sort((a, b) => {
			const aGap =
				(a.evidence.exposure_source_pctiles?.anthropic ?? 0) -
				(a.evidence.exposure_source_pctiles?.aioe ?? 0);
			const bGap =
				(b.evidence.exposure_source_pctiles?.anthropic ?? 0) -
				(b.evidence.exposure_source_pctiles?.aioe ?? 0);
			return Math.abs(bGap) - Math.abs(aGap);
		})
		.slice(0, 25);
	return { ranked };
};
