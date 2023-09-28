import * as z from 'zod';

export const licenseSchema = z.record(
	z.object({
		licenses: z.string().nonempty(),
		path: z.string().nonempty(),
		email: z.string().nonempty().optional(), // not all valid emails
		licenseFile: z.string().nonempty().optional(),
		publisher: z.string().nonempty().optional(),
		repository: z.string().nonempty().optional(), // not always valid URLs...
		url: z.string().nonempty().optional() // not all valid URLs
	})
);

export type License = z.infer<typeof licenseSchema>[string];
export type LicenseData = z.infer<typeof licenseSchema>;
