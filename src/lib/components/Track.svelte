<script lang="ts">
	import Audio from '$lib/components/Audio.svelte';
	import type { ChapterData, LineData } from '$lib/schemas/bookSchema';
	import ScrollBooster from 'scrollbooster';
	import { onMount } from 'svelte';

	import { quadInOut } from 'svelte/easing';
	import { spring } from 'svelte/motion';
	// export let isPlaying = false;
	export let chapterData: ChapterData;
	const duration = chapterData.voiceOver.durationSeconds;
	export let isPlaying = false;
	export let currentTime = 0;
	export let maxVolumeMusic = 0.1;
	export let maxVolumeSpeech = 1.0;

	let scrollWrapperElement: HTMLDivElement;
	let scrollAreaElement: HTMLDivElement;
	let scrollTween = spring(0, {
		stiffness: 0.005,
		damping: 0.2 // setting > 1 gives crazy effect
	});

	let targetOffset = 0;

	let rowWidth = 0;

	onMount(() => {
		// jump immediately to the correct line,
		// e.g. when switching chapters
		//scrollTo(0);

		new ScrollBooster({
			viewport: scrollWrapperElement,
			content: scrollAreaElement,
			direction: 'horizontal',
			scrollMode: 'native',
			bounce: false,
			pointerMode: 'mouse',
			/* @ts-ignore */
			onPointerDown: () => {
				// this is weirdly slow
				// document.body.classList.add('cursor-grabbing-important');
			},
			/* @ts-ignore */
			onPointerUp: () => {
				// document.body.classList.remove('cursor-grabbing-important');
			}
		});
	});

	function onMouseUpDocument() {}

	$: timedElements =
		scrollWrapperElement &&
		(scrollWrapperElement.querySelectorAll(
			'li[data-time], span[data-time]'
		) as NodeListOf<HTMLElement>);

	function scrollTo(offset: number) {
		if (scrollWrapperElement && rowWidth > 0) {
			$scrollTween = offset - rowWidth / 2;
		}
	}

	$: {
		if (scrollWrapperElement) {
			scrollWrapperElement.scrollLeft = $scrollTween;
		}
	}

	$: {
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...
		let currentElement: HTMLElement | null = null;
		if (timedElements) {
			for (const element of timedElements) {
				if (currentTime >= parseFloat(element.getAttribute('data-time') ?? '0')) {
					currentElement = element;
					continue;
				} else {
					if (currentElement) {
						const newOffset = currentElement.offsetLeft; // + currentElement.offsetWidth * 2;
						if (newOffset != targetOffset) {
							scrollTo(targetOffset);
							currentElement.classList.remove('opacity-10');
							targetOffset = newOffset;
						}
					}
					break;
				}
			}
		}
	}

	const { lines } = chapterData;
</script>

<svelte:body />

<div
	bind:this={scrollWrapperElement}
	bind:clientWidth={rowWidth}
	class="scroll-wrapper no-scrollbar"
>
	<button class="fixed left-0 bg-red-300" on:click={() => (isPlaying = !isPlaying)}>
		{isPlaying ? 'Pause' : 'Play'}
	</button>

	<div bind:this={scrollAreaElement} class="scroll-area">
		<div class="spacer">hi hi hi</div>
		<div class="chapter-text font-serif text-[5vh] text-white">
			{#each lines as line}
				{#if line.wordTimings}
					{#each line.wordTimings as wordTiming}
						<span class="opacity-50" data-time={wordTiming.start}>{wordTiming.word}</span>&nbsp;
					{/each}
				{/if}
				<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
			{/each}
		</div>
		<div class="spacer" />
	</div>
</div>

<Audio
	audioSources={chapterData.voiceOver.files}
	{isPlaying}
	maxVolume={maxVolumeSpeech}
	targetTime={0}
	bind:currentTime
/>

<Audio audioSources={chapterData.ambientTracks[0].files} {isPlaying} maxVolume={maxVolumeMusic} />

<style>
	:global([data-time]) {
		/* transition: color 800ms; */
		transition: opacity 800ms;
	}

	:global(body.cursor-grabbing-important *) {
		cursor: grabbing !important;
	}

	div.scroll-wrapper {
		width: 100vw;
		overflow-x: scroll;
		white-space: nowrap;
		height: 10vh;
		will-change: scroll-position;
	}

	div.scroll-area {
		cursor: grab;
		display: inline-block;
	}

	div.scroll-area:active {
		cursor: grabbing;
	}

	div.spacer {
		display: inline-block;
		width: 100vw;
	}

	div.chapter-text {
		display: inline-block;
	}
</style>
