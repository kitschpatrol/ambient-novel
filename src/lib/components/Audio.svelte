<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { getType } from 'mime';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;

	let audioElement: HTMLAudioElement;

	function onAudioElementMounted(node: HTMLAudioElement) {
		node.volume = maxVolume;
		node.muted = false;
		if (isPlaying) node.play();
	}

	function playAudio() {
		if (audioElement) {
			audioElement
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
		if (audioElement) audioElement.pause();
	}

	$: {
		isPlaying ? playAudio() : pauseAudio();
	}
</script>

<audio
	muted
	{loop}
	use:onAudioElementMounted
	on:ended
	bind:this={audioElement}
	transition:fadeVolume={{ duration: 1000 }}
>
	{#each audioSources as source}
		<source src={source} type={getType(source)} />
	{/each}
	Your browser does not support the audio element.
</audio>
