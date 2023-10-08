<script lang="ts">
	import Stack from '$lib/components/Stack.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';

	const bookData = bookDataRaw as BookData;
</script>

<svelte:head>
	<title>The Valentine Mob</title>
	<style>
		body {
			position: fixed;
			overflow: hidden;
		}
	</style>
</svelte:head>

<Stack {bookData} />
