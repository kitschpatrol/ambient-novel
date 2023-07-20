<svelte:options immutable={true} />

<script lang="ts">
	import Audio from '$lib/components/Audio.svelte';
	import type { ChapterData, LineData } from '$lib/schemas/bookSchema';
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
	let debug = false;
	let isSpringEnabled = true;

	let scrollWrapperElement: HTMLDivElement;
	let scrollAreaElement: HTMLDivElement;
	let chapterTextElement: HTMLDivElement;
	let activeWordElement: HTMLSpanElement | null;
	let scrollLeftBinding: number = 0; // optimization? or just use scrollLeft?

	let springConfig = {
		stiffness: 0.005,
		damping: 0.2 // setting > 1 gives crazy effect
	};

	let scrollTween = spring(0, springConfig);
	let scrollAreaWidth = 0;
	let rowWidth = 0;

	// frame loop
	let requestAnimationFrameId: number | null = null;
	let scrollLeft = 0;
	let scrollLeftDelta = 0;
	let intervalId: NodeJS.Timer | undefined;

	onMount(() => {
		// jump immediately to the correct line,
		// e.g. when switching chapters
		//scrollTo(0);

		const scrollBooster = new ScrollBooster({
			viewport: scrollWrapperElement,
			content: scrollAreaElement,
			direction: 'horizontal',
			scrollMode: 'native',
			bounce: false,
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
			// requestAnimationFrameId = requestAnimationFrame(loop);
			// console.profileEnd('loop');
		}

		intervalId = setInterval(function () {
			loop();
		}, 100);

		// loop();
	});

	onDestroy(() => {
		if (requestAnimationFrameId) {
			cancelAnimationFrame(requestAnimationFrameId);
		}

		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	// also includes the total duration as the last value
	$: timeCache = [
		...chapterData.lines
			.map((line) => (line.wordTimings ? line.wordTimings.map((word) => word.start) : []))
			.flat(),
		chapterData.voiceOver.durationSeconds
	];

	$: wordElements = chapterTextElement
		? Array.from(chapterTextElement.getElementsByTagName('span'))
		: [];

	function scrollTo(offset: number) {
		if (scrollWrapperElement && rowWidth > 0) {
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
		if (isSpringEnabled && scrollWrapperElement && !isSeeking) {
			scrollWrapperElement.scrollLeft = $scrollTween;
		}
	}

	// seek audio time to active word when scrolling
	$: {
		if (isSeeking) {
			// get active word under playhead
			const scrollCenter = scrollLeftBinding + rowWidth / 2;

			if (wordElements.length > 0 && scrollCenter < wordElements[0].offsetLeft) {
				targetTime = 0;
			} else {
				for (let i = 0; i < wordElements.length; i++) {
					if (scrollCenter >= wordElements[i].offsetLeft) {
						targetTime = timeCache[i];
					} else {
						break;
					}
				}
			}
		}
	}

	// get and highlight active word based on audio time
	$: {
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...
		// activeWordElement = null;

		for (let i = 0; i < wordElements.length; i++) {
			const element = wordElements[i];
			// const timeWordPrevious = i > 0 ? timeCache[i - 1] : 0;
			const timeWordCurrent = timeCache[i];
			const timeWordNext = timeCache[i + 1]; // note additional value at end of array

			if (currentTime >= timeWordCurrent && currentTime < timeWordNext) {
				// currently active word
				element.classList.add('current');
				element.classList.remove('read');
				activeWordElement = element;
			} else if (currentTime > timeWordCurrent) {
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

	// scroll to active word element
	$: {
		if (scrollWrapperElement) {
			const scrollOffset =
				(activeWordElement ? activeWordElement.offsetLeft + activeWordElement.offsetWidth / 2 : 0) -
				rowWidth / 2;
			if (isSeeking) {
				// update spring animation to prevent jumps
				scrollTween = spring(scrollLeft, springConfig);
			} else {
				scrollTo(scrollOffset);
			}
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

	let isUserHoldingDownFingerOrMouse = false;
	let wheelTimer: NodeJS.Timeout | undefined;
</script>

<div>
	<div
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
			console.log(e);

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
		class="scroll-wrapper no-scrollbar"
	>
		<div bind:this={scrollAreaElement} bind:clientWidth={scrollAreaWidth} class="scroll-area">
			<div class="spacer" />
			<div bind:this={chapterTextElement} class="chapter-text font-serif text-[5vh] text-white">
				{#each chapterData.lines as line}
					{#if line.wordTimings}
						{#each line.wordTimings as wordTiming}
							<span>{wordTiming.word}</span>&nbsp;
						{/each}
					{/if}
					&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				{/each}
			</div>
			<div class="spacer" />
		</div>
		<div
			class="mouse pointer-events-none fixed left-[50%] top-0 h-[10vh] w-2 touch-none bg-red-500"
		/>
	</div>
	<div class=" bg-slate-300">
		<button
			class="inline-block"
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
	:global(body.cursor-grabbing-important *) {
		cursor: grabbing !important;
	}

	/* Unread words */
	:global(div.chapter-text > span) {
		transition: opacity 800ms;
		opacity: 50%;
	}

	/* Read words */
	:global(div.chapter-text > span.read) {
		opacity: 100%;
	}

	:global(div.chapter-text > span.current) {
		color: orange;
		opacity: 100%;
	}

	div.scroll-wrapper {
		width: 100vw;
		overflow-x: scroll;
		white-space: nowrap;
		height: 10vh;
		will-change: scroll-position;
		/* background-color: #ffffff22; */
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
