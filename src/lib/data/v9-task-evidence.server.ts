import taskEvidenceJson from './ilo-isco-task-evidence-v9.json';
import type {
	V9IloTaskEvidenceDocument,
	V9MappedTaskExamples
} from './v9-task-evidence';

const taskEvidence = taskEvidenceJson as V9IloTaskEvidenceDocument;

export function getMappedTaskExamples(
	isco08Codes: readonly string[],
	limit = 3
): V9MappedTaskExamples[] {
	return isco08Codes.flatMap(isco08Code => {
		const group = taskEvidence.by_isco08[isco08Code];
		if (!group || group.tasks.length === 0) return [];
		const higher = group.tasks.slice(0, limit);
		const higherIds = new Set(higher.map(task => task.task_id));
		const lower = [...group.tasks]
			.reverse()
			.filter(task => !higherIds.has(task.task_id))
			.slice(0, limit);
		return [
			{
				isco08Code,
				isco08Title: group.title,
				higher,
				lower
			}
		];
	});
}

export const v9TaskEvidenceMetadata = {
	counts: taskEvidence.counts,
	grain: taskEvidence.grain,
	scoreScale: taskEvidence.score_scale,
	source: taskEvidence.source,
	headlineEffect: taskEvidence.headline_effect
} as const;
