<script lang="ts">
	import { fade } from 'svelte/transition';
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { createEventDispatcher } from 'svelte';

	export let isPlaying: boolean;
	export let text: string;
	export let textIndex: number;
	export let speechSrc: string;
	export let musicSrc: string;
	export let maxVolumeSpeech: number;
	export let maxVolumeMusic: number;

	// https://stackoverflow.com/questions/64087782/svelte-event-parameter-type-for-typescript
	const dispatch = createEventDispatcher<{ audioEnded: number }>();

	let audioElements: HTMLAudioElement[] = [];

	function onAudioElementMounted(node: HTMLAudioElement) {
		const maxVolume = node.getAttribute('data-volume-max');
		node.volume = maxVolume ? parseFloat(maxVolume) : 1.0;
		node.muted = false;
		if (isPlaying) node.play();
	}

	function onAudioEnded() {
		dispatch('audioEnded', textIndex);
	}

	function playAudio() {
		for (const element of audioElements) {
			if (element)
				element
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
		for (const element of audioElements) {
			if (element) element.pause();
		}
	}

	$: {
		isPlaying ? playAudio() : pauseAudio();
	}
</script>

<div class="line" transition:fade>
	<p>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html text}
	</p>
	<p class="lineNumber">{textIndex + 1}</p>
	<audio
		muted
		use:onAudioElementMounted
		on:ended={onAudioEnded}
		bind:this={audioElements[0]}
		transition:fadeVolume={{ duration: 2000 }}
		data-max-volume={maxVolumeMusic}
	>
		<source src={musicSrc} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
	<audio
		muted
		use:onAudioElementMounted
		transition:fadeVolume={{ duration: 2000 }}
		bind:this={audioElements[1]}
		data-max-volume={maxVolumeSpeech}
	>
		<source src={speechSrc} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
</div>

<style>
	div.line {
		grid-area: 1 / 1; /* force overlap for transitions */
		justify-self: center;
		align-self: center;
		background-color: rgba(255, 255, 255);
		box-shadow: -3px 3px 5px #00000067;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1.2rem;
		line-height: 120%;
		text-indent: 3.6rem;
		padding: 30px;
		max-width: 550px;
		/* text-align: justify; */
		position: relative;
	}

	p.lineNumber {
		position: absolute;
		font-style: italic;
		right: 12px;
		bottom: 5px;
		text-indent: 0;
		font-size: 0.7rem;
		color: rgb(182, 182, 182);
	}
</style>
