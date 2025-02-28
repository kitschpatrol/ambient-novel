<svelte:options immutable={true} />

<script lang="ts">
	import { faPause, faPlay, faRotateBack } from '@fortawesome/free-solid-svg-icons'
	import { browser } from '$app/environment'
	import { base } from '$app/paths'
	import Audio from '$lib/components/Audio.svelte'
	// Import AudioFadeProxy from '$lib/components/AudioFadeProxy.svelte';
	import Button from '$lib/components/Button.svelte'
	import ChapterCover from '$lib/components/ChapterCover.svelte'
	import Starfield from '$lib/components/Starfield.svelte'
	import { chapterCoverTransitionDuration } from '$lib/config'
	import type { ChapterData } from '$lib/schemas/book-schema'
	import { fastFadeFromJs } from '$lib/utils/transition/fast-fade-from-js'
	import { fastFadeJs } from '$lib/utils/transition/fast-fade-js'
	import ScrollBooster from 'scrollbooster'
	import { onDestroy, onMount, tick } from 'svelte'
	import { spring } from 'svelte/motion'
	import tinycolor from 'tinycolor2'
	import UaParser from 'ua-parser-js'

	export let chapterData: ChapterData
	export let isPlaying = false
	export let isReset = true
	export let currentTime = 0
	export let chapterColor = '#ff0000'
	export let rowWidth = 0 // Performance thing to set this externally...
	export let targetTime = currentTime

	export let ready = () => {}

	// Config
	const showTextBeforeNarrationStarts = false
	const isStarfieldEnabled = true
	const isMobile = (new UaParser().getDevice().type ?? '') === 'mobile'
	// Const clickToTogglePlayPause = false;
	const debug = false
	const isSpringEnabled = true
	const springConfig = {
		damping: 0.2, // Setting > 1 gives crazy effect
		stiffness: 0.005,
	}

	let isSeeking = false
	let scrollWrapperElement: HTMLDivElement
	let scrollLeftBinding = 0 // Optimization? or just use scrollLeft?
	let scrollTween = spring(0, springConfig)
	let activeWordIndex = -1 // Optimization vs. referencing the element... -1 means before first word, > wordElements.length means after last word
	let wheelTimer: NodeJS.Timeout | undefined
	let isChapterCoverVisible = true

	let timeCache: number[] // One element longer than the number of words, to accommodate the "end" time of the last word
	let wordElements: HTMLSpanElement[]
	let isMounted = false
	let scrollAreaElement: HTMLDivElement
	let isLoaded = false

	// Scroll booster / frame loop
	let scrollBooster: ScrollBooster
	let isUserHoldingDownFingerOrMouse = false
	let scrollLeft = 0
	let scrollLeftDelta = 0
	let intervalId: NodeJS.Timer | undefined
	// Let scrollBoosterStart = 0;

	// TODO does this help?
	// wtf...
	// https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay
	if (browser && isMobile) {
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext

		const audioContext = new AudioContext()
	}

	onMount(() => {
		// Allow drag scrolling on desktop
		scrollBooster = new ScrollBooster({
			bounce: true,
			content: scrollAreaElement,
			direction: 'horizontal',
			onPointerDown() {
				// Doesn't fire on ios mobile while inertial scroll animation is playing
				isSeeking = true

				// Seem to have to set this to avoid jumps
				scrollBooster.setPosition({
					x: scrollWrapperElement.scrollLeft,
					y: 0,
				})

				// Track position to distinguish between click and drag
				// scrollBoosterStart = e.position.x;
			},
			pointerMode: 'mouse',
			scrollMode: 'native',
			viewport: scrollWrapperElement,
			// OnPointerUp: (e) => {
			// 	// Play / pause on click without drag
			// 	if (clickToTogglePlayPause && isSeeking) {
			// 		const dragDistance = Math.abs(scrollBoosterStart - e.position.x);
			// 		// TODO Don't play / pause if we "stab" during an inertial scroll?
			// 		if (dragDistance < 3) {
			// 			isSeeking = false;
			// 			isPlaying = !isPlaying;
			// 		}
			// 	}
			// }
		})

		// Watch scroll velocity
		// have to do this instead of an on:scroll handler so we can calculate velocity / delta
		function loop() {
			if (!isReset && isSeeking) {
				scrollLeftDelta = scrollWrapperElement.scrollLeft - scrollLeft
				scrollLeft = scrollWrapperElement.scrollLeft

				// Doesn't really work on ios...
				if (!isUserHoldingDownFingerOrMouse && scrollLeftDelta === 0) {
					// Stop the scroll booster which can "flicker" between 0 and .5 as it slows down
					// todo is isMoving ever true? isDragging is broken
					// if (scrollBooster.getState().isMoving) {
					scrollBooster.setPosition({
						x: scrollLeft,
						y: 0,
					})
					// }

					// optimization, only seek audio at the end of a scroll input
					targetTime = timeFromWordIndex(activeWordIndex)
					currentTime = targetTime
					isSeeking = false
				}
			}
		}

		intervalId = setInterval(() => {
			loop()
		}, 100)

		wordElements = [
			...// @ts-expect-error - Iterator?
			scrollAreaElement.querySelectorAll<HTMLSpanElement>('span[data-time]'),
		]

		timeCache = generateTimeCache(chapterData, wordElements)

		isMounted = true
	})

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId as any)
		}
	})

	function generateTimeCache(data: ChapterData, wordSpans: HTMLSpanElement[]): number[] {
		const timeCache: number[] = []

		// Iterate through each span element
		for (const span of wordSpans) {
			const dataTime = span.dataset.time

			if (dataTime === null || dataTime === undefined) {
				console.warn(
					`data-time attribute is missing from word ${span.innerHTML} in chapter ${chapterData.title}`,
				)
			} else {
				timeCache.push(Number.parseFloat(dataTime))
			}
		}

		// Add the final time
		timeCache.push(chapterData.narrationTime.end)

		return timeCache
	}

	function scrollToOffset(offset: number, rightOnly = true, immediate = false) {
		// Only scroll to the right
		if (
			scrollWrapperElement &&
			rowWidth > 0 &&
			(rightOnly ? offset >= scrollWrapperElement.scrollLeft : true)
		) {
			if (isSpringEnabled && !immediate) {
				// This was the trick for the flashes...

				tick().then(() => {
					$scrollTween = offset
				})
			} else {
				scrollWrapperElement.scrollLeft = offset
				if (immediate) {
					setSpringStartPoint(offset)
				}
			}
		}
	}

	// ==== Time / Word index / Scroll offset conversions ============================

	// TODO only search if time delta is greater than minimum word spacing?
	// prob not this is pretty fast
	function wordIndexFromTime(time: number): number {
		if (time <= timeCache[0]) {
			// Before first word
			return -1
		}

		// @ts-expect-error trusted access
		if (time >= timeCache.at(-1)) {
			// After last word
			return wordElements.length
		}

		// Somewhere between
		for (let i = 0; i < wordElements.length; i++) {
			if (time >= timeCache[i] && time < timeCache[i + 1]) {
				return i
			}
		}

		console.warn('issues')
		return 0
	}

	function timeFromWordIndex(index: number): number {
		if (index < 0) return timeCache[0]
		if (index > wordElements.length) return timeCache[wordElements.length]
		return timeCache[index]
	}

	function wordIndexFromScrollOffset(offset: number): number {
		const scrollOffset = offset + rowWidth / 2

		// Before first word
		if (scrollOffset <= wordElements[0].offsetLeft) {
			return -1
		}

		// After last word
		// @ts-expect-error trusted access
		if (scrollOffset >= wordElements.at(-1).offsetLeft + wordElements.at(-1).offsetWidth) {
			return wordElements.length
		}

		// First word
		// average of right edge of current word and left edge of previous
		if (
			scrollOffset <
			(wordElements[0].offsetLeft + wordElements[0].offsetWidth + wordElements[1].offsetLeft) / 2
		) {
			return 0
		}

		// Last word
		if (
			scrollOffset >=
			// @ts-expect-error trusted access
			(wordElements.at(-1).offsetLeft +
				// @ts-expect-error trusted access
				wordElements.at(-2).offsetLeft +
				// @ts-expect-error trusted access
				wordElements.at(-2).offsetWidth) /
				2
		) {
			return wordElements.length - 1
		}

		// Between
		// TODO consider whether any point after the word should be the next word...
		for (let i = 1; i < wordElements.length - 1; i++) {
			// Average of right edge of previous word and left edge of current
			// const leftEdge =
			// 	(wordElements[i - 1].offsetLeft +
			// 		wordElements[i - 1].offsetWidth +
			// 		wordElements[i].offsetLeft) /
			// 	2;
			const rightEdge =
				(wordElements[i].offsetLeft +
					wordElements[i].offsetWidth +
					wordElements[i + 1].offsetLeft) /
				2

			if (scrollOffset <= rightEdge) {
				return i
			}
		}

		console.warn('issues!')
		return 0
	}

	function scrollOffsetFromWordIndex(index: number): number {
		// Before first word
		if (index < 0) {
			// Return wordElements[0].offsetLeft - rowWidth / 2;
			// optimization
			return 0
		}

		// After last word
		if (index >= wordElements.length) {
			// @ts-expect-error trusted access
			return wordElements.at(-1).offsetLeft + wordElements.at(-1).offsetWidth - rowWidth / 2
		}

		// Between, use the center of the word
		return wordElements[index].offsetLeft + wordElements[index].offsetWidth / 2 - rowWidth / 2
	}

	// ==== Reactive setters ========================================================

	function setWordStylesFromActiveWordIndex(index: number) {
		// Console.time('updateWordStyles');
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...

		if (index === -1) {
			// Optimization
			// must be after, unread
			for (const element of wordElements) {
				element.classList.contains('read') && element.classList.remove('read')
				element.classList.contains('current') && element.classList.remove('current')
			}
		} else if (index > wordElements.length) {
			// Optimization
			// must be before, read
			for (const element of wordElements) {
				!element.classList.contains('read') && element.classList.add('read')
				element.classList.contains('current') && element.classList.remove('current')
			}
		} else {
			for (const [i, element] of wordElements.entries()) {
				if (i < index) {
					// Must be before, read
					!element.classList.contains('read') && element.classList.add('read')
					element.classList.contains('current') && element.classList.remove('current')
				} else if (i > index) {
					// Must be after, unread
					element.classList.contains('read') && element.classList.remove('read')
					element.classList.contains('current') && element.classList.remove('current')
				} else {
					// Must be equal, current
					!element.classList.contains('current') && element.classList.add('current')
					element.classList.contains('read') && element.classList.remove('read')
				}
			}
		}

		// Console.timeEnd('updateWordStyles');
	}

	// Keep spring starting point up to date if we're scrolling manually
	function setSpringStartPoint(startPoint: number) {
		scrollTween = spring(startPoint, springConfig)
	}

	function setActiveWordIndex(index: number) {
		activeWordIndex = index
	}

	function setScrollOffset(offset: number) {
		scrollWrapperElement.scrollLeft = offset
	}

	// React to reset being set
	function setReset(reset: boolean) {
		if (reset) {
			// IsPlaying = true; // force invalidation
			isPlaying = false
			// Placeholder's transition completion does the rest
		}
	}

	function setPlaying(playing: boolean) {
		if (playing) {
			// IsReset = true; // force invalidation
			isReset = false
		}
	}

	// If we set target time while reset, react immediately
	// todo mobile safari bugs?
	function setTargetTime(time: number) {
		if (isMounted && isReset && isChapterCoverVisible) {
			const wordIndex = wordIndexFromTime(time)
			const scrollPosition = wordIndex === -1 ? 0 : scrollOffsetFromWordIndex(wordIndex)
			scrollToOffset(scrollPosition, false, true)
		}
	}

	function setLoaded(loaded: boolean) {
		if (loaded) {
			tick().then(() => {
				ready()
			})
		}
	}

	// Reactive zone --------------------------

	$: starfieldColor = tinycolor(chapterColor).lighten(10).toHexString()

	$: setLoaded(isLoaded)
	$: setPlaying(isPlaying)
	$: setReset(isReset)
	$: setTargetTime(targetTime)
	$: isPlayingAndNotSeeking = isPlaying && !isSeeking // Only really play the audio if we're not seeking

	// While Playing / paused --------
	$: isMounted && !isSeeking && setActiveWordIndex(wordIndexFromTime(currentTime))
	$: isMounted &&
		isPlayingAndNotSeeking &&
		scrollToOffset(scrollOffsetFromWordIndex(activeWordIndex))

	// Seek audio time to active word when scrolling
	// bad for performance?
	// $: wordElements && wordElements.length > 0 && isSeeking && seekTimeFromScroll(scrollLeftBinding);

	// save the play time when we pause
	$: isMounted && !isPlaying && (targetTime = currentTime)
	$: isMounted && isSpringEnabled && !isSeeking && setScrollOffset($scrollTween)

	// Special seeking behavior ------
	$: isMounted && isSeeking && setSpringStartPoint(scrollLeftBinding)
	$: isMounted && isSeeking && setActiveWordIndex(wordIndexFromScrollOffset(scrollLeftBinding))

	// Style
	$: isMounted && setWordStylesFromActiveWordIndex(activeWordIndex)

	// Show pointer if we're in "button" mode
	$: overrideCursor =
		isStarfieldEnabled &&
		!isReset &&
		currentTime >= 0 &&
		currentTime <= chapterData.narrationTime.start
