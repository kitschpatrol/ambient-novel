<script lang="ts">
	import type { ChapterData } from '$lib/schemas/bookSchema';

	export let chapterColor = '#ff0000';
	export let chapterData: ChapterData;

	// Note some duplication with Track.svelte...
	// Could try to integrate this loading placeholder there...
	// e.g. a "load=true" prop?
</script>

<div class="track">
	<h2
		style={`background-color: ${chapterColor}`}
		class="chapter-title absolute left-0 top-0 h-full w-full text-center font-display tracking-wider text-white text-opacity-80 shadow-vm-shadow text-shadow"
	>
		<span class="max-sm:hidden">Chapter</span>
		{chapterData.index + 1}: {chapterData.title}
	</h2>
</div>

<style>
	div.track {
		width: 100vw;
		height: calc(100vh / 12);
		position: relative;
		user-select: none;
	}

	h2.chapter-title {
		font-size: min(calc(100vh / 36), 1.75rem);
		line-height: calc(100vh / 12);
	}
</style>
