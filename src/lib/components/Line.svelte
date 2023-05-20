<script lang="ts">
	import type { LineData } from '$lib/schemas/bookSchema';
	export let isPlaying = false;
	export let lineData: LineData;
	export let currentTime = 0;
	export let timingOffsetSeconds = 0.5;

	let lineElement: HTMLDivElement;

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
		{@html lineData.text}
	</p>
</div>

<style>
	.line :global(.timing) {
		transition: opacity 800ms;
	}
</style>