</script>

<div class="track">
	<div
		bind:this={scrollWrapperElement}
		class="scroll-wrapper no-scrollbar"
		class:override-cursor={overrideCursor}
		on:pointercancel={() => {
			// Breaks mobile?
			// isUserHoldingDownFingerOrMouse = false;
		}}
		on:pointerdown={(event) => {
			isSeeking = true
			isUserHoldingDownFingerOrMouse = true
			if (event.target) {
				// @ts-expect-error no ts in template

				event.target.setPointerCapture(event.pointerId)
			}
		}}
		on:pointerup={() => {
			isUserHoldingDownFingerOrMouse = false
		}}
		on:scroll={(event) => {
			if (event.target) {
				// @ts-expect-error no ts in template

				scrollLeftBinding = event.target.scrollLeft
			}
		}}
		on:wheel|passive={(event) => {
			// Allow gesture / wheel scrolling, e.g. two finger drag on mac track pad
			if (Math.abs(event.deltaX) > 0) {
				isSeeking = true
				isUserHoldingDownFingerOrMouse = true

				// Clear the timeout if it's already set
				if (wheelTimer !== undefined) {
					clearTimeout(wheelTimer)
				}

				// Set the new timeout
				wheelTimer = setTimeout(() => {
					wheelTimer = undefined
					isUserHoldingDownFingerOrMouse = false
				}, 200) // 200ms delay; adjust as needed
			}
		}}
	>
		<!-- funky comments here to avoid implicit white space issues -->
		<!-- prettier-ignore -->
		<div bind:this={scrollAreaElement} class=scroll-area class:hide-text={!showTextBeforeNarrationStarts && currentTime < chapterData.narrationTime.start}><!--
		--><div class="spacer" /><!--
			-->{#each chapterData.lines as line}<!--
					-->{@html line}<!--
		-->{/each}<!--
		--><div class="spacer" />
		</div>

		<!-- Control starfield visibility -->
		{#if (isStarfieldEnabled && !isReset && currentTime > 0.5 && currentTime < chapterData.narrationTime.start - 3.5) || currentTime > chapterData.narrationTime.end + 3}
			<div transition:fastFadeFromJs|local={{ duration: 3000 }}>
				<Starfield
					--background="linear-gradient(0deg, #f5f5f5 0%, #f7f7f7 13%, #f7f7f7 100%) #f7f7f7"
					--height="100%"
					--position="absolute"
					--top="0.1px"
					color={starfieldColor}
					id={`particles-${chapterData.index}`}
				/>
			</div>
		{/if}
	</div>

	{#if debug}
		<div
			class="mouse pointer-events-none absolute left-[50%] top-0 h-[10dvh] w-1 touch-none bg-red-500"
		/>
	{/if}

	{#if isReset}
		<div
			on:introend={() => {
				isChapterCoverVisible = true
				// Still broken sometimes?
				targetTime = -1 // Force reactive update...
				targetTime = 0 // Go even further than the first scroll pos
			}}
			on:outrostart={() => {
				isChapterCoverVisible = false
			}}
			transition:fastFadeJs|local={{ duration: chapterCoverTransitionDuration }}
		>
			<ChapterCover {chapterColor} {chapterData} />
		</div>
	{/if}

	<div class="absolute left-0 top-0 flex h-full" class:w-full={isReset}>
		<Button
			icon={isPlaying ? faPause : faPlay}
			isTransitionEnabled={true}
			on:click={() => {
				isPlaying = !isPlaying
			}}
		/>
	</div>

	{#if !isReset}
		<div class="absolute right-0 top-0 flex h-full">
			<Button
				icon={faRotateBack}
				isTransitionEnabled={true}
				on:click={() => {
					isReset = true
				}}
			/>
		</div>
	{/if}

	{#if debug}
		<div
			class="pointer-events-none absolute left-0 top-0 h-full cursor-none touch-none text-xs text-red-400"
		>
			<p>isUserHoldingDownFingerOrMouse: {isUserHoldingDownFingerOrMouse}</p>
			<p>isPlayingAndNotSeeking: {isPlayingAndNotSeeking}</p>
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
		bind:currentTime
		isPlaying={isPlayingAndNotSeeking}
		on:canplaythrough={() => {
			isLoaded = true
		}}
		on:ended
		{targetTime}
	/>
{:else}
	<Audio
		audioSources={chapterData.audio.files.map((file) => `${base}/${file}`)}
		bind:currentTime
		isPlaying={isPlayingAndNotSeeking}
		on:canplaythrough={() => {
			isLoaded = true
		}}
		on:ended
		{targetTime}
	/>
{/if}

<style lang="postcss">
	div.track {
		/* autoprefixer? */
		user-select: none;
		position: relative;
		width: 100vw;
		height: calc(100dvh / 12);
		/* background-color: white; */
		background: linear-gradient(0deg, #f5f5f5 0%, #f7f7f7 13%, #f7f7f7 100%) #f7f7f7;
		-webkit-touch-callout: none; /* iOS Safari */
	}

	/* :global(body.cursor-grabbing-important *) {
		cursor: grabbing !important;
	} */

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
		color: rgb(235 235 235);
		transition: color 800ms;
	}

	:global(div.scroll-area.hide-text span) {
		color: #f7f7f7;
	}

	/* Read words */
	/* TODO THIS IS WHAT IS SLOW IN SAFARI */
	:global(div.scroll-area span.read) {
		color: rgb(87 87 87);
	}

	/* TODO THIS IS WHAT IS SLOW IN SAFARI */
	:global(div.scroll-area span.current) {
		color: rgb(87 87 87);
	}

	div.scroll-wrapper {
		will-change: scroll-position; /* harms or helps? */
		/* background-color: #ffffff22; */
		cursor: grab;
		/* height: 100%; */
		overflow-x: scroll;
		white-space: nowrap;
		mask-image: linear-gradient(90deg, transparent, rgb(0 0 0 / 100%) 20% 80%, transparent);
	}

	div.spacer {
		display: inline-block;
		width: 50vw;
	}

	div.scroll-area {
		pointer-events: none;
		touch-action: none;
		height: calc(100dvh / 12);
		font-family: serif;
		font-size: min(calc(100dvh / 36), 1.75rem);
		line-height: calc(100dvh / 12);

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

	div.override-cursor,
	div.override-cursor:active {
		cursor: pointer;
	}
</style>
