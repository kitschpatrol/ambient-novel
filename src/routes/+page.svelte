<script lang="ts">
	import type { PageServerData } from './$types'
	import Stack from '$lib/components/Stack.svelte'

	export let data: PageServerData
</script>

<svelte:head>
	<title>The Valentine Mob</title>
	<style>
		body {
			position: fixed;
			overflow: hidden;
		}
	</style>
</svelte:head>

<Stack bookData={data.bookData} />
