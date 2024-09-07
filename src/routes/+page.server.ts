import type { BookData } from '$lib/schemas/book-schema'
import bookDataRaw from '$lib/data/book.json'
import type { PageServerLoad } from './$types'

// Needed when in layout.ts?
// export const prerender = true;

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/naming-convention
export const load: PageServerLoad = async () => ({ bookData: bookDataRaw as BookData })
