<script lang="ts">
	import { fadeVolume } from '#lib/utils/transition/fade-volume.js'
	import { lookup } from 'mrmime'
	import { onMount } from 'svelte'

	type Props = {
		audioSources: string[]
		currentTime?: number
		isPlaying?: boolean
		onended?: () => void
	}

	let { audioSources, currentTime = $bindable(0), isPlaying = false, onended }: Props = $props()

	let audioElement: HTMLAudioElement | undefined = $state()
	let isInOutro = $state(false)
	let currentTimeProxy = $state(currentTime)

	onMount(() => {
		if (audioElement) {
			audioElement.currentTime = currentTimeProxy // Critical
		}

		updatePlay()
	})

	// Todo retries?
	function updatePlay() {
		if (!isInOutro && audioElement) {
			if (isPlaying) {
				void audioElement.play()
			} else {
				audioElement.pause()
			}
		}
	}

	$effect(() => {
		updatePlay()
	})

	// Don't send time updates in either direction during transitions
	$effect(() => {
		if (!isInOutro) {
			currentTime = currentTimeProxy
		}
	})

	$effect(() => {
		if (!isInOutro) {
			currentTimeProxy = currentTime
		}
	})
</script>

<!-- // adding preload="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->

<audio
	bind:this={audioElement}
	{onended}
	onintrostart={() => {
		// Accommodates resumption during a transition, if that happens before a new Audio player is created
		isInOutro = false
	}}
	onoutroend={() => {
		isInOutro = true
	}}
	onoutrostart={() => {
		isInOutro = true
	}}
	bind:currentTime={currentTimeProxy}
	transition:fadeVolume={{ duration: 5000 }}
>
	{#each audioSources as source (source)}
		<source src={source} type={lookup(source) ?? 'audio'} />
	{/each}
	Your browser does not support the audio element.
</audio>
