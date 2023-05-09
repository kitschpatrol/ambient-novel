import * as z from 'zod';

export const bookSourceSchema = z.object({
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
				ambientTracks: z.array(z.string().nonempty()),
				lineShuffleAllowed: z.boolean(),
				lines: z
					.array(
						z.object({
							text: z.string().nonempty(),
							voiceOver: z.string().nonempty()
						})
					)
					.nonempty()
			})
		)
		.nonempty()
});

export type BookSource = z.infer<typeof bookSourceSchema>;
