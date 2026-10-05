<script lang="ts" strictEvents>
	import { resolve } from '$app/paths'
	import { page } from '$app/stores'

	$: ({ error, status } = $page)
</script>

<svelte:head>
	<title>Error — The Valentine Mob</title>
</svelte:head>

<h1>{status}: {error?.message}</h1>
<a href={resolve('/', {})}>Go Home</a>
