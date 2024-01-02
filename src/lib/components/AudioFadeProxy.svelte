<script lang="ts">
	// This wraps the Audio component and uses Svelte's transitions functionality
	// to fade the volume in and out when the audio is played and paused.
	import Audio from '$lib/components/Audio.svelte'

	export let audioSources: string[]
	export let maxVolume = 1

	export let isPlaying = false
	export let currentTime = 0 // Reports time to parent (does not write)
	export let targetTime = 0 // Parent uses to set requested time (does not read)

	// don't load the audio until it's first played,
	// this is an optimization to play well with the service worker
	// pre-caching and cut down initial load time

	let targetTimeProxy: number = targetTime
	let currentTimeProxy: number = currentTime
	let isPlayingProxy = isPlaying

	// A bit precarious
	$: {
		if (isPlaying && !isPlayingProxy) {
			// Starting to play
			targetTimeProxy = targetTime
			currentTime = targetTime
			isPlayingProxy = true
		} else if (isPlaying && isPlayingProxy) {
			// Playing
			targetTimeProxy = targetTime
			currentTime = currentTimeProxy
		} else if (!isPlaying && isPlayingProxy) {
			// Starting to pause
			// remember play position... this creates the issue...
			// remember in parent instead
			// targetTimeProxy = currentTime;
			// targetTime = currentTime;
			isPlayingProxy = false
		} else if (!isPlaying && !isPlayingProxy) {
			// Paused
			targetTimeProxy = targetTime
			currentTime = targetTimeProxy
		}
	}

	// Crossfade...
	// https://github.com/sveltejs/svelte/issues/1469
	// https://github.com/sveltejs/svelte/issues/4593
	// https://stackoverflow.com/questions/71830402/how-can-i-dynamically-add-and-remove-svelte-components-in-an-each-block
	// TODO  disable on ended in out-transitioning stuff?
</script>

{#key isPlaying}
	<Audio
		{audioSources}
		bind:currentTime={currentTimeProxy}
		isPlaying={isPlayingProxy}
		{maxVolume}
		on:canplaythrough
		on:ended
		targetTime={targetTimeProxy}
	/>
{/key}
