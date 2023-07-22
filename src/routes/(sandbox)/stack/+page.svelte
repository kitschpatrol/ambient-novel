<script lang="ts">
	import Track from '$lib/components/Track.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	const bookData = bookDataRaw as BookData;
</script>

<div>
	<!-- <Track chapterData={bookData.chapters[7]} /> -->
	<!-- <Track chapterData={bookData.chapters[8]} /> -->
	{#each bookData.chapters as chapter}
		<Track chapterData={chapter} />
	{/each}
</div>

<!-- <Tweakpane /> -->
