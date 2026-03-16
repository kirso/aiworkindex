<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';

	let {
		occupation,
		groupAverage
	}: {
		occupation: Occupation;
		groupAverage: { aioe: number; theta: number; c_aioe: number };
	} = $props();

	const size = 220;
	const center = size / 2;
	const radius = 85;

	const axes = [
		{ key: 'aioe', label: 'AI Exposure' },
		{ key: 'theta', label: 'Complementarity' },
		{ key: 'c_aioe', label: 'C-AIOE Risk' }
	] as const;

	const angleStep = (2 * Math.PI) / axes.length;
	const startAngle = -Math.PI / 2;

	function polarToCart(angle: number, r: number): { x: number; y: number } {
		return {
			x: center + r * Math.cos(angle),
			y: center + r * Math.sin(angle)
		};
	}

	function polygonPoints(values: number[]): string {
		return values
			.map((v, i) => {
				const angle = startAngle + i * angleStep;
				const p = polarToCart(angle, v * radius);
				return `${p.x},${p.y}`;
			})
			.join(' ');
	}

	let occValues = $derived([
		occupation.scores.aioe,
		occupation.scores.theta,
		occupation.scores.c_aioe
	]);

	let avgValues = $derived([
		groupAverage.aioe,
		groupAverage.theta,
		groupAverage.c_aioe
	]);

	// Grid rings
	const rings = [0.25, 0.5, 0.75, 1.0];
</script>

{#if browser}
	<svg width={size} height={size} class="block">
		<!-- Grid rings -->
		{#each rings as r}
			<polygon
				points={axes.map((_, i) => {
					const angle = startAngle + i * angleStep;
					const p = polarToCart(angle, r * radius);
					return `${p.x},${p.y}`;
				}).join(' ')}
				fill="none"
				stroke="#e5e7eb"
				stroke-width="0.5"
			/>
		{/each}

		<!-- Axis lines -->
		{#each axes as _, i}
			{@const angle = startAngle + i * angleStep}
			{@const end = polarToCart(angle, radius)}
			<line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#d1d5db" stroke-width="0.5" />
		{/each}

		<!-- Group average polygon -->
		<polygon
			points={polygonPoints(avgValues)}
			fill="#9ca3af"
			fill-opacity="0.15"
			stroke="#9ca3af"
			stroke-width="1"
			stroke-dasharray="3,2"
		/>

		<!-- Occupation polygon -->
		<polygon
			points={polygonPoints(occValues)}
			fill="#3b82f6"
			fill-opacity="0.2"
			stroke="#3b82f6"
			stroke-width="2"
		/>

		<!-- Data points -->
		{#each occValues as v, i}
			{@const angle = startAngle + i * angleStep}
			{@const p = polarToCart(angle, v * radius)}
			<circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" />
		{/each}

		<!-- Axis labels -->
		{#each axes as ax, i}
			{@const angle = startAngle + i * angleStep}
			{@const p = polarToCart(angle, radius + 18)}
			<text
				x={p.x}
				y={p.y}
				text-anchor="middle"
				dominant-baseline="central"
				class="fill-gray-600 text-[10px] font-medium"
			>
				{ax.label}
			</text>
		{/each}
	</svg>

	<!-- Legend -->
	<div class="mt-2 flex gap-4 text-[10px] text-gray-500">
		<span class="flex items-center gap-1">
			<span class="inline-block h-2 w-3 rounded-sm bg-blue-500 opacity-60"></span>
			This occupation
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-2 w-3 rounded-sm bg-gray-400 opacity-40"></span>
			Group average
		</span>
	</div>
{/if}
