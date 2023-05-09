<script context="module" lang="ts">
	// matches ouput from generate-data.ts
	export type TrackInfo = {
		files: string[];
	};
</script>

<script lang="ts">
	import Audio from './Audio.svelte';
	// https://www.blazemeter.com/blog/import-lodash-libraries
	import range from 'lodash/range';
	import without from 'lodash/without';
	import sample from 'lodash/sample';

	// props
	export let tracks: TrackInfo[] = [];
	export let isPlaying = false;
	export let isShuffleOn = false;
	export let maxVolume = 1.0;

	// state
	let currentTrackIndex = isShuffleOn ? getFreshRandomIndex() : 0;

	function getFreshRandomIndex(currentIndex?: number): number {
		// excludes the current track
		return sample(without(range(tracks.length), currentIndex ?? -1)) ?? 0;
	}

	function nextTrack() {
		if (isShuffleOn) {
			currentTrackIndex = getFreshRandomIndex(currentTrackIndex);
		} else {
			currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
		}
	}

	function onTrackEnded() {
		console.log('[playlist] onTrackEnded');
		nextTrack();
	}

	$: currentTrackInfo = tracks[currentTrackIndex];
</script>

<Audio audioSources={currentTrackInfo.files} {isPlaying} {maxVolume} on:ended={onTrackEnded} />
