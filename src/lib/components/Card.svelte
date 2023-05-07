<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import Audio from './Audio.svelte';

	export let isPlaying: boolean;
	export let text: string;
	export let textIndex: number;
	export let audioSrc: string;
	export let maxVolume: number;

	// https://stackoverflow.com/questions/64087782/svelte-event-parameter-type-for-typescript
	const dispatch = createEventDispatcher<{ audioEnded: number }>();

	function onAudioEnded() {
		dispatch('audioEnded', textIndex);
	}
</script>

<div class="line" transition:fade>
	<p>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html text}
	</p>
	<p class="lineNumber">{textIndex + 1}</p>
	<Audio {audioSrc} {isPlaying} {maxVolume} loop={false} on:ended={onAudioEnded} />
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
