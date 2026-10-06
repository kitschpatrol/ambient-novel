import { createPartialResponse } from 'workbox-range-requests'
import { registerRoute } from 'workbox-routing'
import { assets } from '$app/manifest'
import { resolve } from '$app/paths'
import { self } from '$app/service-worker'

// Can't use automatic vite-plugin-pwa injection because we need to
// manage the range responses

const filesToCache = new Set<string>(
	assets.map(({ path }) => resolve(path)).filter((path) => path.endsWith('m4a')),
)
const cacheName = 'tvm-audio-cache'

self.addEventListener('install', () => {
	void self.skipWaiting()
})

self.addEventListener('activate', () => {
	void activate()
})

async function activate() {
	await self.clients.claim()

	// Delete old caches
	const cacheKeys = await caches.keys()
	for (const key of cacheKeys) {
		if (key !== cacheName) {
			await caches.delete(key)
		}
	}

	// Prune any files that are no longer in the files manifest
	const cache = await caches.open(cacheName)
	const cachedFiles = await cache.keys()

	for (const cachedFile of cachedFiles) {
		const cachedUrlPath = new URL(cachedFile.url).pathname

		if (!filesToCache.has(cachedUrlPath)) {
			await cache.delete(cachedFile)
		}
	}
}

// Tricky handler that fetches and caches the full file if needed
// even if it's responding to a range request...
// if the file's already in cache, serve a range response if necessary

const m4aHandler = async ({ request }: { request: Request }) => {
	const cache = await caches.open(cacheName)

	let response = await cache.match(request)

	if (response === undefined) {
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

registerRoute(/.*\.(m4a)$/, m4aHandler)

// Messages

function getAction(data: unknown): string | undefined {
	return typeof data === 'object' &&
		data !== null &&
		'action' in data &&
		typeof data.action === 'string'
		? data.action
		: undefined
}

self.addEventListener('message', (event) => {
	const action = getAction(event.data)

	if (action === 'clearCache') {
		void clearCaches()
	} else if (action === 'getCacheCount') {
		void postCacheCount(event)
	}
})

async function clearCaches() {
	try {
		const cacheNames = await caches.keys()
		await Promise.all(cacheNames.map(async (name) => caches.delete(name)))
	} catch {
		console.error('SW failed to clear caches')
	}
}

async function postCacheCount(event: ExtendableMessageEvent) {
	const totalCount = await countCachedItems()

	// Send back the total count to the main thread
	event.ports[0]?.postMessage({
		cacheCount: totalCount,
	})
}

const countCachedItems = async () => {
	let totalCount = 0

	const cacheNames = await caches.keys()

	for (const name of cacheNames) {
		const cache = await caches.open(name)
		const requestKeys = await cache.keys()
		totalCount += requestKeys.length
	}

	return totalCount
}
