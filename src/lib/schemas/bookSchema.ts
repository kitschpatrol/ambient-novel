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
	chapters: z
		.array(
			z.object({
				title: z.string().nonempty(),
				index: z.number().int().nonnegative(),
				ambientTracks: z.array(
					z.object({
						files: z.array(z.string().nonempty()),
						durationSeconds: z.number().positive()
					})
				),
				voiceOver: z.object({
					files: z.array(z.string().nonempty()),
					durationSeconds: z.number().positive()
				}),
				lineShuffleAllowed: z.boolean(),
				lines: z
					.array(
						z.object({
							text: z.string().nonempty(),
							index: z.number().int().nonnegative(),
							timing: z.object({
								start: z.number(),
								end: z.number()
							}),
							// embedding in the text instead...
							wordTimings: z
								.array(
									z.object({
										word: z.string().nonempty(),
										start: z.number(),
										end: z.number()
									})
								)
								.optional()
						})
					)
					.nonempty()
			})
		)
		.nonempty()
});

// export type AmbientTrack = z.infer<typeof bookSchema>['chapters'][number]['ambientTracks'][number];
export type LineData = z.infer<typeof bookSchema>['chapters'][number]['lines'][number];
export type ChapterData = z.infer<typeof bookSchema>['chapters'][number];
export type BookData = z.infer<typeof bookSchema>;
