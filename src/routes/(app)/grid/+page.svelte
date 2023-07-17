<script lang="ts">
	import Book from '$lib/components/Book.svelte';
	// import Tweakpane from '$lib/components/Tweakpane.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	const bookData = bookDataRaw as BookData;

	let scale;
</script>

<Book
	{bookData}
	initialChapter={0}
	style="position: absolute; left: 2.5vw; top: 10vh; width: 46.5vw; height: 40vh;"
/>
<Book
	{bookData}
	initialChapter={4}
	style="position: absolute; right: 2.5vw; top: 10vh; width: 46.5vw; height: 40vh;"
/>
<Book
	{bookData}
	initialChapter={6}
	style="position: absolute; left: 2.5vw; bottom: 2.5vh; width: 46.5vw; height: 40vh;"
/>
<Book
	{bookData}
	initialChapter={9}
	style="position: absolute; right: 2.5vw; bottom: 2.5vh; width: 46.5vw; height: 40vh;"
/>

<!-- <Tweakpane /> -->
