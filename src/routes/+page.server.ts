import type { BookData } from '$lib/schemas/book-schema'
import bookDataRaw from '$lib/data/book.json'
import type { PageServerLoad } from './$types'

// Needed when in layout.ts?
// export const prerender = true;

// eslint-disable-next-line ts/require-await
export const load: PageServerLoad = async () => ({ bookData: bookDataRaw as BookData })
