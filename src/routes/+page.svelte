<script lang="ts">
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { fadeVolume } from '$lib/utils/transition/fadeVolume';
	import { lines } from '$lib/data-generated/text.json';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import shuffle from 'lodash.shuffle';

	function initialVolume(node: HTMLAudioElement) {
		const maxVolume = node.getAttribute('data-volume-max');
		node.volume = maxVolume ? parseFloat(maxVolume) : 1.0;
		node.muted = false;
		if (playing) {
			node.play();
		}
	}

	function onAudioEnded(event: Event) {
		const audioElement = event.target as HTMLAudioElement;
		const associatedLine = audioElement.getAttribute('data-line-number');
		if (associatedLine && parseInt(associatedLine) === activeLine) {
			nextLine();
		}
	}

	function previousLine() {
		const currentSequenceIndex = lineSequence.findIndex((line) => line === activeLine);
		activeLine = lineSequence[(currentSequenceIndex - 1 + lines.length) % lines.length];
	}

	function nextLine() {
		const currentSequenceIndex = lineSequence.findIndex((line) => line === activeLine);
		activeLine = lineSequence[(currentSequenceIndex + 1) % lineSequence.length];
	}

	function shuffleSequence() {
		lineSequence = shuffle(lineSequence);
	}

	function sortSequence() {
		lineSequence = lineSequence.sort((a, b) => a - b);
	}

	const maxVolumeSpeech = 1.0;
	const maxVolumeMusic = 0.4;

	// state
	const searchParams = browser && $page.url.searchParams;
	const queryLine = searchParams ? searchParams.get('line') : undefined;
	let activeLine = queryLine ? parseInt(queryLine) - 1 : 0;
	let playing = false;
	let lineSequence = Array.from({ length: lines.length }, (_, i) => i);

	$: isSorted = lineSequence.every((line, i) => line === i);

	function playAudio() {
		const audioElements = document.getElementsByTagName(
			'audio'
		) as HTMLCollectionOf<HTMLAudioElement>;
		for (const element of audioElements) {
			element
				.play()
				.then(() => {})
				.catch((error) => {
					console.error(error);
				});
		}
	}

	function pauseAudio() {
		const audioElements = document.getElementsByTagName(
			'audio'
		) as HTMLCollectionOf<HTMLAudioElement>;
		for (const element of audioElements) {
			element.pause();
		}
	}

	$: {
		if (browser) {
			// update query params
			const urlSearchParams = $page.url.searchParams;
			urlSearchParams.set('line', (activeLine + 1).toString());
			goto(`?${$page.url.searchParams.toString()}`);

			// play/pause all audio elements
			// we can't use bind here because of bugs...

			if (playing) {
				playAudio();
			} else {
				pauseAudio();
			}
		}
	}
</script>

<div class="book">
	{#key activeLine}
		<div class="line" transition:fade>
			{@html lines[activeLine].text}
			<p class="lineNumber">
				{activeLine + 1}
			</p>
		</div>
		<audio
			muted
			use:initialVolume
			on:ended={onAudioEnded}
			data-line-number={activeLine}
			data-volume-max={maxVolumeMusic}
			transition:fadeVolume={{ duration: 2000 }}
		>
			<source src={lines[activeLine].musicFilePath} type="audio/mpeg" />
			Your browser does not support the audio element.
		</audio>
		<audio
			muted
			use:initialVolume
			data-volume-max={maxVolumeSpeech}
			transition:fadeVolume={{ duration: 2000 }}
		>
			<source src={lines[activeLine].speechFilePath} type="audio/mpeg" />
			Your browser does not support the audio element.
		</audio>
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
		<button class={playing ? '' : 'down'} disabled={!playing} on:click={() => (playing = false)}
			>Pause</button
		>
		<button class={playing ? 'down' : ''} disabled={playing} on:click={() => (playing = true)}
			>Play</button
		>
	</span>
</div>

<style>
	div.book {
		display: grid;
		grid-template-columns: 100vw;
		grid-template-rows: 75vh;
	}

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
