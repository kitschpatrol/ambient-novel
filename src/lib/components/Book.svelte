<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Chapter from '$lib/components/Chapter.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import type { BookData } from '$lib/schemas/bookSchema';
	import { seededShuffle } from '$lib/utils/collection/seededShuffle';
	import clamp from 'lodash/clamp';
	import isEqual from 'lodash/isEqual';
	import sample from 'lodash/sample';
	import { writable } from 'svelte/store';

	export let style = '';
	export let bookData: BookData;
	export let initialChapter: number = 3;
	export let useQueryStore: boolean = false;
	let lineOrder: number[]; // generated for active chapter

	const isPlaying = writable(false);
	const activeChapter = writable(initialChapter);
	const chapterState = writable<{
		[key: number]: {
			line: number;
			shuffleSeed: string;
		};
	}>({});

	// populate store
	bookData.chapters.forEach((chapter, i) => {
		$chapterState[i] = {
			line: 0,
			shuffleSeed: '0'
		};
	});

	// set from query string
	if (useQueryStore) {
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
			lineOrder = tempOrder;
		}
	}

	// update query params, don't push history
	$: {
		if (useQueryStore) {
			$page.url.searchParams.set('chapter', ($activeChapter + 1).toString());
			$page.url.searchParams.set('line', ($chapterState[$activeChapter].line + 1).toString());

			if ($chapterState[$activeChapter].shuffleSeed !== '0') {
				$page.url.searchParams.set('seed', $chapterState[$activeChapter].shuffleSeed);
			} else {
				$page.url.searchParams.delete('seed');
			}

			goto(`?${$page.url.searchParams.toString()}`, { replaceState: true });
		}
	}
</script>

<!-- drop-shadow-2xl insanely slow on safari :( -->
<div class="flex h-full flex-col" {style}>
	<ul class="flex flex-row gap-1 overflow-hidden">
		{#each bookData.chapters as chapter, i}
			<li class="group relative flex-1 flex-col whitespace-nowrap text-center">
				<a
					on:click={() => {
						$activeChapter = i;
					}}
					class="link relative block h-full rounded-t-xl pt-2 font-display text-sm tracking-wider sm:text-base {i ===
					$activeChapter
						? 'bg-white pb-2 text-vm-blue shadow-vm-inner-shadow-dark text-shadow max-sm:min-w-full sm:px-4'
						: 'mt-1 min-w-full bg-white bg-opacity-40 bg-gradient-to-t from-vm-inner-shadow-dark to-transparent to-45% text-white text-opacity-80 transition-[margin] duration-300 group-hover:mt-0 group-hover:transition-none'}"
					href={useQueryStore ? `?chapter=${i}` : ``}
				>
					{i + 1}
					<span class={i === $activeChapter ? 'max-sm:hidden' : 'hidden'}>. {chapter.title}</span>
				</a>
			</li>
		{/each}
	</ul>
	<h2
		class="bg-white bg-gradient-to-t from-vm-inner-shadow-light to-transparent to-45% py-2 text-center font-display tracking-wider text-vm-blue shadow-vm-inner-shadow-dark text-shadow sm:hidden"
	>
		Chapter {$activeChapter + 1}: {bookData.chapters[$activeChapter].title}
	</h2>
	<div class="grow-1 relative h-full flex-1 overflow-hidden bg-white">
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
	</div>

	<div
		class="rounded-b-xl bg-white bg-opacity-20 bg-gradient-to-b from-vm-inner-shadow to-transparent to-45%"
	>
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
	</div>
</div>

<style>
	/* crazy approach to expanding the hit area to close the gaps between floated tab links */

	.link:before {
		content: '';
		position: absolute;
		width: calc(100% + theme('spacing.1'));
		height: 100%;
		top: 0px;
		left: calc(theme('spacing.1') * -0.5);
		cursor: pointer;
	}
</style>
