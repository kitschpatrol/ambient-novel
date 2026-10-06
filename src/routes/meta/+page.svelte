<script lang="ts">
	import { faBomb, faTrash } from '@fortawesome/free-solid-svg-icons'
	import Button from '#lib/components/Button.svelte'
	import Header from '#lib/components/Header.svelte'
	import { name, version } from '#lib/data/pkg-info.json'
	import UaParser from 'ua-parser-js'
	import { browser } from '$app/env'

	async function getServiceWorkerCount() {
		const registrations = await navigator.serviceWorker.getRegistrations()
		return registrations.length
	}

	async function uninstallServiceWorker() {
		const registrations = await navigator.serviceWorker.getRegistrations()
		for (const registration of registrations) {
			await registration.unregister()
		}

		swCount = getServiceWorkerCount()
	}

	function clearServiceWorkerCache() {
		if (!browser || !('serviceWorker' in navigator)) {
			return
		}

		const { controller } = navigator.serviceWorker
		controller?.postMessage({
			action: 'clearCache',
		})
		cacheCount = getCacheCount()
	}

	async function getCacheCount(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			if (browser && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
				const messageChannel = new MessageChannel()

				// Set up a listener for receiving the count of cached items
				messageChannel.port1.onmessage = (event) => {
					resolve(event.data.cacheCount)
				}

				// Send the message to the service worker to get the cache count
				navigator.serviceWorker.controller.postMessage(
					{
						action: 'getCacheCount',
					},
					[messageChannel.port2],
				)
			} else {
				reject(new Error('Service Worker not available'))
			}
		})
	}

	const isMobile = (new UaParser().getDevice().type ?? '') === 'mobile'

	let cacheCount = $state.raw(getCacheCount())

	let swCount = $state.raw(getServiceWorkerCount())
</script>

<svelte:head>
	<title>Meta — The Valentine Mob</title>
	<!-- eslint-disable-next-line svelte/no-nested-style-tag -- Route-specific body styles that must only apply while this page's head content is mounted -->
	<style>
		/* all the fixed position hacks (like ::before) are subtly broken */
		body,
		html {
			position: static;
			overflow-y: auto;
			overscroll-behavior: unset;
			background: linear-gradient(
					var(--background-color-gradient-1) 0%,
					var(--background-color-gradient-2) 100%
				)
				var(--background-color-gradient-1);
		}
	</style>
</svelte:head>

<Header
	--height="calc(100svh / 12)"
	--position="fixed"
	--shadow="-10px 25px 50px 0px rgba(0, 0, 0, 0.2)"
/>

<main class="mx-auto mt-36 mb-16 max-w-100">
	<p class="font-display text-white">{name} version {version}</p>
	<p class="font-display text-white">
		Service Workers: {#await swCount then count}
			{count}
		{:catch error}
			<span style:color="red">{error.message}</span>
		{/await}
	</p>
	<p class="font-display text-white">
		Cached Items: {#await cacheCount then count}
			{count}
		{:catch error}
			<span style:color="red">{error.message}</span>
		{/await}
	</p>
	<Button icon={faBomb} label="Uninstall Service Worker" onclick={uninstallServiceWorker} />
	<Button icon={faTrash} label="Clear Service Worker Cache" onclick={clearServiceWorkerCache} />
	<p class="font-display text-white">
		Mobile detected: {isMobile}
	</p>
</main>
