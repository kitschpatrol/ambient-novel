<header><h1>The Valentine Mob</h1></header>
<main>
	<div class="chapter-tabs">
		<ul>
			<li>1</li>
			<li>2</li>
			<li>3</li>
			<li>4</li>
			<li>5</li>
		</ul>
	</div>
	Hi
</main>
<nav>buttons</nav>

<style>
	:global(body) {
		display: grid;
		grid-template-rows: auto 1fr auto;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	header {
		background-color: red;
		grid-row: 1;
	}

	h1 {
		margin: 0;
		padding: 0;
		font-size: clamp(1rem, 10vw, 4rem);
		line-height: 1.5;
		text-align: center;
		display: block;
	}

	main {
		background-color: orange;
		grid-row: 2;
		width: min(800px, 90vw);
		height: min(600px);
		align-self: center;
		justify-self: center;
	}

	nav {
		background-color: yellow;
		grid-row: 3;
	}

	.chapter-tabs ul {
		display: block;
		background-color: red;
		display: grid;
		justify-items: flex-start;
		grid-template-columns: auto;
	}

	.chapter-tabs ul {
	}
</style>
