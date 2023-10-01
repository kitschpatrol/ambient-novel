/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

console.log('worker', { build, files, prerendered, version });

// can't use automatic vite-plugin-pwa injection because we need to
// manage the range responses

const filesToCache = files.filter((f) => f.endsWith('m4a'));
const cacheName = `tvm-audio-cache-${getCacheContentHash(filesToCache)}`;

self.addEventListener('activate', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(self as any).clients.claim();

	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== cacheName) {
				console.log(`Removing stale cache ${key}`);
				await caches.delete(key);
			}
		}
	}

	deleteOldCaches();
});

self.addEventListener('install', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(self as any).skipWaiting();
});

registerRoute(
	// ({ request: e }) => 'audio' === e.destination,

	new RegExp(/.*\.(m4a)$/),
	new CacheFirst({
		cacheName,
		matchOptions: {
			ignoreSearch: true,
			ignoreVary: true
		},
		plugins: [
			new CacheableResponsePlugin({
				statuses: [200]
			}),
			new RangeRequestsPlugin()
		]
	}),
	'GET'
);

// precacheAndRoute wasn't playing nice with ranged responses?
caches.open(cacheName).then(async (cache) => {
	const newFilesToCache: string[] = [];

	for (const file of filesToCache) {
		const match = await cache.match(file);
		if (!match) {
			newFilesToCache.push(file);
		}
	}

	if (newFilesToCache.length > 0) {
		cache.addAll(newFilesToCache);
		console.log(`cached ${newFilesToCache.length} new files`);
	} else {
		console.log('No new files to cache');
	}
});

// Helpers

function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16);
}

function getCacheContentHash(files: string[]): string {
	return simpleHash(files.join());
}
