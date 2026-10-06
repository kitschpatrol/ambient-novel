<script lang="ts">
	import { CANONICAL_PATH } from '#lib/config.js'
	import { page } from '$app/state'
	import type { LayoutProps } from './$types'
	import '/src/global.css'

	let { children }: LayoutProps = $props()

	const canonicalUrl = $derived(
		`${CANONICAL_PATH}${page.route.id === '/' ? '' : (page.route.id ?? '')}`,
	)
</script>

<svelte:head>
	<link href={canonicalUrl} rel="canonical" />
</svelte:head>

{@render children()}
