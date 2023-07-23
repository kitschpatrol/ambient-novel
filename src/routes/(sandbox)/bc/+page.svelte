<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { faPlay } from '@fortawesome/free-solid-svg-icons';
</script>

<div style="width: 100px; height: 50px; background-color: pink;">
	<div class="temp">
		<Button
			icon={faPlay}
			on:click={() => {
				console.log('click');
			}}
		/>
	</div>

	<div class="temp">
		<Button icon={faPlay} label="bla" />
	</div>
</div>
