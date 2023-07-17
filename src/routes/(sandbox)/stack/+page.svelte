<script lang="ts">
	import Track from '$lib/components/Track.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	const bookData = bookDataRaw as BookData;
</script>

<div class="flex h-screen flex-col">
	{#each bookData.chapters as chapter}
		<Track chapterData={chapter} />
	{/each}
</div>

Gonna have stuff here

<!-- <Tweakpane /> -->
