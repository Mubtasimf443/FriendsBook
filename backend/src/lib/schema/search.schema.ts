/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';

// Define Zod schema for query parameters
export const limitValidation = z.optional(z.enum(['10', '25', '50', '100']))
    .default('25')
    .transform(str => parseInt(str));
export const pageValidation = z.optional(
    z.string()
        .regex(/^\d+$/, {
            message: "Page must be a positive integer"
        })
        .max(4)
).default('1').transform(val => val ? parseInt(val, 10) : 1)


export const searchQuertSchema = z.object({
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no')
});


export const todaysMatchSchema = z.object({ limit: limitValidation })


// Add this new schema for just-joined endpoint
export const justJoinedSchema = z.object({
    timeRange: z.optional(z.enum(['7', '15', '30'])).default('7'),
    limit: limitValidation,
    page: pageValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no')
});

export const notViewedSchema = z.object({
    page:pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),
});

export const onlineUsersSchema = z.object({
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),
});