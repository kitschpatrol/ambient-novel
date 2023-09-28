<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { title } from '$lib/data/book.json';
	import { trim } from 'lodash';

	$: isHomePage = $page.url.pathname === base;
</script>

<header class="grid grid-cols-[1fr_max-content_1fr]">
	<div class="justify-self-start">
		{#if isHomePage}
			<a
				class="flex h-full items-center justify-center px-5 font-display text-base text-white text-opacity-90"
				href="{base}/about"
			>
				About
			</a>
		{:else}
			<a
				class="flex h-full items-center justify-center px-5 font-display text-base text-white text-opacity-90"
				href="{base}/"
			>
				Home
			</a>
		{/if}
	</div>
	<h1 class="font-display tracking-wider text-white shadow-vm-shadow text-shadow">
		{title.replaceAll('a', 'A')}
	</h1>
	<div class="justify-self-end">
		<a
			class="flex h-full items-center justify-center px-5 font-display text-base text-white text-opacity-90"
			href="https://39forks.com"
		>
			Buy the Book
		</a>
	</div>
</header>

<style>
	header {
		width: 100vw;
		height: calc(100vh / 12);
		background: #f01ef6;
		background: linear-gradient(#afafaf80 10%, #0000006b 100%);
	}
	header h1 {
		font-size: min(calc(100vh / 24), calc(100vw / 14));
		line-height: calc(100vh / 12);
	}
</style>
