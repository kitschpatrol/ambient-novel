<script lang="ts" strictEvents>
	import Stack from '$lib/components/Stack.svelte'
	import type { PageServerData } from './$types'

	export let data: PageServerData
</script>

<svelte:head>
	<title>The Valentine Mob</title>
	<!-- eslint-disable-next-line svelte/no-nested-style-tag -- Route-specific body styles that must only apply while this page's head content is mounted -->
	<style>
		body {
			position: fixed;
			overflow: hidden;
		}
	</style>
</svelte:head>

<Stack bookData={data.bookData} />
