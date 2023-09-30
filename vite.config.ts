import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vitest/config';

process.env.BROWSER = 'google chrome';

export default defineConfig({
	plugins: [
		sveltekit(),
		mkcert(),
		SvelteKitPWA({
			registerType: 'prompt',
			workbox: {
				cleanupOutdatedCaches: true,
				maximumFileSizeToCacheInBytes: 100000000,
				globPatterns: ['**/*.{m4a,mp3}'],
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === 'audio',
						handler: 'CacheFirst',
						options: {
							// cacheName: 'media',
							// expiration: {
							// 	maxEntries: 500,
							// 	maxAgeSeconds: 60 * 60 * 24 * 365 * 2 // 2 years
							// },
							cacheableResponse: {
								statuses: [200]
							},
							rangeRequests: true
						}
					}
				]
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		https: true,
		proxy: {},
		open: true
	},
	// for workbox import
	define: {
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	}
});
