import * as z from 'zod'

export const licenseSchema = z.record(
	z.object({
		email: z.string().min(1).optional(), // Not all valid emails
		licenseFile: z.string().min(1).optional(),
		licenses: z.string().min(1),
		path: z.string().min(1),
		publisher: z.string().min(1).optional(),
		repository: z.string().min(1).optional(), // Not always valid URLs...
		url: z.string().min(1).optional(), // Not all valid URLs
	}),
)

export type License = z.infer<typeof licenseSchema>[string]
export type LicenseData = z.infer<typeof licenseSchema>
