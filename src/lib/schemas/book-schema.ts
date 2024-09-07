import * as z from 'zod'

// Slight shift in structure from the book
// source schema used in the content generator
// eslint-disable-next-line @typescript-eslint/naming-convention
export const bookSchema = z.object({
	author: z.string().min(1),
	chapters: z
		.array(
			z.object({
				audio: z.object({
					durationSeconds: z.number().positive(),
					files: z.array(z.string().min(1)).nonempty(),
				}),
				index: z.number().int().nonnegative(),
				lines: z.array(z.string().min(1)).nonempty(),
				narrationTime: z.object({
					end: z.number().positive(),
					start: z.number().positive(),
				}),
				title: z.string().min(1),
			}),
		)
		.nonempty(),
	country: z.string().min(1),
	fullAudio: z.array(z.string().min(1)).nonempty(),
	license: z.string().min(1),
	publisher: z.string().min(1),
	title: z.string().min(1),
	titleAlt: z.string().min(1),
	year: z.number().int().positive(),
})

// Export type AmbientTrack = z.infer<typeof bookSchema>['chapters'][number]['ambientTracks'][number];
export type LineData = z.infer<typeof bookSchema>['chapters'][number]['lines'][number]
export type ChapterData = z.infer<typeof bookSchema>['chapters'][number]
export type BookData = z.infer<typeof bookSchema>
