<script lang="ts">
	import Book from '$lib/components/Book.svelte';
	import Tweakpane from '$lib/components/Tweakpane.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	const bookData = bookDataRaw as BookData;
</script>

<Book {bookData} />
<Tweakpane />
