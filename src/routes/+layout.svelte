<script lang="ts">
	// Import { browser } from '$app/environment';
	// import { onMount } from 'svelte';
	import '/src/global.css'
	// Import { pwaInfo } from 'virtual:pwa-info';
	import { page } from '$app/stores'
	import { canonicalPath } from '$lib/config'
	/// TODO remove this
	// onMount(() => {
	// 	navigator.serviceWorker.getRegistrations().then(function (registrations) {
	// 		for (let registration of registrations) {
	// 			console.log('unregister sw');
	// 			registration.unregister();
	// 		}
	// 	});
	// });

	// onMount(async () => {
	// if (pwaInfo) {
	// 	const { registerSW } = await import('virtual:pwa-register');
	// 	registerSW({
	// 		immediate: true,
	// 		onRegistered(r) {
	// 			// uncomment following code if you want check for updates
	// 			// r && setInterval(() => {
	// 			//    console.log('Checking for sw update')
	// 			//    r.update()
	// 			// }, 20000 /* 20s for testing purposes */)
	// 			console.log(`SW Registered: ${r}`);
	// 		},
	// 		onRegisterError(error) {
	// 			console.log('SW registration error', error);
	// 		}
	// 	});
	// }
	// });

	// $: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	// wtf...
	// https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay
	// if (browser) {
	// 	const audioContext = new window.AudioContext();
	// }

	$: canonicalUrl = `${canonicalPath}${$page.route.id === '/' ? '' : $page.route.id}`
</script>

<svelte:head>
	<link href={canonicalUrl} rel="canonical" />
</svelte:head>

<slot />
