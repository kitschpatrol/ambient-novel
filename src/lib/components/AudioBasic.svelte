<script lang="ts">
	import pkg from 'mime';
	import { onMount } from 'svelte';
	const { getType } = pkg;

	export let audioSources: string[];
	export let isPlaying = false;
	export let currentTime = 0;

	let audioElement: HTMLAudioElement;

	onMount(() => {
		updatePlay(isPlaying);
	});

	function updatePlay(playing: boolean) {
		if (audioElement) {
			if (playing) {
				audioElement.play();
			} else {
				audioElement.pause();
			}
		}
	}

	$: updatePlay(isPlaying);
</script>

<!-- // adding prelad="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->
<audio on:ended bind:this={audioElement} bind:currentTime>
	{#each audioSources as source}
		<source src={`${source}`} type={getType(source)} />
	{/each}
	Your browser does not support the audio element.
</audio>
