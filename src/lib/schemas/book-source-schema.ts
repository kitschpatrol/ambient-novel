import * as z from 'zod'

// eslint-disable-next-line @typescript-eslint/naming-convention
export const bookSourceSchema = z.object({
	author: z.string().min(1),
	chapters: z
		.array(
			z.object({
				audioMix: z.string().min(1),
				audioVoiceSolo: z.string().min(1),
				lines: z.array(z.string().min(1)).nonempty(),
				title: z.string().min(1),
			}),
		)
		.nonempty(),
	country: z.string().min(1),
	fullAudio: z.string().min(1),
	license: z.string().min(1),
	publisher: z.string().min(1),
	title: z.string().min(1),
	titleAlt: z.string().min(1),
	year: z.number().int().positive(),
})

export type BookSource = z.infer<typeof bookSourceSchema>
