<script lang="ts">
	let fullHeightEnabled = false;
</script>

<div class="container">
	<div
		class:fullHeight={fullHeightEnabled}
		class="fullHeight child"
		style="background-color: blue;"
	>
		Bla
	</div>
	<div
		class:fullHeight={fullHeightEnabled}
		class="fullHeight child"
		style="background-color: orange;"
	>
		Bla
	</div>
	<div
		class:fullHeight={fullHeightEnabled}
		class="fullHeight child"
		style="background-color: yellow;"
	>
		Bla
	</div>
</div>

<button
	class="switcher"
	on:click={() => {
		console.log('switch');
		fullHeightEnabled = !fullHeightEnabled;
		console.log(fullHeightEnabled);
	}}
>
	Toggle
</button><button />

<style>
	.switcher {
		position: absolute;
		top: 0;
	}

	.container {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		overflow-y: scroll;
		overflow-x: hidden;
		scroll-snap-type: y mandatory;
		-webkit-overflow-scrolling: touch;
	}

	.child {
		scroll-snap-align: start;
		scroll-snap-stop: always;
		width: 100vw;
		height: auto;
		/* transition: height linear 1.5s; */

		/* transition-property: height; */
		/* transition-duration: 4s; */
		transition: height ease-in-out 0.5s;
	}

	.fullHeight {
		height: 100vh;
	}
</style>
