<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import {
		faBackward,
		faBackwardStep,
		faForward,
		faForwardStep,
		faGripLines,
		faPause,
		faPlay,
		faShuffle
	} from '@fortawesome/free-solid-svg-icons';
	import { createEventDispatcher } from 'svelte';

	export let showChapterButtons = false;
	export let showSortButton = true;
	export let isSorted = false;
	export let isPlaying = false;
	export let isFirstChapter = false;
	export let isLastChapter = false;
	export let isFirstLine = false;
	export let isLastLine = false;
	export let isShuffleEnable = false;

	const dispatch = createEventDispatcher();
</script>

<div id="controls" class="flex justify-between px-3 py-2">
	<span>
		<Button
			icon={faPlay}
			label="Play"
			isDown={isPlaying}
			isEnabled={!isPlaying}
			on:click={() => dispatch('play')}
		/>
		<Button icon={faPause} label="Pause" isEnabled={isPlaying} on:click={() => dispatch('pause')} />
	</span>
	<span>
		{#if showChapterButtons}
			<Button
				icon={faBackwardStep}
				label="Previous Chapter"
				isEnabled={!isFirstChapter}
				on:click={() => dispatch('previousChapter')}
			/>
		{/if}

		<Button
			icon={faBackward}
			label="Previous Line"
			isEnabled={!isFirstLine}
			on:click={() => dispatch('previousLine')}
		/>

		<Button
			icon={faForward}
			label="Next Line"
			isEnabled={!isLastLine}
			iconAlign="right"
			on:click={() => dispatch('nextLine')}
		/>

		{#if showChapterButtons}
			<Button
				icon={faForwardStep}
				label="Next Chapter"
				isEnabled={!isLastChapter}
				iconAlign="right"
				on:click={() => dispatch('nextChapter')}
			/>
		{/if}
	</span>

	<span>
		{#if showSortButton}
			<Button
				icon={faGripLines}
				label="Sort"
				isEnabled={!isSorted && isShuffleEnable}
				on:click={() => dispatch('sort')}
			/>
		{/if}

		<Button
			icon={faShuffle}
			label="Shuffle"
			isEnabled={isShuffleEnable}
			on:click={() => dispatch('shuffle')}
		/>
	</span>
</div>

<style>
	div#controls {
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}
</style>
