<script lang="ts">
	import type { ChapterData } from '#lib/schemas/book-schema.js'
	import { faPause, faPlay, faRotateBack } from '@fortawesome/free-solid-svg-icons'
	import Audio from '#lib/components/Audio.svelte'
	import Button from '#lib/components/Button.svelte'
	import ChapterCover from '#lib/components/ChapterCover.svelte'
	import Starfield from '#lib/components/Starfield.svelte'
	import { CHAPTER_COVER_TRANSITION_DURATION } from '#lib/config.js'
	import { fastFadeFromJs } from '#lib/utils/transition/fast-fade-from-js.js'
	import { fastFadeJs } from '#lib/utils/transition/fast-fade-js.js'
	import ScrollBooster from 'scrollbooster'
	import { onMount, tick, untrack } from 'svelte'
	import { on } from 'svelte/events'
	import { Spring } from 'svelte/motion'
	import tinycolor from 'tinycolor2'
	import UaParser from 'ua-parser-js'
	import type { AssetPath } from '$app/types'
	import { browser } from '$app/env'
	import { asset } from '$app/paths'

	type Props = {
		chapterColor?: string
		chapterData: ChapterData
		currentTime?: number
		isPlaying?: boolean
		isReset?: boolean
		onended?: () => void
		onready?: () => void
		rowWidth?: number // Performance thing to set this externally...
		targetTime?: number
	}

	let {
		chapterColor = '#ff0000',
		chapterData,
		currentTime = $bindable(0),
		isPlaying = $bindable(false),
		isReset = $bindable(true),
		onended,
		onready,
		rowWidth = 0,
		targetTime = $bindable(currentTime),
	}: Props = $props()

	// Config
	const showTextBeforeNarrationStarts = false
	const isStarfieldEnabled = true
	const isMobile = (new UaParser().getDevice().type ?? '') === 'mobile'
	const debug = false
	const isSpringEnabled = true
	const springConfig = {
		damping: 0.2, // Setting > 1 gives crazy effect
		stiffness: 0.005,
	}

	let isSeeking = $state(false)
	let scrollWrapperElement: HTMLDivElement | undefined = $state()
	let scrollLeftBinding = $state(0) // Optimization? or just use scrollLeft?
	const scrollTween = new Spring(0, springConfig)
	let wheelTimer: ReturnType<typeof setTimeout> | undefined
	let isChapterCoverVisible = true

	let timeCache: number[] = [] // One element longer than the number of words, to accommodate the "end" time of the last word
	let wordElements: HTMLSpanElement[] = []
	let isMounted = $state(false)
	let scrollAreaElement: HTMLDivElement | undefined = $state()
	let isLoaded = false

	// Scroll booster / frame loop
	let isUserHoldingDownFingerOrMouse = $state(false)
	let scrollLeft = 0
	let scrollLeftDelta = 0

	// TODO does this help?
	// https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay
	if (browser && isMobile) {
		const AudioContextConstructor =
			globalThis.AudioContext ??
			// AudioContext is missing in older Safari even though the DOM types declare it
			(globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
		// eslint-disable-next-line no-new -- Creating the context is the side effect we want
		new AudioContextConstructor()
	}

	onMount(() => {
		const wrapper = scrollWrapperElement
		const area = scrollAreaElement
		if (!wrapper || !area) {
			throw new Error('Track scroll elements must be bound before mount')
		}

		// Allow drag scrolling on desktop
		const scrollBooster = new ScrollBooster({
			bounce: true,
			content: area,
			direction: 'horizontal',
			onPointerDown() {
				// Doesn't fire on ios mobile while inertial scroll animation is playing
				isSeeking = true

				// Seem to have to set this to avoid jumps
				scrollBooster.setPosition({
					x: wrapper.scrollLeft,
					y: 0,
				})
			},
			pointerMode: 'mouse',
			scrollMode: 'native',
			viewport: wrapper,
		})

		// Watch scroll velocity
		// have to do this instead of an onscroll handler so we can calculate velocity / delta
		const loop = () => {
			if (isReset || !isSeeking) {
				return
			}

			scrollLeftDelta = wrapper.scrollLeft - scrollLeft
			scrollLeft = wrapper.scrollLeft

			// Doesn't really work on ios...
			if (isUserHoldingDownFingerOrMouse || scrollLeftDelta !== 0) {
				return
			}

			// Stop the scroll booster which can "flicker" between 0 and .5 as it slows down
			scrollBooster.setPosition({
				x: scrollLeft,
				y: 0,
			})

			// Optimization, only seek audio at the end of a scroll input
			targetTime = timeFromWordIndex(activeWordIndex)
			currentTime = targetTime
			isSeeking = false
		}

		const intervalId = setInterval(() => {
			loop()
		}, 100)

		wordElements = [...area.querySelectorAll<HTMLSpanElement>('span[data-time]')]

		timeCache = generateTimeCache(chapterData, wordElements)

		isMounted = true

		return () => {
			clearInterval(intervalId)
			scrollBooster.destroy()
		}
	})

	function generateTimeCache(data: ChapterData, wordSpans: HTMLSpanElement[]): number[] {
		const times: number[] = []

		// Iterate through each span element
		for (const span of wordSpans) {
			const dataTime = span.dataset.time

			if (dataTime === undefined) {
				console.warn(
					`data-time attribute is missing from word ${span.innerHTML} in chapter ${data.title}`,
				)
			} else {
				times.push(Number(dataTime))
			}
		}

		// Add the final time
		times.push(data.narrationTime.end)

		return times
	}

	function scrollToOffset(offset: number, rightOnly = true, immediate = false) {
		// Only scroll to the right
		if (
			!scrollWrapperElement ||
			rowWidth <= 0 ||
			(rightOnly && offset < scrollWrapperElement.scrollLeft)
		) {
			return
		}

		if (isSpringEnabled && !immediate) {
			// This was the trick for the flashes...
			void tweenAfterTick(offset)
		} else {
			scrollWrapperElement.scrollLeft = offset
			if (immediate) {
				// Keep the spring's starting point in sync with the manual scroll position
				scrollTween.set(offset, { instant: true })
			}
		}
	}

	async function tweenAfterTick(offset: number) {
		await tick()
		scrollTween.target = offset
	}

	// ==== Time / Word index / Scroll offset conversions ============================

	// TODO only search if time delta is greater than minimum word spacing?
	// prob not this is pretty fast
	function wordIndexFromTime(time: number): number {
		const firstTime = timeCache[0]
		const lastTime = timeCache.at(-1)

		if (firstTime === undefined || lastTime === undefined || time <= firstTime) {
			// Before first word
			return -1
		}

		if (time >= lastTime) {
			// After last word
			return wordElements.length
		}

		// Somewhere between
		for (let i = 0; i < wordElements.length; i++) {
			const start = timeCache[i]
			const end = timeCache[i + 1]
			if (start !== undefined && end !== undefined && time >= start && time < end) {
				return i
			}
		}

		console.warn('issues')
		return 0
	}

	function timeFromWordIndex(index: number): number {
		// The index is clamped into range, so the lookup always succeeds
		return timeCache[index < 0 ? 0 : Math.min(index, wordElements.length)] ?? 0
	}

	function wordIndexFromScrollOffset(offset: number): number {
		const scrollOffset = offset + rowWidth / 2
		const firstWord = wordElements[0]
		const secondWord = wordElements[1]
		const lastWord = wordElements.at(-1)
		const penultimateWord = wordElements.at(-2)

		if (
			firstWord === undefined ||
			secondWord === undefined ||
			lastWord === undefined ||
			penultimateWord === undefined
		) {
			console.warn('issues!')
			return 0
		}

		// Before first word
		if (scrollOffset <= firstWord.offsetLeft) {
			return -1
		}

		// After last word
		if (scrollOffset >= lastWord.offsetLeft + lastWord.offsetWidth) {
			return wordElements.length
		}

		// First word
		// average of right edge of current word and left edge of next
		if (scrollOffset < (firstWord.offsetLeft + firstWord.offsetWidth + secondWord.offsetLeft) / 2) {
			return 0
		}

		// Last word
		if (
			scrollOffset >=
			(lastWord.offsetLeft + penultimateWord.offsetLeft + penultimateWord.offsetWidth) / 2
		) {
			return wordElements.length - 1
		}

		// Between
		// TODO consider whether any point after the word should be the next word...
		for (let i = 1; i < wordElements.length - 1; i++) {
			const word = wordElements[i]
			const nextWord = wordElements[i + 1]
			if (word === undefined || nextWord === undefined) {
				break
			}

			// Average of right edge of current word and left edge of next
			const rightEdge = (word.offsetLeft + word.offsetWidth + nextWord.offsetLeft) / 2

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
			// Optimization, instead of wordElements[0].offsetLeft - rowWidth / 2
			return 0
		}

		// After last word
		if (index >= wordElements.length) {
			const lastWord = wordElements.at(-1)
			return lastWord === undefined ? 0 : lastWord.offsetLeft + lastWord.offsetWidth - rowWidth / 2
		}

		// Between, use the center of the word
		const word = wordElements[index]
		return word === undefined ? 0 : word.offsetLeft + word.offsetWidth / 2 - rowWidth / 2
	}

	// ==== Reactive setters ========================================================

	function setWordStylesFromActiveWordIndex(index: number) {
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
	}

	// If we set target time while reset, react immediately
	// todo mobile safari bugs?
	function previewTargetTime(time: number) {
		if (!isMounted || !isReset || !isChapterCoverVisible) {
			return
		}

		const wordIndex = wordIndexFromTime(time)
		const scrollPosition = wordIndex === -1 ? 0 : scrollOffsetFromWordIndex(wordIndex)
		scrollToOffset(scrollPosition, false, true)
	}

	function onCanPlayThrough() {
		if (isLoaded) {
			return
		}

		isLoaded = true
		void notifyReady()
	}

	async function notifyReady() {
		await tick()
		onready?.()
	}

	function onWheel(event: WheelEvent) {
		// Allow gesture / wheel scrolling, e.g. two finger drag on mac track pad
		if (!(Math.abs(event.deltaX) > 0)) {
			return
		}

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

	// Reactive zone --------------------------

	const starfieldColor = $derived(tinycolor(chapterColor).lighten(10).toHexString())
	const isPlayingAndNotSeeking = $derived(isPlaying && !isSeeking) // Only really play the audio if we're not seeking

	// -1 means before first word, > wordElements.length means after last word
	// While seeking the scroll position drives the active word, otherwise the audio time does
	const activeWordIndex = $derived.by(() => {
		if (!isMounted) {
			return -1
		}

		return isSeeking ? wordIndexFromScrollOffset(scrollLeftBinding) : wordIndexFromTime(currentTime)
	})

	// Show pointer if we're in "button" mode
	const overrideCursor = $derived(
		isStarfieldEnabled &&
			!isReset &&
			currentTime >= 0 &&
			currentTime <= chapterData.narrationTime.start,
	)

	// Playing and reset are mutually exclusive
	$effect(() => {
		if (isPlaying) {
			isReset = false
		}
	})

	$effect(() => {
		if (isReset) {
			isPlaying = false
			// Placeholder's transition completion does the rest
		}
	})

	// Only the target time itself should trigger the preview, so the lookup is untracked
	$effect(() => {
		const time = targetTime
		untrack(() => {
			previewTargetTime(time)
		})
	})

	// While playing, follow the active word
	$effect(() => {
		if (isMounted && isPlayingAndNotSeeking) {
			scrollToOffset(scrollOffsetFromWordIndex(activeWordIndex))
		}
	})

	// Save the play time when we pause
	$effect(() => {
		if (isMounted && !isPlaying) {
			targetTime = currentTime
		}
	})

	// Apply the spring's position to the scroll wrapper
	$effect(() => {
		if (isMounted && isSpringEnabled && !isSeeking && scrollWrapperElement) {
			scrollWrapperElement.scrollLeft = scrollTween.current
		}
	})

	// Keep spring starting point up to date if we're scrolling manually
	$effect(() => {
		if (isMounted && isSeeking) {
			scrollTween.set(scrollLeftBinding, { instant: true })
		}
	})

	// Style
	$effect(() => {
		if (isMounted) {
			setWordStylesFromActiveWordIndex(activeWordIndex)
		}
	})
</script>

<div class="track">
	<!--
		There is deliberately no pointercancel handler, clearing the holding flag there
		breaks mobile. The wheel listener is attached manually so it can be passive.
	-->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={scrollWrapperElement}
		class={['scroll-wrapper no-scrollbar', { 'override-cursor': overrideCursor }]}
		{@attach (element) => on(element, 'wheel', onWheel, { passive: true })}
		onpointerdown={(event) => {
			isSeeking = true
			isUserHoldingDownFingerOrMouse = true
			if (event.target instanceof Element) {
				event.target.setPointerCapture(event.pointerId)
			}
		}}
		onpointerup={() => {
			isUserHoldingDownFingerOrMouse = false
		}}
		onscroll={(event) => {
			scrollLeftBinding = event.currentTarget.scrollLeft
		}}
	>
		<!-- funky comments here to avoid implicit white space issues -->
		<!-- prettier-ignore -->
		<div bind:this={scrollAreaElement} class={['scroll-area', { 'hide-text': !showTextBeforeNarrationStarts && currentTime < chapterData.narrationTime.start }]}><!--
		--><div class="spacer" ></div><!--
			-->{#each chapterData.lines as line, lineIndex (lineIndex)}<!--
					-->{@html line}<!--
		-->{/each}<!--
		--><div class="spacer" ></div>
		</div>

		<!-- Control starfield visibility -->
		{#if (isStarfieldEnabled && !isReset && currentTime > 0.5 && currentTime < chapterData.narrationTime.start - 3.5) || currentTime > chapterData.narrationTime.end + 3}
			<div transition:fastFadeFromJs={{ duration: 3000 }}>
				<Starfield
					id={`particles-${chapterData.index}`}
					--background="linear-gradient(0deg, #f5f5f5 0%, #f7f7f7 13%, #f7f7f7 100%) #f7f7f7"
					--height="100%"
					--position="absolute"
					--top="0.1px"
					color={starfieldColor}
				/>
			</div>
		{/if}
	</div>

	{#if debug}
		<div
			class="mouse pointer-events-none absolute top-0 left-[50%] h-[10dvh] w-1 touch-none bg-red-500"
		></div>
	{/if}

	{#if isReset}
		<div
			onintroend={() => {
				isChapterCoverVisible = true
				// Still broken sometimes?
				targetTime = -1 // Force reactive update...
				targetTime = 0 // Go even further than the first scroll pos
			}}
			onoutrostart={() => {
				isChapterCoverVisible = false
			}}
			transition:fastFadeJs={{ duration: CHAPTER_COVER_TRANSITION_DURATION }}
		>
			<ChapterCover {chapterColor} {chapterData} />
		</div>
	{/if}

	<div class={['absolute top-0 left-0 flex h-full', { 'w-full': isReset }]}>
		<Button
			icon={isPlaying ? faPause : faPlay}
			isTransitionEnabled={true}
			onclick={() => {
				isPlaying = !isPlaying
			}}
		/>
	</div>

	{#if !isReset}
		<div class="absolute top-0 right-0 flex h-full">
			<Button
				icon={faRotateBack}
				isTransitionEnabled={true}
				onclick={() => {
					isReset = true
				}}
			/>
		</div>
	{/if}

	{#if debug}
		<div
			class="pointer-events-none absolute top-0 left-0 h-full cursor-none touch-none text-xs text-red-400"
		>
			<p>isUserHoldingDownFingerOrMouse: {isUserHoldingDownFingerOrMouse}</p>
			<p>isPlayingAndNotSeeking: {isPlayingAndNotSeeking}</p>
			<p>seeking: {isSeeking}</p>
			<p>targetTime: {Math.round(targetTime)}</p>
			<p>currentTime: {Math.round(currentTime)}</p>
			<p>isReset: {isReset}</p>
			<p>activeWordIndex: {activeWordIndex}</p>
		</div>
	{/if}
</div>

<!-- The audio file list comes from the book data, so it can't be checked against the static asset union -->
<Audio
	audioSources={chapterData.audio.files.map((file) => asset(file as AssetPath))}
	isPlaying={isPlayingAndNotSeeking}
	oncanplaythrough={onCanPlayThrough}
	{onended}
	{targetTime}
	bind:currentTime
/>

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
		/* stylelint-disable-next-line defensive-css/require-background-repeat -- At the default mask size the gradient covers the whole element, so it never tiles */
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
	}

	div.scroll-wrapper:active {
		cursor: grabbing;
	}

	div.override-cursor,
	div.override-cursor:active {
		cursor: pointer;
	}
</style>
