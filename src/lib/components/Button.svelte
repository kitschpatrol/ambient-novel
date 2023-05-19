<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Fa from 'svelte-fa';

	export let isDown = false;
	export let iconAlign: 'left' | 'right' = 'left';
	export let label: string | null = null;
	export let icon: unknown | null; // Using IconDefinition causes type errors...
	export let isEnabled = true;

	const dispatch = createEventDispatcher();

	const iconConfig = {
		translateY: 0.05
	};
</script>

<button disabled={!isEnabled} class={isDown ? 'down' : ''} on:click>
	{#if icon && iconAlign === 'left'}
		<Fa {icon} {...iconConfig} />
	{/if}
	<span class="label max-md:hidden">{label}</span>
	{#if icon && iconAlign === 'right'}
		<Fa {icon} {...iconConfig} />
	{/if}
</button>

<style>
	:global(svg) {
		display: inline;
		margin: 0 0.5em;
	}

	button {
		font-family: 'Nasalization Extended', sans-serif;
		background-color: rgba(255, 255, 255, 0.75);
		border: none;
		border-radius: 10px;
		cursor: pointer;
		height: 2em;
		box-shadow: -3px 3px 5px #00000067;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	@media (hover: hover) {
		button:hover {
			background-color: white;
		}
	}

	button:enabled:active,
	button.down {
		top: 1px;
		right: 1px;
		box-shadow: -2px 3px 5px #00000067;
	}

	button:disabled {
		color: rgba(0, 0, 0, 0.3);
		background-color: rgba(255, 255, 255, 0.3);
	}
</style>
