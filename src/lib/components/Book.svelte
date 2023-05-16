<script lang="ts">
	import type { BookData } from '$lib/schemas/bookSchema';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Chapter from '$lib/components/Chapter.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { isPlaying, activeChapter, chapterState } from '../../store';
	import clamp from 'lodash/clamp';
	import sample from 'lodash/sample';
	import isEqual from 'lodash/isEqual';
	import { seededShuffle } from '$lib/utils/collection/seededShuffle';

	export let bookData: BookData;
	let lineOrder: number[]; // generated for active chapter

	// populate store
	bookData.chapters.forEach((chapter, i) => {
		$chapterState[i] = {
			line: 0,
			shuffleSeed: '0'
		};
	});

	// set from query string
	const searchParams = $page.url.searchParams;
	if (searchParams) {
		$activeChapter =
			clamp(parseInt(searchParams.get('chapter') ?? '1'), 1, bookData.chapters.length) - 1;
		$chapterState[$activeChapter].line =
			clamp(
				parseInt(searchParams.get('line') ?? '1'),
				1,
				bookData.chapters[$activeChapter].lines.length
			) - 1;

		$chapterState[$activeChapter].shuffleSeed = searchParams.get('seed') ?? '0';
	}

	function onPreviousChapter() {
		$activeChapter = clamp($activeChapter - 1, 0, bookData.chapters.length - 1);
	}

	function onNextChapter() {
		$activeChapter = clamp($activeChapter + 1, 0, bookData.chapters.length - 1);
	}

	$: isFirstLine = lineOrder.indexOf($chapterState[$activeChapter].line) - 1 < 0;
	$: isLastLine =
		lineOrder.indexOf($chapterState[$activeChapter].line) + 1 >=
		bookData.chapters[$activeChapter].lines.length;

	function onPreviousLine() {
		if (!isFirstLine) {
			$chapterState[$activeChapter].line =
				lineOrder[lineOrder.indexOf($chapterState[$activeChapter].line) - 1];
		} else {
			console.log(`No previous lines`);
		}
	}

	function onNextLine() {
		if (!isLastLine) {
			$chapterState[$activeChapter].line =
				lineOrder[lineOrder.indexOf($chapterState[$activeChapter].line) + 1];
		} else {
			console.log(`Reached the last line`);
		}
	}

	function onPlay() {
		$isPlaying = true;
	}

	function onPause() {
		$isPlaying = false;
	}

	// changes the seed, which triggers recreation of lineOrder
	function onShuffle() {
		if (bookData.chapters[$activeChapter].lineShuffleAllowed) {
			// for fun, pick a random word from the chapter to seed the randomness
			// setting to "0" sorts the chapter in natural order
			const oldSeed = $chapterState[$activeChapter].shuffleSeed ?? '0';
			let newSeed = oldSeed;
			let maxTries = 100;
			while (newSeed === oldSeed) {
				newSeed =
					sample(sample(bookData.chapters[$activeChapter].lines)?.wordTimings)
						?.word.toLowerCase()
						.replace(/[^A-Za-z0-9]/gu, '') ?? Math.floor(Math.random() * 1000).toString(10);

				maxTries -= 1;
				if (maxTries === 0) {
					break;
				}
			}

			$chapterState[$activeChapter].shuffleSeed = newSeed;
		}
	}

	function onSort() {
		$chapterState[$activeChapter].shuffleSeed = '0';
	}

	// shuffle
	$: {
		const shuffleSeed = $chapterState[$activeChapter].shuffleSeed;
		let tempOrder = Array.from(Array(bookData.chapters[$activeChapter].lines.length).keys());
		if (bookData.chapters[$activeChapter].lineShuffleAllowed && shuffleSeed !== '0') {
			tempOrder = seededShuffle(tempOrder, shuffleSeed);
			// tempOrder = tempOrder.reverse();
		}
		// only assign if there's a change to avoid extra reactions
		if (!isEqual(lineOrder, tempOrder)) {
			console.log(`shuffleSeed: ${shuffleSeed}`);
			lineOrder = tempOrder;
		}
	}

	// update query params, don't push history
	$: {
		$page.url.searchParams.set('chapter', ($activeChapter + 1).toString());
		$page.url.searchParams.set('line', ($chapterState[$activeChapter].line + 1).toString());

		if ($chapterState[$activeChapter].shuffleSeed !== '0') {
			$page.url.searchParams.set('seed', $chapterState[$activeChapter].shuffleSeed);
		} else {
			$page.url.searchParams.delete('seed');
		}

		goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
	}
</script>

{#key $activeChapter}
	<Chapter
		{lineOrder}
		isPlaying={$isPlaying}
		chapterData={bookData.chapters[$activeChapter]}
		activeLine={$chapterState[$activeChapter].line}
		on:readyForNextLine={() => {
			// console.log(`ready for next line`);
			onNextLine();
		}}
	/>
{/key}

<Controls
	isShuffleEnable={bookData.chapters[$activeChapter].lineShuffleAllowed}
	isSorted={isEqual(
		lineOrder,
		Array.from(Array(bookData.chapters[$activeChapter].lines.length).keys())
	)}
	isPlaying={$isPlaying}
	isFirstChapter={$activeChapter === 0}
	isLastChapter={$activeChapter === bookData.chapters.length - 1}
	{isFirstLine}
	{isLastLine}
	on:nextChapter={onNextChapter}
	on:previousChapter={onPreviousChapter}
	on:play={onPlay}
	on:pause={onPause}
	on:nextLine={onNextLine}
	on:previousLine={onPreviousLine}
	on:shuffle={onShuffle}
	on:sort={onSort}
/>
