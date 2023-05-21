<script lang="ts">
	import { browser } from '$app/environment';
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { getType } from 'mime';
	import { onMount, tick } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0;
	export let seeking = false;
	export let targetTime = 0;

	let audioElement: HTMLAudioElement;

	// have to use this instead of onMount to avoid null reference issues in Chapter
	function onAudioElementMounted(node: HTMLAudioElement) {
		// forcing load fixes safari bugs changing chapters while playing
		// https://stackoverflow.com/a/73441313/2437832
		node.load();
		node.currentTime = targetTime;
		node.volume = maxVolume;
		node.muted = false;
		if (isPlaying)
			node
				.play()
				.then(() => {
					// all good
				})
				.catch((error) => {
					console.error(error);
				});
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

	// onMount(() => {
	// 	if (browser && audioElement) {
	// 		console.log(
	// 			`setting preoad from user agent ${window.navigator.userAgent} on ${audioElement}`
	// 		);

	// 		let index = window.navigator.userAgent.indexOf('Chrome');
	// 		if (index === -1) {
	// 			console.log('setting none');
	// 			audioElement.preload = 'none';
	// 		} else {
	// 			console.log('setting auto');
	// 			audioElement.preload = 'auto';
	// 		}

	// 		console.log(`${audioElement.preload}`);
	// 	}
	// });

	function pauseAudio() {
		if (audioElement) audioElement.pause();
	}

	$: {
		isPlaying ? playAudio() : pauseAudio();
	}

	$: {
		if (audioElement) {
			audioElement.currentTime = targetTime;
			console.log(`targetTime: ${targetTime}`);
			console.log(`currentTime: ${audioElement.currentTime}`);
		}
	}
</script>

<!-- // adding prelad="none" was key to currentTime bugs on mobile safari -->
<!-- // but CF pages doesn't yet return 206s, so maybe keeping preload on deployment? -->
<audio
	muted
	{loop}
	preload="none"
	use:onAudioElementMounted
	bind:currentTime
	on:ended
	on:canplaythrough={(e) => {
		console.log('canplaythrough!');
		// https://stackoverflow.com/questions/37044064/html-audio-cant-set-currenttime
		if (isPlaying && audioElement.currentTime !== targetTime) {
			console.log(audioElement.currentTime);
			audioElement.pause();
			tick().then(() => {
				audioElement.currentTime = targetTime;
				audioElement.play();
				console.log(audioElement.currentTime);
			});
		}
	}}
	bind:this={audioElement}
	bind:seeking
	transition:fadeVolume={{ duration: 1000 }}
>
	{#each audioSources as source}
		<source src={source} type={getType(source)} />
	{/each}
	Your browser does not support the audio element.
</audio>
