import type { PageServerLoad } from './$types'
import bookDataRaw from '$lib/data/book.json'
import type { BookData } from '$lib/schemas/book-schema'

// Needed when in layout.ts?
// export const prerender = true;

// eslint-disable-next-line @typescript-eslint/require-await
export const load: PageServerLoad = async () => ({ bookData: bookDataRaw as BookData })
