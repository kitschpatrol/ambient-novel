<script lang="ts">
	import Audio from '$lib/components/Audio.svelte';
	import type { ChapterData, LineData } from '$lib/schemas/bookSchema';
	import { onMount } from 'svelte';
	import { quadInOut } from 'svelte/easing';
	import { spring } from 'svelte/motion';
	// export let isPlaying = false;
	export let chapterData: ChapterData;
	const duration = chapterData.voiceOver.durationSeconds;
	export let isPlaying = true;
	export let currentTime = 0;
	export let maxVolumeMusic = 0.1;
	export let maxVolumeSpeech = 1.0;

	let chapterElement: HTMLDivElement;
	let scrollTween = spring(0, {
		stiffness: 0.01,
		damping: 1.0
	});

	let targetOffset = 0;

	let rowWidth = 0;

	onMount(() => {
		// jump immediately to the correct line,
		// e.g. when switching chapters
		//scrollTo(0);
	});

	$: timedElements =
		chapterElement &&
		(chapterElement.querySelectorAll('li[data-time], span[data-time]') as NodeListOf<HTMLElement>);

	function scrollTo(offset: number) {
		if (chapterElement && rowWidth > 0) {
			$scrollTween = offset - rowWidth / 2;
		}
	}

	$: {
		if (chapterElement) {
			chapterElement.scrollLeft = $scrollTween;
		}
	}

	$: {
		scrollTo(targetOffset);
	}

	$: {
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...
		let currentElement: HTMLElement | null = null;
		if (timedElements) {
			for (const element of timedElements) {
				if (currentTime >= parseFloat(element.getAttribute('data-time') ?? '0')) {
					currentElement = element;
					continue;
				} else {
					if (currentElement) {
						const newOffset = currentElement.offsetLeft + currentElement.clientWidth / 2;
						if (newOffset != targetOffset) {
							targetOffset = newOffset;
							currentElement.style.opacity = '1.0';
						}
					}
					break;
				}
			}
		}
	}

	// $: {
	// 	// TODO merge with above
	// 	// TODO optimize hot path, don't need to do this on all lines at the same time?
	// 	// many are out of view...
	// 	if (timedElements) {
	// 		for (const element of timedElements) {
	// 			if (!isPlaying || currentTime >= parseFloat(element.getAttribute('data-time') ?? '0')) {
	// 				element.style.opacity = '1.0';
	// 			} else {
	// 				element.style.opacity = '0.2';
	// 			}
	// 		}
	// 	}
	// }

	$: {
		console.log(rowWidth);
	}

	const { lines } = chapterData;
</script>

<!-- HTML -->
<div
	bind:this={chapterElement}
	class="no-scrollbar flex flex-1 items-center overflow-y-hidden overflow-x-scroll whitespace-nowrap font-serif text-[5vh] text-white"
>
	<div bind:clientWidth={rowWidth} class="flex min-w-[100vw] justify-center">
		{chapterData.title}
	</div>
	{#each lines as line}
		{#if line.wordTimings}
			{#each line.wordTimings as wordTiming}
				<span style={`opacity: 0.2`} data-time={wordTiming.start}>{wordTiming.word}</span>&nbsp;
			{/each}
		{/if}
		<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
	{/each}
	<button class="absolute left-0 bg-red-300" on:click={() => (isPlaying = !isPlaying)}>
		{isPlaying ? 'Pause' : 'Play'}
	</button>
</div>

<Audio
	audioSources={chapterData.voiceOver.files}
	{isPlaying}
	maxVolume={maxVolumeSpeech}
	targetTime={0}
	bind:currentTime
/>

<Audio audioSources={chapterData.ambientTracks[0].files} {isPlaying} maxVolume={maxVolumeMusic} />

<style>
	:global([data-time]) {
		transition: opacity 800ms;
	}
</style>
