<script lang="ts">
	import { browser } from '$app/environment';

	// props
	export let sequence: number[] = [];
	// logic goes here

	// state
	let container: HTMLDivElement;
	let cards: HTMLLIElement[] = [];

	const nativeWidth = 800;

	$: {
		for (const [i, card] of cards.entries()) {
			card.style.left = `${(i * nativeWidth) / cards.length}px`;
			card.style.zIndex = `${i}`;
		}
	}
</script>

<ul class="container" bind:this={container}>
	{#each sequence as line, i}
		<li class="card" bind:this={cards[line]}>{i + 1}</li>
	{/each}
</ul>

<style>
	ul.container {
		position: relative;
		display: block;
		width: 800px;
		height: 200px;
		list-style: none;
		background-color: red;
	}

	li.card {
		width: 30px;
		height: 40px;
		position: absolute;
		vertical-align: middle;
		background-color: white;
		overflow: hidden;
		text-align: center;
		vertical-align: middle;
		padding: 0;
		box-shadow: -3px 3px 5px #00000067;
		font-size: 0.7rem;
		color: rgb(182, 182, 182);
		transition-property: left z-index;
		transition-duration: 1s;
	}
</style>
