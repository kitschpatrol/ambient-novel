<svelte:options immutable={true} />

<script lang="ts">
	import Audio from '$lib/components/Audio.svelte';
	import type { ChapterData, LineData } from '$lib/schemas/bookSchema';
	import { mapValue } from '$lib/utils/math/mapValue';
	import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
	import ScrollBooster from 'scrollbooster';
	import { onDestroy, onMount } from 'svelte';
	import { spring } from 'svelte/motion';

	export let chapterData: ChapterData;
	export let maxVolumeMusic = 0.1;
	export let maxVolumeSpeech = 1.0;
	export let isPlaying = false;

	export let currentTime = 0;
	let currentTimeMusic = currentTime;
	let targetTime = currentTime;
	let targetTimeMusic = targetTime;
	let isSeeking = false;
	const debug = false;
	let isSpringEnabled = true;

	let scrollWrapperElement: HTMLDivElement;
	let scrollAreaElement: HTMLDivElement;
	let activeWordElement: HTMLSpanElement | null;
	let scrollLeftBinding: number = 0; // optimization? or just use scrollLeft?

	let springConfig = {
		stiffness: 0.005,
		damping: 0.2 // setting > 1 gives crazy effect
	};

	let scrollTween = spring(0, springConfig);
	let scrollAreaWidth = 0;
	let rowWidth = 0;
	let isUserHoldingDownFingerOrMouse = false;
	let wheelTimer: NodeJS.Timeout | undefined;

	// frame loop
	let scrollLeft = 0;
	let scrollLeftDelta = 0;
	let intervalId: NodeJS.Timer | undefined;

	onMount(() => {
		// allow drag scrolling on desktop
		const scrollBooster = new ScrollBooster({
			viewport: scrollWrapperElement,
			content: scrollAreaElement,
			direction: 'horizontal',
			scrollMode: 'native',
			bounce: true,
			pointerMode: 'mouse',
			/* @ts-ignore */
			onPointerDown: () => {
				isSeeking = true;
			}
		});

		// watch scroll velocity
		// have to do this instead of an on:scroll handler so we can calculate velocity / delta
		function loop() {
			// console.profile('loop');

			if (scrollWrapperElement && isSeeking) {
				scrollLeftDelta = scrollWrapperElement.scrollLeft - scrollLeft;
				scrollLeft = scrollWrapperElement.scrollLeft;

				if (!isUserHoldingDownFingerOrMouse && scrollLeftDelta === 0) {
					isSeeking = false;

					// stop the scroll booster which can "flicker" between 0 and .5 as it slows down
					if (scrollBooster.getState().isMoving) {
						scrollBooster.setPosition({
							x: scrollLeft,
							y: 0
						});
					}
				}
			}
			// console.profileEnd('loop');
		}

		intervalId = setInterval(function () {
			loop();
		}, 100);
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	$: timeCacheStart = chapterData.lines
		.map((line) => (line.wordTimings ? line.wordTimings.map((word) => word.start) : []))
		.flat();

	$: timeCacheEnd = chapterData.lines
		.map((line) => (line.wordTimings ? line.wordTimings.map((word) => word.end) : []))
		.flat();

	$: wordElements = scrollAreaElement
		? Array.from(scrollAreaElement.getElementsByTagName('span'))
		: [];

	function scrollTo(offset: number) {
		// ony scroll to the right
		if (scrollWrapperElement && rowWidth > 0 && offset > scrollWrapperElement.scrollLeft) {
			// $scrollTween = offset - rowWidth / 2;
			if (isSpringEnabled) {
				$scrollTween = offset;
			} else {
				scrollWrapperElement.scrollLeft = offset;
			}
			// scrollWrapperElement.scrollLeft = $scrollTween;
		}
	}

	$: {
		if (isSpringEnabled && scrollWrapperElement && isPlayingAndNotSeeking) {
			scrollWrapperElement.scrollLeft = $scrollTween;
		}
	}

	// seek audio time to active word when scrolling
	$: {
		if (isSeeking && wordElements.length > 0) {
			// get active word under playhead
			const scrollCenter = scrollLeftBinding + rowWidth / 2;

			if (scrollCenter <= wordElements[0].offsetLeft) {
				// scrolled before first word
				targetTime = timeCacheStart[0];
			} else if (
				scrollCenter >=
				wordElements[wordElements.length - 1].offsetLeft +
					wordElements[wordElements.length - 1].offsetWidth
			) {
				targetTime = timeCacheEnd[wordElements.length - 1]; // gets final time
			} else {
				wordElements.find((element, index) => {
					if (
						scrollCenter > element.offsetLeft &&
						scrollCenter <= element.offsetLeft + element.offsetWidth
					) {
						// guess intermediate time
						targetTime = mapValue(
							scrollCenter,
							element.offsetLeft,
							element.offsetLeft + element.offsetWidth,
							timeCacheStart[index],
							timeCacheEnd[index]
						);
						return true;
					}
				});
			}
		}
	}

	// get and highlight active word based on audio time
	$: {
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...
		// activeWordElement = null;
		if (currentTime <= timeCacheStart[0]) {
			// before first word
			activeWordElement = null;

			wordElements.forEach((element) => {
				element.classList.remove('read');
				element.classList.remove('current');
			});
		} else if (currentTime >= timeCacheEnd[timeCacheEnd.length - 1]) {
			// after last word
			activeWordElement = null;

			wordElements.forEach((element) => {
				element.classList.add('read');
				element.classList.remove('current');
			});
		} else {
			// somewhere betwixt

			for (let i = 0; i < wordElements.length; i++) {
				const element = wordElements[i];

				if (currentTime >= timeCacheStart[i] && currentTime < timeCacheEnd[i]) {
					// currently active word
					element.classList.add('current');
					element.classList.remove('read');
					activeWordElement = element;
				} else if (currentTime > timeCacheEnd[i]) {
					// read
					element.classList.add('read');
					element.classList.remove('current');
				} else {
					// unread
					element.classList.remove('read');
					element.classList.remove('current');
				}
			}
		}
	}

	// keep spring starting point up to date if we're scrolling manually
	$: {
		if (isSeeking) {
			scrollTween = spring(scrollLeftBinding, springConfig);
		}
	}

	// scroll to active word element
	$: {
		if (isPlayingAndNotSeeking && scrollWrapperElement) {
			// scroll to center of word

			let scrollOffset = 0;
			if (activeWordElement) {
				scrollOffset =
					activeWordElement.offsetLeft + activeWordElement.offsetWidth / 2 - rowWidth / 2;
			} else if (currentTime < timeCacheStart[0]) {
				// before first word
				scrollOffset = wordElements[0].offsetLeft - rowWidth / 2;
			} else if (currentTime >= timeCacheEnd[timeCacheEnd.length - 1]) {
				// after last word
				scrollOffset =
					wordElements[wordElements.length - 1].offsetLeft +
					wordElements[wordElements.length - 1].offsetWidth -
					rowWidth / 2;
			} else {
				// do nothing
				scrollOffset = scrollWrapperElement.scrollLeft;
			}

			scrollTo(scrollOffset);
		}
	}

	// keep music in sync with audio (until they're one file)
	$: {
		if (isSeeking) {
			targetTimeMusic = targetTime;
		}
	}

	// only really play the audio if we're not seeking
	$: isPlayingAndNotSeeking = isPlaying && !isSeeking;
</script>

<div class="track">
	<div
		class="scroll-wrapper no-scrollbar"
		bind:this={scrollWrapperElement}
		bind:clientWidth={rowWidth}
		on:scroll={(e) => {
			/* @ts-ignore */
			scrollLeftBinding = e.target.scrollLeft;
		}}
		on:ended={(e) => {
			console.log(`ended`);
		}}
		on:pointerdown={(e) => {
			isSeeking = true;
			isUserHoldingDownFingerOrMouse = true;
			/* @ts-ignore */
			e.target.setPointerCapture(e.pointerId);
		}}
		on:pointercancel={(e) => {
			isUserHoldingDownFingerOrMouse = false;
		}}
		on:pointerup={(e) => {
			isUserHoldingDownFingerOrMouse = false;
		}}
		on:wheel={(e) => {
			if (Math.abs(e.deltaX) > 0) {
				isSeeking = true;
				isUserHoldingDownFingerOrMouse = true;

				// Clear the timeout if it's already set
				if (wheelTimer !== undefined) {
					clearTimeout(wheelTimer);
				}

				// Set the new timeout
				wheelTimer = setTimeout(function () {
					wheelTimer = undefined;
					isUserHoldingDownFingerOrMouse = false;
				}, 200); // 200ms delay; adjust as needed
			}
		}}
	>
		<!-- prettier-ignore -->
		<div bind:this={scrollAreaElement} bind:clientWidth={scrollAreaWidth} class="scroll-area"><!--
		--><div class="spacer" /><!--
			-->{#each chapterData.lines as line, chapterIndex}<!--
				-->{#if line.textStack}<!--
					-->{@html line.textStack}<!--
				-->{/if}<!--
				-->{#if chapterIndex < chapterData.lines.length - 1}<!--
					-->&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<!--
				-->{/if}<!--
		-->{/each}<!--
		--><div class="spacer" />
		</div>
	</div>

	{#if debug}
		<div
			class="mouse pointer-events-none absolute left-[50%] top-0 h-[10vh] w-1 touch-none bg-red-500"
		/>
	{/if}
	<div class="controls">
		<button
			on:click={(e) => {
				isPlaying = !isPlaying;
			}}
		>
			{isPlaying ? 'Pause' : 'Play'}
		</button>

		{#if debug}
			<p class="inline-block">seeking: {isSeeking}</p>
			<p class="inline-block">scrollLeftDelta: {scrollLeftDelta}</p>
			<p class="inline-block">down: {isUserHoldingDownFingerOrMouse}</p>
			<p class="inline-block">targetTime: {targetTime}</p>
			<p class="inline-block">currentTime: {currentTime}</p>
			<p class="inline-block">activeWordElement: {activeWordElement}</p>
		{/if}
	</div>
</div>

<Audio
	audioSources={chapterData.voiceOver.files}
	isPlaying={isPlayingAndNotSeeking}
	maxVolume={maxVolumeSpeech}
	{targetTime}
	bind:currentTime
/>

<Audio
	audioSources={chapterData.ambientTracks[0].files}
	isPlaying={isPlayingAndNotSeeking}
	targetTime={targetTimeMusic}
	maxVolume={maxVolumeMusic}
	bind:currentTime={currentTimeMusic}
/>

<style>
	div.track {
		background-color: red;
		width: 100vw;
		height: 10vh;
		position: relative;
	}

	:global(body.cursor-grabbing-important *) {
		cursor: grabbing !important;
	}

	/* Unread words */
	:global(div.scroll-area > span) {
		transition: opacity 800ms;
		opacity: 50%;
	}

	/* Read words */
	:global(div.scroll-area > span.read) {
		opacity: 100%;
	}

	:global(div.scroll-area > span.current) {
		color: orange;
		opacity: 100%;
	}

	div.scroll-wrapper {
		background-color: green;
		/* height: 100%; */
		overflow-x: scroll;
		white-space: nowrap;
		will-change: scroll-position; /* harms or helps? */
		/* background-color: #ffffff22; */
		cursor: grab;
	}

	div.spacer {
		width: 50vw;
		display: inline-block;
	}

	div.scroll-area {
		color: white;
		font-family: serif;
		font-size: 5vh;
		line-height: 10vh;
		height: 10vh;
	}

	div.scroll-wrapper:active {
		cursor: grabbing;
	}

	div.controls {
		position: absolute;
		left: 0;
		top: 0;
	}
</style>
