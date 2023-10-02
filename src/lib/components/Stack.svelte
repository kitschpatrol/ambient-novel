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
	import { forEach, random } from 'lodash';
	import shuffle from 'lodash/shuffle';
	import { onMount, tick } from 'svelte';

	export let bookData: BookData;
	const { chapters, title } = bookData;
	const loadDelay = 100;
	const resetDelay = 100;

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

		// pick some random chapters, and start playing
		const chapterCount = random(chapters.length * 0.2, chapters.length * 0.5);
		const chapterNumbers = Array.from({ length: chapters.length }, (_, i) => i);
		const randomChapters = shuffle(chapterNumbers).slice(0, chapterCount).sort();

		for (const chapterIndex of randomChapters) {
			const startTime = random(
				chapters[chapterIndex].narrationTime.start * 1.22,
				chapters[chapterIndex].narrationTime.end * 0.75,
				true
			);

			targetTimes[chapterIndex] = startTime;
			tick().then(() => {
				playStatus[chapterIndex] = true;
			});
			await sleep(250);
		}
		blendingInProgress = false;
	}

	let loadCount = -1;
	let mounted = false;
	onMount(() => {
		mounted = true;
		setTimeout(() => {
			loadCount++;
		}, loadDelay);
	});

	$: isAllLoaded = loadCount === chapters.length;

	// on:keydown={onKeyDown}
	// function onKeyDown(e: KeyboardEvent) {
	// 	console.log(e);
	// }

	// returns when all animations are done
	async function resetAll() {
		// only reset those in need
		isResetting = true;
		const chapterIndicesToReset = getIndicesMatchingValue(resetStatus, false);
		await delayedForEach(chapterIndicesToReset, (index) => (resetStatus[index] = true), resetDelay);
		await sleep(config.chapterCoverTransitionDuration * chapterIndicesToReset.length);
		isResetting = false;
	}

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<svelte:window bind:innerWidth={width} />

{#if mounted}
	<Header />

	{#each chapters as chapter, index}
		{#if loadCount >= index && width > 0}
			<Track
				ready={() => {
					setTimeout(() => {
						loadCount++;
					}, loadDelay);
				}}
				chapterData={chapters[index]}
				chapterColor={chapterColors[index]}
				rowWidth={width}
				targetTime={targetTimes[index]}
				bind:isPlaying={playStatus[index]}
				bind:isReset={resetStatus[index]}
				on:ended={() => {
					// TODO bugs
					console.log('chapter ended');
					if (isPlayingThrough) {
						// TODO
						const currentChapterIndex = playStatus.indexOf(true);
						resetAll(); // this throws the right flag

						if (currentChapterIndex < chapters.length - 1) {
							const nextChapterIndex = playStatus.indexOf(true) + 1;
							playStatus[nextChapterIndex] = true;
							isPlayingThrough = true;
						} else {
							console.log('you reached the end');
						}
					} else {
						resetStatus[index] = true;
					}
				}}
			/>
		{:else}
			<TrackPlacholder chapterData={chapters[index]} chapterColor={chapterColors[index]} />
		{/if}
	{/each}

	<footer>
		<div id="controls" class="md-s flex h-full w-full gap-6 max-sm:gap-1">
			<span class="flex max-w-lg flex-1 items-center justify-start">
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
			<span class="flex flex-grow items-center justify-center max-lg:hidden" />
			<span class="flex max-w-lg flex-1 items-center justify-end">
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
					isEnabled={somethingNotReset && isAllLoaded}
					on:click={resetAll}
				/>
			</span>
		</div>
	</footer>
{/if}

<style>
	div#controls {
		background: linear-gradient(#00000053 0%, rgba(86, 86, 86, 0.502) 100%);
		user-select: none;
		/* autoprefixer? */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
	}

	footer {
		width: 100vw;
		height: calc(100dvh / 12);
		background: #4e3bff;
		user-select: none;
		/* autoprefixer? */
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none; /* iOS Safari */
	}
</style>
