<script lang="ts">
	import { faArrowRight, faCloudArrowDown } from '@fortawesome/free-solid-svg-icons'
	import { base } from '$app/paths'
	import FancyLink from '$lib/components/FancyLink.svelte'
	import Header from '$lib/components/Header.svelte'
	import Starfield from '$lib/components/Starfield.svelte'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	let isMounted = false
	onMount(() => {
		isMounted = true
	})
</script>

<svelte:head>
	<title>Get the Book — The Valentine Mob</title>
	<style>
		/* all the fixed position hacks (like ::before) are subtly broken */
		body,
		html {
			position: static;
			overflow-y: auto;
			overscroll-behavior: unset;
			background: linear-gradient(
					var(--background-color-gradient-1) 0%,
					var(--background-color-gradient-2) 100%
				)
				var(--background-color-gradient-1);
		}
	</style>
</svelte:head>

<Header
	--height="calc(100svh / 12)"
	--position="fixed"
	--shadow="-10px 25px 50px 0px rgba(0, 0, 0, 0.2)"
/>

{#if isMounted}
	<div class="star-wrapper" transition:fade={{ delay: 250, duration: 3000 }}>
		<Starfield
			--height="calc(100svh - (100svh / 12))"
			--position="fixed"
			--top="calc(100svh / 12)"
			color="#ffffff"
			maxParticlesDesktop={80}
			maxParticlesMobile={20}
			planetSpeed={0.1}
			starRotationSpeed={1}
			starSpeed={0.2}
			strokeEnabled={false}
		/>
	</div>
{/if}

<main
	class="mx-auto mb-20 mt-36 max-w-[90ch] bg-[#f7f7f7] bg-opacity-90 px-12 pb-16 pt-3 font-serif text-xl text-[#222222] max-sm:mx-auto max-sm:mb-16 max-sm:mt-24 max-sm:w-[90vw] max-sm:px-5 max-sm:text-xl"
>
	<h2>Get the Book</h2>

	<h3>The Printed Book</h3>
	<FancyLink
		alt="The Valentine Mob paperback book cover"
		href="https://39forkspublishing.square.site/product/the-valentine-mob/97"
		icon={faArrowRight}
		imageHeight={3401}
		imagePath="{base}/images/book.webp"
		imageWidth={2000}
	>
		The 72-page, perfect-bound paperback.<br /><em>Buy direct from 39forks Publishing</em>
	</FancyLink>

	<h3>The Deluxe Version</h3>
	<FancyLink
		alt="The Valentine Mob deluxe edition with book and lego set"
		href="https://39forkspublishing.square.site/product/the-valentine-mob-deluxe-version/98"
		icon={faArrowRight}
		imageHeight={4463}
		imagePath="{base}/images/deluxe.webp"
		imageWidth={4644}
	>
		The book, plus a custom-built Lego box featuring sixteen Valentine Mob Minifigs.
		<em>Buy direct from 39forks Publishing</em>
	</FancyLink>

	<h3>The Audio Book</h3>
	<FancyLink
		alt="Screenshot of The Valentine Mob playing on an iPhone in Apple Music"
		downloadLink={true}
		href="{base}/audio-book/The Valentine Mob - Complete Audio Book.mp3"
		icon={faCloudArrowDown}
		imageHeight={2774}
		imagePath="{base}/images/audio.webp"
		imageWidth={1415}
		openInNewTab={false}
	>
		The author narrates the Valentine Mob over original ambient tracks.<br />
		<em>Download the complete audio book for free</em>
	</FancyLink>

	<h3>More from 39forks Publishing</h3>

	<FancyLink
		alt="Screenshot of the 39forks Publishing online store"
		href="https://39forkspublishing.square.site/s/shop"
		icon={faArrowRight}
		imageHeight={2006}
		imagePath="{base}/images/store.webp"
		imageWidth={2723}
	>
		Discover more books, projects, and games from 39forks.
		<em>Visit the online store</em>
	</FancyLink>
</main>
<img
	alt="heart"
	class="heart mx-auto mb-16 w-[10vw] max-w-[4rem] pb-16 opacity-90"
	src="{base}/heart.svg"
/>

<style lang="postcss">
	div.star-wrapper {
		pointer-events: none;
		touch-action: none;
		opacity: 0.3;
	}

	main {
		line-height: 1.75em;
		box-shadow: 0 3px 9px #0000005f;
	}

	em {
		font-size: 1.1rem;
		color: rgb(0 0 0 / 50%);
	}

	main h2 {
		@apply pb-3 pt-6 text-3xl font-normal;
	}

	main h3 {
		@apply pb-3 pt-14 text-2xl font-medium italic;
	}

	img.heart {
		/* doing the shadow in svg causes blur in mobile safari */
		filter: drop-shadow(-2px 3px 5px #000000b0);
	}
</style>
