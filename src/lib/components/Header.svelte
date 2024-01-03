<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/stores'

	export let title = 'The Valentine Mob'

	const rawPath = $page.url.pathname.replace(base, '').replaceAll('/', '')

	console.log(rawPath)
</script>

<header class="grid grid-cols-[1fr_max-content_1fr]">
	<div class="justify-self-start">
		{#if rawPath === 'about'}
			<a href={base}>Home</a>
		{:else}
			<a href="{base}/about">About</a>
		{/if}
	</div>
	{#if rawPath === ''}
		<h1 class="font-display tracking-wider text-vm-text-headline shadow-vm-shadow text-shadow">
			{title.replaceAll('a', 'A')}
		</h1>
	{:else}
		<a class="home" href={base}>
			<h1 class="font-display tracking-wider text-vm-text-headline shadow-vm-shadow text-shadow">
				{title.replaceAll('a', 'A')}
			</h1>
		</a>
	{/if}
	<div class="justify-self-end">
		{#if rawPath === 'book'}
			<a href={base}>Home</a>
		{:else}
			<a href="{base}/book">Get the Book </a>
		{/if}
	</div>
</header>

<style lang="postcss">
	header {
		position: var(--position);
		z-index: 5;
		top: 0;
		width: 100%;
		height: var(--height);
		background: linear-gradient(#00000000 30%, #0000001d 100%) #f01ef6;
		box-shadow: var(--shadow);
	}

	header h1 {
		font-size: min(calc(100svh / 26), calc(100vw / 24));
		line-height: var(--height);
	}

	header a:not(.home) {
		font-size: min(min(calc(100svh / 52), calc(100vw / 32), 1rem));

		@apply flex h-full items-center justify-center px-5 text-center font-display text-base leading-none text-white opacity-80 shadow-vm-shadow text-shadow;
	}

	header a:not(.home):hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
