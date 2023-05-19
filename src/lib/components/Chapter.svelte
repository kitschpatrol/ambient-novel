<script lang="ts">
	import type { ChapterData } from '$lib/schemas/bookSchema';
	import { fade } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { quadInOut } from 'svelte/easing';
	import clamp from 'lodash/clamp';
	import Playlist from '$lib/components/Playlist.svelte';
	import Audio from '$lib/components/Audio.svelte';
	import Line from '$lib/components/Line.svelte';
	import { mapValue } from '$lib/utils/math/mapValue';

	export let isPlaying = false;
	export let chapterData: ChapterData;
	export let activeLine: number = 0;
	export let currentTime: number = 0;
	export let seeking: boolean = false;
	export let maxVolumeMusic = 0.5;
	export let maxVolumeSpeech = 1.0;
	export let lineOrder = Array.from(Array(chapterData.lines.length).keys());

	let chapterElement: HTMLDivElement;
	let targetTime = 0;
	let scrollTween = tweened(0, {
		duration: 600,
		easing: quadInOut
	});
	let chapterHeight = 0;
	let chapterScrollTop = 0;

	const dispatch = createEventDispatcher();
	const fadeHeightPercent = 0.2;

	onMount(() => {
		// todo shuffle

		// jump immediately to the correct line,
		// e.g. when switching chapters
		scrollToLineIndex(activeLine, 0);
	});

	function scrollToLineIndex(lineIndex: number, duration: number = 600) {
		scrollTween.set(
			clamp(lineOrder.indexOf(lineIndex), 0, chapterData.lines.length - 1) * chapterHeight,
			{
				duration,
				easing: quadInOut
			}
		);
	}

	// scroll if needed
	$: {
		scrollToLineIndex(activeLine);
	}

	$: {
		if (chapterElement) {
			chapterElement.scrollTop = $scrollTween;
		}
	}

	// watch for the end of a line's audio and tell book to advance
	$: {
		const { end } = chapterData.lines[activeLine].timing;
		// magic  math so we can go "back" while playing
		if (isPlaying && currentTime >= end && currentTime <= end + 0.1) {
			if (lineOrder.indexOf(activeLine) < chapterData.lines.length - 1) {
				dispatch('readyForNextLine');
			} else {
				console.log(`Reached end of chapter... TODO alert the book?`);
			}
		}
	}

	// sync the audio to the current line, e.g. when paging through previous / next line
	$: {
		const { start, end } = chapterData.lines[activeLine].timing;
		if (
			(currentTime < start || currentTime >= end) &&
			(!isPlaying || targetTime < start || targetTime >= end)
		) {
			// console.log(`setting audio start time to ${start}`);
			targetTime = start;
		}
	}

	// todo update for container
	// fade lines in and out as they scroll
	// $: {
	// 	if (chapterElement) {
	// 		chapterScrollTop;
	// 		for (const lineContainer of chapterElement.children as HTMLCollectionOf<HTMLDivElement>) {
	// 			const { height, top } = lineContainer.getBoundingClientRect();
	// 			lineContainer.style.opacity = `${Math.min(
	// 				clamp(mapValue(top, 0, height * -fadeHeightPercent, 1.0, 0.0), 0.0, 1.0),
	// 				clamp(mapValue(top, 0, height * fadeHeightPercent, 1.0, 0.0), 0.0, 1.0)
	// 			)}`;
	// 		}
	// 	}
	// }

	// jump to same line after shuffle
	// protect from updates on activeline
	function getActiveLine(): number {
		return activeLine;
	}
	$: {
		lineOrder;
		tick().then(() => {
			scrollToLineIndex(getActiveLine(), 0);
		});
	}

	$: {
		console.log(`chapterHeight: ${chapterHeight}`);
	}
</script>

<!-- <div
	transition:fade
	class="h-[130px] flex-1 flex-col overflow-scroll"
	bind:this={chapterElement}
	bind:clientHeight={chapterHeight}
	on:scroll={(e) => {
		// @ts-ignore
		chapterScrollTop = e?.target?.scrollTop || 0;
	}}
> -->
<div
	class="grow-1 absolute h-full w-full flex-1 overflow-hidden bg-slate-300"
	transition:fade
	bind:this={chapterElement}
	bind:clientHeight={chapterHeight}
	on:scroll={(e) => {
		// @ts-ignore
		chapterScrollTop = e?.target?.scrollTop || 0;
	}}
>
	{#each lineOrder as index}
		<Line
			lineData={chapterData.lines[index]}
			{isPlaying}
			{currentTime}
			chapterIndex={chapterData.index}
		/>
	{/each}
</div>
<!-- </div> -->

<Playlist
	isShuffleOn={true}
	tracks={chapterData.ambientTracks}
	maxVolume={maxVolumeMusic}
	{isPlaying}
/>

<Audio
	audioSources={chapterData.voiceOver.files}
	{isPlaying}
	maxVolume={maxVolumeSpeech}
	{targetTime}
	bind:currentTime
	bind:seeking
/>

<!-- <style>
	.chapter {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		overflow-y: hidden;
		overflow-x: hidden;
	}

	/* .scroll-snap-parent {
		scroll-snap-type: y mandatory;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
	} */

	.line-container {
		display: grid;
		grid-template-columns: 100vw;
		grid-template-rows: 100vh;

		/* grid-area: 1 / 1; force overlap for transitions */
		/* justify-self: center; */
		/* align-self: center; */
		/* width: 100%; */
		/* height: 100%; */

		/* max-height: 80%; */

		/* text-align: justify; */
		/* position: relative; */
	}

	/* .scroll-snap-child {
		scroll-snap-align: start;
		scroll-snap-stop: always;
	} */
</style> -->
