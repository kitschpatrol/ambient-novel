<script lang="ts">
	import type { LineData } from '$lib/schemas/bookSchema';
	export let isPlaying = false;
	export let lineData: LineData;
	export let currentTime = 0;
	export let timingOffsetSeconds = 0;

	let lineElement: HTMLDivElement;

	$: timedElements =
		lineElement &&
		(lineElement.querySelectorAll('li[data-time], span[data-time]') as NodeListOf<HTMLElement>);

	$: {
		// TODO optimize hot path, don't need to do this on all lines at the same time?
		// many are out of view...
		if (timedElements) {
			for (const element of timedElements) {
				if (
					!isPlaying ||
					currentTime + timingOffsetSeconds >= parseFloat(element.getAttribute('data-time') ?? '0')
				) {
					element.style.opacity = '1.0';
				} else {
					element.style.opacity = '0.0';
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
	:global([data-time]) {
		transition: opacity 800ms;
	}

	:global(.line ul) {
		list-style-type: disc;
	}
</style>
