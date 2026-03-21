import type { OccupationScoringBasis } from './index';

export function scoringBasisLabel(
	scoringBasis: OccupationScoringBasis | null | undefined
): string {
	if (scoringBasis === 'task_aware_exposure_v43') return 'Task-adjusted V4.3';
	if (scoringBasis === 'ensemble_fallback_v42') return 'V4.2 ensemble fallback';
	if (scoringBasis === 'posterior_task_aware_v5') return 'Posterior task-aware V5';
	if (scoringBasis === 'posterior_ensemble_fallback_v5') return 'Posterior fallback V5';
	return 'Not published';
}

export function scoringBasisDescription(
	scoringBasis: OccupationScoringBasis | null | undefined
): string {
	if (scoringBasis === 'task_aware_exposure_v43') {
		return 'Live exposure is upgraded with weighted task evidence before the structural formula is applied.';
	}
	if (scoringBasis === 'ensemble_fallback_v42') {
		return 'This occupation stays on the proven V4.2 ensemble because task evidence is still sparse or fallback-only.';
	}
	if (scoringBasis === 'posterior_task_aware_v5') {
		return 'Live V5 exposure uses the latent-source posterior, then blends in task-mode evidence where weighted task coverage is strong.';
	}
	if (scoringBasis === 'posterior_ensemble_fallback_v5') {
		return 'Live V5 exposure uses the latent-source posterior without the full task-mode blend because task evidence is still sparse or fallback-only.';
	}
	return 'No scoring-basis metadata is available for this occupation.';
}
