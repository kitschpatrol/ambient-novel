import bookDataRaw from '$lib/data/book.json';
import type { BookData } from '$lib/schemas/bookSchema';

import type { PageServerLoad } from './$types';

// needed when in layout.ts?
// export const prerender = true;

export const load: PageServerLoad = async () => {
	return { bookData: bookDataRaw as BookData };
};
