import type { LabourClusterMonitor } from './index';
import type { PostingAggregate } from './postings-monitor';
import type { EmployerPressureEntry } from './employer-pressure';

function quarterDeltaPhrase(delta?: number | null): string | null {
	if (typeof delta !== 'number') return null;
	if (Math.abs(delta) < 0.05) return 'was essentially flat versus last quarter';
	if (delta > 0) return `rose by ${Math.abs(delta).toFixed(1)} points from last quarter`;
	return `fell by ${Math.abs(delta).toFixed(1)} points from last quarter`;
}

function labourStateLabel(state?: string | null): string {
	if (state === 'strong') return 'strong';
	if (state === 'moderate') return 'mixed';
	if (state === 'weak') return 'weak';
	if (state === 'deteriorating') return 'under pressure';
	return 'mixed';
}

function hiringStateLabel(postings?: PostingAggregate | null): string | null {
	if (!postings || postings.hiring_state === 'no_signal') return null;
	if (postings.hiring_state === 'active') return 'live job ads are active';
	if (postings.hiring_state === 'moderate') return 'live job ads are present';
	if (postings.hiring_state === 'thin') return 'live job ads are limited';
	return 'visible job ads look stale';
}

function employerPressureLabel(entry?: EmployerPressureEntry | null): string | null {
	if (!entry || entry.signal_count === 0) return null;
	if (entry.label === 'critical') return 'employer pressure is very high';
	if (entry.label === 'high') return 'employer pressure is high';
	if (entry.label === 'moderate') return 'employer pressure is moderate';
	return 'employer pressure is low';
}

function hiringBalancePhrase(monitor?: LabourClusterMonitor | null): string | null {
	if (!monitor?.hiring) return null;
	const { recruitment_rate, resignation_rate, net_pressure } = monitor.hiring;
	if (net_pressure > 0.1) {
		return `recruitment is running above resignation (${recruitment_rate}% vs ${resignation_rate}%)`;
	}
	if (net_pressure < -0.1) {
		return `resignation is running above recruitment (${resignation_rate}% vs ${recruitment_rate}%)`;
	}
	return `recruitment and resignation are roughly balanced (${recruitment_rate}% vs ${resignation_rate}%)`;
}

export function buildMarketNowSummary(
	monitor?: LabourClusterMonitor | null,
	postings?: PostingAggregate | null,
	employerPressure?: EmployerPressureEntry | null
): string {
	const parts: string[] = [];

	if (monitor) {
		const vacancy = `The ${monitor.cluster_label} labour market is ${labourStateLabel(monitor.overall)}. Vacancy rate is ${monitor.vacancy.latest_rate}%`;
		const vacancyDelta = quarterDeltaPhrase(monitor.vacancy.qoq_delta_pp);
		parts.push(vacancyDelta ? `${vacancy} and ${vacancyDelta}.` : `${vacancy}.`);
	}

	const hiringBalance = hiringBalancePhrase(monitor);
	if (hiringBalance) parts.push(`${hiringBalance}.`);

	const postingsLabel = hiringStateLabel(postings);
	if (postingsLabel && postings) {
		parts.push(`${postingsLabel}, with ${postings.posting_volume_30d} visible postings in the last 30 days.`);
	}

	const pressureLabel = employerPressureLabel(employerPressure);
	if (pressureLabel) parts.push(`${pressureLabel}.`);

	if (parts.length === 0) {
		return 'Current Singapore market context is limited for this job family.';
	}

	return parts.join(' ');
}

export function buildMarketDetailBullets(
	monitor?: LabourClusterMonitor | null,
	postings?: PostingAggregate | null,
	employerPressure?: EmployerPressureEntry | null
): string[] {
	const items: string[] = [];

	if (monitor) {
		const vacancyDelta = quarterDeltaPhrase(monitor.vacancy.qoq_delta_pp);
		items.push(
			vacancyDelta
				? `Vacancy rate is ${monitor.vacancy.latest_rate}% and ${vacancyDelta}.`
				: `Vacancy rate is ${monitor.vacancy.latest_rate}%.`
		);

		const hiringBalance = hiringBalancePhrase(monitor);
		if (hiringBalance) items.push(`Hiring read: ${hiringBalance}.`);

		if (monitor.retrenchment?.incidence_per_1000 != null) {
			const level =
				monitor.retrenchment.incidence_per_1000 < 2
					? 'low'
					: monitor.retrenchment.incidence_per_1000 < 5
						? 'moderate'
						: 'elevated';
			items.push(
				`Retrenchment was ${level} at ${monitor.retrenchment.incidence_per_1000} per 1,000 employees.`
			);
		}

		if (monitor.re_entry?.rate_12m != null) {
			items.push(
				`${monitor.re_entry.rate_12m}% of retrenched workers re-entered employment within 12 months.`
			);
		}
	}

	if (postings && postings.hiring_state !== 'no_signal') {
		items.push(
			`Live job ads show ${postings.posting_volume_30d} visible postings in the last 30 days${
				postings.top_skills.length > 0
					? `, led by ${postings.top_skills
							.slice(0, 3)
							.map(skill => skill.label)
							.join(', ')}`
					: ''
			}.`
		);
	}

	if (employerPressure && employerPressure.signal_count > 0) {
		items.push(
			`Employer pressure is ${employerPressure.label}, based on ${employerPressure.signal_count} recent Singapore-relevant company signals.`
		);
	}

	return items;
}
