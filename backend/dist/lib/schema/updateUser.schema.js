"use strict";
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserEducationSchema = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
const user_types_1 = require("../types/user.types");
const userProfile_types_1 = require("../types/userProfile.types");
const userEducation_types_1 = require("../types/userEducation.types");
const countryCodes_1 = require("../data/countryCodes");
const auth_schema_1 = require("./auth.schema");
const weightPreferenceSchema = zod_1.z.object({
    minWeight: zod_1.z.number().min(30).max(200).optional(),
    maxWeight: zod_1.z.number().min(30).max(200).optional()
})
    .optional()
    .refine(data => {
    if ((data === null || data === void 0 ? void 0 : data.minWeight) && (data === null || data === void 0 ? void 0 : data.maxWeight)) {
        return data.minWeight <= data.maxWeight;
    }
    return true;
}, {
    message: "Minimum weight must be less than or equal to maximum weight"
});
const heightPreferenceSchema = zod_1.z.object({
    minHeight: zod_1.z.number().min(3).max(9).optional(),
    maxHeight: zod_1.z.number().min(3).max(9).optional()
})
    .optional()
    .refine((data) => {
    if ((data === null || data === void 0 ? void 0 : data.minHeight) && (data === null || data === void 0 ? void 0 : data.maxHeight)) {
        return data.minHeight <= data.maxHeight;
    }
    return true;
}, {
    message: "Minimum height must be less than or equal to maximum height"
});
const agePreferenceSchema = zod_1.z.object({
    minAge: zod_1.z.number().min(18).max(70).optional(),
    maxAge: zod_1.z.number().min(18).max(70).optional()
})
    .optional()
    .refine(data => {
    if ((data === null || data === void 0 ? void 0 : data.minAge) && (data === null || data === void 0 ? void 0 : data.maxAge)) {
        return data.minAge <= data.maxAge;
    }
    return true;
}, {
    message: "Minimum age must be less than or equal to maximum age"
});
const educationPreferenceSchema = zod_1.z.object({
    level: zod_1.z.nativeEnum(userEducation_types_1.EducationLevel)
});
// const AddressSchema = z.object({
//     division: z.optional(
//         z.object({
//             id: z.number({
//                 required_error: "Division ID is required",
//                 invalid_type_error: "Division ID must be a number"
//             })
//             .gte(1, "Division ID must be between 1 and 8")
//             .lte(8, "Division ID must be between 1 and 8")
//             .transform(data => data.toString()),
//             name: z.string().optional(),
//             bd_name: z.string().optional(),
//         })),
//     district: z.optional(
//         z.object({
//             id: z.number({
//                 required_error: "District ID is required",
//                 invalid_type_error: "District ID must be a number"
//             })
//             .gte(1, "District ID must be between 1 and 64")
//             .lte(64, "District ID must be between 1 and 64")
//             .transform(data => data.toString()),
//             division_id: z.string().optional(),
//             name: z.string().optional(),
//             bn_name: z.string().optional(),
//         })),
//     upazila: z.optional(
//         z.object({
//             id: z.number({
//                 required_error: "Upazila ID is required",
//                 invalid_type_error: "Upazila ID must be a number"
//             })
//             .gte(1, "Upazila ID must be between 1 and 494")
//             .lte(494, "Upazila ID must be between 1 and 494")
//             .transform(data => data.toString()),
//             district_id: z.string().optional(),
//             name: z.string().optional(),
//             bn_name: z.string().optional(),
//         })
//     ),
//     union: z.optional(
//         z.object({
//             id: z.number({
//                 required_error: "Union ID is required",
//                 invalid_type_error: "Union ID must be a number"
//             })
//             .gte(1, "Union ID must be between 1 and 4540")
//             .lte(4540, "Union ID must be between 1 and 4540")
//             .transform(data => data.toString()),
//             upazilla_id: z.string().optional(),
//             name: z.string().optional(),
//             bn_name: z.string().optional(),
//         })
//     )
// })
//     .refine(
//         (data) => !!data.division?.id && !!data.district?.id && !!data.upazila?.id && !!data.union?.id,
//         {
//             message: "address.division.id, address.district.id, address.upazila.id, address.union.id are required "
//         }
//     )
//     .transform(
//         function (data) {
//             data.division = Divisions.find(element => element.id == data.division?.id);
//             data.district = Districts.find(element => element.id == data.district?.id);
//             data.upazila = Upazilas.find(element => element.id == data.upazila?.id);
//             data.union = Unions.find(element => element.id == data.union?.id);
//             return data;
//         },
//     );
const phoneCountryNames = countryCodes_1.countryCodes.map(c => c.country);
const phoneCountryPhoneCode = countryCodes_1.countryCodes.map(c => c.code);
const phoneInfoSchema = zod_1.z.object({
    number: zod_1.z.string(),
}).optional();
const annualIncomeSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0).max(1000000000).int(),
    currency: zod_1.z.enum(['BDT']).default('BDT')
}).optional();
const aboutMeSchema = zod_1.z.object({
    description: zod_1.z.string().max(1000).optional(),
    physicalStatus: zod_1.z.nativeEnum(userProfile_types_1.PhysicalStatus).optional(),
    religiousBranch: zod_1.z.nativeEnum(userProfile_types_1.ReligiousBranch).optional(),
    badHabits: zod_1.z.array(zod_1.z.nativeEnum(userProfile_types_1.BadHabits)).optional(),
    interestedSports: zod_1.z.array(zod_1.z.nativeEnum(userProfile_types_1.Sports)).optional(),
    interestedHobbies: zod_1.z.array(zod_1.z.nativeEnum(userProfile_types_1.Hobbies)).optional(),
    interestedFoodTypes: zod_1.z.array(zod_1.z.nativeEnum(userProfile_types_1.FoodTypes)).optional(),
    interestedMusicTypes: zod_1.z.array(zod_1.z.nativeEnum(userProfile_types_1.MusicTypes)).optional()
}).optional();
const familyInfoSchema = zod_1.z.object({
    aboutFamily: zod_1.z.string().max(1000).optional(),
    familyOrigin: zod_1.z.string().optional(),
    numberOfBrothers: zod_1.z.number().min(0).max(5).optional(),
    numberOfSisters: zod_1.z.number().min(0).optional(),
    numberOfMarriedBrothers: zod_1.z.number().min(0).optional(),
    numberOfMarriedSisters: zod_1.z.number().min(0).optional()
}).optional();
const enhancedSettingsSchema = zod_1.z.object({
    privacy: zod_1.z.object({
        whoCanViewProfile: zod_1.z.nativeEnum(userProfile_types_1.SettingsPermissionType).optional(),
        whoCanContactMe: zod_1.z.nativeEnum(userProfile_types_1.SettingsPermissionType).optional(),
        showShortlistedNotification: zod_1.z.boolean().optional(),
        showProfileViewNotification: zod_1.z.boolean().optional()
    }).optional(),
    notifications: zod_1.z.object({
        dailyRecommendations: zod_1.z.boolean().optional(),
        todaysMatch: zod_1.z.boolean().optional(),
        profileViews: zod_1.z.boolean().optional(),
        shortlists: zod_1.z.boolean().optional(),
        messages: zod_1.z.boolean().optional(),
        connectionRequests: zod_1.z.boolean().optional()
    }).optional()
}).optional();
exports.updateUserSchema = zod_1.z.object({
    // Basic Information
    name: zod_1.z.string().min(1).optional(),
    gender: zod_1.z.nativeEnum(user_types_1.Gender).optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    profileCreatedBy: zod_1.z.nativeEnum(user_types_1.ProfileCreatedBy).optional(),
    // Physical Attributes
    height: zod_1.z.nativeEnum(user_types_1.Height).optional(),
    weight: zod_1.z.number().min(30).max(200).optional(),
    // Education & Career
    occupation: zod_1.z.nativeEnum(user_types_1.Occupation).optional(),
    annualIncome: annualIncomeSchema,
    // Location & Contact
    // address: AddressSchema,
    phoneInfo: phoneInfoSchema,
    // Personal Background
    languages: zod_1.z.array(zod_1.z.nativeEnum(user_types_1.Language)).optional(),
    religion: zod_1.z.nativeEnum(user_types_1.Religion).optional(),
    maritalStatus: zod_1.z.nativeEnum(user_types_1.MaritalStatus).optional(),
    // Additional Information
    aboutMe: aboutMeSchema,
    familyInfo: familyInfoSchema,
    // Preferences & Settings
    // preferences: preferencesSchema,
    enhancedSettings: enhancedSettingsSchema,
});
exports.updateUserEducationSchema = zod_1.z.object({
    isEducated: zod_1.z.boolean(),
    education: zod_1.z.array(auth_schema_1.educationSchema).optional().default([]),
})
    .refine(function ({ isEducated, education }) {
    if (isEducated) {
        if (education.length === 0) {
            return false;
        }
    }
    return true;
}, {
    message: 'If User is educated Than education details is required',
    path: ['isEducated', 'education[0].level', 'education[0].certificate', 'education[0].yearOfCompletion']
})
    .refine(function ({ isEducated, education }) {
    if (!isEducated && education.length !== 0) {
        return false;
    }
    return true;
}, {
    message: 'If User is not educated Than education details is not required',
    path: ['isEducated', 'education[0].level', 'education[0].certificate', 'education[0].yearOfCompletion']
});
