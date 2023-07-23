<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Track from '$lib/components/Track.svelte';
	import bookDataRaw from '$lib/data/book.json';
	import type { BookData } from '$lib/schemas/bookSchema';
	import {
		faBackward,
		faBackwardStep,
		faDiceD20,
		faForward,
		faForwardStep,
		faGripLines,
		faPause,
		faPlay,
		faRotateBack,
		faShuffle
	} from '@fortawesome/free-solid-svg-icons';
	const { chapters, title } = bookDataRaw as BookData;

	let playStatus = Array.from({ length: chapters.length }, () => false);
	let resetStatus = Array.from({ length: chapters.length }, () => true);
	let resetFunctions: (() => void)[] = Array.from({ length: chapters.length });

	$: somethingPlaying = playStatus.indexOf(true) > -1;
	$: somethingNotReset = resetStatus.indexOf(false) > -1;
</script>

<div>
	<header>
		<h1 class="text-center font-display tracking-wider text-white shadow-vm-shadow text-shadow">
			{title.replaceAll('a', 'A')}
		</h1>
	</header>
	<!-- <Track chapterData={chapters[7]} /> -->
	{#each chapters as chapter, index}
		<Track
			chapterData={chapter}
			bind:isPlaying={playStatus[index]}
			bind:isReset={resetStatus[index]}
			bind:reset={resetFunctions[index]}
		/>
	{/each}
	<footer>
		<div id="controls" class="md-s flex w-full gap-6 max-sm:gap-1">
			{somethingPlaying}
			<span class="flex flex-1 items-center justify-start">
				<Button icon={faPlay} label="Play Linear" />
				<Button icon={faDiceD20} label="Play Blended" />
			</span>
			<span class="flex flex-1 items-center justify-start">
				<Button
					icon={faPlay}
					label="all"
					on:click={() => {
						playStatus = playStatus.map(() => true);
					}}
				/>
				<Button
					icon={faPause}
					label="all"
					isEnabled={somethingPlaying}
					isDown={!somethingPlaying}
					on:click={() => {
						playStatus = playStatus.map(() => false);
					}}
				/>
				<Button
					icon={faRotateBack}
					label="all"
					isEnabled={somethingNotReset}
					isDown={!somethingNotReset}
					on:click={() => {
						resetFunctions.forEach((reset) => reset());
					}}
				/>
			</span>
		</div>
	</footer>
</div>

<!-- <Tweakpane /> -->

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
		background: linear-gradient(#afafaf 0%, #8a8a8a 100%);
	}

	footer {
		background: linear-gradient(#5e5e5e 0%, #909090 100%);
	}

	header h1 {
		font-size: min(calc(100vh / 24), calc(100vw / 14));
		line-height: calc(100vh / 12);

		/* animation: color-change 10s infinite; */
	}

	/* @keyframes color-change {
		0% {
			color: var(--background-color-gradient-1);
		}
		50% {
			color: var(--background-color-gradient-2);
		}
		100% {
			color: var(--background-color-gradient-1);
		}
	} */

	footer {
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}
</style>
