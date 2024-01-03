<script lang="ts">
	import type { ChapterData } from '$lib/schemas/book-schema'

	export let chapterColor = '#ff0000'
	export let chapterData: ChapterData

	// Even this wasn't enough to avoid layout contention
	// https://stackoverflow.com/a/70629246/2437832
</script>

<!-- funky comments here to avoid implicit white space issues -->
<!-- prettier-ignore -->
<h2
	class="chapter-title absolute left-0 top-0 h-full w-full text-center font-display tracking-wider text-vm-text-light shadow-vm-shadow text-shadow"
	style:background-color={chapterColor}
>
	<span class="max-sm:hidden">Chapter </span><!--
  -->{chapterData.index + 1}<!--
	--><span class="max-sm:hidden">:</span><!--
	--> {chapterData.title}
</h2>

<style lang="postcss">
	h2.chapter-title {
		/* will-change: opacity; */
		font-size: min(calc(100dvh / 42), 1.75rem);
		line-height: calc(100dvh / 12);
	}
</style>
