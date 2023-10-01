<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';
	import Track from '$lib/components/Track.svelte';
	import TrackPlacholder from '$lib/components/TrackPlaceholder.svelte';
	import type { BookData } from '$lib/schemas/bookSchema';
	import {
		faBookReader,
		faDiceD20,
		faPause,
		faRotateBack
	} from '@fortawesome/free-solid-svg-icons';
	import shuffle from 'lodash/shuffle';
	import { onMount } from 'svelte';
	import Page from '../../routes/+page.svelte';

	export let bookData: BookData;
	const { chapters, title } = bookData;
	const loadDelay = 100;

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

	let playStatus = Array.from({ length: chapters.length }, () => false);
	let resetStatus = Array.from({ length: chapters.length }, () => true);
	let resetFunctions: (() => void)[] = Array.from({ length: chapters.length });

	let isPlayingThrough = false;

	$: somethingPlaying = playStatus.indexOf(true) > -1;
	$: somethingNotReset = resetStatus.indexOf(false) > -1;

	$: {
		// messing with anything stops playing through
		if (isPlayingThrough && playStatus.filter((v) => v).length !== 1) {
			isPlayingThrough = false;
		}
	}

	function onLuckyBlend() {
		isPlayingThrough = false;
		resetFunctions.forEach((reset) => reset());

		// pick three random chapters, and start playing
		const chapterNumbers = Array.from({ length: chapters.length }, (_, i) => i);
		const randomChapters = shuffle(chapterNumbers).slice(0, 3);

		playStatus = playStatus.map((_, i) => randomChapters.includes(i));
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
				bind:isPlaying={playStatus[index]}
				bind:isReset={resetStatus[index]}
				bind:reset={resetFunctions[index]}
				on:ended={() => {
					// TODO bugs
					// if (isPlayingThrough) {
					// 	const nextChapter = playStatus.indexOf(true) + 1;
					// 	// reset everything
					// 	resetFunctions.forEach((reset) => reset());
					// 	// start next chapter
					// 	playStatus = playStatus.map((_, i) => i === nextChapter);
					// } else {
					// 	// TODO bugs
					// 	resetFunctions[index]();
					// }
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
					on:click={() => {
						isPlayingThrough = true;
						// reset everything
						resetFunctions.forEach((reset) => reset());

						// start first chapter
						playStatus = playStatus.map((_, i) => i === 0);
					}}
				/>
				<Button
					icon={faDiceD20}
					isEnabled={isAllLoaded}
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
					on:click={() => {
						resetFunctions.forEach((reset) => reset());
						isPlayingThrough = false;
					}}
				/>
			</span>
		</div>
	</footer>
{/if}

<style>
	div#controls {
		background: linear-gradient(#00000053 0%, rgba(86, 86, 86, 0.502) 100%);
	}

	footer {
		width: 100vw;
		height: calc(100vh / 12);
	}

	footer {
		background: #4e3bff;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}
</style>
