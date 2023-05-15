<script lang="ts">
	import '$lib/styles/reset.css';
	import '$lib/styles/global.css';
	import Header from '$lib/components/Header.svelte';
</script>

<Header />

<main style="display: contents;">
	<slot />
</main>
