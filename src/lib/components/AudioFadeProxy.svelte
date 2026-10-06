<script lang="ts">
	// This wraps the Audio component and uses Svelte's transitions functionality
	// to fade the volume in and out when the audio is played and paused.
	import Audio from '#lib/components/Audio.svelte'

	type Props = {
		audioSources: string[]
		currentTime?: number // Reports time to parent (does not write)
		isPlaying?: boolean
		maxVolume?: number
		oncanplaythrough?: () => void
		onended?: () => void
		targetTime?: number // Parent uses to set requested time (does not read)
	}

	let {
		audioSources,
		currentTime = $bindable(0),
		isPlaying = false,
		maxVolume = 1,
		oncanplaythrough,
		onended,
		targetTime = 0,
	}: Props = $props()

	// The proxies start from the initial prop values, the effect below keeps them in sync
	// svelte-ignore state_referenced_locally
	let targetTimeProxy = $state(targetTime)
	let currentTimeProxy = $state(currentTime)
	// svelte-ignore state_referenced_locally
	let isPlayingProxy = $state(isPlaying)

	// A bit precarious
	$effect(() => {
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
			// the play position is remembered in the parent
			isPlayingProxy = false
		} else if (!isPlaying && !isPlayingProxy) {
			// Paused
			targetTimeProxy = targetTime
			currentTime = targetTimeProxy
		}
	})

	// Crossfade...
	// https://github.com/sveltejs/svelte/issues/1469
	// https://github.com/sveltejs/svelte/issues/4593
	// https://stackoverflow.com/questions/71830402/how-can-i-dynamically-add-and-remove-svelte-components-in-an-each-block
	// TODO  disable on ended in out-transitioning stuff?
</script>

{#key isPlaying}
	<Audio
		{audioSources}
		isPlaying={isPlayingProxy}
		{maxVolume}
		{oncanplaythrough}
		{onended}
		targetTime={targetTimeProxy}
		bind:currentTime={currentTimeProxy}
	/>
{/key}
