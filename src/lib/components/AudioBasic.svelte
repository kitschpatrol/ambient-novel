<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fade-volume'
	import { lookup } from 'mrmime'
	import { onMount } from 'svelte'

	export let audioSources: string[]
	export let isPlaying = false
	export let currentTime = 0

	let audioElement: HTMLAudioElement
	let isInOutro = false
	let currentTimeProxy: number = currentTime

	onMount(() => {
		// AudioElement.load();
		audioElement.currentTime = currentTimeProxy // Critical
		updatePlay(isPlaying)
	})

	// Todo retries?
	function updatePlay(playing: boolean) {
		if (!isInOutro && audioElement) {
			if (playing) {
				audioElement.play() // Remember this is a promise
			} else {
				audioElement.pause()
			}
		}
	}

	function updateCurrentTimeProxy(time: number, isInOutro: boolean) {
		if (!isInOutro) currentTimeProxy = time
	}

	function updateCurrentTime(time: number, isInOutro: boolean) {
		if (!isInOutro) currentTime = time
	}

	$: updatePlay(isPlaying)
	$: updateCurrentTime(currentTimeProxy, isInOutro)
	$: updateCurrentTimeProxy(currentTime, isInOutro)
</script>

<!-- // adding preload="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->

<audio
	bind:currentTime={currentTimeProxy}
	bind:this={audioElement}
	on:ended
	on:introstart={() => {
		// Accommodates resumption during a transition, if that happens before a new Audio player is created
		isInOutro = false
	}}
	on:outroend={() => {
		isInOutro = true
	}}
	on:outrostart={() => {
		isInOutro = true
	}}
	transition:fadeVolume|local={{ duration: 5000 }}
>
	{#each audioSources as source}
		<source src={`${source}`} type={lookup(source) ?? 'audio'} />
	{/each}
	Your browser does not support the audio element.
</audio>
