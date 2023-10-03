<!-- WAT? -->
<svelte:options immutable={true} />

<script lang="ts">
	import { base } from '$app/paths';
	import Audio from '$lib/components/Audio.svelte';
	import AudioFadeProxy from '$lib/components/AudioFadeProxy.svelte';
	import Button from '$lib/components/Button.svelte';
	import ChapterCover from '$lib/components/ChapterCover.svelte';
	import * as config from '$lib/config';
	import type { ChapterData } from '$lib/schemas/bookSchema';
	import { faPause, faPlay, faRotateBack } from '@fortawesome/free-solid-svg-icons';
	import ScrollBooster from 'scrollbooster';
	import { onDestroy, onMount, tick } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import UAParser from 'ua-parser-js';

	export let chapterData: ChapterData;
	export let isPlaying = false;
	export let isReset = true;
	export let currentTime = 0;
	export let chapterColor = '#ff0000';
	export let rowWidth = 0; // performance thing to set this externally...
	export let targetTime = currentTime;
	export let ready = () => {};

	// config
	const isMobile = (new UAParser().getDevice().type ?? '') === 'mobile';
	const clickToTogglePlayPause = false;
	const isScrollBoosterEnabled = true;
	const debug = true;
	const isSpringEnabled = true;
	const springConfig = {
		stiffness: 0.005,
		damping: 0.2 // setting > 1 gives crazy effect
	};

	let isSeeking = false;
	let scrollWrapperElement: HTMLDivElement;
	let scrollLeftBinding: number = 0; // optimization? or just use scrollLeft?
	let scrollTween = spring(0, springConfig);
	let activeWordIndex = -1; // optimization vs. referencing the element... -1 means before first word, > wordElements.length means after last word
	let wheelTimer: NodeJS.Timeout | undefined;
	let isChapterCoverVisible = true;

	let scrollBooster: ScrollBooster | undefined;
	let timeCache: number[]; // one element longer than the number of words, to accommodate the "end" time of the last word
	let wordElements: HTMLSpanElement[];
	let isMounted = false;
	let scrollAreaElement: HTMLDivElement;
	let isLoaded = false;

	// frame loop
	let isUserHoldingDownFingerOrMouse = false;
	let scrollLeft = 0;
	let scrollLeftDelta = 0;
	let intervalId: NodeJS.Timer | undefined;
	let scrollBoosterStart = 0;

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
			if (scrollWrapperElement && !isReset && isSeeking) {
				scrollLeftDelta = scrollWrapperElement.scrollLeft - scrollLeft;
				scrollLeft = scrollWrapperElement.scrollLeft;

				if (!isUserHoldingDownFingerOrMouse && scrollLeftDelta === 0) {
					// stop the scroll booster which can "flicker" between 0 and .5 as it slows down
					if (scrollBooster && scrollBooster.getState().isMoving) {
						scrollBooster.setPosition({
							x: scrollLeft,
							y: 0
						});
					}

					// optimization, only seek audio at the end of a scroll input
					targetTime = timeFromWordIndex(activeWordIndex);
					currentTime = targetTime;
					isSeeking = false;
				}
			}
			// console.profileEnd('loop');
		}

		intervalId = setInterval(function () {
			loop();
		}, 100);

		wordElements = Array.from(
			scrollAreaElement.querySelectorAll<HTMLSpanElement>('span[data-time]')
		);

		timeCache = generateTimeCache(chapterData, wordElements) as number[];

		isMounted = true;
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

	function scrollToOffset(offset: number, rightOnly = true, immediate = false) {
		// only scroll to the right
		if (
			scrollWrapperElement &&
			rowWidth > 0 &&
			(rightOnly ? offset >= scrollWrapperElement.scrollLeft : true)
		) {
			if (isSpringEnabled && !immediate) {
				// this was the trick for the flashes...
				tick().then(() => {
					$scrollTween = offset;
				});
			} else {
				scrollWrapperElement.scrollLeft = offset;
				if (immediate) {
					setSpringStartPoint(offset);
				}
			}
		}
	}

	// ==== Time / Word index / Scroll offset conversions ============================

	// TODO only search if time delta is greater than minimum word spacing?
	// prob not this is pretty fast
	function wordIndexFromTime(time: number): number {
		if (time <= timeCache[0]) {
			// before first word
			return -1;
		} else if (time >= timeCache[timeCache.length - 1]) {
			// after last word
			return wordElements.length;
		} else {
			// somewhere between
			for (let i = 0; i < wordElements.length; i++) {
				if (time >= timeCache[i] && time < timeCache[i + 1]) {
					return i;
				}
			}
		}

		console.warn('issues');
		return 0;
	}

	function timeFromWordIndex(index: number): number {
		if (index < 0) return timeCache[0];
		if (index > wordElements.length) return timeCache[wordElements.length];
		return timeCache[index];
	}

	function wordIndexFromScrollOffset(offset: number): number {
		const scrollOffset = offset + rowWidth / 2;

		// before first word
		if (scrollOffset <= wordElements[0].offsetLeft) {
			return -1;
		}

		// after last word
		if (
			scrollOffset >=
			wordElements[wordElements.length - 1].offsetLeft +
				wordElements[wordElements.length - 1].offsetWidth
		) {
			return wordElements.length;
		}

		// first word
		// average of right edge of curent word and left edge of previous
		if (
			scrollOffset <
			(wordElements[0].offsetLeft + wordElements[0].offsetWidth + wordElements[1].offsetLeft) / 2
		) {
			return 0;
		}

		// last word
		if (
			scrollOffset >=
			(wordElements[wordElements.length - 1].offsetLeft +
				wordElements[wordElements.length - 2].offsetLeft +
				wordElements[wordElements.length - 2].offsetWidth) /
				2
		) {
			return wordElements.length - 1;
		}

		// between
		// TODO consider whether any point after the word shoould be the next word...
		for (let i = 1; i < wordElements.length - 1; i++) {
			// average of right edge of previous word and left edge of current
			// const leftEdge =
			// 	(wordElements[i - 1].offsetLeft +
			// 		wordElements[i - 1].offsetWidth +
			// 		wordElements[i].offsetLeft) /
			// 	2;
			const rightEdge =
				(wordElements[i].offsetLeft +
					wordElements[i].offsetWidth +
					wordElements[i + 1].offsetLeft) /
				2;

			if (scrollOffset <= rightEdge) {
				return i;
			}
		}

		console.warn('issues!');
		return 0;
	}

	function scrollOffsetFromWordIndex(index: number): number {
		// before first word
		if (index < 0) {
			return wordElements[0].offsetLeft - rowWidth / 2;
		}

		// after last word
		if (index >= wordElements.length) {
			return (
				wordElements[wordElements.length - 1].offsetLeft +
				wordElements[wordElements.length - 1].offsetWidth -
				rowWidth / 2
			);
		}

		// between, use the center of the word
		return wordElements[index].offsetLeft + wordElements[index].offsetWidth / 2 - rowWidth / 2;
	}

	// ==== Reactive setters ========================================================

	function setWordStylesFromActiveWordIndex(index: number) {
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

	// keep spring starting point up to date if we're scrolling manually
	function setSpringStartPoint(startPoint: number) {
		scrollTween = spring(startPoint, springConfig);
	}

	function setActiveWordIndex(index: number) {
		activeWordIndex = index;
	}

	function setScrollOffset(offset: number) {
		scrollWrapperElement.scrollLeft = offset;
	}

	// react to reset being set
	function setReset(reset: boolean) {
		if (reset) {
			// isPlaying = true; // force invalidation
			isPlaying = false;
			// placeholder's transition completion does the rest
		}
	}

	function setPlaying(playing: boolean) {
		if (playing) {
			// isReset = true; // force invalidation
			isReset = false;
		}
	}

	// if we set target time while reset, react immediately
	// todo mobile safari bugs?
	function setTargetTime(time: number) {
		if (isMounted && isReset && isChapterCoverVisible) {
			const wordIndex = wordIndexFromTime(time);
			const scrollPosition = wordIndex === -1 ? 0 : scrollOffsetFromWordIndex(wordIndex);
			scrollToOffset(scrollPosition, false, true);
		}
	}

	function setLoaded(loaded: boolean) {
		if (loaded) {
			tick().then(() => {
				console.log('ready', loaded);
				ready();
			});
		}
	}

	//Reactive zone --------------------------

	$: setLoaded(isLoaded);
	$: setPlaying(isPlaying);
	$: setReset(isReset);
	$: setTargetTime(targetTime);
	$: isPlayingAndNotSeeking = isPlaying && !isSeeking; // only really play the audio if we're not seeking

	// While Playing / paused --------
	$: isMounted && !isSeeking && setActiveWordIndex(wordIndexFromTime(currentTime));
	$: isMounted &&
		isPlayingAndNotSeeking &&
		scrollToOffset(scrollOffsetFromWordIndex(activeWordIndex));

	// seek audio time to active word when scrolling
	// bad for performance?
	// $: wordElements && wordElements.length > 0 && isSeeking && seekTimeFromScroll(scrollLeftBinding);

	// save the play time when we pause
	$: isMounted && !isPlaying && (targetTime = currentTime);
	$: isMounted && isSpringEnabled && !isSeeking && setScrollOffset($scrollTween);

	// Special seeking behavior ------
	$: isMounted && isSeeking && setSpringStartPoint(scrollLeftBinding);
	$: isMounted && isSeeking && setActiveWordIndex(wordIndexFromScrollOffset(scrollLeftBinding));

	// style
	$: isMounted && setWordStylesFromActiveWordIndex(activeWordIndex);
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

	{#if isReset}
		<div
			transition:fade={{ duration: config.chapterCoverTransitionDuration }}
			on:introend={() => {
				isChapterCoverVisible = true;
				targetTime = -1; // force reactive update...
				targetTime = 0; // go even further than the first scroll pos
			}}
			on:outrostart={() => {
				isChapterCoverVisible = false;
			}}
		>
			<ChapterCover {chapterColor} {chapterData} />
		</div>
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
			<Button
				icon={faRotateBack}
				on:click={() => {
					isReset = true;
				}}
				isTransitionEnabled={true}
			/>
		</div>
	{/if}

	{#if debug}
		<div
			class="pointer-events-none absolute left-0 top-0 h-full cursor-none touch-none text-xs text-red-400"
		>
			<p>isUserHoldingDownFingerOrMouse: {isUserHoldingDownFingerOrMouse}</p>
			<p>isplaying: {isPlayingAndNotSeeking}</p>
			<p>seeking: {isSeeking}</p>
			<p>targetTime: {Math.round(targetTime)}</p>
			<p>currentTime: {Math.round(currentTime)}</p>
			<p>isReset: {isReset}</p>
			<p>activeWordIndex: {activeWordIndex}</p>
			<!-- <p class="inline-block">scrollLeftDelta: {scrollLeftDelta}</p> -->
		</div>
	{/if}
</div>

{#if isMobile}
	<Audio
		audioSources={chapterData.audio.files.map((file) => `${base}/${file}`)}
		isPlaying={isPlayingAndNotSeeking}
		bind:currentTime
		{targetTime}
		on:ended
		on:canplaythrough={() => {
			isLoaded = true;
		}}
	/>
{:else}
	<AudioFadeProxy
		audioSources={chapterData.audio.files.map((file) => `${base}/${file}`)}
		isPlaying={isPlayingAndNotSeeking}
		bind:currentTime
		{targetTime}
		on:ended
		on:canplaythrough={() => {
			isLoaded = true;
		}}
	/>
{/if}

<style lang="postcss">
	div.track {
		width: 100vw;
		height: calc(100dvh / 12);
		position: relative;
		/* background-color: white; */
		background: linear-gradient(0deg, #f8f8f8 0%, white 13%, white 100%);
		user-select: none;
		/* autoprefixer? */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
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

		/* Nothing works */
		/* -webkit-touch-callout: none;
		-webkit-text-size-adjust: none;
		-webkit-user-select: none;
		user-select: none;
		-webkit-user-callout: none;
		-webkit-user-drag: none;
		-webkit-user-modify: none;
		-webkit-highlight: none; */
	}

	div.scroll-wrapper:active {
		cursor: grabbing;
	}
</style>
