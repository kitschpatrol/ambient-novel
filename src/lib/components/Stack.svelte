<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';
	import Track from '$lib/components/Track.svelte';
	import TrackPlacholder from '$lib/components/TrackPlaceholder.svelte';
	import * as config from '$lib/config';
	import type { BookData } from '$lib/schemas/bookSchema';
	import { delayedForEach } from '$lib/utils/collection/delayedForEach';
	import { getIndicesMatchingValue } from '$lib/utils/collection/getIndicesMatchingValue';
	import {
		faBookReader,
		faDiceD20,
		faPause,
		faRotateBack
	} from '@fortawesome/free-solid-svg-icons';
	import { random } from 'lodash';
	import shuffle from 'lodash/shuffle';
	import { onMount, tick } from 'svelte';
	import UAParser from 'ua-parser-js';

	export let bookData: BookData;
	const { chapters } = bookData;
	const luckyBlendDelay = 250;
	const resetDelay = 100;
	const isMobile = (new UAParser().getDevice().type ?? '') === 'mobile';

	let width = 0;

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
		'#4e3bff'
	];

	let targetTimes = Array.from({ length: chapters.length }, () => 0);
	let playStatus = Array.from({ length: chapters.length }, () => false);
	let resetStatus = Array.from({ length: chapters.length }, () => true);

	let isResetting = false;
	let isPlayingThrough = false;

	$: somethingPlaying = playStatus.indexOf(true) > -1;
	$: somethingNotReset = resetStatus.indexOf(false) > -1;

	$: {
		// messing with anything stops playing through
		if (!isResetting && isPlayingThrough && playStatus.filter((v) => v).length !== 1) {
			isPlayingThrough = false;
		}
	}

	let blendingInProgress = false;

	async function onLuckyBlend() {
		if (blendingInProgress) return;
		blendingInProgress = true;
		await resetAll();

		await sleep(luckyBlendDelay);

		// pick some random chapters, and start playing
		// lower max chapters on slow mobile
		const chapterCount = isMobile ? random(2, 3) : random(2, 8);
		const chapterNumbers = Array.from({ length: chapters.length }, (_, i) => i);
		const randomChapters = shuffle(chapterNumbers).slice(0, chapterCount).sort();

		for (const chapterIndex of randomChapters) {
			const startTime = random(
				chapters[chapterIndex].narrationTime.start * 1.25,
				chapters[chapterIndex].narrationTime.end * 0.75,
				true
			);

			targetTimes[chapterIndex] = startTime;
			tick().then(() => {
				playStatus[chapterIndex] = true;
			});
			await sleep(luckyBlendDelay);
		}
		blendingInProgress = false;
	}

	let loadCount = -1;
	let mounted = false;
	onMount(() => {
		mounted = true;
		loadCount++;
	});

	$: isAllLoaded = loadCount === chapters.length;

	// returns when all animations are done
	async function resetAll() {
		// only reset those in need
		isResetting = true;
		const chapterIndicesToReset = getIndicesMatchingValue(resetStatus, false);
		await delayedForEach(chapterIndicesToReset, (index) => (resetStatus[index] = true), resetDelay);
		await sleep(config.chapterCoverTransitionDuration - resetDelay);
		isResetting = false;
	}

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<svelte:window bind:innerWidth={width} />

<Header --height="calc(100dvh / 12)" />

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
{#each chapters as _, index}
	{#if loadCount >= index && width > 0}
		<!-- {#if 0 >= index && width > 0} -->
		<Track
			ready={() => {
				loadCount++;
			}}
			chapterData={chapters[index]}
			chapterColor={chapterColors[index]}
			rowWidth={width}
			bind:targetTime={targetTimes[index]}
			bind:isPlaying={playStatus[index]}
			bind:isReset={resetStatus[index]}
			on:ended={() => {
				if (isPlayingThrough) {
					// TODO
					resetAll(); // this throws the right flag
				} else {
					resetStatus[index] = true;
				}

				if (index < chapters.length - 1) {
					const nextChapterIndex = index + 1;
					if (!playStatus[nextChapterIndex]) playStatus[nextChapterIndex] = true;
				} else {
					// reached the end of the book
				}
			}}
		/>
	{:else}
		<TrackPlacholder chapterData={chapters[index]} chapterColor={chapterColors[index]} />
	{/if}
{/each}

<footer>
	<div id="controls" class="flex h-full w-full justify-between gap-6 max-sm:gap-1">
		<span class="flex basis-[32rem]">
			<Button
				icon={faBookReader}
				label="Play Through"
				isEnabled={!isPlayingThrough && isAllLoaded}
				isDown={isPlayingThrough}
				on:click={async () => {
					await resetAll();
					playStatus[0] = true;
					isPlayingThrough = true;
				}}
			/>
			<Button
				icon={faDiceD20}
				isEnabled={isAllLoaded && !blendingInProgress}
				label="Lucky Blend"
				on:click={onLuckyBlend}
			/>
		</span>
		<span />
		<span class="flex basis-[32rem]">
			<Button
				icon={faPause}
				label="Pause all"
				isEnabled={somethingPlaying && isAllLoaded}
				on:click={() => {
					playStatus = playStatus.map(() => false);
				}}
			/>
			<Button
				icon={faRotateBack}
				label="Reset all"
				isEnabled={somethingNotReset && isAllLoaded && !isResetting}
				on:click={resetAll}
			/>
		</span>
	</div>
</footer>

<style lang="postcss">
	div#controls {
		/* background: linear-gradient(#00000053 0%, rgba(86, 86, 86, 0.502) 100%); */
		user-select: none;
		/* autoprefixer? */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
	}

	footer {
		background: linear-gradient(#0000001d 30%, #00000000 100%) #4e3bff;
		width: 100vw;
		height: calc(100dvh / 12);
		user-select: none;
		/* autoprefixer? */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
	}
</style>
