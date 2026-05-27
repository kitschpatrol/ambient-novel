import bookDataRaw from '$lib/data/book.json'
import { bookSchema } from '$lib/schemas/book-schema'
import type { PageServerLoad } from './$types'

// Needed when in layout.ts?
// export const prerender = true;

// eslint-disable-next-line ts/require-await
export const load: PageServerLoad = async () => ({ bookData: bookSchema.parse(bookDataRaw) })
