import { clamp01 } from './methodology-core';
import { normalizeTaskText } from './task-primitives-core';
import type { WorkflowOverlay } from './workflow-overlay';

export type TaskMode = 'delegable' | 'copilot' | 'human_led';

export interface WeightedTaskModeInput {
	task: string;
	weight: number;
	penetration: number | null;
}

export interface TaskModeShares {
	delegable: number;
	copilot: number;
	human_led: number;
}

export interface TaskModeTaskSignals {
	mode_shares: TaskModeShares;
	success_proxy: number;
	autonomy_proxy: number;
	bottleneck_proxy: number;
}

export interface TaskModeSummary {
	matched_task_weight_share: number | null;
	task_mode_shares: TaskModeShares | null;
	task_mode_effective_coverage: number | null;
	task_mode_automation_pressure: number | null;
	task_mode_augmentation_upside: number | null;
	task_mode_exposure_signal: number | null;
	task_mode_concentration: number | null;
	demand_fragility: number | null;
	reallocation_capacity: number | null;
	method: 'task_mode_proxy_v5a' | null;
}

const MODE_PROXY_DEFAULTS = {
	delegable: {
		success: 0.88,
		autonomy: 0.84,
		bottleneck: 0.18
	},
	copilot: {
		success: 0.72,
		autonomy: 0.52,
		bottleneck: 0.52
	},
	human_led: {
		success: 0.42,
		autonomy: 0.16,
		bottleneck: 0.84
	}
} as const;

const DELEGABLE_PATTERNS = [
	/\b(record|records|recording|file|filing|sort|sorting|compile|compiling)\b/,
	/\b(process|processing|update|updating|maintain|maintaining)\b/,
	/\b(enter|entering|collect|collecting|schedule|scheduling)\b/,
	/\b(verify|verifying|calculate|calculating|count|counting)\b/,
	/\b(prepare|preparing)\b.*\b(report|reports|documents|schedules|forms)\b/
];

const COPILOT_PATTERNS = [
	/\b(analy[sz]e|analysis|assess|assessment|evaluate|evaluation|interpret)\b/,
	/\b(design|develop|research|draft|recommend|plan|create)\b/,
	/\b(model|optimi[sz]e|troubleshoot|diagnos[ei]|forecast)\b/,
	/\b(review|reviewing)\b.*\b(policy|strategy|performance|operations)\b/
];

const HUMAN_LED_PATTERNS = [
	/\b(teach|training|train|counsel|care|treat|mentor|coach)\b/,
	/\b(negotiat|advise|consult|interview|mediate|present|guide)\b/,
	/\b(supervis|lead|coordinate|liaise|communicat|collaborat)\b/,
	/\b(patient|patients|student|students|client|clients|vendor|vendors|stakeholder|stakeholders)\b/
];

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeShares(values: TaskModeShares): TaskModeShares {
	const total = values.delegable + values.copilot + values.human_led;
	if (total <= 0) {
		return { delegable: 1 / 3, copilot: 1 / 3, human_led: 1 / 3 };
	}
	return {
		delegable: values.delegable / total,
		copilot: values.copilot / total,
		human_led: values.human_led / total
	};
}

function countPatternHits(task: string, patterns: RegExp[]): number {
	return patterns.reduce((hits, pattern) => hits + (pattern.test(task) ? 1 : 0), 0);
}

function computeModePriors(workflowOverlay?: WorkflowOverlay): TaskModeShares {
	if (!workflowOverlay) {
		return { delegable: 0.34, copilot: 0.33, human_led: 0.33 };
	}

	const delegable = average([
		workflowOverlay.tool_velocity,
		1 - workflowOverlay.physical_presence,
		1 - workflowOverlay.relationship_intensity,
		1 - workflowOverlay.real_time_coordination,
		1 - workflowOverlay.regulatory_weight,
		1 - workflowOverlay.institutional_knowledge
	].map(clamp01));

	const copilot = average([
		workflowOverlay.creative_generation,
		workflowOverlay.ambiguity_tolerance,
		workflowOverlay.tool_velocity,
		1 - workflowOverlay.physical_presence,
		1 - workflowOverlay.real_time_coordination * 0.5
	].map(clamp01));

	const humanLed = average([
		workflowOverlay.real_time_coordination,
		workflowOverlay.relationship_intensity,
		workflowOverlay.regulatory_weight,
		workflowOverlay.physical_presence,
		workflowOverlay.institutional_knowledge
	].map(clamp01));

	return normalizeShares({
		delegable: 0.2 + delegable,
		copilot: 0.2 + copilot,
		human_led: 0.2 + humanLed
	});
}

