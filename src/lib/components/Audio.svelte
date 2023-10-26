<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { lookup } from 'mrmime';
	import { onMount } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0; // actual time of audio
	export let targetTime = 0; // time we're requesting

	let audioElement: HTMLAudioElement;

	const retryIntervalMs = 5000;
	let maxRetry = 3;

	function retry() {
		maxRetry--;

		if (maxRetry <= 0) {
			console.warn('max retries reached...');
		} else {
			console.warn(
				`retrying audio loading process in ${
					retryIntervalMs / 1000
				} seconds... ${maxRetry} retries left`
			);
			setTimeout(() => {
				if (audioElement) {
					mount();
				} else {
					console.error('audioElement is null');
				}
			}, retryIntervalMs);
		}
	}

	function mount() {
		// voodoo implementation
		// not sure if any of this helps
		// https://stackoverflow.com/a/73910818/2437832
		let savedCurentTime = audioElement.currentTime;
		// audioElement.src = audioSources[0];

		audioElement.load();

		audioElement.currentTime = savedCurentTime;

		audioElement.currentTime = targetTime; // critical
		audioElement.volume = maxVolume;
		audioElement.muted = false;
		if (isPlaying)
			audioElement
				.play()
				.then(() => {
					// all good
				})
				.catch((error) => {
					console.error(error);
					retry();
				});
	}

	onMount(() => {
		mount();
	});

	// function afterLoaded() {

	// }

	// // have to use this instead of onMount to avoid null reference issues in Chapter
	// function onAudioElementMounted(node: HTMLAudioElement) {
	// 	console.log('mount audio');
	// 	// forcing load fixes safari bugs changing chapters while playing
	// 	// https://stackoverflow.com/a/73441313/2437832
	// 	// needed even on a server that supports 206s
	// 	// node.load();
	// 	node.currentTime = targetTime;
	// 	node.
	// }

	const seekAudio = (time: number) => {
		// return new Promise((resolve) => {
		// 	// Event listener for when the seek is complete
		// 	// const onSeeked = () => {
		// 	// 	// console.log('seeked');
		// 	// 	// Remove the event listener to clean up
		// 	// 	audioElement.removeEventListener('seeked', onSeeked);
		// 	// 	// Resolve the promise
		// 	// 	// resolve();
		// 	// };

		// 	// Add the event listener
		// 	// audioElement.addEventListener('seeked', onSeeked);

		// 	// Perform the seek
		// 	audioElement.currentTime = time;
		// });
		audioElement.currentTime = time;
	};

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

	$: isPlaying ? playAudio() : pauseAudio();
	$: audioElement && seekAudio(targetTime);

	let currentTimeProxy: number = currentTime;
	let isInOutro = false;

	$: !isInOutro && (currentTime = currentTimeProxy);
</script>

<!-- // adding prelad="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->
<!-- // preload auto without a manual call to "load" only runs on the first file on mobile safari -->
<audio
	muted
	{loop}
	preload="auto"
	on:canplaythrough
	bind:currentTime={currentTimeProxy}
	on:ended
	bind:this={audioElement}
	transition:fadeVolume|local={{ duration: 600 }}
	on:outrostart={() => {
		// don't send time updates during transitions
		isInOutro = true;
	}}
	on:outroend={() => {
		isInOutro = false;
	}}
	on:introstart={() => {
		// accommodates resumption during a transition, if that happenns before a new Audio player is created
		isInOutro = false;
	}}
	on:introend={() => {}}
	on:error={() => {
		console.error(`audio error for "${audioSources}"`);
		retry();
	}}
>
	{#each audioSources as source}
		<source
			src={source}
			type={lookup(source) ?? 'audio'}
			on:error={() => {
				console.error(`audio source error for "${source}"`);
				retry();
			}}
		/>
	{/each}
	Your browser does not support the audio element.
</audio>
