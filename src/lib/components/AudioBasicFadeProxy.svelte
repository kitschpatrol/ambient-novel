<script lang="ts">
	// This wraps the Audio component and uses Svelte's transitions functionality
	// to fade the volume in and out when the audio is played and paused.
	import AudioBasic from '#lib/components/AudioBasic.svelte'

	type Props = {
		audioSources: string[]
		currentTime?: number
		isPlaying?: boolean
		onended?: () => void
	}

	let { audioSources, currentTime = $bindable(0), isPlaying = false, onended }: Props = $props()

	// The proxies start from the initial prop values, the effect below keeps them in sync
	// svelte-ignore state_referenced_locally
	let isPlayingProxy = $state(isPlaying)
	let currentTimeProxy = $state(currentTime)

	// Don't load the audio until it's first played,
	// this is an optimization to play well with the service worker
	// pre-caching and cut down initial load time
	let hasPlayed = $state(false)

	// A bit precarious
	$effect(() => {
		// First play
		if (!hasPlayed && isPlaying) {
			hasPlayed = true
		}

		if (isPlaying && !isPlayingProxy) {
			// Starting to play
			isPlayingProxy = true
			currentTimeProxy = currentTime
		} else if (!isPlaying && !isPlayingProxy) {
			// Possibly scrubbing, parent drives time
			currentTimeProxy = currentTime
		} else if (isPlaying && isPlayingProxy) {
			// Playing, audio drives time
			currentTime = currentTimeProxy
		} else if (!isPlaying && isPlayingProxy) {
			// Starting to pause
			isPlayingProxy = false
			currentTimeProxy = currentTime
		}
	})

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
			isPlaying={isPlayingProxy && isPlaying}
			{onended}
			bind:currentTime={currentTimeProxy}
		/>
	{/key}
{/if}
