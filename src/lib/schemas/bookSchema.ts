import * as z from 'zod';

// slight shift in structure from the book
// source schema used in the conten generator
export const bookSchema = z.object({
	title: z.string().nonempty(),
	titleAlt: z.string().nonempty(),
	author: z.string().nonempty(),
	year: z.number().int().positive(),
	publisher: z.string().nonempty(),
	country: z.string().nonempty(),
	license: z.string().nonempty(),
	chapters: z
		.array(
			z.object({
				title: z.string().nonempty(),
				index: z.number().int().nonnegative(),
				audio: z.object({
					files: z.array(z.string().nonempty()).nonempty(),
					durationSeconds: z.number().positive()
				}),
				narrationTime: z.object({
					start: z.number().positive(),
					end: z.number().positive()
				}),
				lines: z.array(z.string().nonempty()).nonempty()
			})
		)
		.nonempty()
});

// export type AmbientTrack = z.infer<typeof bookSchema>['chapters'][number]['ambientTracks'][number];
export type LineData = z.infer<typeof bookSchema>['chapters'][number]['lines'][number];
export type ChapterData = z.infer<typeof bookSchema>['chapters'][number];
export type BookData = z.infer<typeof bookSchema>;
