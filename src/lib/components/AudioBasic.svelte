<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';

	import { lookup } from 'mrmime';
	import { onMount } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let currentTime = 0;

	let audioElement: HTMLAudioElement;
	let isInOutro = false;
	let currentTimeProxy: number = currentTime;

	onMount(() => {
		// audioElement.load();
		audioElement.currentTime = currentTimeProxy; // critical
		updatePlay(isPlaying);
	});

	// todo retries?
	function updatePlay(playing: boolean) {
		if (!isInOutro) {
			if (audioElement) {
				if (playing) {
					audioElement.play(); // remember this is a promise
				} else {
					audioElement.pause();
				}
			}
		}
	}

	function updateCurrentTimeProxy(time: number, isInOutro: boolean) {
		if (!isInOutro) currentTimeProxy = time;
	}

	function updateCurrentTime(time: number, isInOutro: boolean) {
		if (!isInOutro) currentTime = time;
	}

	$: updatePlay(isPlaying);
	$: updateCurrentTime(currentTimeProxy, isInOutro);
	$: updateCurrentTimeProxy(currentTime, isInOutro);
</script>

<!-- // adding prelad="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->

<audio
	on:ended
	bind:this={audioElement}
	bind:currentTime={currentTimeProxy}
	transition:fadeVolume|local={{ duration: 5000 }}
	on:outrostart={() => {
		isInOutro = true;
	}}
	on:outroend={() => {
		isInOutro = true;
	}}
	on:introstart={() => {
		// accommodates resumption during a transition, if that happenns before a new Audio player is created
		isInOutro = false;
	}}
>
	{#each audioSources as source}
		<source src={`${source}`} type={lookup(source) ?? 'audio'} />
	{/each}
	Your browser does not support the audio element.
</audio>
