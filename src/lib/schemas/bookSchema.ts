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
				ambientTracks: z.array(
					z.object({
						files: z.array(z.string().nonempty()),
						durationSeconds: z.number().positive(),
						originalFile: z.string().nonempty()
					})
				),
				voiceOver: z.object({
					files: z.array(z.string().nonempty()),
					durationSeconds: z.number().positive(),
					originalFile: z.string().nonempty()
				}),
				lineShuffleAllowed: z.boolean(),
				lines: z
					.array(
						z.object({
							text: z.string().nonempty(),
							timings: z
								.array(
									z.object({
										word: z.string().nonempty(),
										start: z.number(),
										end: z.number()
									})
								)
								.nonempty()
						})
					)
					.nonempty()
			})
		)
		.nonempty()
});

// export type AmbientTrack = z.infer<typeof bookSchema>['chapters'][number]['ambientTracks'][number];
// export type Line = z.infer<typeof bookSchema>['chapters'][number]['lines'][number];
// export type Chapter = z.infer<typeof bookSchema>['chapters'][number];
export type Book = z.infer<typeof bookSchema>;
