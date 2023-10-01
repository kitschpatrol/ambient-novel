<svelte:options immutable={true} />

<script lang="ts">
	import { base } from '$app/paths';
	import Audio from '$lib/components/Audio.svelte';
	import AudioFadeProxy from '$lib/components/AudioFadeProxy.svelte';
	import AudioHowler from '$lib/components/AudioHowler.svelte';
	import AudioHowlerFadeProxy from '$lib/components/AudioHowlerFadeProxy.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { ChapterData } from '$lib/schemas/bookSchema';
	import { mapValue } from '$lib/utils/math/mapValue';
	import { faPause, faPlay, faRotateBack } from '@fortawesome/free-solid-svg-icons';
	import ScrollBooster from 'scrollbooster';
	import { onDestroy, onMount, tick } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import UAParser from 'ua-parser-js';

	export let chapterData: ChapterData;
	export let maxVolume = 1.0;
	export let isPlaying = false;
	export let isReset = true;
	export let currentTime = 0;
	export let chapterColor = '#ff0000';
	export let clickToTogglePlayPause = false;
	export let rowWidth = 0; // performance thing to set this externally...

	export let ready = () => {};

	export const reset = () => {
		isSeeking = false;
		isPlaying = false;
		// TODO hmm
		if (targetTime === 0) {
			currentTime = 0;
		} else {
			targetTime = 0;
		}

		scrollTo(0, false);
	};

	// config
	const isScrollBoosterEnabled = true;
	const debug = true;
	const isSpringEnabled = true;
	const springConfig = {
		stiffness: 0.005,
		damping: 0.2 // setting > 1 gives crazy effect
	};

	let targetTime = currentTime;
	let isSeeking = false;
	let scrollWrapperElement: HTMLDivElement;
	let scrollAreaElement: HTMLDivElement;
	let scrollLeftBinding: number = 0; // optimization? or just use scrollLeft?
	let scrollTween = spring(0, springConfig);
	let activeWordIndex = -1; // optimization vs. referencing the element... -1 means before first word, > wordElements.length means after last word
	let isUserHoldingDownFingerOrMouse = false;
	let wheelTimer: NodeJS.Timeout | undefined;
	let scrollBooster: ScrollBooster | undefined;

	// frame loop
	let scrollLeft = 0;
	let scrollLeftDelta = 0;
	let intervalId: NodeJS.Timer | undefined;
	let scrollBoosterStart = 0;

	const isMobile = (new UAParser().getDevice().type ?? '') === 'mobile';
	onMount(() => {
		// allow drag scrolling on desktop
		scrollBooster = isScrollBoosterEnabled
			? new ScrollBooster({
					viewport: scrollWrapperElement,
					content: scrollAreaElement,
					direction: 'horizontal',
					scrollMode: 'native',
					bounce: true,
					pointerMode: 'mouse',
					/* @ts-ignore */
					onPointerDown: (e) => {
						isSeeking = true;

						// seem to have to set this to avoid jumps
						scrollBooster?.setPosition({
							x: scrollWrapperElement.scrollLeft,
							y: 0
						});

						// track position to distinguish between click and drag
						scrollBoosterStart = e.position.x;
					},
					onPointerUp: (e) => {
						// Play / pause on click without drag
						if (clickToTogglePlayPause && isSeeking) {
							const dragDistance = Math.abs(scrollBoosterStart - e.position.x);
							// TODO Don't play / pause if we "stab" during an inertial scroll?
							if (dragDistance < 3) {
								isSeeking = false;
								isPlaying = !isPlaying;
							}
						}
					}
			  })
			: undefined;

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
					if (scrollBooster && scrollBooster.getState().isMoving) {
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

		tick().then(() => {
			ready();
		});
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId as any);
		}
	});

	function generateTimeCache(data: ChapterData, wordSpans: HTMLSpanElement[]): number[] {
		const timeCache: number[] = [];

		// Iterate through each span element
		wordSpans.forEach((span) => {
			const dataTime = span.getAttribute('data-time');

			if (dataTime === null) {
				console.warn(
					`data-time attribute is missing from word ${span.innerHTML} in chapter ${chapterData.title}`
				);
			} else {
				timeCache.push(parseFloat(dataTime));
			}
		});

		// Add the final time
		timeCache.push(chapterData.narrationTime.end);

		return timeCache;
	}

	function scrollTo(offset: number, rightOnly = true) {
		// ony scroll to the right
		if (
			scrollWrapperElement &&
			rowWidth > 0 &&
			(rightOnly ? offset > scrollWrapperElement.scrollLeft : true)
		) {
			// $scrollTween = offset - rowWidth / 2;

			if (isSpringEnabled) {
				$scrollTween = offset;
			} else {
				scrollWrapperElement.scrollLeft = offset;
			}
		}
	}

	function scrollFromTween(offset: number) {
		scrollWrapperElement.scrollLeft = offset;
	}

	function seekTimeFromActiveIndex(index: number) {
		if (index === -1) {
			// optimization
			// must be after, unread
			targetTime = timeCache[0];
		} else if (index > wordElements.length) {
			// optimization
			// must be before, read
			targetTime = timeCache[wordElements.length]; // gets final time from special extra element in timeCache
		} else {
			targetTime = timeCache[index];
		}
	}

	function seekTimeFromScroll(scrollLeft: number) {
		// todo optimize with active index?
		// get active word under playhead
		const scrollCenter = scrollLeft + rowWidth / 2;

		if (scrollCenter <= wordElements[0].offsetLeft) {
			// scrolled before first word... can't scroll back to chapter reading?
			targetTime = timeCache[0];
		} else if (
			scrollCenter >=
			wordElements[wordElements.length - 1].offsetLeft +
				wordElements[wordElements.length - 1].offsetWidth
		) {
			targetTime = timeCache[wordElements.length]; // gets final time from special extra element in timeCache
		} else {
			for (let i = 0; i < wordElements.length - 1; i++) {
				const element = wordElements[i];
				const nextElement = wordElements[i + 1];

				if (scrollCenter > element.offsetLeft && scrollCenter <= nextElement.offsetLeft) {
					if (scrollCenter <= element.offsetLeft + element.offsetWidth) {
						// guess intermediate time
						targetTime = mapValue(
							scrollCenter,
							element.offsetLeft,
							element.offsetLeft + element.offsetWidth,
							timeCache[i],
							timeCache[i + 1]
						);
					} else {
						targetTime = timeCache[i + 1];
					}

					break;
				}
			}
		}
	}

	function updateWordStyles(index: number) {
		// console.time('updateWordStyles');
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...

		if (index === -1) {
			// optimization
			// must be after, unread
			wordElements.forEach((element) => {
				element.classList.contains('read') && element.classList.remove('read');
				element.classList.contains('current') && element.classList.remove('current');
			});
		} else if (index > wordElements.length) {
			// optimization
			// must be before, read
			wordElements.forEach((element) => {
				!element.classList.contains('read') && element.classList.add('read');
				element.classList.contains('current') && element.classList.remove('current');
			});
		} else {
			for (let i = 0; i < wordElements.length; i++) {
				const element = wordElements[i];

				if (i < index) {
					// must be before, read
					!element.classList.contains('read') && element.classList.add('read');
					element.classList.contains('current') && element.classList.remove('current');
				} else if (i > index) {
					// must be after, unread
					element.classList.contains('read') && element.classList.remove('read');
					element.classList.contains('current') && element.classList.remove('current');
				} else {
					// must be equal, current
					!element.classList.contains('current') && element.classList.add('current');
					element.classList.contains('read') && element.classList.remove('read');
				}
			}
		}

		// console.timeEnd('updateWordStyles');
	}

	// TODO only search if time delta is greater than minimum word spacing?
	// prob not this is pretty fast
	function findActiveWordIndex(time: number) {
		if (time <= timeCache[0]) {
			// before first word
			activeWordIndex = -1;
		} else if (time >= timeCache[timeCache.length - 1]) {
			// after last word
			activeWordIndex = wordElements.length;
		} else {
			// somewhere between
			for (let i = 0; i < wordElements.length; i++) {
				if (time < timeCache[i]) {
					activeWordIndex = i - 1; // why - 1?
					return;
				}
			}
		}
	}

	// keep spring starting point up to date if we're scrolling manually
	function updateSpringStartPoint(startPoint: number) {
		scrollTween = spring(startPoint, springConfig);
	}

	// scroll to center of word active word element
	function scrollToActiveWordIndex(index: number) {
		let scrollOffset = 0;
		if (activeWordIndex > 0 && activeWordIndex < wordElements.length) {
			scrollOffset =
				wordElements[activeWordIndex].offsetLeft +
				wordElements[activeWordIndex].offsetWidth / 2 -
				rowWidth / 2;
		} else if (currentTime < timeCache[0]) {
			// before first word
			scrollOffset = wordElements[0].offsetLeft - rowWidth / 2;
		} else if (currentTime >= timeCache[timeCache.length - 1]) {
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

	//Reactive zone --------------------------
	$: wordElements =
		(scrollAreaElement &&
			Array.from(scrollAreaElement.querySelectorAll<HTMLSpanElement>('span[data-time]'))) ||
		undefined;

	// one element longer than the number of words, to accommodate the "end" time of the last word
	$: timeCache =
		(chapterData &&
			wordElements &&
			wordElements.length > 0 &&
			generateTimeCache(chapterData, wordElements)) ||
		[]; // hmm

	$: showChapterTitle = currentTime === 0; // TODO bugs here
	$: isReset = targetTime === 0 && currentTime === 0;
	$: isPlayingAndNotSeeking = isPlaying && !isSeeking; // only really play the audio if we're not seeking

	$: wordElements && wordElements.length > 0 && findActiveWordIndex(currentTime);
	$: wordElements && wordElements.length > 0 && updateWordStyles(activeWordIndex);
	$: isSeeking && updateSpringStartPoint(scrollLeftBinding);
	$: wordElements &&
		wordElements.length > 0 &&
		isPlayingAndNotSeeking &&
		scrollWrapperElement &&
		scrollToActiveWordIndex(activeWordIndex);

	// seek audio time to active word when scrolling
	$: wordElements && wordElements.length > 0 && isSeeking && seekTimeFromScroll(scrollLeftBinding);
	// $: wordElements &&
	// 	wordElements.length > 0 &&
	// 	isSeeking &&
	// 	seekTimeFromActiveIndex(activeWordIndex);
	$: isSpringEnabled &&
		scrollWrapperElement &&
		(!isSeeking || showChapterTitle || (scrollBooster && !scrollBooster.getState().isMoving)) &&
		scrollFromTween($scrollTween);
</script>

<div class="track">
	<div
		class="scroll-wrapper no-scrollbar"
		bind:this={scrollWrapperElement}
		on:scroll={(e) => {
			/* @ts-ignore */
			scrollLeftBinding = e.target.scrollLeft;
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
		on:wheel|passive={(e) => {
			// allow gesture / wheel scrolling, e.g. two finger drag on mac trackpad
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
		<!-- funky comments here to avoid implicit white space issues -->
		<!-- prettier-ignore -->
		<div bind:this={scrollAreaElement} class="scroll-area"><!--
		--><div class="spacer" /><!--
			-->{#each chapterData.lines as line, chapterIndex}<!--
					-->{@html line}<!--
		-->{/each}<!--
		--><div class="spacer" />
		</div>
	</div>

	{#if debug}
		<div
			class="mouse pointer-events-none absolute left-[50%] top-0 h-[10dvh] w-1 touch-none bg-red-500"
		/>
	{/if}

	{#if showChapterTitle}
		<h2
			style={`background-color: ${chapterColor}`}
			transition:fade={{ duration: 2500 }}
			class="chapter-title absolute left-0 top-0 h-full w-full text-center font-display tracking-wider text-white text-opacity-80 shadow-vm-shadow text-shadow"
		>
			<span class="max-sm:hidden">Chapter</span>
			{chapterData.index + 1}
			<span class="max-sm:hidden">:</span>
			{chapterData.title}
		</h2>
	{/if}

	<div class:w-full={isReset} class="absolute left-0 top-0 flex h-full">
		<Button
			isTransitionEnabled={true}
			icon={isPlaying ? faPause : faPlay}
			on:click={() => {
				isPlaying = !isPlaying;
			}}
		/>
	</div>

	{#if !isReset}
		<div class="absolute right-0 top-0 flex h-full">
			<Button icon={faRotateBack} on:click={reset} isTransitionEnabled={true} />
		</div>
	{/if}

	{#if debug}
		<div
			class="pointer-events-none absolute left-0 top-0 h-full cursor-none touch-none text-red-400"
		>
			<p>activeWordIndex: {activeWordIndex}</p>
			<p>isplaying: {isPlayingAndNotSeeking}</p>
			<p>targetTime: {Math.round(targetTime)}</p>
			<p>currentTime: {Math.round(currentTime)}</p>
			<p>seeking: {isSeeking}</p>
			<p>isUserHoldingDownFingerOrMouse: {isUserHoldingDownFingerOrMouse}</p>
			<!-- <p class="inline-block">scrollLeftDelta: {scrollLeftDelta}</p> -->
		</div>
	{/if}
</div>

{#if isMobile}
	<Audio
		audioSources={chapterData.audio.files.map((file) => `${base}/${file}`)}
		isPlaying={isPlayingAndNotSeeking}
		{maxVolume}
		{targetTime}
		bind:currentTime
		on:ended
		on:ended={() => {
			console.log('ENDED!');
			// handle this in parent instead
			//reset();
		}}
	/>
{:else}
	<AudioFadeProxy
		audioSources={chapterData.audio.files.map((file) => `${base}/${file}`)}
		isPlaying={isPlayingAndNotSeeking}
		{maxVolume}
		{targetTime}
		bind:currentTime
		on:ended
		on:ended={() => {
			console.log('ENDED!');
			// handle this in parent instead
			//reset();
		}}
	/>
{/if}

<style>
	div.track {
		width: 100vw;
		height: calc(100dvh / 12);
		position: relative;
		/* background-color: white; */
		background: linear-gradient(0deg, #f8f8f8 0%, white 13%, white 100%);
		user-select: none;
	}

	:global(body.cursor-grabbing-important *) {
		cursor: grabbing !important;
	}

	/* Horizontal space between lines */
	:global(div.scroll-area span.line) {
		margin-left: 5em;
	}

	/* Manual bullets since browser won't draw them on inline lists */
	:global(div.scroll-area span.list)::before {
		content: '•';
		margin-right: 0.25em;
	}

	:global(div.scroll-area span.list) {
		margin-left: 1em;
	}

	/* Unread words */
	/* Changing opacity here was forcing reflows in safari */
	:global(div.scroll-area span) {
		transition: color 800ms;
		color: lightgray;
	}

	/* Read words */
	/* TODO THIS IS WHAT IS SLOW IN SAFARI */
	:global(div.scroll-area span.read) {
		color: black;
	}

	/* TODO THIS IS WHAT IS SLOW IN SAFARI */
	:global(div.scroll-area span.current) {
		color: black;
	}

	div.scroll-wrapper {
		/* height: 100%; */
		overflow-x: scroll;
		white-space: nowrap;
		will-change: scroll-position; /* harms or helps? */
		/* background-color: #ffffff22; */
		cursor: grab;
		mask-image: linear-gradient(90deg, transparent, rgba(0, 0, 0, 1) 10% 90%, transparent);
	}

	div.spacer {
		width: 50vw;
		display: inline-block;
	}

	div.scroll-area {
		color: black;
		font-family: serif;
		font-size: min(calc(100dvh / 36), 1.75rem);
		line-height: calc(100dvh / 12);
		height: calc(100dvh / 12);
		pointer-events: none;
		touch-action: none;
	}

	div.scroll-wrapper:active {
		cursor: grabbing;
	}

	h2.chapter-title {
		font-size: min(calc(100dvh / 36), 1.75rem);
		line-height: calc(100dvh / 12);
	}
</style>