export function inferTaskModeSignals(
	task: string,
	workflowOverlay?: WorkflowOverlay
): TaskModeTaskSignals {
	const normalizedTask = normalizeTaskText(task);
	const priors = computeModePriors(workflowOverlay);
	const delegableHits = countPatternHits(normalizedTask, DELEGABLE_PATTERNS);
	const copilotHits = countPatternHits(normalizedTask, COPILOT_PATTERNS);
	const humanLedHits = countPatternHits(normalizedTask, HUMAN_LED_PATTERNS);

	const rawShares = normalizeShares({
		delegable: Math.max(
			0.05,
			0.45 + priors.delegable + 0.48 * delegableHits + 0.08 * copilotHits - 0.06 * humanLedHits
		),
		copilot: Math.max(
			0.05,
			0.45 + priors.copilot + 0.44 * copilotHits + 0.1 * delegableHits + 0.08 * humanLedHits
		),
		human_led: Math.max(
			0.05,
			0.45 + priors.human_led + 0.5 * humanLedHits + 0.06 * copilotHits - 0.06 * delegableHits
		)
	});

	const successProxy = clamp01(
		rawShares.delegable * MODE_PROXY_DEFAULTS.delegable.success +
			rawShares.copilot * MODE_PROXY_DEFAULTS.copilot.success +
			rawShares.human_led * MODE_PROXY_DEFAULTS.human_led.success
	);
	const autonomyProxy = clamp01(
		rawShares.delegable * MODE_PROXY_DEFAULTS.delegable.autonomy +
			rawShares.copilot * MODE_PROXY_DEFAULTS.copilot.autonomy +
			rawShares.human_led * MODE_PROXY_DEFAULTS.human_led.autonomy
	);
	const bottleneckProxy = clamp01(
		rawShares.delegable * MODE_PROXY_DEFAULTS.delegable.bottleneck +
			rawShares.copilot * MODE_PROXY_DEFAULTS.copilot.bottleneck +
			rawShares.human_led * MODE_PROXY_DEFAULTS.human_led.bottleneck
	);

	return {
		mode_shares: rawShares,
		success_proxy: successProxy,
		autonomy_proxy: autonomyProxy,
		bottleneck_proxy: bottleneckProxy
	};
}

export function computeTaskModeSummary(
	tasks: WeightedTaskModeInput[],
	workflowOverlay?: WorkflowOverlay
): TaskModeSummary {
	const validTasks = tasks.filter(task => Number.isFinite(task.weight) && task.weight > 0);
	if (validTasks.length === 0) {
		return {
			matched_task_weight_share: null,
			task_mode_shares: null,
			task_mode_effective_coverage: null,
			task_mode_automation_pressure: null,
			task_mode_augmentation_upside: null,
			task_mode_exposure_signal: null,
			task_mode_concentration: null,
			demand_fragility: null,
			reallocation_capacity: null,
			method: null
		};
	}

	const totalWeight = validTasks.reduce((sum, task) => sum + task.weight, 0);
	const matchedTasks = validTasks.filter(
		task => task.penetration !== null && Number.isFinite(task.penetration)
	);
	const matchedWeight = matchedTasks.reduce((sum, task) => sum + task.weight, 0);

	if (matchedWeight <= 0 || totalWeight <= 0) {
		return {
			matched_task_weight_share: null,
			task_mode_shares: null,
			task_mode_effective_coverage: null,
			task_mode_automation_pressure: null,
			task_mode_augmentation_upside: null,
			task_mode_exposure_signal: null,
			task_mode_concentration: null,
			demand_fragility: null,
			reallocation_capacity: null,
			method: null
		};
	}

	let effectiveCoverage = 0;
	let automationPressure = 0;
	let augmentationUpside = 0;
	let concentrationAccumulator = 0;
	let delegableContribution = 0;
	let copilotContribution = 0;
	let humanLedContribution = 0;

	const contributions = matchedTasks.map(task => {
		const penetration = clamp01(task.penetration ?? 0);
		const signals = inferTaskModeSignals(task.task, workflowOverlay);
		const effectiveContribution = task.weight * penetration * signals.success_proxy;
		const automationContribution = effectiveContribution * signals.autonomy_proxy;
		const augmentationContribution =
			effectiveContribution * (1 - signals.autonomy_proxy) * signals.bottleneck_proxy;
		const modeContribution = task.weight * penetration;

		effectiveCoverage += effectiveContribution;
		automationPressure += automationContribution;
		augmentationUpside += augmentationContribution;
		delegableContribution += modeContribution * signals.mode_shares.delegable;
		copilotContribution += modeContribution * signals.mode_shares.copilot;
		humanLedContribution += modeContribution * signals.mode_shares.human_led;

		return effectiveContribution;
	});

	if (effectiveCoverage > 0) {
		for (const contribution of contributions) {
			const normalizedContribution = contribution / effectiveCoverage;
			concentrationAccumulator += normalizedContribution * normalizedContribution;
		}
	}

	const modeShares = normalizeShares({
		delegable: delegableContribution,
		copilot: copilotContribution,
		human_led: humanLedContribution
	});
	const taskModeConcentration = clamp01(concentrationAccumulator);
	const demandFragility = clamp01(
		effectiveCoverage * taskModeConcentration * (0.7 + 0.3 * modeShares.delegable)
	);
	const reallocationCapacity = clamp01(
		1 - taskModeConcentration * (0.85 + 0.15 * modeShares.delegable)
	);

	return {
		matched_task_weight_share: clamp01(matchedWeight / totalWeight),
		task_mode_shares: modeShares,
		task_mode_effective_coverage: clamp01(effectiveCoverage),
		task_mode_automation_pressure: clamp01(automationPressure),
		task_mode_augmentation_upside: clamp01(augmentationUpside),
		task_mode_exposure_signal: clamp01(0.6 * effectiveCoverage + 0.4 * automationPressure),
		task_mode_concentration: taskModeConcentration,
		demand_fragility: demandFragility,
		reallocation_capacity: reallocationCapacity,
		method: 'task_mode_proxy_v5a'
	};
}
