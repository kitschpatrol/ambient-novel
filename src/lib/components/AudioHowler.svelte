<script lang="ts">
	import { linear } from 'svelte/easing';
	import type { FadeParams, TransitionConfig } from 'svelte/transition';

	import { Howl } from 'howler';
	import { createEventDispatcher, onDestroy } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0; // actual time of audio
	export let targetTime = 0; // time we're requesting

	let loaded = false;
	let volume = 1.0;

	export function fadeVolumeHowler(
		_: HTMLDivElement,
		{ delay = 0, duration = 600, easing = linear }: FadeParams = {}
	): TransitionConfig {
		return {
			delay,
			duration,
			easing,
			tick: (t) => {
				volume = maxVolume * t;
			}
		};
	}

	// false crashes on ios... but managing through howler still seems better than Audio.svelte???
	const html5 = true;
	const dispatch = createEventDispatcher<{ ended: null }>();

	// TODO forward end event

	const sound = new Howl({
		src: audioSources,
		html5,
		preload: false // service worker should keep it hot
	});

	sound.on('end', () => {
		// TODO this is weirdly buggy
		if (isPlaying) dispatch('ended');
	});

	function updateCurrentTime() {
		const time = sound.seek();
		if (time !== currentTime) {
			currentTime = time;
		}
	}

	const seekInterval = setInterval(() => {
		updateCurrentTime();
	}, 100);

	onDestroy(() => {
		clearInterval(seekInterval);
	});

	$: sound.loop(loop);
	$: sound.volume(volume * maxVolume);

	$: {
		if (isPlaying) {
			// only load on play if we're not using html5 audio
			if (!html5 && !loaded) {
				sound.load();
				loaded = true;
			}
			if (!sound.playing()) {
				sound.play();
			}
			updateCurrentTime();
		} else {
			sound.pause();
			updateCurrentTime();
		}
	}

	$: {
		sound.seek(targetTime);
	}
</script>

<!-- HTML -->
<div style="display: none;" transition:fadeVolumeHowler={{ duration: 1000 }} />
