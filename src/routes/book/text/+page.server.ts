import type { PageServerLoad } from './$types'
import bookSourceRaw from '$lib/data/book-source.json'
import type { BookSource } from '$lib/schemas/book-source-schema'

// Needed when in layout.ts?
// export const prerender = true;

// eslint-disable-next-line @typescript-eslint/require-await
export const load: PageServerLoad = async () => ({ bookData: bookSourceRaw as BookSource })
