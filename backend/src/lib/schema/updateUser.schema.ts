import { z } from 'zod';
import { 
    ProfileCreatedBy, 
    Gender, 
    Height, 
    Religion, 
    Language,
    MaritalStatus,
    Occupation 
} from '../types/user.types';
import { 
    PhysicalStatus, 
    ReligiousBranch, 
    BadHabits, 
    Sports, 
    Hobbies, 
    MusicTypes, 
    FoodTypes,
    SettingsPermissionType 
} from '../types/userProfile.types';
import { EducationLevel } from '../types/userEducation.types';
import { countryCodes } from '../data/countryCodes';
import countryNames from '../data/countryNames';



// Nested schemas
const userImageSchema = z.object({
    url: z.string().url().optional(),
    id: z.string().optional()
});


const educationSchema = z.object({
    level: z.nativeEnum(EducationLevel),
    certificate: z.string(),
    institution: z.string(),
    yearOfCompletion: z.number(),
    grade: z.string().optional(),
    additionalInfo: z.string().optional()
});

const addressSchema = z.object({
    country: z.enum([countryNames[0] , ...countryNames.filter((el , index) => (index > 0 && el))]),
    state: z.object({
        name: z.string(),
        id: z.string(),
        country_name: z.string()
    }).optional(),
    division: z.object({
        id: z.string(),
        name: z.string(),
        bd_name: z.string()
    }).optional(),
    district: z.object({
        id: z.string(),
        division_id: z.string(),
        name: z.string(),
        bn_name: z.string(),
        lat: z.number().optional(),
        long: z.number().optional()
    }).optional(),
    upazila: z.object({
        id: z.string(),
        district_id: z.string(),
        name: z.string(),
        bn_name: z.string().optional()
    }).optional(),
    union: z.object({
        id: z.string(),
        upazilla_id: z.string(),
        name: z.string(),
        bn_name: z.string()
    }).optional()
}).optional();


const phoneCountryNames =countryCodes.map(c => c.country) ;
const phoneCountryPhoneCode =countryCodes.map(c => c.code);
const phoneInfoSchema = z.object({
    number: z.string(),
    country: z.object({
        name: z.enum( [phoneCountryNames[0] , ...phoneCountryNames.filter((el , index) => (index > 0 && el))]),
        phone_code: z.enum([phoneCountryPhoneCode[0] , ...phoneCountryPhoneCode.filter((el , index) => (index > 0 && el))])
    })
}).optional();

const annualIncomeSchema = z.object({
    amount: z.number().min(0).max(1000000000).int(),
    currency: z.string().length(3).toUpperCase()
}).optional();

const aboutMeSchema = z.object({
    description: z.string().max(1000).optional(),
    physicalStatus: z.nativeEnum(PhysicalStatus).optional(),
    religiousBranch: z.nativeEnum(ReligiousBranch).optional(),
    badHabits: z.array(z.nativeEnum(BadHabits)).optional(),
    interestedSports: z.array(z.nativeEnum(Sports)).optional(),
    interestedHobbies: z.array(z.nativeEnum(Hobbies)).optional(),
    interestedFoodTypes: z.array(z.nativeEnum(FoodTypes)).optional(),
    interestedMusicTypes: z.array(z.nativeEnum(MusicTypes)).optional()
}).optional();

const familyInfoSchema = z.object({
    aboutFamily: z.string().max(1000).optional(),
    familyOrigin: z.string().optional(),
    numberOfBrothers: z.number().min(0).optional(),
    numberOfSisters: z.number().min(0).optional(),
    numberOfMarriedBrothers: z.number().min(0).optional(),
    numberOfMarriedSisters: z.number().min(0).optional()
}).optional();

const enhancedSettingsSchema = z.object({
    privacy: z.object({
        whoCanViewProfile: z.nativeEnum(SettingsPermissionType).optional(),
        whoCanContactMe: z.nativeEnum(SettingsPermissionType).optional(),
        showShortlistedNotification: z.boolean().optional(),
        showProfileViewNotification: z.boolean().optional()
    }).optional(),
    notifications: z.object({
        dailyRecommendations: z.boolean().optional(),
        todaysMatch: z.boolean().optional(),
        profileViews: z.boolean().optional(),
        shortlists: z.boolean().optional(),
        messages: z.boolean().optional(),
        connectionRequests: z.boolean().optional()
    }).optional()
}).optional();

// Main update schema
export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    profileImage: userImageSchema.optional(),
    userImages: z.array(userImageSchema).optional(),
    coverImage: userImageSchema.optional(),
    gender: z.nativeEnum(Gender).optional(),
    dateOfBirth: z.string().datetime().optional(),
    height: z.nativeEnum(Height).optional(),
    weight: z.number().min(30).max(200).optional(),
    isEducated: z.boolean().optional(),
    education: z.array(educationSchema).optional(),
    address: addressSchema,
    phoneInfo: phoneInfoSchema,
    languages: z.array(z.nativeEnum(Language)).optional(),
    religion: z.nativeEnum(Religion).optional(),
    maritalStatus: z.nativeEnum(MaritalStatus).optional(),
    occupation: z.nativeEnum(Occupation).optional(),
    annualIncome: annualIncomeSchema,
    aboutMe: aboutMeSchema,
    familyInfo: familyInfoSchema,
    enhancedSettings: enhancedSettingsSchema
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;