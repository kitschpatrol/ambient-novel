<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'
	import { fastFadeCss } from '#lib/utils/transition/fast-fade-css.js'
	// eslint-disable-next-line import/no-named-as-default
	import Fa from 'svelte-fa'

	type Props = {
		icon: IconDefinition
		iconAlign?: 'left' | 'right'
		isDown?: boolean
		isEnabled?: boolean
		isTransitionEnabled?: boolean
		label?: string
		onclick?: (event: MouseEvent) => void
	}

	let {
		icon,
		iconAlign = 'left',
		isDown = false,
		isEnabled = true,
		isTransitionEnabled = false,
		label,
		onclick,
	}: Props = $props()
</script>

<!--
	The transition is global so it also plays when a parent component adds or removes
	the button. A zero duration transition finishes immediately, which disables it.
	https://stackoverflow.com/a/70629246/2437832
-->
<button
	class="h-full w-full px-1 pt-2 pb-3 first:pl-5 last:pr-5"
	disabled={!isEnabled}
	{onclick}
	type="button"
>
	<div
		class={[
			'bg-opacity-60 font-display text-vm-text-light text-opacity-90 flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-400 text-base',
			{
				'aspect-square': label === undefined || label === '',
				down: isDown,
				'flex-row': iconAlign === 'left',
				'flex-row-reverse': iconAlign === 'right',
			},
		]}
		transition:fastFadeCss|global={{ duration: isTransitionEnabled ? 500 : 0 }}
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
