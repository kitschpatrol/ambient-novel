<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { getType } from 'mime';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import round from 'lodash/round';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0;
	export let seeking = false;
	export let targetTime = 0;

	let audioElement: HTMLAudioElement;

	// have to use this instead of onMount to avoid null reference issues in Chapter
	function onAudioElementMounted(node: HTMLAudioElement) {
		node.currentTime = targetTime;
		node.volume = maxVolume;
		node.muted = false;
		if (isPlaying) node.play();
	}

	function playAudio() {
		if (audioElement) {
			audioElement
				.play()
				.then(() => {
					// all good
				})
				.catch((error) => {
					console.error(error);
				});
		}
	}

	function pauseAudio() {
		if (audioElement) audioElement.pause();
	}

	$: {
		isPlaying ? playAudio() : pauseAudio();
	}

	$: {
		if (audioElement) audioElement.currentTime = targetTime;
	}
</script>

<audio
	muted
	{loop}
	use:onAudioElementMounted
	bind:currentTime
	on:ended
	bind:this={audioElement}
	bind:seeking
	transition:fadeVolume={{ duration: 1000 }}
>
	{#each audioSources as source}
		<source src={source} type={getType(source)} />
	{/each}
	Your browser does not support the audio element.
</audio>
