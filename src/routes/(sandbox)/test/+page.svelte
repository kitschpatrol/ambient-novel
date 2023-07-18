<script lang="ts">
</script>

<div class="scroll-wrapper">
	<div class="scroll-area">
		<div class="spacer">spacer</div>
		<div class="chapter-text">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
			labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
			laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
			voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
			non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
		</div>
		<div class="spacer">spacer</div>
	</div>
</div>

<style>
	div.scroll-wrapper {
		overflow-x: scroll;
		white-space: nowrap;
		height: 10vh;
		background-color: teal;
	}

	div.spacer {
		display: inline-block;
		width: 100vw;
		background-color: blue;
	}

	div.chapter-text {
		display: inline-block;
	}

	div.scroll-area {
		display: inline-block;
		background-color: red;
	}
</style>
