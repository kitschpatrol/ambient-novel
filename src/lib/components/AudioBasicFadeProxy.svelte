<script lang="ts">
	// This wraps the Audio component and uses Svelte's transitions functionality
	// to fade the volume in and out when the audio is played and paused.
	import AudioBasic from '$lib/components/AudioBasic.svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let currentTime = 0;

	let isPlayingProxy: boolean = isPlaying;
	let currentTimeProxy: number = currentTime;

	// Don't load the audio until it's first played,
	// this is an optimization to play well with the service worker
	// pre-caching and cut down initial load time
	let hasPlayed = false;

	// // a bit precarious
	$: {
		// First play
		if (!hasPlayed && isPlaying) {
			hasPlayed = true;
		}

		if (isPlaying && !isPlayingProxy) {
			// Starting to play
			// this tick is critical?

			// tick().then(() => {
			isPlayingProxy = true;
			currentTimeProxy = currentTime;
			// });
		} else if (!isPlaying && !isPlayingProxy) {
			// Possibly scrubbing, parent drives time
			currentTimeProxy = currentTime;
		} else if (isPlaying && isPlayingProxy) {
			// Playing, audio drives time
			currentTime = currentTimeProxy;
		} else if (!isPlaying && isPlayingProxy) {
			// Starting to pause
			// tick().then(() => {
			isPlayingProxy = false;
			currentTimeProxy = currentTime;
			// });
		}
	}

	// Crossfade...
	// https://github.com/sveltejs/svelte/issues/1469
	// https://github.com/sveltejs/svelte/issues/4593
	// https://stackoverflow.com/questions/71830402/how-can-i-dynamically-add-and-remove-svelte-components-in-an-each-block
	// TODO  disable on ended in out-transitioning stuff?
</script>

{#if hasPlayed}
	{#key isPlaying}
		<AudioBasic
			{audioSources}
			bind:currentTime={currentTimeProxy}
			isPlaying={isPlayingProxy && isPlaying}
			on:ended
		/>
	{/key}
{/if}
