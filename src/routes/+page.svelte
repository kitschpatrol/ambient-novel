<script lang="ts">
	import type { BookData } from '$lib/schemas/bookSchema';
	import Book from '$lib/components/Book.svelte';
	import bookDataRaw from '$lib/data/book.json';
	const bookData = bookDataRaw as BookData;
</script>

<Book {bookData} />
