<script lang="ts">
	import { title } from '$lib/data/book.json';
</script>

<header>
	<h1
		class="px-1 py-5 text-center font-display text-2xl tracking-wider text-white shadow-vm-shadow text-shadow md:text-3xl lg:text-4xl xl:text-5xl"
	>
		{title.replaceAll('a', 'A')}
	</h1>
</header>
