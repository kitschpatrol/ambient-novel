<script lang="ts">
	import { title } from '$lib/data/book.json';
</script>

<header>
	<h1
		class="p-5 text-center font-display text-4xl tracking-wider text-white shadow-shadow text-shadow"
	>
		{title.replaceAll('a', 'A')}
	</h1>
</header>
