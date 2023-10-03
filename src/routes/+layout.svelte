<script lang="ts">
	// import { onMount } from 'svelte';
	// import { pwaInfo } from 'virtual:pwa-info';
	import '/src/global.css';

	/// TODO remove this
	// onMount(() => {
	// 	navigator.serviceWorker.getRegistrations().then(function (registrations) {
	// 		for (let registration of registrations) {
	// 			console.log('unregistering sw');
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
</script>

<slot />
