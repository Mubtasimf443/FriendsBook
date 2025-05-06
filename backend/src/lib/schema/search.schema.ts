/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';

// Define Zod schema for query parameters

export const searchQuertSchema = z.object({
    page: z.optional(
        z.string()
            .regex(/^\d+$/, {
                message: "Page must be a positive integer"
            })
            .max(4)
    ).default('1').transform(val => val ? parseInt(val, 10) : 1),
    limit: z.optional(z.enum(['10', '25', '50', '100']))
        .default('25')
        .transform(str => parseInt(str)),
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no')
});


