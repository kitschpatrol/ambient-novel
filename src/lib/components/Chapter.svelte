<script lang="ts">
	import Audio from '$lib/components/Audio.svelte';
	import Line from '$lib/components/Line.svelte';
	import Playlist from '$lib/components/Playlist.svelte';
	import type { ChapterData } from '$lib/schemas/bookSchema';
	import { mapValue } from '$lib/utils/math/mapValue';
	import clamp from 'lodash/clamp';
	import isEqual from 'lodash/isEqual';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { quadInOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	export let isPlaying = false;
	export let chapterData: ChapterData;
	export let activeLine: number = 0;
	export let currentTime: number = 0;
	export let maxVolumeMusic = 0.5;
	export let maxVolumeSpeech = 1.0;
	export let lineOrder = Array.from(Array(chapterData.lines.length).keys());

	let chapterElement: HTMLDivElement;
	let targetTime = 0;
	let scrollTween = tweened(0, {
		duration: 600,
		easing: quadInOut
	});

	let chapterScrollTop = 0;

	const dispatch = createEventDispatcher();
	const fadeHeightPercent = 0.25;

	onMount(() => {
		// jump immediately to the correct line,
		// e.g. when switching chapters
		scrollToLineIndex(activeLine, 0);
	});

	function scrollToLineIndex(lineIndex: number, duration: number = 600) {
		if (chapterElement) {
			// can't just bind to clientHeight because that's rounded
			const chapterHeight = chapterElement.getBoundingClientRect().height;
			scrollTween.set(
				clamp(lineOrder.indexOf(lineIndex), 0, chapterData.lines.length - 1) * chapterHeight,
				{
					duration,
					easing: quadInOut
				}
			);
		}
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

	// sync the audio to the current line, e.g. when paging through previous / next line
	$: {
		const { start, end } = chapterData.lines[activeLine].timing;
		if (
			(currentTime < start || currentTime >= end + 0.1) &&
			(!isPlaying || targetTime < start || targetTime >= end)
		) {
			// console.log(`setting audio start time to ${start}`);
			targetTime = start;
		}
	}

	// watch for the end of a line's audio and tell book to advance
	$: {
		const { end } = chapterData.lines[activeLine].timing;

		// magic  math so we can go "back" while playing
		if (isPlaying && currentTime >= end && currentTime < end + 0.1) {
			if (lineOrder.indexOf(activeLine) < chapterData.lines.length - 1) {
				dispatch('readyForNextLine');
			} else {
				console.log(`Reached end of chapter... TODO alert the book?`);
			}
		}
	}

	// todo update for container
	// fade lines in and out as they scroll
	$: {
		if (chapterElement) {
			const chapterHeight = chapterElement.getBoundingClientRect().height;
			chapterScrollTop;
			for (const [i, lineContainer] of Array.from(
				chapterElement.children as HTMLCollectionOf<HTMLDivElement>
			).entries()) {
				const distanceFromCenter = clamp(
					mapValue(
						Math.abs(chapterScrollTop - lineContainer.offsetTop),
						0.0,
						fadeHeightPercent * chapterHeight,
						0.0,
						1.0
					),
					0.0,
					1.0
				);

				lineContainer.style.opacity = `${1 - distanceFromCenter}`;
			}
		}
	}

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

	$: isSorted = isEqual(lineOrder, Array.from(Array(chapterData.lines.length).keys()));
</script>

<svelte:window
	on:resize={() => {
		scrollToLineIndex(getActiveLine(), 0);
	}}
/>

<div
	class="grow-1 absolute h-full w-full flex-1 overflow-hidden"
	transition:fade={{ duration: 300 }}
	bind:this={chapterElement}
	on:scroll={(e) => {
		// @ts-ignore
		chapterScrollTop = e?.target?.scrollTop || 0;
	}}
>
	{#each lineOrder as index}
		<Line lineData={chapterData.lines[index]} {isPlaying} {currentTime} />
	{/each}
</div>
<p
	transition:fade={{ duration: 300 }}
	class="absolute bottom-0 right-0 px-3 pb-3 text-right font-serif text-sm italic text-gray-400"
>
	Chapter {chapterData.index + 1} § {activeLine + 1}&hairsp;/&hairsp;{chapterData.lines.length}
	{#if !isSorted}(Shuffled){/if}
</p>

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
/>
