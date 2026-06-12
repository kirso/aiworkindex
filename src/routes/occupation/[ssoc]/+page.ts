import { occupations, occupationsBySSoc } from '$lib/data';
import { buildOccupationDetailStructural } from '$lib/data/detail-structural';
import { buildOccupationDetailContext } from '$lib/data/detail-context';
import { lookupExitQuadrant } from '$lib/data/exit-quadrant';
import taskExposureDetail from '$lib/data/task-exposure-detail.json';
import bottleneckChannels from '$lib/data/bottleneck-channels.json';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

type TaskDetailEntry = {
	matched_task_count: number;
	observed_task_count: number;
	most_observed: Array<{ task: string; weight_share: number; penetration: number | null }>;
	most_protected: Array<{ task: string; weight_share: number; penetration: number | null }>;
};
type ChannelEntry = {
	channels: Record<string, number>;
	top_channels: Array<{ key: string; label: string }>;
};

export const load: PageLoad = ({ params }) => {
	const occupation = occupationsBySSoc.get(params.ssoc);
	if (!occupation) {
		error(404, 'Occupation not found');
	}

	const structural = buildOccupationDetailStructural(occupation, occupations);
	const context = buildOccupationDetailContext(occupation);

	return {
		occupation,
		structural,
		context,
		exitQuadrant: lookupExitQuadrant(occupation.ssoc),
		taskDetail:
			(taskExposureDetail.entries as Record<string, TaskDetailEntry>)[occupation.ssoc] ?? null,
		channelInfo:
			(bottleneckChannels.entries as Record<string, ChannelEntry>)[occupation.ssoc] ?? null
	};
};

export function entries() {
	return occupations.map(o => ({ ssoc: o.ssoc }));
}
