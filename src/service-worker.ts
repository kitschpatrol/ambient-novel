/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { files } from '$service-worker'
import { createPartialResponse } from 'workbox-range-requests'
import { registerRoute } from 'workbox-routing'

// Can't use automatic vite-plugin-pwa injection because we need to
// manage the range responses

const filesToCache = new Set(files.filter((f) => f.endsWith('m4a')))
const cacheName = `tvm-audio-cache`

self.addEventListener('install', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	;(self as any).skipWaiting()

	// Console.log('SW installed');
})

self.addEventListener('activate', async () => {
	// Console.log('SW activated');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	;(self as any).clients.claim()

	// Delete old caches
	for (const key of await caches.keys()) {
		if (key !== cacheName) {
			// Console.log(`Removing stale cache ${key}`);
			await caches.delete(key)
		}
	}

	// Prune any files that are no longer in the files manifest
	const cache = await caches.open(cacheName)
	const cachedFiles = await cache.keys()

	for (const cachedFile of cachedFiles) {
		const cachedUrlPath = new URL(cachedFile.url).pathname

		if (filesToCache.has(cachedUrlPath)) {
			// Console.log(`Retaining cache file ${cachedUrlPath}`);
		} else {
			// Console.log(`Removing stale file ${cachedUrlPath}`);
			await cache.delete(cachedFile)
		}
	}
})

// Tricky handler that fetches and caches the full file if needed
// even if it's responding to a range request...
// if the file's already in cache, serve a range response if necessary

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m4aHandler = async ({ event }: { event: any }) => {
	const cache = await caches.open(cacheName)

	// Console.log('SW handling', event.request.url);

	let response = await cache.match(event.request)

	// Cache the request
	if (response) {
		// Console.log('SW found match in cache');
	} else {
		// Clone the request to manipulate headers
		const newHeaders = new Headers(event.request.headers)
		newHeaders.delete('Range')

		const newRequest = new Request(event.request.url, {
			credentials: event.request.credentials,
			headers: newHeaders,
			method: event.request.method,
			mode: event.request.mode,
			redirect: event.request.redirect,
		})

		// Fetch the full .m4a file
		response = await fetch(newRequest)

		if (response.status === 200) {
			// Put it in the cache
			// console.log('SW Caching', event.request.url);
			await cache.put(event.request, response.clone())
		} else {
			console.error(`SW failed to fetch ${event.request.url}`)
		}
	}

	// Create a partial response if this is a Range request
	if (event.request.headers.has('Range')) {
		const partialResponse = await createPartialResponse(event.request, response)
		return partialResponse
	}

	return response
}

registerRoute(
	// ({ request: e }) => 'audio' === e.destination,
	/.*\.(m4a)$/,
	m4aHandler,
)

// Messages

type ServiceWorkerMessageEvent = {
	data: {
		action: string
	}
} & Event

self.addEventListener('message', (event: ServiceWorkerMessageEvent) => {
	if (event.data && event.data.action === 'clearCache') {
		// Clear the cache
		caches
			.keys()
			.then(async (cacheNames: string[]) =>
				Promise.all(cacheNames.map(async (cacheName: string) => caches.delete(cacheName))),
			)
			.then(() => {
				// Console.log('Caches cleared');
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.catch((error: Error) => {
				// Console.log('Error clearing caches', error);
			})
	}
})

self.addEventListener('message', async (event: ServiceWorkerMessageEvent) => {
	if (event.data && event.data.action === 'getCacheCount') {
		const totalCount = await countCachedItems()

		// Send back the total count to the main thread
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;((event as any).ports[0] as MessagePort).postMessage({
			cacheCount: totalCount,
		})
	}
})

const countCachedItems = async () => {
	let totalCount = 0

	// Get the keys of all cache names
	const cacheNames: string[] = await caches.keys()

	for (const cacheName of cacheNames) {
		// Open each cache by its name
		const cache = await caches.open(cacheName)

		// Get keys of all items in this cache
		const requestKeys: Request[] = (await cache.keys()) as Request[]

		// Add the count of items in this cache to the total count
		totalCount += requestKeys.length
	}

	return totalCount
}
