<script lang="ts">
	import type { Chapter } from '$lib/schemas/bookSchema';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import round from 'lodash/round';

	import clamp from 'lodash/clamp';
	import Playlist from '$lib/components/Playlist.svelte';
	import Audio from '$lib/components/Audio.svelte';
	import Line from '$lib/components/Line.svelte';

	export let isPlaying = false;
	export let chapterData: Chapter;
	export let maxVolumeMusic = 0.5;
	export let maxVolumeSpeech = 1.0;

	let chapterElement: HTMLDivElement;
	let preciseAudiotime: number = 0;

	let audioStartTimeSeconds = 0;
	let testScrollY = 0;
	let isScrolling = false;
	let isProgrammaticScroll = false;

	// export let targetLineIndex: number = 0;

	// todo move out
	export const previousLine = function () {
		scrollToLineIndex(clamp(activeLineIndex - 1, 0, chapterData.lines.length - 1));
		console.log(`activeLineIndex: ${activeLineIndex}`);
	};

	// todo move out
	export const nextLine = function () {
		scrollToLineIndex(clamp(activeLineIndex + 1, 0, chapterData.lines.length - 1));
		console.log(`activeLineIndex: ${activeLineIndex}`);
	};

	onMount(() => {
		let timer: any;

		const handleScroll = (e: Event) => {
			isScrolling = true;

			clearTimeout(timer);
			timer = setTimeout(() => {
				isScrolling = false;
			}, 100);
		};

		chapterElement.addEventListener('scroll', handleScroll);

		return () => {
			chapterElement.removeEventListener('scroll', handleScroll);
		};
	});

	// $: lineSequence = Array.from({ length: lines.length }, (_, i) => i);

	const dispatch = createEventDispatcher<{ activeLineIndex: number }>();
	const dispatchTime = createEventDispatcher<{ audioTime: number }>();

	function mapValue(
		value: number,
		start1: number,
		stop1: number,
		start2: number,
		stop2: number
	): number {
		return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
	}

	const fadeHeightPercent = 0.2;

	// https://stackoverflow.com/questions/64087782/svelte-event-parameter-type-for-typescript
	function onSpeechEnded() {
		console.log('speech ended');
		// TODO next chapter?
	}

	// scrollTween.subscribe(
	// 	(e) => {
	// 		console.log('tween');
	// 		console.log(e);
	// 	},
	// 	(i) => {
	// 		console.log('invalidator');
	// 		console.log(i);
	// 	}
	// );

	function onVoiceOverTimeUpdate(
		event: CustomEvent<{ currentTime: number; startTimeSeconds: number }>
	) {
		// clean up stale references to entities that have transitioned out
		// let audioElement: Audio | null = null;
		// console.log(`audioStartTimeSeconds: ${audioStartTimeSeconds}`);
		// console.log(
		// 	`Object.keys(audioElements): ${JSON.stringify(Object.keys(audioElements), null, 2)}`
		// );
		// for (const key of Object.keys(audioElements)) {
		// 	if (key === `${audioStartTimeSeconds}`) {
		// 		console.log(`found matc ${audioElements[key]}`);
		// 		audioElement = audioElements[key] as Audio;
		// 	} else {
		// 		//delete audioElements[key];
		// 	}
		// }

		if (event.detail.startTimeSeconds === audioStartTimeSeconds) {
			preciseAudiotime = event.detail.currentTime;
			dispatchTime('audioTime', preciseAudiotime);
		}
		// if (audioElement) {
		// 	preciseAudiotime = event.detail.currentTime;
		// 	console.log(`preciseAudiotime: ${preciseAudiotime}`);
		// 	// const audioLineIndex = chapterData.lines.findIndex((line) => {
		// 	// 	return preciseAudiotime >= line.timing.start && preciseAudiotime < line.timing.end;
		// 	// });
		// 	// targetLineIndex = audioLineIndex;
		// } else {
		// 	console.log(`no audio element`);
		// }
	}

	// function onShuffleSequence() {
	// 	// todo pivot around active?
	// 	lineSequence = shuffle(lineSequence);
	// }

	// function onSortSequence() {
	// 	lineSequence = lineSequence.sort((a, b) => a - b);
	// }

	// $: {
	// 	const lineIndex = chapterData.lines.findIndex((line) => {
	// 		return preciseAudiotime >= line.timing.start && preciseAudiotime < line.timing.end;
	// 	});
	// 	if (lineIndex !== activeLineIndex) {
	// 		scrollToLineIndex(lineIndex);
	// 	}
	// }

	function nonReactive<T>(someVar: T): () => T {
		return () => someVar;
	}

	$: {
		console.log('line index changed');
		dispatch('activeLineIndex', activeLineIndex);
	}

	$: activeLineIndex = chapterElement
		? Math.floor((testScrollY + chapterElement.offsetHeight / 2) / chapterElement.offsetHeight)
		: 0;

	// const getPreciseAudiotime = nonReactive(preciseAudiotime);
	function getPreciseAudiotime() {
		return preciseAudiotime;
	}

	// $: {
	// 	const activeLineTiming = chapterData.lines[activeLineIndex].timing;

	// 	console.log(`getPreciseAudiotime(): ${getPreciseAudiotime()}`);
	// 	console.log(`activeLineTiming.start: ${activeLineTiming.start}`);
	// 	console.log(`activeLineTiming.end: ${activeLineTiming.end}`);

	// 	if (preciseAudiotime >= activeLineTiming.start && preciseAudiotime < activeLineTiming.end) {
	// 		console.log('audio already in range');
	// 	} else {
	// 		let newLineIndex = chapterData.lines.findIndex((line) => {
	// 			return (
	// 				line.timing.start >= activeLineTiming.start && line.timing.start < activeLineTiming.end
	// 			);
	// 		});
	// 		// audioStartTimeSeconds = chapterData.lines[newLineIndex].timing.start;
	// 		// console.log(`need to jump audio to: ${audioStartTimeSeconds}`);

	// 		if (targetLineIndex !== newLineIndex) {
	// 			targetLineIndex = newLineIndex;
	// 		}
	// 	}
	// }

	// $: {
	// 	console.log(`activeLineIndex: ${activeLineIndex}`);
	// 	console.log(`targetLineIndex: ${targetLineIndex}`);
	// 	if (targetLineIndex !== activeLineIndex) {
	// 		const targetLineTiming = chapterData.lines[targetLineIndex].timing;

	// 		console.log(`getPreciseAudiotime(): ${getPreciseAudiotime()}`);
	// 		console.log(`targetLineTiming.start: ${targetLineTiming.start}`);
	// 		console.log(`targetLinetiming.end: ${targetLineTiming.end}`);

	// 		if (
	// 			getPreciseAudiotime() >= targetLineTiming.start &&
	// 			getPreciseAudiotime() < targetLineTiming.end
	// 		) {
	// 			console.log('audio already in range');
	// 		} else {
	// 			console.log('need to jump audio');
	// 			audioStartTimeSeconds = targetLineTiming.start;
	// 		}
	// 		scrollToLineIndex(targetLineIndex);
	// 	}
	// }

	let scrollTween = tweened(0, {
		duration: 600
		// interpolate: (a, b) => {
		// 	return (t) => {
		// 		// better to just set timeout on duration?
		// 		isProgrammaticScroll = t > 0 && t < 0.98; // ugh why no 1.0
		// 		isScrolling = isProgrammaticScroll;
		// 		return a + cubicInOut(t) * (b - a);
		// 	};
		// }
	});

	function scrollToLineIndex(lineIndex: number) {
		if (lineIndex != activeLineIndex) {
			console.log(`scrolling to ${lineIndex}`);
			if (chapterElement) {
				scrollTween = tweened(testScrollY, {
					duration: 600
					// interpolate: (a, b) => {
					// 	return (t) => {
					// 		// better to just set timeout on duration?
					// 		isProgrammaticScroll = t > 0 && t < 0.98; // ugh why no 1.0
					// 		isScrolling = isProgrammaticScroll;
					// 		return a + cubicInOut(t) * (b - a);
					// 	};
					// }
				});

				scrollTween.set(
					clamp(lineIndex, 0, chapterData.lines.length - 1) * chapterElement.offsetHeight
				);
			}
		}
	}

	$: {
		if (chapterElement) {
			chapterElement.scrollTop = $scrollTween;
		}
	}

	$: {
		testScrollY;
		preciseAudiotime;
		// fade lines in and out

		if (chapterElement) {
			for (const lineContainer of chapterElement.children as HTMLCollectionOf<HTMLDivElement>) {
				const { height, top } = lineContainer.getBoundingClientRect();
				lineContainer.style.opacity = `${Math.min(
					clamp(mapValue(top, 0, height * -fadeHeightPercent, 1.0, 0.0), 0.0, 1.0),
					clamp(mapValue(top, 0, height * fadeHeightPercent, 1.0, 0.0), 0.0, 1.0)
				)}`;
			}
		}

		const { start, end } = chapterData.lines[activeLineIndex].timing;

		console.log(`isProgrammaticScroll: ${isProgrammaticScroll}`);
		console.log(`isScrolling: ${isScrolling}`);
		console.log(`isPlaying: ${isPlaying}`);
		console.log(`preciseAudiotime: ${preciseAudiotime}`);

		// advance with audio

		const audioLineIndex = chapterData.lines.findIndex((line) => {
			return (
				round(preciseAudiotime, 2) >= round(line.timing.start, 2) &&
				round(preciseAudiotime, 2) < round(line.timing.end, 2)
			);
		});

		let scrollToCalled = false;

		if (isPlaying && !isScrolling) {
			// if (audioLineIndex != activeLineIndex) {
			scrollToLineIndex(audioLineIndex);
			scrollToCalled = true;
			// }
		}

		if (!scrollToCalled) {
			// either user or programmatic
			if (
				(preciseAudiotime < start || preciseAudiotime >= end) &&
				(audioStartTimeSeconds < start || audioStartTimeSeconds >= end)
			) {
				audioStartTimeSeconds = start;
				console.log(
					`need to move audio ${preciseAudiotime} is not in range ${start} ${end}... setting to ${audioStartTimeSeconds}`
				);
			}
		}
		scrollToCalled = false;
	}

	// if (activeLineIndex !== lineIndexFromScroll) {
	// 	activeLineIndex = lineIndexFromScroll;
	// 	// user-initiated scrolls should trip audio changes
	// 	if (e.isTrusted) {
	// 		console.log('jumping audio for user');
	// 		if (audioStartTimeSeconds !== chapterData.lines[activeLineIndex].timing.start) {
	// 			audioStartTimeSeconds = chapterData.lines[activeLineIndex].timing.start;
	// 		}
	// 	} else {
	// 		console.log('ignoring audio jump');
	// 	}
	// }
