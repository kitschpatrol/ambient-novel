<script lang="ts">
	export let text: string;
	export let textIndex: number;
</script>

<div class="line">
	<p>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html text}
	</p>
	<p class="lineNumber">{textIndex + 1}</p>
</div>

<style>
	div.line {
		width: 100%;
		height: 100%;
		background-color: rgba(255, 255, 255);
		box-shadow: -3px 3px 5px #00000067;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1.2rem;
		line-height: 120%;
		text-indent: 3.6rem;
		padding: 30px;

		/* text-align: justify; */
		position: relative;
	}

	p.lineNumber {
		position: absolute;
		font-style: italic;
		right: 12px;
		bottom: 5px;
		text-indent: 0;
		font-size: 0.7rem;
		color: rgb(182, 182, 182);
	}
</style>
