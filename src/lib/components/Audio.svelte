<script lang="ts">
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { getType } from 'mime';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import round from 'lodash/round';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let dispatchPreciseTimeEvents = false;
	export let startTimeSeconds = 0;

	let audioElement: HTMLAudioElement;
	let previousAudioTime = -1;

	// https://stackoverflow.com/questions/64087782/svelte-event-parameter-type-for-typescript
	const dispatch = createEventDispatcher<{
		preciseTimeUpdate: { currentTime: number; startTimeSeconds: number };
	}>();

	let requestAnimationFrameId: number | null = null;

	// have to use this instead of onMount to avoid null reference issues in Chapter
	function onAudioElementMounted(node: HTMLAudioElement) {
		node.currentTime = startTimeSeconds;
		node.volume = maxVolume;
		node.muted = false;
		if (isPlaying) node.play();

		if (dispatchPreciseTimeEvents) {
			const loop = () => {
				if (!node.seeking && isPlaying) {
					const currentTime = round(node.currentTime, 3);
					if (previousAudioTime !== currentTime) {
						dispatch('preciseTimeUpdate', { currentTime, startTimeSeconds });
						previousAudioTime = currentTime;
					}
				}
				requestAnimationFrameId = requestAnimationFrame(loop);
			};

			loop();
		}
	}

	onDestroy(() => {
		if (requestAnimationFrameId) {
			cancelAnimationFrame(requestAnimationFrameId);
		}
	});

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
