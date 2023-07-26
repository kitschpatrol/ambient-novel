<script lang="ts">
	import Fa from 'svelte-fa';
	import { fade } from 'svelte/transition';
	export let isDown = false;
	export let iconAlign: 'left' | 'right' = 'left';
	export let label: string | null = null;
	export let icon: unknown | null; // Using IconDefinition causes type errors...
	export let isEnabled = true;
</script>

<button
	transition:fade={{ duration: 200 }}
	disabled={!isEnabled}
	on:click
	class="h-full w-full px-1 pb-3 pt-2 first:pl-2.5 last:pr-2.5"
>
	<div
		class:aspect-square={!label}
		class:flex-row={iconAlign === 'left'}
		class:flex-row-reverse={iconAlign === 'right'}
		class:down={isDown}
		class="flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-300 bg-opacity-40 font-display text-base text-white text-opacity-90"
	>
		<Fa {icon} translateY="-.05" />
		{#if label}
			<span class="label tracking-wider max-md:hidden">{label}</span>
		{/if}
	</div>
</button>

<style>
	button {
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	button div {
		box-shadow: -2px 3px 5px #00000067;
		position: relative;
	}

	@media (hover: hover) {
		button:not(:disabled):hover div:not(.down) {
			/* background-color: theme(colors.vm-magenta); */
			background-color: #f01ef6;
			color: white;
			/* text-shadow: 0 0 3px white; */
		}

		/* button:not(:hover) div { */
		/* transition: 500ms; */
		/* } */
	}

	button:not(:disabled):active div {
		top: 2px;
		right: 2px;
		/* text-shadow: 0 0 3px rgba(255, 255, 255, 0.587); */
		box-shadow: 0px 1px 3px #00000067;
		/* background-color: theme(colors.vm-magenta-mild); */
		background-color: #c63bee;
	}

	button div.down {
		top: 2px;
		right: 2px;
		color: white;
		box-shadow: 0px 1px 3px #00000067;
		background-color: #ef1ef68f;
	}

	button:disabled {
		opacity: 0.5;
	}
</style>
