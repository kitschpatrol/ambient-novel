<script lang="ts">
	import type { BookData } from '$lib/schemas/bookSchema';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Chapter from '$lib/components/Chapter.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { isPlaying, activeChapter, chapterState } from '../../store';
	import clamp from 'lodash/clamp';

	export let bookData: BookData;

	// populate store
	bookData.chapters.forEach((_, i) => {
		$chapterState[i] = { line: 0, shuffle: false, seed: 0 };
	});

	function onPreviousChapter() {
		$activeChapter = clamp($activeChapter - 1, 0, bookData.chapters.length - 1);
	}

	function onNextChapter() {
		$activeChapter = clamp($activeChapter + 1, 0, bookData.chapters.length - 1);
	}

	function onPreviousLine() {
		$chapterState[$activeChapter].line = $chapterState[$activeChapter].line - 1;
	}

	function onNextLine() {
		$chapterState[$activeChapter].line = $chapterState[$activeChapter].line + 1;
	}

	function onPlay() {
		$isPlaying = true;
	}

	function onPause() {
		$isPlaying = false;
	}

	// update query params, don't push history
	$: {
		$page.url.searchParams.set('chapter', ($activeChapter + 1).toString());
		$page.url.searchParams.set('line', ($chapterState[$activeChapter].line + 1).toString());
		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

{#key $activeChapter}
	<Chapter
		isPlaying={$isPlaying}
		chapterData={bookData.chapters[$activeChapter]}
		activeLine={$chapterState[$activeChapter].line}
		shuffle={$chapterState[$activeChapter].shuffle}
		seed={$chapterState[$activeChapter].seed}
		on:readyForNextLine={() => {
			console.log(`ready for next line`);
			onNextLine();
		}}
	/>
{/key}

<Controls
	isPlaying={$isPlaying}
	isFirstChapter={$activeChapter === 0}
	isLastChapter={$activeChapter === bookData.chapters.length - 1}
	isFirstLine={$chapterState[$activeChapter].line === 0}
	isLastLine={$chapterState[$activeChapter].line ===
		bookData.chapters[$activeChapter].lines.length - 1}
	on:nextChapter={onNextChapter}
	on:previousChapter={onPreviousChapter}
	on:play={onPlay}
	on:pause={onPause}
	on:nextLine={onNextLine}
	on:previousLine={onPreviousLine}
/>

<style>
</style>
