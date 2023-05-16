<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isSorted = false;
	export let isPlaying = false;
	export let isFirstChapter = false;
	export let isLastChapter = false;
	export let isFirstLine = false;
	export let isLastLine = false;
	export let isShuffleEnable = false;

	const dispatch = createEventDispatcher();
</script>

<div id="controls">
	<span class="button-group">
		<button disabled={!isShuffleEnable} on:click={() => dispatch('shuffle')}>Shuffle</button>
		<button disabled={isSorted || !isShuffleEnable} on:click={() => dispatch('sort')}>Sort</button>
	</span>
	<span class="button-group">
		<button disabled={isFirstChapter} on:click={() => dispatch('previousChapter')}
			>Previous Chapter</button
		>
		<button disabled={isLastChapter} on:click={() => dispatch('nextChapter')}>Next Chapter</button>
	</span>
	<span class="button-group">
		<button disabled={isFirstLine} on:click={() => dispatch('previousLine')}>Previous Line</button>
		<button disabled={isLastLine} on:click={() => dispatch('nextLine')}>Next Line</button>
	</span>
	<span class="button-group">
		<button class={isPlaying ? '' : 'down'} disabled={!isPlaying} on:click={() => dispatch('pause')}
			>Pause</button
		>
		<button class={isPlaying ? 'down' : ''} disabled={isPlaying} on:click={() => dispatch('play')}
			>Play</button
		>
	</span>
</div>

<style>
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
