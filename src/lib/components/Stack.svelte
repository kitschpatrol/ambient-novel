<script lang="ts">
	import type { BookData } from '#lib/schemas/book-schema.js'
	import { faBookReader, faDiceD20, faPause, faRotateBack } from '@fortawesome/free-solid-svg-icons'
	import Button from '#lib/components/Button.svelte'
	import Header from '#lib/components/Header.svelte'
	import Track from '#lib/components/Track.svelte'
	import TrackPlaceholder from '#lib/components/TrackPlaceholder.svelte'
	import * as config from '#lib/config.js'
	import { delayedForEach } from '#lib/utils/collection/delayed-for-each.js'
	import { getIndicesMatchingValue } from '#lib/utils/collection/get-indices-matching-value.js'
	import random from 'lodash/random'
	import shuffle from 'lodash/shuffle'
	import { onMount, tick } from 'svelte'
	import UaParser from 'ua-parser-js'

	let { bookData }: { bookData: BookData } = $props()
	const { chapters } = $derived(bookData)
	const luckyBlendDelay = 250
	const resetDelay = 100
	const isMobile = (new UaParser().getDevice().type ?? '') === 'mobile'

	let width = $state(0)

	const chapterColors = [
		'#f01ef6',
		'#d827ff',
		'#c427ff',
		'#b127ff',
		'#9d3bff',
		'#893bff',
		'#763bff',
		'#623bff',
		'#5043f5',
		'#4e3bff',
	]

	// The chapter count is fixed for the life of the component, so the per-chapter
	// state arrays only need its initial value
	// svelte-ignore state_referenced_locally
	const totalChapters = chapters.length
	const targetTimes = $state(Array.from({ length: totalChapters }, () => 0))
	let playStatus = $state(Array.from({ length: totalChapters }, () => false))
	const resetStatus = $state(Array.from({ length: totalChapters }, () => true))

	let isResetting = $state(false)
	let isPlayingThrough = $state(false)

	const somethingPlaying = $derived(playStatus.includes(true))
	const somethingNotReset = $derived(resetStatus.includes(false))

	// Messing with anything stops playing through
	$effect(() => {
		if (!isResetting && isPlayingThrough && playStatus.filter(Boolean).length !== 1) {
			isPlayingThrough = false
		}
	})

	let blendingInProgress = $state(false)

	async function onLuckyBlend() {
		if (blendingInProgress) {
			return
		}

		blendingInProgress = true
		await resetAll()

		await sleep(luckyBlendDelay)

		// Pick some random chapters, and start playing
		// lower max chapters on slow mobile
		const chapterCount = random(2, isMobile ? 3 : 6)
		const chapterNumbers = Array.from({ length: chapters.length }, (_, i) => i)

		// eslint-disable-next-line ts/require-array-sort-compare
		const randomChapters = shuffle(chapterNumbers).slice(0, chapterCount).toSorted()

		for (const chapterIndex of randomChapters) {
			const chapter = chapters[chapterIndex]
			if (chapter === undefined) {
				continue
			}

			targetTimes[chapterIndex] = random(
				chapter.narrationTime.start * 1.25,
				chapter.narrationTime.end * 0.75,
				true,
			)

			void playAfterTick(chapterIndex)
			await sleep(luckyBlendDelay)
		}

		blendingInProgress = false
	}

	async function playAfterTick(chapterIndex: number) {
		await tick()
		playStatus[chapterIndex] = true
	}

	let loadCount = $state(-1)
	onMount(() => {
		loadCount++
	})

	const isAllLoaded = $derived(loadCount === chapters.length)

	// Returns when all animations are done
	async function resetAll() {
		// Only reset those in need
		isResetting = true
		const chapterIndicesToReset = getIndicesMatchingValue(resetStatus, false)

		await delayedForEach(
			chapterIndicesToReset,
			(index) => {
				resetStatus[index] = true
			},
			resetDelay,
		)
		await sleep(config.CHAPTER_COVER_TRANSITION_DURATION - resetDelay)
		isResetting = false
	}

	const sleep = async (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms)
		})
</script>

<svelte:window bind:innerWidth={width} />

<Header --height="calc(100dvh / 12)" />

{#each chapters as chapter, index (index)}
	{#if loadCount >= index && width > 0}
		<Track
			chapterColor={chapterColors[index]}
			chapterData={chapter}
			onended={() => {
				if (isPlayingThrough) {
					// Resetting also clears the playing through flag
					void resetAll()
				} else {
					resetStatus[index] = true
				}

				// Continue with the next chapter, unless we've reached the end of the book
				if (index < chapters.length - 1) {
					playStatus[index + 1] = true
				}
			}}
			onready={() => {
				loadCount++
			}}
			rowWidth={width}
			bind:isPlaying={playStatus[index]}
			bind:isReset={resetStatus[index]}
			bind:targetTime={targetTimes[index]}
		/>
	{:else}
		<TrackPlaceholder chapterColor={chapterColors[index]} chapterData={chapter} />
	{/if}
{/each}

<footer>
	<div id="controls" class="flex h-full w-full justify-between gap-6 max-sm:gap-1">
		<span class="flex basis-lg">
			<Button
				icon={faBookReader}
				isDown={isPlayingThrough}
				isEnabled={!isPlayingThrough && isAllLoaded}
				label="Play Through"
				onclick={async () => {
					await resetAll()
					playStatus[0] = true
					isPlayingThrough = true
				}}
			/>
			<Button
				icon={faDiceD20}
				isEnabled={isAllLoaded && !blendingInProgress}
				label="Lucky Blend"
				onclick={onLuckyBlend}
			/>
		</span>
		<span></span>
		<span class="flex basis-lg">
			<Button
				icon={faPause}
				isEnabled={somethingPlaying && isAllLoaded}
				label="Pause all"
				onclick={() => {
					playStatus = playStatus.map(() => false)
				}}
			/>
			<Button
				icon={faRotateBack}
				isEnabled={somethingNotReset && isAllLoaded && !isResetting}
				label="Reset all"
				onclick={resetAll}
			/>
		</span>
	</div>
</footer>

<style lang="postcss">
	div#controls {
		/* background: linear-gradient(#00000053 0%, rgba(86, 86, 86, 0.502) 100%); */
		/* autoprefixer? */
		user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
	}

	footer {
		/* autoprefixer? */
		user-select: none;
		width: 100vw;
		height: calc(100dvh / 12);
		background: linear-gradient(#0000001d 30%, #00000000 100%) #4e3bff;
		-webkit-touch-callout: none; /* iOS Safari */
	}
</style>
