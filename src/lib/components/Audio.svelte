<script lang="ts">
	import { base } from '$app/paths';
	import { crossfadeVolume } from '$lib/utils/transition/crossfadeVolume';
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { getType } from 'mime';

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
		// needed even on a server that supports 206s
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

	function pauseAudio() {
		if (audioElement) audioElement.pause();
	}

	$: {
		isPlaying ? playAudio() : pauseAudio();
	}

	$: {
		if (audioElement) audioElement.currentTime = targetTime;
	}

	let currentTimeProxy: number = currentTime;
	let isInOutro = false;

	$: !isInOutro && (currentTime = currentTimeProxy);

	// const [send, receive] = crossfadeVolume;
	// transition:
</script>

<!-- // adding prelad="none" was key to currentTime bugs on mobile safari -->
<!-- // but only on CF pages which doesn't yet handle 206s range responses -->
<!-- // now apparently not necessary after switching to netlify with 206 support -->
<audio
	muted
	{loop}
	use:onAudioElementMounted
	bind:currentTime={currentTimeProxy}
	on:ended
	bind:this={audioElement}
	bind:seeking
	transition:fadeVolume={{ duration: 1000 }}
	on:outrostart={() => {
		console.log('outrostart');
		// don't send time updates during transitions
		isInOutro = true;
	}}
	on:outroend={() => {
		isInOutro = false;
		console.log('outroend');
	}}
	on:introstart={() => {
		console.log('introstart');
		// accommodates resumption during a transition, if that happenns before a new Audio player is created
		isInOutro = false;
	}}
	on:introend={() => {
		console.log('introend');
	}}
>
	{#each audioSources as source}
		<source src={`${base}/${source}`} type={getType(source)} />
	{/each}
	Your browser does not support the audio element.
</audio>
