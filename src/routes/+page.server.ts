import bookDataRaw from '#lib/data/book.json'
import { bookSchema } from '#lib/schemas/book-schema.js'
import type { PageServerLoad } from './$types'

// eslint-disable-next-line ts/require-await
export const load: PageServerLoad = async () => ({ bookData: bookSchema.parse(bookDataRaw) })
