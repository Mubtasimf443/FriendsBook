"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreByDivisionSchema = exports.exploreByCountrySchema = exports.searchHistorySchema = exports.filterUsersSchema = exports.preferredOccupationSearchSchema = exports.preferredLocationSearchSchema = exports.preferredEducationSearchSchema = exports.getUserByMIDSchema = exports.justJoinedSchema = exports.todaysMatchSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const country_names_enum_1 = require("../types/country_names.enum");
const schemaComponents_1 = require("./schemaComponents");
exports.paginationSchema = zod_1.z.object({
    page: schemaComponents_1.pageValidation,
    limit: schemaComponents_1.limitValidation,
    count: schemaComponents_1.countValidation
});
exports.todaysMatchSchema = zod_1.z.object({ limit: schemaComponents_1.limitValidation });
// Add this new schema for just-joined endpoint
exports.justJoinedSchema = exports.paginationSchema.extend({
    timeRange: zod_1.z.optional(zod_1.z.enum(['7', '15', '30'])).default('7'),
});
/* Add these new schemas to your existing search.schema.ts */
exports.getUserByMIDSchema = zod_1.z.object({
    mid: zod_1.z.string()
        .min(1, "MID is required")
        .max(50, "MID is too long")
});
// Add these new schemas for preferred searches
exports.preferredEducationSearchSchema = exports.paginationSchema.extend({
    educationLevels: schemaComponents_1.educationLevelsValidator
});
exports.preferredLocationSearchSchema = exports.paginationSchema.extend({
    countries: schemaComponents_1.countriesValidator,
    division_ids: schemaComponents_1.division_ids_valdator,
})
    .refine((data) => {
    if (data.countries.includes(country_names_enum_1.CountryNamesEnum.BANGLADESH)) {
        if (data.division_ids.length === 0) {
            return false;
        }
    }
    return true;
}, {
    message: "Division IDs must be provided when country is Bangladesh",
    path: ["division_ids"]
});
// Add this new schema for preferred occupation search
exports.preferredOccupationSearchSchema = exports.paginationSchema.extend({
    occupations: schemaComponents_1.occupationsValidator
});
exports.filterUsersSchema = exports.paginationSchema.extend({
    // Enums (keeping existing validation)
    religion: schemaComponents_1.religionValidator,
    languages: schemaComponents_1.languagesValdator,
    countries: schemaComponents_1.countriesValidator,
    division_ids: schemaComponents_1.division_ids_valdator,
    isEducated: zod_1.z.enum(['yes', 'no']).optional().default('yes').transform(val => val === 'yes'),
    maritalStatuses: schemaComponents_1.maritalStatusesValdator,
    occupations: schemaComponents_1.occupationsValidator,
    minWeight: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(30, "Minimum weight must be at least 30")
        .max(200, "Maximum weight cannot exceed 200"))
        .optional(),
    maxWeight: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(30, "Minimum weight must be at least 30")
        .max(200, "Maximum weight cannot exceed 200"))
        .optional(),
    minHeight: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(4, "Minimum Height must be at least 4")
        .max(8, "Maximum Height cannot exceed 8"))
        .optional(),
    maxHeight: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(5, "Minimum Height must be at least 5 foots")
        .max(9, "Maximum Height cannot exceed 9 foots"))
        .optional(),
    minAge: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(18, "Minimum age must be at least 18")
        .max(70, "Maximum age cannot exceed 70"))
        .optional(),
    maxAge: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(18, "Minimum age must be at least 18")
        .max(70, "Maximum age cannot exceed 70"))
        .optional(),
    minAnnualIncome: zod_1.z.string()
        .regex(/^\d+$/, "Must be a positive number")
        .transform(Number)
        .pipe(zod_1.z.number()
        .min(0, "Minimum annual income cannot be negative")
        .max(1000000000, "Maximum annual income cannot exceed 1 billion"))
        .optional(),
    maxAnnualIncome: zod_1.z.string().regex(/^\d+$/, "Must be a positive number").transform(Number)
        .pipe(zod_1.z.number()
        .min(0, "Minimum annual income cannot be negative")
        .max(1000000000, "Maximum annual income cannot exceed 1 billion"))
        .optional(),
    incomeCurrency: schemaComponents_1.incomeCurrencyValidator
})
    .refine((data) => {
    if (data.minWeight && data.maxWeight) {
        return data.minWeight <= data.maxWeight;
    }
    return true;
}, {
    message: "Minimum weight must be less than or equal to maximum weight",
    path: ["minWeight", "maxWeight"]
})
    .refine((data) => {
    if (data.minAge && data.maxAge) {
        return data.minAge <= data.maxAge;
    }
    return true;
}, {
    message: "Minimum age must be less than or equal to maximum age",
    path: ["minAge", "maxAge"]
})
    .refine((data) => {
    if (data.minHeight && data.maxHeight) {
        return data.minHeight < data.maxHeight;
    }
    return true;
}, {
    message: "Minimum Height must be less than maxHeight",
    path: ["maxHeight", "minHeight"]
})
    .refine((data) => {
    if (data.minAnnualIncome && data.maxAnnualIncome) {
        return data.minAnnualIncome <= data.maxAnnualIncome;
    }
    return true;
}, {
    message: "Minimum annual income must be less than or equal to maximum annual income",
    path: ["minAnnualIncome", "maxAnnualIncome"]
})
    .refine((data) => {
    if (data.minAnnualIncome && data.maxAnnualIncome) {
        return !!data.incomeCurrency;
    }
    return true;
}, {
    message: "incomeCurrency is required if You have given minAnnualIncome, maxAnnualIncome",
    path: ["minAnnualIncome", "maxAnnualIncome"]
})
    .refine((data) => {
    if (data.countries.includes(country_names_enum_1.CountryNamesEnum.BANGLADESH)) {
        if (data.division_ids.length === 0) {
            return false;
        }
    }
    return true;
}, {
    message: "Division IDs must be provided when country is Bangladesh",
    path: ["division_ids"]
});
exports.searchHistorySchema = zod_1.z.object({
    title: zod_1.z.string().max(80).min(3).trim().transform(el => el.replace('  ', ' ')),
    searchQuery: exports.filterUsersSchema
});
exports.exploreByCountrySchema = exports.paginationSchema.extend({
    countries: zod_1.z.array(zod_1.z.nativeEnum(country_names_enum_1.CountryNamesEnum))
        .min(1, "At least one country must be selected")
        .max(5, "Maximum 5 countries can be selected at once"),
});
exports.exploreByDivisionSchema = exports.paginationSchema.extend({
    division_ids: zod_1.z.array(zod_1.z.string())
        .min(1, "At least one division must be selected")
        .max(8, "Maximum 8 divisions can be selected at once")
});
