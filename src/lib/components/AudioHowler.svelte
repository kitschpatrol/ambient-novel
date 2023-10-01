<script lang="ts">
	import { Howl } from 'howler';
	import { onDestroy } from 'svelte';

	export let audioSources: string[];
	export let isPlaying = false;
	export let maxVolume = 1.0;
	export let loop = false;
	export let currentTime = 0; // actual time of audio
	export let targetTime = 0; // time we're requesting

	console.log(`audioSources: ${audioSources}`);
	const sound = new Howl({
		src: audioSources,
		html5: false,
		preload: true
	});

	function updateSeekTime() {
		const time = sound.seek();
		if (time !== currentTime) {
			currentTime = time;
		}
	}

	const seekInterval = setInterval(() => {
		updateSeekTime();
	}, 100);

	onDestroy(() => {
		clearInterval(seekInterval);
	});

	$: sound.loop(loop);
	$: sound.volume(maxVolume);

	$: {
		if (isPlaying) {
			sound.play();
			updateSeekTime();
		} else {
			sound.pause();
			updateSeekTime();
		}
	}

	$: {
		sound.seek(targetTime);
	}
</script>

<!-- HTML -->