</script>

<div
	class="chapter"
	bind:this={chapterElement}
	on:scroll={(e) => {
		// @ts-ignore
		testScrollY = e?.target?.scrollTop || 0;
	}}
>
	{#each chapterData.lines as line}
		<div class="line-container">
			<Line lineData={line} audioTime={preciseAudiotime} {isPlaying} />
		</div>
	{/each}
</div>

<Playlist
	isShuffleOn={true}
	tracks={chapterData.ambientTracks}
	maxVolume={maxVolumeMusic}
	{isPlaying}
/>

{#key audioStartTimeSeconds}
	<!-- {#if isScrolling && !isProgrammaticScroll} -->
	<Audio
		audioSources={chapterData.voiceOver.files}
		{isPlaying}
		startTimeSeconds={audioStartTimeSeconds}
		maxVolume={maxVolumeSpeech}
		on:ended={onSpeechEnded}
		dispatchPreciseTimeEvents={true}
		on:preciseTimeUpdate={onVoiceOverTimeUpdate}
	/>
	<!-- {/if} -->
{/key}

<style>
	.chapter {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		overflow-y: scroll;
		overflow-x: hidden;
	}

	.scroll-snap-parent {
		scroll-snap-type: y mandatory;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
	}

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

	.scroll-snap-child {
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}
</style>
