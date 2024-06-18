<script lang="ts">
	import type { PageServerData } from './$types'
	import { base } from '$app/paths'
	import Header from '$lib/components/Header.svelte'
	import Starfield from '$lib/components/Starfield.svelte'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	export let data: PageServerData

	const { chapters } = data.bookData

	// Clean up rare HTML-conflicting entities
	// Encoding everything would be trickier because of the embedded HTML
	for (const chapter of chapters) {
		for (let i = 0; i < chapter.lines.length; i++) {
			chapter.lines[i] = chapter.lines[i].replace('< They all snap >', '&lt; They all snap &gt;')
		}
	}

	let isMounted = false
	onMount(() => {
		isMounted = true
	})
</script>

<svelte:head>
	<title>The Text — The Valentine Mob</title>
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

<main
	class="mx-auto mb-20 mt-36 max-w-[90ch] bg-[#f7f7f7] bg-opacity-90 px-12 pb-16 pt-3 font-serif text-xl text-[#222222] max-sm:mx-auto max-sm:mb-16 max-sm:mt-24 max-sm:w-[90vw] max-sm:px-5 max-sm:text-xl"
>
	<h2>
		{data.bookData.title}<span class="alternate-title"> or <br />{data.bookData.titleAlt}</span>
	</h2>

	<cite>{data.bookData.author}</cite>

	<hr />

	<p class="contents-heading">Contents</p>
	<ol>
		{#each chapters as chapter, index}
			<li><a href="#chapter-{index + 1}">{chapter.title}</a></li>
		{/each}
	</ol>

	{#each chapters as chapter, index}
		<hr />
		<h3 id="chapter-{index + 1}"><span class="chapter-number">{index + 1}</span>{chapter.title}</h3>
		{#each chapter.lines as line}
			<p>{@html line}</p>
		{/each}
	{/each}
</main>
<img
	alt="heart"
	class="heart mx-auto mb-16 w-[10vw] max-w-[4rem] pb-16 opacity-90"
	src="{base}/heart.svg"
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

<style lang="postcss">
	div.star-wrapper {
		pointer-events: none;
		touch-action: none;
		opacity: 0.3;
	}

	main > p {
		/* margin-top: 1em; */
		text-indent: 3em;
	}

	:global(main > p > span) {
		color: unset !important;
		/* Hide inline color no shadow combination seems to yield legibility... 
		/* text-shadow: 1px 1px 8px rgb(0 0 0); */
	}

	/* Optional Options & Opportunities list */
	main > p :global(ul li) {
		margin-left: 3em;
		text-indent: 0;
		list-style-type: disc;
	}

	main > p.contents-heading {
		margin-top: 4em;
		text-align: center;
		text-indent: 0;
	}

	/* No breaks for the multi-line  */
	p:has(ul) + p:has(ul) {
		margin-top: 0;
	}

	main {
		position: relative;
		z-index: 4;
		line-height: 1.75em;
		box-shadow: 0 3px 9px #0000005f;
	}

	ol {
		display: grid;
		justify-items: center;
		margin: 2em 0;
		list-style-type: decimal;
	}

	hr {
		@apply text-3xl;
		margin: 3em 0 0;
		border: 0;
		border-bottom: 4px solid rgb(0 0 0 / 5%);
	}

	main h2 {
		@apply pb-3 pt-12 text-center text-3xl font-normal;
	}

	main h2 span.alternate-title {
		display: block;

		@apply mt-4 text-xl font-normal;
	}

	cite {
		display: block;
		font-style: normal;

		@apply mt-8 text-center text-base font-normal;
	}

	main h3 span.chapter-number {
		display: block;

		@apply pt-24 text-4xl font-medium;
	}

	main h3 {
		@apply pb-14 pb-3 text-2xl font-medium;
	}

	img.heart {
		/* doing the shadow in svg causes blur in mobile safari */
		filter: drop-shadow(-2px 3px 5px #000000b0);
	}

	main a {
		text-decoration: underline;
		text-decoration-color: rgb(0 0 0 / 25%);
		text-decoration-style: dotted;
		text-decoration-thickness: 0.1em;
		text-underline-offset: 0.2em;
	}

	main a:hover {
		text-decoration: underline;
		text-decoration-color: rgb(0 0 0 / 100%);
		text-decoration-style: solid;
		text-decoration-thickness: 0.1em;
		text-underline-offset: 0.2em;
	}
</style>
