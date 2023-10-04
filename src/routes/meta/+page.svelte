<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import Header from '$lib/components/Header.svelte';
	import { name, version } from '$lib/data/pkgInfo.json';
	import { faBomb, faTrash } from '@fortawesome/free-solid-svg-icons';

	async function getServiceWorkerCount() {
		return (await navigator.serviceWorker.getRegistrations()).length;
	}

	async function uninstallServiceWorker() {
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (let registration of registrations) {
			await registration.unregister();
		}
		swCount = getServiceWorkerCount();
	}

	async function clearServiceWorkerCache() {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker.controller?.postMessage({
				action: 'clearCache'
			});
			cacheCount = getCacheCount();
		}
	}

	async function getCacheCount(): Promise<number> {
		return new Promise<number>(async (resolve, reject) => {
			if (browser && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
				const messageChannel = new MessageChannel();

				// Set up a listener for receiving the count of cached items
				messageChannel.port1.onmessage = (event) => {
					console.log(`Total cached items: ${event.data.cacheCount}`);
					resolve(event.data.cacheCount);
				};

				// Send the message to the service worker to get the cache count
				navigator.serviceWorker.controller.postMessage(
					{
						action: 'getCacheCount'
					},
					[messageChannel.port2]
				);
			} else {
				reject('Service Worker not available');
			}
		});
	}

	let cacheCount = getCacheCount();
	let swCount = getServiceWorkerCount();
</script>

<svelte:head>
	<title>Meta — The Valentine Mob</title>
	<style>
		/* all the fixed position hacks (like ::before) are subtly broken */
		body,
		html {
			overscroll-behavior: unset;
			position: static;
			overflow-y: auto;
			background: linear-gradient(
					var(--background-color-gradient-1) 0%,
					var(--background-color-gradient-2) 100%
				)
				var(--background-color-gradient-1);
		}
	</style>
</svelte:head>

<Header
	--position="fixed"
	--shadow="-10px 25px 50px 0px rgba(0, 0, 0, 0.2)"
	--height="calc(100svh / 12)"
/>

<main class="mx-auto mb-16 mt-36 max-w-[25rem]">
	<p class="font-display text-white">{name} version {version}</p>
	<p class="font-display text-white">
		Service Workers: {#await swCount then count}
			{count}
		{:catch error}
			<span style="color: red">{error.message}</span>
		{/await}
	</p>
	<p class="font-display text-white">
		Cached Items: {#await cacheCount then count}
			{count}
		{:catch error}
			<span style="color: red">{error.message}</span>
		{/await}
	</p>
	<Button icon={faBomb} label="Uninstall Service Worker" on:click={uninstallServiceWorker} />
	<Button icon={faTrash} label="Clear Service Worker Cache" on:click={clearServiceWorkerCache} />
</main>
