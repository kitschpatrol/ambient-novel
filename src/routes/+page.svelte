<script lang="ts">
	import { browser } from '$app/environment';
	import { fade, type FadeParams, type TransitionConfig } from 'svelte/transition';
	import { cubicOut, cubicInOut, linear } from 'svelte/easing';
	import { title, lines } from '$lib/data-generated/text.json';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import shuffle from 'lodash.shuffle';

	function fadeVolume(
		node: HTMLAudioElement,
		{ delay = 0, duration = 400, easing = linear }: FadeParams = {}
	): TransitionConfig {
		const o = +getComputedStyle(node).opacity;

		return {
			delay,
			duration,
			easing,
			tick: (t) => {
				const maxVolume = node.getAttribute('data-volume-max');
				node.volume = maxVolume ? parseFloat(maxVolume) * t : t;
			}
		};
	}

	function initialVolume(node: HTMLAudioElement) {
		const maxVolume = node.getAttribute('data-volume-max');
		node.volume = maxVolume ? parseFloat(maxVolume) : 1.0;
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

	function previousLine() {
		activeLine = (activeLine - 1 + lines.length) % lines.length;
	}

	const maxVolumeSpeech = 1.0;
	const maxVolumeMusic = 0.4;

	// state
	const queryLine = $page.url.searchParams.get('line');
	let activeLine = queryLine ? parseInt(queryLine) - 1 : 0;
	let playing = false;
	let lineSequence = Array.from({ length: lines.length }, (_, i) => i);

	$: isSorted = lineSequence.every((line, i) => line === i);

	$: {
		if (browser) {
			// update query params
			const urlSearchParams = $page.url.searchParams;
			urlSearchParams.set('line', (activeLine + 1).toString());
			goto(`?${$page.url.searchParams.toString()}`);

			// play/pause all audio elements
			// we can't use bind here because of bugs...

			const audioElements = document.getElementsByTagName(
				'audio'
			) as HTMLCollectionOf<HTMLAudioElement>;
			for (const element of audioElements) {
				playing ? element.play() : element.pause();
			}
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<!-- https://github.com/sveltejs/kit/issues/4039 -->
	<!-- <link
		rel="preload"
		href="/fonts/nasalization/nasalization-extended-light.woff2"
		as="font"
		crossOrigin="anonymous"
	/> -->
</svelte:head>

<h1>{title.replaceAll('a', 'A')}</h1>

<div class="book">
	{#key activeLine}
		<div
			class="line"
			transition:fade
			on:introstart={() => {
				console.log('introstart');
			}}
		>
			{@html lines[activeLine].text}
			<p class="lineNumber">
				{activeLine + 1}
			</p>
		</div>
		<audio
			use:initialVolume
			on:ended={onAudioEnded}
			data-line-number={activeLine}
			data-volume-max={maxVolumeMusic}
			transition:fadeVolume={{ duration: 2000 }}
		>
			<source src={lines[activeLine].musicFilePath} type="audio/aac" />
			Your browser does not support the audio element.
		</audio>
		<audio
			use:initialVolume
			data-volume-max={maxVolumeSpeech}
			transition:fadeVolume={{ duration: 2000 }}
		>
			<source src={lines[activeLine].speechFilePath} type="audio/aac" />
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
	/* via https://fontsgeek.com/fonts/Nasalization-Extended-Light-Regular */
	/* and https://transfonter.org */
	@font-face {
		font-family: 'Nasalization Extended';
		src: url('/fonts/nasalization/nasalization-extended-light.woff2') format('woff2'),
			url('/fonts/nasalization/nasalization-extended-light.woff') format('woff'),
			url('/fonts/nasalization/nasalization-extended-light.ttf') format('truetype');
		/* TODO good idea? */
		font-display: fallback;
	}

	h1 {
		font-weight: 300;
		font-family: 'Nasalization Extended', sans-serif;
		font-size: 6vw;
		color: white;
		text-shadow: -3px 3px 5px #00000067;
		letter-spacing: 0.2rem;
		text-align: center;
		width: 100%;
		position: absolute;
		top: 30px;
	}

	div.book {
		display: grid;
		grid-template-columns: 100vw;
		grid-template-rows: 100vh;
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
	}

	button {
		font-family: 'Nasalization Extended', sans-serif;
		background-color: rgba(255, 255, 255, 0.8);
		border: none;
		padding: 10px;
		margin: 3px;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: -3px 3px 5px #00000067;
		position: relative;
		user-select: none;
	}

	button:hover {
		background-color: white;
	}

	button:enabled:active,
	button.down {
		top: 1px;
		right: 1px;
		box-shadow: -2px 3px 5px #00000067;
	}

	button:enabled:active:focus,
	button:focus {
		background-color: rgba(255, 255, 255, 0.8);
	}
	button:disabled:active:focus,
	button:focus:disabled {
		outline: none;
		color: rgba(0, 0, 0, 0.3);
		background-color: rgba(255, 255, 255, 0.3);
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
