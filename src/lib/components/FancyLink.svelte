<script lang="ts">
	import Fa from 'svelte-fa'

	export let alt: string
	export let downloadLink = false
	export let openInNewTab = true
	export let href: string
	export let imagePath: string
	export let imageWidth: number
	export let imageHeight: number
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	export let icon: null | unknown = null // Using IconDefinition causes type errors...

	// eslint-disable-next-line unicorn/prevent-abbreviations
	$: rel = openInNewTab ? 'noopener noreferrer' : undefined
	$: target = openInNewTab ? '_blank' : undefined
	$: download = downloadLink ? '' : undefined
</script>

<a {download} {href} {rel} {target}>
	<div>
		<img {alt} height={imageHeight} src={imagePath} width={imageWidth} />
	</div>
	<div>
		<slot />
		{#if icon}
			<Fa {icon} />
		{/if}
	</div>
</a>

<style lang="postcss">
	a {
		/* fixes background bleed-through */
		transform: translate(0);
		display: grid;
		grid-template-columns: 1fr 1fr;
		place-items: center center;
		background-color: rgb(255 255 255 / 40%);
		border-radius: 1rem;
		box-shadow: 5px 5px 5px 0 rgb(0 0 0 / 15%);
	}

	@media (width <= 600px) {
		a {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr;
		}
	}

	a > div:first-child {
		overflow: hidden;
		display: grid;
		place-self: stretch stretch;
		align-items: center;
		justify-content: center;
		border-radius: 1rem 0 0 1rem;
		box-shadow: 10px 0 20px -5px rgb(0 0 0 / 10%);
	}

	a > div:last-child {
		display: grid;
		justify-items: center;
		padding: 2rem;
		text-align: center;
	}

	a > div:last-child :global(svg) {
		margin-top: 0.5rem;
		font-size: 2rem;
		color: rgb(0 0 0 / 40%);
	}

	a img {
		transform: scale(1);
		width: auto;
		max-width: none;
		max-height: 18rem;
		padding: 1.5rem;
		transition: transform 0.1s ease-in-out;
	}

	a:hover {
		background-color: rgb(255 255 255 / 60%);
	}

	a:hover img {
		transform: scale(1.05);
		transition: transform 0.1s ease-in-out;
	}
</style>
