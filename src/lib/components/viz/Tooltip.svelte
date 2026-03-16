<script lang="ts">
	import type { Occupation, ImpactType } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors, majorGroupByKey } from '$lib/data';

	let {
		occupation = null,
		x = 0,
		y = 0,
		visible = false
	}: {
		occupation: Occupation | null;
		x: number;
		y: number;
		visible: boolean;
	} = $props();

	const impactSummaries: Record<ImpactType, string> = {
		ai_leveraged: 'AI amplifies productivity in this role — humans remain essential.',
		at_risk: 'High exposure with low human bottleneck — vulnerable to automation.',
		stable: 'Low AI exposure — this occupation is largely unaffected for now.',
		mixed: 'Moderate signals across dimensions — outcome depends on adoption patterns.'
	};

	function formatGroupEmployment(thousands: number): string {
		if (thousands >= 1) return thousands.toFixed(1) + 'K';
		return Math.round(thousands * 1000).toString();
	}

	function groupLabel(key: string): string {
		return majorGroupByKey.get(key)?.label ?? key;
	}

	function scoreBarWidth(value: number): string {
		return (value * 100).toFixed(0) + '%';
	}
</script>

{#if visible && occupation}
	<div
		class="pointer-events-none fixed z-50 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-xl"
		style="left: {x + 16}px; top: {y - 16}px;"
	>
		<!-- Title + group -->
		<p class="text-sm font-bold leading-snug text-gray-900">{occupation.title}</p>
		<p class="mt-0.5 text-xs text-gray-400">{occupation.major_group}</p>

		<!-- Badges row -->
		<div class="mt-2 flex items-center gap-1.5">
			<span
				class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
				style="background-color: {riskBandColors[occupation.risk_band]};"
			>
				{riskBandLabels[occupation.risk_band]} Risk
			</span>
			<span
				class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
				style="background-color: {impactTypeColors[occupation.impact_type]};"
			>
				{impactTypeLabels[occupation.impact_type]}
			</span>
		</div>

		<!-- Key stats grid -->
		<div class="mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5">
			<div>
				<p class="text-[10px] font-medium text-gray-400">Net Risk</p>
				<p class="text-sm font-bold tabular-nums text-gray-900">{(occupation.net_risk * 100).toFixed(0)}%</p>
			</div>
			<div>
				<p class="text-[10px] font-medium text-gray-400">Median Wage</p>
				<p class="text-sm font-bold tabular-nums text-gray-900">SGD {occupation.gross_wage_median.toLocaleString()}</p>
			</div>
			<div>
				<p class="text-[10px] font-medium text-gray-400">Group</p>
				<p class="text-xs font-bold text-gray-900">{groupLabel(occupation.major_group)}</p>
				<p class="text-[10px] tabular-nums text-gray-500">{formatGroupEmployment(occupation.group_employment_thousands)} workers</p>
			</div>
		</div>

		<!-- Score bars -->
		<div class="mt-3 space-y-1.5">
			<div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-medium text-gray-400">Exposure</span>
					<span class="text-[10px] tabular-nums text-gray-500">{(occupation.exposure * 100).toFixed(0)}%</span>
				</div>
				<div class="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-rose-400" style="width: {scoreBarWidth(occupation.exposure)};"></div>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-medium text-gray-400">Bottleneck</span>
					<span class="text-[10px] tabular-nums text-gray-500">{(occupation.bottleneck * 100).toFixed(0)}%</span>
				</div>
				<div class="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-emerald-400" style="width: {scoreBarWidth(occupation.bottleneck)};"></div>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-medium text-gray-400">Market Resilience</span>
					<span class="text-[10px] tabular-nums text-gray-500">{(occupation.market.market_resilience * 100).toFixed(0)}%</span>
				</div>
				<div class="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-blue-400" style="width: {scoreBarWidth(occupation.market.market_resilience)};"></div>
				</div>
			</div>
		</div>

		<!-- Impact summary -->
		<p class="mt-3 text-[11px] leading-relaxed text-gray-500 italic">
			{impactSummaries[occupation.impact_type]}
		</p>

		<!-- CTA hint -->
		<p class="mt-2 text-center text-[10px] font-medium text-indigo-500">Click to view full details</p>
	</div>
{/if}
