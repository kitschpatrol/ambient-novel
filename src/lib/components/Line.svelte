<script lang="ts">
	import type { Line } from '$lib/schemas/bookSchema';
	import { text } from '@sveltejs/kit';
	import Audio from './Audio.svelte';

	export let isPlaying = false;
	export let lineData: Line;
	export let audioTime: number = 0;
	export let timingOffsetSeconds: number = 0.75;

	let lineElement: HTMLDivElement;

	// TODO move to utility
	function replaceSubstring(
		inputStr: string,
		replacement: string,
		start: number,
		end: number
	): string {
		if (start < 0 || end > inputStr.length || start > end) {
			throw new Error('Invalid start or end');
		}
		return inputStr.slice(0, start) + replacement + inputStr.slice(end);
	}

	function escapeRegex(inputString: string): string {
		return inputString.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
	}

	//stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling
	// function visibleY(element: HTMLElement) {
	// 	let rect = element.getBoundingClientRect();
	// 	const top = rect.top;
	// 	const height = rect.height;
	// 	let el = element.parentNode as HTMLElement;
	// 	// Check if bottom of the element is off the page
	// 	if (rect.bottom < 0) return false;
	// 	// Check its within the document viewport
	// 	if (top > document.documentElement.clientHeight) return false;
	// 	do {
	// 		rect = el.getBoundingClientRect();
	// 		if (top <= rect.bottom === false) return false;
	// 		// Check if the element is out of view due to a container scrolling
	// 		if (top + height <= rect.top) return false;
	// 		el = el.parentNode as HTMLElement;
	// 	} while (el != document.body);
	// 	return true;
	// }

	// TODO do all this shit AOT in generate-content?
	// hard coded to escape span for now
	// takes "vermillion."
	// returns "(<span.*>)?v(<\/span>)?e(<\/span>)?r(<\/span>)?m(<\/span>)?i(<\/span>)?l(<\/span>)?l(<\/span>)?i(<\/span>)?o(<\/span>)?n(<\/span>)?\.(<\/span>)?"
	function generateRegexForString(inputString: string): RegExp {
		const emojiRegex = '([\uD800-\uDBFF][\uDC00-\uDFFF]|p{Emoji_Presentation}|p{Emoji}\uFE0F)?';

		return new RegExp(
			[
				'(<span.*>)?',
				...inputString.split('').map((c) => escapeRegex(c) + '(</span>)?' + emojiRegex)
			].join('')
		);
	}

	function regexMatchInRange(inputStr: string, regex: RegExp, start: number): string | null {
		const subString = inputStr.slice(start);

		let match = regex.exec(subString);

		if (match && match.length > 0) {
			return match[0];
		} else {
			throw new Error('Bad regex');
		}
	}

	function getHtmlWithTimeSpans(lineData: Line): string {
		let text = lineData.text;
		let cursor = 0;

		for (const [wordIndex, wordTiming] of lineData.wordTimings.entries()) {
			const regex = generateRegexForString(wordTiming.word);
			let match = regexMatchInRange(text, regex, cursor);

			if (match === null) {
				throw new Error('no match');
			}

			const cursorStart = text.indexOf(match, cursor);
			const cursorEnd = cursorStart + match.length;

			const replacement = `<span class="timing" data-time-start=${wordTiming.start} data-time-end=${wordTiming.end}>${match}</span>`;

			text = replaceSubstring(text, replacement, cursorStart, cursorEnd);
			cursor = cursorStart + replacement.length;
		}

		return text;
	}

	$: textWithTimingSpans = getHtmlWithTimeSpans(lineData);

	$: {
		if (lineElement) {
			const spans = lineElement.getElementsByTagName('span');
			for (const span of spans) {
				const timeStart = span.getAttribute('data-time-start');
				if (timeStart) {
					if (!isPlaying || audioTime + timingOffsetSeconds >= parseFloat(timeStart)) {
						span.style.opacity = '1.0';
					} else {
						span.style.opacity = '0.0';
					}
				}
			}
		}
	}
</script>

<div class="line" bind:this={lineElement}>
	{@html textWithTimingSpans}
	<p class="lineNumber">
		{lineData.index + 1} - {lineData.timing.start} to {lineData.timing.end}
	</p>
</div>

<style>
	.line {
		grid-area: 1 / 1; /* force overlap for transitions */
		justify-self: center;
		align-self: center;
		max-width: 550px;
		background-color: rgba(255, 255, 255);
		box-shadow: -3px 3px 5px #00000067;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1.2rem;
		line-height: 120%;
		text-indent: 3.6rem;
		padding: 30px;
		position: relative;
	}

	/* https://stackoverflow.com/questions/60734783/use-svelte-css-class-in-html */
	.line :global(.timing) {
		transition: opacity 800ms;
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
</style>
