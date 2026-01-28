<script lang="ts">
	import { resolve } from '$app/paths'
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Error — The Valentine Mob</title>
</svelte:head>

<h1>{$page.status}: {$page.error?.message}</h1>
<a href={resolve('/', {})}>Go Home</a>
