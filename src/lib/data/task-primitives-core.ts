import { clamp01 } from './methodology-core';

export interface TaskPrimitiveScores {
	matched_task_weight_share: number | null;
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	method: 'anthropic_task_penetration_v1' | null;
}

export interface WeightedTaskPenetration {
	weight: number;
	penetration: number | null;
}

export function normalizeTaskText(task: string): string {
	return task
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/[.!?,;:]+$/g, '');
}

export function minMaxNormalize(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return 0;
	if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 1;
	return clamp01((value - min) / (max - min));
}

export function computeTaskPrimitiveScores(
	tasks: WeightedTaskPenetration[]
): TaskPrimitiveScores {
	const validTasks = tasks.filter((task) => Number.isFinite(task.weight) && task.weight > 0);
	if (validTasks.length === 0) {
		return {
			matched_task_weight_share: null,
			task_effective_coverage: null,
			task_exposure_concentration: null,
			method: null
		};
	}

	const totalWeight = validTasks.reduce((sum, task) => sum + task.weight, 0);
	const matchedTasks = validTasks.filter((task) => task.penetration !== null);
	const matchedTaskWeight = matchedTasks.reduce((sum, task) => sum + task.weight, 0);

	if (matchedTaskWeight <= 0 || totalWeight <= 0) {
		return {
			matched_task_weight_share: null,
			task_effective_coverage: null,
			task_exposure_concentration: null,
			method: null
		};
	}

	const effectiveCoverage = matchedTasks.reduce(
		(sum, task) => sum + task.weight * (task.penetration ?? 0),
		0
	);
	const concentration =
		effectiveCoverage > 0
			? matchedTasks.reduce((sum, task) => {
					const contribution = (task.weight * (task.penetration ?? 0)) / effectiveCoverage;
					return sum + contribution * contribution;
				}, 0)
			: 0;

	return {
		matched_task_weight_share: clamp01(matchedTaskWeight / totalWeight),
		task_effective_coverage: clamp01(effectiveCoverage),
		task_exposure_concentration: clamp01(concentration),
		method: 'anthropic_task_penetration_v1'
	};
}
