<script lang="ts">
	import Starfield from '$lib/components/Starfield.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	let isMounted = false;
	onMount(() => {
		isMounted = true;
	});
</script>

<svelte:head>
	<title>The Valentine Mob: Coming Soon</title>
	<style>
		/* all the fixed position hacks (like ::before) are subtly broken */
		body,
		html {
			overscroll-behavior: unset;
			position: static;
			overflow-y: auto;
			background: linear-gradient(
					var(--background-color-gradient-1) 0%,
					var(--background-color-gradient-2) 100%
				)
				var(--background-color-gradient-1);
		}
	</style>
</svelte:head>

<!-- prettier-ignore -->
<main>
	<h1>The VAlentine&nbsp;Mob</h1>
	<h2>
		An&nbsp;ambient&nbsp;novel by&nbsp;<a href="https://39forks.com/">Scott&nbsp;Wayne&nbsp;Indiana</a>
	</h2>
	<h3>Launching October&nbsp;18,&nbsp;2023</h3>
</main>

{#if isMounted}
	<div class="star-wrapper" transition:fade={{ delay: 250, duration: 3000 }}>
		<Starfield
			--position="fixed"
			--top="0"
			--height="100%"
			starSpeed={0.2}
			planetSpeed={0.1}
			starRotationSpeed={1}
			strokeEnabled={false}
			color="#ffffff"
			maxParticlesMobile={50}
			maxParticlesDesktop={100}
		/>
	</div>
{/if}

<style lang="postcss">
	div.star-wrapper {
		opacity: 0.3;
		touch-action: none;
		pointer-events: none;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		padding: 0 1rem;
		height: 100dvh;
	}

	h1,
	h2,
	h3 {
		@apply w-full text-center font-display tracking-wider text-white shadow-vm-shadow text-shadow;
	}

	h2 {
		opacity: 0.75;
		margin-top: 4em;
	}

	h2 a:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	h3 {
		margin-top: 4em;
	}

	h1 {
		font-size: min(calc(100svh / 13), calc(100vw / 14));
		line-height: 1em;
	}

	h2,
	h3 {
		font-size: max(1.1rem, calc(100vw / 80));
	}
</style>
