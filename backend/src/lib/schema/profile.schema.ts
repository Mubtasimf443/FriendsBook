/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { EducationLevel } from "../types/userEducation.types";

// Constants for error messages
const ERROR_MESSAGES = {
    FIELDS: {
        INVALID_TYPE: "Fields must be an array of valid profile field names",
        TOO_MANY: (max: number) => 
            `Too many fields requested. Maximum ${max} fields allowed per request`,
        INVALID_FIELD: (field: string) => 
            `Invalid field requested: '${field}'. Please refer to the API documentation for valid fields`,
        RESTRICTED: (field: string) =>
            `Access to field '${field}' is restricted. Please check your permissions`,
        DEPRECATED: (field: string) =>
            `Field '${field}' is deprecated. Please use the recommended alternative`,
    },
    PRIVACY: {
        ACCESS_DENIED: "Access to requested fields is restricted by privacy settings",
        PREMIUM_REQUIRED: "This field requires a premium subscription",
    }
} as const;

// Field groups for better organization and validation
const Fields= [
        'name',
        'mid',
        'email',
        'phoneInfo',
        'gender',
        'age',
        'dateOfBirth',
        'height',
        'weight',
        'maritalStatus',
        'profileCreatedBy',
        'profileImage',
        'coverImage',
        'userImages',
    
        'address',
  
        'religion',
        'languages',
  
        'isEducated',
        'education',
        'occupation',
        'annualIncome',
  
        'aboutMe',
        'familyInfo',
  
        'aboutMe.interestedSports',
        'aboutMe.interestedHobbies',
        'aboutMe.interestedFoodTypes',
        'aboutMe.interestedMusicTypes',
        'aboutMe.badHabits',

        'createdAt',
        'onlineStatus',
  
        'preferences.age',
        'preferences.height',
        'preferences.weight',
        'preferences.education',
        'preferences.location',
  
        'enhancedSettings.privacy.whoCanViewProfile',
        'enhancedSettings.privacy.whoCanContactMe'
] as const;

// Flatten all fields for validation

const MAX_FIELDS = Fields.length-1;

// Schema with enhanced validation and error messages
export const userDetailsQuerySchema = z.object({
    fields: z.array(
        z.enum(Fields, {
            errorMap: (issue, ctx) => ({
                message: issue.code === 'invalid_enum_value'
                    ? ERROR_MESSAGES.FIELDS.INVALID_FIELD(ctx.data)
                    : ERROR_MESSAGES.FIELDS.INVALID_TYPE
            })
        })
    )
        .max(10, {
            message: ERROR_MESSAGES.FIELDS.TOO_MANY(MAX_FIELDS)
        })
        .optional()
        .default(Fields.slice(0, 10))
        .transform(arr => arr.join(' '))
})

;


