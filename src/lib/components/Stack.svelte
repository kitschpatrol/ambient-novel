<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Track from '$lib/components/Track.svelte';
	import type { BookData } from '$lib/schemas/bookSchema';
	import {
		faBookReader,
		faDiceD20,
		faPause,
		faRotateBack
	} from '@fortawesome/free-solid-svg-icons';
	import shuffle from 'lodash/shuffle';

	export let bookData: BookData;
	const { chapters, title } = bookData;

	let playStatus = Array.from({ length: chapters.length }, () => false);
	let resetStatus = Array.from({ length: chapters.length }, () => true);
	let resetFunctions: (() => void)[] = Array.from({ length: chapters.length });

	let isPlayingThrough = false;

	$: somethingPlaying = playStatus.indexOf(true) > -1;
	$: somethingNotReset = resetStatus.indexOf(false) > -1;

	$: {
		// messing with anything stops playing through
		if (isPlayingThrough && playStatus.filter((v) => v).length !== 1) {
			isPlayingThrough = false;
		}
	}

	function onLuckyBlend() {
		isPlayingThrough = false;
		resetFunctions.forEach((reset) => reset());

		// pick three random chapters, and start playing
		const chapterNumbers = Array.from({ length: chapters.length }, (_, i) => i);
		const randomChapters = shuffle(chapterNumbers).slice(0, 3);

		playStatus = playStatus.map((_, i) => randomChapters.includes(i));
	}
</script>

<div>
	<header>
		<h1 class="text-center font-display tracking-wider text-white shadow-vm-shadow text-shadow">
			{title.replaceAll('a', 'A')}
		</h1>
	</header>
	{#each chapters as chapter, index}
		<Track
			chapterData={chapter}
			bind:isPlaying={playStatus[index]}
			bind:isReset={resetStatus[index]}
			bind:reset={resetFunctions[index]}
			on:ended={() => {
				if (isPlayingThrough) {
					const nextChapter = playStatus.indexOf(true) + 1;

					// reset everything
					resetFunctions.forEach((reset) => reset());

					// start next chapter
					playStatus = playStatus.map((_, i) => i === nextChapter);
				}
			}}
		/>
	{/each}
	<footer>
		<div id="controls" class="md-s flex h-full w-full gap-6 max-sm:gap-1">
			<span class="flex flex-1 items-center justify-start">
				<Button
					icon={faBookReader}
					label="Play Through"
					isEnabled={!isPlayingThrough}
					isDown={isPlayingThrough}
					on:click={() => {
						isPlayingThrough = true;
						// reset everything
						resetFunctions.forEach((reset) => reset());

						// start first chapter
						playStatus = playStatus.map((_, i) => i === 0);
					}}
				/>
				<Button icon={faDiceD20} label="Lucky Blend" on:click={onLuckyBlend} />
			</span>
			<span class="flex flex-grow items-center justify-center max-lg:hidden" />
			<span class="flex flex-1 items-center justify-end">
				<Button
					icon={faPause}
					label="Pause all"
					isEnabled={somethingPlaying}
					on:click={() => {
						playStatus = playStatus.map(() => false);
					}}
				/>
				<Button
					icon={faRotateBack}
					label="Reset all"
					isEnabled={somethingNotReset}
					on:click={() => {
						resetFunctions.forEach((reset) => reset());
						isPlayingThrough = false;
					}}
				/>
			</span>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		background: unset;
	}

	header,
	footer {
		width: 100vw;
		height: calc(100vh / 12);
	}

	header {
		background: #f01ef6;
	}

	header h1 {
		background: linear-gradient(#afafaf80 10%, #0000006b 100%);
		font-size: min(calc(100vh / 24), calc(100vw / 14));
		line-height: calc(100vh / 12);
	}

	footer {
		background: #4e3bff;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	footer div#controls {
		background: linear-gradient(#00000053 0%, rgba(86, 86, 86, 0.502) 100%);
	}
</style>
