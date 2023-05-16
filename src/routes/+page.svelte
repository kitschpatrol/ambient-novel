<script lang="ts">
	import type { BookData } from '$lib/schemas/bookSchema';
	import bookTypeless from '$lib/data/book.json';
	import Chapter from '$lib/components/Chapter.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import shuffle from 'lodash/shuffle';
	import clamp from 'lodash/clamp';
	const book = bookTypeless as BookData;

	// config
	const maxVolumeSpeech = 1.0;
	const maxVolumeMusic = 0.7;

	let chapterElement: Chapter;
	let audioTime: number = 0;

	// todo really need a store instead?
	// remember line state for each chapter
	let lineState = Array.from({ length: book.chapters.length }, () => 0);
	console.log(`lineState: ${lineState}`);

	// state, but history button doesn't work?
	const searchParams = $page.url.searchParams;
	const queryChapter = searchParams ? searchParams.get('chapter') : undefined;
	const queryLine = searchParams ? searchParams.get('line') : undefined;
	let activeChapterIndex = queryChapter
		? clamp(parseInt(queryChapter), 1, book.chapters.length) - 1
		: 0;
	let activeLineIndex = queryLine
		? clamp(parseInt(queryLine), 1, book.chapters[activeChapterIndex].lines.length) - 1
		: 0;
	let isPlaying = false;

	function onPreviousChapter() {
		lineState[activeChapterIndex] = activeLineIndex;
		activeChapterIndex = clamp(activeChapterIndex - 1, 0, book.chapters.length - 1);
		activeLineIndex = lineState[activeChapterIndex];
	}

	function onNextChapter() {
		lineState[activeChapterIndex] = activeLineIndex;
		activeChapterIndex = clamp(activeChapterIndex + 1, 0, book.chapters.length - 1);
		activeLineIndex = lineState[activeChapterIndex];
	}

	function onPreviousLine() {
		chapterElement.previousLine();
	}

	function onNextLine() {
		chapterElement.nextLine();
	}

	function onPlay() {
		isPlaying = true;
	}

	function onPause() {
		isPlaying = false;
	}

	function onActiveLineIndex(event: CustomEvent) {
		activeLineIndex = event.detail;
	}

	function onAudioTime(event: CustomEvent) {
		audioTime = event.detail;
	}

	// $: lineSequence = Array.from({ length: lines.length }, (_, i) => i);
	// $: isSorted = lineSequence.every((line, i) => line === i);
	// $: activeLine = lines[activeLineIndex];

	$: {
		// update query params, don't push history
		$page.url.searchParams.set('chapter', (activeChapterIndex + 1).toString());
		$page.url.searchParams.set('line', (activeLineIndex + 1).toString());
		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>{book.title} — Chapter {activeChapterIndex} Line {activeLineIndex + 1}</title>
	<!-- https://github.com/sveltejs/kit/issues/4039 -->
	<!-- <link
		rel="preload"
		href="/fonts/nasalization/nasalization-extended-light.woff2"
		as="font"
		crossOrigin="anonymous"
	/> -->
</svelte:head>

{#key activeChapterIndex}
	<Chapter
		bind:this={chapterElement}
		chapterData={book.chapters[activeChapterIndex]}
		{isPlaying}
		on:audioTime={onAudioTime}
		on:activeLineIndex={onActiveLineIndex}
	/>
{/key}

<Controls
	{isPlaying}
	isFirstChapter={activeChapterIndex === 0}
	isLastChapter={activeChapterIndex === book.chapters.length - 1}
	isFirstLine={activeLineIndex === 0}
	isLastLine={activeLineIndex === book.chapters[activeChapterIndex].lines.length - 1}
	on:nextChapter={onNextChapter}
	on:previousChapter={onPreviousChapter}
	on:play={onPlay}
	on:pause={onPause}
	on:nextLine={onNextLine}
	on:previousLine={onPreviousLine}
/>
