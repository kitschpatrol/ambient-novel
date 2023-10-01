<script lang="ts">
	import { base } from '$app/paths';

	import { Howl } from 'howler';
	import { onDestroy } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0; // actual time of audio
	export let targetTime = 0; // time we're requesting

	let loaded = false;

	// TODO forward end event

	const sound = new Howl({
		src: audioSources,
		html5: false,
		preload: false // service worker should keep it hot
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
	$: sound.volume(maxVolume);

	$: {
		if (isPlaying) {
			if (!loaded) {
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
