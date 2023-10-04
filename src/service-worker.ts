/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { files } from '$service-worker';

import { createPartialResponse } from 'workbox-range-requests';
import { registerRoute } from 'workbox-routing';

// can't use automatic vite-plugin-pwa injection because we need to
// manage the range responses

const filesToCache = files.filter((f) => f.endsWith('m4a'));
const cacheName = `tvm-audio-cache`;

self.addEventListener('install', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(self as any).skipWaiting();

	console.log('SW installed');
});

self.addEventListener('activate', async () => {
	console.log('SW activated');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(self as any).clients.claim();

	// delete old caches
	for (const key of await caches.keys()) {
		if (key !== cacheName) {
			console.log(`Removing stale cache ${key}`);
			await caches.delete(key);
		}
	}

	// prune any files that are no longer in the files manifest
	const cache = await caches.open(cacheName);
	const cachedFiles = await cache.keys();

	for (const cachedFile of cachedFiles) {
		if (!filesToCache.includes(cachedFile.url)) {
			console.log(`Removing stale file ${cachedFile.url}`);
			await cache.delete(cachedFile);
		}
	}
});

// Tricky handler that fetches and caches the full file if needed
// even if it's responding to a range request...
// if the file's already in cache, serve a range response if necessary
const m4aHandler = async ({ event }) => {
	const cache = await caches.open(cacheName);

	console.log('SW handling', event.request.url);

	let response = await cache.match(event.request);

	// cache the request
	if (response) {
		console.log('SW found match in cache');
	} else {
		// Clone the request to manipulate headers
		const newHeaders = new Headers(event.request.headers);
		newHeaders.delete('Range');

		const newRequest = new Request(event.request.url, {
			method: event.request.method,
			headers: newHeaders,
			mode: event.request.mode,
			credentials: event.request.credentials,
			redirect: event.request.redirect
		});

		// Fetch the full .m4a file
		response = await fetch(newRequest);

		if (response.status === 200) {
			// Put it in the cache
			console.log('SW Caching', event.request.url);
			await cache.put(event.request, response.clone());
		} else {
			console.error(`SW failed to fetch ${event.request.url}`);
		}
	}

	// Create a partial response if this is a Range request
	if (event.request.headers.has('Range')) {
		const partialResponse = await createPartialResponse(event.request, response);
		return partialResponse;
	}

	return response;
};

registerRoute(
	// ({ request: e }) => 'audio' === e.destination,
	new RegExp(/.*\.(m4a)$/),
	m4aHandler
);

// Messages

interface ServiceWorkerMessageEvent extends Event {
	data: {
		action: string;
	};
}

self.addEventListener('message', (event: ServiceWorkerMessageEvent) => {
	if (event.data && event.data.action === 'clearCache') {
		// Clear the cache
		caches
			.keys()
			.then((cacheNames: string[]) => {
				return Promise.all(
					cacheNames.map((cacheName: string) => {
						return caches.delete(cacheName);
					})
				);
			})
			.then(() => {
				console.log('Caches cleared');
			})
			.catch((error: Error) => {
				console.log('Error clearing caches', error);
			});
	}
});

self.addEventListener('message', async (event: ServiceWorkerMessageEvent) => {
	if (event.data && event.data.action === 'getCacheCount') {
		const totalCount = await countCachedItems();

		// Send back the total count to the main thread
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		((event as any).ports[0] as MessagePort).postMessage({
			cacheCount: totalCount
		});
	}
});

const countCachedItems = async () => {
	let totalCount = 0;

	// Get the keys of all cache names
	const cacheNames: string[] = await caches.keys();

	for (const cacheName of cacheNames) {
		// Open each cache by its name
		const cache = await caches.open(cacheName);

		// Get keys of all items in this cache
		const requestKeys: Request[] = (await cache.keys()) as Request[];

		// Add the count of items in this cache to the total count
		totalCount += requestKeys.length;
	}

	return totalCount;
};
