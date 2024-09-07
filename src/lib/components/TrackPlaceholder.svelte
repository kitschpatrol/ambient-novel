<script lang="ts">
	import type { ChapterData } from '$lib/schemas/book-schema'
	import ChapterCover from '$lib/components/ChapterCover.svelte'

	export let chapterColor = '#ff0000'
	export let chapterData: ChapterData

	// Note some duplication with Track.svelte...
	// Could try to integrate this loading placeholder there...
	// e.g. a "load=true" prop?
</script>

<div class="track">
	<ChapterCover {chapterColor} {chapterData} />
</div>

<style lang="postcss">
	div.track {
		user-select: none;
		position: relative;
		width: 100vw;
		height: calc(100dvh / 12);
	}
</style>
