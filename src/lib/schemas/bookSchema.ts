import * as z from 'zod';

// Slight shift in structure from the book
// source schema used in the content generator
export const bookSchema = z.object({
	author: z.string().nonempty(),
	chapters: z
		.array(
			z.object({
				audio: z.object({
					durationSeconds: z.number().positive(),
					files: z.array(z.string().nonempty()).nonempty()
				}),
				index: z.number().int().nonnegative(),
				lines: z.array(z.string().nonempty()).nonempty(),
				narrationTime: z.object({
					end: z.number().positive(),
					start: z.number().positive()
				}),
				title: z.string().nonempty()
			})
		)
		.nonempty(),
	country: z.string().nonempty(),
	license: z.string().nonempty(),
	publisher: z.string().nonempty(),
	title: z.string().nonempty(),
	titleAlt: z.string().nonempty(),
	year: z.number().int().positive()
});

// Export type AmbientTrack = z.infer<typeof bookSchema>['chapters'][number]['ambientTracks'][number];
export type LineData = z.infer<typeof bookSchema>['chapters'][number]['lines'][number];
export type ChapterData = z.infer<typeof bookSchema>['chapters'][number];
export type BookData = z.infer<typeof bookSchema>;
