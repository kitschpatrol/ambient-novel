<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { title } from '$lib/data/book.json';

	$: isHomePage = $page.url.pathname === base;
</script>

<header class="grid grid-cols-[1fr_max-content_1fr]">
	<div class="justify-self-start">
		{#if isHomePage}
			<a
				class="flex h-full items-center justify-center pl-5 font-display text-base text-white text-opacity-90"
				href="{base}/about"
			>
				About
			</a>
		{:else}
			<a
				class="flex h-full items-center justify-center pl-5 font-display text-base text-white text-opacity-90"
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
			class="flex h-full items-center justify-center pr-5 font-display text-base text-white shadow-vm-shadow text-shadow"
			href="https://39forks.com"
		>
			Buy the Book
		</a>
	</div>
</header>

<style lang="postcss">
	header {
		width: 100%;
		height: calc(100dvh / 12);
		background: linear-gradient(#afafaf80 10%, #00000043 100%) #f01ef6;
		position: var(--position);
		top: 0;
		box-shadow: var(--shadow);
	}
	header h1 {
		font-size: min(calc(100dvh / 26), calc(100vw / 24));
		line-height: calc(100dvh / 12);
	}

	header a {
		font-size: min(min(calc(100dvh / 52), calc(100vw / 32), 1rem));
		line-height: 1em;
		text-align: center;
		/* line-height: calc(100dvh / 12); */
	}

	header a:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
