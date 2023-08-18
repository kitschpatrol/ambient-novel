<script lang="ts">
	import Book from '$lib/components/Book.svelte';
	import Header from '$lib/components/Header.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	import '/src/global.css';
	const bookData = bookDataRaw as BookData;
</script>

<div
	class="grid h-full w-full grid-cols-1 grid-rows-[auto_minmax(0,500px)_auto] content-between justify-items-center gap-y-2"
>
	<Header />
	<main class="w-full max-w-screen-md px-2">
		<Book {bookData} useQueryStore={true} />
	</main>
	<!-- <nav class="w-full bg-blue-300">Hi</nav> -->
</div>
