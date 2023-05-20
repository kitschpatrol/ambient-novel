<script lang="ts">
	import type { LineData } from '$lib/schemas/bookSchema';
	export let isPlaying = false;
	export let lineData: LineData;
	export let currentTime = 0;
	export let timingOffsetSeconds = 0.5;

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

	function getHtmlWithTimeSpans(lineData: LineData): string {
		let text = lineData.text;
		let cursor = 0;

		for (const wordTiming of lineData.wordTimings) {
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
					if (!isPlaying || currentTime + timingOffsetSeconds >= parseFloat(timeStart)) {
						span.style.opacity = '1.0';
					} else {
						span.style.opacity = '0.0';
					}
				}
			}
		}
	}
</script>

<div class="flex h-full flex-col overflow-hidden" bind:this={lineElement}>
	<p class="line m-auto px-8 pb-5 pt-1 font-serif sm:text-lg">
		{@html textWithTimingSpans}
	</p>
</div>

<style>
	.line :global(.timing) {
		transition: opacity 800ms;
	}
</style>
