<script lang="ts">
	import UnavailableRanking from '$lib/components/v9-browser/UnavailableRanking.svelte';
</script>

<UnavailableRanking
	title="Quarterly pressure movers"
	path="/rankings/quarterly-movers"
	description="There is no comparable V9 quarterly movement ranking yet. The SSOC 2024 taxonomy and V9 method are a new baseline, not another point in the older score series."
	why="A change between V8 and V9 would mix taxonomy migration, new source evidence and a different headline method with real movement. Calling that quarterly change would misstate a release break as an observed labour-market shift."
	requirement="This page can return after at least two frozen V9-compatible snapshots use the same taxonomy, source definitions and ranking method, with source revisions separated from real change."
/>
