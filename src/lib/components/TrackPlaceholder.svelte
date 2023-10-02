<script lang="ts">
	import ChapterCover from '$lib/components/ChapterCover.svelte';
	import type { ChapterData } from '$lib/schemas/bookSchema';

	export let chapterColor = '#ff0000';
	export let chapterData: ChapterData;

	// Note some duplication with Track.svelte...
	// Could try to integrate this loading placeholder there...
	// e.g. a "load=true" prop?
</script>

<div class="track">
	<ChapterCover {chapterData} {chapterColor} />
</div>

<style>
	div.track {
		width: 100vw;
		height: calc(100dvh / 12);
		position: relative;
		user-select: none;
	}
</style>
