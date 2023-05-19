<script lang="ts">
	import '../global.css';
	import Header from '$lib/components/Header.svelte';
</script>

<div
	class="grid h-screen w-screen grid-cols-1 grid-rows-[auto_minmax(0,500px)_auto] content-between justify-items-center gap-y-2"
>
	<Header />
	<main class="w-full max-w-screen-md overflow-hidden px-2">
		<slot />
	</main>
	<!-- <nav class="w-full bg-blue-300">Hi</nav> -->
</div>
