/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from 'zod';
import { EducationLevel, Height, Language, MaritalStatus, Occupation, Religion } from '../types/user.types';
import { CountryNamesEnum } from '../types/country_names.enum';
import countryNames from '../data/countryNames';
import { CurrencyCode } from '../types/currencyCodes.enum';

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
    page: pageValidation,
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


/* Add these new schemas to your existing search.schema.ts */

export const getUserByMIDSchema = z.object({
    mid: z.string()
        .min(1, "MID is required")
        .max(50, "MID is too long")
});
export const filterUsersSchema = z.object({
    // Pagination params (keeping existing validation)
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),

    // Enums (keeping existing validation)
    religion: z.nativeEnum(Religion)
        .optional(),
    languages: z.optional(
        z.string()
            .transform(val => val.split(','))
            .pipe(z.array(z.nativeEnum(Language)))
    ),
    country: z.nativeEnum(CountryNamesEnum)
        .optional(),

    division: z.string()
        .regex(/^\d+$/, "Division ID must be a number")
        .transform(Number)
        .pipe(
            z.number()
                .int("Division ID must be an integer")
                .min(1, "Division ID must be at least 1")
                .max(8, "Division ID cannot exceed 8")
        )
        .optional(),

    // Boolean field (keeping existing validation)
    isEducated: z.enum(['yes', 'no'])
        .optional()
        .default('yes')
        .transform(val => val === 'yes'),

    // Numeric fields (keeping existing validation)
    minWeight: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(30, "Minimum weight must be at least 30")
                .max(200, "Maximum weight cannot exceed 200")
        )
        .optional(),
    maxWeight: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(30, "Minimum weight must be at least 30")
                .max(200, "Maximum weight cannot exceed 200")
        )
        .optional(),
    minHeight: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(4, "Minimum Height must be at least 4")
                .max(8, "Maximum Height cannot exceed 8")
        )
        .optional(),
    maxHeight: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(5, "Minimum Height must be at least 5 foots")
                .max(9, "Maximum Height cannot exceed 9 foots")
        )
        .optional(),

    minAge: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(18, "Minimum age must be at least 18")
                .max(70, "Maximum age cannot exceed 70")
        )
        .optional(),
    maxAge: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(18, "Minimum age must be at least 18")
                .max(70, "Maximum age cannot exceed 70")
        )
        .optional(),

    maritalStatus: z.union([
        z.nativeEnum(MaritalStatus),
        z.array(z.nativeEnum(MaritalStatus))
    ])
        .optional()
        .transform(val => Array.isArray(val) ? val : [val]),

    // Add occupation filter
    occupation: z.union([
        z.nativeEnum(Occupation),
        z.array(z.nativeEnum(Occupation))
    ])
        .optional()
        .transform(val => Array.isArray(val) ? val : [val]),

    // Add annualIncome range filter
    minAnnualIncome: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(0, "Minimum annual income cannot be negative")
                .max(1000000000, "Maximum annual income cannot exceed 1 billion")
        )
        .optional(),

    maxAnnualIncome: z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(
            z.number()
                .min(0, "Minimum annual income cannot be negative")
                .max(1000000000, "Maximum annual income cannot exceed 1 billion")
        )
        .optional(),
    incomeCurrency: z.nativeEnum(CurrencyCode).optional()


})
    .refine(
        (data) => {
            if (data.minWeight && data.maxWeight) {
                return data.minWeight <= data.maxWeight;
            }
            return true;
        },
        {
            message: "Minimum weight must be less than or equal to maximum weight",
            path: ["minWeight", "maxWeight"]
        }
    )
    .refine(
        (data) => {
            if (data.minAge && data.maxAge) {
                return data.minAge <= data.maxAge;
            }
            return true;
        },
        {
            message: "Minimum age must be less than or equal to maximum age",
            path: ["minAge", "maxAge"]
        }
    )
    .refine(
        (data) => {
            if (data.minHeight && data.maxHeight) {
                return data.minHeight < data.maxHeight;
            }
            return true;
        },
        {
            message: "Minimum Height must be less than maxHeight",
            path: ["maxHeight", "minHeight"]
        }
    )
    .refine(
        (data) => {
            if (data.minAnnualIncome && data.maxAnnualIncome) {
                return data.minAnnualIncome <= data.maxAnnualIncome;
            }
            return true;
        },
        {
            message: "Minimum annual income must be less than or equal to maximum annual income",
            path: ["minAnnualIncome", "maxAnnualIncome"]
        }
    )
    .refine(
        (data) => {
            if (data.minAnnualIncome && data.maxAnnualIncome) {
                return !!data.incomeCurrency;
            }
            return true;
        },
        {
            message: "incomeCurrency is required if You have given minAnnualIncome, maxAnnualIncome",
            path: ["minAnnualIncome", "maxAnnualIncome"]
        }
    );
   

// Type for TypeScript type checking
export type FilterUsersQueryParams = z.infer<typeof filterUsersSchema>;


// Add these new schemas for preferred searches

export const preferredEducationSearchSchema = z.object({
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),
    educationLevels: z.array(z.nativeEnum(EducationLevel))
        .optional()
        .default([EducationLevel.BACHELORS_DEGREE])
});

export const preferredLocationSearchSchema = z.object({
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),
    countries: z.array(z.nativeEnum(CountryNamesEnum) ).optional().default([CountryNamesEnum.BANGLADESH]),
    division_ids: z.array(
        z.string()
            .regex(/^\d+$/, "Division ID must be a number")
            .transform(Number)
            .pipe(
                z.number()
                    .int("Division ID must be an integer")
                    .min(1, "Division ID must be at least 1")
                    .max(8, "Division ID cannot exceed 8")
            )
    ).optional().default([])
   ,
}).refine(
    (data) => {
        console.log(data);
        
        if (data.countries.includes(CountryNamesEnum.BANGLADESH) ) {
            if (data.division_ids.length === 0) {
                return false;
            }
            
        }
        return true;
    },
    {
        message: "Division IDs must be provided when country is Bangladesh",
        path: ["division_ids"]
    }
);

// Add this new schema for preferred occupation search

export const preferredOccupationSearchSchema = z.object({
    page: pageValidation,
    limit: limitValidation,
    count: z.enum(['yes', 'no'])
        .optional()
        .default('no'),
    occupations: z.array(
        z.nativeEnum(Occupation)
    )
        .max(10, "Maximum 10 occupations can be searched at once")
        .optional()
        .default([Occupation.ENGINEER])
});