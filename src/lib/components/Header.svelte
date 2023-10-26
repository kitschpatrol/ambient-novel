<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	export let title: string = 'The Valentine Mob';

	$: isHomePage = $page.url.pathname === base;
</script>

<header class="grid grid-cols-[1fr_max-content_1fr]">
	<div class="justify-self-start">
		{#if isHomePage}
			<a href="{base}/about">About</a>
		{:else}
			<a href="{base}/">Home</a>
		{/if}
	</div>
	<h1 class="font-display tracking-wider text-white shadow-vm-shadow text-shadow">
		{title.replaceAll('a', 'A')}
	</h1>
	<div class="justify-self-end">
		<a
			href="https://39forkspublishing.square.site/s/shop"
			rel="noopener noreferrer"
			target="_blank"
		>
			Buy the Book
		</a>
	</div>
</header>

<style lang="postcss">
	header {
		width: 100%;
		height: var(--height);
		background: linear-gradient(#00000000 30%, #0000001d 100%) #f01ef6;
		position: var(--position);
		top: 0;
		box-shadow: var(--shadow);
	}

	header h1 {
		font-size: min(calc(100svh / 26), calc(100vw / 24));
		line-height: var(--height);
	}

	header a {
		font-size: min(min(calc(100svh / 52), calc(100vw / 32), 1rem));
		@apply flex h-full items-center justify-center px-5 text-center font-display text-base leading-none text-white opacity-80 shadow-vm-shadow text-shadow;
	}

	header a:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
