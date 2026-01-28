<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'
	// eslint-disable-next-line import/no-named-as-default
	import Fa from 'svelte-fa'
	import { fastFadeCss } from '$lib/utils/transition/fast-fade-css'
	export let isDown = false
	export let iconAlign: 'left' | 'right' = 'left'
	export let label: string | undefined = undefined

	export let icon: IconDefinition
	export let isEnabled = true
	export let isTransitionEnabled = false

	// Setting duration to 0 is not enough for a smooth transition
	// https://stackoverflow.com/a/70629246/2437832
	// possibly still flaky

	// eslint-disable-next-line ts/no-explicit-any
	function maybe(node: HTMLElement, options: any) {
		if (isTransitionEnabled) {
			return options.fn(node, options)
		}
	}
</script>

<button class="h-full w-full px-1 pt-2 pb-3 first:pl-5 last:pr-5" disabled={!isEnabled} on:click>
	<div
		class="bg-opacity-60 font-display text-vm-text-light text-opacity-90 flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-400 text-base"
		class:aspect-square={!label}
		class:down={isDown}
		class:flex-row={iconAlign === 'left'}
		class:flex-row-reverse={iconAlign === 'right'}
		transition:maybe={{ duration: 500, fn: fastFadeCss }}
	>
		<Fa {icon} translateY="-.05" />
		{#if label}
			<span class="label tracking-wider max-md:hidden">{label}</span>
		{/if}
	</div>
</button>

<style lang="postcss">
	button {
		cursor: pointer;
		user-select: none;
		transition: opacity 500ms;
	}

	button div {
		position: relative;
		box-shadow: -2px 3px 5px #00000067;
	}

	@media (hover: hover) {
		button:not(:disabled):hover div:not(.down) {
			color: white;
			/* background-color: var(--color-vm-magenta); */
			background-color: #f01ef6;
			/* text-shadow: 0 0 3px white; */
		}

		/* button:not(:hover) div { */
		/* transition: 500ms; */
		/* } */
	}

	button:not(:disabled):active div {
		top: 2px;
		right: 2px;
		/* background-color: var(--color-vm-magenta-mild); */
		background-color: #c63bee;
		box-shadow: 0 1px 3px #00000067;
	}

	button div.down {
		top: 2px;
		right: 2px;
		color: var(--color-vm-text-light);
		background-color: #ef1ef68f;
		box-shadow: 0 1px 3px #00000067;
	}

	button:disabled {
		opacity: 0.5;
	}
</style>
