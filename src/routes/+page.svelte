<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Stack from '$lib/components/Stack.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	const bookData = bookDataRaw as BookData;
</script>

<Stack {bookData} />

<style>
	:global(body) {
		position: fixed; /* for safari mobile */
	}
</style>
