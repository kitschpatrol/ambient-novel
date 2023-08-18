<script lang="ts">
	import Stack from '$lib/components/Stack.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	import '/src/global.css';
	const bookData = bookDataRaw as BookData;
</script>

<Stack {bookData} />
