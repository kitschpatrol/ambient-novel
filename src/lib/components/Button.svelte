<script lang="ts">
	import { fastFadeCss } from '$lib/utils/transition/fast-fade-css'
	import Fa from 'svelte-fa'
	export let isDown = false
	export let iconAlign: 'left' | 'right' = 'left'
	export let label: null | string = null
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	export let icon: null | unknown // Using IconDefinition causes type errors...
	export let isEnabled = true
	export let isTransitionEnabled = false

	// Setting duration to 0 is not enough for a smooth transition
	// https://stackoverflow.com/a/70629246/2437832
	// possibly still flaky
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function maybe(node: HTMLElement, options: any) {
		if (isTransitionEnabled) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			return options.fn(node, options)
		}
	}
</script>

<button class="h-full w-full px-1 pb-3 pt-2 first:pl-5 last:pr-5" disabled={!isEnabled} on:click>
	<div
		class="flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-400 bg-opacity-60 font-display text-base text-vm-text-light text-opacity-90"
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
			/* background-color: theme(colors.vm-magenta); */
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
		/* background-color: theme(colors.vm-magenta-mild); */
		background-color: #c63bee;
		box-shadow: 0 1px 3px #00000067;
	}

	button div.down {
		top: 2px;
		right: 2px;
		/* stylelint-disable-next-line function-no-unknown */
		color: theme(colors.vm-text-light);
		background-color: #ef1ef68f;
		box-shadow: 0 1px 3px #00000067;
	}

	button:disabled {
		opacity: 0.5;
	}
</style>
