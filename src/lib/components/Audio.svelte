<script lang="ts">
	import { fadeVolume } from '#lib/utils/transition/fade-volume.js'
	import { lookup } from 'mrmime'
	import { onMount } from 'svelte'

	type Props = {
		audioSources: string[]
		currentTime?: number // Actual time of audio
		isPlaying?: boolean
		loop?: boolean
		maxVolume?: number
		oncanplaythrough?: () => void
		onended?: () => void
		targetTime?: number // Time we're requesting
	}

	let {
		audioSources,
		currentTime = $bindable(0),
		isPlaying = false,
		loop = false,
		maxVolume = 1,
		oncanplaythrough,
		onended,
		targetTime = 0,
	}: Props = $props()

	let audioElement: HTMLAudioElement | undefined = $state()

	const retryIntervalMs = 5000
	let maxRetry = 3

	function retry() {
		maxRetry--

		if (maxRetry <= 0) {
			console.warn('max retries reached...')
		} else {
			console.warn(
				`retrying audio loading process in ${
					retryIntervalMs / 1000
				} seconds... ${maxRetry} retries left`,
			)
			setTimeout(() => {
				if (audioElement) {
					mount()
				} else {
					console.error('audioElement is missing')
				}
			}, retryIntervalMs)
		}
	}

	function mount() {
		if (!audioElement) {
			return
		}

		// Voodoo implementation
		// not sure if any of this helps
		// https://stackoverflow.com/a/73910818/2437832
		const savedCurrentTime = audioElement.currentTime

		audioElement.load()

		audioElement.currentTime = savedCurrentTime

		audioElement.currentTime = targetTime // Critical
		audioElement.volume = maxVolume
		audioElement.muted = false
		if (isPlaying) {
			void playOrRetry(audioElement)
		}
	}

	async function playOrRetry(element: HTMLAudioElement) {
		try {
			await element.play()
		} catch (error) {
			console.error(error)
			retry()
		}
	}

	onMount(() => {
		mount()
	})

	async function playAudio() {
		if (audioElement) {
			try {
				await audioElement.play()
			} catch (error) {
				console.error(error)
			}
		}
	}

	function pauseAudio() {
		if (audioElement) {
			audioElement.pause()
		}
	}

	$effect(() => {
		if (isPlaying) {
			void playAudio()
		} else {
			pauseAudio()
		}
	})

	$effect(() => {
		if (audioElement) {
			audioElement.currentTime = targetTime
		}
	})

	let currentTimeProxy = $state(currentTime)
	let isInOutro = $state(false)

	// Don't send time updates up during transitions
	$effect(() => {
		if (!isInOutro) {
			currentTime = currentTimeProxy
		}
	})
</script>

<!-- // adding preload="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->
<!-- // preload auto without a manual call to "load" only runs on the first file on mobile safari -->
<audio
	bind:this={audioElement}
	{loop}
	muted
	{oncanplaythrough}
	{onended}
	onerror={() => {
		console.error(`audio error for "${String(audioSources)}"`)
		retry()
	}}
	onintrostart={() => {
		// Accommodates resumption during a transition, if that happens before a new Audio player is created
		isInOutro = false
	}}
	onoutroend={() => {
		isInOutro = false
	}}
	onoutrostart={() => {
		isInOutro = true
	}}
	preload="auto"
	bind:currentTime={currentTimeProxy}
	transition:fadeVolume={{ duration: 600 }}
>
	{#each audioSources as source (source)}
		<source
			onerror={() => {
				console.error(`audio source error for "${source}"`)
				retry()
			}}
			src={source}
			type={lookup(source) ?? 'audio'}
		/>
	{/each}
	Your browser does not support the audio element.
</audio>
