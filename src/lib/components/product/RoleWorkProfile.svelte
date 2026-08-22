<script lang="ts">
	type WorkProfileLevel = 'Less central' | 'Mixed' | 'Central';
	type WorkProfileItem = { label: string; level: WorkProfileLevel };

	let {
		id,
		familyLabel,
		items,
		accent,
		surface: _surface,
		disclosure
	}: {
		id: string;
		familyLabel: string;
		items: WorkProfileItem[];
		accent: string;
		surface: string;
		disclosure: string;
	} = $props();

	const levelValue: Record<WorkProfileLevel, number> = {
		'Less central': 1,
		Mixed: 2,
		Central: 3
	};
	const center = { x: 180, y: 145 };
	const radius = 82;
	const titleId = $derived(`work-profile-title-${id}`);
	const descriptionId = $derived(`work-profile-description-${id}`);

	function point(index: number, value: number, distance = radius): { x: number; y: number } {
		const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6;
		const scaledDistance = distance * (value / 3);
		return {
			x: center.x + Math.cos(angle) * scaledDistance,
			y: center.y + Math.sin(angle) * scaledDistance
		};
	}

	function pointsFor(value: number): string {
		return items
			.map((_, index) => point(index, value))
			.map(p => `${p.x},${p.y}`)
			.join(' ');
	}

	let profilePoints = $derived(
		items
			.map((item, index) => point(index, levelValue[item.level]))
			.map(p => `${p.x},${p.y}`)
			.join(' ')
	);

	function labelPoint(index: number): { x: number; y: number } {
		return point(index, 3, radius + 20);
	}

	function textAnchor(index: number): 'start' | 'middle' | 'end' {
		if (index === 0 || index === 3) return 'middle';
		return index === 1 || index === 2 ? 'start' : 'end';
	}

	function labelLines(label: string): string[] {
		if (label === 'Creating and explaining') return ['Creating and', 'explaining'];
		if (label === 'Analysis and digital tools') return ['Analysis and', 'digital tools'];
		if (label === 'Accountable judgement') return ['Accountable', 'judgement'];
		return [label];
	}
</script>

<div class="border border-border bg-card p-4 sm:p-5">
	<div>
		<p class="text-xs font-bold uppercase tracking-wide" style:color={accent}>Human work profile</p>
		<h3 class="mt-1 text-base font-bold">Common {familyLabel.toLowerCase()} work pattern</h3>
		<p class="mt-1 text-sm text-text-secondary">
			Reviewed ordinal guidance. Each axis stands on its own; there is no combined profile score.
		</p>
	</div>

	<div class="mt-4 hidden sm:block">
		<svg
			class="mx-auto block h-auto w-full max-w-xl"
			viewBox="0 0 360 300"
			role="img"
			aria-labelledby={`${titleId} ${descriptionId}`}
		>
			<title id={titleId}>Human work profile for {familyLabel}</title>
			<desc id={descriptionId}>
				Six independent dimensions use three reviewed levels: Less central, Mixed and Central. The
				outline has no total or area score.
			</desc>
			{#each [1, 2, 3] as ring}
				<polygon
					points={pointsFor(ring)}
					fill="none"
					stroke="var(--color-border)"
					stroke-width={ring === 3 ? 1.5 : 1}
				></polygon>
			{/each}
			{#each items as item, index (item.label)}
				{@const axisEnd = point(index, 3)}
				<line
					x1={center.x}
					y1={center.y}
					x2={axisEnd.x}
					y2={axisEnd.y}
					stroke="var(--color-border)"
					stroke-width="1"
				></line>
			{/each}
			<polygon
				points={profilePoints}
				fill="none"
				stroke={accent}
				stroke-width="3"
				stroke-linejoin="round"
			></polygon>
			{#each items as item, index (item.label)}
				{@const profilePoint = point(index, levelValue[item.level])}
				{@const label = labelPoint(index)}
				<circle cx={profilePoint.x} cy={profilePoint.y} r="4.5" fill={accent}>
					<title>{item.label}: {item.level}</title>
				</circle>
				<text
					x={label.x}
					y={label.y}
					text-anchor={textAnchor(index)}
					font-size="11"
					font-weight="600"
					fill="var(--color-foreground)"
				>
					{#each labelLines(item.label) as line, lineIndex}
						<tspan x={label.x} dy={lineIndex === 0 ? 0 : 13}>{line}</tspan>
					{/each}
				</text>
			{/each}
		</svg>
		<div
			class="mx-auto -mt-2 flex max-w-sm items-center justify-between text-xs text-muted-foreground"
		>
			<span>Less central</span><span>Mixed</span><span>Central</span>
		</div>
	</div>

	<div class="mt-4 space-y-3 sm:hidden">
		{#each items as item (item.label)}
			<div>
				<div class="flex items-baseline justify-between gap-3 text-sm">
					<span>{item.label}</span>
					<strong class="shrink-0 text-xs" style:color={accent}>{item.level}</strong>
				</div>
				<div
					class="mt-1.5 h-2 overflow-hidden rounded-full bg-card"
					role="img"
					aria-label={`${item.label}: ${item.level}`}
				>
					<div
						class="h-full rounded-full"
						style:background={accent}
						style:width={`${(levelValue[item.level] / 3) * 100}%`}
					></div>
				</div>
			</div>
		{/each}
	</div>

	<p class="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
		{disclosure}
	</p>
</div>
