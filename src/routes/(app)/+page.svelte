<script lang="ts">
	import { dev } from '$app/environment';
	import Book from '$lib/components/Book.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	import Tweakpane from 'tweakpane-css/src/Tweakpane.svelte';
	const bookData = bookDataRaw as BookData;
</script>

<Book {bookData} useQueryStore={true} />

{#if dev}
	<Tweakpane />
{/if}
