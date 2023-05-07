<script lang="ts">
	import { title, lines, ambientMusicFilePath } from '$lib/data-generated/text.json';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import shuffle from 'lodash/shuffle';
	import clamp from 'lodash/clamp';
	import Card from '$lib/components/Card.svelte';
	import Audio from '$lib/components/Audio.svelte';

	// config
	const maxVolumeSpeech = 1.0;
	const maxVolumeMusic = 0.4;

	// state, but history button doesn't work?
	const searchParams = $page.url.searchParams;
	const queryLine = searchParams ? searchParams.get('line') : undefined;
	let activeLineIndex = queryLine ? parseInt(queryLine) - 1 : 0;
	let isPlaying = false;
	let lineSequence = Array.from({ length: lines.length }, (_, i) => i);

	function previousLine() {
		const currentSequenceIndex = lineSequence.findIndex((line) => line === activeLineIndex);
		activeLineIndex = lineSequence[(currentSequenceIndex - 1 + lines.length) % lines.length];
	}

	function nextLine() {
		const currentSequenceIndex = lineSequence.findIndex((line) => line === activeLineIndex);
		activeLineIndex = lineSequence[(currentSequenceIndex + 1) % lineSequence.length];
	}

	// https://stackoverflow.com/questions/64087782/svelte-event-parameter-type-for-typescript
	function onAudioEnded(event: CustomEvent<number>) {
		const textIndex = event.detail;
		// make sure this message came from the active card (because of transitions)
		if (textIndex !== activeLineIndex) {
			return;
		}
		nextLine();
	}

	function shuffleSequence() {
		lineSequence = shuffle(lineSequence);
	}

	function sortSequence() {
		lineSequence = lineSequence.sort((a, b) => a - b);
	}

	$: isSorted = lineSequence.every((line, i) => line === i);
	$: activeLine = lines[activeLineIndex];

	$: {
		// validate active line
		activeLineIndex = clamp(activeLineIndex, 0, lines.length - 1);

		// update query params, don't push history
		$page.url.searchParams.set('line', (activeLineIndex + 1).toString());
		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>{title} — Line {activeLineIndex + 1}</title>
	<!-- https://github.com/sveltejs/kit/issues/4039 -->
	<!-- <link
		rel="preload"
		href="/fonts/nasalization/nasalization-extended-light.woff2"
		as="font"
		crossOrigin="anonymous"
	/> -->
</svelte:head>

<div class="book">
	{#key activeLine}
		<Card
			{isPlaying}
			text={activeLine.text}
			textIndex={activeLineIndex}
			audioSrc={activeLine.speechFilePath}
			maxVolume={maxVolumeSpeech}
			on:audioEnded={onAudioEnded}
		/>
	{/key}
</div>

<div id="controls">
	<span class="button-group">
		<button on:click={shuffleSequence}>Shuffle</button>
		<button disabled={isSorted} on:click={sortSequence}>Sort</button>
	</span>
	<span class="button-group">
		<button on:click={previousLine}>Previous</button>
		<button on:click={nextLine}>Next</button>
	</span>
	<span class="button-group">
		<button
			class={isPlaying ? '' : 'down'}
			disabled={!isPlaying}
			on:click={() => (isPlaying = false)}>Pause</button
		>
		<button class={isPlaying ? 'down' : ''} disabled={isPlaying} on:click={() => (isPlaying = true)}
			>Play</button
		>
	</span>
</div>

<Audio loop={true} audioSrc={ambientMusicFilePath} maxVolume={maxVolumeMusic} {isPlaying} />

<style>
	div.book {
		display: grid;
		grid-template-columns: 100vw;
		grid-template-rows: 75vh;
	}

	div#controls {
		position: absolute;
		bottom: 20px;
		text-align: center;
		width: 100%;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	button {
		font-family: 'Nasalization Extended', sans-serif;
		background-color: rgba(255, 255, 255, 0.75);
		border: none;
		padding: 10px;
		margin: 3px;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: -3px 3px 5px #00000067;
		position: relative;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	@media (hover: hover) {
		button:hover {
			background-color: white;
		}
	}

	button:enabled:active,
	button.down {
		top: 1px;
		right: 1px;
		box-shadow: -2px 3px 5px #00000067;
	}

	button:disabled {
		color: rgba(0, 0, 0, 0.3);
		background-color: rgba(255, 255, 255, 0.3);
	}

	span.button-group {
		padding: 8px 20px;
		display: inline-block;
	}
</style>
