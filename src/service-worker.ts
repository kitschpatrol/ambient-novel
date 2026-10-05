/* eslint-disable ts/no-unsafe-member-access */
/* eslint-disable ts/no-unsafe-call */
/* eslint-disable ts/triple-slash-reference */
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { createPartialResponse } from 'workbox-range-requests'
import { registerRoute } from 'workbox-routing'
// eslint-disable-next-line import/no-unresolved
import { files } from '$service-worker'

// Can't use automatic vite-plugin-pwa injection because we need to
// manage the range responses

const filesToCache = new Set(files.filter((f) => f.endsWith('m4a')))
const cacheName = `tvm-audio-cache`

addEventListener('install', () => {
	// eslint-disable-next-line ts/no-explicit-any, unicorn/prefer-global-this
	;(self as any).skipWaiting()

	// Console.log('SW installed');
})

addEventListener('activate', () => {
	void activate()
})

async function activate() {
	// Console.log('SW activated');

	// eslint-disable-next-line ts/no-explicit-any, unicorn/prefer-global-this
	;(self as any).clients.claim()

	// Delete old caches
	const cacheKeys = await caches.keys()
	for (const key of cacheKeys) {
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
}

// Tricky handler that fetches and caches the full file if needed
// even if it's responding to a range request...
// if the file's already in cache, serve a range response if necessary

const m4aHandler = async ({ request }: { request: Request }) => {
	const cache = await caches.open(cacheName)

	// Console.log('SW handling', request.url);

	let response = await cache.match(request)

	// Cache the request
	if (response) {
		// Console.log('SW found match in cache');
	} else {
		// Clone the request to manipulate headers
		const newHeaders = new Headers(request.headers)
		newHeaders.delete('Range')

		const newRequest = new Request(request.url, {
			credentials: request.credentials,
			headers: newHeaders,
			method: request.method,
			mode: request.mode,
			redirect: request.redirect,
		})

		// Fetch the full .m4a file
		response = await fetch(newRequest)

		if (response.status === 200) {
			// Put it in the cache
			// console.log('SW Caching', request.url);
			await cache.put(request, response.clone())
		} else {
			console.error(`SW failed to fetch ${request.url}`)
		}
	}

	// Create a partial response if this is a Range request
	if (request.headers.has('Range')) {
		const partialResponse = await createPartialResponse(request, response)
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

type ServiceWorkerMessageEvent = Event & {
	data: {
		action: string
	}
}

addEventListener('message', (event: ServiceWorkerMessageEvent) => {
	// eslint-disable-next-line ts/no-unnecessary-condition
	if (event.data?.action === 'clearCache') {
		void clearCaches()
	}
})

async function clearCaches() {
	try {
		const cacheNames = await caches.keys()
		await Promise.all(cacheNames.map(async (name) => caches.delete(name)))
		// Console.log('Caches cleared');
	} catch {
		// Console.log('Error clearing caches');
	}
}

addEventListener('message', (event: ServiceWorkerMessageEvent) => {
	void postCacheCount(event)
})

async function postCacheCount(event: ServiceWorkerMessageEvent) {
	// eslint-disable-next-line ts/no-unnecessary-condition
	if (event.data?.action !== 'getCacheCount') {
		return
	}

	const totalCount = await countCachedItems()

	// Send back the total count to the main thread
	// eslint-disable-next-line ts/no-explicit-any
	;((event as any).ports[0] as MessagePort).postMessage({
		cacheCount: totalCount,
	})
}

const countCachedItems = async () => {
	let totalCount = 0

	// Get the keys of all cache names
	const cacheNames: string[] = await caches.keys()

	for (const name of cacheNames) {
		// Open each cache by its name
		const cache = await caches.open(name)

		// Get keys of all items in this cache
		const requestKeys: Request[] = (await cache.keys()) as Request[]

		// Add the count of items in this cache to the total count
		totalCount += requestKeys.length
	}

	return totalCount
}
